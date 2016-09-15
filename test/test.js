var lib = require('../');

console.log(lib);

lib.CreateSchema({
    id: lib.Types.string,
    coinId: lib.Types.ref('CoinCollection')
})('InventoryCollection')