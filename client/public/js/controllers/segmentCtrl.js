'use strict';

myApp.controller('SegmentCtrl', ['$scope', '$rootScope', '$http', 'SegmentModel', 'NewPathModel',
	function($scope, $rootScope, $http, SegmentModel, NewPathModel) {
		$scope.targetPathId = null;

		$scope.$watch('model.selectedSegmentData', function(newValue, oldValue) {
			if (!newValue || !oldValue || (newValue.path._id !== oldValue.path._id))
				$scope.targetPathId = null;
		});

		$scope.getOtherPaths = function() {
			var otherPaths = $scope.paths.filter(function(path) {
				if ($scope.model.selectedSegmentData)
					return path.selected && path._id !== $scope.model.selectedSegmentData.path._id;
				return false;
			});
			// if ($scope.targetPathId === null)
			// 	$scope.targetPathId = (otherPaths.length) ? otherPaths[0]._id : null;
			return otherPaths;
		};

		$scope.getTargetPathSegments = function() {
			var targetPath = $scope.paths.filter(function(path) {
				return path._id === $scope.targetPathId;
			})[0];
			if (targetPath)
				return targetPath.segments;
			else
				return [];
		};

		var refreshPathSegments = function(pathId) {
			var path = $scope.getPath(pathId);
			NewPathModel.get({
				id: pathId
			}, function(freshPath) {
				path.segments = freshPath.segments;
				$rootScope.$emit('segmentCtrl_pathChanged', path);
			});
		};

		$scope.copySelectedSegmentToTargetPath = function(targetPathId, targetIndex) {
			var srcPathId = $scope.model.selectedSegmentData.path._id;
			var srcSegmentId = $scope.model.selectedSegmentData.segment._id;
			var targetPath = $scope.getPath(targetPathId);
			targetPath.$copySegment({
				srcPathId: srcPathId,
				srcSegmentId: srcSegmentId,
				targetIndex: targetIndex || 0
			}, function(path) {
				refreshPathSegments(targetPathId);
				path.selected = true;
			});
		};

		$scope.removeSelectedSegment = function() {
			var srcPathId = $scope.model.selectedSegmentData.path._id;
			var srcSegmentId = $scope.model.selectedSegmentData.segment._id;
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