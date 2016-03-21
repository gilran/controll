'use strict';

var module = angular.module('bigorApp.Route', ['ngRoute']);
module.config(['$routeProvider', function($routeProvider) {
  $routeProvider
      .otherwise({
        templateUrl: 'app/components/home/index.html',
        controller: 'SimpleCtrl'
      });
}]);
  

