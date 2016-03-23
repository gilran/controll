import httplib
import json
import logging

from google.appengine.ext import ndb

from rest import RestHandler
from rest import Credentials

import ndb_json

class DEFAULT_CREDENTIALS(object):
  def __init__(self):
    self.list = Credentials.NONE
    self.describe = Credentials.NONE
    self.query = Credentials.NONE
    self.insert = Credentials.USER
    self.update = Credentials.USER
    self.delete = Credentials.ADMIN
    self.fetch = Credentials.NONE


def DataItem(model, credentials=DEFAULT_CREDENTIALS()):
  spec = { k: type(v) for k, v in model._properties.iteritems() }

  def ClassBuilder(base):
    class Cls(base):
      _handlers = {}


      @staticmethod
      def _ArgsMatchSpec(args):
        if set(spec.keys()) != set(args.keys()):
          raise Exception('Arguments mismatch\nExpected: %s\nActual: %s' % (
            spec.keys(), args.keys()))


      @staticmethod
      def All():
        return model.query()

      @staticmethod
      def Update(id, **kwargs):
        item = ndb.Key(urlsafe=id).get()
        if not item:
          raise Exception('Trying to update a non-existing entity.')
        converted_kwargs = ndb_json.ConvertToNdb(kwargs)
        for k, v in converted_kwargs.iteritems():
          setattr(item, k, v)
        item.put()
        return item

      @staticmethod
      def Insert(**kwargs):
        Cls._ArgsMatchSpec(kwargs)
        converted = ndb_json.ConvertToNdb(kwargs)
        item = model(**converted)
        item.put()
        return item

      @staticmethod
      def Delete(id):
        key = ndb.Key(model, id)
        key.delete()

      @staticmethod
      def Fetch(id):
        if id is None:
          return None
        return ndb.Key(urlsafe=id).get()

      class QueryHandler(RestHandler):
        def __init__(self, request, response):
          super(Cls.QueryHandler, self).__init__(request, response)
          self._required_credentials = credentials.query

        def get(self):
          recursive = self.request.get('r', False)
          self.SendJson(
              [ndb_json.AsDict(item, recursive) for item in Cls.All()])

      class FetchHandler(RestHandler):
        def __init__(self, request, response):
          super(Cls.FetchHandler, self).__init__(request, response)
          self._required_credentials = credentials.fetch

        def get(self):
          id = self.request.get('id')
          recursive = self.request.get('r', False)
          if not id:
            self.abort(httplib.BAD_REQUEST)
          item = Cls.Fetch(id)
          if item is None:
            self.abort(httplib.NOT_FOUND)
          self.SendJson(ndb_json.AsDict(item, recursive))

      class UpdateHandler(RestHandler):
        def __init__(self, request, response):
          super(Cls.UpdateHandler, self).__init__(request, response)
          self._required_credentials = credentials.update

        def post(self):
          args = json.loads(self.request.body)
          if 'id' not in args:
            self.abort(httplib.BAD_REQUEST)
          id = args['id']
          del args['id']
          item = Cls.Update(id, **args)
          self.SendJson(ndb_json.AsDict(item, False))

      class InsertHandler(RestHandler):
        def __init__(self, request, response):
          super(Cls.InsertHandler, self).__init__(request, response)
          self._required_credentials = credentials.insert

        def post(self):
          json_item = json.loads(self.request.body)
          item = Cls.Insert(**json_item)
          self.SendJson(ndb_json.AsDict(item, False))

      class DeleteHandler(RestHandler):
        def __init__(self, request, response):
          super(Cls.DeleteHandler, self).__init__(request, response)
          self._required_credentials = credentials.delete

        def post(self):
          try:
            r = json.loads(self.request.body)
            Cls.Delete(r['id'])
          except:
            self.abort(httplib.BAD_REQUEST)

      class DescribeHandler(RestHandler):
        def __init__(self, request, response):
          super(Cls.DescribeHandler, self).__init__(request, response)
          self._required_credentials = credentials.describe

        def get(self):
          result = {}
          for k, v in model._properties.iteritems():
            property_description = type(v).__name__
            if v._repeated:
              property_description += ' (repeated)'
            elif v._default is not None:
              property_description += ' (default=%s)' % v._default
            result[k] = property_description
          self.SendJson(result)

      class ListHandlers(RestHandler):
        def __init__(self, request, response):
          super(Cls.ListHandlers, self).__init__(request, response)
          self._required_credentials = credentials.list

        def get(self):
          self.SendJson(Cls._handlers.keys())

      @classmethod
      def Url(cls, name, **params):
        url = '/api/%s/%s' % (base.__name__.lower(), name)
        if len(params) > 0:
          url += '?'
          url += '%'.join('%s=%s' % (k, v) for k, v in params.iteritems())
        return url

      @classmethod
      def AddHandler(cls, name, handler):
        cls._handlers[Cls.Url(name)] = handler

      @classmethod
      def Handlers(cls):
        return [(k, v) for k, v in cls._handlers.iteritems()]

    Cls.AddHandler('', Cls.ListHandlers)
    Cls.AddHandler('describe', Cls.DescribeHandler)
    Cls.AddHandler('query', Cls.QueryHandler)
    Cls.AddHandler('insert', Cls.InsertHandler)
    Cls.AddHandler('update', Cls.UpdateHandler)
    Cls.AddHandler('delete', Cls.DeleteHandler)
    Cls.AddHandler('fetch', Cls.FetchHandler)

    return Cls

  return ClassBuilder
