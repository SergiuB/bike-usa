'use strict';

myApp.controller('MainCtrl', ['$scope', '$http', '$rootScope', 'estimationService', 'NewPathModel', 'adminOptionsService', 'currentStatus', 'gpsReadingStore', 'dayService',
  function($scope, $http, $rootScope, estimationService, NewPathModel, adminOptionsService, currentStatus, gpsReadingStore, dayService) {
    var startSpinner = function() {
      var opts = {
        lines: 13, // The number of lines to draw
        length: 20, // The length of each line
        width: 10, // The line thickness
        radius: 30, // The radius of the inner circle
        corners: 1, // Corner roundness (0..1)
        rotate: 0, // The rotation offset
        direction: 1, // 1: clockwise, -1: counterclockwise
        color: '#fff', // #rgb or #rrggbb or array of colors
        speed: 1, // Rounds per second
        trail: 60, // Afterglow percentage
        shadow: false, // Whether to render a shadow
        hwaccel: false, // Whether to use hardware acceleration
        className: 'spinner', // The CSS class to assign to the spinner
        zIndex: 2e9, // The z-index (defaults to 2000000000)
        top: 'auto', // Top position relative to parent in px
        left: 'auto' // Left position relative to parent in px
      };
      var target = document.getElementById('spinner');
      var spinner = new Spinner(opts).spin(target);
    };

    $rootScope.loaded = false;
    startSpinner();

    $rootScope.dayService = dayService;
    $rootScope.currentStatus = currentStatus;
    $rootScope.gpsReadingStore = gpsReadingStore;

    adminOptionsService.load().then(function(options) {
      NewPathModel.load(options.activePathId).then(function(path) {
        $rootScope.currentPath = path;
        updateCurrentPoint();
        path.loadPoints().then(function() {
          updateCurrentPoint();
          $rootScope.dayService.computeDays();
          $rootScope.loaded = true;
        });
        $scope.totalDistance = path.getTotalDistance();
      });

      $rootScope.currentStatus.startPolling();
      $rootScope.currentStatus.getTweets();

      $rootScope.$watch('currentStatus.lastGpsReading', function(lastGpsReading) {
        if (lastGpsReading) {
          $rootScope.gpsReadingStore.addReading(lastGpsReading);
        }
        updateCurrentPoint();
      });

      $rootScope.gpsReadingStore.load().then(function() {
        $rootScope.dayService.computeDays();
      });

    });

    var updateCurrentPoint = function() {
      var path = $rootScope.currentPath;
      var lastGpsReading = $rootScope.currentStatus.lastGpsReading;
      if (lastGpsReading) {
        if (path && path.points) {
          $rootScope.currentPointIndex = path.getClosestPointToLocation(lastGpsReading);
          $rootScope.currentDistance = path.points[$scope.currentPointIndex].distStart;
        }
      }
    };

  }
]);