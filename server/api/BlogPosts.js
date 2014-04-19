var db = require('../db/db'),
	BlogEntry = db.connection.model('BlogEntry');

exports.index = function(req, res) {
	BlogEntry.find(function(err, blogEntries) {
		if (!err) {
			res.send(blogEntries);
		} else {
			res.send(500, err);
		}
	});
};

exports.create = function(req, res) {
	var entryData = req.body;
	BlogEntry.findOne({
		date: entryData.date,
		month: entryData.month
	}, function(err, existingEntry) {
		if (!err && existingEntry) {
			existingEntry.url = entryData.url;
			existingEntry.save();
		} else {
			var newEntry = new BlogEntry();
			newEntry.date = entryData.date;
			newEntry.month = entryData.month;
			newEntry.url = entryData.url;
			newEntry.save();
		}
		res.send(200);
	});
};