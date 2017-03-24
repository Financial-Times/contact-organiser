# Contact Organiser

A user interface for updating inforamtion about the custodians of our systems.

## Local Dev
Run `npm start`

## Environment variables
All environment variables are optional.

- _PORT_ The HTTP port to listen on.  Defaults to 3001;
- _CMDBAPI_ The CMDB API to use.  Defaults to 'https://cmdb.ft.com/v2';
- _APIKEY_ The API key for this application to talk to CMDB.  Defaults to 'changeme';
- _SYSTEMREGISTRY_ The URL that allows related systems to be modified. Defaults to https://systemregistry.in.ft.com/manage/
- _ENDPOINTMANAGER_ The URL that allows related endpoints to be modified. Defaults to https://endpointmanager.in.ft.com/manage/
- _CONTACTORGANISER_ The URL that allows related contacts to be modified. Defaults to https://contactorganiser.in.ft.com/contacts/

To allow for a development verison of cmdb.js you may also define the following environmental variable to force runtime execution of a copy of cmdb.js from within the same directory as index.js. If the environmental variable is not present then the latest production npm verion of cmd.bjs will be used.

- _LOCALCMDBJS_ 


TODOs:

- Try and remove encoding of URLs in cmdb.js encoding
- Add two headers for pagination for Items, Pages, Links ( page before and after)
- Add query strings to our AWS CMDB
-- Special query strings : outputfields
- page get all