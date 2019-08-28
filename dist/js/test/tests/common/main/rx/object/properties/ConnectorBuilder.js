"use strict";

var _ObservableObject = require("../../../../../../../main/common/rx/object/ObservableObject");

var _ObservableObjectBuilder = require("../../../../../../../main/common/rx/object/ObservableObjectBuilder");

var _ConnectorBuilder = require("../../../../../../../main/common/rx/object/properties/ConnectorBuilder");

var _Tester = require("../../deep-subscribe/helpers/Tester");

/* tslint:disable:no-duplicate-string */

/* eslint-disable guard-for-in */
describe('common > main > rx > properties > ConnectorBuilder', function () {
  it('connect', function () {
    const source = new _ObservableObjectBuilder.ObservableObjectBuilder((0, _Tester.createObject)().observableObject).writable('baseProp1').writable('baseProp2').writable('prop1').writable('prop2').object;
    source.baseProp1 = 'baseProp1_init_source';

    class BaseClass1 extends _ObservableObject.ObservableObject {
      constructor(...args) {
        super(...args);
        this.source = source;
      }

    }

    class BaseClass2 extends BaseClass1 {}

    class Class1 extends BaseClass1 {}

    class Class2 extends BaseClass2 {}

    new _ConnectorBuilder.ConnectorBuilder(BaseClass1.prototype).connect('baseProp1', b => b.path(o => o.source.property['@value_property'].observableMap['#observableList']['#'].baseProp1));
    new _ConnectorBuilder.ConnectorBuilder(BaseClass2.prototype).connect('baseProp2', b => b.path(o => o['@value_property'].source.property['@value_property'].observableMap['#observableList']['#'].baseProp2), null, 'baseProp2_init');
    new _ConnectorBuilder.ConnectorBuilder(Class1.prototype).connect('prop1', b => b.path(o => o['@value_property'].source.property['@value_property'].observableMap['#observableList']['#'].prop1), null, 'prop1_init');
    new _ConnectorBuilder.ConnectorBuilder(Class2.prototype).connect('prop2', b => b.path(o => o['@value_property'].source.property['@value_property'].observableMap['#observableList']['#'].prop2), null, 'prop2_init');
    const baseObject1 = new BaseClass1();
    const baseObject2 = new BaseClass2();
    const object1 = new Class1();
    const object2 = new Class2(); // eslint-disable-next-line prefer-const

    let baseResults1 = [];

    const baseSubscriber1 = value => {
      baseResults1.push(value);
    }; // eslint-disable-next-line prefer-const


    let baseResults2 = [];

    const baseSubscriber2 = value => {
      baseResults2.push(value);
    }; // eslint-disable-next-line prefer-const


    const results1 = [];

    const subscriber1 = value => {
      results1.push(value);
    }; // eslint-disable-next-line prefer-const


    let results2 = [];

    const subscriber2 = value => {
      results2.push(value);
    };

    const baseUnsubscribe1 = [];
    const baseUnsubscribe2 = [];
    const unsubscribe1 = [];
    const unsubscribe2 = [];
    assert.strictEqual(typeof (baseUnsubscribe1[0] = baseObject1.propertyChanged.subscribe(baseSubscriber1)), 'function');
    assert.strictEqual(typeof (baseUnsubscribe2[0] = baseObject2.propertyChanged.subscribe(baseSubscriber2)), 'function');
    assert.strictEqual(typeof (unsubscribe1[0] = object1.propertyChanged.subscribe(subscriber1)), 'function');
    assert.strictEqual(typeof (unsubscribe2[0] = object2.propertyChanged.subscribe(subscriber2)), 'function');
    assert.strictEqual(baseObject1.baseProp1, 'baseProp1_init_source');
    source.baseProp1 = '1';
    assert.deepStrictEqual(baseResults1, [{
      name: 'baseProp1',
      newValue: '1',
      oldValue: 'baseProp1_init_source'
    }]);
    baseResults1 = [];
    assert.deepStrictEqual(baseResults2, []);
    assert.deepStrictEqual(results1, []);
    assert.deepStrictEqual(results2, []);
    assert.deepStrictEqual(baseObject1.baseProp1, '1');
    assert.deepStrictEqual(baseObject2.baseProp1, '1');
    assert.deepStrictEqual(object1.baseProp1, '1');
    assert.deepStrictEqual(object2.baseProp1, '1');
    assert.strictEqual(baseObject2.baseProp2, 'baseProp2_init');
    source.baseProp2 = '3';
    assert.deepStrictEqual(baseResults1, []);
    assert.deepStrictEqual(baseResults2, [{
      name: 'baseProp2',
      newValue: '3',
      oldValue: 'baseProp2_init'
    }]);
    baseResults2 = [];
    assert.deepStrictEqual(results1, []);
    assert.deepStrictEqual(results2, []);
    assert.deepStrictEqual(baseObject1.baseProp2, undefined);
    assert.deepStrictEqual(baseObject2.baseProp2, '3');
    assert.deepStrictEqual(object1.baseProp2, undefined);
    assert.deepStrictEqual(object2.baseProp2, '3');
    new _ConnectorBuilder.ConnectorBuilder(object2).readable('baseProp1', null, '7');
    assert.deepStrictEqual(baseResults1, []);
    assert.deepStrictEqual(baseResults2, []);
    assert.deepStrictEqual(results1, []);
    assert.deepStrictEqual(results2, [{
      name: 'baseProp1',
      newValue: '7',
      oldValue: '1'
    }]);
    results2 = [];
    assert.deepStrictEqual(baseObject1.baseProp1, '1');
    assert.deepStrictEqual(baseObject2.baseProp1, '1');
    assert.deepStrictEqual(object1.baseProp1, '1');
    assert.deepStrictEqual(object2.baseProp1, '7');
  });
});