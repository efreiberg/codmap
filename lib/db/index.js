var nanoConnector = require('nano');
var wrappedNanoFunctions = ['get', 'view'];

var customOptionFieldName = 'odm';

/**
 * Creates db adapter 
 */
function CreateAdapter(dbName, connectionString) {
    var adapter = null;
    try {
        adapter = nanoConnector(connectionString).use(dbName);
    }
    catch (err) {
        throw "Unable To Create Nano Adapter!  " + err;
    }

    return adapter;
};

/**
 * Wrap native nano functions with our handling
 */
function AttachResolverToAdapter(nanoDb, resolveFunction) {
    var newDb = Object.assign({}, nanoDb);
    if (!nanoDb) {
        throw "Nano DB Not Defined";
    }
    //Wrap nano callbacks with our own
    wrappedNanoFunctions.forEach(function (funcName) {
        newDb[funcName] = function () {
            var args = arguments;
            var promises = [];
            //Save origional callback
            var cb = args[args.length - 1];
            var customOptions = {}, nanoOptions;
            //Find options object
            if (args.length > 1) {
                nanoOptions = args[args.length - 2];
                //Check if our options present
                if (nanoOptions && nanoOptions[customOptionFieldName]) {
                    customOptions = nanoOptions[customOptionFieldName];
                    delete nanoOptions[customOptionFieldName];
                }
            }
            //Custom callback to transform documents
            args[args.length - 1] = function (err, body, headers) {
                var newBody;
                if (err) {
                    cb(err, body, headers);
                }
                else {
                    //Multiple Docs
                    if (body.rows) {
                        newBody = Object.assign({}, body);
                        body.rows.forEach(function (row) {
                            promises.push(resolveFunction(row.value, customOptions));
                        });
                        Promise.all(promises).then(function (results) {
                            results.forEach(function (value, idx) {
                                newBody.rows[idx].value = value;
                            });
                            cb(err, newBody, headers);
                        });
                    }
                    else {
                        //Single Doc
                        resolveFunction(body, customOptions).then(function (doc) {
                            cb(err, doc, headers);
                        });
                    }
                }
            }
            //Call origional function
            nanoDb[funcName].apply(this, args);
        }
    });
    return newDb;
}

module.exports = {
    CreateAdapter: CreateAdapter,
    AttachResolverToAdapter: AttachResolverToAdapter
}