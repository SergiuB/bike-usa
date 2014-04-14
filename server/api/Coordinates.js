var db = require('../db/db'),
	GpsReading = db.connection.model('GpsReading');

exports.index = function(req, res) {
	GpsReading.find(function(err, gpsReadings) {
		if (!err) {
			res.send(gpsReadings);
		} else {
			res.send(500, err);
		}
	});
};

exports.create = function(req, res) {
	var coordinate = req.body;
	var gpsReading = new GpsReading();

	gpsReading.latitude = coordinate.latitude;
	gpsReading.longitude = coordinate.longitude;
	gpsReading.speed = coordinate.speed;
	gpsReading.bearing = coordinate.bearing;
	gpsReading.elevation = coordinate.elevation;

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