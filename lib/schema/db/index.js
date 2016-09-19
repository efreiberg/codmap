var AttachResolver = require('./nano').attachResolver;
var nanoConnector = require('nano');

function CreateSubDocAdapter(dbName, connectionString) {
    var adapter;
    //Resolve db provider(only nano for now)
    if (true) {
        //Nano
        try {
            adapter = nanoConnector(connectionString).use(dbName);
        }
        catch (err) {
            throw "Unable To Create Nano Sub-Document Adapter!  " + err;
        }

    }
    return adapter;
};

/**
 * Creates one database adapter per given db name
 */
function CreateAdapter(schema, dbName, connectionString) {
    var adapter;
    function resolver(doc, callback) {
        var newDoc = {}, promises = [], _idxToKey = {};
        //Check if schema defininition keys are in doc
        Object.keys(schema).forEach(function (schemaKey, idx) {
            if (doc[schemaKey]) {
                promises.push(schema[schemaKey](doc[schemaKey], {}/*TODO OPTIONS*/));
                _idxToKey[idx] = schemaKey;
            }
            else {
                //If schema field missing in doc, set to null
                newDoc[schemaKey] = null;
            }
        });
        //Resolve values for fields
        if (promises.length) {
            Promise.all(promises).then(function (values) {
                //Build Doc
                values.forEach(function (value, idx) {
                    var key = _idxToKey[idx];
                    newDoc[key] = value;
                });
                callback(newDoc);
            })
                .catch(function (err) {
                    console.error(err);
                    callback(null);
                });
        }
        else {
            callback(newDoc);
        }
    };
    //Resolve db provider(only nano for now)
    if (true) {
        //Nano
        try {
            adapter = AttachResolver(nanoConnector(connectionString).use(dbName), resolver);
        }
        catch (err) {
            throw "Unable To Create Nano Adapter!  " + err;
        }

    }
    return adapter;
};

module.exports = {
    CreateAdapter: CreateAdapter,
    CreateSubDocAdapter: CreateSubDocAdapter
}