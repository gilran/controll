import calendar
import datetime
import logging
import pytz

from google.appengine.api import users
from google.appengine.ext import ndb

import rest

LOCAL_TIME = pytz.timezone('Asia/Jerusalem')
_PRIVATE_FIELDS = ['email', 'phone_number']

def LocalTime(utc_dt):
  local_dt = utc_dt.replace(tzinfo=pytz.utc).astimezone(LOCAL_TIME)
  return LOCAL_TIME.normalize(local_dt)

def FormatTime(t, format='%H:%M'):
  return LocalTime(t).strftime(format)

def TimeStamp(t):
  return calendar.timegm(t.timetuple())

def ConvertToNdb(model, d, string_is_id=False):
  spec = { k: type(v) for k, v in model._properties.iteritems() }
  result = {}
  for name, ndb_type in spec.iteritems():
    if name not in d:
      continue
    if ndb_type == ndb.DateTimeProperty:
      if isinstance(d[name], int):
        result[name] = datetime.datetime.fromtimestamp(d[name] / 1e3)
      elif isinstance(d[name], basestring):
        result[name] = datetime.datetime.strptime(
            d[name], "%Y-%m-%dT%H:%M:%S.%f")
    elif ndb_type == ndb.KeyProperty:
      if isinstance(d[name], basestring):
        if string_is_id:
          result[name] = ndb.Key(model._properties[name]._kind, d[name])
        else:
          result[name] = ndb.Key(urlsafe=d[name])
      elif isinstance(d[name], list):
        result[name] = [ndb.Key(urlsafe=k) for k in d[name]]
    else:
      result[name] = d[name]
  return result

def ConvertFromNdb(d, recursive):
  result = {}
  user = users.get_current_user()
  for k, v in d.iteritems():
    if k in _PRIVATE_FIELDS:
      if user is None:
        result[k] = 'private'
        continue
      if (rest.GetUserCredentialsLevel() < rest.Credentials.CREW and
          ('email' not in d or d['email'] != user.email())):
        result[k] = 'private'
        continue
    if isinstance(v, datetime.datetime):
      result[k] = TimeStamp(v) * 1e3
    elif isinstance(v, ndb.Key):
      if recursive:
        child = v.get()
        result[k] = AsDict(v.get(), recursive)
      else:
        result[k] = v.urlsafe()
    elif isinstance(v, list):
      result[k] = ConvertFromNdb(
          {i: x for i, x in enumerate(v)}, recursive).values()
    else:
      result[k] = v
  return result

def AsDict(item, recursive=False):
  item_dict = ConvertFromNdb(item.to_dict(), recursive);
  item_dict['key'] = item.key.urlsafe();
  return item_dict;
