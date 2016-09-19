var Types = require('../types');
var CreateAdapter = require('./db').CreateAdapter;

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

    return function attachCollection(collectionName) {
        //Check that we aren't making references to same collection
        _keys.forEach(function(schemaKey){
            if(Types.isReferenceType(schemaConfig[schemaKey])){
                if(Types.isReferenceMatch(schemaConfig[schemaKey], collectionName)){
                    throw "Invalid Fields For Create Schema():  Circular References.";
                }
            }
        });
        return function attachEndpoint(connectionString){
            return CreateAdapter(schemaConfig, collectionName, connectionString);
        };
    };
};

module.exports = {
    CreateSchema: CreateSchema
}