'use strict';

var MINIFIED = false;

var moduleFunc = function($locationProvider) {
  $locationProvider.html5Mode(true);
};

var configFunc = function($routeProvider) {
  var COMPONENTS_HOME = '/controll/app/components/';
  var makeTemplateUrl = function(component, action) {
    var result =
        COMPONENTS_HOME +
        component + '/' + action + '/' +
        'template' + (MINIFIED ? '.mini' : '') + '.html';
    return result;
  };

  $routeProvider
  .when('/controll/user/registration', {
    templateUrl: makeTemplateUrl('user', 'registration'),
    controller: 'UserRegistrationCtrl'
  })
  .when('/controll/activity/registration', {
    templateUrl: makeTemplateUrl('activity', 'registration'),
    controller: 'ActivityRegistrationCtrl'
  })
  .when('/controll/activity/list', {
    templateUrl: makeTemplateUrl('activity', 'list'),
    controller: 'ActivityListCtrl'
  })
  .when('/controll/activity/edit', {
    templateUrl: makeTemplateUrl('activity', 'edit'),
    controller: 'ActivityEditCtrl'
  })
  .when('/controll/event/list', {
    templateUrl: makeTemplateUrl('event', 'list'),
    controller: 'EventListCtrl'
  })
  .when('/controll/import', {
    templateUrl: COMPONENTS_HOME + 'import/template.html',
    controller: 'ImportCtrl'
  })
  .when('/controll/', {
    templateUrl: makeTemplateUrl('event', 'program'),
    controller: 'EventProgramCtrl'
  })
  .otherwise({
    redirectTo: '/controll/'
  });
};

var CONTROLLER_MODULES = [
  'bigorApp.ActivityEdit',
  'bigorApp.ActivityList',
  'bigorApp.ActivityRegistration',
  'bigorApp.EventList',
  'bigorApp.EventProgram',
  'bigorApp.Import',
  'bigorApp.UserRegistration'
];

angular
.module(
    'bigorApp.Route',
    ['ngRoute'].concat(CONTROLLER_MODULES),
    ['$locationProvider', moduleFunc])
.config(['$routeProvider', configFunc]);
