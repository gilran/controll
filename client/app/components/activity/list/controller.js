'use strict';

var module = angular.module('bigorApp.ActivityList', [
  'bigorApp.Filters',
  'bigorApp.EventService'
]);

module.controller(
    'ActivityListCtrl',
    function($scope, $location, $window, $log, ApiClient, EventService) {
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

    $scope.event_day = [];
    $scope.event_start_time = [];
    $scope.add_event = [];

    var createAddEventFunction = function(index) {
      return function() {
        EventService.addEvent(
            $scope.activities[index],
            $scope.event_day[index],
            $scope.event_start_time[index]);
      }
    };

    ApiClient.query('activity', true /* recursive */, function(response) {
      $log.log(response.data);
      for (var i = 0; i < response.data.length; i++) {
        $scope.event_day.push('24');
        $scope.event_start_time.push('10:00');
        $scope.add_event.push(createAddEventFunction(i));
      }
      $scope.activities = response.data;
    });
  });
});

