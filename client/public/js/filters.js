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
filter('inKm', function() {
		return function(distanceInM) {
			return Math.floor(distanceInM / 1000);
		};
	}
);