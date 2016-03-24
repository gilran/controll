# -*- coding: utf-8 -*-

import datetime
import functools
import httplib
import json
import logging
import operator

from data_item_decorator import DataItem
from data_item_decorator import DEFAULT_CREDENTIALS
from rest import Credentials
from rest import CurrentUser
from rest import RestHandler

import event_utils
import model
import ndb_json

_credentials = DEFAULT_CREDENTIALS()
_credentials.delete = Credentials.CREW

@DataItem(model.Event, _credentials)
class Event(object):
  @staticmethod
  def CollidesWith(start_time, duration, user_key):
    end_time = start_time + datetime.timedelta(minutes=duration)

    for event in event_utils.UserEvents(user_key):
      activity = event.activity.get()
      event_duration = activity.duration_minutes
      event_start_time = event.start_time
      event_end_time = (
          event_start_time + datetime.timedelta(minutes=event_duration))
      if ((event_start_time <= start_time and start_time <= event_end_time) or
          (event_start_time <= end_time and end_time <= event_end_time)):
        return u"האירוע מתנגש עם '%s' (%s-%s)" % (
            activity.name,
            ndb_json.FormatTime(event_start_time),
            ndb_json.FormatTime(event_end_time))
    return None

class InsertHandler(Event.InsertHandler):
  def __init__(self, request, response):
    super(InsertHandler, self).__init__(request, response)

  def post(self):
    try:
      json_item = json.loads(self.request.body)
      converted = ndb_json.ConvertToNdb(model.Event, json_item)
      activity = converted['activity'].get()
      start_time = converted['start_time']
      user_key = activity.submitted_by_user

      if not activity:
        self.abort(httplib.BAD_REQUEST, u'הפעילות לא קיימת')
        return

      collides_with = Event.CollidesWith(
          start_time, activity.duration_minutes, user_key)
      if collides_with:
        self.abort(httplib.BAD_REQUEST, collides_with)
        return

      converted['crew'].append(activity.submitted_by_user)
      item = model.Event(**converted)
      item.put()
      self.SendJson(ndb_json.AsDict(item))
    except Exception as e:
      raise
      self.abort(httplib.BAD_REQUEST, u'Invalid request')

class ProgramHandler(Event.QueryHandler):
  def __init__(self, request, response):
    super(ProgramHandler, self).__init__(request, response)

  def get(self):
    qry = model.Event.query(model.Event.enabled == True)
    logging.info('ProgramHandler');
    self.SendJson([event_utils.MakeProgramEvent(e) for e in qry])

class BaseRegistrationHandler(RestHandler):
  def __init__(self, request, response):
    super(BaseRegistrationHandler, self).__init__(request, response)
    self.activity = None
    self.event = None
    self.user = None

  def post(self):
    data = json.loads(self.request.body)
    self._SetEvent(data)
    self._SetUser(data)
    self.Validate()
    self.Apply()

  def _SetEvent(self, data):
    if 'event' not in data:
      self.abort(httplib.BAD_REQUEST, u'הרשמה ללא אירוע')
    self.event = Event.Fetch(data['event'])
    if not self.event:
      self.abort(httplib.BAD_REQUEST, u'אירוע לא קיים')
    self.activity = self.event.activity.get()

  def _SetUser(self, data):
    logged_in_user = CurrentUser()
    if not logged_in_user:
      self.abort(httplib.BAD_REQUEST, u'יש להכנס למערכת על מנת להרשם')

    if 'user' not in data:
      self.user = logged_in_user
      return
    if data['user'] == logged_in_user.key.urlsafe():
      self.user = logged_in_user
      return
    if logged_in_user.credentials_level >= Credentials.CREW:
      self.user = Event.Fetch(data['user'])
      return

    self.abort(httplib.UNAUTHORIZED)


  def Validate(self):
    raise NotImplementedError("Subclasses should implement this!")

  def Apply(self):
    raise NotImplementedError("Subclasses should implement this!")

class RegisterHandler(BaseRegistrationHandler):
  def __init__(self, request, response):
    super(RegisterHandler, self).__init__(request, response)

  def _ValidateUserDetails(self):
    if not self.user.name:
      self.abort(
          httplib.BAD_REQUEST,
          u'משתמש ללא שם - נא למלא את טופס ההרשמה במלואו')
    if not self.user.phone_number:
      self.abort(
          httplib.BAD_REQUEST,
          u'משתמש ללא מספר טלפון - נא למלא את טופס ההרשמה במלואו')
    if not self.user.phone_number:
      self.abort(
          httplib.BAD_REQUEST,
          u'משתמש ללא שנת לידה - נא למלא את טופס ההרשמה במלואו')

  def _ValidateUserRegistration(self):
    if len(self.event.participants) >= self.activity.maximum_participants:
      self.abort(httplib.BAD_REQUEST, u'לא נותרו מקומות באירוע')

    # The age has a 1 year wiggle room, because we only use the birth year. Due
    # to this, we increase the age restriction by 1 in each direction.
    user_age = datetime.datetime.now().year - self.user.birth_year
    if (user_age < self.activity.minimum_age - 1 or
        user_age > self.activity.maximum_age + 1):
      self.abort(
          httplib.BAD_REQUEST, u'המשתמש אינו עונה על הגבלת הגילאים של האירוע')

    collides_with = Event.CollidesWith(
        self.event.start_time, self.activity.duration_minutes, self.user.key)
    if collides_with:
      self.abort(httplib.BAD_REQUEST, collides_with)

  def Validate(self):
    self._ValidateUserDetails()
    self._ValidateUserRegistration()

  def Apply(self):
    if self.user.key not in self.event.participants:
      self.event.participants.append(self.user.key)
      self.event.put()
    self.SendJson({
      'user': self.user.key.urlsafe(),
      'event': self.event.key.urlsafe(),
    })

class CancelRegistrationHandler(BaseRegistrationHandler):
  def __init__(self, request, response):
    super(CancelRegistrationHandler, self).__init__(request, response)

  def Validate(self):
    """Nothing to validate when unregistering."""
    return

  def Apply(self):
    logging.info(self.user.name)
    self.event.participants = filter(
        functools.partial(operator.ne, self.user.key), self.event.participants)
    self.event.put()
    self.SendJson('')

class AddCrewMemberHandler(BaseRegistrationHandler):
  def __init__(self, request, response):
    super(AddCrewMemberHandler, self).__init__(request, response)
    self._required_credentials = Credentials.CREW

  def Validate(self):
    """Nothing to validate."""
    collides_with = Event.CollidesWith(
        self.event.start_time, self.activity.duration_minutes, self.user.key)
    if collides_with:
      self.abort(httplib.BAD_REQUEST, collides_with)

  def Apply(self):
    if self.user.key not in self.event.crew:
      self.event.crew.append(self.user.key)
      self.event.put()
    self.SendJson({
      'user': self.user.key.urlsafe(),
      'event': self.event.key.urlsafe(),
    })

class RemoveCrewMemberHandler(BaseRegistrationHandler):
  def __init__(self, request, response):
    super(RemoveCrewMemberHandler, self).__init__(request, response)
    self._required_credentials = Credentials.CREW

  def Validate(self):
    """Nothing to validate."""
    return

  def Apply(self):
    self.event.crew = filter(
        functools.partial(operator.ne, self.user.key), self.event.crew)
    self.event.put()
    self.SendJson('')

Event.AddHandler('insert', InsertHandler)
Event.AddHandler('program', ProgramHandler)
Event.AddHandler('register', RegisterHandler)
Event.AddHandler('unregister', CancelRegistrationHandler)
Event.AddHandler('add_crew_member', AddCrewMemberHandler)
Event.AddHandler('remove_crew_member', RemoveCrewMemberHandler)

def Handlers():
  return Event.Handlers()

