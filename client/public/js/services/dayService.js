'use strict';

/* Services */

// Demonstrate how to register services
// In this case it is a simple value service.

angular.module('myApp.services').service('dayService', ['estimationService', 'gpsReadingStore', '$rootScope', 'adminOptionsService',
  function(estimationService, gpsReadingStore, $rootScope, adminOptionsService) {
    var me = this;
    var START_DATE;

    var getCyclistDate = function(dateString) {
      var time = dateString ? new Date(dateString).getTime() : new Date().getTime();
      var hoursRelativeToGMT = adminOptionsService.options.hoursRelativeToGMT || 0;
      return new Date(time + hoursRelativeToGMT * 3600 * 1000);
    };

    me.getCyclistDate = getCyclistDate;

    me.computeDays = function() {
      var i, points, path, days, estimatedDays;
      if (!$rootScope.currentPath || !$rootScope.currentPath.points)
        return;

      START_DATE = new Date(2014, adminOptionsService.options.startMonth, adminOptionsService.options.startDate);

      points = $rootScope.currentPath.points;
      path = $rootScope.currentPath;

      days = getDaysSoFar() || [];

      var distanceSoFar = 0;
      for (i = 0; i < days.length - 1; i++) {
        distanceSoFar += days[i].distance;
      }

      if (distanceSoFar) {
        me.avgPerDay = distanceSoFar / (days.length - 1);
      }

      // if no day recorded so far (journey not started?) initialize currentDay
      // for the estimation call
      var currentDay = (days.length) ?
        days[days.length - 1] : {
          date: START_DATE.getDate(),
          month: START_DATE.getMonth(),
          startPoint: 0
      };

      estimatedDays = getEstimatedDays(currentDay);

      var startIdx = 0;
      // merge estimation for current day with the current day data at this moment
      if (days.length && estimatedDays.length) {
        days[days.length - 1].endPoint = estimatedDays[0].endPoint;
        days[days.length - 1].distance = estimatedDays[0].distance;
        days[days.length - 1].elevationGain = estimatedDays[0].elevationGain;
        startIdx = 1;
      }

      // add remaining estimated days to the days array
      for (i = startIdx; i < estimatedDays.length; i++) {
        if (estimatedDays[i]) {
          days.push(estimatedDays[i]);
        }
      }

      me.estimatedDays = estimatedDays;
      me.days = days;
    };

    var getDaysSoFar = function() {
      var i;
      var days = [];
      var curIndex = 0;
      var currentDay, prevDay;
      var gpsReading;
      var gpsReadings = gpsReadingStore.gpsReadings;

      if (!$rootScope.currentPath)
        return;

      var points = $rootScope.currentPath.points;
      var path = $rootScope.currentPath;
      var nyTimestamp;
      if (!gpsReadings || !points || !gpsReadings.length || !points.length)
        return;

      gpsReading = gpsReadings[0];
      nyTimestamp = getCyclistDate(gpsReading.timestamp);
      days[0] = {
        date: nyTimestamp.getUTCDate(),
        month: nyTimestamp.getUTCMonth(),
        firstGpsReading: gpsReading,
        startPoint: path.getClosestPointToLocation(gpsReading)
      };

      for (i = 1; i < gpsReadings.length; i++) {
        gpsReading = gpsReadings[i];
        nyTimestamp = getCyclistDate(gpsReading.timestamp);
        if (days[curIndex].date !== nyTimestamp.getUTCDate()) {
          days[curIndex].lastGpsReading = gpsReadings[i - 1];
          days[curIndex].endPoint = path.getClosestPointToLocation(days[curIndex].lastGpsReading);
          days[curIndex].distance = points[days[curIndex].endPoint].distStart - points[days[curIndex].startPoint].distStart;
          days[curIndex].elevationGain = path.getElevationGain(days[curIndex].startPoint, days[curIndex].endPoint);
          curIndex++;
          days[curIndex] = {
            date: nyTimestamp.getUTCDate(),
            month: nyTimestamp.getUTCMonth(),
            firstGpsReading: gpsReading,
            startPoint: days[curIndex - 1].endPoint
          };
        }
      }
      days[curIndex].lastGpsReading = gpsReadings[gpsReadings.length - 1];
      days[curIndex].currentPoint = path.getClosestPointToLocation(days[curIndex].lastGpsReading);
      days[curIndex].currentDistance = points[days[curIndex].currentPoint].distStart - points[days[curIndex].startPoint].distStart;
      days[curIndex].currentElevationGain = path.getElevationGain(days[curIndex].startPoint, days[curIndex].currentPoint);
      days[curIndex].isCurrentDay = true;
      $rootScope.currentDay = days[curIndex];


      // return also days for which I don't have GPS readings
      var allDatesSoFar = [];
      var endDate = new Date(2014, days[days.length-1].month, days[days.length-1].date);
      endDate.setDate(endDate.getDate() + 1);
      var currentDate = new Date(START_DATE.getTime());

      while ((currentDate.getDate() !== endDate.getDate()) || (currentDate.getMonth() !== endDate.getMonth())) {
        allDatesSoFar.push(new Date(currentDate.getTime()));
        currentDate.setDate(currentDate.getDate() + 1);
      }

      var allDays = [], day;
      var j = 0;
      for (i = 0; i < allDatesSoFar.length; i++) {
        currentDate = allDatesSoFar[i];
        day = days[j];
        if (currentDate.getDate() === day.date && currentDate.getMonth() === day.month) {
          allDays.push(day);
          j++;
        } else { // empty day
          allDays.push({
            date: currentDate.getDate(),
            month: currentDate.getMonth(),
            distance: 0,
            elevationGain: 0,
            startPoint: day.endPoint || day.startPoint,
            endPoint: day.endPoint || day.startPoint,
            noData: true
          });
        }
      }

      return allDays;
    };

    var getDayOfYear = function(date) {
      var now = new Date();
      var start = new Date(now.getFullYear(), 0, 0);
      var diff = date - start;
      var oneDay = 1000 * 60 * 60 * 24;
      return Math.ceil(diff / oneDay);
    };

    var getEstimatedDays = function(startDay) {
      var path = $rootScope.currentPath;
      var points = path.points.slice(startDay.startPoint);
      var eodPoints = estimationService.computeDayEstimation(points);
      var eodPoint;
      var days = [];
      var date = new Date(2014, startDay.month, startDay.date);
      var prevDay;
      days[0] = {
        date: startDay.date,
        month: startDay.month,
        startPoint: startDay.startPoint,
        endPoint: eodPoints[0].index,
        distance: path.points[eodPoints[0].index].distStart - path.points[startDay.startPoint].distStart,
        elevationGain: path.getElevationGain(startDay.startPoint, eodPoints[0].index),
        isEstimate: true
      };
      for (var i = 1; i < eodPoints.length; i++) {
        eodPoint = eodPoints[i];
        prevDay = days[days.length - 1];
        date.setDate(date.getDate() + 1);
        days.push({
          date: date.getDate(),
          month: date.getMonth(),
          startPoint: prevDay.endPoint,
          endPoint: eodPoint.index,
          distance: path.points[eodPoint.index].distStart - path.points[prevDay.endPoint].distStart,
          elevationGain: path.getElevationGain(prevDay.endPoint, eodPoint.index),
          isEstimate: true
        });
      }
      return days;
    };
  }
]);