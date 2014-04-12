'use strict';

myApp.controller('PathCtrl', ['$scope', '$rootScope', '$http', 'NewPathModel', 'PathDataStore', 'adminMapData',
	function($scope, $rootScope, $http, NewPathModel, PathDataStore, adminMapData) {
		$scope.adminMapData = adminMapData;

		$scope.toggleMarkers = function(path) {
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


		$scope.getOtherPaths = function(path) {
			var otherPaths = PathDataStore.paths.filter(function(otherPath) {
				return PathDataStore.pathSelected(otherPath) && path._id !== otherPath._id;
			});
			return otherPaths;
		};

		$scope.getPathSegments = function(pathId) {
			var targetPath = PathDataStore.getPath(pathId);
			if (targetPath)
				return targetPath.segments;
			else
				return [];
		};

		$scope.copyPathToTargetPath = function() {
			console.log('yppp');
		};


		var refreshPathSegments = function(pathId) {
			var path = PathDataStore.getPath(pathId);
			NewPathModel.get({
				id: pathId
			}, function(freshPath) {
				path.segments = freshPath.segments;
				$rootScope.$emit('segmentCtrl_pathChanged', path);
			});
		};


		$scope.copyPathToTargetPath = function(srcPath, targetPathId, targetIndex) {
			var srcPathId = srcPath._id;
			var targetPath = PathDataStore.getPath(targetPathId);
			targetPath.$copySegment({
				srcPathId: srcPathId,
				targetIndex: targetIndex || 0
			}, function(path) {
				refreshPathSegments(targetPathId);
			});
		};
	}
]);