"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.RuleBuilder = void 0;

var _constants = require("./contracts/constants");

var _rules = require("./contracts/rules");

var _funcPropertiesPath = require("./helpers/func-properties-path");

var _RuleSubscribe = require("./RuleSubscribe");

const RuleSubscribeObjectPropertyNames = _RuleSubscribe.RuleSubscribeObject.bind(null, null);

const RuleSubscribeMapKeys = _RuleSubscribe.RuleSubscribeMap.bind(null, null); // const UNSUBSCRIBE_PROPERTY_PREFIX = Math.random().toString(36)
// let nextUnsubscribePropertyId = 0


class RuleNothing {
  constructor() {
    this.type = _rules.RuleType.Nothing;
    this.description = 'nothing';
  }

}

class RuleBuilder {
  rule(rule) {
    const {
      _ruleLast: ruleLast
    } = this;

    if (ruleLast) {
      ruleLast.next = rule;
    } else {
      this.result = rule;
    }

    this._ruleLast = rule;
    return this;
  }

  ruleSubscribe(ruleSubscribe, description) {
    if (description) {
      ruleSubscribe.description = description;
    }

    if (ruleSubscribe.unsubscribers) {
      throw new Error('You should not add duplicate IRuleSubscribe instances. Clone rule before add.');
    } // !Warning defineProperty is slow
    // Object.defineProperty(ruleSubscribe, 'unsubscribePropertyName', {
    // 	configurable: true,
    // 	enumerable: false,
    // 	writable: false,
    // 	value: UNSUBSCRIBE_PROPERTY_PREFIX + (nextUnsubscribePropertyId++),
    // })


    ruleSubscribe.unsubscribers = []; // UNSUBSCRIBE_PROPERTY_PREFIX + (nextUnsubscribePropertyId++)

    return this.rule(ruleSubscribe);
  }

  nothing() {
    return this.rule(new RuleNothing());
  }
  /**
   * Object property, Array index
   */


  propertyName(propertyName) {
    return this.ruleSubscribe(new RuleSubscribeObjectPropertyNames(propertyName), propertyName);
  }
  /**
   * Object property, Array index
   */


  propertyNames(...propertiesNames) {
    return this.ruleSubscribe(new RuleSubscribeObjectPropertyNames(...propertiesNames), propertiesNames.join('|'));
  }
  /**
   * Object property, Array index
   */


  propertyAll() {
    return this.ruleSubscribe(new _RuleSubscribe.RuleSubscribeObject(), _constants.ANY_DISPLAY);
  }
  /**
   * Object property, Array index
   */


  propertyPredicate(predicate, description) {
    return this.ruleSubscribe(new _RuleSubscribe.RuleSubscribeObject(predicate), description);
  }
  /**
   * Object property, Array index
   */


  propertyRegexp(regexp) {
    if (!(regexp instanceof RegExp)) {
      throw new Error(`regexp (${regexp}) is not instance of RegExp`);
    }

    return this.propertyPredicate(name => regexp.test(name), regexp.toString());
  }
  /**
   * IListChanged & Iterable, ISetChanged & Iterable, IMapChanged & Iterable, Iterable
   */


  collection() {
    return this.ruleSubscribe(new _RuleSubscribe.RuleSubscribeCollection(), _constants.COLLECTION_PREFIX);
  }
  /**
   * IMapChanged & Map, Map
   */


  mapKey(key) {
    return this.ruleSubscribe(new RuleSubscribeMapKeys(key), _constants.COLLECTION_PREFIX + key);
  }
  /**
   * IMapChanged & Map, Map
   */


  mapKeys(...keys) {
    return this.ruleSubscribe(new RuleSubscribeMapKeys(...keys), _constants.COLLECTION_PREFIX + keys.join('|'));
  }
  /**
   * IMapChanged & Map, Map
   */


  mapAll() {
    return this.ruleSubscribe(new _RuleSubscribe.RuleSubscribeMap(), _constants.COLLECTION_PREFIX);
  }
  /**
   * IMapChanged & Map, Map
   */


  mapPredicate(keyPredicate, description) {
    return this.ruleSubscribe(new _RuleSubscribe.RuleSubscribeMap(keyPredicate), description);
  }
  /**
   * IMapChanged & Map, Map
   */


  mapRegexp(keyRegexp) {
    if (!(keyRegexp instanceof RegExp)) {
      throw new Error(`keyRegexp (${keyRegexp}) is not instance of RegExp`);
    }

    return this.mapPredicate(name => keyRegexp.test(name), keyRegexp.toString());
  }

  path(getValueFunc) {
    for (const propertyNames of (0, _funcPropertiesPath.getFuncPropertiesPath)(getValueFunc)) {
      if (!propertyNames.startsWith(_constants.COLLECTION_PREFIX)) {
        this.propertyNames(...propertyNames.split('|'));
      } else {
        const keys = propertyNames.substring(1);

        if (keys === '') {
          this.collection();
        } else {
          this.mapKeys(...keys.split('|'));
        }
      }
    }

    return this;
  }

  any(...getChilds) {
    if (getChilds.length === 0) {
      throw new Error('any() parameters is empty');
    }

    const rule = {
      type: _rules.RuleType.Any,
      rules: getChilds.map(o => {
        const subRule = o(new RuleBuilder()).result;

        if (!subRule) {
          throw new Error(`Any subRule=${rule}`);
        }

        return subRule;
      })
    };
    return this.rule(rule);
  }

  repeat(countMin, countMax, getChild) {
    const subRule = getChild(new RuleBuilder()).result;

    if (!subRule) {
      throw new Error(`getChild(...).rule = ${subRule}`);
    }

    if (countMax == null) {
      countMax = Number.MAX_SAFE_INTEGER;
    }

    if (countMin == null) {
      countMin = 0;
    }

    if (countMax < countMin || countMax <= 0) {
      return this;
    }

    let rule;

    if (countMax === countMin && countMax === 1) {
      rule = subRule;
    } else {
      rule = {
        type: _rules.RuleType.Repeat,
        countMin,
        countMax,
        rule: getChild(new RuleBuilder()).result
      };
    }

    return this.rule(rule);
  }

}

exports.RuleBuilder = RuleBuilder;