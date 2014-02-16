/*
* MongoDB helpers for importing a file with "points" into MongoDB
*/

var mongoose = require('mongoose'),
    utils = require('util'),
    async = require('async'), 
    db = require('./db'),
	Q = require("q"),
    fs = require("fs"),
    Lazy = require("lazy");

// Bootstrap models
var fs = require("fs");
var modelsPath = __dirname + '/../models';
fs.readdirSync(modelsPath).forEach(function (file) {
    require(modelsPath + '/' + file);
});

var PointModel = db.connection.model('PointModel');

var readPoints = function (pointsFileName) {
    var deferred = Q.defer(),
        lineStr, lineSplit, points = [];
    
    var stream = fs.createReadStream(pointsFileName);

    stream.on('error', function (error) {
        deferred.reject(error);
    });

    new Lazy(stream)
        .lines
        .forEach(function (line) {
            lineStr = line.toString();
            lineSplit = lineStr.split(",");
            points.push(lineSplit.map(function (elem) {
                return parseFloat(elem);
            }));
        }).on('pipe', function () {
            deferred.resolve(points);
        }).on('error', function (err) {
            deferred.reject(err);
        });

    return deferred.promise;
};

var savePoint = function (pointModel, callback) {
    // save model to MongoDB
    pointModel.save(function (err, res) {
        if (err) return callback(err);
            
        callback();
    });
};

var importPoints = function (filePath, callback) {
    console.log('Reading file: ' + filePath);

    if (!db.isConnected()) {
        return callback(new Error('No DB Connection'));
    }

    readPoints(filePath).then(function (points) {
        var points = points.map(function (point) {
            var pointModel = new PointModel();

            pointModel.latitude = point[0];
            pointModel.longitude = point[1];
            pointModel.distPrev = point[2];
            pointModel.distStart = point[3];
            pointModel.elevation = point[4];

            return pointModel;
        });

        console.log('Saving into DB ' + points.length + ' points...');

        async.eachSeries(points, savePoint, function (err) {
            if (err) return callback(err);

            console.log('Save succeeded');

            callback();
        });
        

        //util.debug(JSON.stringify(pointArrayModel));
    }, function (err) {
        // readPoints failed
        return callback(err);
    });
};

exports.importPoints = importPoints;
