var Q = require("q"),
	Lazy = require("lazy"),
	db = require(__dirname + '/../db/db'),
	_ = require('underscore'),
	elevationService = require(__dirname + '/../elevationService'),
	Path = db.connection.model('Path'),
	cache = require('memory-cache');

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

exports.exportGpx = function(req, res) {
	Path.findById(req.param('pathId'), function(err, targetPath) {
		if (!err) {
			var gpxXml = "<?xml version=\"1.0\"?><gpx><trk><name>" + targetPath.name + "</name>";
			targetPath.segments.forEach(function(segment) {
				gpxXml += "<trkseg>";
				segment.locations.forEach(function(location) {
					gpxXml += "<trkpt lat=\"" + location.latitude + "\" lon=\"" + location.longitude + "\"></trkpt>";
				});
				gpxXml += "</trkseg>";
			});
			gpxXml += "</trk></gpx>";
			res.set('Content-Disposition', 'attachment; filename="' + targetPath.name + '.gpx"');
			res.set('Content-Type', 'application/xml');
			res.send(gpxXml);
		} else {
			res.send(500, err);
		}
	});
};

var getCompactSegment = function(segment, segmentUrl) {
	return {
		_id: segment._id,
		name: segment.name,
		startCoord: [segment.locations[0].latitude, segment.locations[0].longitude],
		endCoord: [segment.locations[segment.locations.length - 1].latitude, segment.locations[segment.locations.length - 1].longitude],
		locations: [segment.locations[0], segment.locations[segment.locations.length - 1]]
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
			res.send(newPaths);
		} else {
			res.send(500, err);
		}
	});
};

function sendPath(path, req, res) {
	res.send({
		_id: path._id,
		name: path.name,
		segments: path.segments.map(function(segment) {
			var compactSegment = getCompactSegment(segment);
			compactSegment.href = req.originalUrl + '/' + path._id + '/segment/' + segment._id;
			return compactSegment;
		})
	});
}

function saveAndSendPath(path, req, res) {
	path.save(function(err) {
		if (!err) {
			sendPath(path, req, res);
		} else {
			res.send(500, err);
		}
	});
}

exports.show = function(req, res) {
	Path.findById(req.param('pathId'), function(err, targetPath) {
		if (!err) {
			var retObj = {
				_id: targetPath._id
			};
			var fields = req.param('fields');
			if (fields) {
				if (fields.indexOf('name') >= 0)
					retObj.name = targetPath.name;
				res.send(retObj);
			} else {
				sendPath(targetPath, req, res);
			}
		} else {
			res.send(500, err);
		}
	});
};

exports.create = function(req, res) {
	var path = new Path({
		name: req.body.name,
		segments: []
	});
	path.save(function(err) {
		if (err) {
			res.send(500, 'err');
		} else {
			sendPath(path, req, res);
		}
	});
};

exports.destroy = function(req, res) {
	Path.remove(({
		_id: req.param('pathId')
	}), function(err) {
		if (!err) {
			res.send(204);
		} else {
			res.send(500, err);
		}
	});
};

exports.edit = function(req, res) {
	var srcSegment;
	var targetIndex = +req.param('targetIndex') || 0;
	var targetSegment;
	Path.findById(req.param('pathId'), function(err, targetPath) {
		if (!err) {
			var operationType = req.param('operationType');
			if (!operationType)
				res.send(500, 'No operation type provided.');
			if (operationType === 'copySegment') {
				Path.findById(req.param('srcPathId'), function(err, srcPath) {
					if (!err) {
						if (srcPath) {
							if (req.param('srcSegmentId')) {
								srcSegment = srcPath.segments.id(req.param('srcSegmentId'));
								targetSegment = {
									locations: srcSegment.locations,
									name: srcSegment.name
								};
								targetPath.segments.splice(targetIndex, 0, targetSegment);
							} else { // copy all segments
								var args = [targetIndex, 0];
								args = args.concat(srcPath.segments.map(function(srcSegment) {
									return {
										locations: srcSegment.locations,
										name: srcSegment.name
									};
								}));
								targetPath.segments.splice.apply(targetPath.segments, args);
							}
							saveAndSendPath(targetPath, req, res);
						} else {
							res.send(500, 'Path with ID ' + req.param('srcPathId') + ' not found.');
						}
					} else {
						res.send(500, err);
					}
				});
			} else if (operationType === 'changeName') {
				var newName = req.param('newName');
				if (!newName) {
					res.send(500, 'No new name provided.');
					return;
				}
				targetPath.name = newName;
				saveAndSendPath(targetPath, req, res);
			}
		} else {
			res.send(500, err);
		}
	});
};

exports.getPoints = function(req, res) {
	var me = this;
	var pathId = req.param('pathId');
	var pointsFromCache = cache.get(pathId + '.points');
	if (pointsFromCache) {
		res.send(pointsFromCache);
	} else {
		Path.findById(pathId, function(err, path) {
			if (!err) {
				var points = exports.getPointsArray(path);
				cache.put(pathId + '.points', points);
				res.send(points);
			} else {
				res.send(500, err);
			}
		});
	}
};

exports.getPointsArray = function(path) {
	var points = [];
	var segments = path.segments;
	var segment;
	var distance = 0;
	var location;
	var index = 0;
	for (var i = 0; i < segments.length; i++) {
		segment = segments[i];
		for (var j = 0; j < segment.locations.length; j++) {
			location = segment.locations[j];
			points.push({
				index: index,
				latitude: location.latitude,
				longitude: location.longitude,
				elevation: location.elevation,
				distPrev: location.distPrev,
				distStart: location.distStart + distance
			});
			index++;
		}
		distance += segment.locations[segment.locations.length - 1].distStart;
	}
	return points;
};