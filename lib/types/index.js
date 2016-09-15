var Symbol = require('symbol');

var SchemaTypes = {
    //Primitives
    array: _createPrimitiveType('array'),
    bool: _createPrimitiveType('boolean'),
    func: _createPrimitiveType('function'),
    number: _createPrimitiveType('number'),
    object: _createPrimitiveType('object'),
    string: _createPrimitiveType('string'),
    //Custom
    ref: _createReferenceType()
};

function _createPrimitiveType(type) {
    function resolve(value, options) {
        return new Promise(function (resolve, reject) {
            var foundType = typeof value;
            if (foundType !== type) {
                setImmediate(function () {
                    reject('Invalid Primitive Type: Expected: ' + type + ' Found: ', foundType);
                });
            }
        });
    }
    return _setInternalType(resolve);
}

function _createReferenceType() {
    return function configure(collectionName) {
        function resolve(value, options) {
            return new Promise(function (resolve, reject) {
                var foundType = typeof value;
                if (foundType !== 'string') {
                    setImmediate(function () {
                        reject('Invalid Reference Type: Expected: string' + ' Found: ', foundType);
                    });
                }
            });
        }
        return _setInternalType(resolve);
    }
}

function _setInternalType(func) {
    func[Symbol.for('SchemaType')] = true;
    return func;
}

function isSchemaType(field) {
    return !!field[Symbol.for('SchemaType')];
}

module.exports = {
    SchemaTypes: SchemaTypes,
    isSchemaType: isSchemaType
};