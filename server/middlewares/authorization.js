var db = require(__dirname + '/../db/db'),
    User = db.connection.model('User');

exports.isAuthenticated = function (req, res, next){
    if(req.isAuthenticated()){
        next();
    }else{
        res.send(401);
    }
};

exports.userExist = function(req, res, next) {
    User.count({
        email: req.body.email
    }, function (err, count) {
        if (count === 0) {
            next();
        } else {
            res.redirect("/signup");
        }
    });
};