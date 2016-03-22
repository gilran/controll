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


class User(ndb.Model):
  email = ndb.StringProperty()
  name = ndb.StringProperty(validator=_Validators.Name)
  birth_year = ndb.IntegerProperty(validator=_Validators.BirthYear)
  phone_number = ndb.StringProperty(validator=_Validators.Phone)
  contact_me = ndb.BooleanProperty()
  about = ndb.StringProperty()
  created = ndb.DateTimeProperty()
  last_login = ndb.DateTimeProperty()
  credentials_level = ndb.IntegerProperty(default=1)



