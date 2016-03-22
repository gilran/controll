import datetime
import httplib
import json
import logging

from google.appengine.ext import ndb

from rest import RestHandler
from rest import Credentials


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
      _handlers = []

      @staticmethod
      def _ArgsMatchSpec(args):
        logging.info('Spec: %s', spec.keys())
        logging.info('Args: %s', args.keys())
        if set(spec.keys()) != set(args.keys()):
          raise Exception('Arguments mismatch.')

      @staticmethod
      def ConvertDateTime(d):
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
          else:
            result[name] = d[name]
        return result

      @staticmethod
      def All():
        return model.query()

      @staticmethod
      def Update(id, **kwargs):
        item = Cls.Fetch(id)
        if not item:
          raise Exception('Trying to update a non-existing entity.')
        converted_kwargs = Cls.ConvertDateTime(kwargs)
        for k, v in converted_kwargs.iteritems():
          setattr(item, k, v)
        item.put()
        return item

      @staticmethod
      def Insert(**kwargs):
        Cls._ArgsMatchSpec(kwargs)
        converted = Cls.ConvertDateTime(kwargs)
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
        item = model.get_by_id(id)
        return item

      @staticmethod
      def AsDict(item):
        logging.info(item)
        result = {'id': item.key.id()}
        for k in spec.iterkeys():
          assert k not in result
          value = getattr(item, k)
          if isinstance(value, datetime.datetime):
            result[k] = value.isoformat()
          else:
            result[k] = value
          logging.info("%s: %s" , k, value)
        return result

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
          self.SendJson({k: v.__name__ for k, v in spec.iteritems()})

      class ListHandlers(RestHandler):
        def __init__(self, request, response):
          super(Cls.ListHandler, self).__init__(request, response)
          self._required_credentials = credentials.list

        def get(self):
          self.SendJson(
              [(str(k), str(v)) for k, v in Cls.Handlers()])

      @classmethod
      def AddHandler(cls, name, handler):
        logging.info(cls._handlers)
        cls._handlers.append(
            ('/api/%s/%s' % (base.__name__.lower(), name), handler))

      @classmethod
      def Url(cls, name, **params):
        url = '/api/%s/%s' % (base.__name__.lower(), name)
        if len(params) > 0:
          url += '?'
          url += '%'.join('%s=%s' % (k, v) for k, v in params.iteritems())
        return url

      @classmethod
      def Handlers(cls):
        return cls._handlers

    Cls.AddHandler('', Cls.ListHandlers)
    Cls.AddHandler('describe', Cls.DescribeHandler)
    Cls.AddHandler('query', Cls.QueryHandler)
    Cls.AddHandler('insert', Cls.InsertHandler)
    Cls.AddHandler('update', Cls.UpdateHandler)
    Cls.AddHandler('delete', Cls.DeleteHandler)
    Cls.AddHandler('fetch', Cls.FetchHandler)

    return Cls

  return ClassBuilder
