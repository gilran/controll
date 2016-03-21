import logging

from google.appengine.api import users
from google.appengine.ext import ndb

import webapp2

import data_item_decorator
from rest import RestHandler


class UserModel(ndb.Model):
  email = ndb.StringProperty()
  name = ndb.StringProperty()
  birth_year = ndb.IntegerProperty()
  phone_number = ndb.StringProperty()
  contact_me = ndb.BooleanProperty()
  about = ndb.StringProperty()
  created = ndb.DateTimeProperty()
  last_login = ndb.DateTimeProperty()


@data_item_decorator.DataItem(UserModel)
class User(object):
  class IsLoggedIn(RestHandler):
    def get(self):
      user = users.get_current_user()
      return_url = self.request.get('source', self.request.uri)
      response = {}
      if user:
        response['url'] = users.create_logout_url(return_url)
        response['email'] = user.email()
      else:
        response['url'] = users.create_login_url(return_url)
        response['user'] = None
      self.SendJson(response)

User.AddHandler('logged_in', User.IsLoggedIn)

def Handlers():
  return User.Handlers()
