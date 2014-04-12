'use strict';

myApp.controller('SegmentCtrl', ['$scope', '$rootScope', '$http', 'SegmentModel', 'NewPathModel', 'PathDataStore', 'adminMapData',
	function($scope, $rootScope, $http, SegmentModel, NewPathModel, PathDataStore, adminMapData) {
		$scope.targetPathId = null;
		$scope.adminMapData = adminMapData;

		$scope.$watch('adminMapData.selectedSegmentData', function(newValue, oldValue) {
			if (!newValue || !oldValue || (newValue.path._id !== oldValue.path._id))
				$scope.targetPathId = null;
		});

		$scope.getSelectedSegmentDistance = function() {
			if ($scope.adminMapData.selectedSegmentData) {
				var locations = $scope.adminMapData.selectedSegmentData.segment.locations;
				return locations[locations.length - 1].distStart;
			}
		};

		$scope.getOtherPaths = function() {
			var otherPaths = PathDataStore.paths.filter(function(path) {
				if ($scope.adminMapData.selectedSegmentData)
					return PathDataStore.pathSelected(path) && path._id !== $scope.adminMapData.selectedSegmentData.path._id;
				return false;
			});
			return otherPaths;
		};

		$scope.getTargetPathSegments = function() {
			var targetPath = PathDataStore.getPath($scope.targetPathId);
			if (targetPath)
				return targetPath.segments;
			else
				return [];
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

		$scope.copySelectedSegmentToTargetPath = function(targetPathId, targetIndex) {
			var srcPathId = $scope.adminMapData.selectedSegmentData.path._id;
			var srcSegmentId = $scope.adminMapData.selectedSegmentData.segment._id;
			var targetPath = PathDataStore.getPath(targetPathId);
			targetPath.$copySegment({
				srcPathId: srcPathId,
				srcSegmentId: srcSegmentId,
				targetIndex: targetIndex || 0
			}, function(path) {
				refreshPathSegments(targetPathId);
			});
		};

		$scope.removeSelectedSegment = function() {
			var srcPathId = $scope.adminMapData.selectedSegmentData.path._id;
			var srcSegmentId = $scope.adminMapData.selectedSegmentData.segment._id;
			SegmentModel.get({
				pathId: srcPathId,
				id: srcSegmentId
			}, function(segment) {
				segment.$delete({
					pathId: srcPathId,
					id: srcSegmentId
				}, function() {
					refreshPathSegments(srcPathId);
				});
			});
		};
	}
]);