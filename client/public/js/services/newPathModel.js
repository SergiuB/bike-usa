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
        url: '/api/pathsNew/:id/edit',
        params: {
          operationType: 'copySegment'
        }
      },
      getName: {
        method: 'GET',
        url: '/api/pathsNew/:id',
        params: {
          fields: 'name'
        }
      },
      changeName: {
        method: 'GET',
        url: '/api/pathsNew/:id/edit',
        params: {
          operationType: 'changeName'
        }
      }
    });

    NewPathModel.prototype.getColor = function() {
      var me = this;
      if (!assignedColors[me._id]) {
        assignedColors[me._id] = colors[(nextColorIdx++) % colors.length];
      }
      return assignedColors[me._id];
    };

    NewPathModel.prototype.getCoords = function() {
      var me = this;
      if (!me.coords) {
        me.coords = [];
        me.segments.forEach(function(segment) {
          me.coords.push({
            latitude: segment.startCoord[0],
            longitude: segment.startCoord[1]
          }, {
            latitude: segment.endCoord[0],
            longitude: segment.endCoord[1]
          });
        });
      }
      return me.coords;
    };

    NewPathModel.prototype.getStroke = function() {
      var me = this;
      if (!me.stroke) {
        me.stroke = {
          color: me.getColor(),
          opacity: 1.0,
          weight: 3
        };
      }
      return me.stroke;
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