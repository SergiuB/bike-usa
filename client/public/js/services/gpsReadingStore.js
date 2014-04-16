'use strict';

angular.module('myApp.services').service('gpsReadingStore', ['$rootScope', '$http', '$q', 'GpsReadingModel',
	function($rootScope, $http, $q, GpsReadingModel) {
		var me = this;

		me.load = function() {
			me.gpsReadings = GpsReadingModel.query();
			return me.gpsReadings.$promise;
		};

		me.addReading = function(gpsReading) {
			if (me.gpsReadings && me.gpsReadings.length && gpsReading._id !== me.gpsReadings[me.gpsReadings.length - 1]._id)
				me.gpsReadings.push(gpsReading);
		};
	}
]);