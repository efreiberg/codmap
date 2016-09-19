var Symbol = require('symbol');
var CreateSubDocAdapter = require('../schema/db').CreateSubDocAdapter;

//Internal Types
var _types = {
    primitiveType: Symbol('primitive'),
    refType: Symbol('reference')
}

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
    return function configureDb(collectionName) {
        return function configureUrl(connectionString) {
            var adapter = CreateSubDocAdapter(collectionName, connectionString);
            function resolve(value, options) {
                return new Promise(function (resolve, reject) {
                    var foundType = typeof value;
                    if (foundType !== 'string') {
                        setImmediate(function () {
                            console.warn('Invalid Reference Type: Expected: string', ' Found: ', foundType);
                            resolve(null);
                        });
                    }
                    if (value.length === 0) {
                        setImmediate(function () {
                            console.warn('Invalid Reference Type: Empty reference source', foundType);
                            resolve(null);
                        });
                    }
                    else {
                        adapter.get(value, function(err, body, headers){
                            if(err){
                                console.warn('Failed To Resolve Sub Document Value ', value, ' in ', connectionString, collectionName);
                                resolve(null);
                            }
                            else {
                                resolve(body);
                            }
                        });
                    }
                });
            }
            return _setInternalType(resolve, _types.refType, collectionName);
        }
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

//TODO I don't love this, but I don't want to expose this value
function isReferenceMatch(field, comparator) {
    return field && field[_types.refType] && field[_types.refType] === comparator;
}

module.exports = {
    SchemaTypes: SchemaTypes,
    isSchemaType: isSchemaType,
    isReferenceType: isReferenceType,
    isReferenceMatch: isReferenceMatch
};