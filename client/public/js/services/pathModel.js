'use strict';

angular.module('myApp.services').factory('PathModel', ['$resource',
  function($resource) {

    function round2Decimals(num) {
      return Math.floor(num * 100) / 100;
    }

    var PathModel = $resource('/api/paths/:id', {
      id: '@id'
    }, {
      get: {
        method: 'GET',
        transformResponse: function(data, header) {
          var path = angular.fromJson(data);
          path.distanceToPointMap = {};
          path.coordinates = path.points.map(function(point) { return new google.maps.LatLng(point.lat, point.long); });
          path.points.forEach(function(point) {
            point.distPrev = round2Decimals(point.distPrev);
            point.distStart = round2Decimals(point.distStart);
            path.distanceToPointMap[point.distStart] = point;
          });
          return path;
        }
      }
    });

    PathModel.prototype.getPointsWithElevation = function() {
      return this.points.filter(function(point) {
        return angular.isDefined(point.elevation);
      });
    };
    PathModel.prototype.getTotalDistance = function() {
      var points = this.points;
      if (points && points.length)
        return Math.ceil(points[points.length - 1].distStart);
    };
    PathModel.prototype.getPointForDistance = function(distance) {
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
    PathModel.prototype.getElevationGainBetweenPoints = function(targetPoints) {
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
    PathModel.prototype.getAllPointsBetween = function(pointA, pointB, predicateFn) {
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

    PathModel.prototype.getSamplePoints = function (startDistance, endDistance, count) {
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

    return PathModel;
  }
]);