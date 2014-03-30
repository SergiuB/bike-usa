require("console-stamp")(console, "HH:MM:ss.l");

var express = require('express'),
  Resource = require('express-resource'),
  db = require('./server/db/db'),
  fs = require("fs"),
  passport = require("passport"),
  app = express();
// Load configurations
var env = process.env.NODE_ENV || 'development',
  config = require('./server/config')[env];

// Start reading from stdin so we don't exit
process.stdin.resume();

var events = require('events');
var eventEmitter = new events.EventEmitter();

// perform clean up when app is closing
eventEmitter.on('app_close_event', function() {
  console.log('Cleaning up...');

  // disconnect from DB
  db.disconnect();
});

// catches process exit
process.on('exit', function() {
  eventEmitter.emit('app_close_event');
});

// catches Ctrl+C event
process.on('SIGINT', function() {
  console.log('Ctrl+C detected.');

  process.exit();
});

// catches uncaught exceptions
process.on('uncaughtException', function(e) {
  console.error('Uncaught exception: ' + e.message);
  console.log(e.stack);

  process.exit();
});

// Bootstrap models
var fs = require("fs");
var modelsPath = './server/models';
fs.readdirSync(modelsPath).forEach(function (file) {
    require(modelsPath + '/' + file);
});

require('./server/passport')(passport, config);

app.configure(function() {
  app.set('views', __dirname + '/client/views');
  app.set('view engine', 'jade');
  app.set('view options', {
    layout: false
  });
  app.use(express.cookieParser());
  app.use(express.bodyParser({ 
    keepExtensions: true, 
    uploadDir: __dirname + '/uploads'
  }));
  app.use(express.session({ secret: 'keyboard cat' }));
  app.use(passport.initialize());
  app.use(passport.session());
  app.use(express.compress());
  app.use(express.methodOverride());
  app.use(express.static(__dirname + '/client/public'));
  app.use(app.router);
});

require('./server/routes')(app, passport);

var port = process.env.PORT || 3000;

// connect to DB
db.connect().then(function() {
  app.listen(port);
  console.log('Listening on port ' + port + '...');
}, function(err) {
  console.error('DB connection failed: ' + err);

  process.exit();
});