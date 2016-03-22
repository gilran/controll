import datetime
import httplib
import json
import logging

from google.appengine.api import users
from google.appengine.ext import ndb

from rest import RestHandler
from rest import Credentials
from rest import GetUserCredentialsLevel

class DEFAULT_CREDENTIALS(object):
  def __init__(self):
    self.list = Credentials.NONE
    self.describe = Credentials.NONE
    self.query = Credentials.NONE
    self.insert = Credentials.USER
    self.update = Credentials.USER
    self.delete = Credentials.ADMIN
    self.fetch = Credentials.NONE

_PRIVATE_FIELDS = ['email', 'phone_number']

def DataItem(model, credentials=DEFAULT_CREDENTIALS()):
  spec = { k: type(v) for k, v in model._properties.iteritems() }

  def ClassBuilder(base):
    class Cls(base):
      _handlers = {}

      @staticmethod
      def _ArgsMatchSpec(args):
        logging.info('Spec: %s', spec.keys())
        logging.info('Args: %s', args.keys())
        if set(spec.keys()) != set(args.keys()):
          raise Exception('Arguments mismatch\nExpected: %s\nActual: %s' % (
            spec.keys(), args.keys()))

      @staticmethod
      def ConvertToNdb(d):
        result = {}
        for name, ndb_type in spec.iteritems():
          if name not in d:
            continue
          if ndb_type == ndb.DateTimeProperty:
            if isinstance(d[name], int):
              result[name] = datetime.datetime.fromtimestamp(d[name] / 1e3)
            elif isinstance(d[name], str):
              result[name] = datetime.datetime.strptime(
                  d[name], "%Y-%m-%dT%H:%M:%S.%f")
          elif ndb_type == ndb.KeyProperty:
            result[name] = ndb.Key(urlsafe=d[name])
          else:
            result[name] = d[name]
        return result

      @staticmethod
      def ConvertFromNdb(d):
        result = {}
        user = users.get_current_user()
        for k, v in d.iteritems():
          if k in _PRIVATE_FIELDS:
            if user is None:
              result[k] = 'private'
              continue
            if (GetUserCredentialsLevel() < Credentials.CREW and
                ('email' not in d or d['email'] != user.email())):
              result[k] = 'private'
              continue
          if isinstance(v, datetime.datetime):
            result[k] = v.isoformat()
          elif isinstance(v, ndb.Key):
            result[k] = Cls.AsDict(ndb.Key(urlsafe=v.urlsafe()).get())
          else:
            result[k] = v
        return result

      @staticmethod
      def All():
        return model.query()

      @staticmethod
      def Update(id, **kwargs):
        item = ndb.Key(urlsafe=id).get()
        if not item:
          raise Exception('Trying to update a non-existing entity.')
        converted_kwargs = Cls.ConvertToNdb(kwargs)
        for k, v in converted_kwargs.iteritems():
          setattr(item, k, v)
        item.put()
        return item

      @staticmethod
      def Insert(**kwargs):
        Cls._ArgsMatchSpec(kwargs)
        converted = Cls.ConvertToNdb(kwargs)
        item = model(**converted)
        item.put()
        logging.info(item)
        return item

      @staticmethod
      def Delete(id):
        key = ndb.Key(model, id)
        key.delete()

      @staticmethod
      def Fetch(id):
        if id is None:
          return None
        if isinstance(id, str):
          try:
            id = int(id)
          except:
            return None
        return ndb.Key(urlsafe=id).get()

      @staticmethod
      def AsDict(item):
        item_dict = Cls.ConvertFromNdb(item.to_dict());
        item_dict['id'] = item.key.urlsafe();
        return item_dict;

      class QueryHandler(RestHandler):
        def __init__(self, request, response):
          super(Cls.QueryHandler, self).__init__(request, response)
          self._required_credentials = credentials.query

        def get(self):
          self.SendJson([Cls.AsDict(item) for item in Cls.All()])

      class FetchHandler(RestHandler):
        def __init__(self, request, response):
          super(Cls.FetchHandler, self).__init__(request, response)
          self._required_credentials = credentials.fetch

        def get(self):
          logging.info('FetchHandler: %s', self.request.query_string)
          id = self.request.get('id')
          if not id:
            self.abort(httplib.BAD_REQUEST)
          item = Cls.Fetch(id)
          logging.info('Item is %s', item)
          if item is None:
            self.abort(httplib.NOT_FOUND)
          self.SendJson(Cls.AsDict(item))

      class UpdateHandler(RestHandler):
        def __init__(self, request, response):
          super(Cls.UpdateHandler, self).__init__(request, response)
          self._required_credentials = credentials.update

        def post(self):
          #try:
            args = json.loads(self.request.body)
            if 'id' not in args:
              logging.info('No id: %s', self.request.body)
              self.abort(httplib.BAD_REQUEST)
            id = args['id']
            del args['id']
            item = Cls.Update(id, **args)
            self.SendJson(Cls.AsDict(item))
          #except:
          #  self.abort(httplib.BAD_REQUEST)

      class InsertHandler(RestHandler):
        def __init__(self, request, response):
          super(Cls.InsertHandler, self).__init__(request, response)
          self._required_credentials = credentials.insert

        def post(self):
          #try:
            logging.info(self.request.body)
            json_item = json.loads(self.request.body)
            item = Cls.Insert(**json_item)
            self.SendJson(Cls.AsDict(item))
          #except Exception as e:
          #  logging.error('Failed to insert: %s', e)
          #  self.abort(httplib.BAD_REQUEST)

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
            logging.info(v._repeated)
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
