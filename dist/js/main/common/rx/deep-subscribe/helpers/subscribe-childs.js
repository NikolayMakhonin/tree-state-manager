"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.subscribeChilds = subscribeChilds;

var _IListChanged = require("../../../lists/contracts/IListChanged");

var _constants = require("../contracts/constants");

// region subscribeChildsObject
function subscribeChildsObject({
  object,
  propertyPredicate,
  subscribeItem,
  unsubscribeItem
}) {
  const {
    propertyChanged
  } = object;

  if (!propertyChanged) {
    return;
  }

  const any = propertyPredicate(_constants.ANY);
  return propertyChanged.subscribe(event => {
    if (any || propertyPredicate(event.name)) {
      unsubscribeItem(event.oldValue);
      subscribeItem(event.newValue);
    }
  });
} // endregion
// region subscribeChildsList


function subscribeChildsList({
  object,
  propertyPredicate,
  subscribeItem,
  unsubscribeItem
}) {
  const {
    listChanged
  } = object;

  if (!listChanged) {
    return;
  }

  if (!propertyPredicate(_constants.ANY)) {
    return null;
  }

  return listChanged.subscribe(({
    type,
    oldItems,
    newItems
  }) => {
    switch (type) {
      case _IListChanged.ListChangedType.Added:
        for (let i = 0, len = newItems.length; i < len; i++) {
          subscribeItem(newItems[i]);
        }

        break;

      case _IListChanged.ListChangedType.Removed:
        for (let i = 0, len = oldItems.length; i < len; i++) {
          unsubscribeItem(oldItems[i]);
        }

        break;

      case _IListChanged.ListChangedType.Set:
        unsubscribeItem(oldItems[0]);
        subscribeItem(newItems[0]);
        break;
    }
  });
} // endregion
// region subscribeChildsSet


function subscribeChildsSet({
  object,
  propertyPredicate,
  subscribeItem,
  unsubscribeItem
}) {
  const {
    setChanged
  } = object;

  if (!setChanged) {
    return;
  }

  if (!propertyPredicate(_constants.ANY)) {
    return null;
  }

  return setChanged.subscribe(({
    oldItems,
    newItems
  }) => {
    for (let i = 0, len = oldItems.length; i < len; i++) {
      unsubscribeItem(oldItems[i]);
    }

    for (let i = 0, len = newItems.length; i < len; i++) {
      subscribeItem(newItems[i]);
    }
  });
} // endregion
// region subscribeChildsMap


function subscribeChildsMap({
  object,
  propertyPredicate,
  subscribeItem,
  unsubscribeItem
}) {
  const {
    mapChanged
  } = object;

  if (!mapChanged) {
    return;
  }

  if (!propertyPredicate(_constants.ANY)) {
    return null;
  }

  return mapChanged.subscribe(({
    key,
    oldValue,
    newValue
  }) => {
    unsubscribeItem([key, oldValue]);
    subscribeItem([key, newValue]);
  });
} // endregion
// region subscribeChilds


const childSubscribers = [subscribeChildsObject, subscribeChildsList, subscribeChildsSet, subscribeChildsMap];

function subscribeChilds(options) {
  let unsubscribers;

  for (let i = 0, len = childSubscribers.length; i < len; i++) {
    const unsubscribe = childSubscribers[i](options);

    if (unsubscribe) {
      if (!unsubscribers) {
        unsubscribers = [unsubscribe];
      } else {
        unsubscribers.push(unsubscribe);
      }
    }
  }

  if (!unsubscribers) {
    return null;
  }

  return () => {
    for (let i = 0, len = unsubscribers.length; i < len; i++) {
      unsubscribers[i]();
    }
  };
} // endregion