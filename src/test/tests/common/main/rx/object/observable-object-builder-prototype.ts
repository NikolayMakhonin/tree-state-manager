/* eslint-disable guard-for-in */
import {IPropertyChangedEvent} from '../../../../../../main/common/rx/object/IPropertyChanged'
import {ObservableClass} from '../../../../../../main/common/rx/object/ObservableClass'
import {ObservableObjectBuilder} from '../../../../../../main/common/rx/object/ObservableObjectBuilder'
import {assert} from '../../../../../../main/common/test/Assert'
import {describe, it} from '../../../../../../main/common/test/Mocha'

describe('common > main > rx > observable-object-builder-prototype', function () {
	function assertEvents(events: IPropertyChangedEvent[], check: IPropertyChangedEvent[]) {
		events = events && events.map(o => ({
			name    : o.name,
			oldValue: o.oldValue,
			newValue: o.newValue,
		}))

		assert.deepStrictEqual(events, check)
	}

	it('writable', function () {
		class BaseClass1 extends ObservableClass {
			public baseProp1: any
		}

		class BaseClass2 extends BaseClass1 {
			public baseProp2: any
		}

		class Class1 extends BaseClass1 {
			public prop1: any
		}

		class Class2 extends BaseClass2 {
			public prop2: any
		}

		const baseBuilder1 = new ObservableObjectBuilder(BaseClass1.prototype)
			.writable('baseProp1')

		const baseBuilder2 = new ObservableObjectBuilder(BaseClass2.prototype)
			.writable('baseProp2')

		const builder1 = new ObservableObjectBuilder(Class1.prototype)
			.writable('prop1')

		const builder2 = new ObservableObjectBuilder(Class2.prototype)
			.writable('prop2')

		const baseObject1 = new BaseClass1()
		const baseObject2 = new BaseClass2()
		const object1 = new Class1()
		const object2 = new Class2()

		// eslint-disable-next-line prefer-const
		let baseResults1 = []
		const baseSubscriber1 = value => {
			baseResults1.push(value)
		}

		// eslint-disable-next-line prefer-const
		let baseResults2 = []
		const baseSubscriber2 = value => {
			baseResults2.push(value)
		}

		// eslint-disable-next-line prefer-const
		let results1 = []
		const subscriber1 = value => {
			results1.push(value)
		}

		// eslint-disable-next-line prefer-const
		let results2 = []
		const subscriber2 = value => {
			results2.push(value)
		}

		const baseUnsubscribe1 = []
		const baseUnsubscribe2 = []
		const unsubscribe1 = []
		const unsubscribe2 = []

		assert.strictEqual(typeof (baseUnsubscribe1[0] = baseObject1.propertyChanged.subscribe(baseSubscriber1)), 'function')
		assert.strictEqual(typeof (baseUnsubscribe2[0] = baseObject2.propertyChanged.subscribe(baseSubscriber2)), 'function')
		assert.strictEqual(typeof (unsubscribe1[0] = object1.propertyChanged.subscribe(subscriber1)), 'function')
		assert.strictEqual(typeof (unsubscribe2[0] = object2.propertyChanged.subscribe(subscriber2)), 'function')

		baseObject1.baseProp1 = '1'
		assertEvents(baseResults1, [
			{
				name    : 'baseProp1',
				newValue: '1',
				oldValue: undefined,
			},
		])
		baseResults1 = []
		assertEvents(baseResults2, [])
		assertEvents(results1, [])
		assertEvents(results2, [])
		assert.deepStrictEqual(baseObject1.baseProp1, '1')
		assert.deepStrictEqual(baseObject2.baseProp1, undefined)
		assert.deepStrictEqual(object1.baseProp1, undefined)
		assert.deepStrictEqual(object2.baseProp1, undefined)

		baseObject2.baseProp1 = '2'
		assertEvents(baseResults1, [])
		assertEvents(baseResults2, [
			{
				name    : 'baseProp1',
				newValue: '2',
				oldValue: undefined,
			},
		])
		baseResults2 = []
		assertEvents(results1, [])
		assertEvents(results2, [])
		assert.deepStrictEqual(baseObject1.baseProp1, '1')
		assert.deepStrictEqual(baseObject2.baseProp1, '2')
		assert.deepStrictEqual(object1.baseProp1, undefined)
		assert.deepStrictEqual(object2.baseProp1, undefined)

		baseObject2.baseProp2 = '3'
		assertEvents(baseResults1, [])
		assertEvents(baseResults2, [
			{
				name    : 'baseProp2',
				newValue: '3',
				oldValue: undefined,
			},
		])
		baseResults2 = []
		assertEvents(results1, [])
		assertEvents(results2, [])
		assert.deepStrictEqual((baseObject1 as any).baseProp2, undefined)
		assert.deepStrictEqual(baseObject2.baseProp2, '3')
		assert.deepStrictEqual((object1 as any).baseProp2, undefined)
		assert.deepStrictEqual(object2.baseProp2, undefined)

		object1.baseProp1 = '4'
		assertEvents(baseResults1, [])
		assertEvents(baseResults2, [])
		assertEvents(results1, [
			{
				name    : 'baseProp1',
				newValue: '4',
				oldValue: undefined,
			},
		])
		results1 = []
		assertEvents(results2, [])
		assert.deepStrictEqual(baseObject1.baseProp1, '1')
		assert.deepStrictEqual(baseObject2.baseProp1, '2')
		assert.deepStrictEqual(object1.baseProp1, '4')
		assert.deepStrictEqual(object2.baseProp1, undefined)

		object2.baseProp1 = '5'
		assertEvents(baseResults1, [])
		assertEvents(baseResults2, [])
		assertEvents(results1, [])
		assertEvents(results2, [
			{
				name    : 'baseProp1',
				newValue: '5',
				oldValue: undefined,
			},
		])
		results2 = []
		assert.deepStrictEqual(baseObject1.baseProp1, '1')
		assert.deepStrictEqual(baseObject2.baseProp1, '2')
		assert.deepStrictEqual(object1.baseProp1, '4')
		assert.deepStrictEqual(object2.baseProp1, '5')

		object2.baseProp2 = '6'
		assertEvents(baseResults1, [])
		assertEvents(baseResults2, [])
		assertEvents(results1, [])
		assertEvents(results2, [
			{
				name    : 'baseProp2',
				newValue: '6',
				oldValue: undefined,
			},
		])
		results2 = []
		assert.deepStrictEqual((baseObject1 as any).baseProp2, undefined)
		assert.deepStrictEqual(baseObject2.baseProp2, '3')
		assert.deepStrictEqual((object1 as any).baseProp2, undefined)
		assert.deepStrictEqual(object2.baseProp2, '6')

		new ObservableObjectBuilder(object2)
			.readable('baseProp1', null, '7')

		assertEvents(baseResults1, [])
		assertEvents(baseResults2, [])
		assertEvents(results1, [])
		assertEvents(results2, [
			{
				name    : 'baseProp1',
				newValue: '7',
				oldValue: '5',
			},
		])
		results2 = []
		assert.deepStrictEqual(baseObject1.baseProp1, '1')
		assert.deepStrictEqual(baseObject2.baseProp1, '2')
		assert.deepStrictEqual(object1.baseProp1, '4')
		assert.deepStrictEqual(object2.baseProp1, '7')
	})

	it('readable', function () {
		class BaseClass1 extends ObservableClass {
			public baseProp1: any
		}

		class BaseClass2 extends BaseClass1 {
			public baseProp2: any
		}

		class Class1 extends BaseClass1 {
			public prop1: any
		}

		class Class2 extends BaseClass2 {
			public prop2: any
		}

		const baseBuilder1 = new ObservableObjectBuilder(BaseClass1.prototype)
			.readable('baseProp1')

		const baseBuilder2 = new ObservableObjectBuilder(BaseClass2.prototype)
			.readable('baseProp2')

		const builder1 = new ObservableObjectBuilder(Class1.prototype)
			.readable('prop1')

		const builder2 = new ObservableObjectBuilder(Class2.prototype)
			.readable('prop2')

		const baseObject1 = new BaseClass1()
		const baseObject2 = new BaseClass2()
		const object1 = new Class1()
		const object2 = new Class2()

		// eslint-disable-next-line prefer-const
		let baseResults1 = []
		const baseSubscriber1 = value => {
			baseResults1.push(value)
		}

		// eslint-disable-next-line prefer-const
		let baseResults2 = []
		const baseSubscriber2 = value => {
			baseResults2.push(value)
		}

		// eslint-disable-next-line prefer-const
		let results1 = []
		const subscriber1 = value => {
			results1.push(value)
		}

		// eslint-disable-next-line prefer-const
		let results2 = []
		const subscriber2 = value => {
			results2.push(value)
		}

		const baseUnsubscribe1 = []
		const baseUnsubscribe2 = []
		const unsubscribe1 = []
		const unsubscribe2 = []

		assert.strictEqual(typeof (baseUnsubscribe1[0] = baseObject1.propertyChanged.subscribe(baseSubscriber1)), 'function')
		assert.strictEqual(typeof (baseUnsubscribe2[0] = baseObject2.propertyChanged.subscribe(baseSubscriber2)), 'function')
		assert.strictEqual(typeof (unsubscribe1[0] = object1.propertyChanged.subscribe(subscriber1)), 'function')
		assert.strictEqual(typeof (unsubscribe2[0] = object2.propertyChanged.subscribe(subscriber2)), 'function')

		baseBuilder1.readable('baseProp1', null, '1')
		assertEvents(baseResults1, [])
		baseResults1 = []
		assertEvents(baseResults2, [])
		assertEvents(results1, [])
		assertEvents(results2, [])
		assert.deepStrictEqual(baseObject1.baseProp1, '1')
		assert.deepStrictEqual(baseObject2.baseProp1, '1')
		assert.deepStrictEqual(object1.baseProp1, '1')
		assert.deepStrictEqual(object2.baseProp1, '1')

		baseBuilder2.readable('baseProp1', {factory: () => '2'})
		assertEvents(baseResults1, [])
		assertEvents(baseResults2, [])
		baseResults2 = []
		assertEvents(results1, [])
		assertEvents(results2, [])
		assert.deepStrictEqual(baseObject1.baseProp1, '1')
		assert.deepStrictEqual(baseObject2.baseProp1, '1')
		assert.deepStrictEqual(object1.baseProp1, '1')
		assert.deepStrictEqual(object2.baseProp1, '1')

		delete baseObject1.baseProp1
		delete baseObject2.baseProp1
		delete object1.baseProp1
		delete object2.baseProp1
		assertEvents(baseResults1, [])
		assertEvents(baseResults2, [])
		baseResults2 = []
		assertEvents(results1, [])
		assertEvents(results2, [])
		assert.deepStrictEqual(baseObject1.baseProp1, '1')
		assert.deepStrictEqual(baseObject2.baseProp1, '2')
		assert.deepStrictEqual(object1.baseProp1, '1')
		assert.deepStrictEqual(object2.baseProp1, '2')

		baseBuilder2.readable('baseProp2', null, '3')
		assertEvents(baseResults1, [])
		assertEvents(baseResults2, [])
		baseResults2 = []
		assertEvents(results1, [])
		assertEvents(results2, [])
		assert.deepStrictEqual((baseObject1 as any).baseProp2, undefined)
		assert.deepStrictEqual(baseObject2.baseProp2, '3')
		assert.deepStrictEqual((object1 as any).baseProp2, undefined)
		assert.deepStrictEqual(object2.baseProp2, '3')

		builder1.readable('baseProp1', {factory: () => '4'})
		assertEvents(baseResults1, [])
		assertEvents(baseResults2, [])
		assertEvents(results1, [])
		results1 = []
		assertEvents(results2, [])
		assert.deepStrictEqual(baseObject1.baseProp1, '1')
		assert.deepStrictEqual(baseObject2.baseProp1, '2')
		assert.deepStrictEqual(object1.baseProp1, '1')
		delete object1.baseProp1
		assert.deepStrictEqual(object1.baseProp1, '4')
		assert.deepStrictEqual(object2.baseProp1, '2')

		builder2.readable('baseProp1', null, '5')
		assertEvents(baseResults1, [])
		assertEvents(baseResults2, [])
		assertEvents(results1, [])
		assertEvents(results2, [])
		results2 = []
		assert.deepStrictEqual(baseObject1.baseProp1, '1')
		assert.deepStrictEqual(baseObject2.baseProp1, '2')
		assert.deepStrictEqual(object1.baseProp1, '4')
		assert.deepStrictEqual(object2.baseProp1, '2')
		delete object2.baseProp1
		assert.deepStrictEqual(object2.baseProp1, '5')

		builder2.readable('baseProp2', {factory: () => '6'})
		assertEvents(baseResults1, [])
		assertEvents(baseResults2, [])
		assertEvents(results1, [])
		assertEvents(results2, [])
		results2 = []
		assert.deepStrictEqual((baseObject1 as any).baseProp2, undefined)
		assert.deepStrictEqual(baseObject2.baseProp2, '3')
		assert.deepStrictEqual((object1 as any).baseProp2, undefined)
		assert.deepStrictEqual(object2.baseProp2, '3')
		delete object2.baseProp2
		assert.deepStrictEqual(object2.baseProp2, '6')

		new ObservableObjectBuilder(object2)
			.readable('baseProp1', null, '7')

		assertEvents(baseResults1, [])
		assertEvents(baseResults2, [])
		assertEvents(results1, [])
		assertEvents(results2, [
			{
				name    : 'baseProp1',
				newValue: '7',
				oldValue: '5',
			},
		])
		results2 = []
		assert.deepStrictEqual(baseObject1.baseProp1, '1')
		assert.deepStrictEqual(baseObject2.baseProp1, '2')
		assert.deepStrictEqual(object1.baseProp1, '4')
		assert.deepStrictEqual(object2.baseProp1, '7')

		new ObservableObjectBuilder(object2)
			.readable('baseProp2', {factory: () => '8'})

		assertEvents(baseResults1, [])
		assertEvents(baseResults2, [])
		assertEvents(results1, [])
		assertEvents(results2, [
			{
				name    : 'baseProp2',
				newValue: '8',
				oldValue: '6',
			},
		])
		results2 = []
		assert.deepStrictEqual((baseObject1 as any).baseProp2, undefined)
		assert.deepStrictEqual(baseObject2.baseProp2, '3')
		assert.deepStrictEqual((object1 as any).baseProp2, undefined)
		assert.deepStrictEqual(object2.baseProp2, '8')
	})
})
