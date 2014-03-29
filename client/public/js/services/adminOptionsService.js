'use strict';

angular.module('myApp.services').service('adminOptionsService', ['$rootScope', '$http', '$q',
    function($rootScope, $http, $q) {
        var me = this;

        me.load = function() {
            var deferred = $q.defer();
            var me = this;
            $http.get('/api/admin/options').success(function(data) {
                me.options = data;
                deferred.resolve(me.options);
            });
            return deferred.promise;
        };
        me.save = function() {
            var deferred = $q.defer();
            if (me.options) {
                $http.post('/api/admin/options', me.options).
                    success(function() {
                        deferred.resolve();
                    }).
                    error(function(err) {
                        deferred.reject(err);
                    });
            } else
                deferred.reject('no options to save');
            return deferred.promise;
        };
    }
]);