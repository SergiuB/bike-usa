'use strict';

myApp.controller('PathSelectCtrl', ['$scope', '$rootScope', 'PathDataStore',
	function($scope, $rootScope, PathDataStore) {
		$scope.firePathSelectionChange = function(path) {
			PathDataStore.firePathUIPropertyChangeEvent(path,'selected');
		};
	}
]);