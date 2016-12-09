var express = require('express');
var app = express();
var bodyParser = require('body-parser');
const querystring = require('querystring');
var CMDB = require("cmdb.js");
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

/** Environment variables **/
var port = process.env.PORT || 3001;
var cmdb = new CMDB({
    api: process.env.CMDBAPI,
    apikey: process.env.APIKEY,
});

var systemTool = process.env.SYSTEMREGISTRY || 'https://systemregistry.in.ft.com/manage/';
var endpointTool = process.env.ENDPOINTMANAGER || 'https://endpointmanager.in.ft.com/manage/';

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

/**
 * Gets a list of Contacts from the CMDB and renders them nicely
 */
app.get('/', function (req, res) {
    res.setHeader('Cache-Control', 'no-cache');
    cmdb._fetchAll(res.locals, getProgrammesURL()).then(function (programmes) {
        programmeList = programmeNames(programmes);
        cmdb._fetchAll(res.locals, contactsURL(req)).then(function (contacts) {
            contacts.forEach(function (contact) {
                cleanContact(contact, programmeList);
            });
            contacts.sort(CompareOnKey(sortby));
            res.render('index', {contacts: contacts});
        }).catch(function (error) {
            res.status(502);
            res.render("error", {message: "Problem connecting to CMDB ("+error+")"});
        })
    }).catch(function (error) {
        res.status(502);
        res.render("error", {message: "Unable to read list of programmes from the CMDB ("+error+")"});
    });
});

function contactsURL(req) {
    contactsurl = process.env.CMDBAPI + "/items/contact";
    params = req.query;
    sortby = params.sortby
    delete params.sortby // to avoid it being added to cmdb params
    params['outputfields'] = "name,slack,email,phone,supportRota,contactPref,programme";
    params['objectDetail'] = "False";
    params['subjectDetail'] = "False";
    remove_blank_values(params);
    contactsurl = contactsurl + '?' +querystring.stringify(params);
    return contactsurl
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
    res.setHeader('Cache-Control', 'no-cache');
    cmdb._fetchAll(res.locals, getProgrammesURL()).then(function (programmes) {
        programmeList = programmeNames(programmes);
        cmdb.getItem(res.locals, 'contact', req.params.contactid).then(function (result) {
            cleanContact(result, programmeList);
            res.render('contact', result);
        }).catch(function (error) {
            res.status(502);
            res.render("error", {message: "Problem connecting to CMDB ("+error+")"});
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
    res.setHeader('Cache-Control', 'no-cache');
    cmdb._fetchAll(res.locals, getProgrammesURL()).then(function (programmes) {
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
        res.render("error", {message: "Unable to read list of programmes from the CMDB ("+error+")"});
    });
});


/**
 * Generates a unique identifier for the new contact, then treats it just like a save
 */
app.post('/new', function (req, res) {
    res.setHeader('Cache-Control', 'no-cache');
    contactid = req.body.id
    if (!contactid.trim()) {
        contactid = req.body.name.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    };
    cmdb.getItem(res.locals, 'contact', contactid).then(function (contact) {
        req.body.iderror = "ID already in use, please re-enter"
        res.render('contact', req.body);
    }).catch(function (error) {
        res.redirect(307, '/contacts/' +encodeURIComponent(encodeURIComponent(contactid)));
    });
});


/**
 * Send save requests back to the CMDB
 */
app.post('/contacts/:contactid', function (req, res) {
    res.setHeader('Cache-Control', 'no-cache');
    cmdb._fetchAll(res.locals, getProgrammesURL()).then(function (programmes) {
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

                // TODO: replace with pretty print function
                json: JSON.stringify(contact).replace(/,/g, ",\n\t").replace(/}/g, "\n}").replace(/{/g, "{\n\t"),
                
                // TODO: get actual url from cmdb.js
                url: 'https://cmdb.ft.com/v2/items/contact/'+encodeURIComponent(encodeURIComponent(req.params.contactid)),
            }
            cleanContact(result, programmeList);
            res.render('contact', result);
        }).catch(function (error) {
            res.status(502);
            res.render("error", {message: "Problem connecting to CMDB ("+error+")"});
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
    res.setHeader('Cache-Control', 'no-cache');

    cmdb.deleteItem(res.locals, 'contact', req.params.contactid).then(function (result) {
        
        // TODO: show messaging to indicate the delete was successful
        res.redirect(303, '/');
    }).catch(function (error) {
        res.status(502);
        res.render("error", {message: "Problem connecting to CMDB ("+error+")"});
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


function getProgrammesURL() {
    var programmesurl = process.env.CMDBAPI + "/items/contact";
    var params = [];
    params['outputfields'] = "name";
    params['contactType'] = "Programme";
    params['objectDetail'] = "False";
    params['subjectDetail'] = "False";
    programmesurl = programmesurl + '?' +querystring.stringify(params);
    return programmesurl
}

function programmeNames(programmes) {
    var programmeList = [
            {name: "Undefined", value: "Undefined"},
    ];
    programmes.forEach(function(contact) {
        programmeList.push({name:contact.name, value:contact.name})
    });
    return programmeList
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

    // look for relationships  contact.xxx.[..,..,..]
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
                    relationships.push({'reltype': reltype, 'relitem': relitem, 'relitemlink': relitemlink})
                }
            }
        }
    }
    if (relationships) {
        contact.relationships = relationships
    }

    // now add other fields to enable user interface
    contact.localpath = "/contacts/"+encodeURIComponent(encodeURIComponent(contact.id));
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