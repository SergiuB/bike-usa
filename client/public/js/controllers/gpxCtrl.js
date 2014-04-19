'use strict';

myApp.controller('GpxCtrl', ['$scope', '$upload', 'NewPathModel', 'PathDataStore', 'adminOptionsService',
  function($scope, $upload, NewPathModel, PathDataStore, adminOptionsService) {
    $scope.paths = PathDataStore.paths;
  }
]);