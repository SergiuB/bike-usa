'use strict';

/* Services */

// Demonstrate how to register services
// In this case it is a simple value service.

angular.module('myApp.services').service('estimationService', function($q, $rootScope) {

  function newton(a, b, d, f, h) {
    var g = 20;
    for (var i = 1; 10 > i; i++) {
      var e = g + b,
        e = g - (g * (a * e * e + d) - f * h) / (a * (3 * g + b) * e + d);
      if (0.05 > Math.abs(e - g)) return e;
      g = e;
    }
    return 0;
  }

  var getEstimatedTime = function(power /*W*/ , grade, headwind /*kph*/ , distance /*km*/ , elevation /*m*/ ) {
    var tireValues = [0.005, 0.004, 0.012], // clincher, tubular, mtb
      aeroValues = [0.388, 0.445, 0.42, 0.3, 0.233, 0.2]; // hoods, bar tops, bar ends, drops, aerobar

    var rweightv = 75,
      bweightv = 8,
      rollingRes = tireValues[0],
      frontalArea = aeroValues[2],
      gradev = grade,
      headwindv = headwind / 3.6,
      distancev = distance,
      temperaturev = 25, // C
      elevationv = elevation,
      transv = 0.95,
      density = (1.293 - 0.00426 * temperaturev) * Math.exp(-elevationv / 7E3),
      twt = 9.8 * (rweightv + bweightv),
      A2 = 0.5 * frontalArea * density,
      tres = twt * (gradev + rollingRes),
      powerv = power,
      v = 3.6 * newton(A2, headwindv, tres, transv, powerv),
      t = 0 < v ? 60 * distancev / v : 0;
    return t;
  };

  var endOfDayPoints = [];
  this.computeDayEstimation = function(points) {
    var timeThisDay = 0,
      MAX_TIME_PER_DAY = 7 * 60, //min
      POWER = 140, //W
      lastPoint,
      curPoint;
    endOfDayPoints = [];
    for (var i = 0; i < points.length; i++) {
      curPoint = points[i];
      if (!curPoint.elevation)
        continue;
      if (lastPoint) {
        var elevationChange = curPoint.elevation - lastPoint.elevation,
          distanceChange = curPoint.distStart - lastPoint.distStart,
          grade = elevationChange / (distanceChange * 1000),
          time = getEstimatedTime(POWER, grade, 0, distanceChange, curPoint.elevation);
        timeThisDay += time;
      }
      if (timeThisDay > MAX_TIME_PER_DAY || i === points.length - 1) {
        endOfDayPoints.push(curPoint);
        timeThisDay = 0;
      }
      lastPoint = curPoint;
    }
    return endOfDayPoints;
  };

  this.getEndOfDayPoints = function() {
    return endOfDayPoints;
  };
});