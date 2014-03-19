var Q = require("q"),
    fs = require("fs"),
    Lazy = require("lazy"),
    db = require('../db/db'),
    async = require('async'), 
    PointModel = db.connection.model('PointModel'),
    points = null;

var readDbPoints = function (callback) {
    if (points) {
        return callback(null, points);
    }
    
    console.log('Reading points from DB...');

    if (!db.isConnected()) {
        return callback(new Error('No DB Connection'));
    }

    var dbConnection = db.connection;

    PointModel.find({}, function (err, pointModels) {
        if (err) return callback(err);

        console.log('Found ' + pointModels.length + ' points.');
        // cache result
        points = pointModels;

        callback(null, pointModels);
    });
};

exports.show = function(req, res) {
    readDbPoints(function (err, pointModels) {
        var url;
        if (err) {
            res.status(500);
            url = req.url;
            res.render('500.jade', { 
                title:'500: Internal Server Error', 
                error: err, 
                url: url
            });

            return;
        }

        res.writeHead(200, {
            'Content-Type': 'application/json'
        });

        res.end(JSON.stringify({
            id: req.params.path,
            points: pointModels.map(function (point) {
                return {
                    lat: point.latitude,
                    long: point.longitude,
                    distPrev: point.distPrev,
                    distStart: point.distStart,
                    elevation: point.elevation
                };
            })
        }));
    });
};