module.exports = {
    development: {
        root: require('path').normalize(__dirname + '/..'),
        app: {
            name: 'Bike USA'
        },
        // Your mongo auth uri goes here
        // e.g. mongodb://username:server@mongoserver:10059/somecollection
        mongo_auth_uri: 'mongodb://localhost/bikeusa'
    },
    test: {},
    production: {}
};