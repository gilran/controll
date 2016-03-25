'use strict';

controllerFunc = function($scope, $location, $window, ApiClient) {
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
};

angular
.module('bigorApp.Import', ['bigorApp.ApiClient'])
.controller(
    'ImportCtrl',
    ['$scope', '$location', '$window', 'ApiClient', controllerFunc]);

