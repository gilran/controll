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
            COMPONENTS_HOME + 'user/registration/template.html',
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
      .when('/controll/event/add', {
        templateUrl: COMPONENTS_HOME + 'event/add/template.html',
      })
      .when('/controll/event/list', {
        templateUrl: COMPONENTS_HOME + 'event/list/template.html',
      })
      .otherwise({
        templateUrl: COMPONENTS_HOME + 'event/program/template.html',
      });
}]);
  

