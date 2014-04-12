'use strict';

myApp.controller('PathSelectCtrl', ['$scope', '$rootScope', 'PathDataStore',
	function($scope, $rootScope, PathDataStore) {
		$scope.togglePathSelection = function(path) {
			PathDataStore.firePathUIPropertyChangeEvent(path,'selected');
		};
	}
]);