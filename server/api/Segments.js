var Q = require("q"),
	db = require(__dirname + '/../db/db'),
	Path = db.connection.model('Path');

exports.index = function(req, res) {
	Path.findById(req.params.pathId, function(err, path) {
		if (!err) {
			return res.send(path.segments);
		} else {
			return console.log(err);
		}
	});
};

exports.show = function(req, res) {
	Path.findById(req.params.pathId, function(err, path) {
		if (!err) {
			return res.send(path.segments.id(req.params.segment));
		} else {
			return console.log(err);
		}
	});
};