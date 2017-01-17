var express = require('express');
var app = express();
var bodyParser = require('body-parser');
const querystring = require('querystring');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
const crypto = require('crypto');
const uuid = require('node-uuid');

var mustacheExpress = require('mustache-express');

// Register '.ms' extension with The Mustache Express
app.engine('ms', mustacheExpress());

app.set('view engine', 'ms');
app.set('views', __dirname + '/views');

// Set the public directory as public for serving assets
app.use(express.static('public'));

var path = require('path');
if (process.env.LOCALCMDBJS) {
    var CMDB = require( path.resolve( __dirname, "./cmdb.js" ) );
} else {
    var CMDB = require( "cmdb.js" );
}

/** Environment variables **/
var port = process.env.PORT || 3001;
var cmdb = new CMDB({
    api: process.env.CMDBAPI,
    apikey: process.env.APIKEY,
});

var systemTool = process.env.SYSTEMREGISTRY || 'https://systemregistry.in.ft.com/manage/';
var endpointTool = process.env.ENDPOINTMANAGER || 'https://endpointmanager.in.ft.com/manage/';
var contactTool = process.env.CONTACTORGANISER || 'https://contactorganiser.in.ft.com/contacts/';

var path = require('path');
var ftwebservice = require('express-ftwebservice');
ftwebservice(app, {
    manifestPath: path.join(__dirname, 'package.json'),
    about: {
        "systemCode": "contact-organiser",
        "name": "Contact Organiser",
        "audience": "FT Technology",
        "serviceTier": "bronze",
    },

    // Always pass good to go.    If application is healthy enough to return it, then it can serve traffic.
    goodToGoTest: function() {
        return new Promise(function(resolve, reject) {
            resolve(true);
        });
    },

    // Check that track can talk to CMDB
    healthCheck: function() {
        return cmdb.getItem(null, 'contact', 'operationalintelligence').then(function (result) {
            return false;
        }).catch(function (error) {
            return error.message;
        }).then(function (output) {
             return [{
                id: 'cmdb-connection',
                name: "Connectivity to CMDB",
                ok: !output,
                severity: 1,
                businessImpact: "Can't view/edit contacts in Contact Organiser UI",
                technicalSummary: "App can't connect make a GET request to CMDB",
                panicGuide: "Check for alerts related to cmdb.ft.com.    Check connectivity to cmdb.ft.com",
                checkOutput: output,
                lastUpdated: new Date().toISOString(),
            }];
        });
    }
});
var authS3O = require('s3o-middleware');
app.use(authS3O);
app.use(function(req, res, next) {
  res.setHeader('Cache-Control', 'no-cache');
  next();
});

/**
 * Gets a list of Contacts from the CMDB and renders them nicely
 */
app.get('/', function (req, res) {
    console.timeEnd('CMDB api call for contact count')
    cmdb.getItemCount(res.locals, 'contact', contactFilter(req)).then(function (counters) {
        console.timeEnd('CMDB api call for contacts count')
        console.log(counters)
        console.time('CMDB api call for all contacts')
        sortby = req.query.sortby
        index = req.query.index
        page = req.query.page
        // prepare pagination links
        pagebuttons = getPageButtons(page, counters['pages'])
        // read one page of contacts
        cmdb.getItemPageFields(res.locals, 'contact', page, contactFields(), contactFilter(req), contactRelatedFields()).then(function (contacts) {
            contacts.forEach(function (contact) {
                indexController(contact);
            });
            contacts.sort(CompareOnKey(sortby));
            console.timeEnd('CMDB api call for all contacts')
            if (index == 'tiles') {
                res.render('index', Object.assign({'pages':pagebuttons}, {contacts: contacts}, req.query, {'indextiles':true}));
            } else {
                res.render('index', Object.assign({'pages':pagebuttons}, {contacts: contacts}, req.query, {'indextable':true}));
            }
        }).catch(function (error) {
            res.status(502);
            res.render("error", {message: "Problem obtaining list of filtered contacts from CMDB ("+error+")"});
        });
    }).catch(function (error) {
        res.status(502);
        res.render("error", {message: "Problem obtaiing count of filtered contacts from CMDB ("+error+")"});
    });
});

function getPageButtons(page, maxpages) {
    // are there any pages?
    if (!maxpages) {
        return
    }
    // which page are we on
    if (!page) {
        page = 1
    }
    // prepare pagination links
    var pagination = [];
    var startpageno = page - 3
    if (startpageno < 1) {
        startpageno = 1;
    }
    var endpageno = startpageno + 6
    if (endpageno > maxpages) {
        endpageno = maxpages;
    }
    // prefix for page 1
    if (startpageno != 1 ) {
        pagination.push({'number':1, 'selected':false })
        pagination.push({'faux':true})
    }
    // main set of page links centerde around the current page
    var pageno = startpageno;
    while (pageno <= endpageno && pagination.length < 9) {
        if (pageno == page) {
            pagination.push({'number':pageno, 'selected':true })
        } else {
            pagination.push({'number':pageno, 'selected':false })
        }
        pageno = pageno + 1
    }
    // suffix for last page
    if (endpageno < maxpages ) {
        pagination.push({'faux':true})
        pagination.push({'number':maxpages, 'selected':false })
    }

    return pagination
}

function contactFilter(req) {
    var cmdbparams = {}
    Object.assign(cmdbparams, req.query);
    console.log("cmdbparams:",cmdbparams);
    delete cmdbparams.sortby // to avoid it being added to cmdb params
    delete cmdbparams.index // to avoid it being added to cmdb params
    remove_blank_values(cmdbparams);
    console.log("filter:",cmdbparams)
    return cmdbparams
}
function contactFields() {
    return ["name","slack","email","phone","supportRota","contactPref","programme"];
}
function contactRelatedFields() {
    return 'False' // no related items are to be included
}

function CompareOnKey(key) {
    return function(a,b) {
        if (!key) {  // default to name sort
            key = 'name';
        }
        avalue = a[key];
        bvalue = b[key];
        if (!avalue) return -1;
        if (!bvalue) return 1;
        return avalue.toLowerCase() > bvalue.toLowerCase() ? 1 : -1;
    };
}

/**
 * Gets info about a given Contact from the CMDB and provides a form for editing it
 */
app.get('/contacts/:contactid', function (req, res) {
    cmdb.getAllItemFields(res.locals, 'contact', programmeFields(), programmeFilter(), programmeRelatedFields()).then(function (programmes) {
        programmeList = programmeNames(programmes);
        cmdb.getItem(res.locals, 'contact', req.params.contactid).then(function (result) {
            cleanContact(result, programmeList);
            res.render('contact', result);
        }).catch(function (error) {
            res.status(502);
            res.render("error", {message: "Problem obtaining detail for "+req.params.contactid+" from CMDB ("+error+")"});
        })
    }).catch(function (error) {
        res.status(502);
        res.render("error", {message: "Unable to read list of programmes from the CMDB ("+error+")"});
    });
});


/**
 * Provides a form for adding a new contact
 */
app.get('/new', function (req, res) {
    cmdb.getAllItemFields(res.locals, 'contact', programmeFields(), programmeFilter(), programmeRelatedFields()).then(function (programmes) {
        programmeList = programmeNames(programmes);
        var defaultdata = {
            name: "",
            ctypeList: getCtypeList("Team"),
            slack: "",
            email: "",
            phone: "",
            supportRota: "",
            contactPref: "",
            programmeList: getProgrammeList(programmeList, "Undefined"),
            localpath: '/new',
        };
        res.render('contact', defaultdata);
    }).catch(function (error) {
        res.status(502);
        res.render("error", {message: "Unable to read list of programmes (new get) from the CMDB ("+error+")"});
    });
});


/**
 * Generates a unique identifier for the new contact, then treats it just like a save
 */
app.post('/new', function (req, res) {
    cmdb.getAllItemFields(res.locals, 'contact', programmeFields(), programmeFilter(), programmeRelatedFields()).then(function (programmes) {
        programmeList = programmeNames(programmes);
        contactid = req.body.id
        if (!contactid.trim()) {
            contactid = req.body.name.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
        };
        cmdb.getItem(res.locals, 'contact', contactid).then(function (contact) {
            req.body.iderror = "ID already in use, please re-enter"
            res.render('contact', reformatRequest(req, programmeList));
        }).catch(function (error) {
            console.log("dup-read:",error)
            res.redirect(307, '/contacts/' +encodeURIComponent(contactid));
        });
    }).catch(function (error) {
        res.status(502);
        res.render("error", {message: "Unable to read list of programmes (new post) from the CMDB ("+error+")"});
    });
});

function formattedRequest(req, programmeList) {
    var request = req.body
    request.ctypeList = getCtypeList(request.contactType);
    request.programmeList = getProgrammeList(programmeList, request.programme);

    return request
}

/**
 * Send save requests back to the CMDB
 */
app.post('/contacts/:contactid', function (req, res) {
    cmdb.getAllItemFields(res.locals, 'contact', programmeFields(), programmeFilter(), programmeRelatedFields()).then(function (programmes) {
        programmeList = programmeNames(programmes);
        var contact = {
            name: req.body.name,
            contactType: req.body.contactType,
            slack: req.body.slack,
            email: req.body.email,
            phone: req.body.phone,
            supportRota: req.body.supportRota,
            contactPref: req.body.contactPref,
            programme: req.body.programme,
        }

        cmdb.putItem(res.locals, 'contact', req.params.contactid, contact).then(function (result) {
            result.saved = {
                locals: JSON.stringify(res.locals),
                contactid: req.params.contactid,

                json: JSON.stringify(contact).replace(/,/g, ",\n\t").replace(/\}/g, "\n}").replace(/\{/g, "{\n\t"), // TODO:replace with pretty print function
                
                url: 'https://cmdb.ft.com/v2/items/contact/'+encodeURIComponent(encodeURIComponent(req.params.contactid)), // TODO:get actual url from cmdb.js
            }
            cleanContact(result, programmeList);
            res.render('contact', result);
        }).catch(function (error) {
            res.status(502);
            res.render("error", {message: "Problem saving details for "+req.params.contactid+" to CMDB ("+error+")"});
        })
    }).catch(function (error) {
        res.status(502);
        res.render("error", {message: "Unable to read list of programmes from the CMDB ("+error+")"});
    });
});

/**
 * Send delete requests back to the CMDB
 */
app.post('/contacts/:contactid/delete', function (req, res) {

    cmdb.deleteItem(res.locals, 'contact', req.params.contactid).then(function (result) {
        
        // TODO: show messaging to indicate the delete was successful
        res.redirect(303, '/');
    }).catch(function (error) {
        if (error.toString().includes(" 409 ")) {
            // get contact details ready to display error in context
            cmdb.getAllItemFields(res.locals, 'contact', programmeFields(), programmeFilter(), programmeRelatedFields()).then(function (programmes) {
                programmeList = programmeNames(programmes);
                cmdb.getItem(res.locals, 'contact', req.params.contactid).then(function (contact) {
                    result = cleanContact(contact, programmeList);
                    // display a dependencies exist message
                    result.dependerror = 'Unable to delete this contact, dependencies exist - see below. Please reassign the related items before retrying'
                    res.render('contact', result);
                }).catch(function (error) {
                    res.status(502);
                    res.render("error", {message: "Problem connecting to CMDB whilst displaying dependency error ("+error+")"});
                })
            }).catch(function (error) {
                res.status(502);
                res.render("error", {message: "Unable to read list of programmes from the CMDB whilst dispalying dependency error("+error+")"});
            })
        } else {
            res.status(502);
            res.render("error", {message: "Problem deleting "+req.params.contactid+" from CMDB ("+error+")"});
        }
    });
});

app.use(function(req, res, next) {
    res.status(404).render('error', {message:"Page not found."});
});

app.use(function(err, req, res, next) {
    console.error(err.stack);
    res.status(500).render('error', {message:"Sorry, an unknown error occurred.  Please contact the Operational Intelligence Team."});
});

app.listen(port, function () {
    console.log('App listening on port '+port);
});


function programmeNames(programmes) {
    var programmeList = [
            {name: "Undefined", value: "Undefined"},
    ];
    programmes.forEach(function(contact) {
        programmeList.push({name:contact.name, value:contact.name})
    });
    return programmeList
}

function programmeFields() {
    return ["name"];
}
function programmeFilter() {
    return {"contactType":"Programme"} // just the programme contacts
}
function programmeRelatedFields() {
    return 'False' // no related items are to be included
}

/** 
 * Ties up the contact data coming from CMDB to something expected by the index
 */
function indexController(contact) {
    contact.id = contact.dataItemID;
    if (!contact.hasOwnProperty('name')) {
        contact.name = contact.id
    }

    // now add other fields to enable user interface
    contact.localpath = "/contacts/"+encodeURIComponent(contact.id);

    if (!contact.avatar) {

        // Use gravatar to get avatar from email
        var md5hash = "";
        if (contact.email) {
            md5hash = crypto.createHash('md5').update(contact.email).digest('hex');
        }
        contact.avatar = "https://www.gravatar.com/avatar/"+md5hash+"?s=80&d=blank";
    }

    return contact;
}

/** 
 * Ties up the contact data coming from CMDB to something expected by the templates
 */
function cleanContact(contact, programmeList) {
    contact.id = contact.dataItemID;
    if (!contact.hasOwnProperty('name')) {
        contact.name = contact.id
    }
    delete contact.dataItemID;
    delete contact.dataTypeID;

    // look for relationships  contact.xxx.[..,..,..] - but they should only be the reverse relationships
    // not sure we have a way to find those at the moment since cmdb return has already translated them
    relationships = []
    for (var reltype in contact) {
        for (var itemtype in contact[reltype]) {
            if (typeof contact[reltype][itemtype] === 'object') {
                for (relationship in contact[reltype][itemtype]) {
                    relitemlink = ""
                    relitem = itemtype + ": " + contact[reltype][itemtype][relationship].dataItemID
                    if (itemtype == 'system') {
                        relitemlink = systemTool + contact[reltype][itemtype][relationship].dataItemID
                    }
                    if (itemtype == 'endpoint') {
                        relitemlink = endpointTool + contact[reltype][itemtype][relationship].dataItemID
                    }
                     if (itemtype == 'contact') {
                        relitemlink = contactTool + contact[reltype][itemtype][relationship].dataItemID
                    }
                    relationships.push({'reltype': reltype, 'relitem': relitem, 'relitemlink': relitemlink})
                }
            }
        }
    }
    if (relationships) {
        contact.relationships = relationships
    }

    // now add other fields to enable user interface
    contact.localpath = "/contacts/"+encodeURIComponent(contact.id);
    contact.ctypeList = getCtypeList(contact.contactType);
    contact.programmeList = getProgrammeList(programmeList, contact.programme);

    if (!contact.avatar) {

        // Use gravatar to get avatar from email
        var md5hash = "";
        if (contact.email) {
            md5hash = crypto.createHash('md5').update(contact.email).digest('hex');
        }
        contact.avatar = "https://www.gravatar.com/avatar/"+md5hash+"?s=80&d=blank";
    }

    return contact;
}

function getCtypeList(selected) {
    var ctypeList = [
        {name: "Person", value: "Person"},
        {name: "Team", value: "Team"},
        {name: "Company", value: "Company"},
        {name: "Programme", value: "Programme"},
        {name: "Undefined", value: "Undefined"},
    ];
    var found = false;
    ctypeList.forEach(function (ctype) {
        if (ctype.value == selected) {
            ctype.selected = true;
            found = true;
        }
    });
    if (!found) {
        ctypeList[ctypeList.length-1].selected = true;
    }
    return ctypeList;
}

function getProgrammeList(programmeList, selected) {
    var found = false;
    programmeList.forEach(function (programme) {
        if (programme.value == selected) {
            programme.selected = true;
            found = true;
        }
    });
    if (!found) {
        programmeList[0].selected = true;
    }
    return programmeList;
}

function remove_blank_values(obj, recurse) {
    for (var i in obj) {
        if (obj[i] === null || obj[i] === '') {
            delete obj[i];
        } else {
            if (recurse && typeof obj[i] === 'object') {
                remove_blank_values(obj[i], recurse);
                if (Object.keys(obj[i]).length == 0) {
                    {
                        delete obj[i];
                    }
                }
            }
        }
    }
}