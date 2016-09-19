var AttachResolver = require('./nano').attachResolver;

function resolver(doc, callback) {
    //TODO Implement Filter Here
    callback(doc);
};

function CreateAdapter(schema, dbName, connectionString) {
    var adapter;
    function resolver(doc, callback) {
        var newDoc = {}, promises = [], _idxToKey = {};
        Object.keys(schema).forEach(function (schemaKey, idx) {
            if (doc[schemaKey]) {
                promises.push(schema[schemaKey](doc[schemaKey]));
                _idxToKey[idx] = schemaKey;
            }
            else {
                //If schema field missing in doc, set to null
                newDoc[schemaKey] = null;
            }
        });
        if (promises.length) {
            Promise.all(promises).then(function(values){
                //Build Doc
                values.forEach(function(value, idx){
                    var key = _idxToKey[idx];
                    newDoc[key] = value;
                });
                callback(newDoc);
            })
            .catch(function(err){
                console.log(err);
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
            adapter = AttachResolver(require('nano')(connectionString).use(dbName), resolver);
        }
        catch (err) {
            throw "Unable To Create Nano Adapter!  " + err;
        }

    }
    return adapter;
};

module.exports = {
    CreateAdapter: CreateAdapter
}