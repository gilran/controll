'use strict';

var controllerFunc = function($scope, $location, $window, ApiClient) {
  $scope.show_box = false;
  $scope.box_content = '';

  $scope.showBox = function(content, action) {
    $scope.box_content = content;
    $scope.show_close_box = action == null;
    $scope.show_cancel = action != null;
    $scope.show_ok = action != null;
    $scope.box_action = function() {
      action();
      $scope.hideBox();
    }
    $scope.show_box = true;
  };

  $scope.hideBox = function() {
    $scope.show_box = false;
    $scope.box_content = content;
  };

  $scope.update = function() {
    ApiClient.doAll([
        ApiClient.query('event', true /* recursive */),
        ApiClient.query('user', false /* recursive */)
    ]).then(function(responses) {
      $scope.events = responses[0].data;
      $scope.users = responses[1].data;
      var tags_dict = {};
      for (var i = 0; i < $scope.events.length; i++) {
        for (var j = 0; j < $scope.events[i].activity.tags.length; j++) {
          tags_dict[$scope.events[i].activity.tags[j]] = true;
        }
      }
      $scope.tag_filter_options = Object.keys(tags_dict);
    });
  };

  ApiClient.getUser($location.path(), function(response) {
    if (!response.data.email) {
      $window.location.href = response.data.url;
      return;
    }
    if (!response.data.user.credentials_level ||
        response.data.user.credentials_level < 2) {
      $scope.setError('Unauthorized');
      $location.path('/controll');
    }
    $scope.update();
  });
  
  var cancelRegistration = function(event_index, user_index) {
    var event_key = $scope.events[event_index].key;
    var data = {'event': event_key};
    if (user_index != null) {
      var user_key = $scope.events[event_index].participants[user_index].key;
      data['user'] = user_key;
    }
    ApiClient.post('/event/unregister', data, function(response) {
      $scope.setStatus('ההרשמה לאירוע בוטלה');
      if (user_index != null) {
        $scope.events[event_index].participants.splice(user_index, 1);
      }
    });
  };

  $scope.showCancelRegistrationBox = function(event_index, user_index) {
    var event = $scope.events[event_index].activity.name;
    var user = $scope.events[event_index].participants[user_index].name;
    var message =
        'האם את/ה בטוח/ה שברצונך לבטל את הרשמה של ' + user + ' לאירוע "' + event
        + '"?';
    var action = function() {
      cancelRegistration(event_index, user_index);
    };
    $scope.showBox(message, action);
  };

  var cancelEvent = function(event_index) {
    var data = {'key': $scope.events[event_index].key};
    ApiClient.delete('event', data, function(response) {
      $scope.setStatus('האירוע בוטל');
      $scope.events.splice(event_index, 1);
    });
  };

  $scope.showCancelEventBox = function(event_index) {
    var event = $scope.events[event_index].activity.name;
    var message =
        'לא ניתן להחזיר אירוע מבוטל. ניתן להקפיא את האירוע במקום. ' +
        'האם את/ה בטוח/ה שברצונך לבטל את האירוע "' + event + '"?';
    var action = function() {
      cancelEvent(event_index);
    };
    $scope.showBox(message, action);
  };

  $scope.setEventEnabled = function(event, enabled) {
    var data = {'key': event.key, 'enabled': enabled};
    ApiClient.update('event', data, function(response) {
      $scope.setStatus('האירוע ' + (enabled ? 'הופעל' : 'הוקפא'));
      event.enabled = enabled;
    });
  };

  $scope.removeFromCrew = function(event_index, user_index) {
    var event_key = $scope.events[event_index].key;
    var user_key = $scope.events[event_index].crew[user_index].key;
    var data = {'event': event_key, 'user': user_key};
    ApiClient.post('/event/remove_crew_member', data, function(response) {
      $scope.setStatus('חבר/ת הצוות הוסר/ה');
      $scope.events[event_index].crew.splice(user_index, 1);
    });
  };
  
  $scope.added_crew_member = [];
  $scope.addToCrew = function(event_index) {
    var event_key = $scope.events[event_index].key;
    var user = $scope.users[$scope.added_crew_member[event_index]];
    var data = {'event': event_key, 'user': user.key};
    ApiClient.post('/event/add_crew_member', data, function(response) {
      $scope.setStatus('חבר/ת הצוות הוספ/ה');
      $scope.events[event_index].crew.push(user);
    });
  };
  
  $scope.added_participant = [];
  $scope.register = function(event_index) {
    var event_key = $scope.events[event_index].key;
    var user = $scope.users[$scope.added_participant[event_index]];
    var data = {'event': event_key, 'user': user.key};
    ApiClient.post('/event/register', data, function(response) {
      $scope.setStatus('ההרשמה בוצעה');
      $scope.events[event_index].participants.push(user);
    });
  };
};

angular
.module('bigorApp.EventList', ['bigorApp.ApiClient'])
.controller(
    'EventListCtrl',
    ['$scope', '$location', '$window', 'ApiClient', controllerFunc]);


