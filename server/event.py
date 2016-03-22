import model

from data_item_decorator import DataItem

@DataItem(model.Event)
class Event(object):
  pass

def Handlers():
  return Event.Handlers()

