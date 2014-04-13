'use strict';

myApp.constant('mapFeatureConfig', [{
  "featureType": "water",
  "stylers": [{
    "color": "#2d3038"
  }]
}, {
  "featureType": "landscape",
  "stylers": [{
    "color": "#9E9E9E"
  }]
}, {
  "featureType": "poi",
  "elementType": "geometry",
  "stylers": [{
    "hue": "#ff0000"
  }, {
    "saturation": -100
  }, {
    "color": "#808080"
  }, {
    "visibility": "off"
  }]
}, {
  "featureType": "administrative",
  "elementType": "geometry.fill",
  "stylers": [{
    "visibility": "off"
  }]
}, {
  "featureType": "road",
  "elementType": "labels",
  "stylers": [{
    "visibility": "off"
  }]
}, {
  "featureType": "road",
  "stylers": [{
    "color": "#808080"
  }]
}, {
  "elementType": "labels",
  "stylers": [{
    "weight": 0.1
  }]
}, {
  "featureType": "transit",
  "stylers": [{
    "visibility": "off"
  }]
}, {
  "featureType": "administrative.neighborhood",
  "stylers": [{
    "visibility": "off"
  }]
}]);