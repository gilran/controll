'use strict';

var module = angular.module('bigorApp.UserRegistration', []);

module.controller(
    'UserRegistrationCtrl',
    function ($scope, $log, $location, $window, $route, ApiClient) {
  $log.log('UserRegistrationCtrl');

  $scope.getYearsList = function() {
    var result = [];
    for (var i = 2016; i >= 1900; --i) {
      result.push(i);
    }
    return result;
  };

  $scope.submit = function() {
    var request_content = {
      'key': $scope.user.key,
      'email': $scope.user.email,
      'name': $scope.name,
      'birth_year': parseInt($scope.birth_year),
      'phone_number': $scope.phone_number,
      'contact_me': $scope.contact_me,
      'about': $scope.about,
      'is_club_member': $scope.is_club_member
    };

    $log.log('request content:' + JSON.stringify(request_content));

    ApiClient.update('user', request_content, function() {
      $scope.setStatus('User information updated successfully');
    });
  };
  
  $scope.cancelRegistration = function(event_index) {
    var event_key = $scope.events[event_index].key;
    var data = {'event': event_key};
    ApiClient.post('/event/unregister', data, function(response) {
      $scope.setStatus('ההרשמה לאירוע בוטלה');
      $scope.events.splice(event_index, 1);
    });
  };

  ApiClient.doAll([
      ApiClient.getUser($location.path()),
      ApiClient.get('/user/events')
  ]).then(function(responses) {
    $scope.user_wrapper = responses[0].data;
    if (!$scope.user_wrapper.email) {
      $window.location.href = $scope.user_wrapper.url;
      return;
    }

    $scope.email = $scope.user_wrapper.email;
    $scope.name = '';
    $scope.birth_year = 2000;
    $scope.phone_number = '';
    $scope.about = '';
    $scope.contact_me = false;
    $scope.is_club_member = false;
    if ($scope.user_wrapper.user) {
      $scope.user = $scope.user_wrapper.user;
      var user = $scope.user;
      $scope.name = user.name;
      $scope.birth_year = user.birth_year ? user.birth_year.toString() : '';
      $scope.phone_number = user.phone_number;
      $scope.about = user.about;
      $scope.contact_me = user.contact_me;
      $scope.is_club_member = user.is_club_member;
    }
    $scope.events = responses[1].data;
  });
});

module.filter('user_role', function() {
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
});

