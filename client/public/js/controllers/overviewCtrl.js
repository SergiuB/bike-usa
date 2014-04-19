'use strict';

myApp.controller('OverviewCtrl', ['$scope', '$http', '$rootScope','estimationService', 'NewPathModel', 'adminOptionsService', 'currentStatus', 'gpsReadingStore', 'dayService',
  function($scope, $http, $rootScope, estimationService, NewPathModel, adminOptionsService, currentStatus, gpsReadingStore, dayService) {
    $rootScope.dayService = dayService;
    $rootScope.currentStatus = currentStatus;
    $rootScope.gpsReadingStore = gpsReadingStore;

    adminOptionsService.load().then(function(options) {
      $scope.adminOptions = adminOptionsService.options;
      $scope.bikerLocalTime = dayService.getCyclistDate();
      NewPathModel.load(options.activePathId).then(function(path) {
        $rootScope.currentPath = path;
        path.loadPoints().then(function() {
          $rootScope.currentStatus.getLastGpsReading();
          $rootScope.gpsReadingStore.load().then(function() {
            $rootScope.dayService.computeDays();
          });
        });
        $rootScope.totalDistance = path.getTotalDistance();
      });
      $rootScope.$watch('currentStatus.lastGpsReading', function(lastGpsReading) {
        updateCurrentPoint();
      });
    });
    var updateCurrentPoint = function() {
      var path = $rootScope.currentPath;
      var lastGpsReading = $rootScope.currentStatus.lastGpsReading;
      if (lastGpsReading) {
        $scope.lastLocBikerTime = dayService.getCyclistDate(lastGpsReading.timestamp);
        if (path && path.points) {
          $rootScope.currentPointIndex = path.getClosestPointToLocation(lastGpsReading);
          $rootScope.currentDistance = path.points[$scope.currentPointIndex].distStart;
        }
      }
    };
  }
]);