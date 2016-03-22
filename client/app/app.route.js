'use strict';

var module = angular.module(
    'bigorApp.Route', ['ngRoute'], function($locationProvider) {
      $locationProvider.html5Mode(true);
    });
module.config(['$routeProvider', function($routeProvider) {
  $routeProvider
      .when('/controll/user/registration', {
        templateUrl:
            '/controll/app/components/user_registration/user_registration.html',
        controller: 'UserRegistrationCtrl'
      })
      .otherwise({
        templateUrl: '/controll/app/components/home/index.html',
        controller: 'SimpleCtrl'
      });
}]);
  

