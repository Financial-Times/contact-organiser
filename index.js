var express = require('express');
var app = express();
var request = require("request");
var bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
const crypto = require('crypto');
const uuid = require('node-uuid');

var authS3O = require('s3o-middleware');
app.use(authS3O);

var mustacheExpress = require('mustache-express');

// Register '.ms' extension with The Mustache Express
app.engine('ms', mustacheExpress());

app.set('view engine', 'ms');
app.set('views', __dirname + '/views');

/** Environment variables **/
var port = process.env.PORT || 3001;
var cmdbEndpoint = process.env.CMDB_ENDPOINT || 'https://cmdb.ft.com/v2/items/contact';
var apikey = process.env.APIKEY || 'changeme';

/**
 * Gets a list of Contacts from the CMDB and renders them nicely
 */
app.get('/', function (req, res) {
	getAll(cmdbEndpoint, res.locals.s3o_username, function success(body) {
		body.forEach(cleanContact);
		res.render('index', {contacts: body});
	}, function fail() {
		res.status(502);
		res.render("error", {message: "Problem connecting to CMDB"});
	});
});

/**
 * Gets info about a given Contact from the CMDB and provides a form for editing it
 */
app.get('/contacts/:contactid', function (req, res) {

	request({
		url: cmdbEndpoint + '/'+req.params.contactid,
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
 * Generates a unique identifier for the new contact, then treats it just like a save
 */
app.post('/new', function (req, res) {

	// HACK: truncate the uuid to match CMDB's limit.  Remove substring when limit is removed.
	res.redirect(307, '/contacts/' + uuid.v4().substring(0, 30));
});


/**
 * Send save requests back to the CMDB
 */
app.post('/contacts/:contactid', function (req, res) {
	request({
		url: cmdbEndpoint + '/'+req.params.contactid,
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
		url: cmdbEndpoint + '/'+req.params.contactid,
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

/**
 * Gets a request from CMDB, recursively following all the next links
 */
function getAll(url, username, success, fail) {

	request({
		url: url,
		json: true,
		headers: {
			'APIKEY': apikey,
			'FT-Forwarded-Auth': "ad:" + username,
		}
	}, function (error, response, body) {

		// CMDB returns entirely different output when there are zero contacts
		// Re-write the response to match normal output.
		if (response.statusCode == 404) {
			response.statusCode = 200;
			body = [];
		}
		if (error || response.statusCode != 200) {
			fail();
			return;
		}

		// Check whether there is a 'next' link on the response
		var links = parse_link_header(response.headers.link);
		if (links.next) {

			// If there is a next link, request it and concatenate it to the current response
			// As this is recursive, it'll continue to request next links until no further next link is provided by the API
			getAll(links.next, username, function (remainingBody) {
				success(body.concat(remainingBody));
			}, fail);
		} else {
			success(body);
		}
	});
}

/**
 * Taken from https://gist.github.com/niallo/3109252
 */
function parse_link_header(header) {
    if (header.length === 0) {
        throw new Error("input must not be of zero length");
    }

    // Split parts by comma
    var parts = header.split(',');
    var links = {};
    // Parse each part into a named link
    for(var i=0; i<parts.length; i++) {
        var section = parts[i].split(';');
        if (section.length !== 2) {
            throw new Error("section could not be split on ';'");
        }
        var url = section[0].replace(/<(.*)>/, '$1').trim();
        var name = section[1].replace(/rel="(.*)"/, '$1').trim();
        links[name] = url;
    }
    return links;
}
