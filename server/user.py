import httplib
import logging
import webapp2
from datetime import datetime

from google.appengine.api import users

from data_item_decorator import DataItem
from data_item_decorator import DEFAULT_CREDENTIALS
from rest import RestHandler
from rest import Credentials

import model

_credentials = DEFAULT_CREDENTIALS()
_credentials.query = Credentials.CREW
_credentials.fetch = Credentials.CREW

@DataItem(model.User, _credentials)
class User(object):

  @classmethod
  def LookupByEmail(cls, email):
    return model.User.query(model.User.email == email).get()

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
        user_record = User.LookupByEmail(user.email())
        if user_record:
          response['user'] = User.AsDict(user_record)

      self.SendJson(response)

  class LoginHandler(RestHandler):
    def get(self):
      user = users.get_current_user()
      if not user:
        self.abort(httplib.BAD_REQUEST)
      user_record = User.LookupByEmail(user.email())
      now = datetime.now()
      if user_record is None:
        user_record = model.User(email=user.email(), created=now)
      user_record.last_login = now
      user_record.put()
      self.redirect(self.request.get('redirect', '/'))

User.AddHandler('logged_in', User.IsLoggedInHandler)
User.AddHandler('record_login', User.LoginHandler)

def Handlers():
  return User.Handlers()
