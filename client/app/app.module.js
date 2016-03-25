'use strict';

var controllerFunc = function(
    $scope, $rootScope, $window, $location, $timeout, ApiClient) {
  $scope.clearStatus = function() {
    // TODO(gilran): Consider ng-show.
    $scope.status = '';
    $scope.status_class = 'invisible';
  };

  var internalSetStatus = function(status_class, message, show_for_ms) {
    // TODO(gilran): Consider ng-show.
    $scope.status_class = status_class;
    $scope.status = message;
    var last_status_update = Date.now();
    if (show_for_ms) {
      $timeout(function() {
        if (Date.now() >= (last_status_update + show_for_ms - 100)) {
          $scope.clearStatus();
        }
      },
      show_for_ms);
    }
  };

  $scope.setStatus = function(message) {
    internalSetStatus('ok', message, 5000);
  };

  $scope.setError = function(message) {
    internalSetStatus('error', message, 10000);
  };
  
  $scope.setMessage = function(message) {
    internalSetStatus('message', message, 0);
  };

  $rootScope.setStatus = $scope.setStatus;
  $rootScope.setError = $scope.setError;
  $rootScope.setMessage = $scope.setMessage;
  $rootScope.clearStatus = $scope.clearStatus;

  $scope.goTo = function(url) {
    $window.location.href = url;
  };

  $scope.inProgramPage = function() {
    return ($location.path() == '/controll/');
  };
    
  ApiClient.getUser($location.path(), function(response) {
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
};

angular
.module(
    'bigorApp', ['bigorApp.ApiClient', 'bigorApp.Filters', 'bigorApp.Route'])
.controller(
    'MainCtrl',
    ['$scope', '$rootScope', '$window', '$location', '$timeout', 'ApiClient',
     controllerFunc]);
