var mongoose = require('mongoose'),
	db = require(__dirname + '/../db/db'),
	Schema = mongoose.Schema;

var SegmentSchema = new Schema({
	name: {
		type: String,
		default: '',
		trim: true
	},
	locations: []
});

var PathSchema = new Schema({
	name: {
		type: String,
		default: '',
		trim: true
	},
	segments: [SegmentSchema]
});

db.connection.model('Path', PathSchema);