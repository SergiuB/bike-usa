'use strict';

myApp.controller('PathCtrl', ['$scope', '$rootScope', '$http', 'NewPathModel',
	function($scope, $rootScope, $http, NewPathModel) {
		

		$scope.hideShowMarkersText = function(path) {
			return path.showMarkers ? "Hide markers": "Show markers";
		};
		$scope.toggleMarkers = function(path) {
			$rootScope.$emit('pathCtrl_pathToggleMarkers', path);
		};
		$scope.pathSelectionChange = function(path) {
			if (path.selected)
				$rootScope.$emit('pathCtrl_pathChecked', path);
			else
				$rootScope.$emit('pathCtrl_pathUnchecked', path);
		};
	}
]);