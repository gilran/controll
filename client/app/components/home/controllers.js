'use strict';

var module = angular.module('bigorApp.Simple', []);

module.controller('SimpleCtrl', function (
        $scope, $http, $window, $location, $log, ApiClient, DataObject) {
  $scope.update = function() {
    $log.log('location: ' + JSON.stringify($location));
    $scope.error = "No error";
    ApiClient.get(
        '/simple/query', 
        function successCallback(response) {
          $scope.simples = response.data;
        },
        function errorCallback(response) {
          $scope.error =
              "Request failed (" + response.status + "): " +
              response.statusText;
        });

    ApiClient.get(
        '/user/logged_in?source=' + $location.path(),
        function(response) {
          if (!!response.data.email) {
            $scope.user_link = response.data.url;
            $scope.login_message = "Log out from " + response.data.email;
            $scope.logged_in = true;
          } else {
            $scope.user_link = response.data.url;
            $scope.login_message = "Log in";
            $scope.logged_in = false;
          }
        });

    DataObject.createTable('simple').then(function(data) {
      $log.log(JSON.stringify(data));
    });
  };

  $scope.addSimple = function(name) {
    ApiClient.post('/simple/insert', {"name":name}, function(data) {
      $scope.simples.push(data);
    });
  };

  $scope.update();
});

module.directive("loginState", function($compile, ApiClient) {
  return {
    link: function(scope, element) {
      var template = "<a href=#>login</a>";
      var link_func = $compile(template);
      var content = link_func(scope);
      element.append(content);
    }
  }
});
