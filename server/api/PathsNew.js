var Q = require("q"),
	Lazy = require("lazy"),
	db = require(__dirname + '/../db/db'),
	_ = require('underscore'),
	elevationService = require(__dirname + '/../elevationService'),
	Path = db.connection.model('Path');

function parseCoordinates(coordList) {
	var lineStr, lineSplit, points = [];

	var lines = coordList.split('\n');
	lines.forEach(function(lineStr) {
		if (lineStr.trim()) {
			lineSplit = lineStr.split(',').map(parseFloat);
			if (lineSplit.length === 3)
				points.push({
					latitude: lineSplit[1],
					longitude: lineSplit[0]
				});
		}
	});

	return points;
}

function getSegmentsFromKML(kmlPlacemarks) {
	var segments = [];
	kmlPlacemarks.forEach(function(placemark) {
		if (placemark.LineString) {
			segments.push({
				name: placemark.name,
				locations: parseCoordinates(placemark.LineString[0].coordinates[0])
			});
		}
	});
	var promises = segments.map(elevationService.processSegment);
	return Q.allSettled(promises);
}

exports.uploadKml = function(req, res) {
	var fs = require('fs'),
		xml2js = require('xml2js');

	var parser = new xml2js.Parser();
	fs.readFile(req.files.file.path, function(err, data) {
		parser.parseString(data, function(err, result) {
			if (err) {
				res.send(500, 'KML file could not be parsed');
			} else {
				var placemarks = result.kml.Document[0].Placemark;
				if (!placemarks || !placemarks.length) {
					res.send(500, 'No placemarks found in KML file');
				} else {
					getSegmentsFromKML(placemarks).then(function(results) {
						var path = new Path({
							name: result.kml.Document[0].name[0],
							segments: results.map(function(result) {
								return result.value;
							})
						});
						path.save(function(err) {
							if (err) {
								res.send(500, 'err');
							} else {
								res.send(200);
							}
						});
					});
				}
			}
		});
	});
};

var getCompactSegment = function(segment, segmentUrl) {
	return {
		_id: segment._id,
		name: segment.name,
		startCoord: [segment.locations[0].latitude, segment.locations[0].longitude],
		endCoord: [segment.locations[segment.locations.length - 1].latitude, segment.locations[segment.locations.length - 1].longitude],
		distance: segment.locations[segment.locations.length - 1].distStart
	};
};

exports.index = function(req, res) {
	Path.find(function(err, paths) {
		if (!err) {
			var newPaths = paths.map(function(path) {
				return {
					_id: path._id,
					name: path.name,
					segments: path.segments.map(function(segment) {
						var compactSegment = getCompactSegment(segment);
						compactSegment.href = req.originalUrl + '/' + path._id + '/segment/' + segment._id;
						return compactSegment;
					})
				};
			});
			return res.send(newPaths);
		} else {
			return console.log(err);
		}
	});
};

exports.show = function(req, res) {
	Path.findById(req.param('pathsNew'), function(err, targetPath) {
		if (!err) {
			res.send({
				_id: targetPath._id,
				name: targetPath.name,
				segments: targetPath.segments.map(function(segment) {
					var compactSegment = getCompactSegment(segment);
					compactSegment.href = req.originalUrl + '/' + targetPath._id + '/segment/' + segment._id;
					return compactSegment;
				})
			});
		} else {
			res.send(500, err);
		}
	});
};

exports.edit = function(req, res) {
	var srcSegment;
	var targetIndex = +req.param('targetIndex');
	var targetSegment;
	Path.findById(req.param('pathsNew'), function(err, targetPath) {
		if (!err) {
			Path.findById(req.param('srcPathId'), function(err, srcPath) {
				if (!err) {
					Path.findById(req.param('srcPathId'), function(err, srcPath) {
						if (!err) {
							srcSegment = srcPath.segments.id(req.param('srcSegmentId'));
							targetSegment = {
								locations: srcSegment.locations,
								name: srcSegment.name
							};
							targetPath.segments.splice(targetIndex, 0, targetSegment);
							targetPath.save(function(err) {
								if (!err) {
									res.send(targetPath);
								} else {
									res.send(500, err);
								}
							});
						} else {
							res.send(500, err);
						}
					});
				} else {
					res.send(500, err);
				}
			});
		} else {
			res.send(500, err);
		}
	});
};