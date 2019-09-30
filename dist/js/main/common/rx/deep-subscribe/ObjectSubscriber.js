"use strict";

var _interopRequireDefault = require("@babel/runtime-corejs3/helpers/interopRequireDefault");

exports.__esModule = true;
exports.ObjectSubscriber = void 0;

var _isArray = _interopRequireDefault(require("@babel/runtime-corejs3/core-js-stable/array/is-array"));

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime-corejs3/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime-corejs3/helpers/createClass"));

var _isNan = _interopRequireDefault(require("@babel/runtime-corejs3/core-js-stable/number/is-nan"));

var _helpers = require("../../helpers/helpers");

var _objectUniqueId = require("../../helpers/object-unique-id");

var _array = require("../../lists/helpers/array");

var _common = require("./contracts/common");

/* tslint:disable:no-array-delete*/
function compareSubscribed(o1, o2) {
  if (typeof o1.value !== 'undefined') {
    if (typeof o2.value !== 'undefined') {
      return 0;
    }

    return 1;
  }

  if (typeof o2.value !== 'undefined') {
    return -1;
  }

  if (typeof o1.isOwnProperty !== 'undefined' && typeof o2.isOwnProperty !== 'undefined') {
    if (o1.isOwnProperty) {
      if (o2.isOwnProperty) {
        return 0;
      }

      return 1;
    }

    if (o2.isOwnProperty) {
      return -1;
    }
  }

  return 0;
}

function valuesEqual(v1, v2) {
  return v1 === v2 || (0, _isNan.default)(v1) && (0, _isNan.default)(v2);
}

var ObjectSubscriber =
/*#__PURE__*/
function () {
  function ObjectSubscriber(changeValue, lastValue) {
    (0, _classCallCheck2.default)(this, ObjectSubscriber);
    this._changeValue = changeValue;
    this._lastValue = lastValue;
  }

  (0, _createClass2.default)(ObjectSubscriber, [{
    key: "insertSubscribed",
    value: function insertSubscribed(subscribedValue) {
      var _subscribedValues = this._subscribedValues;

      if (!_subscribedValues) {
        this._subscribedValues = _subscribedValues = [];
      }

      var index = (0, _array.binarySearch)(_subscribedValues, subscribedValue, null, null, compareSubscribed, 1);
      var len = _subscribedValues.length;

      if (index < 0) {
        index = ~index;

        if (index === len) {
          _subscribedValues.push(subscribedValue);

          this._lastValue(subscribedValue.value, subscribedValue.parent, subscribedValue.key, subscribedValue.keyType);

          return;
        }
      }

      for (var i = len - 1; i >= index; i--) {
        _subscribedValues[i + 1] = _subscribedValues[i];
      }

      _subscribedValues[index] = subscribedValue;
    }
  }, {
    key: "removeSubscribed",
    value: function removeSubscribed(subscribedValue) {
      var _subscribedValues = this._subscribedValues;

      if (_subscribedValues) {
        var index = (0, _array.binarySearch)(_subscribedValues, subscribedValue, null, null, compareSubscribed, -1);

        if (index >= 0) {
          var len = _subscribedValues.length;

          for (; index < len; index++) {
            if (valuesEqual(_subscribedValues[index].value, subscribedValue.value) && _subscribedValues[index].parent === subscribedValue.parent && _subscribedValues[index].keyType === subscribedValue.keyType && _subscribedValues[index].key === subscribedValue.key) {
              break;
            }
          }

          if (index >= 0 && index < len) {
            for (var i = index + 1; i < len; i++) {
              _subscribedValues[i - 1] = _subscribedValues[i];
            }

            _subscribedValues.length = len - 1;

            if (len === 1) {
              this._lastValue(void 0, null, null, null);
            } else if (index === len - 1) {
              var nextSubscribedValue = _subscribedValues[len - 2];

              this._lastValue(nextSubscribedValue.value, nextSubscribedValue.parent, nextSubscribedValue.key, nextSubscribedValue.keyType);
            }

            return;
          }
        }
      }

      if (typeof subscribedValue.value !== 'undefined') {
        throw new Error("subscribedValue no found: " + subscribedValue.parent.constructor.name + "." + subscribedValue.key + " = " + subscribedValue.value);
      }
    }
  }, {
    key: "change",
    value: function change(key, oldValue, newValue, parent, changeType, keyType, propertiesPath, ruleDescription) {
      var _this = this;

      var unsubscribedLast;
      var nextChangeType = _common.ValueChangeType.None;

      if (this._changeValue) {
        if ((changeType & _common.ValueChangeType.Unsubscribe) !== 0) {
          var unsubscribed;

          if (oldValue instanceof Object) {
            var _unsubscribersCount = this._unsubscribersCount;

            if (_unsubscribersCount) {
              var itemUniqueId = (0, _objectUniqueId.getObjectUniqueId)(oldValue);
              var unsubscribeCount = _unsubscribersCount[itemUniqueId];

              if (unsubscribeCount != null) {
                if (unsubscribeCount) {
                  if (unsubscribeCount > 1) {
                    _unsubscribersCount[itemUniqueId] = unsubscribeCount - 1;
                  } else {
                    var _unsubscribers = this._unsubscribers;
                    var unsubscribe = _unsubscribers[itemUniqueId]; // unsubscribers[itemUniqueId] = null // faster but there is a danger of memory overflow with nulls

                    delete _unsubscribers[itemUniqueId];
                    delete _unsubscribersCount[itemUniqueId];

                    if ((0, _isArray.default)(unsubscribe)) {
                      for (var i = 0, len = unsubscribe.length; i < len; i++) {
                        unsubscribe[i]();
                      }
                    } else {
                      unsubscribe();
                    }

                    unsubscribedLast = true;
                  }
                }

                unsubscribed = true;
              }
            }
          }

          if (unsubscribedLast || !unsubscribed) {
            nextChangeType |= _common.ValueChangeType.Unsubscribe;
          }
        }

        if ((changeType & _common.ValueChangeType.Subscribe) !== 0) {
          if (!(newValue instanceof Object)) {
            var unsubscribeValue = (0, _helpers.checkIsFuncOrNull)(this._changeValue(key, oldValue, newValue, parent, nextChangeType | _common.ValueChangeType.Subscribe, keyType, unsubscribedLast));

            if (unsubscribeValue) {
              unsubscribeValue();
              throw new Error('You should not return unsubscribe function for non Object value.\n' + 'For subscribe value types use their object wrappers: Number, Boolean, String classes.\n' + ("Unsubscribe function: " + unsubscribeValue + "\nValue: " + newValue + "\n") + ("Value property path: " + ((propertiesPath ? propertiesPath() + '.' : '') + (key == null ? '' : key + '(' + ruleDescription + ')'))));
            }
          } else {
            var _itemUniqueId = (0, _objectUniqueId.getObjectUniqueId)(newValue);

            var _unsubscribers2 = this._unsubscribers,
                _unsubscribersCount2 = this._unsubscribersCount;

            if (_unsubscribers2 && _unsubscribers2[_itemUniqueId]) {
              this._changeValue(key, oldValue, newValue, parent, nextChangeType, key, unsubscribedLast);

              _unsubscribersCount2[_itemUniqueId]++;
            } else {
              if (!_unsubscribers2) {
                this._unsubscribers = _unsubscribers2 = [];
                this._unsubscribersCount = _unsubscribersCount2 = [];
              }

              var _unsubscribeValue = (0, _helpers.checkIsFuncOrNull)(this._changeValue(key, oldValue, newValue, parent, nextChangeType | _common.ValueChangeType.Subscribe, keyType, unsubscribedLast));

              if (_unsubscribeValue) {
                _unsubscribers2[_itemUniqueId] = _unsubscribeValue;
                _unsubscribersCount2[_itemUniqueId] = 1; // return this._setUnsubscribeObject(itemUniqueId, unsubscribeValue)
              }
            }
          }
        } else {
          this._changeValue(key, oldValue, newValue, parent, nextChangeType, key, unsubscribedLast);
        }
      }

      if (this._lastValue) {
        if ((changeType & _common.ValueChangeType.Unsubscribe) !== 0) {
          this.removeSubscribed({
            value: oldValue,
            parent: parent,
            key: key,
            keyType: keyType
          });
        }

        if ((changeType & _common.ValueChangeType.Subscribe) !== 0) {
          this.insertSubscribed({
            value: newValue,
            parent: parent,
            key: key,
            keyType: keyType,
            isOwnProperty: parent != null && key in parent
          });
        }
      }

      if ((changeType & _common.ValueChangeType.Subscribe) !== 0) {
        return function () {
          _this.change(key, newValue, void 0, parent, _common.ValueChangeType.Unsubscribe, keyType, propertiesPath, ruleDescription);
        };
      }
    }
  }]);
  return ObjectSubscriber;
}();

exports.ObjectSubscriber = ObjectSubscriber;