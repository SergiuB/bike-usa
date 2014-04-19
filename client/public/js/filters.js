'use strict';

/* Filters */

angular.module('myApp.filters', []).
filter('interpolate', ['version',
	function(version) {
		return function(text) {
			return String(text).replace(/\%VERSION\%/mg, version);
		};
	}
]);


angular.module('myApp.filters', []).
filter('inKph', function() {
		return function(speedInMps) {
			return (speedInMps / 1000) * 3600;
		};
	}
).
filter('inKm', function() {
		return function(distanceInM) {
			return Math.floor(distanceInM / 1000);
		};
	}
);