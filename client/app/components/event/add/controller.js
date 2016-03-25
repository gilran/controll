'use strict';

var module = angular.module('bigorApp.EventAdd', [
  'bigorApp.EventService'
]);

module.controller(
    'EventAddCtrl',
    function($scope, $location, $log, $routeParams, ApiClient, EventService) {
  $log.log('EventAddCtrl');

  ApiClient.doAll([
      ApiClient.getUser($location.path()),
      ApiClient.query('activity', false /* recursive */)
  ]).then(function(responses) {
    $scope.user = responses[0].data.user;
    $scope.activities = responses[1].data;

    $scope.selected_activity = $routeParams['activity'];
    $scope.day = '24';
    $scope.start_time = '10:00';
    
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
  });

  $scope.submit = function() {
    EventService.addEvent(
        $scope.selected_activity, $scope.day, $scope.start_time);
  };
});
