'use strict'

var app = angular.module('bigorApp', [
  'bigorApp.ApiClient',
  'bigorApp.DataObject',
  'bigorApp.Route',
  'bigorApp.Simple',
  'bigorApp.UserRegistration'
]);

app.controller(
    'MainCtrl', function($scope, $window, $location, $timeout, ApiClient) {
  $scope.clearStatus = function() {
    // TODO(gilran): Condifer ng-show.
    $scope.status = '';
    $scope.status_class = 'invisible';
  };

  var show_status_for_ms = 5000;
  var internalSetStatus = function(status_class, message) {
    // TODO(gilran): Condifer ng-show.
    $scope.status_class = status_class;
    $scope.status = message;
    var last_status_update = Date.now();
    $timeout(function() {
      if (Date.now() >= (last_status_update + show_status_for_ms - 100)) {
        $scope.clearStatus();
      }
    },
    show_status_for_ms);
  };

  $scope.setStatus = function(message) {
    internalSetStatus('ok', message);
  };

  $scope.setError = function(message) {
    internalSetStatus('error', message);
  };

  $scope.goTo = function(url) {
    $window.location.href = url;
  };
    
  ApiClient.get(
      '/user/logged_in?source=' + $location.path(),
      function(response) {
        if (!!response.data.email) {
          $scope.logged_in_as = 'מחובר כ-' + response.data.email;
          $scope.user_link = response.data.url;
          $scope.login_message = 'יציאה';
          $scope.logged_in = true;
        } else {
          $scope.logged_in_as = '';
          $scope.user_link = response.data.url;
          $scope.login_message = 'כניסה למערכת';
          $scope.logged_in = false;
        }
      });

  $scope.clearStatus();
});