var Lazy = require("lazy"),
	Q = require("q"),
	fs = require("fs"),
	_ = require("underscore"),
	gm = require('googlemaps'),
	CallSequentializer = require('./callSequentializer'),
	cs = new CallSequentializer('getElevations', 200);

var LOCATIONS_PER_REQUEST = 100;

var toRad = function(degrees) {
	return degrees * Math.PI / 180;
};

/**
 * Used by unit tests to set up some test doubles
 * @param  {[type]} gmModule
 * @param  {[type]} locPerRequests
 * @param  {[type]} callSequentializer
 * @return {[type]}
 */
exports.init = function(gmModule, locPerRequests, callSequentializer) {
	gmModule && (gm = gmModule);
	LOCATIONS_PER_REQUEST && (LOCATIONS_PER_REQUEST = locPerRequests);
	callSequentializer && (cs = callSequentializer);
};

exports.getDistance = function(lat1, lon1, lat2, lon2) {
	var R = 6371; // km
	var dLat = toRad(lat2 - lat1);
	var dLon = toRad(lon2 - lon1);
	lat1 = toRad(lat1);
	lat2 = toRad(lat2);

	var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
		Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
	var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
	var d = R * c;

	return Math.floor(d * 1000); // transform in meters to avoid floating point calculation issues
};

exports.enhanceLocationData = function(segment) {
	var prevLat, prevLong, latitude, longitude,
		distPrev = 0,
		distStart = 0;
	segment.locations.forEach(function(location) {
		if (prevLat && prevLong) {
			distPrev = exports.getDistance(prevLat, prevLong, location.latitude, location.longitude);
		}

		distStart += distPrev;
		location.distPrev = distPrev;
		location.distStart = distStart;
		prevLat = location.latitude;
		prevLong = location.longitude;
	});
};



exports.processSegment = function(segment, segIndex) {
	console.log('Started processing segment ' + segIndex);

	exports.enhanceLocationData(segment);

	var deferred = Q.defer();
	var coordIntervals = exports.groupCoordsInIntervals(segment.locations, 1000 /*m*/ );
	var coordsForElevation = coordIntervals.map(function(coordInterval) {
		return coordInterval[coordInterval.length - 1];
	});

	var promises = [];

	for (var i = 0; i < coordsForElevation.length; i += LOCATIONS_PER_REQUEST) {
		promises.push(cs.enqueueCall(exports.getElevations.bind(null, coordsForElevation.slice(i, Math.min(i + LOCATIONS_PER_REQUEST, coordsForElevation.length)))));
	}

	console.log('Waiting for ' + promises.length + ' elevation requests to complete for segment ' + segIndex);

	Q.allSettled(promises).then(function(results) {
		var values = [];
		results = results.forEach(function(result) {
			values = values.concat(result.value);
		});

		var index = 0;
		for (var i = 0; i < coordIntervals.length; i++) {
			var interval = coordIntervals[i];
			index += interval.length;
			segment.locations[index - 1].elevation = values[i];
		}
		console.log('Finished processing segment ' + segIndex);
		deferred.resolve(segment);
	});
	return deferred.promise;
};

exports.getElevations = function(coords) {
	var deferred = Q.defer(),
		elevations = [],
		coordStrings = coords.map(function(coord) {
			return coord.latitude + ',' + coord.longitude;
		});

	gm.elevationFromLocations(coordStrings.join('|'), function(err, response) {
		if (response.status === 'OK') {
			elevations = response.results.map(function(result) {
				return result.elevation;
			});

			console.log('Obtained elevations for ' + coords.length +
				' coordinates between [' + coords[0].latitude + ',' + coords[0].longitude + ']' +
				' and [' + coords[coords.length - 1].latitude + ',' + coords[coords.length - 1].longitude + ']');
			deferred.resolve(elevations);

		} else {
			console.log('Failed to obtain elevations for ' + coords.length +
				' coordinates between [' + coords[0].latitude + ',' + coords[0].longitude + ']' +
				' and [' + coords[coords.length - 1].latitude + ',' + coords[coords.length - 1].longitude + ']' +
				', reason: ' + response.status);
			deferred.reject(response.status);
		}
	});
	return deferred.promise;
};

exports.groupCoordsInIntervals = function(coords, intervalDistanceInM) {
	var distanceBuffer = 0,
		coordIntervals = [],
		dataPoint,
		firstIndex;

	coordIntervals.push(coords.slice(0, 1));
	firstIndex = 1;
	for (var i = 1; i < coords.length; i++) {
		dataPoint = coords[i];
		distanceBuffer += dataPoint.distPrev;
		if (distanceBuffer >= intervalDistanceInM || i === coords.length - 1) {
			coordIntervals.push(coords.slice(firstIndex, i + 1));
			distanceBuffer = 0;
			firstIndex = i + 1;
		}
	}
	return coordIntervals;
};
