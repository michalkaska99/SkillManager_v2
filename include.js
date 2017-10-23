/* 
* Edited By Michal Kaska
 */

var finesse = finesse || {};
finesse.gadget = finesse.gadget || {};
finesse.gadget.include = (function () {
    

    return {
        
        mymakeRequest : function (url, handler, params) {
            clientLogs.log("mymakeRequest(): in method" + url);

            params = params || {};
            params[gadgets.io.RequestParameters.HEADERS] = params[gadgets.io.RequestParameters.HEADERS] || {};
            clientLogs.log("mymakeRequest(): options.content = " + params[gadgets.io.RequestParameters.POST_DATA]);
            gadgets.io.makeRequest(encodeURI("http://" + finesse.gadget.skillManager.appserver.ip) + url, handler, params);
            clientLogs.log("mymakeRequest(): io.makeRequest to http://"+ finesse.gadget.skillManager.appserver.ip + url);
        },
        
        
        _mycreateAjaxHandler: function(options) {
            var parentUser = this;

            return function(rsp) {
                var requestId, error = false, rspObj;
                clientLogs.log("_mycreateAjaxHandler");
                if (options.success || options.error) {
                    rspObj = {
                        status: rsp.rc,
                        content: rsp.text
                    };

                    //Some responses may not have a body.
                    if (rsp.text.length > 0) {
                        try {
                            //TODO: Here you could parse xml into JSON, rather than just using the content in the success handler
                            //rspObj.object = gadgets.json.parse((parentUser._util.xml2json(jQuery.parseXML(rsp.text), "")));
                            //clientLogs.log("_mycreateAjaxHandler(): " + rsp.text);
                        } catch (e) {
                            error = true;
                            rspObj.error = {
                                errorType: "parseError",
                                errorMessage: "Could not serialize XML: " + e
                            };
                        }
                    } else {
                        rspObj.object = {};
                    }

                    if (!error && rspObj.status >= 200 && rspObj.status < 300) {
                        if (options.success) {
                            options.success(rspObj);
                        }
                    } else if (options.error) {
                        options.error(rspObj);
                    }
                }
            };
        },
        
        myrestRequest : function (url, options) {
            var params, uuid;

            params = {};

            clientLogs.log("myrestRequest(): In myrestRequest" + url);
            // Protect against null dereferencing of options allowing its (nonexistant) keys to be read as undefined
            options = options || {};
            options.success = _util.validateHandler(options.success);
            options.error = _util.validateHandler(options.error);
            // Request Headers
            params[gadgets.io.RequestParameters.HEADERS] = {};
            // HTTP method is a passthrough to gadgets.io.makeRequest, makeRequest defaults to GET
            params[gadgets.io.RequestParameters.METHOD] = options.method;
            //true if this should be a GET request, false otherwise
            if (!options.method || options.method === "GET") {
                //Disable caching for GETs
                if (url.indexOf("?") > -1) {
                    url += "&";
                } else {
                    url += "?";
                }
                url += "nocache=" + _util.currentTimeMillis();
            } else {
                /**
                 * If not GET, generate a requestID and add it to the headers,
                 **/
                uuid = _util.generateUUID();
                params[gadgets.io.RequestParameters.HEADERS].requestId = uuid;
                params[gadgets.io.RequestParameters.GET_FULL_HEADERS] = "true";
            }

            // Content Body
            if (typeof options.content === "object") { }
                // Content Type
                
                params[gadgets.io.RequestParameters.HEADERS]["Content-Type"] = "application/" + options.conttype + "; charset=utf-8";
             
                params[gadgets.io.RequestParameters.HEADERS]["Accept"] = "application/" + options.conttype + "; charset=utf-8";
                clientLogs.log("myrestRequest(): user:"+finesse.gadget.skillManager.appserver.admin);
                var b64credentials = finesse.utilities.Utilities.b64Encode(finesse.gadget.skillManager.appserver.admin +":"+finesse.gadget.skillManager.appserver.pwd);
                //params[gadgets.io.RequestParameters.HEADERS]["Authorization"] = "Basic bWthc2thOjIqR2FtYnJpbnVT";
                clientLogs.log("myrestRequest(): credentials:"+b64credentials);
                params[gadgets.io.RequestParameters.HEADERS]["Authorization"] = "Basic "+b64credentials;

                // Content
                params[gadgets.io.RequestParameters.POST_DATA] = options.content;
                clientLogs.log("myrestRequest(): options.content = " + params[gadgets.io.RequestParameters.POST_DATA]);
                //params[gadgets.io.RequestParameters.HEADERS]["Content-Length"] = options.content.length;
                
                
                 
                        
           

            // go do a makerequest
            this.mymakeRequest(encodeURI(url), this._mycreateAjaxHandler(options), params);
        }

        
        
        
        
    };
}());


