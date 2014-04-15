'use strict';

myApp.controller('MainCtrl', ['$scope', '$http', '$rootScope', 'estimationService', 'NewPathModel', 'adminOptionsService', 'currentStatus',
  function($scope, $http, $rootScope, estimationService, NewPathModel, adminOptionsService, currentStatus) {
    adminOptionsService.load().then(function(options) {
      NewPathModel.load(options.activePathId).then(function(path) {
        $rootScope.currentPath = path;
        updateCurrentPoint();
        path.loadPoints().then(function() {
          updateCurrentPoint();
          var dayEstimation = estimationService.computeDayEstimation(path.points);
          $rootScope.$emit('estimationsComputed', dayEstimation);
          $rootScope.daysLeft = dayEstimation.length;
        });
        $scope.totalDistance = path.getTotalDistance();
      });
    });

    currentStatus.startPolling(function(lastGpsReading, error) {
      if (lastGpsReading) {
        $rootScope.lastGpsReading = lastGpsReading;
      }
      $rootScope.lastGpsReadingError = error;
      updateCurrentPoint();
    });

    var updateCurrentPoint = function() {
      var path = $rootScope.currentPath;
      var lastGpsReading = $rootScope.lastGpsReading;
      if (lastGpsReading) {
        if (path && path.points) {
          $rootScope.currentPointIndex = path.getClosestPointToLocation(lastGpsReading);
          $rootScope.currentDistance = path.points[$scope.currentPointIndex].distStart;
        }
      }
    };
  }
]);