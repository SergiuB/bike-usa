module.exports = {
    development: {
        app: {
            name: 'Bike USA'
        },
        // Your mongo auth uri goes here
        // e.g. mongodb://username:server@mongoserver:10059/somecollection
        mongo_auth_uri: 'mongodb://SergiuB:sergiu123@ds053448.mongolab.com:53448/dev'
    },
    test: {},
    production: {
        app: {
            name: 'Bike USA'
        },
        // Your mongo auth uri goes here
        // e.g. mongodb://username:server@mongoserver:10059/somecollection
        mongo_auth_uri: 'mongodb://SergiuB:sergiu123@ds049237.mongolab.com:49237/heroku_app20949213'
    }
};