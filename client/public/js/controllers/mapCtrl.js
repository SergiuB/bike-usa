'use strict';

myApp.controller('MapCtrl', ['$scope', '$rootScope', 'mapService', 'mapFeatureConfig',
  function($scope, $rootScope, mapService, mapFeatureConfig) {
    var me = this;
    // This is the minimum zoom level that we'll allow
    var minZoomLevel = 4;
    var ABSTRACTMAP = 'abstractmap';
    var map = mapService.createMap('map', {
      zoom: minZoomLevel,
      center: mapService.createLatLng({lat: 38.50, long: -90.50}),
      panControl: false,
      zoomControl: false,
      //mapTypeControl: false,
      scaleControl: false,
      streetViewControl: false,
      overviewMapControl: false,
      mapTypeControlOptions: {
        mapTypeIds: [ABSTRACTMAP, google.maps.MapTypeId.ROADMAP, google.maps.MapTypeId.TERRAIN]
      },
      mapTypeId: ABSTRACTMAP
    });

    // Bounds for North America
    var strictBounds = new google.maps.LatLngBounds(
      new google.maps.LatLng(28.70, -127.50),
      new google.maps.LatLng(48.85, -55.90)
    );

    // Listen for the dragend event
    mapService.addEventListener(map, 'dragend', function() {
      if (strictBounds.contains(map.getCenter())) return;

      // We're out of bounds - Move the map back within the bounds

      var c = map.getCenter(),
        x = c.lng(),
        y = c.lat(),
        maxX = strictBounds.getNorthEast().lng(),
        maxY = strictBounds.getNorthEast().lat(),
        minX = strictBounds.getSouthWest().lng(),
        minY = strictBounds.getSouthWest().lat();

      if (x < minX) x = minX;
      if (x > maxX) x = maxX;
      if (y < minY) y = minY;
      if (y > maxY) y = maxY;

      map.setCenter(new google.maps.LatLng(y, x));
    });

    var ctaLayer = mapService.createAndShowKmlLayer(map, 'https://sites.google.com/site/sergiukmlfiles/kml-files/us_states_8.kml?attredirects=0&d=1');

    mapService.addEventListener(map, 'maptypeid_changed', function() {
      if (map.getMapTypeId() !== ABSTRACTMAP)
        ctaLayer.setMap(null);
      else
        ctaLayer.setMap(map);
    });

    mapService.setCustomMapType(map, ABSTRACTMAP, mapFeatureConfig, {
      name: 'Abstract'
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
        position: latLongCoordinates[0],
        animation: google.maps.Animation.DROP,
        map: map
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
            position: latLongCoordinates[totalCoordsSoFar],
            map: map
          });
          var endMarker = mapService.createTargetMarker({
            animation: google.maps.Animation.DROP,
            position: latLongCoordinates[latLongCoordinates.length - 1],
            map: map
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