'use strict';

var module = angular.module(
    'bigorApp.Route', ['ngRoute'], function($locationProvider) {
      $locationProvider.html5Mode(true);
    });

module.config(['$routeProvider', function($routeProvider) {
  var COMPONENTS_HOME = '/controll/app/components/';
  var MINIFIED = false;
  var makeTemplateUrl = function(component, action) {
    var result =
        COMPONENTS_HOME +
        component + '/' + action + '/' +
        'template' + (MINIFIED ? '.mini' : '') + '.html';
    return result;
  };

  $routeProvider
      .when('/controll/user/registration', {
        templateUrl: makeTemplateUrl('user', 'registration')
      })
      .when('/controll/activity/registration', {
        templateUrl: makeTemplateUrl('activity', 'registration')
      })
      .when('/controll/activity/list', {
        templateUrl: makeTemplateUrl('activity', 'list')
      })
      .when('/controll/activity/edit', {
        templateUrl: makeTemplateUrl('activity', 'edit')
      })
      .when('/controll/event/add', {
        templateUrl: makeTemplateUrl('event', 'add')
      })
      .when('/controll/event/list', {
        templateUrl: makeTemplateUrl('event', 'list')
      })
      .otherwise({
        templateUrl: makeTemplateUrl('event', 'program')
      });
}]);


