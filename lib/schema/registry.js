var _schemas = {};

function GetSchemaByName(schemaName){
    var schema = null;
    if(schemaName){
        schema = _schemas[schemaName];
    }
    return schema || null;
}

function RegisterSchema(schemaName, schema){
    _schemas[schemaName] = schema;
}

module.exports = {
    GetSchemaByName: GetSchemaByName,
    RegisterSchema: RegisterSchema
}