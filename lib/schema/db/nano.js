module.exports = {
    attachResolver: function(db, resolveFunction){
        var newDb = Object.assign({}, db);
        if(!db){
            throw "Nano DB Not Defined";
        }
        newDb.get = function(){
            var args = arguments;
            var cb = args[args.length - 1];
            args[args.length - 1] = function(err, body, headers){
                if(err){
                    cb(err, body, headers);
                }
                else {
                    resolveFunction(body, function(doc){
                        cb(err, doc, headers);
                    });
                }
            }
            db.get.apply(this, args);
        }
        return newDb;
    }
}