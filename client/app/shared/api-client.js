'use strict'

var module = angular.module('bigorApp.ApiClient', []);

module.service(
    'ApiClient', function($http, $q, $httpParamSerializer, $rootScope) {
  this.get = function(path, params, callback) {
    var url = '/api' + path + '?' + $httpParamSerializer(params);
    var request = {
      method: 'GET',
      url: url,
    }
    var promise = $http(request);
    if (!!callback) {
      promise.then(function(response) {
        callback(response);
        $rootScope.setStatus('טעינה הסתיימה');
      });
      return null;
    }
    return promise;
  };

  this.post = function(path, data, callback) {
    var request = {
      method: 'POST',
      url: '/api' + path,
      data: data
    }
    $http(request).then(callback);
  }

  this.describe = function(data_type, callback) {
    return this.get('/' + data_type + '/describe', {}, callback);
  };

  this.query = function(data_type, recursive, callback) {
    return this.get('/' + data_type + '/query', {'r': recursive}, callback);
  };

  this.insert = function(data_type, data, callback) {
    return this.post('/' + data_type + '/insert', data, callback);
  };

  this.update = function(data_type, data, callback) {
    return this.post('/' + data_type + '/update', data, callback);
  };

  this.fetch = function(data_type, key, recursive, callback) {
    return this.get(
        '/' + data_type + '/fetch', {'id': key, 'r': recursive}, callback);
  };

  this.getUser = function(return_address, callback) {
    return this.get('/user/logged_in', {'source': return_address}, callback);
  };

  this.doAll = function(promises, callback) {
    var all_done = $q.defer();
    var done = 0;
    var responses = [];
    
    var makeDoneFunction = function(index) {
      return function(response) {
        responses[index] = response;
        done++;
        if (done == promises.length) {
          all_done.resolve(responses);
        }
      };
    };

    for (var i = 0; i < promises.length; i++) {
      responses.push(null);
      promises[i].then(makeDoneFunction(i));
    }

    return all_done.promise;
  }
});

module.factory('HttpInterceptor', function($q, $log, $rootScope) {
  return {
    'request': function(config) {
      $rootScope.setMessage('טוען...');
      return config;
    },
    'requestError': function(rejection) {
      return $q.reject(rejection);
    },
    'response': function(response) {
      return response;
    },
    'responseError': function(rejection) {
      $rootScope.setError(rejection.data.error_message);
      $log.log(rejection);
      return $q.reject(rejection);
    }
  };
});

module.config(function($httpProvider) {
  $httpProvider.interceptors.push('HttpInterceptor');
});
