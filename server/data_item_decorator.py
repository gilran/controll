import datetime
import httplib
import json
import logging

from google.appengine.ext import ndb

from rest import RestHandler
from rest import Credentials


def DataItem(model):
  spec = { k: type(v) for k, v in model._properties.iteritems() }

  def ClassBuilder(base):
    class Cls(base):
      _handlers = []

      @staticmethod
      def _ArgsMatchSpec(args):
        assert set(spec.keys()) == set(args.keys())

      @staticmethod
      def ConvertDateTime(d):
        result = {}
        for name, ndb_type in spec.iteritems():
          if ndb_type == ndb.DateTimeProperty:
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
        Cls._ArgsMatchSpec(kwargs)
        item = model(id=id, **Cls.ConvertDateTime(kwargs))
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
        def get(self):
          self.SendJson([Cls.AsDict(item) for item in Cls.All()])

      class UpdateHandler(RestHandler):
        def post(self):
          try:
            item = Cls.Update(**json.loads(self.request.body))
            self.SendJson(Cls.AsDict(item))
          except:
            self.abort(httplib.BAD_REQUEST)

      class InsertHandler(RestHandler):
        def __init__(self, request, response):
          super(Cls.InsertHandler, self).__init__(request, response)
          self._required_credentials = Credentials.USER

        def post(self):
          try:
            logging.info(self.request.body)
            json_item = json.loads(self.request.body)
            item = Cls.Insert(**json_item)
            self.SendJson(Cls.AsDict(item))
          except:
            self.abort(httplib.BAD_REQUEST)

      class DeleteHandler(RestHandler):
        def post(self):
          try:
            r = json.loads(self.request.body)
            Cls.Delete(r['id'])
          except:
            self.abort(httplib.BAD_REQUEST)

      class DescribeHandler(RestHandler):
        def get(self):
          self.SendJson({k: v.__name__ for k, v in spec.iteritems()})

      class ListHandlers(RestHandler):
        def get(self):
          self.SendJson(
              [(str(k), str(v)) for k, v in Cls.Handlers()])

      @classmethod
      def AddHandler(cls, name, handler):
        logging.info(cls._handlers)
        cls._handlers.append(
            ('/api/%s/%s' % (base.__name__.lower(), name), handler))

      @classmethod
      def Handlers(cls):
        return cls._handlers

    Cls.AddHandler('', Cls.ListHandlers)
    Cls.AddHandler('describe', Cls.DescribeHandler)
    Cls.AddHandler('query', Cls.QueryHandler)
    Cls.AddHandler('insert', Cls.InsertHandler)
    Cls.AddHandler('update', Cls.UpdateHandler)
    Cls.AddHandler('delete', Cls.DeleteHandler)

    return Cls

  return ClassBuilder
