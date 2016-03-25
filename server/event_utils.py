from google.appengine.ext import ndb

import model
import ndb_json

def MakeProgramEvent(event):
  """Changes the given event so that it will have all program details.

  Args:
    event: A flat event.

  Returns:
    The event, modified to have all details needed for the program.
  """
  event_dict = ndb_json.AsDict(event, False)
  event_dict['activity'] = ndb_json.AsDict(event.activity.get(), False)
  event_dict['crew'] = []
  for user in event.crew:
    user_record = ndb_json.AsDict(user.get(), False)
    event_dict['crew'].append(
        {'key': user_record['key'], 'name': user_record['name']})
  return event_dict

def UserEvents(user_key):
  """Returns the user events for the given user key."""
  return model.Event.query(ndb.OR(
      model.Event.crew == user_key,
      model.Event.participants == user_key))
