'use strict'

var module = angular.module('bigorApp.DataObject', ['ApiClient']);

module.service('DataObject', function($q, $log, ApiClient) {
  this.describeAndQuery = function(data_type) {
    $log.log(1);
    var describe_response = null;
    var query_reponse = null;
    var both_done = $q.defer();
    ApiClient.query('simple').then(function(response) {
      query_reponse = response;
      if (!!describe_response) {
        both_done.resolve({
          'describe': describe_response.data,
          'query': query_reponse.data
        });
      }
    });
    ApiClient.describe('simple').then(function(response) {
      describe_response = response;
      if (!!query_reponse) {
        both_done.resolve({
          'describe': describe_response.data,
          'query': query_reponse.data
        });
      }
    });
    return both_done.promise;
  }
  
  this.createTable = function(data_type) {
    var table_ready = $q.defer();
    this.describeAndQuery(data_type).then(function(data) {
      table_ready.resolve({
        'columns': Object.keys(data.describe),
        'rows': data.query
      })
    });
    return table_ready.promise;
  }
});
