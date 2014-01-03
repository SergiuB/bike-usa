var Q = require("q"),
    fs = require("fs"),
    Lazy = require("lazy");

var readPoints = function(pointsFileName) {
    var deferred = Q.defer(),
        lineStr, lineSplit, points = [];

    new Lazy(fs.createReadStream(pointsFileName))
        .lines
        .forEach(function(line) {
            lineStr = line.toString();
            lineSplit = lineStr.split(",");
            points.push(lineSplit.map(function(elem) {
                return parseFloat(elem);
            }));
        }).on('pipe', function() {
            deferred.resolve(points);
        });

    return deferred.promise;
};

exports.show = function(req, res) {
    readPoints('./resources/points.txt').then(function(points) {

        res.writeHead(200, {
            'Content-Type': 'application/json'
        });
        res.end(JSON.stringify({
            id: req.params.path,
            points: points.map(function(point) {
                return {
                    lat: point[0],
                    long: point[1],
                    distPrev: point[2],
                    distStart: point[3],
                    elevation: point[4]
                };
            })
        }));
    });
};