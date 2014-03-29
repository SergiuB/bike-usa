var db = require(__dirname + '/../db/db'),
	AdminOptions = db.connection.model('AdminOptions'),
	Path = db.connection.model('Path');

exports.get = function(req, res) {
	AdminOptions.findOne({}, function(err, options) {
		if (!err) {
			if (!options) {
				options = new AdminOptions();
				Path.findOne({}, function(err, path) {
					if (!err) {
						if (path) 
							options.activePathId = path._id;
						options.save(function(err) {
							if (err)
								res.send(500, err);
							else
								res.send(options);
						});
					} else
						res.send(500, err);
				});
			} else
				res.send(options);
		} else
			res.send(500, err);
	});
};

exports.save = function(req, res) {
	var newOptions = req.body;
	AdminOptions.findOne({}, function(err, options) {
		if (!err) {
			if (!options) {
				options = new AdminOptions();
			}
			options.activePathId = newOptions.activePathId;
			options.save(function(err) {
				if (err)
					res.send(500, err);
				else
					res.send(options);
			});
		} else
			res.send(500, err);
	});
};