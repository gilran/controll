# -*- coding: utf-8 -*-

import json
import itertools
import logging
import time
import webapp2

import activity
import event
import user

def HandleError(request, response, exception):
  logging.info(exception)
  response.headers.add_header('Content-Type', 'application/json')
  result = {
      'status': exception.code,
      'statusText': exception.explanation,
      'error_message': exception.message,
  }
  response.write(json.dumps(result))
  response.set_status(exception.code)

config = {}
config['webapp2_extras.sessions'] = {
    'secret_key': 'my-super-secret-key',
}

active_models = [activity, event, user]
handlers = []
for model in active_models:
  handlers.extend(model.Handlers())

app = webapp2.WSGIApplication(
    handlers,
    config=config,
    debug=True)
app.error_handlers[400] = HandleError
