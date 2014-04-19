var mongoose = require('mongoose'),
	db = require(__dirname + '/../db/db'),
	Schema = mongoose.Schema;

var BlogEntrySchema = new Schema({
	date: Number,
	month: Number,
	url: String
});

db.connection.model('BlogEntry', BlogEntrySchema);