'use strict';

var serviceFunc = function($rootScope, ApiClient) {
  this.addEvent = function(activity, day, start_time) {
    var day = parseInt(day);
    if (day != 24 && day != 25) {
      $rootScope.setError("Invalid day");
      return;
    }
    var splitted_time = start_time.trim().split(':');
    if (splitted_time.length != 2 ||
        splitted_time[0] < 0 || splitted_time[0] > 23 ||
        splitted_time[1] < 0 || splitted_time[1] > 59) {
      $rootScope.setError("Invalid time");
    }
    var start_time =
        new Date(2016, 3, day, splitted_time[0], splitted_time[1], 0, 0);

    var event = {
      'activity': activity.key,
      'start_time': start_time.getTime(),
      'crew': [],
      'participants': []
    };
    ApiClient.insert('event', event, function(response) {
      $rootScope.setStatus('Event created');
    });
  };
}

angular
.module('bigorApp.EventService', ['bigorApp.ApiClient'])
.service('EventService', ['$rootScope', 'ApiClient', serviceFunc]);
