'use strict';

myApp.controller('ChartCtrl', ['$scope', '$rootScope', 'estimationService',
  function($scope, $rootScope, estimationService) {

    function afterSetExtremes(e) {
      // var min = 0;
      // var max = lastPoint.distStart;
      // if (!isReset) {
      //   min = e.min;
      //   max = e.max;
      // }

      // var pointA = $rootScope.currentPath.getClosestPointForDistance(min);
      // var pointB = $rootScope.currentPath.getClosestPointForDistance(max);

      // var newData = $rootScope.currentPath.getSamplePoints(pointA, pointB, 500).map(function(point) {
      //   return [point.distStart, point.elevation];
      // });
      var chart = $('#elevationChart').highcharts();
      // chart.series[0].setData(newData);
      // 
      if (!chart.resetZoomButton && !isReset) {
        chart.showResetZoom();
      }
    }

    var isReset = false;

    var firstPoint, lastPoint;
    $rootScope.$watch('loaded', function(loaded) {
      if (!loaded)
        return;
      var path = $rootScope.currentPath;
      firstPoint = path.points[0];
      lastPoint = path.points[path.points.length - 1];

      var options = {
        chart: {
          type: 'area',
          backgroundColor: 'rgba(61,64,72,0.7)',
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
          data: path.getSamplePoints(firstPoint, lastPoint, 1000).map(function(point) {
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
          labels: {
            formatter: function() {
              return (parseFloat(this.value) / 1000) + 'km';
            },
            style: {
              color: '#FFFFFF'
            }
          },
          reversed: true
          // title: {
          //   text: 'Distance (KM)',
          //   style: {
          //     fontFamily: '"Carrois Gothic SC", sans-serif',
          //     textTransform: 'uppercase',
          //     color: 'white',
          //     fontSize: '12px'
          //   }
          // }
        },
        yAxis: {
          title: false,
          // title: {
          //   text: 'Elevation (m)',
          //   style: {
          //     fontFamily: '"Carrois Gothic SC", sans-serif',
          //     textTransform: 'uppercase',
          //     color: 'white',
          //     fontSize: '12px'
          //   }
          // },
          min: 0,
          labels: {
            formatter: function() {
              return parseFloat(this.value) + 'm';
            },
            style: {
              color: '#FFFFFF'
            }
          }
        },

        tooltip: {
          formatter: function() {
            return 'Distance: <b>' + Math.floor(this.x / 1000) + 'km</b><br>Elevation: <b>' + Math.floor(this.y) + 'm</b>';
          }
        },

        loading: false
      };

      $('#elevationChart').highcharts(options);

      // $rootScope.$on('mouseOverWeek', function(ev, weekDays) {
      //   var chart = $('#elevationChart').highcharts();
      //   var zoomFrom = weekDays[0].prevDayEstimation ? weekDays[0].prevDayEstimation.distStart : 0;
      //   var zoomTo = weekDays[weekDays.length - 1].dayEstimation.distStart;
      //   chart.xAxis[0].setExtremes(zoomFrom, zoomTo);
      // });

      // $rootScope.$on('mouseOutWeek', function(ev, weekDays) {
      //   var chart = $('#elevationChart').highcharts();
      //   chart.xAxis[0].setExtremes(firstPoint.distStart, lastPoint.distStart);
      // });

      $rootScope.$on('mouseOverDay', function(ev, day) {
        if (!$rootScope.selectedDay) {
          var chart = $('#elevationChart').highcharts();
          var points = $rootScope.currentPath.points;

          var from = points[day.startPoint].distStart;
          var to = points[day.endPoint].distStart;
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
              text: 'Km ' + (from / 1000).toFixed(0),
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
              x: -12,
              text: 'KM ' + (to / 1000).toFixed(0),
              style: {
                fontFamily: '"Pathway Gothic One", sans-serif',
                fontSize: '14px',
                color: 'white'
              }
            }
          });
        }

        // extremesBak = chart.xAxis[0].getExtremes();
        // chart.xAxis[0].setExtremes(from, to);
      });

      var clearDayBand = function() {
        var chart = $('#elevationChart').highcharts();
        chart.xAxis[0].removePlotBand('day-band');
        chart.xAxis[0].removePlotLine('day-line-start');
        chart.xAxis[0].removePlotLine('day-line-end');
      };

      $rootScope.$on('mouseOutDay', function(ev, day) {
        clearDayBand();
      });

      $rootScope.$on('mouseClickDay', function(ev, selectedDay) {
        var chart = $('#elevationChart').highcharts();
        var points = $rootScope.currentPath.points;
        if (selectedDay) {
          clearDayBand();
          chart.xAxis[0].zoom(points[selectedDay.startPoint].distStart, points[selectedDay.endPoint].distStart);
        } else {
          chart.xAxis[0].zoom(0, points[points.length - 1].distStart);
        }
        chart.redraw();
      });
    });
  }
]);

myApp.controller('DayCarouselCtrl', ['$scope', '$rootScope',
  function($scope, $rootScope) {
    $rootScope.$watch('dayService.days', function(days) {
      if (!days)
        return;
      ;
      var slides = $scope.slides = [];
      for (var i = 0; i < days.length; i++) {
        if (i % 7 === 0) {
          slides.push({
            days: [],
            index: Math.floor(i / 7)
          });
        }
        days[i].index = i;
        slides[Math.floor(i / 7)].days.push(days[i]);
        if (days[i].isCurrentDay)
          slides[Math.floor(i / 7)].active = true;
      }

      $scope.mouseClickDay = function(day) {
        $rootScope.$emit('mouseClickDay', day);
        console.log(day);
      };

      $scope.mouseOverDay = function(day) {
        $rootScope.$emit('mouseOverDay', day);
      };

      $scope.mouseOutDay = function(day) {
        $rootScope.$emit('mouseOutDay', day);
      };

      var mouseIsOverWeek = false;
      $scope.mouseOverWeek = function(day) {
        // $rootScope.$emit('mouseOverWeek', $scope.slides.filter(function(slide) {
        //   return slide.active;
        // })[0].days);
        // mouseIsOverWeek = true;
      };

      $scope.mouseOutWeek = function() {
        // $rootScope.$emit('mouseOutWeek');
        // mouseIsOverWeek = false;
      };

      $scope.$watch('slides', function(slides) {
        if (mouseIsOverWeek)
          $rootScope.$emit('mouseOverWeek', slides.filter(function(slide) {
            return slide.active;
          })[0].days);
      }, true);

      $scope.getMonthStr = function(month) {
        var months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
        return months[month];
      };
    });

  }
]);

myApp.controller('LoginCtrl',
  function() {}
);
myApp.controller('BlogPostCtrl',
  function() {}
);
myApp.controller('SignupCtrl',
  function() {}
);