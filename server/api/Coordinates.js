var db = require('../db/db'),
	GpsReading = db.connection.model('GpsReading'),
	AdminOptions = db.connection.model('AdminOptions'),
	Path = db.connection.model('Path'),
	pathsNew = require('../api/PathsNew'),
	time = require('time')(Date);

exports.index = function(req, res) {
	GpsReading.find().sort({
		timestamp: 'asc'
	}).exec(function(err, gpsReadings) {
		if (!err) {
			res.send(gpsReadings);
		} else {
			res.send(500, err);
		}
	});
};

exports.create = function(req, res) {
	var coordinate = req.body;

	if (!coordinate.latitude || !coordinate.longitude) {
		res.send(500, 'Null latitude or longitude');
		return;
	}

	var gpsReading = new GpsReading();

	gpsReading.latitude = coordinate.latitude;
	gpsReading.longitude = coordinate.longitude;
	gpsReading.speed = coordinate.speed;
	gpsReading.bearing = coordinate.bearing;
	gpsReading.elevation = coordinate.elevation;
	gpsReading.timestamp = new Date();

	console.log('Received GPS reading: ' + JSON.stringify(coordinate));
	gpsReading.save(function(err, res) {
		if (!err) {
			console.log('Saved GPS reading');
		} else {
			console.log('Failed to save GPS reading: ' + err);
			res.send(500, err);
		}
	});

	res.send(coordinate);
};

exports.getLast = function(req, res) {
	GpsReading.find().sort({
		timestamp: 'asc'
	}).exec(function(err, gpsReadings) {
		if (!err) {
			if (gpsReadings.length)
				res.send(gpsReadings[gpsReadings.length - 1]);
			else
				res.send(500, 'No GPS reading so far');
		} else {
			res.send(500, err);
		}
	});
};

exports.generateSample = function(req, res) {
	AdminOptions.findOne({}, function(err, options) {
		if (!err) {
			Path.findById(options.activePathId, function(err, path) {
				if (!err) {

					GpsReading.remove(function(err) {
						var points = pathsNew.getPointsArray(path);
						console.log('generateSample count points ' + req.param('count'));
						var numPoints = req.param('count') === "all" ? points.length : req.param('count');
						numPoints = numPoints || Math.floor(Math.random() * points.length);
						console.log('generateSample count points ' + numPoints);
						points = points.slice(0, numPoints);

						var gpsReading, point, distance = 0,
							distanceSmall = 1001;
						var timestamp = new Date(2014, 3, 23, 7, 0, 0, 0, "America/New_York");
						console.log('Timestamp: ', timestamp.toString());
						var gpsReadings = [];
						var day = 0;
						for (var i = 0; i < points.length; i++) {
							point = points[i];

							if (distanceSmall > 1000) {
								//if ((day !== 0) && (day !== 3)) { // skip day 0 and 3

									gpsReading = new GpsReading();

									gpsReading.latitude = point.latitude + Math.random() * 0.01;
									gpsReading.longitude = point.longitude + Math.random() * 0.01;
									gpsReading.speed = 0;
									gpsReading.bearing = 0;
									gpsReading.elevation = point.elevation;
									gpsReading.timestamp = new Date(timestamp.getTime());
									console.log('Timestamp: ', timestamp.toString());
									gpsReading.save();

									// one km passed => increase timestamp by 2 min
									timestamp.setTime(timestamp.getTime() + 120 * 1000);
								//}
								distanceSmall = 0;
							}

							if (distance > 150000) {
								// new day
								day++;
								timestamp.setDate(timestamp.getDate() + 1);
								timestamp.setHours(7);
								timestamp.setMinutes(0);
								timestamp.setSeconds(0);
								distance = 0;
							}

							distance += point.distPrev;
							distanceSmall += point.distPrev;
						}

						res.send(200);

						// GpsReading.create(gpsReadings, function(err) {
						// 	if (!err) {
						// 		res.send(200);
						// 	} else {
						// 		res.send(500, err);
						// 	}
						// });
					});

				} else {
					res.send(500, err);
				}
			});
		} else
			res.send(500, err);
	});
};