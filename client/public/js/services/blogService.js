'use strict';

angular.module('myApp.services').service('blogService', ['$rootScope', '$http', '$q',
    function($rootScope, $http, $q) {
        var me = this;
        $http.get('/api/blogPosts').success(function(data) {
            me.entries = data;
        });

        me.getBlogEntryUrl = function(date, month) {
            if (!me.entries || ! me.entries.length)
                return;
            var be = me.entries.filter(function(entry) {
                return entry.date === date && entry.month === month;
            });
            if (be && be.length) {
                return be[0].url;
            }
        };
    }
]);