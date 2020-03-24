/* tslint:disable:no-identical-functions no-shadowed-variable no-var-requires ordered-imports */
import * as ObjectPool from '../../../../../../../main/common/lists/ObjectPool'
import * as PairingHeap from '../../../../../../../main/common/lists/PairingHeap'
import {invalidate} from '../../../../../../../main/common/rx/depend/_dependentFunc'
import * as _getFuncCallState from '../../../../../../../main/common/rx/depend/_getFuncCallStateOld'
import * as _getFuncCallState2 from '../../../../../../../main/common/rx/depend/_getFuncCallState'
import * as _dependentFunc from '../../../../../../../main/common/rx/depend/_dependentFunc'
import {getFuncCallState} from '../../../../../../../main/common/rx/depend/facade'
import * as facade from '../../../../../../../main/common/rx/depend/facade'
import * as helpers from '../../../../../../../main/common/rx/depend/helpers'
import * as subscribeDependency from '../../../../../../../main/common/rx/depend/subscribeDependency'
import * as subscriberLinkPool from '../../../../../../../main/common/rx/depend/subscriber-link-pool'

import {assert, AssertionError} from '../../../../../../../main/common/test/Assert'
import {describe, it, xit} from '../../../../../../../main/common/test/Mocha'
import {baseTest, clearCallStates, createPerceptron} from '../../../../../common/main/rx/depend/src/helpers'
import {v8} from '../../../../v8/src/helpers/common/helpers'
import {OptimizationStatus} from '../../../../v8/src/helpers/contracts'
import {
	assertIsOptimized,
	checkIsOptimized,
} from '../../../../v8/src/helpers/helpers'

describe('node > main > rx > depend > dependent-func', function() {
	async function v8Test(
		countIterations: number,
		iterate: (
			iteration: number,
			checkOptimization: (iteration: number) => void,
			_assertIsOptimized: typeof assertIsOptimized,
		) => void|Promise<void>,
	) {
		const objects = {
			ObjectPool,
			PairingHeap,
			_getFuncCallState,
			_getFuncCallState2: {
				..._getFuncCallState2,
				reduceCallStates: null,
			},
			_dependentFunc,
			facade,
			helpers,
			subscribeDependency,
			subscriberLinkPool,
		}

		v8.DeoptimizeNow()

		const optimizedObjectsIterations = {}
		const optimized = new Set()

		function _assertIsOptimized(obj) {
			return assertIsOptimized(obj, optimized)
		}

		function checkOptimization(iteration) {
			for (const key in objects) {
				if (Object.prototype.hasOwnProperty.call(objects, key)
					&& !Object.prototype.hasOwnProperty.call(optimizedObjectsIterations, key)
					&& optimized.has(objects[key])
				) {
					optimizedObjectsIterations[key] = iteration
				}
			}
			if (!checkIsOptimized(objects, optimized)) {
				console.error('Iteration: ' + iteration)
				assertIsOptimized(objects, optimized)
			}
		}

		for (let i = 0; i < countIterations; i++) {
			if (i === 10) {
				// isRefType(1)
				// isRefType(2)
				for (const key in objects) {
					if (Object.prototype.hasOwnProperty.call(objects, key)
						&& !optimized.has(objects[key])
					) {
						v8.OptimizeFunctionOnNextCall(objects[key])
					}
				}
				// isRefType(3)
			}

			await iterate(i, checkOptimization, _assertIsOptimized)
		}

		console.log(optimizedObjectsIterations)

		const inlined = []
		const notInlined = []
		for (const key in objects) {
			if (Object.prototype.hasOwnProperty.call(objects, key)) {
				if ((v8.GetOptimizationStatus(objects[key]) & OptimizationStatus.MarkedForOptimization) === 0) {
					notInlined.push(key)
				} else {
					inlined.push(key)
				}
			}
		}
		console.log('Inlined: ', inlined)
		console.log('Not inlined: ', notInlined)

		// assert.deepStrictEqual(optimizedObjects, objects)
		assertIsOptimized(objects, optimized)

		clearCallStates()
	}

	it('v8 perceptron', async function() {
		this.timeout(60000)

		await v8Test(1000, async (iteration, checkOptimization, _assertIsOptimized) => {
			const {
				input,
				output,
				getStates,
			} = createPerceptron(2, 2)

			getStates().forEach(o => {
				_assertIsOptimized({state: o})
			})

			checkOptimization(iteration)

			for (let j = 0; j < 10; j++) {
				const state = getFuncCallState(input)()
				await invalidate(state)
			}

			getStates().forEach(o => {
				_assertIsOptimized({state: o})
			})

			checkOptimization(iteration)
		})
	})

	it('v8 baseTest', async function() {
		this.timeout(60000)

		await v8Test(100, async (iteration, checkOptimization, _assertIsOptimized) => {
			const { states } = await baseTest()
			states.forEach(o => {
				_assertIsOptimized({state: o})
			})

			checkOptimization(iteration)
		})
	})
})
