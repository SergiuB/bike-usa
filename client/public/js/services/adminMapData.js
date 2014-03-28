'use strict';

angular.module('myApp.services').factory('adminMapData', ['$rootScope', 'NewPathModel',
	function($rootScope, NewPathModel) {
		return {
			selectedSegmentData: null,
		};
	}
]);