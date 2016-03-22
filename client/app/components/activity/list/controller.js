'use strict';

var module = angular.module('bigorApp.ActivityList', []);

module.controller(
    'ActivityListCtrl', function($scope, $location, $window, $log, ApiClient) {
  $log.log('ActivityListCtrl');
  
  $scope.show_box = false;
  $scope.box_content = '';
  
  $scope.showBox = function(content) {
    $log.log('showBox');
    $scope.box_content = content;
    $scope.show_box = true;
  };

  $scope.hideBox = function() {
    $scope.show_box = false;
    $scope.box_content = content;
  };

  ApiClient.getUser($location.path(), function(response) {
    if (!response.data.email) {
      $window.location.href = response.data.url;
      return;
    }
    $log.log(response.data.user);
    if (!response.data.user.credentials_level ||
        response.data.user.credentials_level < 2) {
      $scope.setError('Unauthorized');
      $location.path('/controll');
    }

    ApiClient.query('activity', function(response) {
      $log.log(response.data);
      $scope.activities = response.data;
    });
  });
});
