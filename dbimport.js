
var db = require('./server/db/db'),
    dbImport = require('./server/db/import'),
    events = require('events'),
    eventEmitter = new events.EventEmitter();

// Start reading from stdin so we don't exit
process.stdin.resume();

// perform clean up when app is closing
eventEmitter.on('app_close_event', function () {
    console.log('Cleaning up...');

    // disconnect from DB
    db.disconnect();
});

// catches process exit
process.on('exit', function () {
    eventEmitter.emit('app_close_event');
});

// catches Ctrl+C event
process.on('SIGINT', function () {
    console.log('Ctrl+C detected.');

    process.exit(1);
});

// catches uncaught exceptions
process.on('uncaughtException', function (e) {
    console.error('Uncaught exception: ' + e.message);
    console.log(e.stack);
    
    process.exit(1);
});


// connect to DB
db.connect().then(function () {
    console.log('Importing points into DB...');

    // import points.txt file into DB
    dbImport.importPoints('./server/resources/points.txt', function (err) {
        if (err) {
            console.log('Failed to import: ' + err);

            process.exit(1);
        }

        console.log('Points were succesfully imported into DB.');

        process.stdin.pause();

        process.exit();
    });

}, function (err) {
    console.error('DB connection failed: ' + err);

    process.exit(1);
});