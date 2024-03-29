'use strict';
/*global myApp: true*/
// Declare app level module which depends on filters, and services
var myApp = angular.module('myApp', [
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
      when('/login', {
        templateUrl: 'partials/login',
        controller: "LoginCtrl"
      }).
      when('/blogEntry', {
        templateUrl: 'partials/blogEntry',
        controller: "BlogPostCtrl"
      }).
      when('/signup', {
        templateUrl: 'partials/signup',
        controller: "SignupCtrl"
      }).
      when('/overview', {
        templateUrl: 'partials/overview',
        controller: "OverviewCtrl"
      }).
      when('/gpx', {
        templateUrl: 'partials/gpx',
        controller: "GpxCtrl"
      }).
      otherwise({
        redirectTo: '/'
      });
    $locationProvider.html5Mode(true);
  }]);

angular.module('myApp.services', []).
  value('version', '0.1');