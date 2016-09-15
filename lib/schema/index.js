var isSchemaType = require('../types').isSchemaType;

function CreateSchema(schemaConfig){
    if(typeof schemaConfig !== 'object'){
        throw "Invalid Paramaters For CreateSchema()";
    }
    Object.keys(schemaConfig).forEach(function(schemaKey){
        //Check If Valid Schema Type
        if(!isSchemaType(schemaConfig[schemaKey])){
            throw "Invalid Fields For CreateSchema().  Must be valid SchemaTypes";
        }
    });

    return function attachCollection(collectionName){
        //TODO Check that we aren't making references to same collection
    };
};

module.exports = {
    CreateSchema: CreateSchema
}