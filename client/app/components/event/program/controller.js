'use strict';

var module = angular.module('bigorApp.EventProgram', [
  'bigorApp.Filters',
  'bigorApp.ActivityService'
]);

module.controller(
    'EventProgramCtrl',
    function($scope, $location, $window, $log, ApiClient, ActivityService) {
  $log.log('EventProgramCtrl');

  $scope.update = function() {
    ApiClient.get('/event/program', {}, function(response) {
      $scope.events = response.data;
      var tags_dict = {};
      for (var i = 0; i < $scope.events.length; i++) {
        for (var j = 0; j < $scope.events[i].activity.tags.length; j++) {
          tags_dict[$scope.events[i].activity.tags[j]] = true;
        }
      }
      $scope.tag_filter_options = Object.keys(tags_dict);
    });
  };
  $scope.update();

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

  var cached_time_filter_options = null;
  $scope.time_filter_options = function() {
    if (cached_time_filter_options) {
      return cached_time_filter_options;
    }
    
    cached_time_filter_options = []
    for (var i = 9.0; i < 23.5; i += 0.5) {
      cached_time_filter_options.push(i * 60);
    }
    return cached_time_filter_options;
  };

  $scope.activity_type_fileter_options =
      Object.keys(ActivityService.ACTIVITY_TYPES);

  $scope.filters = {
    'day': '',
    'start_time': '',
    'end_time': '',
    'tag': '',
    'activity_type': '',
  };
    
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

  var matchDayFilter = function(event) {
    if (!$scope.filters.day) {
      return true;
    }
    var requested_day = parseInt($scope.filters.day);
    var result =
        days[requested_day]['start'] <= event.start_time &&
        event.start_time <= days[requested_day]['end'];
    return result;
  };

  var matchStartTimeFilter = function(event) {
    if ($scope.filters.start_time == '') {
      return true;
    }
    var requested_start_time = parseInt($scope.filters.start_time);
    var start_as_date = new Date(event.start_time);
    var start_minutes_in_day =
        start_as_date.getHours() * 60 + start_as_date.getMinutes();
    return (start_minutes_in_day > requested_start_time);
  };

  var matchEndTimeFilter = function(event) {
    if (!$scope.filters.end_time) {
      return true;
    }
    var requested_end_time = parseInt($scope.filters.end_time);
    var end_as_date = new Date(
        event.start_time + event.activity.duration_minutes * 60 * 1000);
    var end_minutes_in_day =
        end_as_date.getHours() * 60 + end_as_date.getMinutes();
    $log.log(end_minutes_in_day);
    return (end_minutes_in_day < requested_end_time);
  };

  // TODO(gilran): Allow filtering by multiple tags.
  var matchTagFilter = function(event) {
    if (!$scope.filters.tag) {
      return true;
    }
    return (event.activity.tags.indexOf($scope.filters.tag) >= 0);
  };

  var matchActivityTypeFilter = function(event) {
    if (!$scope.filters.activity_type) {
      return true;
    }
    return (event.activity.activity_type == $scope.filters.activity_type);
  }

  $scope.filterEvents = function() {
    return function(event) {
      var result =
          matchDayFilter(event) &&
          matchStartTimeFilter(event) &&
          matchEndTimeFilter(event) &&
          matchTagFilter(event) &&
          matchActivityTypeFilter(event);
      return result;
    };
  };
});



