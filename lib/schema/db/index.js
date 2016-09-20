var nanoConnector = require('nano');
var wrappedNanoFunctions = ['get'];

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

function AttachResolverToAdapter(nanoDb, resolveFunction) {
    var newDb = Object.assign({}, nanoDb);
    if (!nanoDb) {
        throw "Nano DB Not Defined";
    }
    //Wrap nano callbacks with our own
    wrappedNanoFunctions.forEach(function (funcName) {
        newDb[funcName] = function () {
            var args = arguments;
            //Save origional callback
            var cb = args[args.length - 1];
            args[args.length - 1] = function (err, body, headers) {
                if (err) {
                    cb(err, body, headers);
                }
                else {
                    resolveFunction(body, function (doc) {
                        cb(err, doc, headers);
                    });
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