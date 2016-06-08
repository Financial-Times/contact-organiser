var express = require('express');
var app = express();
var request = require("request");
var bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
const crypto = require('crypto');

var authS3O = require('s3o-middleware');
app.use(authS3O);

var mustacheExpress = require('mustache-express');

// Register '.ms' extension with The Mustache Express
app.engine('ms', mustacheExpress());

app.set('view engine', 'ms');
app.set('views', __dirname + '/views');

/** Environment variables **/
var port = process.env.PORT || 3001;
var cmdbapi = process.env.CMDBAPI || 'https://cmdb.ft.com/v2';
var apikey = process.env.APIKEY || 'changeme';

/**
 * Gets a list of Contacts from the CMDB and renders them nicely
 */
app.get('/', function (req, res) {

	request({
		url: cmdbapi + '/items/contact',
		json: true,
		headers: {
			'APIKEY': apikey,
			'FT-Forwarded-Auth': "ad:"+ res.locals.s3o_username,
		}
	}, function (error, response, body) {

		// CMDB returns entirely different output when there are zero contacts
		// Re-write the response to match normal output.
		if (response.statusCode == 404) {
			response.statusCode = 200;
			body = [];
		}
		if (error || response.statusCode != 200) {
			res.status(502);
			res.render("error", {message: "Problem connecting to CMDB"});
			return;
		}
		body.forEach(cleanContact);
		res.render('index', {contacts: body});
	});
});

/**
 * Gets info about a given Contact from the CMDB and provides a form for editing it
 */
app.get('/contacts/:contactid', function (req, res) {

	request({
		url: cmdbapi + '/items/contact/'+req.params.contactid,
		json: true,
		headers: {
			'APIKEY': apikey,
			'FT-Forwarded-Auth': "ad:"+ res.locals.s3o_username,
		}
	}, function (error, response, body) {

		if (error || response.statusCode != 200) {
			res.status(502);
			res.render("error", {message: "Problem connecting to CMDB"});
			return;
		}
		cleanContact(body);
		res.render('contact', body);
	});
});


/**
 * Provides a form for adding a new contact
 */
app.get('/new', function (req, res) {
	res.render('contact', {'_new': true});
});


/**
 * Processes the new contact form and redirects to appropriate url.
 */
app.post('/new', function (req, res) {

	// TODO: check whether the ID already exists and show an error.
	res.redirect(307, '/contacts/' + req.body.contactid);
});


/**
 * Send save requests back to the CMDB
 */
app.post('/contacts/:contactid', function (req, res) {

	// contactid is included for new contacts.  Remove it from body as it's in the URL.
	delete req.body.contactid;
	request({
		url: cmdbapi + '/items/contact/'+req.params.contactid,
		method: 'PUT',
		json: true,
		headers: {
			'APIKEY': apikey,
			'FT-Forwarded-Auth': "ad:"+ res.locals.s3o_username,
		},
		body: req.body,
	}, function (error, response, body) {
		if (error || response.statusCode != 200) {
			res.status(502);
			res.render("error", {message: "Problem connecting to CMDB"});
			return;
		}
		cleanContact(body);
		body._saved = true;
		res.render('contact', body);
	});
});

/**
 * Send delete requests back to the CMDB
 */
app.post('/contacts/:contactid/delete', function (req, res) {

	request({
		url: cmdbapi + '/items/contact/'+req.params.contactid,
		method: 'DELETE',
		json: true,
		headers: {
			'APIKEY': apikey,
			'FT-Forwarded-Auth': "ad:"+ res.locals.s3o_username,
		},
	}, function (error, response, body) {
		if (error || response.statusCode != 200) {
			res.status(502);
			res.render("error", {message: "Problem connecting to CMDB"});
			return;
		}

		// TODO: show messaging to indicate the delete was successful
		res.redirect(303, '/');
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
