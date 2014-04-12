'use strict';

angular.module('myApp.services').factory('NewPathModel', ['$resource', 'SegmentModel', '$q',
  function($resource, SegmentModel, $q) {

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

    NewPathModel.prototype.setPointsFromSegments = function(segments) {
      var me = this;
      me.points = [];
      me.distanceToPointMap = {};
      var segment;
      var distance = 0;
      var point;
      for (var i = 0; i < segments.length; i++) {
        segment = segments[i];
        for (var j = 0; j < segment.locations.length; j++) {
          point = angular.extend({}, segment.locations[j]);
          // convert distance from the start of segment in distance from start of path
          point.distStart += distance;
          me.points.push(point);
          me.distanceToPointMap[point.distStart] = point;
        }
        distance += segment.locations[segment.locations.length - 1].distStart;
      }
    };

    NewPathModel.prototype.loadSegments = function() {
      var deferred = $q.defer();
      var me = this;
      me.segmentsDeep = SegmentModel.query({
        pathId: me._id
      }, function(segmentsDeep) {
        deferred.resolve();
      }, function(error) {
        deferred.reject(error);
      });
      return deferred.promise;
    };

    NewPathModel.prototype.getPointsWithElevation = function() {
      return this.points.filter(function(point) {
        return angular.isDefined(point.elevation);
      });
    };
    NewPathModel.prototype.getTotalDistance = function() {
      var points = this.points;
      if (points && points.length)
        return Math.ceil(points[points.length - 1].distStart);
    };
    NewPathModel.prototype.getPointForDistance = function(distance) {
      var distanceStr = (typeof distance === 'number') ? round2Decimals(distance).toString() : distance,
        distanceNum = (typeof distance === 'string') ? round2Decimals(parseFloat(distance)) : distance;

      if (this.distanceToPointMap) {
        var point = this.distanceToPointMap[distanceStr];
        if (!point) {
          point = this.getPointForDistance(distanceNum + 0.01);
        }
        return point;
      }
    };
    NewPathModel.prototype.getElevationGainBetweenPoints = function(targetPoints) {
      var points = this.points;
      var elevationGain = [],
        targetIndex = 0,
        targetPoint,
        currentPoint,
        prevPoint,
        gainBuffer = 0;
      for (var i = 0; i < points.length; i++) {
        targetPoint = targetPoints[targetIndex];
        currentPoint = points[i];
        if (currentPoint.distStart === targetPoint.distStart) {
          elevationGain.push(gainBuffer);
          targetIndex++;
          gainBuffer = 0;
        }
        gainBuffer += (prevPoint && currentPoint.elevation) ? Math.max(currentPoint.elevation - prevPoint.elevation, 0) : 0;
        if (currentPoint.elevation) {
          prevPoint = currentPoint;
        }
      }
      return elevationGain;
    };
    NewPathModel.prototype.getAllPointsBetween = function(pointA, pointB, predicateFn) {
      function isBetweenPoints(pointA, pointB, target) {
        var isBetween = (((target.distStart > pointA.distStart) && (target.distStart < pointB.distStart)) ||
          ((target.distStart < pointA.distStart) && (target.distStart > pointB.distStart)));
        if (predicateFn) {
          return isBetween && predicateFn(target);
        } else {
          return isBetween;
        }
      }
      return this.points.filter(isBetweenPoints.bind(null, pointA, pointB));
    };

    NewPathModel.prototype.getSamplePoints = function(startDistance, endDistance, count) {
      var me = this;
      var points = me.getPointsWithElevation(),
        pointA = me.getPointForDistance(startDistance),
        pointB = me.getPointForDistance(endDistance);
      var pointsBetween = me.getAllPointsBetween(pointA, pointB, function(point) {
        return point.elevation;
      });
      var everyXPoint = Math.floor(pointsBetween.length / count) || 1;
      var filtered = pointsBetween.filter(function(item, index) {
        if (index === 0 || index === pointsBetween.length - 1) {
          return true;
        }
        return index % everyXPoint === 0;
      });
      return filtered;
    };

    NewPathModel.prototype.getColor = function() {
      var me = this;
      if (!assignedColors[me._id]) {
        assignedColors[me._id] = colors[(nextColorIdx++) % colors.length];
      }
      return assignedColors[me._id];
    };

    function hashCode(str) {
      var hash = 0,
        l, i, char;
      if (str.length === 0) return hash;
      for (i = 0, l = str.length; i < l; i++) {
        char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash |= 0; // Convert to 32bit integer
      }
      return hash;
    }

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

    function round2Decimals(num) {
      return Math.floor(num * 100) / 100;
    }

    return NewPathModel;
  }
]);