'use strict';

app.controller('IndexCtrl', ['$scope', '$http', '$rootScope', 'estimationService', 'PathModel',
  function($scope, $http, $rootScope, estimationService, PathModel) {
    PathModel.get({
      id: 1
    }, function(path) {
      $rootScope.currentPath = path;
      $rootScope.$emit('pathLoaded', path);
      var dayEstimation = estimationService.computeDayEstimation(path.points);
      $rootScope.$emit('estimationsComputed', dayEstimation);

      $scope.totalDistance = path.getTotalDistance();
      $scope.currentPointIndex = 4000;
      $scope.currentDistance = path.points[$scope.currentPointIndex].distStart;
      $scope.daysLeft = dayEstimation.length;
    });
  }
]);

app.controller('MapCtrl', ['$scope', '$rootScope', 'estimationService', 'mapService',
  function($scope, $rootScope, estimationService, mapService) {
    var map = mapService.map,
      me = this;

    var mouseOverMarker;
    $scope.$on('mouseOverPoint', function(event, x) {
      if (!mouseOverMarker) {
        mouseOverMarker = mapService.createMarker();
      }
      mouseOverMarker.setPosition(mapService.createLatLng($rootScope.currentPath.getPointForDistance(x)));
      mouseOverMarker.setMap(map);
    });
    $scope.$on('mouseOutPoint', function(event, x) {
      mouseOverMarker.setMap(null);
    });

    var dayRoute, dayStartMarker, dayEndMarker;
    $rootScope.$on('mouseOverDay', function(ev, day) {
      var dayPoints = $rootScope.currentPath.getAllPointsBetween(day.dayEstimation, (day.prevDayEstimation) ? day.prevDayEstimation : $rootScope.currentPath.points[0]);
      if (!dayRoute) {
        dayRoute = mapService.createPolyline({
          geodesic: true,
          strokeColor: '2B4E72',
          strokeWeight: 5,
          zIndex: 3
        });
        dayStartMarker = mapService.createMarker();
        dayEndMarker = mapService.createMarker();
      }
      var latLngArray = mapService.createLatLngArray(dayPoints);
      dayStartMarker.setPosition(latLngArray[0]);
      dayEndMarker.setPosition(latLngArray[latLngArray.length - 1]);
      dayRoute.setPath(latLngArray);
      dayRoute.setMap(map);
      dayStartMarker.setMap(map);
      dayEndMarker.setMap(map);
    });

    $rootScope.$on('mouseOutDay', function(ev, day) {
      dayRoute.setMap(null);
      dayStartMarker.setMap(null);
      dayEndMarker.setMap(null);
    });

    var fromMouseOver = false;
    var routeSoFar;

    $rootScope.$on('mouseOverWeek', function(ev, weekDays) {
      var firstPoint = weekDays[0].prevDayEstimation ? weekDays[0].prevDayEstimation : $rootScope.currentPath.points[0],
        lastPoint = weekDays[weekDays.length - 1].dayEstimation;
      console.log(lastPoint, firstPoint);

      var points = [];
      points.push(firstPoint);
      weekDays.forEach(function(weekDay) {
        points.push(weekDay.dayEstimation);
      });

      fromMouseOver = true;
      mapService.fitBounds(mapService.createBounds(points));
    });

    $rootScope.$on('mouseOutWeek', function(ev, day) {
      fromMouseOver = true;
      mapService.fitBounds(mapService.getMainBounds());
    });

    $rootScope.$on('pathLoaded', function(ev, path) {
      var latLongCoordinates = mapService.createLatLngArray(path.points);
      var route = mapService.createPolyline({
        path: latLongCoordinates,
        map: map,
        geodesic: true,
        strokeColor: '#2790B0',
        strokeOpacity: 1.0,
        strokeWeight: 3,
        zIndex: 1
      });

      var startMarker = mapService.createTargetMarker({
        pos: latLongCoordinates[0],
        animation: google.maps.Animation.DROP
      });

      routeSoFar = mapService.createPolyline({
        path: [latLongCoordinates[0], latLongCoordinates[0]],
        geodesic: true,
        strokeColor: '#FF0000',
        strokeOpacity: 1.0,
        strokeWeight: 5,
        zIndex: 2,
        map: map
      });

      var step = 0;
      var numSteps = 100; //Change this to set animation resolution
      var timePerStep = 5; //Change this to alter animation speed;
      var totalCoordsSoFar = 4000;
      var coordsPerStep = totalCoordsSoFar / numSteps;
      var pathSoFar = [latLongCoordinates[0]];
      var pathForStep = [];
      var interval = setInterval(function() {
        step += 1;
        if (step > numSteps) {
          clearInterval(interval);
          var currentMarker = mapService.createTargetMarker({
            animation: google.maps.Animation.DROP,
            pos: latLongCoordinates[totalCoordsSoFar]
          });
          var endMarker = mapService.createTargetMarker({
            animation: google.maps.Animation.DROP,
            pos: latLongCoordinates[latLongCoordinates.length - 1]
          });
        } else {
          pathForStep = latLongCoordinates.slice((step - 1) * coordsPerStep, step * coordsPerStep);
          pathSoFar = pathSoFar.concat(pathForStep);
          routeSoFar.setPath(pathSoFar);
        }
      }, timePerStep);
    });
  }
]);

app.controller('ChartCtrl', ['$scope', '$rootScope', 'estimationService',
  function($scope, $rootScope, estimationService) {

    function afterSetExtremes(e) {
      var min = 0;
      var max = lastPoint.distStart;
      if (!isReset) {
        min = e.min;
        max = e.max;
      }

      var newData = $rootScope.currentPath.getSamplePoints(min, max, 500).map(function(point) {
        return [point.distStart, point.elevation];
      });
      var chart = $('#elevationChart').highcharts();
      chart.series[0].setData(newData);
    }

    var isReset = false;

    var firstPoint, lastPoint;
    $rootScope.$on('estimationsComputed', function(ev, endOfDayPoints) {
      var path = $rootScope.currentPath;
      var pointsWithElevation = path.getPointsWithElevation();
      firstPoint = pointsWithElevation[0];
      lastPoint = pointsWithElevation[pointsWithElevation.length - 1];

      var options = {
        chart: {
          type: 'area',
          backgroundColor: 'rgba(61,64,72,1)',
          zoomType: 'x'
        },

        legend: {
          enabled: false
        },

        plotOptions: {
          series: {
            enableMouseTracking: true
          },
          area: {
            point: {
              events: {
                mouseOver: function(ev) {
                  $rootScope.$broadcast('mouseOverPoint', ev.target.x);
                },
                mouseOut: function(ev) {
                  $rootScope.$broadcast('mouseOutPoint', ev.target.x);
                }
              }
            },
            marker: {
              enabled: false
            }
          }
        },
        series: [{
          data: path.getSamplePoints(firstPoint.distStart, lastPoint.distStart, 500).map(function(point) {
            return [point.distStart, point.elevation];
          })
        }],
        title: {
          text: '',
        },
        xAxis: {
          events: {
            afterSetExtremes: afterSetExtremes,
            setExtremes: function(e) {
              if (e.max === undefined && e.min === undefined) {
                isReset = true;
              } else {
                isReset = false;
              }
            }
          },
          title: {
            text: 'Distance (KM)',
            style: {
              fontFamily: '"Carrois Gothic SC", sans-serif',
              textTransform: 'uppercase',
              color: 'white',
              fontSize: '16px'
            }
          }
        },
        yAxis: {
          title: {
            text: 'Elevation (m)',
            style: {
              fontFamily: '"Carrois Gothic SC", sans-serif',
              textTransform: 'uppercase',
              color: 'white',
              fontSize: '16px'
            }
          }
        },

        loading: false
      };

      $('#elevationChart').highcharts(options);

      $rootScope.$on('mouseOverWeek', function(ev, weekDays) {
        var chart = $('#elevationChart').highcharts();
        var zoomFrom = weekDays[0].prevDayEstimation ? weekDays[0].prevDayEstimation.distStart : 0;
        var zoomTo = weekDays[weekDays.length - 1].dayEstimation.distStart;
        chart.xAxis[0].setExtremes(zoomFrom, zoomTo);
      });

      $rootScope.$on('mouseOutWeek', function(ev, weekDays) {
        var chart = $('#elevationChart').highcharts();
        chart.xAxis[0].setExtremes(firstPoint.distStart, lastPoint.distStart);
      });

      $rootScope.$on('mouseOverDay', function(ev, day) {
        var chart = $('#elevationChart').highcharts();

        var from = (day.prevDayEstimation) ? day.prevDayEstimation.distStart : 0;
        var to = day.dayEstimation.distStart;
        chart.xAxis[0].addPlotBand({
          from: from,
          to: to,
          color: '#2790B0',
          id: 'day-band'
        });
        chart.xAxis[0].addPlotLine({
          value: from,
          width: 2,
          color: '#2B4E72',
          id: 'day-line-start',
          label: {
            x: -12,
            text: 'Km ' + from.toFixed(0),
            style: {
              fontFamily: '"Pathway Gothic One", sans-serif',
              fontSize: '14px',
              color: 'white'
            }
          }
        });
        chart.xAxis[0].addPlotLine({
          value: to,
          width: 2,
          color: '#2B4E72',
          id: 'day-line-end',
          label: {
            text: 'KM ' + to.toFixed(0),
            style: {
              fontFamily: '"Pathway Gothic One", sans-serif',
              fontSize: '14px',
              color: 'white'
            }
          }
        });
      });

      $rootScope.$on('mouseOutDay', function(ev, day) {
        var chart = $('#elevationChart').highcharts();
        chart.xAxis[0].removePlotBand('day-band');
        chart.xAxis[0].removePlotLine('day-line-start');
        chart.xAxis[0].removePlotLine('day-line-end');
      });
    });
  }
]);

app.controller('DayCarouselCtrl', ['$scope', '$rootScope',
  function($scope, $rootScope) {
    $rootScope.$on('estimationsComputed', function(ev, dayEstimation) {
      var months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
      var elevationGains = $rootScope.currentPath.getElevationGainBetweenPoints(dayEstimation);
      var startDate = new Date();
      startDate.setFullYear(2014, 3, 22);
      $scope.daysLeft = dayEstimation.length;
      var slides = $scope.slides = [];
      for (var i = 0; i < dayEstimation.length; i++) {
        if (i % 7 === 0) {
          slides.push({

            days: []
          });
        }
        slides[Math.floor(i / 7)].days.push({
          index: i,
          distance: i ? dayEstimation[i].distStart - dayEstimation[i - 1].distStart : dayEstimation[i].distStart,
          elevationGain: elevationGains[i],
          dayEstimation: dayEstimation[i],
          prevDayEstimation: dayEstimation[i - 1],
          date: '' + months[startDate.getMonth()] + ' ' + startDate.getDate()
        });
        startDate.setDate(startDate.getDate() + 1);
      }

      $scope.mouseOverDay = function(day) {
        $rootScope.$emit('mouseOverDay', day);
      };

      $scope.mouseOutDay = function(day) {
        $rootScope.$emit('mouseOutDay', day);
      };

      var mouseIsOverWeek = false;
      $scope.mouseOverWeek = function(day) {
        $rootScope.$emit('mouseOverWeek', $scope.slides.filter(function(slide) {
          return slide.active;
        })[0].days);
        mouseIsOverWeek = true;
      };

      $scope.mouseOutWeek = function() {
        $rootScope.$emit('mouseOutWeek');
        mouseIsOverWeek = false;
      };

      $scope.$watch('slides', function(slides) {
        if (mouseIsOverWeek)
          $rootScope.$emit('mouseOverWeek', slides.filter(function(slide) {
            return slide.active;
          })[0].days);
      }, true);
    });

  }
]);