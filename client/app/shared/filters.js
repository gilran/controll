var module = angular.module('bigorApp.Filters', [
  'bigorApp.ActivityService'
]);

module.filter('duration', function() {
  return function(input) {
    var hours = Math.floor(input / 60);
    var minutes = input % 60;
    var padding = minutes < 10 ? '0' : '';
    return hours + ':' + padding + minutes;
  };
});

module.filter('unavailable_time', function() {
  return function(input) {
    var parts = input.split(' ');
    var day = '';
    var time_slot = '';
    for (var i = 0; i < parts.length; i++) {
      switch (parts[i]) {
        case 'sunday': day = 'ראשון'; break;
        case 'monday': day = 'שני'; break;
        case 'morning': time_slot = 'בוקר'; break;
        case 'noon': time_slot = 'צהריים'; break;
        case 'evening': time_slot = 'ערב'; break;
      }
    }
    return day + ' ' + time_slot;
  };
});

module.filter('activity_type', function(ActivityService) {
  return function(input) {
    return ActivityService.ACTIVITY_TYPES[input];
  };
});

module.filter('age_restriction', function() {
  return function(input) {
    if (!(input instanceof Array) || (input.length != 2)) {
      throw 'Expected array with 2 items.';
    }
    var min = parseInt(input[0]);
    var max = parseInt(input[1]);
    if (isNaN(min) || isNaN(max)) {
      throw 'Expected array with 2 numeric items.';
    }

    return min == 0 ?
      (max == 120 ? 'אין' : max + ' ומעלה') :
      (max == 120 ? min + ' ומטה' : min + '-' + max);
  };
});
