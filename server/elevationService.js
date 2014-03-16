var Lazy = require("lazy"),
	Q = require("q"),
	fs = require("fs"),
	_ = require("underscore");

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

var enhanceLocationData = function(segment) {
	var prevLat, prevLong, latitude, longitude,
		distPrev = 0,
		distStart = 0;
	segment.locations.forEach(function(location) {
		if (prevLat && prevLong) {
			distPrev = getDistance(prevLat, prevLong, location.latitude, location.longitude);
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

	enhanceLocationData(segment);

	var deferred = Q.defer();
	var LOCATIONS_PER_REQUEST = 100;
	var REQUESTS_PER_BATCH = 1;
	var coordIntervals = splitCoordsInIntervals(segment.locations, 1 /*km*/ );
	var coordsForElevation = coordIntervals.map(function(coordInterval) {
		return coordInterval[coordInterval.length - 1];
	});

	var promises = [];

	// var addPromise = function(startIndex, endIndex, deffered) {
	// 	deferred = deferred || Q.defer();
	// 	if (startIndex >= coordsForElevation.length)
	// 		deferred.resolve();
	// 	else {
	// 		endIndex = Math.min(endIndex, coordsForElevation.length);
	// 		setTimeout(function() {
	// 			promises.push(getElevations(coordsForElevation.slice(startIndex, endIndex)));
	// 			addPromise(endIndex, endIndex + LOCATIONS_PER_REQUEST, deferred);
	// 		}, 1000);
	// 	}
	// 	return deferred.promise;
	// };

	for (var i = 0; i < coordsForElevation.length; i += LOCATIONS_PER_REQUEST) {
		promises.push(enqueueFn(getElevations.bind(null, coordsForElevation.slice(i, Math.min(i + LOCATIONS_PER_REQUEST, coordsForElevation.length)))));
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
	

	// var executeRequestsInBatches = function(elevationRequestFns, countPerBatch) {
	//     var deferred = Q.defer();
	//     var allResults = [];
	//     var executeBatch = function(startIndex, countPerBatch, deferred) {
	//         var isLastBatch,
	//             endIndex = startIndex + countPerBatch;
	//         if (endIndex > elevationRequestFns.length) {
	//             isLastBatch = true;
	//             endIndex = elevationRequestFns.length;
	//         }
	//         var batch = elevationRequestFns.slice(startIndex, endIndex);
	//         if (isLastBatch) {
	//             executeMultipleRequests(batch).then(function(results) {
	//                 var values = [];
	//                 results = results.forEach(function(result) {
	//                     values = values.concat(result.value);
	//                 });
	//                 allResults = allResults.concat(values);
	//                 deferred.resolve(allResults);
	//             });
	//         } else {
	//             executeMultipleRequests(batch).then(function(results) {
	//                 var values = [];
	//                 results = results.forEach(function(result) {
	//                     values = values.concat(result.value);
	//                 });
	//                 allResults = allResults.concat(values);
	//                 setTimeout(function() {
	//                     executeBatch(startIndex + countPerBatch, countPerBatch, deferred);
	//                 }, 1000);
	//             });
	//         }
	//     };
	//     executeBatch(0, countPerBatch, deferred);
	//     return deferred.promise;
	// };
	// executeRequestsInBatches(elevationRequestFns, REQUESTS_PER_BATCH).then(function(result) {
	//     var index = 0;
	//     for (var i = 0; i < coordIntervals.length; i++) {
	//         var interval = coordIntervals[i];
	//         index += interval.length;
	//         segment.locations[index - 1].push(result[i]);
	//     };
	//     console.log('Finished processing segment ' + segIndex);
	//     deferred.resolve(segment);
	// });
	return deferred.promise;
};

var counter = 0;

var callQueue = [];
var processingCallQueue = false;

var enqueueFn = function (fn) {
	var deferred = Q.defer();
	callQueue.push({
		fn:fn,
		deferred: deferred
	});
	if (!processingCallQueue) {
		console.log('Started process call queue.');
		processingCallQueue = true;
		processCallQueue();
	}
	return deferred.promise;
};

var processCallQueue = function() {
	if (!callQueue.length) {
		processingCallQueue = false;
		console.log('Done processing call queue.');
	} else {
		var fnData = callQueue.shift();
		fnData.fn.apply(null).then(function(result) {
			fnData.deferred.resolve(result);
		}, function(error) {
			fnData.deferred.reject(error);
		});
		setTimeout(processCallQueue, 200);
	}
};


var getElevations = function(coords) {
	var deferred = Q.defer(),
		elevations = [];

	for (var i = 0; i < coords.length; i++) {
		elevations.push(counter++);
	}
	console.log('Obtained elevations for ' + coords.length +
		' coordinates between [' + coords[0].latitude + ',' + coords[0].longitude + ']' +
		' and [' + coords[coords.length - 1].latitude + ',' + coords[coords.length - 1].longitude + ']');
	deferred.resolve(elevations);
	return deferred.promise;
};

// var getElevations = function(coords) {
//     var deferred = Q.defer(),
//         gm = require('googlemaps'),
//         elevations = [],
//         coordStrings = coords.map(function(coord) {
//             return coord.latitude + ',' + coord.longitude;
//         });

//     gm.elevationFromLocations(coordStrings.join('|'), function(err, response) {
//         if (response.status === 'OK') {
//             elevations = response.results.map(function(result) {
//                 return result.elevation;
//             });

//             console.log('Obtained elevations for ' + coords.length +
//                 ' coordinates between [' + coords[0].latitude + ',' + coords[0].longitude + ']' +
//                 ' and [' + coords[coords.length - 1].latitude + ',' + coords[coords.length - 1].longitude + ']')
//             deferred.resolve(elevations);

//         } else {
//             console.log('Failed to obtain elevations for ' + coords.length +
//                 ' coordinates between [' + coords[0].latitude + ',' + coords[0].longitude + ']' +
//                 ' and [' + coords[coords.length - 1].latitude + ',' + coords[coords.length - 1].longitude + ']' + 
//                 ', reason: ' + response.status);
//             deferred.reject(response.status);
//         }
//     });
//     return deferred.promise;
// };

var splitCoordsInIntervals = function(coords, intervalDistanceInKm) {
	var distanceBuffer = 0,
		coordIntervals = [],
		dataPoint,
		firstIndex;

	coordIntervals.push(coords.slice(0, 1));
	firstIndex = 1;
	for (var i = 1; i < coords.length; i++) {
		dataPoint = coords[i];
		distanceBuffer += dataPoint.distPrev;
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
		lastIndex = 0,
		fn;
	for (var i = 0; i < coords.length; i += maxLocationsPerRequest) {
		fn = _.throttle(getElevations.bind(null, coords.slice(i, Math.min(i + maxLocationsPerRequest, coords.length))), 1000);
		elevationRequestFns.push(fn);
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