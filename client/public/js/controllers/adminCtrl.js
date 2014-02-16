'use strict';

app.controller('AdminCtrl', ['$scope', '$upload',
  function($scope, $upload) {
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