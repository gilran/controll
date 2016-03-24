 # -*- coding: utf-8 -*-

import re
from datetime import datetime

from google.appengine.ext import ndb


class _Validators(object):
  PHONE_PATTERN = re.compile('^0[0-9]{8,9}$')

  @staticmethod
  def BirthYear(prop, value):
    current_year = datetime.now().year
    diff = current_year - value
    if diff < 0 or diff > 120:
      raise Exception("Invalid birth year")
    return value

  @staticmethod
  def Phone(prop, value):
    value = value.strip().replace('-', '')
    if not _Validators.PHONE_PATTERN.match(value):
      raise Exception("Invalid phone number")
    return value

  @staticmethod
  def Name(prop, value):
    value = value.strip()
    parts = filter(lambda x: x != '', value.split(' '))
    if len(parts) < 2:
      raise Exception("Invalid name")
    return ' '.join(parts)

  @staticmethod
  def NotEmpty(prop, value):
    if not value:
      raise Exception("Empty value for property '%s'" % prop.name)
    return value

  @staticmethod
  def IntegerBetween(minimum, maximum):
    def Between(prop, value):
      if value < minimum or value > maximum:
        raise Exception(
            "Value for property '%s' not in range [%s, %s]" %
            (prop.name, minimum, maximum))
      return value


class User(ndb.Model):
  email = ndb.StringProperty()
  name = ndb.StringProperty(validator=_Validators.Name)
  birth_year = ndb.IntegerProperty(validator=_Validators.BirthYear)
  phone_number = ndb.StringProperty(validator=_Validators.Phone)
  contact_me = ndb.BooleanProperty(default=False)
  about = ndb.StringProperty()
  created = ndb.DateTimeProperty()
  last_login = ndb.DateTimeProperty()
  credentials_level = ndb.IntegerProperty(default=1)
  is_club_member = ndb.BooleanProperty(default=False)

ACTIVITY_TYPES = {
    'tabletop': u'משחק תפקידים שולחני',
    'larp': u'משחק תפקידים חי',
    'miniatures': u'מיניאטורות',
    'board': u'קלפים ולוח',
    'lecture': u'הרצאה',
    'workshop': u'סדנה',
    'other': u'אחר',
}

class Activity(ndb.Model):
  name = ndb.StringProperty(validator=_Validators.NotEmpty)
  activity_type = ndb.StringProperty(choices=ACTIVITY_TYPES.keys())
  teaser = ndb.StringProperty(validator=_Validators.NotEmpty)
  duration_minutes = ndb.IntegerProperty(
      validator=_Validators.IntegerBetween(30, 600))
  tags = ndb.StringProperty(repeated=True)
  minimum_age = ndb.IntegerProperty(
      default=0, validator=_Validators.IntegerBetween(0, 120))
  maximum_age = ndb.IntegerProperty(
      default=120, validator=_Validators.IntegerBetween(0, 120))
  minimum_participants = ndb.IntegerProperty(
      validator=_Validators.IntegerBetween(1, 1000))
  maximum_participants = ndb.IntegerProperty(
      validator=_Validators.IntegerBetween(1, 1000))
  notes = ndb.StringProperty()
  unavailable_times = ndb.StringProperty(repeated=True)
  submitted_by_user = ndb.KeyProperty(kind='User')

class Event(ndb.Model):
  start_time = ndb.DateTimeProperty()
  activity = ndb.KeyProperty(kind='Activity')
  crew = ndb.KeyProperty(kind='User', repeated=True)
  participants = ndb.KeyProperty(kind='User', repeated=True)
  enabled = ndb.BooleanProperty(default=True)
