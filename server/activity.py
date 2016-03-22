import model

from data_item_decorator import DataItem

@DataItem(model.Activity)
class Activity(object):
  pass

def Handlers():
  return Activity.Handlers()
