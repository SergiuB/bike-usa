var Auth = require('./middlewares/authorization.js');
var pathsNew = require('./api/PathsNew');
var adminOptions = require('./api/AdminOptions');
var paths = require('./api/Paths');
var segments = require('./api/Segments');
var coordinates = require('./api/Coordinates');
var db = require('./db/db'),
    User = db.connection.model('User');

module.exports = function(app, passport) {
	app.get("/", function(req, res) {
		res.render('index');
	});

	app.get('/partials/admin', Auth.isAuthenticated, function(req, res) {
		res.render('partials/admin');
	});

	app.get('/partials/:name', function(req, res) {
		var name = req.params.name;
		res.render('partials/' + name);
	});

	app.post('/api/admin/kmlUpload', Auth.isAuthenticated, pathsNew.uploadKml);
	app.post('/api/admin/options', Auth.isAuthenticated, adminOptions.save);
	app.get('/api/admin/options', adminOptions.get);

	// JSON API
	app.resource('/api/paths', require('./api/Paths.js'));
	
	app.get('/api/pathsNew', pathsNew.index);
	app.get('/api/pathsNew/:pathId', pathsNew.show);
	app.get('/api/pathsNew/:pathId/edit', Auth.isAuthenticated, pathsNew.edit);
	app.post('/api/pathsNew', Auth.isAuthenticated, pathsNew.create);
	app.delete('/api/pathsNew/:pathId', Auth.isAuthenticated, pathsNew.destroy);

	app.get('/api/pathsNew/:pathId/segment', segments.index);
	app.get('/api/pathsNew/:pathId/segment/:segmentId', segments.show);
	app.delete('/api/pathsNew/:pathId/segment/:segmentId', Auth.isAuthenticated, segments.destroy);


	app.get('/api/coordinates', coordinates.index);
	app.post('/api/coordinates', coordinates.create);

	// app.post("/signup", Auth.userExist, function (req, res, next) {
	// 	User.signup(req.body.email, req.body.password, function(err, user){
	// 		if(err) throw err;
	// 		req.login(user, function(err){
	// 			if(err) return next(err);
	// 			return res.redirect("admin");
	// 		});
	// 	});
	// });

	app.post("/login", passport.authenticate('local', {
		successRedirect: "/admin",
		failureRedirect: "/login",
	}));

	app.get('/logout', function(req, res) {
		req.logout();
		res.redirect('/login');
	});

	// redirect all others to the index (HTML5 history)
	app.get('*', function(req, res) {
		res.render('index');
	});
};