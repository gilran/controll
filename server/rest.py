import httplib
import json
import logging
import webapp2
from google.appengine.api import users
from webapp2_extras import sessions

import model

class Credentials(object):
  NONE = 0
  USER = 1
  CREW = 2
  ADMIN = 3

def GetUserCredentialsLevel():
  user = users.get_current_user()
  if not user:
    return Credentials.NONE
  user_entity = model.User.query(model.User.email == user.email()).get()
  return user_entity.credentials_level

class RestHandler(webapp2.RequestHandler):
  def __init__(self, request, response):
    self.initialize(request, response)
    self._required_credentials = Credentials.NONE

  def dispatch(self):
    if (self._required_credentials > Credentials.NONE and
        GetUserCredentialsLevel() < self._required_credentials):
      self.abort(httplib.UNAUTHORIZED)
      return

    self.session_store = sessions.get_store(request=self.request)
    try:
      super(RestHandler, self).dispatch()
    finally:
      self.session_store.save_sessions(self.response)

  @webapp2.cached_property
  def session(self):
    # Returns a session using the default cookie key.
    return self.session_store.get_session()

  def SendJson(self, r):
    self.response.headers['content-type'] = 'text/plain'
    self.response.write(json.dumps(r))

