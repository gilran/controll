'use strict';

var durationFilter = function() {
  return function(input) {
    var hours = Math.floor(input / 60);
    var minutes = input % 60;
    var padding = minutes < 10 ? '0' : '';
    return hours + ':' + padding + minutes;
  };
};

var unavailableTimeFilter = function() {
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
};

var activityTypeFilter = function(ActivityService) {
  return function(input) {
    return ActivityService.ACTIVITY_TYPES[input];
  };
};

var ageRestrictionFilter = function() {
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
};

var peopleListFilter = function() {
  return function(input) {
    var result = input[0].name;
    for (var i = 1; i < input.length; i++) {
      result += (i == input.length - 1 ? ' ו' : ', ');
      result += input[i].name;
    }
    return result;
  };
};

var userRoleFilter = function() {
  return function(event_and_user) {
    var event = event_and_user[0];
    var user = event_and_user[1];
    // TODO(gilran): Proper participants and crew members names.
    if (event.participants.indexOf(user.key) != -1) {
      return 'שחקן/ית';
    }
    for (var i = 0; i < event.crew.length; i++) {
      if (event.crew[i].key == user.key) {
        return 'מנחה';
      }
    }
    throw 'Got an event that the user is not in:' +
        '\nuser.key = ' + user.key +
        '\nparticipants = ' + JSON.stringify(event.participants) +
        '\ncrew = ' + JSON.stringify(event.crew);
  };
};

angular
.module('bigorApp.Filters', ['bigorApp.ActivityService'])
.filter('duration', [durationFilter])
.filter('unavailable_time', [unavailableTimeFilter])
.filter('activity_type', ['ActivityService', activityTypeFilter])
.filter('age_restriction', [ageRestrictionFilter])
.filter('people_list', [peopleListFilter])
.filter('user_role', [userRoleFilter]);
