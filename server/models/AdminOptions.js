var mongoose = require('mongoose'),
	db = require(__dirname + '/../db/db'),
	Schema = mongoose.Schema;

var AdminOptionsSchema = new Schema({
	activePathId: Schema.Types.ObjectId
});

db.connection.model('AdminOptions', AdminOptionsSchema);