var Symbol = require('es6-symbol');
var _schemas = {};
var _keys = {
    dbRef: Symbol('db_reference')
};
function GetSchemaByName(schemaName) {
    var schema = null;
    if (schemaName) {
        schema = _schemas[schemaName];
    }
    return schema || null;
}

function RegisterSchema(schemaName, dbName, schema) {
    schema[_keys.dbRef] = dbName;
    _schemas[schemaName] = schema;
}

function GetDatabaseForSchema(schema) {
    return schema[_keys.dbRef] || null;
}

module.exports = {
    GetSchemaByName: GetSchemaByName,
    RegisterSchema: RegisterSchema,
    GetDatabaseForSchema: GetDatabaseForSchema
}