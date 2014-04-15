'use strict';

angular.module('myApp.services').factory('NewPathModel', ['$resource', 'SegmentModel', '$q', '$http',
  function($resource, SegmentModel, $q, $http) {

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

    var toRad = function(degrees) {
      return degrees * Math.PI / 180;
    };

    var getDistance = function(lat1, lon1, lat2, lon2) {
      var R = 6371; // km
      var dLat = toRad(lat2 - lat1);
      var dLon = toRad(lon2 - lon1);
      lat1 = toRad(lat1);
      lat2 = toRad(lat2);

      var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
      var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      var d = R * c;

      return Math.floor(d * 1000); // transform in meters to avoid floating point calculation issues
    };

    NewPathModel.prototype.getClosestPointToLocation = function(location) {
      var me = this;
      var point;
      var minDistance = 10000000;
      var minPointIndex = 0;
      var distance;
      for (var i = 0; i < me.points.length; i++) {
        point = me.points[i];
        distance = getDistance(location.latitude, location.longitude, point.latitude, point.longitude);
        if (distance < minDistance) {
          minDistance = distance;
          minPointIndex = i;
        }
      }
      return minPointIndex;
    };

    var setPointsFromSegments = function(path, segments) {
      var me = path;
      me.points = [];
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
        }
        distance += segment.locations[segment.locations.length - 1].distStart;
      }
    };

    NewPathModel.prototype.setPointsFromSegments = function(segments) {
      setPointsFromSegments(this, segments);
    };

    NewPathModel.load = function(pathId) {
      var deferred = $q.defer();
      var me = this;
      me.get({
        id: pathId
      }, function(path) {
        path.setPointsFromSegments(path.segments);
        deferred.resolve(path);
      }, function(error) {
        deferred.reject(error);
      });
      return deferred.promise;
    };

    NewPathModel.prototype.loadSegments = function() {
      var deferred = $q.defer();
      var me = this;
      me.segmentsDeep = SegmentModel.query({
        pathId: me._id
      }, function(segmentsDeep) {
        me.setPointsFromSegments(segmentsDeep);
        deferred.resolve();
      }, function(error) {
        deferred.reject(error);
      });
      return deferred.promise;
    };

    NewPathModel.prototype.loadPoints = function() {
      var deferred = $q.defer();
      var me = this;
      $http({
        method: 'GET',
        url: '/api/pathsNew/' + me._id + '/point'
      }).
      success(function(data, status, headers, config) {
        me.points = data;
        deferred.resolve(me.points);
      }).
      error(function(data, status, headers, config) {
        deferred.reject('Failed to get points for path ' + me.name);
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
      var me = this,
        distanceStr = (typeof distance === 'number') ? round2Decimals(distance).toString() : distance,
        distanceNum = (typeof distance === 'string') ? round2Decimals(parseFloat(distance)) : distance;

      for (var i = me.points.length - 1; i >= 0; i--) {
        if (me.points[i].distStart === distanceNum)
          return me.points[i]
      };
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

    NewPathModel.prototype.getSamplePoints = function(pointA, pointB, count) {
      var me = this;
      var points = me.getPointsWithElevation();
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