import json
import itertools
import logging
import time
import webapp2

import activity
import event
import user

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
