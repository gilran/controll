'use strict'

var module = angular.module('ApiClient', []);

module.service('ApiClient', function($http) {
  this.get = function(path, callback) {
    var request = {
      method: 'GET',
      url: 'http://localhost:8080/api' + path,
    }
    var promise = $http(request);
    if (!!callback) {
      promise.then(callback);
      return null;
    }
    return promise;
  };

  this.post = function(path, data, callback) {
    var request = {
      method: 'POST',
      url: 'http://localhost:8080/api' + path,
      data: data
    }
    $http(request).then(callback);
  }

  this.describe = function(data_type, callback) {
    return this.get('/' + data_type + '/describe', callback);
  };

  this.query = function(data_type, callback) {
    return this.get('/' + data_type + '/query', callback);
  };
});

module.factory('HttpInterceptor', function($q, $log) {
  return {
    'request': function(config) {
      return config;
    },
    'requestError': function(rejection) {
      return $q.reject(rejection);
    },
    'response': function(response) {
      return response;
    },
    'responseError': function(rejection) {
      return $q.reject(rejection);
    }
  };
});

module.config(function($httpProvider) {
  $httpProvider.interceptors.push('HttpInterceptor');
});
