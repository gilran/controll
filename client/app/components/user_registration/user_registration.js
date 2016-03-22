'use strict';

var module = angular.module('bigorApp.UserRegistration', []);

module.controller(
    'UserRegistrationCtrl',
    function ($scope, $log, $location, $window, $route, ApiClient) {
  $log.log('UserRegistrationCtrl');
  ApiClient.getUser($location.path(), function(response) {
    if (!response.data.email) {
      $log.log(response.data.url);
      $window.location.href = response.data.url;
      return;
    }

    $scope.email = response.data.email;

    $log.log('User data: ' + JSON.stringify(response.data.user));

    $scope.name = '';
    $scope.birth_year = 2000;
    $scope.phone_number = '';
    $scope.about = '';
    $scope.contact_me = false;
    $scope.is_club_member = false;
    if (response.data.user) {
      $log.log('Found user data');
      var user = response.data.user;
      $scope.name = user.name;
      $scope.birth_year = user.birth_year ? user.birth_year.toString() : '';
      $scope.phone_number = user.phone_number;
      $scope.about = user.about;
      $scope.contact_me = user.contact_me;
      $scope.is_club_member = user.is_club_member;
    }

    $scope.getYearsList = function() {
      var result = [];
      for (var i = 2016; i >= 1900; --i) {
        result.push(i);
      }
      return result;
    };

    $scope.submit = function() {
      var request_content = {
        'id': response.data.user.id,
        'email': response.data.email,
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
  });
});
