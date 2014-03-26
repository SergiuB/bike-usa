'use strict';

myApp.controller('AdminMapCtrl', ['$scope', '$rootScope', 'mapService', 'mapFeatureConfig',
  function($scope, $rootScope, mapService, mapFeatureConfig) {
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
    $rootScope.$on('pathCtrl_pathChecked', showPath);
    $rootScope.$on('pathCtrl_pathUnchecked', hidePath);
    $rootScope.$on('segmentCtrl_pathChanged', refreshPath);
    $rootScope.$on('pathCtrl_pathToggleMarkers', toggleMarkersForPath);

    $scope.model = {
      selectedSegmentData: null
    };

    function toggleMarkersForPath(ev, path) {
      if (pathsShown[path._id]) {
        pathsShown[path._id].segmentVisuals.forEach(function(visualPointer) {
          visualPointer.marker.setMap(path.hideMarkers ? null : map);
        });
      }
    }

    function showPath(ev, path) {
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

    function hidePath(ev, path) {
      var model = $scope.model;
      if (pathsShown[path._id]) {
        pathsShown[path._id].segmentVisuals.forEach(function(visualPointer) {
          google.maps.event.removeListener(visualPointer.markerClickListener);
          visualPointer.line.setMap(null);
          visualPointer.marker.setMap(null);
        });
        delete pathsShown[path._id];
        if (model.selectedSegmentData && model.selectedSegmentData.path._id === path._id) {
          model.selectedSegmentData = null;
        }
      }
      mapFitSelectedPaths();
    }

    function refreshPath(ev, path) {
      hidePath(null, path);
      showPath(null, path);
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
          var model = $scope.model;
          if (model.selectedSegmentData) {
            stopMarker(model.selectedSegmentData.marker);
            if (marker === model.selectedSegmentData.marker)
              model.selectedSegmentData = null;
            else {
              model.selectedSegmentData = {
                marker: marker,
                segment: segment,
                segmentIndex: segmentIndex,
                path: path
              };
              startMarker(model.selectedSegmentData.marker);
            }
          } else {
            model.selectedSegmentData = {
              marker: marker,
              segment: segment,
              segmentIndex: segmentIndex,
              path: path
            };
            startMarker(model.selectedSegmentData.marker);
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