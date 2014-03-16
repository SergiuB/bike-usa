var Q = require("q"),
	Lazy = require("lazy"),
	db = require(__dirname + '/../db/db'),
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
					})

				}
			}
		});
	});
}