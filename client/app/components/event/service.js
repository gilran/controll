var module = angular.module('bigorApp.EventService', [
  'bigorApp.ApiClient'
]);

module.service('EventService', function($log, $rootScope, ApiClient) {
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
        new Date(2016, 4, day, splitted_time[0], splitted_time[1], 0, 0);

    var event = {
      'activity': activity.id,
      'start_time': start_time.getTime(),
      'crew': [],
      'participants': []
    };
    $log.log('Event:' + JSON.stringify(event));
    ApiClient.insert('event', event, function(response) {
      $rootScope.setStatus('Event created');
    });
  };
});
