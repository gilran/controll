'use strict';

var controllerFunc = function(
    $scope, $location, $routeParams, ApiClient, ActivityService) {

  $scope.submit = function() {
    var age_restriction = $scope.age_restriction.split(',');
    var activity = $scope.activity;
    delete activity.__proto__;
    activity.duration_minutes = parseInt($scope.duration);
    activity.tags = ActivityService.tagsList($scope.tags); 
    activity.minimum_age = parseInt(age_restriction[0]);
    activity.maximum_age = parseInt(age_restriction[1]);
    activity.minimum_participants = parseInt(activity.minimum_participants);
    activity.maximum_participants = parseInt(activity.maximum_participants);

    if (isNaN(activity.minimum_age) ||
        isNaN(activity.maximum_age) ||
        isNaN(activity.minimum_participants) ||
        isNaN(activity.maximum_participants) ||
        activity.maximum_age < activity.minimum_age ||
        activity.maximum_participants < activity.minimum_participants) {
      $scope.setError('Form contains invalid values');
      return;
    }

    activity.unavailable_times =
        ActivityService.unavailableTimesList($scope.unavailable_times);

    ApiClient.update('activity', activity, function() {
      $scope.setStatus('Activity information saved');
    });
  };

  ApiClient.doAll([
      ApiClient.getUser($location.path()),
      ApiClient.fetch('activity', $routeParams['key'], false /* recursive */)
  ]).then(function(responses) {
    $scope.user = responses[0].data.user;
    $scope.activity = responses[1].data;

    // TODO(gilran): Code duplication - move to a service.
    if (!$scope.user.email) {
      $window.location.href = $scope.user.url;
      return;
    }
    if ($scope.user.credentials_level < 2 &&
        $scope.user.key != $scope.activity.submitted_by_user.key) {
      $scope.setError('Unauthorized');
      $location.path('/controll');
    }

    $scope.duration = $scope.activity.duration_minutes.toString();
    $scope.tags = $scope.activity.tags.join(', ');
    $scope.age_restriction =
        $scope.activity.minimum_age + ',' + $scope.activity.maximum_age;
    $scope.unavailable_times = [];
    for (var i = 0; i < 6; ++i) {
      $scope.unavailable_times.push(false);
    }
    for (var i = 0; i < $scope.activity.unavailable_times.length; i++) {
      var item = $scope.activity.unavailable_times[i];
      var item_index = ActivityService.unavailableTimeIndex(item);
      $scope.unavailable_times[item_index] = true;
    }
  });
}

angular
.module(
    'bigorApp.ActivityEdit',
    ['bigorApp.ActivityService', 'bigorApp.ApiClient'])
.controller(
    'ActivityEditCtrl',
    ['$scope', '$location', '$routeParams', 'ApiClient', 'ActivityService',
     controllerFunc]);
