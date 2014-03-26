'use strict';

angular.module('myApp.services').factory('NewPathModel', ['$resource',
  function($resource) {

    var colors = [];
    var nextColorIdx = 0;
    var h = 0.1;
    for (var i = 1; i < 10; i++) {
      colors.push(randomRgbColor(h, 0.5, 0.95));
      h += 0.1;
    }

    var assignedColors = {};

    var NewPathModel = $resource('/api/pathsNew/:id', {
      id: '@_id'
    }, {
      copySegment: {
        method: 'GET',
        url: '/api/pathsNew/:id/edit'
      }
    });

    NewPathModel.prototype.getColor = function() {
      var me = this;
      if (!assignedColors[me._id]) {
        assignedColors[me._id] = colors[(nextColorIdx++) % colors.length];
      }
      return assignedColors[me._id];
    };

    //     var fibonacci = _.memoize(function(n) {
    //   return n < 2 ? n: fibonacci(n - 1) + fibonacci(n - 2);
    // });

    var hashCode = function(str) {
      var hash = 0,
        l, i, char;
      if (str.length === 0) return hash;
      for (i = 0, l = str.length; i < l; i++) {
        char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash |= 0; // Convert to 32bit integer
      }
      return hash;
    };

    function randomRgbColor(h, s, v) {
      var h_i = Math.floor(h * 6);
      var f = h * 6 - h_i;
      var p = v * (1 - s);
      var q = v * (1 - f * s);
      var t = v * (1 - (1 - f) * s);
      var r, g, b;
      switch (h_i) {
        case 0:
          r = v;
          g = t;
          b = p;
          break;
        case 1:
          r = q;
          g = v;
          b = p;
          break;
        case 2:
          r = p;
          g = v;
          b = t;
          break;
        case 3:
          r = p;
          g = q;
          b = v;
          break;
        case 4:
          r = t;
          g = p;
          b = v;
          break;
        case 5:
          r = v;
          g = p;
          b = q;
          break;
      }
      return '#' + Math.floor(r * 256).toString(16) + Math.floor(g * 256).toString(16) + Math.floor(b * 256).toString(16);
    }

    return NewPathModel;
  }
]);