'use strict';

myApp.controller('AdminMapCtrl', ['$scope', '$rootScope', 'mapService', 'mapFeatureConfig', 'adminMapData',
  function($scope, $rootScope, mapService, mapFeatureConfig, adminMapData) {
    var me = this;
    var pathsShown = {};
    var mapOptions = {
      zoom: 4,
      center: mapService.createLatLng({
        lat: 38.50,
        long: -90.50
      }),
    };
    var map = mapService.createMap('adminMap', mapOptions);
    $rootScope.$on('PathDataStore_selectedChanged', function(ev, path, selected) {
      if (selected)
        showPath(path);
      else
        hidePath(path);
    });
    $rootScope.$on('segmentCtrl_pathChanged', refreshPath);
    $rootScope.$on('PathDataStore_hideMarkersChanged', function(ev, path, hideMarkers) {
      if (pathsShown[path._id]) {
        pathsShown[path._id].segmentVisuals.forEach(function(visualPointer) {
          visualPointer.marker.setMap(hideMarkers ? null : map);
        });
      }
    });

    $scope.adminMapData = adminMapData;

    function showPath(path) {
      if (!pathsShown[path._id]) {
        pathsShown[path._id] = {
          path: path,
          segmentVisuals: path.segments.map(function(segment, idx) {
            return showSegment(segment, idx, path);
          })
        };
      }
      mapFitSelectedPaths();
    }

    function hidePath(path) {
      var adminMapData = $scope.adminMapData;
      if (pathsShown[path._id]) {
        pathsShown[path._id].segmentVisuals.forEach(function(visualPointer) {
          google.maps.event.removeListener(visualPointer.markerClickListener);
          visualPointer.line.setMap(null);
          visualPointer.marker.setMap(null);
        });
        delete pathsShown[path._id];
        if (adminMapData.selectedSegmentData && adminMapData.selectedSegmentData.path._id === path._id) {
          adminMapData.selectedSegmentData = null;
        }
      }
      mapFitSelectedPaths();
    }

    function refreshPath(ev, path) {
      hidePath(path);
      showPath(path);
    }

    function getSegmentCoordinates(segment) {
      var latLongCoordinates = [{
        lat: segment.startCoord[0],
        long: segment.startCoord[1]
      }, {
        lat: segment.endCoord[0],
        long: segment.endCoord[1]
      }];
      return latLongCoordinates;
    }

    function showSegment(segment, segmentIndex, path) {
      var latLongCoordinates = mapService.createLatLngArray(getSegmentCoordinates(segment));

      var marker = mapService.createStyledMarker({
        position: latLongCoordinates[1],
        map: path.hideMarkers ? null : map,
        color: path.getColor(),
        text: (segmentIndex + 1).toString(),
        // labelContent: segmentIndex.toString(),
        // labelAnchor: new google.maps.Point(22, 0),
        // labelClass: "markerLabel", // the CSS class for the label
        // labelStyle: {
        //   opacity: 0.75
        // }
      });
      var clickListener = google.maps.event.addListener(marker, "click", function(e) {
        $scope.$apply(function() {
          var adminMapData = $scope.adminMapData;
          if (adminMapData.selectedSegmentData) {
            stopMarker(adminMapData.selectedSegmentData.marker);
            if (marker === adminMapData.selectedSegmentData.marker)
              adminMapData.selectedSegmentData = null;
            else {
              adminMapData.selectedSegmentData = {
                marker: marker,
                segment: segment,
                segmentIndex: segmentIndex,
                path: path
              };
              startMarker(adminMapData.selectedSegmentData.marker);
            }
          } else {
            adminMapData.selectedSegmentData = {
              marker: marker,
              segment: segment,
              segmentIndex: segmentIndex,
              path: path
            };
            startMarker(adminMapData.selectedSegmentData.marker);
          }
        });
      });

      return {
        segment: segment,
        marker: marker,
        markerClickListener: clickListener,
        line: mapService.createPolyline({
          path: latLongCoordinates,
          map: map,
          geodesic: true,
          strokeColor: path.getColor(),
          strokeOpacity: 1.0,
          strokeWeight: 3,
          zIndex: 1
        })
      };
    }

    function toggleMarker(marker) {
      if (marker.getAnimation()) {
        marker.setAnimation(null);
        return false;
      } else {
        marker.setAnimation(google.maps.Animation.BOUNCE);
        return true;
      }
    }

    function startMarker(marker) {
      marker.setAnimation(google.maps.Animation.BOUNCE);
    }

    function stopMarker(marker) {
      marker.setAnimation(null);
    }

    function mapFitSelectedPaths() {
      var points = [];
      for (var pathId in pathsShown) {
        if (pathsShown.hasOwnProperty(pathId)) {
          var p = pathsShown[pathId].path;
          p.segments.forEach(function(segment) {
            points.push.apply(points, getSegmentCoordinates(segment));
          });
        }
      }
      mapService.fitBounds(map, mapService.createBounds(points));
    }
  }
]);