require('es6-promise').polyfill();
require('isomorphic-fetch');
const querystring = require('querystring');

/**
 * Object representing the CMDB API
 * @param {Object} [config] - An object of key/value pairs holding configuration
 *   - {string} [api=https://cmdb.ft.com/v2/] - The CMDB API endpoint to send requests to (defaults to production, change for other environments)
 *   - {string} [apikey=changeme] - The apikey to send to CMDB API 
 */
function cmdb(config) {
	if (typeof config != 'object') config = {};
	this.api = config.api || 'https://cmdb.ft.com/v2/';
	if (this.api.slice(-1) != '/') this.api += '/';
	this.apikey = config.apikey || 'changeme';
}

/**
 * Helper function for making requests to CMDB API
 * @param {Object} [locals] - The res.locals value from a request in express
 * @param {string} path - The path of the request to make
 * @param {string} [method=GET] - The method of the request to make
 * @param {Object} [body] - An object to send to the API
 * @returns {Promise<Object>} The data received from CMDB (JSON-decoded)
 */
cmdb.prototype._fetch = function _fetch(locals, path, query, method, body, timeout = 12000) {
	var params = {
		headers: {
			apikey: this.apikey,
		},
		timeout: timeout,
	}
	if (method) params.method = method;
	if (body) {
		params.body = JSON.stringify(body);
		params.headers['Content-Type'] = "application/json";
	}
	if (locals && locals.s3o_username) {
		params.headers['FT-Forwarded-Auth'] = "ad:"+ locals.s3o_username;
	}

	// HACK: CMDB decodes paths before they hit its router, so do an extra encode on the whole path here
	path = encodeURIComponent(path);
	if (query) {
		path = path + "?" + query
	}
	
	return fetch(this.api + path, params).then(function(response) {
		if (response.status >= 400) {
            throw new Error("Received "+response.status+" response from CMDB");
        }
        return response.json();
	});
}

/**
 * Helper function for requested count of pages and itemsfrom CMDB API
 * @param {Object} [locals] - The res.locals value from a request in express
 * @param {string} url - The url of the request to make
 * @returns {Promise<Object>} The count of pages and items from CMDB (JSON-decoded)
 */
cmdb.prototype._fetchCount = function fetchCount(locals, url, timeout = 12000) {
	var self = this;
	var params = {
		headers: {
			apikey: self.apikey,
		},
		timeout: timeout,
	}
	if (locals && locals.s3o_username) {
		params.headers['FT-Forwarded-Auth'] = "ad:"+ locals.s3o_username;
	}
	return fetch(url, params).then(function(response) {
		
		// CMDB returns entirely different output when there are zero contacts
		// Just return an empty array in this case.
		if (response.status == 404) {
			return {};
		}
		if (response.status != 200) {
            throw new Error("Received "+response.status+" response from CMDB");
        }
        // default page and items count based on a single page containing array of items
        var pages = 1;
        var items = response.json().length

        // aim to get "Count: Pages: nnn, Items: nnn"
		var countstext = response.headers.get('Count');
		if (countstext) {
			// we now have "Pages: nnn, Items: nnn"
			var counts = countstext.split(',');
			if (counts.length == 2) {
				// we now have "Pages: nnn" and "Items: nnn"
				pages = Number(counts[0].split(':')[1].trim());
				items = Number(counts[1].split(':')[1].trim());
			}
		}
   		return {"pages":pages,"items":items};
	});
}

/**
 * Recursive helper function for requested paginated lists from CMDB API
 * @param {Object} [locals] - The res.locals value from a request in express
 * @param {string} url - The url of the request to make
 * @returns {Promise<Object>} The data received from CMDB (JSON-decoded)
 */
cmdb.prototype._fetchAll = function fetchAll(locals, url, timeout = 12000) {
	var self = this;
	var params = {
		headers: {
			apikey: self.apikey,
		},
		timeout: timeout,
	}
	if (locals && locals.s3o_username) {
		params.headers['FT-Forwarded-Auth'] = "ad:"+ locals.s3o_username;
	}
	return fetch(url, params).then(function(response) {
		
		// CMDB returns entirely different output when there are zero contacts
		// Just return an empty array in this case.
		if (response.status == 404) {
			return [];
		}
		if (response.status != 200) {
            throw new Error("Received "+response.status+" response from CMDB");
        }
		var links = parse_link_header(response.headers.get('link'));
		if (links.next) {
			return response.json().then(function (data) {
				return self._fetchAll(locals, links.next).then(function (nextdata) {
					return data.concat(nextdata);
				})
			});
		} else {
      		return response.json();
      	}
	});
}

/**
 * Function to parse link header and get substituant parts
 * Based on https://gist.github.com/niallo/3109252
 * @param {string} [header] The header to parse
 * @returns {Object} The sections of the header given as key/value pairs
 */
function parse_link_header(header) {
    if (!header || header.length === 0) {
        return {};
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

/**
 * Gets data about a specific item in CMDB
 * @param {Object} [locals] - The res.locals value from a request in express
 * @param {string} type - The type of item being requested
 * @param {string} key - The key of the item being requested
 * @param {number} timeout - The timeout limit (optional)
 * @returns {Promise<Object>} The data about the item held in the CMDB
 */
cmdb.prototype.getItem = function getItem(locals, type, key, timeout = 12000){
	var path = 'items/' + encodeURIComponent(type) + '/' + encodeURIComponent(key);
	return this._fetch(locals, path, undefined, undefined, undefined, timeout);
};

/**
 * Gets data about a specific item in CMDB
 * @param {Object} [locals] - The res.locals value from a request in express
 * @param {string} type - The type of item being requested
 * @param {string} key - The key of the item being requested
 * @param {string} fields - The list of fields to retrurn
 * @param {number} timeout - The timeout limit (optional)
 * @returns {Promise<Object>} The data about the item held in the CMDB
 */
cmdb.prototype.getItemFields = function getItemFields(locals, type, key, fields, relatedFields, timeout = 12000){
	var path = 'items/' + encodeURIComponent(type) + '/' + encodeURIComponent(key);
	query = {}
	if (fields) {
		query['outputfields'] = fields.join(",")
	}
	if (relatedFields) {
		query['show_related'] = relatedFields
	}
	return this._fetch(locals, path, querystring.stringify(query), undefined, undefined, timeout);
};

/**
 * Updates data about a specific item in CMDB.  Can be an existing item or a new item.
 * @param {Object} [locals] - The res.locals value from a request in express
 * @param {string} type - The type of item being updated
 * @param {string} key - The key of the item being updated
 * @param {Object} body - The data to write to CMDB for the item
 * @param {number} timeout - The timeout limit (optional)
 * @returns {Promise<Object>} The updated data about the item held in the CMDB
 */
cmdb.prototype.putItem = function putItem(locals, type, key, body, timeout = 12000){
	var path = 'items/' + encodeURIComponent(type) + '/' + encodeURIComponent(key);
	return this._fetch(locals, path, undefined, "PUT", body, timeout);
};

/**
 * Deletes a specific item from CMDB.
 * @param {Object} [locals] - The res.locals value from a request in express
 * @param {string} type - The type of item to delete
 * @param {string} key - The key of the item to delete
 * @param {number} timeout - The timeout limit (optional)
 * @returns {Promise<Object>} The data about the item which was previously held in the CMDB
 */
cmdb.prototype.deleteItem = function deleteItem(locals, type, key, timeout = 12000) {
	var path = 'items/' + encodeURIComponent(type) + '/' + encodeURIComponent(key);
	return this._fetch(locals, path, undefined, "DELETE", undefined, timeout);
}

/**
 * Fetches all the items of a given type from the CMDB
 * @param {Object} [locals] - The res.locals value from a request in express
 * @param {string} type - The type of items to fetch
 * @param {string} criteria - The query parameter(s) to restrict items (optional)
 * @param {number} timeout - The timeout limit (optional)
 * @returns {Promise<Array>} A list of objects which have the type specified (NB: This refers to CMDB types, not native javascript types)
 */
cmdb.prototype.getAllItems = function getAllItems(locals, type, criteria, timeout = 12000) {
	var path = this.api + 'items/' + encodeURIComponent(type);
	if (criteria) {
		path = path + "?" + querystring.stringify(criteria)
	}
	return this._fetchAll(locals, path, timeout);
}

/**
 * Fetches all the items of a given type from the CMDB
 * @param {Object} [locals] - The res.locals value from a request in express
 * @param {string} type - The type of items to fetch
 * @param {string} fields - The list of fields to retrurn
 * @param {string} criteria - The query parameter(s) to restrict items (optional)
 * @param {number} timeout - The timeout limit (optional)
 * @returns {Promise<Array>} A list of objects which have the type specified (NB: This refers to CMDB types, not native javascript types)
 */
cmdb.prototype.getAllItemFields = function getAllItemFields(locals, type, fields, criteria, relatedFields, timeout = 12000) {
	var path = this.api + 'items/' + encodeURIComponent(type);
	query = {}
	if (fields) {
		query['outputfields'] = fields.join(",")
	}
	if (relatedFields) {
		query['show_related'] = relatedFields
	}
	if (criteria) {
		query = Object.assign(query, criteria)
	}
	if (query) {
		path = path + "?" + querystring.stringify(query)
	}
	return this._fetchAll(locals, path, timeout);
}

/**
 * Gets count infomation about a specific type of item in CMDB
 * @param {Object} [locals] - The res.locals value from a request in express
 * @param {string} type - The type of item being requested
 * @param {string} key - The key of the item being requested
 * @param {string} criteria - The query parameter(s) to restrict items (optional)
 * @param {number} timeout - The timeout limit (optional)
 * @returns {Promise<Object>} The data about the count of items held in the CMDB
 */
cmdb.prototype.getItemCount = function getItemCount(locals, type, criteria, timeout = 12000) {
	var path = this.api + 'items/' + encodeURIComponent(type)
	query = {}
	query['page'] = 1
	query['outputfields'] = ''
	query['show_related'] = 'False' // dont include related items; we only want a count

	if (criteria) {
		query = Object.assign(query, criteria)
	}
	path = path + "?" + querystring.stringify(query)
	return this._fetchCount(locals, path, timeout);
};

/**
 * Gets data about a specific item in CMDB
 * @param {Object} [locals] - The res.locals value from a request in express
 * @param {string} type - The type of item being requested
 * @param {number} page - The number of the page to return
 * @param {string} criteria - The query parameter(s) to restrict items (optional)
 * @param {number} timeout - The timeout limit (optional)
 * @returns {Promise<Object>} The data about the item held in the CMDB
 */
cmdb.prototype.getItemPage = function getItemPage(locals, type, page = 1, criteria, relatedFields, timeout = 12000) {
	var path = 'items/' + encodeURIComponent(type);
	query['page'] = page;
	if (relatedFields) {
		query['show_related'] = relatedFields
	}
	if (criteria) {
		query = Object.assign(query, criteria)
	}

	return this._fetch(locals, path, querystring.stringify(query), undefined, undefined, timeout).then(function(response) {
		return response
	}).catch(function (error) {
	    if (error.toString().includes(" 404 ")) {
            // no details available but thats not a surprise
            return []
        }
	});
};

/**
 * Gets data about a specific item in CMDB
 * @param {Object} [locals] - The res.locals value from a request in express
 * @param {string} type - The type of item being requested
 * @param {number} page - The number of the page to return
 * @param {string} criteria - The query parameter(s) to restrict items (optional)
 * @param {number} timeout - The timeout limit (optional)
 * @returns {Promise<Object>} The data about the item held in the CMDB
 */
cmdb.prototype.getItemPageFields = function getItemPageFields(locals, type, page = 1, fields, criteria, relatedFields, timeout = 12000) {
	var path = 'items/' + encodeURIComponent(type)
	var query = {}
	query['page'] = page;
	if (fields) {
		query['outputfields'] = fields.join(",")
	}
	if (relatedFields) {
		query['show_related'] = relatedFields
	}
	if (criteria) {
		query = Object.assign(query, criteria)
	}
	console.log("getItemPageFields:", querystring.stringify(query))
	return this._fetch(locals, path, querystring.stringify(query), undefined, undefined, timeout).then(function(response) {
		return response
	}).catch(function (error) {
	    if (error.toString().includes(" 404 ")) {
            // no details available but thats not a surprise
            return []
        }
	});
};

module.exports = cmdb;
