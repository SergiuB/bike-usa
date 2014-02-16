var mongoose = require('mongoose'),
	db = require(__dirname + '/../db/db'),
	Schema = mongoose.Schema;

var PointSchema = new Schema({
	latitude: { type: Number, min: -90, max: 90 },
	longitude: { type: Number, min: -180, max: 180 },
	distPrev: Number,
	distStart: Number,
	elevation: Number
});

db.connection.model('PointModel', PointSchema);