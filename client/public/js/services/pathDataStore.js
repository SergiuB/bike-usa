'use strict';

angular.module('myApp.services').factory('PathDataStore', ['$rootScope', '$http', '$q', 'NewPathModel',
	function($rootScope, $http, $q, NewPathModel) {

		var getPathId = function(pathOrPathId) {
			var isString = (typeof pathOrPathId === 'string');
			if (pathOrPathId && (isString || pathOrPathId._id))
				return (typeof pathOrPathId === 'string') ? pathOrPathId : pathOrPathId._id;
		};
		return  {
			paths: NewPathModel.query(),
			pathsUI: {},
			getPath: function(pathOrPathId) {
				var pathId = getPathId(pathOrPathId);
				if (pathId) {
					return this.paths.filter(function(path) {
						return path._id === pathId;
					})[0];
				}
			},
			getPathUI: function(pathOrPathId) {
				var pathId = getPathId(pathOrPathId);
				if (pathId) {
					if (!this.pathsUI[pathId])
						this.pathsUI[pathId] = {};
					return this.pathsUI[pathId];
				}
			},
			firePathUIPropertyChangeEvent: function(pathOrPathId, propName) {
				var pathUI = this.getPathUI(pathOrPathId);
				var path = this.getPath(pathOrPathId);
				if (path) {
					var oldValue = pathUI[propName];
					$rootScope.$emit('PathDataStore_' + propName + 'Changed', path, pathUI[propName]);
				}
			},
			pathUIProperty: function(pathOrPathId, propName, value) {
				var pathUI = this.getPathUI(pathOrPathId);
				var path = this.getPath(pathOrPathId);
				if (path) {
					if (typeof value !== 'undefined') {
						if (pathUI[propName] !== value) {
							var oldValue = pathUI[propName];
							pathUI[propName] = value;
							$rootScope.$emit('PathDataStore_' + propName + 'Changed', path, value, oldValue);
						}
					} else {
						return pathUI[propName];
					}
				}
			},
			pathSelected: function(pathOrPathId, value) {
				return this.pathUIProperty(pathOrPathId, 'selected', value);
			},
			pathEditingName: function(pathOrPathId, value) {
				return this.pathUIProperty(pathOrPathId, 'editingName', value);
			},
			pathHideMarkers: function(pathOrPathId, value) {
				return this.pathUIProperty(pathOrPathId, 'hideMarkers', value);
			}
		};
	}
]);