var mongoose = require('mongoose'),
	db = require(__dirname + '/../db/db'),
	Schema = mongoose.Schema;

var GpsReadingSchema = new Schema({
	latitude: { type: Number, min: -90, max: 90 },
	longitude: { type: Number, min: -180, max: 180 },
	elevation: Number,
	speed: Number,
	bearing: Number
});

db.connection.model('GpsReading', GpsReadingSchema);