var Twitter = require('twitter');

exports.getTweets = function(req, res) {
	var twit = new Twitter({
		consumer_key: 'a05Hf9HKrb72L72MlvcFZ1IcN',
		consumer_secret: 'hqnK5NNRvvQwq1CinGpYhgaSy3HJSaYiaFUPvdyBjMQi2HF98K',
		access_token_key: '2441370204-NpiCAafDgGSA3hNCkiPT2XJ5SrAxwgIm0ACv7IA',
		access_token_secret: '7DZuOvBitjcq4dnzrl07IM2HS3GC5TuEP8K5Ow78MYoKX'
	});
	twit.get('/statuses/user_timeline.json', {
		screen_name: "bikeacrossusa"
	}, function(data) {
		res.send(data.filter(function(tweet) {
			return tweet.geo || tweet.coordinates;
		}));
	});
};

exports.getTweetWidget = function(req, res) {
	var tweetId = req.param('tweetId');
	var twit = new Twitter({
		consumer_key: 'a05Hf9HKrb72L72MlvcFZ1IcN',
		consumer_secret: 'hqnK5NNRvvQwq1CinGpYhgaSy3HJSaYiaFUPvdyBjMQi2HF98K',
		access_token_key: '2441370204-NpiCAafDgGSA3hNCkiPT2XJ5SrAxwgIm0ACv7IA',
		access_token_secret: '7DZuOvBitjcq4dnzrl07IM2HS3GC5TuEP8K5Ow78MYoKX'
	});
	console.log('getting twitter widget for tweet ' + tweetId);
	twit.get('/statuses/oembed.json', {
		id: tweetId,
		omit_script: true,
		hide_media: false
	}, function(data) {
		res.send(data);
	});
};