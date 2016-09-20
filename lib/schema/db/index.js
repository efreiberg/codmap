var nanoConnector = require('nano');

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
    newDb.get = function () {
        var args = arguments;
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
        nanoDb.get.apply(this, args);
    }
    return newDb;
}

module.exports = {
    CreateAdapter: CreateAdapter,
    AttachResolverToAdapter: AttachResolverToAdapter
}