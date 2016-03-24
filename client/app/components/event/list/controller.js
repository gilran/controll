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

  $scope.time_fileter_options = [];
  for (var i = 9.0; i < 23.5; i += 0.5) {
    $scope.time_fileter_options.push(i * 60);
  }

  $scope.filters = {
    'day': '',
    'start_time': '',
    'end_time': ''
  };

  $scope.filterEvents = function() {
    // In Date, month is 0-based.
    var days = {
      24: {
        'start': (new Date(2016, 3, 24, 0, 0, 0, 0)).getTime(),
        'end': (new Date(2016, 3, 25, 0, 0, 0, 0)).getTime()
      },
      25: {
        'start': (new Date(2016, 3, 25, 0, 0, 0, 0)).getTime(),
        'end': (new Date(2016, 3, 26, 0, 0, 0, 0)).getTime()
      }
    };
    return function(event) {
      if ($scope.filters.day) {
        var requested_day = parseInt($scope.filters.day);
        if (days[requested_day]['start'] >= event.start_time ||
            event.start_time >= days[requested_day]['end']) {
          return false;
        }
      }

      if ($scope.filters.start_time) {
        var requested_start_time = parseInt($scope.filters.start_time);
        var start_as_date = new Date(event.start_time);
        var start_minutes_in_day =
            start_as_date.getHours() * 60 + start_as_date.getMinutes();
        if (requested_start_time > start_minutes_in_day) {
          return false;
        }
      }

      $log.log('end_time_filter = ' + $scope.filters.end_time);
      if ($scope.filters.end_time) {
        var requested_end_time = parseInt($scope.filters.end_time);
        var end_as_date = new Date(
            event.start_time + event.activity.duration_minutes * 60 * 1000);
        var end_minutes_in_day =
            end_as_date.getHours() * 60 + end_as_date.getMinutes();
        $log.log(end_minutes_in_day);
        if (requested_end_time < end_minutes_in_day) {
          return false;
        }
      }
      return true;
    };
  };
});


