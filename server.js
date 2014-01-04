var express = require('express'),
    Resource = require('express-resource'),
    routes = require('./server/routes'),
    app = express();
// Load configurations
var env = process.env.NODE_ENV || 'development',
    config = require('./server/config')[env];


app.configure(function(){
  app.set('views', __dirname + '/client/views');
  app.set('view engine', 'jade');
  app.set('view options', {
    layout: false
  });
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.static(__dirname + '/client/public'));
  app.use(app.router);
});



app.get('/', routes.index);
app.get('/partials/:name', routes.partials);

// JSON API
app.resource('api/paths', require('./server/api/Paths.js'));

// redirect all others to the index (HTML5 history)
app.get('*', routes.index);

var port = process.env.PORT || 3000;
app.listen(port);
console.log('Listening on port ' + port + '...');