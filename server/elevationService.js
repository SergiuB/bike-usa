var Lazy = require("lazy"),
	Q = require("q"),
	fs = require("fs");

var toRad = function(degrees) {
	return degrees * Math.PI / 180;
};

var getDistance = function(lat1, lon1, lat2, lon2) {
	var R = 6371; // km
	var dLat = toRad(lat2 - lat1);
	var dLon = toRad(lon2 - lon1);
	lat1 = toRad(lat1);
	lat2 = toRad(lat2);

	var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
		Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
	var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
	var d = R * c;

	return d;
};

exports.processSegment = function(segment, segIndex) {
	console.log('Started processing segment ' + segIndex);
	var deferred = Q.defer();
	var prevLat, prevLong, latitude, longitude,
		distanceFromLast = 0,
		distanceSoFar = 0,
		aux;
	segment.locations.forEach(function(location) {
		aux = location[0];
		latitude = location[0] = location[1];
		longitude = location[1] = aux;

		if (prevLat && prevLong) {
			distanceFromLast = getDistance(prevLat, prevLong, latitude, longitude);
		}

		distanceSoFar += distanceFromLast;
		location[2] = distanceFromLast;
		location[3] = distanceSoFar;
		prevLat = latitude;
		prevLong = longitude;
	});

	var LOCATIONS_PER_REQUEST = 100;
	var REQUESTS_PER_BATCH = 1;
	var coordIntervals = splitCoordsInIntervals(segment.locations, 1 /*km*/ );
	var coordsForElevation = coordIntervals.map(function(coordInterval) {
		return coordInterval[coordInterval.length - 1];
	});
	var elevationRequestFns = createElevationRequests(coordsForElevation, LOCATIONS_PER_REQUEST);

	var executeRequestsInBatches = function(elevationRequestFns, countPerBatch) {
		var deferred = Q.defer();
		var allResults = [];
		var executeBatch = function(startIndex, countPerBatch, deferred) {
			var isLastBatch,
				endIndex = startIndex + countPerBatch;
			if (endIndex > elevationRequestFns.length) {
				isLastBatch = true;
				endIndex = elevationRequestFns.length;
			}
			var batch = elevationRequestFns.slice(startIndex, endIndex);
			if (isLastBatch) {
				executeMultipleRequests(batch).then(function(results) {
					var values = [];
					results = results.forEach(function(result) {
						values = values.concat(result.value);
					});
					allResults = allResults.concat(values);
					deferred.resolve(allResults);
				});
			} else {
				executeMultipleRequests(batch).then(function(results) {
					var values = [];
					results = results.forEach(function(result) {
						values = values.concat(result.value);
					});
					allResults = allResults.concat(values);
					setTimeout(function() {
						executeBatch(startIndex + countPerBatch, countPerBatch, deferred);
					}, 1000);
				});
			}
		};
		executeBatch(0, countPerBatch, deferred);
		return deferred.promise;
	};
	executeRequestsInBatches(elevationRequestFns, REQUESTS_PER_BATCH).then(function(result) {
		var index = 0;
		for (var i = 0; i < coordIntervals.length; i++) {
			var interval = coordIntervals[i];
			index += interval.length;
			segment.locations[index - 1].push(result[i]);
		};
		console.log('Finished processing segment ' + segIndex);
		deferred.resolve(segment);
	});
	return deferred.promise;
}

var counter = 0;

// var getElevations = function(coords) {
//     var deferred = Q.defer(),
//         elevations = [];

//     for (var i = 0; i < coords.length; i++) {
//         elevations.push(counter++);
//     };
//     console.log('Obtained elevations for ' + coords.length + 
//     	' coordinates between [' + coords[0][0] + ',' + coords[0][1] + ']' +
//     	' and [' + coords[coords.length - 1][0] + ',' + coords[coords.length - 1][1] + ']')
//     deferred.resolve(elevations);
//     return deferred.promise;
// };

var getElevations = function(coords) {
	var deferred = Q.defer(),
		gm = require('googlemaps'),
		elevations = [],
		coordStrings = coords.map(function(coord) {
			return coord[0] + ',' + coord[1];
		});

	gm.elevationFromLocations(coordStrings.join('|'), function(err, response) {
		if (response.status === 'OK') {
			elevations = response.results.map(function(result) {
				return result.elevation;
			});

			console.log('Obtained elevations for ' + coords.length +
				' coordinates between [' + coords[0][0] + ',' + coords[0][1] + ']' +
				' and [' + coords[coords.length - 1][0] + ',' + coords[coords.length - 1][1] + ']')
			deferred.resolve(elevations);

		} else {
			console.log('Failed to obtain elevations for ' + coords.length +
				' coordinates between [' + coords[0][0] + ',' + coords[0][1] + ']' +
				' and [' + coords[coords.length - 1][0] + ',' + coords[coords.length - 1][1] + ']' + 
				', reason: ' + response.status);
			deferred.reject(response.status);
		}
	});
	return deferred.promise;
};

var getElevationsMany = function(coords) {
	var MAX_LOCATIONS_PER_REQUEST = 100;
	if (coords.length > MAX_LOCATIONS_PER_REQUEST) {
		var numRequests = Math.ceil(coords.length / MAX_LOCATIONS_PER_REQUEST),
			promises = [];
		for (var i = 0; i < numRequests; i++) {
			var startLocation = i * MAX_LOCATIONS_PER_REQUEST,
				endLocation = Math.min((i + 1) * MAX_LOCATIONS_PER_REQUEST, coords.length);
			promises.push(getElevations(coords.slice(startLocation, endLocation)));
		}
		return Q.allSettled(promises);
	} else {
		return getElevations(coords);
	}
};

var splitCoordsInIntervals = function(coords, intervalDistanceInKm) {
	var distanceBuffer = 0,
		coordIntervals = [],
		dataPoint,
		firstIndex;

	coordIntervals.push(coords.slice(0, 1));
	firstIndex = 1;
	for (var i = 1; i < coords.length; i++) {
		dataPoint = coords[i];
		distanceBuffer += dataPoint[2];
		if (distanceBuffer > intervalDistanceInKm || i === coords.length - 1) {
			coordIntervals.push(coords.slice(firstIndex, i + 1));
			distanceBuffer = 0;
			firstIndex = i + 1;
		}
	}
	return coordIntervals;
}

var createElevationRequests = function(coords, maxLocationsPerRequest) {
	var elevationRequestFns = [],
		lastIndex = 0;
	for (var i = 0; i < coords.length; i += maxLocationsPerRequest) {
		elevationRequestFns.push(getElevations.bind(null, coords.slice(i, Math.min(i + maxLocationsPerRequest, coords.length))));
	};
	return elevationRequestFns;
}

var executeMultipleRequests = function(requestFns) {
	var promises = [];
	for (var i = 0; i < requestFns.length; i++) {
		promises.push(requestFns[i]());
	}
	return Q.allSettled(promises);
};