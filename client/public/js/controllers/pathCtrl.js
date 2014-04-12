'use strict';

myApp.controller('PathCtrl', ['$scope', '$rootScope', '$http', 'NewPathModel', 'PathDataStore',
	function($scope, $rootScope, $http, NewPathModel, PathDataStore) {
		$scope.fireMarkerChange = function(path) {
			PathDataStore.firePathUIPropertyChangeEvent(path, 'hideMarkers');
		};

		$scope.editName = function(path) {
			$scope.pathEditingName(path, true);
		};

		$scope.saveName = function(path) {
			path.$changeName({
				newName: path.name
			});
			$scope.pathEditingName(path, false);
		};

		$scope.loadName = function(path) {
			path.$get();
			// NewPathModel.getName({
			//     id: path._id
			// }, function(result) {
			//     path.name = result.name;
			// });
			$scope.pathEditingName(path, false);
		};

		$scope.pathSelected = function(path, value) {
			return PathDataStore.pathSelected(path, value);
		};
		$scope.pathEditingName = function(path, value) {
			return PathDataStore.pathEditingName(path, value);
		};
		$scope.pathHideMarkers = function(path, value) {
			return PathDataStore.pathHideMarkers(path);
		};

		$scope.duplicate = function(path) {
			var newPath = new NewPathModel();
			newPath.name = path.name + "_bak";
			newPath.$save(function() {
				newPath.$copySegment({
					srcPathId: path._id
				});
			});
			PathDataStore.paths.push(newPath);
		};

		$scope.removePath = function(path) {
			path.$remove(function() {
				var index = PathDataStore.paths.indexOf(path);
				PathDataStore.paths.splice(index, 1);
			});
		};
	}
]);