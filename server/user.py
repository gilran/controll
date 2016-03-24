import hashlib
import httplib
import json
import logging
import webapp2
from datetime import datetime

from google.appengine.api import users
from google.appengine.ext import ndb

from data_item_decorator import DataItem
from data_item_decorator import DEFAULT_CREDENTIALS
from rest import RestHandler
from rest import Credentials
from rest import CurrentUser
from rest import LookupUserByEmail

import event_utils
import model
import ndb_json

_credentials = DEFAULT_CREDENTIALS()
_credentials.query = Credentials.CREW
_credentials.fetch = Credentials.CREW

@DataItem(model.User, _credentials)
class User(object):
  pass


def MakeUserId(email):
  id_hash = hashlib.sha1()
  id_hash.update(email)
  return id_hash.hexdigest()


class IsLoggedInHandler(RestHandler):
  def get(self):
    return_url = self.request.get('source', self.request.uri)

    # Creating the response assuming the user is not logged in.
    response = {}
    response['url'] = users.create_login_url(
        User.Url('record_login', redirect=return_url))
    response['email'] = None
    response['user'] = None

    user = users.get_current_user()
    if user:
      # Updating with user data.
      response['url'] = users.create_logout_url(return_url)
      response['email'] = user.email()
      user_record = LookupUserByEmail(user.email())
      if not user_record:
        user_record = model.User(
            id=MakeUserId(user.email()),
            email=user.email(),
            created=datetime.now())
        user_record.put()
      response['user'] = ndb_json.AsDict(user_record)

    self.SendJson(response)

class LoginHandler(RestHandler):
  def get(self):
    user = users.get_current_user()
    if not user:
      self.abort(httplib.BAD_REQUEST)
    user_record = LookupUserByEmail(user.email())
    now = datetime.now()
    if user_record is None:
      user_record = model.User(
          id=MakeUserId(user.email()),
          email=user.email(),
          created=now)
    user_record.last_login = now
    user_record.put()
    self.redirect(self.request.get('redirect', '/'))

class UpdateHandler(RestHandler):
  def __init__(self, request, response):
    super(UpdateHandler, self).__init__(request, response)
    self._required_credentials = _credentials.update

  def post(self):
    args = json.loads(self.request.body)
    if 'id' not in args:
      logging.info('No id: %s', self.request.body)
      self.abort(httplib.BAD_REQUEST)
    id = args['id']
    del args['id']
    if 'credentials_level' in args:
      current_user = CurrentUser()
      if not current_user:
        args['credentials_level'] = Credentials.USER
      elif current_user.credentials_level < args['credentials_level']:
        self.abort(httplib.UNAUTHORIZED)
        return
    item = User.Update(id, **args)
    self.SendJson(ndb_json.AsDict(item, False))

class EventsListHandler(RestHandler):
  def __init__(self, request, response):
    super(EventsListHandler, self).__init__(request, response)

  def get(self):
    user = CurrentUser()
    if not user:
      self.SendJson([])
      return

    user_event = event_utils.UserEvents(user.key)
    self.SendJson([event_utils.MakeProgramEvent(e) for e in user_event])

User.AddHandler('logged_in', IsLoggedInHandler)
User.AddHandler('record_login', LoginHandler)
User.AddHandler('update', UpdateHandler)
User.AddHandler('events', EventsListHandler)

def Handlers():
  return User.Handlers()
