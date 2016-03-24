var module = angular.module('bigorApp.ActivityService', []);

module.service('ActivityService', function() {
  // TODO(gilran): This is for bigor 2016 only.
  this.unavailableTimeName = function(i) {
    var DAYS = ['sunday', 'monday'];
    var TIMES_IN_DAY = ['morning', 'noon', 'evening'];
    
    var name = 'bigor 2016 ';
    name += DAYS[Math.floor(i / 3)];
    name += ' ';
    name += TIMES_IN_DAY[i % 3];
    return name;
  };

  this.unavailableTimesList = function(booleans_array) {
    var unavailable_times_names = [];
    for (var i = 0; i < booleans_array.length; i++) {
      if (booleans_array[i]) {
        unavailable_times_names.push(this.unavailableTimeName(i));
      }
    }
    return unavailable_times_names;
  };

  this.unavailableTimeIndex = function(name) {
    // TODO(gilran): Switch to using indexOf.
    var name_parts = name.split(' ');
    var index = 0;
    switch (name_parts[2]) {
      case 'sunday': index = 0; break;
      case 'monday': index = 3; break;
    }
    switch (name_parts[3]) {
      case 'morning': index += 0; break;
      case 'noon': index += 1; break;
      case 'evening': index += 2; break;
    }
    return index;
  };

  this.tagsList = function(tags_string) {
    return tags_string.split(',').filter(Boolean).map(function(x) {
      return x.trim();
    });
  };

  this.ACTIVITY_TYPES = {
    'tabletop': 'משחק תפקידים שולחני',
    'larp': 'משחק תפקידים חי',
    'miniatures': 'מיניאטורות',
    'board': 'קלפים ולוח',
    'lecture': 'הרצאה',
    'workshop': 'סדנה',
    'other': 'אחר'
  };
});

