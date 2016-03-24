'use strict';

var module = angular.module('bigorApp.Import', [
  'bigorApp.Filters'
]);

module.controller(
    'ImportCtrl', function($scope, $location, $window, $log, ApiClient) {
  $log.log('ImportCtrl');
  
  ApiClient.getUser($location.path(), function(response) {
    if (!response.data.email) {
      $window.location.href = response.data.url;
      return;
    }
    if (!response.data.user.credentials_level ||
        response.data.user.credentials_level < 2) {
      $scope.setError('Unauthorized');
      $location.path('/controll');
    }
  });

  $scope.entity_type = 'user';
  $scope.data = '';

  $scope.submit = function() {
    ApiClient.post(
        '/' + $scope.entity_type + '/import', $scope.data, function(response) {
      $scope.setStatus('יבוא הנתונים הצליח');
    });
  };
});

