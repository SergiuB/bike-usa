'use strict';
// Declare app level module which depends on filters, and services
var app = angular.module('myApp', ['myApp.filters', 'myApp.services', 'myApp.directives', /*'highcharts-ng', */'ui.bootstrap', 'ngResource', 'ngRoute']).
  config(['$routeProvider', '$locationProvider', function($routeProvider, $locationProvider) {
      
    $routeProvider.
      when('/', {
        templateUrl: 'partials/index',
        controller: "IndexCtrl"
      }).
      otherwise({
        redirectTo: '/'
      });
    $locationProvider.html5Mode(true);
  }]);

angular.module('myApp.services', []).
  value('version', '0.1');