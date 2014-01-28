/*
 Mongo DB related helpers
*/

var mongoose = require('mongoose'),
	url = require('url'),
	config = require('../config'),
	// If running on Heroku using MongoHQ, MONGOHQ_URL environment variable should be set;
    // ohtherwise fallback to default local installation of MongoDB.
	uristring = process.env.MONGOHQ_URL || config.development.mongo_auth_uri,
	connection_uri = url.parse(uristring),
	db_name = connection_uri.pathname.replace(/^\//, ''),
	options = { // enable connection keepalive
		server : {
			auto_reconnect: false, // don't let native mongodb client reconnect
			poolSize: 5,
			socketOptions: { 
				keepAlive: 1
			}
		},
		db: {
        	numberOfRetries: 5,
        	retryMiliSeconds: 2000
    	}
	},
	dbConnection = mongoose.createConnection(),
	Promise = mongoose.Promise,
	Schema = mongoose.Schema,
	attempts = 0,
	duringDisconnect = false,
	timer;
	
var setupEventHandlers = function () {
	dbConnection.on('connecting', function () {
        console.log('Connecting to MongoDB...');
    });

	dbConnection.on('connected', function () {
	    console.log('MongoDB connected!');
	});

	dbConnection.on('open', function () {
	    console.log('MongoDB connection opened.');
	});

	dbConnection.on('disconnecting', function () {
	    console.log('Disconnecting from MongoDB...');
	});

	dbConnection.on('disconnected', function () {
	    console.log('MongoDB disconnected!');
	});

	dbConnection.on('close', function () {
	    console.log('MongoDB connection closed.');

		if (!duringDisconnect) {
			// try to re-connect
	    	tryReconnect();
		}
	});
	
	dbConnection.on('error', function (err) {
	    console.error('Error in MongoDB connection: ' + err);

	    // close connection, otherwise we do not get disconnect if mongod dies unexpectedly
	    dbConnection.close();
	});

};

var tryReconnect = function () {	
	console.log('Reconnecting to DB...');

	attempts = 0;

	internalConnect(true, function (err, res) {
		if (err) {
			console.error('Failed to re-connect to DB: ' + err);

			throw err;
		} else {
			console.log('MongoDB reconnected!');
		}
	});
}

var internalConnect = function (reconnect, callback) {
	attempts++;

	var verb = reconnect ? 'reconnect' : 'connect';

	dbConnection.open(uristring, options, function (err, res) {
		if (err) {
			console.error('Failed to ' + verb + ' to DB on attempt #' + attempts +": " + err);

			if (dbConnection.readyState === 1) {
				// already connected

				// report error via callback
        		callback && callback(err2);

        		return;
			}

			if (attempts >= options.db.numberOfRetries) {
        		console.log('Giving up on DB ' + verb + '.');

        		dbConnection.close();

        		var err2 = new Error('Could not ' + verb + ' to DB after ' + options.db.numberOfRetries + ' attempts.');

        		// report error via callback
        		callback && callback(err2);

        		return;
     		}

     		// retry after some time
			timer = setTimeout(function () {
				internalConnect(reconnect, callback);
				}, 
				options.db.retryMiliSeconds);
		} else {
			// stop the timer
			if (timer !== null) {
				clearTimeout(timer);
				timer = null;
			}
	    	attempts = 0;

			// report success via callback
			callback && callback(null, dbConnection);
		}
	});
};

var getConnectedState = function () {
	var state = "";
	switch (dbConnection.readyState)
	{
		case 0: state = 'disconnected'; break;
		case 1: state = 'connected'; break;
		case 2: state = 'connecting'; break;
		case 3: state = 'disconnecting'; break;
		case 99: state = 'uninitialized'; break;
	}

	return state;
};

var connect = function () {
	var promise = new Promise();
	//console.log("Starting DB connection...");

	attempts = 0;

  	internalConnect(false, function (err, res) {
		if (err) {
			promise.reject(err);
		} else {
			promise.fulfill();
		}
	});

	return promise;
};

var	disconnect = function () {
	duringDisconnect = true;
	var promise = new Promise();

	//console.log("Stopping DB connection...");

	// stop re-connect timer, if any
	if (timer !== null) {
		clearTimeout(timer);
		timer = null;
	}

	// close DB connection
	dbConnection.close(function (err, res) {
		duringDisconnect = false;

		if (err) {
			promise.reject(err);
		} else {
			promise.fulfill();
		}
	});

	return promise;
};

var isConnected = function () {
	return (dbConnection.readyState === 1);
};

var PointSchema = new Schema({
	latitude: { type: Number, min: -90, max: 90 },
	longitude: { type: Number, min: -180, max: 180 },
	distPrev: Number,
	distStart: Number,
	elevation: Number
});

//var PointArraySchema = new Schema({
//	points: [PointSchema]
//});

var PointModel = dbConnection.model('PointModel', PointSchema);
//var PointArrayModel = dbConnection.model('PointArrayModel', PointArraySchema);

// setup mongoose event handlers
setupEventHandlers();

module.exports = {
	connect : connect,
	disconnect : disconnect,
	isConnected : isConnected,
	connection : dbConnection,
	PointModel : PointModel
};
