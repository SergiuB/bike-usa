'use strict';

/* Services */

// Demonstrate how to register services
// In this case it is a simple value service.

angular.module('myApp.services').service('currentStatus', ['$http',
  function($http) {
    var me = this;

    me.getLastGpsReading = function() {
      return $http({
        method: 'GET',
        url: '/api/coordinates/last'
      }).
      then(function(res) {
        me.lastGpsReading = res.data;
      }, function() {
        me.lastGpsReadingError = 'Failed to get last GPS location.';
      });
    };
    me.getTweets = function() {
      $http({
        method: 'GET',
        url: '/api/tweets'
      }).then(function(res) {
        me.tweets = res.data;
      }, function() {
        me.tweetsError = 'Failed to get twee.';
      });
    };

    me.startPolling = function() {
      var me = this;
      var updateStatus = function() {
        me.getLastGpsReading();
        setTimeout(updateStatus, 60000);
      };
      updateStatus();
    };
  }
]);