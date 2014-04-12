'use strict';

myApp.controller('MainCtrl', ['$scope', '$http', '$rootScope', 'estimationService', 'NewPathModel', 'adminOptionsService',
  function($scope, $http, $rootScope, estimationService, NewPathModel, adminOptionsService) {
    adminOptionsService.load().then(function(options) {
      NewPathModel.get({
        id: options.activePathId
      }, function(path) {
        path.setPointsFromSegments(path.segments);
        $rootScope.currentPath = path;
        $rootScope.$emit('pathLoaded', path);

        path.loadSegments().then(function() {
          path.setPointsFromSegments(path.segmentsDeep);
          $rootScope.$emit('segmentsLoaded', path);

          var dayEstimation = estimationService.computeDayEstimation(path.points);
          $rootScope.$emit('estimationsComputed', dayEstimation);
          $scope.currentPointIndex = 4000;
          $scope.currentDistance = path.points[$scope.currentPointIndex].distStart;
          $scope.daysLeft = dayEstimation.length;
        });
        $scope.totalDistance = path.getTotalDistance();
      });
    });

  }
]);