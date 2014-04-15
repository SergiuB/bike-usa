'use strict';

angular.module('myApp.services').factory('GpsReadingModel', ['$resource', 'SegmentModel', '$q',
  function($resource, SegmentModel, $q) {

    var GpsReadingModel = $resource('/api/coordinates/:id', {
      id: '@_id'
    });
    
    return GpsReadingModel;
  }
]);