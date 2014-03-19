'use strict';

var elevationService;
var sinon = require('sinon');
var CallSequentializer = require('../../server/callSequentializer');
var DISTANCE = 200;
var INTERVAL = 1000;
var LOCATIONS_PER_REQUEST = 20;
var getDistanceStub;

describe("elevationService", function() {

  beforeEach(function() {
    // stub the google maps module
    var gmModule = {
      elevationFromLocations: function(coordString, callback) {
        var response = {
          status: 'OK',
          results: []
        };
        var coordStrings = coordString.split('|');
        for (var i = 0; i < coordStrings.length; i++) {
          response.results.push({
            elevation: i
          });
        }
        callback(null, response);
      }
    };
    elevationService = require('../../server/elevationService');
    elevationService.init(gmModule, LOCATIONS_PER_REQUEST, new CallSequentializer('getElevations', 0));
    getDistanceStub = sinon.stub(elevationService, "getDistance", function() {return DISTANCE;});
  });

  afterEach(function() { 
    elevationService.getDistance.restore();
  });

  function generateLocations(count) {
    var locations = [];
    for (var i = 1; i < count+1; i++) {
      locations.push({latitude: i, longitude: i});
    }
    return locations;
  }

  it("provides elevation for given locations", function(done) {
    elevationService.getElevations(generateLocations(5)).then(function(results) {
      expect(results).toEqual([0, 1, 2, 3, 4]);
      done();
    });
  });

  it("enhances segment locations with distance from start and distance from previous location", function() {
    var segment = {
      locations: generateLocations(10)
    };
    elevationService.enhanceLocationData(segment);
    for (var i = 1; i < segment.locations.length; i++) {
      expect(segment.locations[i].distPrev).toBe(DISTANCE);
      expect(segment.locations[i].distStart).toBe(i*DISTANCE);
    }
  });

  it("groups coordinates into intervals", function() {
    var locCount = 15;
    var segment = {
      locations: generateLocations(locCount)
    };
    elevationService.enhanceLocationData(segment);
    var sampleCoords = elevationService.groupCoordsInIntervals(segment.locations, INTERVAL);
    expect(sampleCoords.length).toBe(Math.floor(locCount / (INTERVAL/DISTANCE)) + 1);
    expect(sampleCoords[0].length).toBe(1);
    expect(sampleCoords[1].length).toBe(5);
    expect(sampleCoords[2].length).toBe(5);
    expect(sampleCoords[3].length).toBe(4);    
  });

  it("provides elevation for segment locations separated by 1km", function(done) {
    var locCount = 1000;
    var spy = sinon.spy(elevationService, "getElevations");

    var segment = {
      locations: generateLocations(1000)
    };

    elevationService.processSegment(segment, 0).then(function(segment) {
      for(var i = 0; i < segment.locations.count; i++) {
        if (i % 5)
          expect(segment.locations[i].elevation).toBe(undefined);
        else
          expect(segment.locations[i].elevation).toBe(1);
      }
      expect(spy.callCount).toBe(Math.floor((locCount / (INTERVAL/DISTANCE)) / LOCATIONS_PER_REQUEST) + 1);
      elevationService.getElevations.restore();
      done();
    });
  });
});