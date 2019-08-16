/* tslint:disable:prefer-const no-identical-functions no-empty no-shadowed-variable */
/* tslint:disable:no-var-requires one-variable-per-declaration */
/* eslint-disable no-new-func,no-array-constructor,object-property-newline,no-undef */
/* eslint-disable no-empty,no-shadow,no-prototype-builtins,prefer-destructuring */
/* eslint-disable prefer-rest-params,arrow-body-style */

import {calcPerformance} from 'rdtsc'
import {SynchronousPromise} from 'synchronous-promise'
import {ThenableSync} from '../../../main/common/async/ThenableSync'
import {isIterable} from '../../../main/common/helpers/helpers'
import {ArraySet} from '../../../main/common/lists/ArraySet'
import {binarySearch} from '../../../main/common/lists/helpers/array'
import {freezeWithUniqueId, getObjectUniqueId} from '../../../main/common/lists/helpers/object-unique-id'
import {SortedList} from '../../../main/common/lists/SortedList'
import {createObject, Tester} from '../../tests/common/main/rx/deep-subscribe/helpers/Tester'

const SetNative = Set
require('./src/SetPolyfill')
declare const assert: any
declare const SetPolyfill: any

export function compareDefault(o1, o2) {
	if (o1 > o2) {
		return 1
	}
	if (o2 > o1) {
		return -1
	}
	return 0
}

describe('fundamental-operations', function() {
	function Path(value) {
		this.value = value
	}

	Path.prototype.unshift = function(value) {
		const item = new Path(value)
		item.next = this
		return item
	}

	xit('array add item', function() {
		this.timeout(300000)

		const item = 'qweqweqweqweqwe'
		let str = item
		let arr1 = []
		let arr2 = new Array(10)
		let path = new Path(item)

		const result = calcPerformance(
			5000,
			() => {
				// no operations
			}, () => {
				str = 'qweqweqweqweqwe'
			}, () => {
				arr1 = new Array()
			}, () => {
				arr2 = new Array(10)
			}, () => {
				path = new Path(item)
			}, () => {
				str += item
			}, () => {
				arr1[0] = item
			}, () => {
				arr2[0] = item
			}, () => {
				path = path.unshift(item)
			},
		)

		console.log(str, result)
	})

	xit('pass arguments', function() {
		this.timeout(300000)

		function f1(args) {
			return args.length + 1
		}

		function f2(...args) {
			return args.length + 2
		}

		function passF1(...args) {
			f1(args)
		}

		function passF2(...args) {
			f2(...args)
		}

		const result = calcPerformance(
			5000,
			() => {
				// no operations
			},
			() => passF1(1, 2, 3, 4, 5, 6, 7, 8, 9),
			() => passF2(1, 2, 3, 4, 5, 6, 7, 8, 9),
		)

		console.log(result)
	})

	xit('lambda vs function', function() {
		this.timeout(300000)

		// noinspection JSUnusedLocalSymbols
		function f1(args) {
			const calc = () => {
				if (Math.random() + 1) {
					return 1
				}

				let inputItems
				let output
				let map
				let expandAndDistinct

				if (inputItems == null) {
					return output
				}

				if (Array.isArray(inputItems)) {
					for (const item of inputItems) {
						expandAndDistinct(item, output, map)
					}
					return output
				}

				if (!map[inputItems]) {
					map[inputItems] = true
					output[output.length] = inputItems
				}

				return output
			}
			return calc()
		}

		function f2(args) {
			return calc()
			function calc() {
				if (Math.random() + 1) {
					return 1
				}

				let inputItems
				let output
				let map
				let expandAndDistinct

				if (inputItems == null) {
					return output
				}

				if (Array.isArray(inputItems)) {
					for (const item of inputItems) {
						expandAndDistinct(item, output, map)
					}
					return output
				}

				if (!map[inputItems]) {
					map[inputItems] = true
					output[output.length] = inputItems
				}

				return output
			}
		}

		const result = calcPerformance(
			30000,
			() => {
				// no operations
			},
			() => f1(1),
			() => f2(2),
		)

		console.log(result)
	})

	xit('lazy function parameters', function() {
		this.timeout(300000)

		function f(arg1, arg2) {
			if (!arg1 || Math.random() === 0.5) {
				return arg2.x
			}

			if (typeof arg2 === 'function') {
				arg2 = arg2()
			}

			if (Math.random() === 0.5) {
				console.log(arg2.x)
			}

			return arg2.x
		}

		const result = calcPerformance(
			60000,
			() => {
				// no operations
			},
			() => f(false, {x: [1, 2, 3], y: 2, z: 3}),
			() => f(false, () => ({x: [1, 2, 3], y: 2, z: 3})),
			() => f(true, {x: [1, 2, 3], y: 2, z: 3}),
			() => f(true, () => ({x: [1, 2, 3], y: 2, z: 3})),
		)

		console.log(result)
	})

	function copyToArray(source, dest, len?, index?) {
		if (!len) {
			len = source.length
		}
		if (!index) {
			index = 0
		}
		for (let i = index; i < len; i++) {
			dest[index + i] = source[i]
		}
	}

	function generateArray(size) {
		const arr = []
		for (let i = 0; i < size; i++) {
			arr.push(i)
		}

		return arr
	}

	xit('array decrease length', function() {
		this.timeout(300000)

		const arr = generateArray(10000)
		let arr2

		const result = calcPerformance(
			60000,
			() => {
				// no operations
			},
			() => {
				arr2 = arr.slice()
			},
			() => {
				arr2.splice(arr2.length - 1, 1) // 1368
			},
			() => {
				arr2 = arr.slice()
			},
			() => {
				arr2.length-- // 698
			},
			() => {
				arr2 = arr.slice()
			},
			() => {
				delete arr2[arr2.length - 1] // 291
			},
		)

		console.log(result)
	})

	xit('array decrease length 100', function() {
		this.timeout(300000)

		const arr = generateArray(10000)
		let arr2

		const result = calcPerformance(
			60000,
			() => {
				// no operations
			},
			() => {
				arr2 = arr.slice()
			},
			() => {
				arr2.splice(arr2.length - 100, 100) // 3465
			},
			() => {
				arr2 = arr.slice()
			},
			() => {
				arr2.length -= 100 // 690
			},
		)

		console.log(result)
	})

	xit('array increase length', function() {
		this.timeout(300000)

		const arr = generateArray(10000)
		let arr2

		const result = calcPerformance(
			60000,
			() => {
				// no operations
			},
			() => {
				arr2 = arr.slice()
			},
			() => { // 80803
				const clone = new Array(arr2.length + 1)
				copyToArray(arr2, clone)
				arr2 = clone
			},
			() => {
				arr2 = arr.slice()
			},
			() => {
				arr2[arr2.length] = arr2.length // 34189
			},
			() => {
				arr2 = arr.slice()
			},
			() => {
				arr2.push(arr2.length) // 34048
			},
			() => {
				arr2 = arr.slice()
			},
			() => {
				arr2.length++ // 137850
			},
			() => {
				arr2 = arr.slice()
			},
			() => {
				arr2.splice(arr2.length, 0, arr2.length) // 138119
			},
		)

		console.log(result)
	})

	xit('array increase length 100', function() {
		this.timeout(300000)

		const arr = generateArray(10000)
		let arr2

		const result = calcPerformance(
			60000,
			() => {
				// no operations
			},
			() => {
				arr2 = arr.slice()
			},
			() => { // 81010
				const clone = new Array(arr2.length + 100)
				copyToArray(arr2, clone)
				arr2 = clone
			},
			() => {
				arr2 = arr.slice()
			},
			() => {
				arr2.length += 100 // 137800
			},
			() => {
				arr2 = arr.slice()
			},
			() => { // 35132
				for (let i = 0; i < 100; i++) {
					arr2.push(0)
				}
			},
			() => {
				arr2 = arr.slice()
			},
			() => { // 35581
				for (let i = arr2.length, end = i + 100; i < end; i++) {
					arr2[i] = 0
				}
			},
		)

		console.log(result)
	})

	xit('array default value', function() {
		this.timeout(300000)

		const arrNumbers = generateArray(10)
		const arrStrings = arrNumbers.map(o => o.toString())
		const arrFunctions = arrNumbers.map(o => () => o.toString())
		const arrObjects = arrNumbers.map(o => ({o}))

		const defaultNumber = 0
		const defaultString = ''
		const defaultFunction = new Function()
		const defaultObject = {}

		let arr

		const result = calcPerformance(
			180000,
			() => {
				// no operations
			},
			() => {
				arr = arrNumbers.slice()
			},
			() => { // 31
				arr[arr.length - 1] = undefined
			},
			() => {
				arr = arrNumbers.slice()
			},
			() => { // 4
				arr[arr.length - 1] = null
			},
			() => {
				arr = arrNumbers.slice()
			},
			() => { // -11
				arr[arr.length - 1] = defaultNumber
			},
			() => {
				arr = arrNumbers.slice()
			},
			() => { // 35
				arr[arr.length - 1] = defaultString
			},

			() => {
				arr = arrStrings.slice()
			},
			() => { // 8
				arr[arr.length - 1] = undefined
			},
			() => {
				arr = arrStrings.slice()
			},
			() => { // -4
				arr[arr.length - 1] = null
			},
			() => {
				arr = arrStrings.slice()
			},
			() => { // 27
				arr[arr.length - 1] = defaultString
			},
			() => {
				arr = arrStrings.slice()
			},
			() => { // -7
				arr[arr.length - 1] = defaultNumber
			},

			() => {
				arr = arrFunctions.slice()
			},
			() => { // 4
				arr[arr.length - 1] = undefined
			},
			() => {
				arr = arrFunctions.slice()
			},
			() => { // -7
				arr[arr.length - 1] = null
			},
			() => {
				arr = arrFunctions.slice()
			},
			() => { // 11
				arr[arr.length - 1] = defaultFunction
			},
			() => {
				arr = arrFunctions.slice()
			},
			() => { // 27
				arr[arr.length - 1] = defaultNumber
			},

			() => {
				arr = arrObjects.slice()
			},
			() => { // 8
				arr[arr.length - 1] = undefined
			},
			() => {
				arr = arrObjects.slice()
			},
			() => { // 27
				arr[arr.length - 1] = null
			},
			() => {
				arr = arrObjects.slice()
			},
			() => { // 11
				arr[arr.length - 1] = defaultObject
			},
			() => {
				arr = arrObjects.slice()
			},
			() => { // 8
				arr[arr.length - 1] = defaultNumber
			},

		)

		console.log(result)
	})

	xit('array last index', function() {
		this.timeout(300000)

		function defaultCompare(o1, o2) {
			return o1 === o2
		}

		function lastIndexOf1(array, value, compare?) {
			if (!compare) {
				compare = defaultCompare
			}

			let i = 0
			const len = array.length
			let ind = -1
			while (i !== len) {
				if (compare(array[i], value)) {
					ind = i
				}
				i++
			}
			return ind
		}

		function lastIndexOf2(array, value, compare?) {
			if (!compare) {
				compare = defaultCompare
			}

			let i = array.length
			while (i !== 0) {
				if (compare(array[i], value)) {
					return i
				}
				i--
			}
			return -1
		}

		const arr = generateArray(10000)

		const result = calcPerformance(
			10000,
			() => {
				// no operations
			},
			() => lastIndexOf1(arr, 5000),
			() => lastIndexOf2(arr, 5000),
		)

		console.log(result)
	})

	// xit('array capacity', function () {
	// 	this.timeout(300000)
	//
	// 	let arr
	//
	// 	const result = calcPerformance(
	// 		60000,
	// 		() => {
	// 			// no operations
	// 		},
	// 		() => { // 821
	// 			arr = [1, 2, 3, 4, 5]
	// 			arr.length = 10
	// 		},
	// 		() => {
	// 			arr.push(6) // 16
	// 		},
	// 		() => {
	// 			arr = arr.slice(5, 1) // 265
	// 		},
	// 		() => { // 737
	// 			arr = [1, 2, 3, 4, 5]
	// 			arr.length = 10
	// 		},
	// 		() => {
	// 			arr[5] = 6 // 20
	// 		},
	// 		() => {
	// 			delete arr[5] // 238
	// 		},
	// 		() => { // 74
	// 			arr = new Array(10)
	// 			copyToArray([1, 2, 3, 4, 5], arr)
	// 		},
	// 		() => {
	// 			arr.push(6) // 146
	// 		},
	// 		() => {
	// 			arr.splice(5, 1) // 771
	// 		},
	// 		() => { // 55
	// 			arr = new Array(10)
	// 			copyToArray([1, 2, 3, 4, 5], arr)
	// 		},
	// 		() => {
	// 			arr[5] = 6 // 1
	// 		},
	// 		() => {
	// 			delete arr[5] // 231
	// 		}
	// 	)
	//
	// 	console.log(result)
	// })

	function calcSortCompareCount(array, size, addArray) {
		// array.length = size
		let count = 0
		for (let i = 0, len = addArray.length; i < len; i++) {
			array[size++] = addArray[i]
		}
		array.sort((o1, o2) => {
			count++
			return compareDefault(o1, o2)
		})

		// console.log(`${JSON.stringify(array)}`)

		return count
	}

	function calcBinarySearchCount(array, size, addArray) {
		let count = 0
		for (let i = 0, addLen = addArray.length; i < addLen; i++) {
			const addItem = addArray[i]

			// eslint-disable-next-line no-loop-func
			let insertIndex = binarySearch(array, addItem, null, size, (o1, o2) => {
				count++
				return compareDefault(o1, o2)
			})

			if (insertIndex < 0) {
				insertIndex = ~insertIndex
			}

			// insert
			for (let j = size - 1; j < size; j++) {
				array[j + 1] = array[j]
			}
			for (let j = size - 1; j > insertIndex; j--) {
				array[j] = array[j - 1]
			}

			array[insertIndex] = addItem

			size++
		}

		// console.log(`${JSON.stringify(array)}`)

		return count
	}

	function printSortCompareCount(array, addArray) {
		const sortCount = calcSortCompareCount(array, array.length, addArray)
		const binarySearchCount = calcBinarySearchCount(array, array.length, addArray)
		console.log(`${sortCount}\t${binarySearchCount}\t${JSON.stringify(array)}\t${JSON.stringify(addArray)}`)
	}

	xit('sorted array add items', function() {
		this.timeout(300000)

		const array = []
		const addArray = generateArray(1000).sort((o1, o2) => (Math.random() > 0.5 ? -1 : 1))
		// [-3, -1, -2, 1, 9, -4, 7, -6, 11]
		let resultArray

		// console.log(JSON.stringify(addArray))
		// printSortCompareCount(array.slice(), addArray)

		const result = calcPerformance(
			10000,
			() => {
				// no operations
			},
			() => {
				resultArray = array.slice().concat(addArray.map(o => 0))
			},
			() => calcSortCompareCount(resultArray, array.length, addArray),
			() => {
				resultArray = array.slice().concat(addArray.map(o => 0))
			},
			() => calcBinarySearchCount(resultArray, array.length, addArray),
		)

		console.log(result)
	})

	xit('regexp', function() {
		this.timeout(300000)

		const regexp = /qwe\/wer\/ert\/rty\/tyu/
		const path = 'qwe/wer/ert/rty/tyu'
		const wrongPath = 'wwe/wer/ert/rty/tyu'
		const checkPath = wrongPath.replace(/^w/, 'q')

		const result = calcPerformance(
			10000,
			// () => {
			// 	// no operations
			// },
			() => wrongPath === checkPath,
			() => path === checkPath,
			() => regexp.test(wrongPath),
			() => wrongPath.match(regexp),
			() => regexp.test(path),
			() => path.match(regexp),
		)

		console.log(result)
	})

	xit('operations inside compare func', function() {
		this.timeout(300000)

		const obj = () => {}
		const obj2 = {}

		const result = calcPerformance(
			60000,
			() => {
				// no operations
			},
			() => obj === obj2, // -11
			() => typeof obj === 'undefined', // -7
			() => obj === null, // -7
			() => obj.valueOf(), // 16
			() => typeof obj === 'number', // -7
			() => typeof obj === 'boolean', // -8
			() => typeof obj === 'string', // -7
			() => typeof obj2 === 'function', // -7
			() => typeof obj.valueOf() === 'number', // -7
			() => typeof obj.valueOf() === 'boolean', // -8
			() => typeof obj.valueOf() === 'string', // -7
			() => typeof obj2.valueOf() === 'function', // -7
			() => getObjectUniqueId(obj), // -11
			() => typeof obj === 'object', // 146
			() => typeof obj === 'symbol', // 150
		)

		console.log(result)
	})

	xit('Set', function() {
		this.timeout(300000)

		assert.strictEqual(SetNative, Set)
		assert.notStrictEqual(Set, SetPolyfill)

		const countObject = 1000

		const objects = []
		for (let i = 0; i < countObject; i++) {
			objects[i] = {value: i}
			getObjectUniqueId(objects[i])
		}

		function testSet(addObject, removeObject, getIterableValues) {
			for (let i = 0; i < countObject; i++) {
				addObject(objects[i])
			}
			for (let i = 0; i < countObject; i++) {
			// for (let i = 99; i >= 0; i--) {
				removeObject(objects[i])
			}
			for (const value of getIterableValues()) {

			}
		}

		// const set1 = new Set()
		// const set2 = {}
		// const set3 = []

		function testSetNative() {
			const set = new SetNative()
			testSet(
				o => set.add(o),
				o => set.delete(o),
				() => set,
			)
			// assert.strictEqual(set1.size, 0)
		}

		function testObject() {
			const set = {}
			testSet(
				o => (set[getObjectUniqueId(o)] = o),
				o => delete set[getObjectUniqueId(o)],
				o => Object.values(set),
			)
			// assert.strictEqual(Object.keys(set).length, 0)
		}

		function testArrayHashTable() {
			const set = []
			testSet(
				o => (set[getObjectUniqueId(o)] = o),
				o => delete set[getObjectUniqueId(o)],
				o => set,
			)
			// assert.strictEqual(set.length, 0)
		}

		function testArraySplice() {
			const set = []
			testSet(
				o => (set[set.length] = o),
				o => {
					const i = set.indexOf(o)
					if (i >= 0) {
						set.splice(i, 1)
					}
				},
				o => set,
			)
			// assert.strictEqual(set.length, 0)
		}

		function testArray() {
			const set = []
			testSet(
				o => (set[set.length] = o),
				o => {
					const i = set.indexOf(o)
					if (i >= 0) {
						set[i] = set[set.length - 1]
						set.length--
					}
				},
				o => set,
			)
			// assert.strictEqual(set.length, 0)
		}

		function testArrayKeepOrder() {
			const set = []
			testSet(
				o => (set[set.length] = o),
				o => {
					const i = set.indexOf(o)
					if (i >= 0) {
						const len = set.length
						for (let j = i + 1; j < len; j++) {
							set[j - 1] = set[j]
						}
						set.length = len - 1
					}
				},
				o => set,
			)
			// assert.strictEqual(set.length, 0)
		}

		function testSortedList(options) {
			const set = new SortedList(options)
			testSet(
				o => set.add(o),
				o => set.remove(o),
				o => set,
			)
			// set.clear()
			// assert.strictEqual(set.size, 0)
		}

		function testSetPolyfill() {
			// console.log(SetPolyfill.toString())
			const set = new SetPolyfill()
			testSet(
				o => set.add(o),
				o => set.delete(o),
				o => set,
			)
			// assert.strictEqual(set.size, 0)
		}

		function testArraySet() {
			// console.log(ArraySet.toString())
			const set = new ArraySet()
			testSet(
				o => set.add(o),
				o => set.delete(o),
				o => set,
			)
			// assert.strictEqual(set.size, 0)
		}

		const result = calcPerformance(
			10000,
			() => {
				// no operations
			},
			testSetNative,
			testObject,
			testArrayHashTable,
			testArraySplice,
			testArray,
			testArrayKeepOrder,
			testSetPolyfill,
			testArraySet,
			() => testSortedList({
				autoSort        : true,
				notAddIfExists  : true,
				minAllocatedSize: 1000,
				// compare         : compareUniqueId
			}),
			// () => testSortedList({
			// 	autoSort        : true,
			// 	notAddIfExists  : false,
			// 	minAllocatedSize: 1000
			// }),
			// () => testSortedList({
			// 	autoSort        : false,
			// 	notAddIfExists  : false,
			// 	minAllocatedSize: 1000
			// })
		)

		console.log(result)
	})

	xit('Number toString', function() {
		this.timeout(300000)
		const numInt = 123456789
		const numFloat = 1234.56789
		const str = '1234.56789_'

		const result = calcPerformance(
			60000,
			() => {
				// no operations
			},
			() => str + 99,
			() => numInt.toString(10),
			() => numInt.toString(16),
			() => numInt.toString(36),
			() => numFloat.toString(10),
			() => numFloat.toString(16),
			() => numFloat.toString(36),
		)

		console.log(result)
	})

	xit('hasOwnProperty', function() {
		this.timeout(300000)
		const object = {property: true}
		const child = Object.create(object)

		const result = calcPerformance(
			60000,
			() => {
				// no operations
			},
			() => Object.prototype.hasOwnProperty.call(object, 'property'),
			() => object.hasOwnProperty('property'),
			() => Object.prototype.hasOwnProperty.call(child, 'property'),
			() => child.hasOwnProperty('property'),
		)

		console.log(result)
	})

	xit('deepSubscribe', function() {
		this.timeout(300000)

		const createTester = (...propertyNames) => new Tester(
			{
				object         : createObject().object,
				immediate      : true,
				performanceTest: true,
			},
			b => b
				.repeat(1, 3, b => b
					.any(
						// b => b.propertyRegexp(/object|observableObject/),
						b => b.propertyNames('object', 'observableObject'),
						b => b.propertyNames(...propertyNames).path(o => o['#']),
					))
				.path(o => o['#']),
		)
			.subscribe([])
			.unsubscribe([])

		const testerList = createTester('list')
		const testerSet = createTester('set')
		const testerMap = createTester('map')
		const testerObservableList = createTester('observableList')
		const testerObservableSet = createTester('observableSet')
		const testerObservableMap = createTester('observableMap')
		const testerAll = createTester('list', 'set', 'map', 'observableList', 'observableSet', 'observableMap')

		const result = calcPerformance(
			10000,
			() => {
				// no operations
			},
			() => testerList.subscribe([]),
			() => testerList.unsubscribe([]),

			() => testerSet.subscribe([]),
			() => testerSet.unsubscribe([]),

			() => testerMap.subscribe([]),
			() => testerMap.unsubscribe([]),

			() => testerObservableList.subscribe([]),
			() => testerObservableList.unsubscribe([]),

			() => testerObservableSet.subscribe([]),
			() => testerObservableSet.unsubscribe([]),

			() => testerObservableMap.subscribe([]),
			() => testerObservableMap.unsubscribe([]),

			() => testerAll.subscribe([]),
			() => testerAll.unsubscribe([]),
		)

		console.log(result)
	})

	xit('setTimeout', function() {
		this.timeout(300000)
		const func = () => {}
		let timerId

		const result = calcPerformance(
			10000,
			() => {
				// no operations
			},
			() => (timerId = setTimeout(func, 1000)),
			() => clearTimeout(timerId),
		)

		console.log(result)
	})

	xit('Math.max()', function() {
		this.timeout(300000)
		const func = () => {}
		let timerId

		this.value1 = 0
		this.value2 = 1
		this.value3 = 2

		const {value1, value2, value3} = this

		const result = calcPerformance(
			10000,
			() => {
				// no operations
			},
			() => Math.max(this.value1, this.value2, this.value3),
			() => Math.max(value1, value2, value3),
		)

		console.log(result)
	})

	xit('"out" vs "set func" params', function() {
		this.timeout(300000)

		const funcOut = (a, out) => {
			out[0] = a
			return Math.random() !== 0.5
		}

		const funcSet = (a, set) => {
			if (Math.random() !== 0.5) {
				set(a)
			}
			return a
		}

		const out = []

		const result = calcPerformance(
			120000,
			() => {
				// no operations
			},
			() => {
				const out0 = []
				if (funcOut(Math.random(), out0)) {
					this.prop = out0[0]
				}
			},
			() => {
				if (funcOut(Math.random(), out)) {
					this.prop = out[0]
				}
			},
			() => {
				funcSet(Math.random(), a => {
					this.prop = a
				})
			},
		)

		console.log(result)
	})

	xit('func params as object', function() {
		this.timeout(300000)

		const funcSimple = (
			param0,
			param1,
			param2,
			param3,
		) => param0 || param1 || param2 || param3

		const funcObjectParams = ({
			param0,
			param1,
			param2,
			param3,
		} = {} as any) => param0 || param1 || param2 || param3

		const funcObjectParamsBabel = () => {
			// eslint-disable-next-line one-var
			const _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
				param0 = _ref.param0,
				param1 = _ref.param1,
				param2 = _ref.param2,
				param3 = _ref.param3

			return param0 || param1 || param2 || param3
		}

		const result = calcPerformance(
			120000,
			() => {
				// no operations
			},
			() => {
				funcSimple(
					Math.random() < 0.5,
					Math.random() < 0.5,
					Math.random() < 0.5,
					Math.random() < 0.5,
				)
			},
			() => {
				funcObjectParams({
					param0: Math.random() < 0.5,
					param1: Math.random() < 0.5,
					param2: Math.random() < 0.5,
					param3: Math.random() < 0.5,
				})
			},
			() => {
				// @ts-ignore
				funcObjectParamsBabel({
					param0: Math.random() < 0.5,
					param1: Math.random() < 0.5,
					param2: Math.random() < 0.5,
					param3: Math.random() < 0.5,
				})
			},
		)

		console.log(result)
	})

	xit('new Array(size)', function() {
		this.timeout(300000)

		const size = 1000
		const arrSimple = []
		const arrConstructor = new Array(size)
		const arrConstructorFilled = new Array(size)
		for (let i = 0; i < size; i++) {
			arrSimple[i] = undefined
			arrConstructorFilled[i] = undefined
		}

		let i = (size / 2) | 0

		const result = calcPerformance(
			120000,
			() => {
				// no operations
			},
			() => {
				arrSimple[i] = i
				i = (i + 7) % size
				return arrSimple[i]
			},
			() => {
				arrConstructorFilled[i] = i
				i = (i + 7) % size
				return arrConstructorFilled[i]
			},
			() => {
				arrConstructor[i] = i
				i = (i + 7) % size
				return arrConstructor[i]
			},
		)

		console.log(result)
	})

	function defineProperty(obj, propertyName) {
		obj[propertyName] = 0
		Object.defineProperty(obj, propertyName, {
			configurable: true,
			enumerable  : false,
			writable    : true,
			value       : 0,
		})
	}

	function definePropertyGetSet(obj, propertyName) {
		obj[propertyName] = 0
		Object.defineProperty(obj, propertyName, {
			configurable: true,
			enumerable  : false,
			get         : () => 0,
			set(o) {	},
		})
	}

	it('delete property', function() {
		this.timeout(300000)

		const hashTable = {}
		for (let i = 0; i < 10000; i++) {
			hashTable[i] = i
		}

		const obj: any = {}

		const result = calcPerformance(
			20000,
			() => {
				// no operations
			},
			() => { // 154
				obj.x = 0
			},
			() => { // 46
				obj.x = void 0
			},
			() => { // 108
				delete obj.x
			},
			() => { // 92
				hashTable[(Math.random() * 10000) | 0] = void 0
			},
			() => { // 395
				delete hashTable[(Math.random() * 10000) | 0]
			},
			() => { // 2320
				getObjectUniqueId({})
			},
			() => { // 1507
				defineProperty(obj, 'x')
			},
			() => { // 58
				obj.x = void 0
			},
			() => { // 108
				delete obj.x
			},
			() => { // 1860
				definePropertyGetSet(obj, 'x')
			},
			() => { // 909
				obj.x = void 0
			},
			() => { // 119
				delete obj.x
			},
			() => { // 5
				return {}
			},
		)

		console.log(result)
	})

	xit('Promise sync', function() {
		this.timeout(300000)

		const result = calcPerformance(
			20000,
			() => {
				// no operations
			},
			() => {
				let resolve
				new SynchronousPromise(o => {
					resolve = o
				})
					.then(o => true)
					// .then(o => true)

				resolve(1)
			},
			() => {
				let resolve
				new ThenableSync(o => {
					resolve = o
				})
					.then(o => true)
					// .then(o => true)

				resolve(1)
			},
			() => {
				let resolve
				let result
				new SynchronousPromise(o => {
					resolve = o
				})
					.then(o => true)
					.then(o => (result = o))

				resolve(1)
			},
			() => {
				let resolve
				let result
				new ThenableSync(o => {
					resolve = o
				})
					.then(o => true)
					.then(o => (result = o))

				resolve(1)
			},
		)

		console.log(result)
	})

	xit('is iterable', function() {
		this.timeout(300000)

		const iterable = true
		const iterable2 = {
			* [Symbol.iterator]() {
				for (let i = 0; i < 100; i++) {
					if (Math.random() > 1) {
						return 2
					}
				}
				yield 1
				return 0
			},
		}

		const result = calcPerformance(
			20000,
			() => {
				// no operations
			},
			// () => {
			// 	return iterable && Symbol.iterator in iterable
			// },
			// () => {
			// 	return iterable != null && Symbol.iterator in iterable
			// },
			() => { // 0
				return iterable && typeof iterable[Symbol.iterator] === 'function'
			},
			() => { // 0
				return iterable != null && typeof iterable[Symbol.iterator] === 'function'
			},
			() => { // 100
				return iterable && Symbol.iterator in Object(iterable)
			},
			() => { // 100
				return iterable != null && Symbol.iterator in Object(iterable)
			},
			() => { // 0
				return isIterable(iterable)
			},
		)

		console.log(result)
	})

	xit('array is associative', function() {
		this.timeout(300000)

		const arr = []
		for (let i = 0; i < 1000; i++) {
			arr[i] = i
		}

		const result = calcPerformance(
			2000,
			() => {
				// no operations
			},
			() => {
				return arr.length === Object.keys(arr).length
			},
		)

		console.log(result)
	})

	xit('Object.freeze', function() {
		this.timeout(300000)

		const result = calcPerformance(
			2000,
			// () => {
			// 	// no operations
			// },
			() => {
				const x = {}
				return x
			},
			() => {
				const x = {}
				Object.freeze(x)
			},
			() => {
				const x = {}
				getObjectUniqueId(x)
				Object.freeze(x)
			},
			() => {
				const x = {}
				freezeWithUniqueId(x)
			},
		)

		console.log(result)
	})

	xit('defineProperty', function() {
		this.timeout(300000)

		const hashTable = {}
		for (let i = 0; i < 10000; i++) {
			hashTable[i] = i
		}

		class Class {
			private _field
			public get value() {
				return this._field
			}
			public set value(value) {
				this._field = value
			}
		}

		const obj: any = new Class()
		Object.defineProperty(obj, 'manual', {
			configurable: true,
			enumerable  : true,
			get() { return this._manual},
			set(value) { this._manual = value},
		})
		Object.defineProperty(obj, 'hidden', {
			configurable: true,
			enumerable  : false,
			writable    : true,
			value       : 0,
		})

		const result = calcPerformance(
			120000,
			() => {
				return Math.random() && 1
			},
			() => {
				obj.x = Math.random() // 0
			},
			() => {
				return Math.random() && obj.x // 4
			},
			() => {
				obj.value = Math.random() // 4
			},
			() => {
				return Math.random() && obj.value // 11
			},
			() => {
				obj.manual = Math.random() // 0
			},
			() => {
				return Math.random() && obj.manual // 27
			},
			() => {
				obj.hidden = Math.random() // 27
			},
			() => {
				return Math.random() && obj.hidden // 27
			},
		)

		console.log(result)
	})
})