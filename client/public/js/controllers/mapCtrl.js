'use strict';

myApp.controller('MapCtrl', ['$scope', '$rootScope', 'mapService', 'mapFeatureConfig', '$http', '$modal', 'adminOptionsService', 'currentStatus',
  function($scope, $rootScope, mapService, mapFeatureConfig, $http, $modal, adminOptionsService, currentStatus) {
    var me = this;
    // This is the minimum zoom level that we'll allow
    var minZoomLevel = 4;
    var ABSTRACTMAP = 'abstractmap';
    var map = mapService.createMap('map', {
      zoom: minZoomLevel,
      center: mapService.createLatLng({
        lat: 38.50,
        long: -90.50
      }),
      panControl: false,
      zoomControl: true,
      zoomControlOptions: {
        style: google.maps.ZoomControlStyle.LARGE,
        position: google.maps.ControlPosition.RIGHT_CENTER
      },
      //mapTypeControl: false,
      scaleControl: false,
      streetViewControl: true,
      streetViewControlOptions: {
        position: google.maps.ControlPosition.LEFT_CENTER
      },
      overviewMapControl: false,
      mapTypeControlOptions: {
        mapTypeIds: [ABSTRACTMAP, google.maps.MapTypeId.ROADMAP, google.maps.MapTypeId.TERRAIN]
      },
      mapTypeId: ABSTRACTMAP
    });

    // // Bounds for North America
    // var strictBounds = new google.maps.LatLngBounds(
    //   new google.maps.LatLng(28.70, -127.50),
    //   new google.maps.LatLng(48.85, -55.90)
    // );

    // // Listen for the dragend event
    // mapService.addEventListener(map, 'dragend', function() {
    //   if (strictBounds.contains(map.getCenter())) return;

    //   // We're out of bounds - Move the map back within the bounds

    //   var c = map.getCenter(),
    //     x = c.lng(),
    //     y = c.lat(),
    //     maxX = strictBounds.getNorthEast().lng(),
    //     maxY = strictBounds.getNorthEast().lat(),
    //     minX = strictBounds.getSouthWest().lng(),
    //     minY = strictBounds.getSouthWest().lat();

    //   if (x < minX) x = minX;
    //   if (x > maxX) x = maxX;
    //   if (y < minY) y = minY;
    //   if (y > maxY) y = maxY;

    //   map.setCenter(new google.maps.LatLng(y, x));
    // });

    // var ctaLayer = mapService.createAndShowKmlLayer(map, 'https://sites.google.com/site/sergiukmlfiles/kml-files/us_states_8.kml?attredirects=0&d=1');

    // mapService.addEventListener(map, 'maptypeid_changed', function() {
    //   if (map.getMapTypeId() !== ABSTRACTMAP)
    //     ctaLayer.setMap(null);
    //   else
    //     ctaLayer.setMap(map);
    // });

    mapService.setCustomMapType(map, ABSTRACTMAP, mapFeatureConfig, {
      name: 'Dark Theme'
    });

    // Limit the zoom level
    mapService.addEventListener(map, 'zoom_changed', function() {
      if (map.getZoom() < minZoomLevel) map.setZoom(minZoomLevel);
    });

    var mouseOverMarker;
    $scope.$on('mouseOverPoint', function(event, x) {
      if (!mouseOverMarker) {
        mouseOverMarker = mapService.createMarker();
      }
      mouseOverMarker.setPosition(mapService.createLatLng($rootScope.currentPath.getClosestPointForDistance(x)));
      mouseOverMarker.setMap(map);
    });
    $scope.$on('mouseOutPoint', function(event, x) {
      mouseOverMarker.setMap(null);
    });

    var dayRoute, dayStartMarker, dayEndMarker;
    $rootScope.$on('mouseOverDay', function(ev, day) {
      var points = $rootScope.currentPath.points;
      var dayPoints = $rootScope.currentPath.getAllPointsBetween(points[day.startPoint], points[day.endPoint]);
      if (!dayRoute) {
        dayRoute = mapService.createPolyline({
          geodesic: true,
          strokeColor: '2B4E72',
          strokeWeight: 5,
          zIndex: 5
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

    var getMonthStr = function(month) {
      var months = ['jan', 'feb', 'mar', 'Apr', 'May', 'Jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
      return months[month];
    };

    var selDayRoute, selDayStartMarker, selDayEndMarker;
    var dayInfoWindow;
    $rootScope.$on('mouseClickDay', function(ev, selectedDay) {
      var chart = $('#elevationChart').highcharts();
      // if (selDayRoute) {
      //   selDayRoute.setMap(null);
      //   selDayStartMarker.setMap(null);
      //   selDayEndMarker.setMap(null);
      // }
      if (selectedDay) {
        var points = $rootScope.currentPath.points;
        var dayPoints = $rootScope.currentPath.getAllPointsBetween(points[selectedDay.startPoint], points[selectedDay.endPoint]);
        // if (!selDayRoute) {
        //   selDayRoute = mapService.createPolyline({
        //     geodesic: true,
        //     strokeColor: '2B4E72',
        //     strokeWeight: 5,
        //     zIndex: 4
        //   });
        //   selDayStartMarker = mapService.createMarker();
        //   selDayEndMarker = mapService.createMarker();
        // }
        // var latLngArray = mapService.createLatLngArray(dayPoints);
        // selDayStartMarker.setPosition(latLngArray[0]);
        // selDayEndMarker.setPosition(latLngArray[latLngArray.length - 1]);
        // selDayRoute.setPath(latLngArray);
        // selDayRoute.setMap(map);
        // selDayStartMarker.setMap(map);
        // selDayEndMarker.setMap(map);
        if (dayPoints.length)
          mapService.fitBounds(map, mapService.createBounds(dayPoints));
        else
          mapService.panTo(map, points[selectedDay.endPoint]);

        // var marker = new google.maps.Marker({
        //   position: mapService.createLatLng(selectedDay.endPoint),
        //   map: map
        // });

        if (dayInfoWindow)
          dayInfoWindow.close();
        dayInfoWindow = new google.maps.InfoWindow({
          position: dayPoints.length ? mapService.createLatLng(dayPoints[Math.floor(dayPoints.length / 2)]) : mapService.createLatLng(points[selectedDay.endPoint])
        });
        var content = "<p>" + 'Day ' + (selectedDay.index + 1) + " - " + getMonthStr(selectedDay.month) + " " + selectedDay.date + "</p>";
        content += "<br>";
        if (selectedDay.isCurrentDay) {
          content += "<p>" + "This is the day of my last known location." + "</p>";
          content += "<p>" + "If this date is not today it means no updates were received from my phone for a while." + "</p>";
          content += "<br>";
          content += "<p>" + "Day numbers:" + "</p>";
          content += "<p class=\"indented\">" + "Distance so far: " + Math.floor(selectedDay.currentDistance / 1000) + " km</p>";
          content += "<p class=\"indented\">" + "Altitude gain so far: " + Math.floor(selectedDay.currentElevationGain) + " m</p>";
          content += "<p class=\"indented\">" + "Estimated total distance: " + Math.floor(selectedDay.distance / 1000) + " km</p>";
          content += "<p class=\"indented\">" + "Estimated total altitude gain: " + Math.floor(selectedDay.elevationGain) + " m</p>";
        } else if (selectedDay.isEstimate) {
          content += "<p>" + "This is just an estimation, don't take it too seriously :)</p>";
          content += "<br>";
          content += "<p>" + "Day numbers:" + "</p>";
          content += "<p class=\"indented\">" + "Estimated total distance: " + Math.floor(selectedDay.distance / 1000) + " km</p>";
          content += "<p class=\"indented\">" + "Estimated total altitude gain: " + Math.floor(selectedDay.elevationGain) + " m</p>";
        } else {
          //content += "<p>" + "What happened today: </p>";
          content += "<br>";
          content += "<p>" + "Day numbers:" + "</p>";
          content += "<p class=\"indented\">" + "Distance: " + Math.floor(selectedDay.distance / 1000) + " km</p>";
          content += "<p class=\"indented\">" + "Altitude gain: " + Math.floor(selectedDay.elevationGain) + " m</p>";

          if (!selectedDay.distance) {
            content += "<br>";
            content += "<p>" + "Looks like a day for chillin' or maybe no location updates received." + "</p>";
          }
        }
        dayInfoWindow.setContent(content);
        dayInfoWindow.open(map);
      }
    });

    $rootScope.$on('mouseOutDay', function(ev, day) {
      dayRoute.setMap(null);
      dayStartMarker.setMap(null);
      dayEndMarker.setMap(null);
    });

    var fromMouseOver = false;

    $rootScope.$on('mouseOverWeek', function(ev, weekDays) {
      var firstPoint = weekDays[0].prevDayEstimation ? weekDays[0].prevDayEstimation : $rootScope.currentPath.points[0],
        lastPoint = weekDays[weekDays.length - 1].dayEstimation;

      var points = [];
      points.push(firstPoint);
      weekDays.forEach(function(weekDay) {
        points.push(weekDay.dayEstimation);
      });

      fromMouseOver = true;
      mapService.fitBounds(map, mapService.createBounds(points));
    });

    $rootScope.$on('mouseOutWeek', function(ev, day) {
      fromMouseOver = true;
      mapService.fitBounds(map, strictBounds);
    });

    var route;
    var currentMarker;
    var routeSoFar;
    var realRoute;

    function showRoute(latLongCoordinates) {
      if (!route) {
        route = mapService.createPolyline({
          path: latLongCoordinates,
          map: map,
          geodesic: true,
          strokeColor: '#2790B0',
          strokeOpacity: 1.0,
          strokeWeight: 3,
          zIndex: 1
        });
      } else {
        route.setPath(latLongCoordinates);
      }
    }

    function showRouteSoFar(latLongCoordinates) {
      if (!routeSoFar) {
        routeSoFar = mapService.createPolyline({
          path: latLongCoordinates,
          geodesic: true,
          strokeColor: '#FF0000',
          strokeOpacity: 1.0,
          strokeWeight: 5,
          zIndex: 2,
          map: map
        });
      } else {
        routeSoFar.setPath(latLongCoordinates);
      }
    }

    function showRealRoute(latLongCoordinates) {
      if (!realRoute) {
        realRoute = mapService.createPolyline({
          path: latLongCoordinates,
          geodesic: true,
          strokeColor: '#FF0000',
          strokeOpacity: 1.0,
          strokeWeight: 5,
          zIndex: 3,
          map: map
        });
      } else {
        realRoute.setPath(latLongCoordinates);
      }
    }

    $rootScope.$watch('currentPath', function(path) {
      if (!path || !path.points)
        return;
      mapService.fitBounds(map, mapService.createBounds(path.points));
      var latLongCoordinates = mapService.createLatLngArray(path.points);

      showRoute(latLongCoordinates);

      var startMarker = mapService.createTargetMarker({
        position: latLongCoordinates[0],
        animation: google.maps.Animation.DROP,
        map: map
      });

      var endMarker = mapService.createTargetMarker({
        animation: google.maps.Animation.DROP,
        position: latLongCoordinates[latLongCoordinates.length - 1],
        map: map
      });
    });

    $rootScope.$watchCollection('gpsReadingStore.gpsReadings', function(gpsReadings) {
      if (gpsReadings && gpsReadings.length) {
        var latLongCoordinates = mapService.createLatLngArray(gpsReadings);
        showRealRoute(latLongCoordinates);
      }
    });

    $rootScope.$watch('currentPath.points', function(points) {
      if (points && points.length) {
        var latLongCoordinates = mapService.createLatLngArray(points);
        showRoute(latLongCoordinates);
      }
    });

    $rootScope.$watch('currentStatus.lastGpsReading', function(lastGpsReading) {
      if (!lastGpsReading)
        return;
      var curentPoint = mapService.createLatLng(lastGpsReading);

      if (!currentMarker) {
        currentMarker = mapService.createBikeMarker({
          animation: google.maps.Animation.DROP,
          position: curentPoint,
          map: map
        });

        google.maps.event.addListener(currentMarker, 'click', function() {
          if (dayInfoWindow)
            dayInfoWindow.close();
          dayInfoWindow = new google.maps.InfoWindow();
          
          var content = "";
          var date = new Date(lastGpsReading.timestamp);
          content += "<p>" + "Last location update" + "</p>";
          content += "<br>";
          content += "<p>" + date + "</p>";
          content += "<p>Bike local time: " + date.toLocaleTimeString("en-US", {
            timeZone: adminOptionsService.options.timezone || 'America/New_York'
          }) + "</p><br>";
          content += "<p>" + "Latitude: " + lastGpsReading.latitude.toFixed(3)  + "</p>";
          content += "<p>" + "Longitude: " + lastGpsReading.longitude.toFixed(3)  + "</p>";
          content += "<p>" + "Speed: " + ((lastGpsReading.speed / 1000) * 3600).toFixed(1) + " km/h</p>";

          dayInfoWindow.setContent(content);
          dayInfoWindow.open(map, currentMarker);
        });
      } else {
        currentMarker.setPosition(curentPoint);
      }

    });

    // Tweet markers
    var ModalInstanceCtrl = function($scope, $modalInstance, url) {
      $scope.url = url;
    };

    window.showTweetImage = function(url) {
      var modalInstance = $modal.open({
        templateUrl: 'twitterLargeImage.html',
        controller: ModalInstanceCtrl,
        resolve: {
          url: function() {
            return url;
          }
        }
      });
    };

    var createTweetMarker = function(tweet) {
      var tweetPoint, coord;
      if (tweet.coordinates && tweet.coordinates.coordinates) {
        coord = tweet.coordinates.coordinates;
        tweetPoint = mapService.createLatLng({
          latitude: coord[1],
          longitude: coord[0]
        });
      } else if (tweet.geo && tweet.geo.coordinates) {
        coord = tweet.geo.coordinates;
        tweetPoint = mapService.createLatLng({
          latitude: coord[0],
          longitude: coord[1]
        });
      }
      var marker = mapService.createMarker({
        position: tweetPoint,
        //map: map
      });

      google.maps.event.addListener(marker, 'click', function() {
        var tweetDate = new Date(tweet.created_at);
        var content = "";
        content += "<p>" + tweetDate.toString() + "</p>";
        content += "<p>Bike local time: " + tweetDate.toLocaleTimeString("en-US", {
          timeZone: adminOptionsService.options.timezone || 'America/New_York'
        }) + "</p><br>";
        content += "<p>" + tweet.text + "</p><br>";
        if (tweet.entities && tweet.entities.media && tweet.entities.media.length) {
          tweet.entities.media.forEach(function(photo) {
            if (photo.type === 'photo') {
              content += "<img class=\"thumbnail pull-left\" height=\"150\" src=\"" + photo.media_url + ":thumb\" width=\"150\" onclick=\"showTweetImage(\'" + photo.media_url + "\')\">";
            }
          });
        }
        tweetWindow.setContent(content);
        tweetWindow.open(map, marker);
      });

      return marker;
    };

    var addTweetMarker = function(tweet) {
      twitterMarkers.push(createTweetMarker(tweet));
    };

    var deleteMarker = function(marker) {
      marker.setMap(null);
      google.maps.event.clearInstanceListeners(marker);
    };

    var tweetWindow = new google.maps.InfoWindow();
    var twitterMarkers = [];
    var mc;
    // $rootScope.$watch('currentPath.points', function(points) {
    //   if (!points || !points.length)
    //     return;

    //   var tweets = [];
    //   for (var i = 0; i < points.length; i+=100) {
    //     tweets.push({
    //     coordinates: {
    //       coordinates: [points[i].longitude, points[i].latitude]
    //     },
    //     text: 'bogus tweet'
    //     });
    //   }

    //   twitterMarkers.forEach(deleteMarker);
    //   twitterMarkers.length = 0;
    //   tweets.forEach(addTweetMarker);
    //   var mcOptions = {
    //     gridSize: 50,
    //     maxZoom: 15
    //   };
    //   mc = new MarkerClusterer(map, twitterMarkers, mcOptions);
    //   console.log(tweets);
    // });

    $rootScope.$watch('currentStatus.tweets', function(tweets) {
      if (!tweets || !tweets.length)
        return;

      twitterMarkers.forEach(deleteMarker);
      twitterMarkers.length = 0;
      tweets.forEach(addTweetMarker);
      var mcOptions = {
        gridSize: 50,
        maxZoom: 15
      };
      mc = new MarkerClusterer(map, twitterMarkers, mcOptions);
    });
  }
]);