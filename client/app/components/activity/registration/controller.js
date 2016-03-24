'use strict';

var module = angular.module('bigorApp.ActivityRegistration', [
  'bigorApp.ActivityService'
]);

module.controller(
    'ActivityRegistrationCtrl',
    function($scope, $location, $window, $log, ApiClient, ActivityService) {
  $log.log('ActivityRegistrationCtrl');
  ApiClient.getUser($location.path(), function(response) {
    if (!response.data.email) {
      $window.location.href = response.data.url;
      return;
    }

    $scope.host = response.data.user.name;
    $scope.name = '';
    $scope.teaser = '';
    $scope.activity_type = 'tabletop';
    $scope.notes = '';
    $scope.tags = '';
    $scope.minimum_participants = 3;
    $scope.maximum_participants = 6;
    $scope.duration = '180';
    $scope.age_restriction = '0,120';
    $scope.unavailable_times = [];
    for (var i = 0; i < 6; ++i) {
      $scope.unavailable_times.push(false);
    }

    $scope.submit = function() {
      var age_restriction = $scope.age_restriction.split(',');
      var activity = {
        name: $scope.name,
        minimum_participants: parseInt($scope.minimum_participants),
        maximum_participants: parseInt($scope.maximum_participants),
        unavailable_times:
            ActivityService.unavailableTimesList($scope.unavailable_times),
        notes: $scope.notes,
        minimum_age: parseInt(age_restriction[0]),
        teaser: $scope.teaser,
        duration_minutes: parseInt($scope.duration),
        activity_type: $scope.activity_type,
        maximum_age: parseInt(age_restriction[1]),
        tags: ActivityService.tagsList($scope.tags),
        submitted_by_user: response.data.user.id
      }

      $log.log(activity);

      ApiClient.insert('activity', activity, function() {
        $scope.setStatus('Activity information saved');
      });
    };
  });
});
