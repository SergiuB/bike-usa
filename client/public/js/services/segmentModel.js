'use strict';

angular.module('myApp.services').factory('SegmentModel', ['$resource',
  function($resource) {

    var SegmentModel = $resource('/api/pathsNew/:pathId/segment/:id', {
      id: '@_id'
    });

    return SegmentModel;
  }
]);