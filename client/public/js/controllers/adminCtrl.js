'use strict';

myApp.controller('AdminCtrl', ['$scope', '$upload', 'NewPathModel', 'PathDataStore', 'adminOptionsService',
  function($scope, $upload, NewPathModel, PathDataStore, adminOptionsService) {

    $scope.paths = PathDataStore.paths;
    $scope.pathsUI = PathDataStore.pathsUI;
    $scope.getPathUI = function(pathOrPathId) {
      return PathDataStore.getPathUI(pathOrPathId);
    };
    $scope.getPath = function(pathOrPathId) {
      return PathDataStore.getPath(pathOrPathId);
    };

    adminOptionsService.load().then(function(options) {
      $scope.adminOptions = options;
      PathDataStore.paths.$promise.then(function() {
        $scope.activePath = PathDataStore.getPath(options.activePathId);
      });
    }); 

    $scope.saveActivePath = function() {
      $scope.adminOptions.activePathId = $scope.activePath._id;
      adminOptionsService.save();
    };

    $scope.onFileSelect = function($files) {
      $scope.progress = 0;
      $scope.uploadError = '';
      $scope.success = '';
      //$files: an array of files selected, each file has name, size, and type.
      for (var i = 0; i < $files.length; i++) {
        var file = $files[i];
        $scope.upload = $upload.upload({
          url: '/api/admin/kmlUpload', //upload.php script, node.js route, or servlet url
          // method: POST or PUT,
          // headers: {'headerKey': 'headerValue'},
          // withCredentials: true,
          data: {
            myObj: $scope.myModelObj
          },
          file: file,
          // file: $files, //upload multiple files, this feature only works in HTML5 FromData browsers
          /* set file formData name for 'Content-Desposition' header. Default: 'file' */
          //fileFormDataName: myFile, //OR for HTML5 multiple upload only a list: ['name1', 'name2', ...]
          /* customize how data is added to formData. See #40#issuecomment-28612000 for example */
          //formDataAppender: function(formData, key, val){} //#40#issuecomment-28612000
        })
          .progress(function(evt) {
            $scope.progress = parseInt(100.0 * evt.loaded / evt.total);
            console.log('percent: ' + $scope.progress);
          }).success(function(data, status, headers, config) {
            $scope.success = true;
          })
          .error(function(error) {
            $scope.uploadError = error;
          });
      }
    };
  }
]);