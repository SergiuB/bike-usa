'use strict';

/* Services */

// Demonstrate how to register services
// In this case it is a simple value service.

angular.module('myApp.services').service('mapService', ['mapFeatureConfig',
  function(mapFeatureConfig) {
    var me = this;
    // This is the minimum zoom level that we'll allow
    var minZoomLevel = 4;

    var ABSTRACTMAP = 'abstractmap';

    me.map = new google.maps.Map(document.getElementById('map'), {
      zoom: minZoomLevel,
      center: new google.maps.LatLng(38.50, -90.50),
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
    google.maps.event.addListener(me.map, 'dragend', function() {
      if (strictBounds.contains(me.map.getCenter())) return;

      // We're out of bounds - Move the map back within the bounds

      var c = me.map.getCenter(),
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

      me.map.setCenter(new google.maps.LatLng(y, x));
    });

    // Limit the zoom level
    google.maps.event.addListener(me.map, 'zoom_changed', function() {
      if (me.map.getZoom() < minZoomLevel) me.map.setZoom(minZoomLevel);
    });

    var styledMapOptions = {
      name: 'Abstract'
    };

    var customMapType = new google.maps.StyledMapType(mapFeatureConfig, styledMapOptions);

    me.map.mapTypes.set(ABSTRACTMAP, customMapType);

    var ctaLayer = new google.maps.KmlLayer('https://sites.google.com/site/sergiukmlfiles/kml-files/us_states_8.kml?attredirects=0&d=1');
    ctaLayer.setMap(me.map);

    google.maps.event.addListener( me.map, 'maptypeid_changed', function() { 
        if (me.map.getMapTypeId() !== ABSTRACTMAP)
          ctaLayer.setMap(null);
        else 
          ctaLayer.setMap(me.map);
    } );

    me.createTargetMarker = function(options) {
      var pos = (options) ? options.pos : undefined;
      var animation = (options) ? options.animation : undefined;
      return new google.maps.Marker({
        map: me.map,
        position: pos,
        animation: animation,
        icon: {
          url: 'resource/icons/double_circle.png',
          anchor: {
            x: 12,
            y: 12
          }
        }
      });
    };

    me.createBikeMarker = function(options) {
      var pos = (options) ? options.pos : undefined;
      var animation = (options) ? options.animation : undefined;
      return new google.maps.Marker({
        map: me.map,
        position: pos,
        animation: animation,
        icon: {
          url: 'resource/icons/cycling.png'
        }
      });
    };

    me.createMarker = function(options) {
      var pos = (options) ? options.pos : undefined;
      var animation = (options) ? options.animation : undefined;
      return new google.maps.Marker({
        map: me.map,
        position: pos,
        animation: animation
      });
    };

    me.createPolyline = function(options) {
      return new google.maps.Polyline(options);
    };

    me.createLatLng = function(point) {
      return new google.maps.LatLng(point.lat, point.long);
    };
    me.createLatLngArray = function(pointArray) {
      return pointArray.map(me.createLatLng);
    };

    me.getMainBounds = function() { return strictBounds; };

    me.fitBounds = function(bounds) {
      google.maps.event.addListenerOnce(me.map, 'bounds_changed', function(e) {
        me.map.panBy(1, 1);
      });
      me.map.fitBounds(bounds);
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