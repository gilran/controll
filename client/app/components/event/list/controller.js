'use strict';

var module = angular.module('bigorApp.EventList', [
  'bigorApp.Filters'
]);

module.controller(
    'EventListCtrl', function($scope, $location, $window, $log, ApiClient) {
  $log.log('EventListCtrl');
  
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

  $scope.update = function() {
    ApiClient.query('event', true /* recursive */, function(response) {
      $log.log(response.data);
      $scope.events = response.data;
    });
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
    $scope.update();
  });

  $scope.register = function(event_index, user_index) {
    var event_id = $scope.events[event_index].id;
    var data = {'event': event_id};
    if (user_index != null) {
      var user_id = $scope.events[event_index].participants[user_index].id;
      data['user'] = user_id;
    }
    ApiClient.post('/event/register', data, function(response) {
      $scope.setStatus('נרשמת לאירוע');
    });
  };

  $scope.cancelRegistration = function(event_index, user_index) {
    var event_id = $scope.events[event_index].id;
    var data = {'event': event_id};
    if (user_index != null) {
      var user_id = $scope.events[event_index].participants[user_index].id;
      data['user'] = user_id;
    }
    ApiClient.post('/event/unregister', data, function(response) {
      $scope.setStatus('ההרשמה לאירוע בוטלה');
      if (user_index != null) {
        $scope.events[event_index].participants.splice(user_index, 1);
      }
    });
  };
});


