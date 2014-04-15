'use strict';

/* Services */

// Demonstrate how to register services
// In this case it is a simple value service.

angular.module('myApp.services').service('currentStatus', [ '$http',
  function($http) {
    var me = this;
    
    me.getLastGpsReading = function() {
      return $http({method: 'GET', url: '/api/coordinates/last'});
    };

    me.startPolling = function(updateCallback) {
      var me = this;
      var updateStatus = function() {
        me.getLastGpsReading().then(function(res) {
          updateCallback.call(null, res.data);
        }, function() {
          updateCallback.call(null, null, 'Failed to get last location.');
        });
        setTimeout(updateStatus, 6000);
      };
      updateStatus();
    };
  }
]);