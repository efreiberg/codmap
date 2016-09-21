var Symbol = require('symbol');
var CreateAdapter = require('../db').CreateAdapter;
var GetSchemaByName = require('../schema/registry').GetSchemaByName;

//Internal Types
var _types = {
    primitiveType: Symbol('primitive'),
    refType: Symbol('reference')
};

var SchemaTypes = {
    //Primitives
    array: _createPrimitiveType('array'),
    bool: _createPrimitiveType('boolean'),
    number: _createPrimitiveType('number'),
    object: _createPrimitiveType('object'),
    string: _createPrimitiveType('string'),
    //Custom
    ref: _createReferenceType()
};

/**
 * Promises returned from resolve functions should never reject, since it would break
 * the document resolution process that uses Promise.all(), which will exit early on the
 * first rejected promise
 **/
function _createPrimitiveType(type) {
    function resolve(value, options) {
        return new Promise(function (resolve, reject) {
            var foundType = typeof value;
            if (foundType !== type) {
                setImmediate(function () {
                    console.warn('Invalid Primitive Type: Expected: ', type, ' Found: ', foundType);
                    resolve(null);
                });
            }
            else {
                resolve(value);
            }
        });
    }
    return _setInternalType(resolve, _types.primitiveType, true);
}

function _createReferenceType() {
    return function configureDb(schemaName, designName, viewName) {
        if (typeof schemaName !== 'string' || typeof designName !== 'string' || typeof viewName !== 'string') {
            throw "Invalid Reference Type Parameters";
        }
        function resolve(value, options) {
            return new Promise(function (resolve, reject) {
                //Get schema
                var schema = GetSchemaByName(schemaName);
                var foundType = typeof value;
                if (!schema) {
                    setImmediate(function () {
                        console.warn('Failed To Find Schema With Name', schemaName);
                        resolve(null);
                    });
                }
                else if (foundType !== 'string') {
                    setImmediate(function () {
                        console.warn('Invalid Reference Type: Expected: string', ' Found: ', foundType);
                        resolve(null);
                    });
                }
                else if (value.length === 0) {
                    setImmediate(function () {
                        console.warn('Invalid Reference Type: Empty reference source', foundType);
                        resolve(null);
                    });
                }
                else if(options.resolveRefs === false){
                    resolve(value);
                }
                //Resolve reference to other db
                else {
                    schema.view(designName, viewName, { keys: [value] }, function (err, body, headers) {
                        if (err) {
                            console.warn('Failed To Resolve Sub Document Value ', value, ' in ', schemaName);
                            resolve(null);
                        }
                        else if (!body.rows || !body.rows.length) {
                            //No docs found
                            resolve(null)
                        }
                        else {
                            //Return first result
                            resolve(body.rows[0].value || null);
                        }
                    });
                }
            });
        }
        return _setInternalType(resolve, _types.refType, schemaName);
    }
}

function _setInternalType(func, symbol, value) {
    func[symbol] = value;
    return func;
}

function isSchemaType(field) {
    if (!field) {
        return false;
    }
    for (var key in _types) {
        if (!!field[_types[key]]) {
            return true
        }
    }
    return false;
}

function isReferenceType(field) {
    return !!field && !!field[_types.refType];
}

function isReferenceMatch(field, comparator) {
    return field && field[_types.refType] && field[_types.refType] === comparator;
}

module.exports = {
    SchemaTypes: SchemaTypes,
    isSchemaType: isSchemaType,
    isReferenceType: isReferenceType,
    isReferenceMatch: isReferenceMatch
};