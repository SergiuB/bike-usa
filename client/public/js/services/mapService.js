'use strict';

/* Services */

// Demonstrate how to register services
// In this case it is a simple value service.

angular.module('myApp.services').service('mapService', [
  function() {
    var me = this;
    
    me.setCustomMapType = function(map, mapTypeId, mapFeatureConfig, options) {
      var customMapType = new google.maps.StyledMapType(mapFeatureConfig, options);
      map.mapTypes.set(mapTypeId, customMapType);
    };

    me.createAndShowKmlLayer = function (map, kmlUrl) {
      var ctaLayer = new google.maps.KmlLayer(kmlUrl);
      ctaLayer.setMap(map);
      return ctaLayer;
    };

    me.createMap = function(elementId, options) {
      return new google.maps.Map(document.getElementById(elementId), options);
    };

    me.addEventListener = function(map, eventName, fn) {
      google.maps.event.addListener(map, eventName, fn);
    };

    me.createTargetMarker = function(options) {
      var theOptions = {
        icon: {
          url: 'resource/icons/double_circle.png',
          anchor: {
            x: 12,
            y: 12
          }
        }
      };
      angular.extend(theOptions, options);
      return new google.maps.Marker(theOptions);
    };

    me.createBikeMarker = function(options) {
      var theOptions = {
        icon: {
          url: 'resource/icons/cycling3.png'
        }
      };
      angular.extend(theOptions, options);
      return new google.maps.Marker(theOptions);
    };

    me.createMarker = function(options) {
      return new google.maps.Marker(options);
    };

    me.createMarkerWithLabel = function(options) {
      return new MarkerWithLabel(options); 
    };

    me.createStyledMarker = function(options) {
      options.styleIcon =  new StyledIcon(StyledIconTypes.MARKER,{color:options.color,text:options.text});
      return new StyledMarker(options); 
    };

    styleIcon:new StyledIcon(StyledIconTypes.MARKER,{color:"00ff00",text:"A"}),

    me.createPolyline = function(options) {
      return new google.maps.Polyline(options);
    };

    me.createLatLng = function(point) {
      return new google.maps.LatLng(point.lat || point.latitude, point.long || point.longitude);
    };
    me.createLatLngArray = function(pointArray) {
      return pointArray.map(me.createLatLng);
    };

    me.fitBounds = function(map, bounds) {
      google.maps.event.addListenerOnce(map, 'bounds_changed', function(e) {
        map.panBy(1, 1);
      });
      map.fitBounds(bounds);
    };

    me.createBounds = function(points) {
      var bounds = new google.maps.LatLngBounds();
      points.forEach(function(point) {
        bounds.extend(me.createLatLng(point));
      });
      return bounds;
    };
  }
]);