var Types = require('../types');
var db = require('../db');
var CreateAdapter = db.CreateAdapter;
var AttachResolver = db.AttachResolverToAdapter;
var RegisterSchema = require('./registry').RegisterSchema;

function resolveSchema(schema, doc, options) {
    return new Promise(function (resolve, reject) {
        var newDoc = {}, promises = [], _idxToKey = {};
        //Check if schema defininition keys are in doc
        Object.keys(schema).forEach(function (schemaKey, idx) {
            if (doc[schemaKey]) {
                //call individual field resolvers
                promises.push(schema[schemaKey](doc[schemaKey], options));
                _idxToKey[idx] = schemaKey;
            }
            else {
                //If schema field missing in doc, set to null
                newDoc[schemaKey] = null;
            }
        });
        //Resolve values for fields
        if (promises.length) {
            Promise.all(promises)
                .then(function (values) {
                    //Build Doc
                    values.forEach(function (value, idx) {
                        var key = _idxToKey[idx];
                        newDoc[key] = value;
                    });
                    resolve(newDoc);
                })
                .catch(function (err) {
                    console.error(err);
                    resolve(null);
                });
        }
        else {
            resolve(newDoc);
        }
    });
};


function CreateSchema(schemaConfig) {
    var _keys = Object.keys(schemaConfig);
    if (typeof schemaConfig !== 'object') {
        throw "Invalid Paramaters For CreateSchema()";
    }
    _keys.forEach(function (schemaKey) {
        //Check If Valid Schema Type
        //TODO recursively check keys at sublevels
        if (!Types.isSchemaType(schemaConfig[schemaKey])) {
            throw "Invalid Fields For CreateSchema():  Must be valid SchemaType";
        }
    });

    return function attachCollection(dbName, schemaName) {
        //Check that we aren't making references to same collection
        _keys.forEach(function (schemaKey) {
            if (Types.isReferenceType(schemaConfig[schemaKey])) {
                if (Types.isReferenceMatch(schemaConfig[schemaKey], dbName)) {
                    throw "Invalid Fields For Create Schema():  Circular References.";
                }
            }
        });
        return function attachEndpoint(connectionString) {
            //Create nano adapter then schema
            var nanoAdapter = CreateAdapter(dbName, connectionString);
            var schema = AttachResolver(nanoAdapter, resolveSchema.bind(null, schemaConfig));
            RegisterSchema(schemaName, schema);
            return schema;
        };
    };
};

module.exports = {
    CreateSchema: CreateSchema
}