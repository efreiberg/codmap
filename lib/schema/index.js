var Types = require('../types');
var db = require('../db');
var CreateAdapter = db.CreateAdapter;
var AttachResolver = db.AttachResolverToAdapter;
var RegisterSchema = require('./registry').RegisterSchema;

/**
 * Recursive schema evaulation functions
 */
function _resolve(obj, doc, options) {
    return new Promise(function (resolve, reject) {
        Object.keys(obj).forEach(function (key) {
            var value = obj[key];
            if (typeof value === 'object') {
                //TODO pass partial doc
                _resolve(value, doc, options).then(function (newValue) {

                });
            }
            else {

            }
        });
    });
}

function _validate(schemaConfig) {
    var _keys = Object.keys(schemaConfig);
    var nestedSchemas = [];
    _keys.forEach(function (schemaKey) {
        var value = schemaConfig[schemaKey];
        //Recursively check nested configs
        if (typeof value === 'object') {
            _validate(value);
        }
        //Check if field is a valid schema type
        else if (!Types.isSchemaType(value)) {
            throw "Invalid Fields For CreateSchema(): '" + schemaKey + "' must be valid SchemaType";
        }
        else if (Types.isReferenceType(value)) {
            nestedSchemas.push(value);
        }
    });
    return nestedSchemas;
}
/**
 * Resolve schema values
 */
function resolveSchema(schema, doc, options) {
    return new Promise(function (resolve, reject) {
        var newDoc = {}, promises = [], _idxToKey = {};
        //Check if schema defininition keys are in doc
        Object.keys(schema).forEach(function (schemaKey, idx) {
            var docValue = doc[schemaKey];
            var schemaValue = schema[schemaKey];
            if (docValue) {
                //Check subdocument
                if (typeof schemaValue === 'object') {
                    //Schema doc mismatch
                    if (typeof docValue !== 'object') {
                        newDoc[schemaKey] = null;
                    }
                    else {
                        //resolve subdocument
                        promises.push(resolveSchema(schemaValue, docValue, options))
                        _idxToKey[promises.length-1] = schemaKey;
                    }
                }
                else {
                    //resolve field
                    promises.push(schema[schemaKey](docValue, options));
                    _idxToKey[promises.length-1] = schemaKey;
                }
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

/**
 * Validate Schema
 *   Make sure all fields are valid Schema Types
 *   Track nested schemas in order to avoid cirular database/document references
 */

function CreateSchema(schemaConfig) {
    if (typeof schemaConfig !== 'object') {
        throw "Invalid Paramaters For CreateSchema()";
    }
    //Validate schema config fields
    var nestedSchemas = _validate(schemaConfig);

    return function attachCollection(dbName, schemaName) {
        /**
         * Check that we aren't making references to same schema.
         * 
         * Note: Schema names are an alias to a database.  Multiple schemas can
         * refer to the same database.  Since the databases a registered schema refer
         * to aren't fully known until schema run-time, at this point we can only 
         * check for circular references by checking the schema name.  As such,
         * this check won't catch everything.  
         **/
        for (var i = 0; i < nestedSchemas.length; i++) {
            if (Types.isReferenceMatch(nestedSchemas[i], schemaName)) {
                throw "Invalid Fields For Create Schema():  Circular schema references to " + schemaName;
            }
        }
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