'use strict';

var elevationService = require('../../server/elevationService');

describe("elevationService", function() {
    it("provides elevation for given locations", function() {
        expect(elevationService.testGetElevations('gigi')).toEqual(111);
    });
});