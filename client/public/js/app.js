'use strict';
// Declare app level module which depends on filters, and services
var app = angular.module('myApp', [
    'myApp.filters', 
    'myApp.services', 
    'myApp.directives', 
    'ui.bootstrap',
    'ngResource',
    'ngRoute',
    'angularFileUpload']).
  config(['$routeProvider', '$locationProvider', function($routeProvider, $locationProvider) {
      
    $routeProvider.
      when('/playground/testcoordinates', {
        templateUrl: 'partials/testCoordinates',
        controller: "TestCoordinatesCtrl"
      }).
      when('/', {
        templateUrl: 'partials/main',
        controller: "MainCtrl"
      }).
      when('/admin', {
        templateUrl: 'partials/admin',
        controller: "AdminCtrl"
      }).
      otherwise({
        redirectTo: '/'
      });
    $locationProvider.html5Mode(true);
  }]);

angular.module('myApp.services', []).
  value('version', '0.1');