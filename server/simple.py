import logging

from google.appengine.api import users
from google.appengine.ext import ndb

import webapp2

import data_item_decorator


class SimpleModel(ndb.Model):
  name = ndb.StringProperty()


@data_item_decorator.DataItem(SimpleModel)
class Simple(object):
  pass


def Handlers():
  return Simple.Handlers()

