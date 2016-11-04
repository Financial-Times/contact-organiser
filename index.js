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

/** Environment variables **/
var port = process.env.PORT || 3001;
var cmdb = new CMDB({
	api: process.env.CMDBAPI,
	apikey: process.env.APIKEY,
});


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

	// Always pass good to go.	If application is healthy enough to return it, then it can serve traffic.
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
				panicGuide: "Check for alerts related to cmdb.ft.com.	Check connectivity to cmdb.ft.com",
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
	contactsurl = process.env.CMDB_API + "/items/contact";
	params = req.query;
	console.log("params:",params);
	params['outputfields'] = "name,slack,email,phone,supportRota,contactPref,programme";
	params['objectDetail'] = "False";
	params['subjectDetail'] = "False";
	remove_blank_values(params);
	contactsurl = contactsurl + '?' +querystring.stringify(params);
	console.log("url:",contactsurl)
	cmdb._fetchAll(res.locals, contactsurl).then(function (contacts) {
		if (req.query.sortby) { console.log(req.query.sortby) } // check how sort param is provided
		contacts.sort(CompareOnKey(req.query.sortby));
		contacts.forEach(cleanContact);
		res.render('index', {contacts: body});
	}).catch(function (error) {
		res.status(502);
		res.render("error", {message: "Problem connecting to CMDB ("+error+")"});
	});
});

function CompareOnKey(key) {
	return function(a,b) {
		if (!key) {  // default to url sort
			key = 'dataItemID';
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
	cmdb.getItem(res.locals, 'contact', req.params.contactid).then(function (result) {
		cleanContact(result);
		res.render('contact', result);
	}).catch(function (error) {
		res.status(502);
		res.render("error", {message: "Problem connecting to CMDB ("+error+")"});
	});
});


/**
 * Provides a form for adding a new contact
 */
app.get('/new', function (req, res) {
	res.render('contact', {'_new': true});
});


/**
 * Generates a unique identifier for the new contact, then treats it just like a save
 */
app.post('/new', function (req, res) {

	// HACK: truncate the uuid to match CMDB's limit.  Remove substring when limit is removed.
//	res.redirect(307, '/contacts/' + uuid.v4().substring(0, 30));
	contactid = req.params.contactid
	if (!contactid) {
		contactid = req.body.name
	}
	res.redirect(307, '/contacts/' + contactid);
});


/**
 * Send save requests back to the CMDB
 */
app.post('/contacts/:contactid', function (req, res) {
	cmdb.putItem(res.locals, 'contact', req.params.contactid, req.body).then(function (result) {
		cleanContact(result);
		result.saved = {
			locals: JSON.stringify(res.locals),
			contactid: req.params.contactid,

			// TODO: replace with pretty print function
			json: JSON.stringify(req.body).replace(/,/g, ",\n\t").replace(/}/g, "\n}").replace(/{/g, "{\n\t"),
			
			// TODO: get actual url from cmdb.js
			url: 'https://cmdb.ft.com/v2/items/contact/'+req.params.contactid,
		}
		res.render('contact', result);
	}).catch(function (error) {
		res.status(502);
		res.render("error", {message: "Problem connecting to CMDB ("+error+")"});
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

/** 
 * Ties up the contact data coming from CMDB to something expected by the templates
 */
function cleanContact(contact) {
	contact.contactid = contact.dataItemID;
	if (!contact.name) {
		contact.name = contact.contactid
	}
	delete contact.dataItemID;
	delete contact.dataTypeID;

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