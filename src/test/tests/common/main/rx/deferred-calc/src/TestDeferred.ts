import {
	IPropertyChanged,
	IPropertyChangedEvent,
} from '../../../../../../../main/common/lists/contracts/IPropertyChanged'
import {DeferredCalc} from '../../../../../../../main/common/rx/deferred-calc/DeferredCalc'
import {IOptionsVariant, IOptionsVariants, ITestCase, TestVariants, THIS} from '../../../helpers/TestVariants'
import {TestTiming} from './timing'

declare const assert

export type IDeferredCalcAction = (set: DeferredCalc) => any

export enum EventType {
	CanBeCalc,
	Calc,
	Completed,
}

export interface IEvent {
	time?: number
	type: EventType
}

interface IDeferredCalcOptionsVariant {
	calcTime?: number,
	minTimeBetweenCalc?: number,
	throttleTime?: number,
	maxThrottleTime?: number,
	autoInvalidateInterval?: number,
	reuseSetInstance?: boolean
	autoCalc?: boolean
}

interface IDeferredCalcExpected {
	/**
	 * canBeCalc, calc, completed
	 */
	events?: IEvent[]
	error?: new () => Error,
	returnValue?: any,
	propertyChanged?: IPropertyChangedEvent[],
}

interface IDeferredCalcOptionsVariants extends IOptionsVariants {
	calcTime?: number[],
	minTimeBetweenCalc?: number[],
	throttleTime?: number[],
	maxThrottleTime?: number[],
	autoInvalidateInterval?: number[],
	reuseSetInstance?: boolean[]
	autoCalc?: boolean[]
}

export const timing = new TestTiming()
let staticAutoCalc
let staticCalcTime
let testStartTime
let staticEvents: IEvent[] = []
let staticDeferredCalc
staticDeferredCalc = new DeferredCalc({
	timing,
	canBeCalcCallback() {
		if (staticDeferredCalc) {
			assert.strictEqual(this, staticDeferredCalc)
		} else {
			assert.ok(this)
		}

		staticEvents.push({
			time: timing.now() - testStartTime,
			type: EventType.CanBeCalc,
		})
		if (staticAutoCalc) {
			staticDeferredCalc.calc()
		}
	},
	calcFunc(done) {
		if (staticDeferredCalc) {
			assert.strictEqual(this, staticDeferredCalc)
		} else {
			assert.ok(this)
		}

		staticEvents.push({
			time: timing.now() - testStartTime,
			type: EventType.Calc,
		})
		if (!staticCalcTime) {
			done()
		} else {
			timing.setTimeout(done, staticCalcTime)
		}
	},
	calcCompletedCallback() {
		if (staticDeferredCalc) {
			assert.strictEqual(this, staticDeferredCalc)
		} else {
			assert.ok(this)
		}

		staticEvents.push({
			time: timing.now() - testStartTime,
			type: EventType.Completed,
		})
	},
})

function eventsToDisplay(events: IEvent[]): IEvent[] {
	return events.map(event => {
		return {
			...event,
			type: event.type == null
				? event.type
				: EventType[event.type] as any
		}
	})
}

export function assertEvents(events: IEvent[], excepted: IEvent[]) {
	events = eventsToDisplay(events)
	excepted = eventsToDisplay(excepted)
	assert.deepStrictEqual(events, excepted)
}

export class TestDeferredCalc extends TestVariants<
	IDeferredCalcAction,
	IDeferredCalcExpected,
	IDeferredCalcOptionsVariant,
	IDeferredCalcOptionsVariants
> {
	private constructor() {
		super()
	}

	public static totalTests: number = 0

	protected baseOptionsVariants: IDeferredCalcOptionsVariants = {
		calcTime: [0],
		throttleTime: [null],
		maxThrottleTime: [null],
		minTimeBetweenCalc: [null],
		autoInvalidateInterval: [null],
		reuseSetInstance: [false, true],
		autoCalc: [false],
	}

	protected testVariant(
		options: IDeferredCalcOptionsVariant & IOptionsVariant<IDeferredCalcAction, IDeferredCalcExpected>,
	) {
		let error
		for (let debugIteration = 0; debugIteration < 3; debugIteration++) {
			let unsubscribePropertyChanged
			try {
				let expectedEvents: IEvent[] = options.expected.events.slice()
				let events: IEvent[]
				let deferredCalc: DeferredCalc

				if (options.reuseSetInstance) {
					staticCalcTime = 0
					staticAutoCalc = false
					staticDeferredCalc.minTimeBetweenCalc = null
					staticDeferredCalc.throttleTime = null
					staticDeferredCalc.maxThrottleTime = null
					staticDeferredCalc.autoInvalidateInterval = null
					staticDeferredCalc.calc()
					timing.addTime(options.minTimeBetweenCalc)
					testStartTime = timing.now()

					events = staticEvents = []
					deferredCalc = staticDeferredCalc
					staticAutoCalc = options.autoCalc
					staticCalcTime = options.calcTime
					staticDeferredCalc.minTimeBetweenCalc = options.minTimeBetweenCalc
					staticDeferredCalc.throttleTime = options.throttleTime
					staticDeferredCalc.maxThrottleTime = options.maxThrottleTime
					staticDeferredCalc.autoInvalidateInterval = options.autoInvalidateInterval
					staticDeferredCalc.invalidate()
				} else {
					testStartTime = timing.now()
					events = []
					const autoCalc = options.autoCalc
					const calcTime = options.calcTime
					deferredCalc = new DeferredCalc({
						timing,
						canBeCalcCallback() {
							if (deferredCalc) {
								assert.strictEqual(this, deferredCalc)
							} else {
								assert.ok(this)
							}

							events.push({
								time: timing.now() - testStartTime,
								type: EventType.CanBeCalc,
							})
							if (autoCalc) {
								this.calc()
							}
						},
						calcFunc(done) {
							if (deferredCalc) {
								assert.strictEqual(this, deferredCalc)
							} else {
								assert.ok(this)
							}

							events.push({
								time: timing.now() - testStartTime,
								type: EventType.Calc,
							})
							if (!calcTime) {
								done()
							} else {
								timing.setTimeout(done, calcTime)
							}
						},
						calcCompletedCallback() {
							if (deferredCalc) {
								assert.strictEqual(this, deferredCalc)
							} else {
								assert.ok(this)
							}

							events.push({
								time: timing.now() - testStartTime,
								type: EventType.Completed,
							})
						},
						minTimeBetweenCalc: options.minTimeBetweenCalc,
						throttleTime: options.throttleTime,
						maxThrottleTime: options.maxThrottleTime,
						autoInvalidateInterval: options.autoInvalidateInterval,
					})
				}

				const propertyChangedEvents = []
				if ((deferredCalc as unknown as IPropertyChanged).propertyChanged) {
					unsubscribePropertyChanged = (deferredCalc as unknown as IPropertyChanged).propertyChanged.subscribe(event => {
						propertyChangedEvents.push(event)
					})
				}

				if (options.expected.error) {
					assert.throws(() => options.action(deferredCalc), options.expected.error)
				} else {
					assert.deepStrictEqual(options.action(deferredCalc), options.expected.returnValue === THIS
						? deferredCalc
						: options.expected.returnValue)
				}

				assertEvents(events, expectedEvents)
				events.splice(0, events.length)

				timing.addTime(Math.max(
					options.throttleTime || 0,
					options.maxThrottleTime || 0,
					options.minTimeBetweenCalc || 0,
					options.autoInvalidateInterval || 0,
				) + options.calcTime + 1)

				assertEvents(events, [])

				if (unsubscribePropertyChanged) {
					unsubscribePropertyChanged()
				}

				assert.deepStrictEqual(propertyChangedEvents, options.expected.propertyChanged || [])

				break
			} catch (ex) {
				if (!debugIteration) {
					console.log(`Error in: ${
						options.description
						}\n${
						JSON.stringify(options, null, 4)
						}\n${options.action.toString()}\n${ex.stack}`)
					error = ex
				}
			} finally {
				if (unsubscribePropertyChanged) {
					unsubscribePropertyChanged()
				}
				TestDeferredCalc.totalTests++
			}
		}

		if (error) {
			throw error
		}
	}

	private static readonly _instance: TestDeferredCalc = new TestDeferredCalc()

	public static test(testCases: ITestCase<IDeferredCalcAction, IDeferredCalcExpected> & IDeferredCalcOptionsVariants) {
		TestDeferredCalc._instance.test(testCases)
	}
}