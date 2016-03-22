'use strict';

var module = angular.module('bigorApp.UserRegistration', []);

module.controller(
    'UserRegistrationCtrl',
    function ($scope, $log, $location, $window, $route, ApiClient) {
  ApiClient.getUser($location.path(), function(response) {
    $log.log(JSON.stringify("response: " + JSON.stringify(response.data)));
    if (!response.data.email) {
      $log.log(response.data.url);
      $window.location.href = response.data.url;
      return;
    }

    $scope.email = response.data.email;

    if (response.data.user) {
      $log.log('User data: ' + JSON.stringify(response.data.user));
      var user = response.data.user;
      $scope.name = user.name;
      $scope.birth_year = user.birth_year ? user.birth_year.toString() : '';
      $scope.phone_number = user.phone_number;
      $scope.about = user.about;
      $scope.contact_me = user.contact_me;
    } else {
      $scope.name = '';
      $scope.birth_year = 2000;
      $scope.phone_number = '';
      $scope.about = '';
      $scope.contact_me = false;
    }

    $scope.getYearsList = function() {
      var result = [];
      for (var i = 2016; i >= 1900; --i) {
        result.push(i);
      }
      return result;
    };

    $scope.submit = function() {
      $log.debug("submit()");
      $log.debug("name = " + $scope.name);
      $log.debug("birth_year = " + $scope.birth_year);
      $log.debug("about = " + $scope.about);
      $log.debug("contact_me = " + $scope.contact_me);

      ApiClient.update(
          'user', {
            'id': response.data.user.id,
            'email': response.data.email,
            'name': $scope.name,
            'birth_year': parseInt($scope.birth_year),
            'phone_number': $scope.phone_number,
            'contact_me': $scope.contact_me,
            'about': $scope.about
          }, function() {
            $log.log('Callback called');
            $scope.setStatus('User information updated successfully');
          });
    };
  });
});
