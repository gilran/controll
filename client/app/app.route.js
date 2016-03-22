'use strict';

var module = angular.module(
    'bigorApp.Route', ['ngRoute'], function($locationProvider) {
      $locationProvider.html5Mode(true);
    });
var COMPONENTS_HOME = '/controll/app/components/';
module.config(['$routeProvider', function($routeProvider) {
  $routeProvider
      .when('/controll/user/registration', {
        templateUrl:
            COMPONENTS_HOME + 'user_registration/user_registration.html',
      })
      .when('/controll/activity/registration', {
        templateUrl: COMPONENTS_HOME + 'activity/registration/template.html',
      })
      .when('/controll/activity/list', {
        templateUrl: COMPONENTS_HOME + 'activity/list/template.html',
      })
      .when('/controll/activity/edit', {
        templateUrl: COMPONENTS_HOME + 'activity/edit/template.html',
      })
      .otherwise({
        templateUrl: '/controll/app/components/home/index.html',
        controller: 'SimpleCtrl'
      });
}]);
  

