import {IUnsubscribe} from '../subjects/subject'
import {IRuleSubscribe} from './contracts/rule-subscribe'
import {IRule, IRuleAction, IRuleAny, IRuleRepeat, RuleType} from './contracts/rules'
import {PeekIterator} from './helpers/PeekIterator'

type GetIterableFunction = () => Iterable<IRuleOrIterable>
export type IRuleOrIterable = IRuleAction | IRuleIterable | GetIterableFunction
export interface IRuleIterable extends Iterable<IRuleOrIterable> {

}

export function *iterateRule(rule: IRule, next: () => IRuleIterable = null): IRuleIterable {
	if (!rule) {
		if (next) {
			yield* next()
		}
		return
	}

	const ruleNext = rule.next || next
		? () => iterateRule(rule.next, next)
		: null

	switch (rule.type) {
		case RuleType.Action:
			yield rule
			yield ruleNext
			break
		case RuleType.Any:
			const {rules} = (rule as IRuleAny)
			if (rules.length <= 1) {
				throw new Error(`RuleType.Any rules.length=${rules.length}`)
			}

			const any = function *() {
				for (let i = 0, len = rules.length; i < len; i++) {
					const subRule = rules[i]
					if (!subRule) {
						throw new Error(`RuleType.Any rule=${subRule}`)
					}
					yield iterateRule(subRule, ruleNext)
				}
			}
			yield any()
			break
		case RuleType.Repeat: {
			const {countMin, countMax, rule: subRule} = rule as IRuleRepeat
			if (countMax < countMin || countMax <= 0 || rule == null) {
				throw new Error(`RuleType.Repeat countMin=${countMin} countMax=${countMax} rule=${rule}`)
			}

			const repeatNext = function*(count) {
				if (count >= countMax) {
					if (ruleNext) {
						yield* ruleNext()
					}
					return
				}

				const nextIteration = newCount => {
					return iterateRule(subRule, () => repeatNext(newCount))
				}

				if (count < countMin) {
					yield* nextIteration(count + 1)
				} else {
					yield [ruleNext ? ruleNext() : [], nextIteration(count + 1)]
				}
			}

			yield* repeatNext(0)
			break
		}
		default:
			throw new Error('Unknown RuleType: ' + rule.type)
	}
}

export function subscribeNextRule(
	ruleIterator: PeekIterator<IRuleOrIterable>,
	fork: (ruleIterator: PeekIterator<IRuleOrIterable>) => IUnsubscribe,
	subscribeNode: (rule: IRuleSubscribe, getRuleIterator: () => PeekIterator<IRuleOrIterable>) => IUnsubscribe,
	subscribeLeaf: () => IUnsubscribe,
) {
	let iteration
	if (!ruleIterator || (iteration = ruleIterator.next()).done) {
		return subscribeLeaf()
	}

	const ruleOrIterable = iteration.value

	if (ruleOrIterable[Symbol.iterator]) {
		let unsubscribers: IUnsubscribe[]

		// for (let step, innerIterator = ruleOrIterable[Symbol.iterator](); !(step = innerIterator.next()).done;) {
		// 	const ruleIterable = step.value
		// 	const unsubscribe = fork(ruleIterable[Symbol.iterator]())
		// 	if (unsubscribe != null) {
		// 		if (!unsubscribers) {
		// 			unsubscribers = [unsubscribe]
		// 		} else {
		// 			unsubscribers.push(unsubscribe)
		// 		}
		// 	}
		// }

		for (const ruleIterable of ruleOrIterable as Iterable<IRuleOrIterable>) {
			const unsubscribe = fork(new PeekIterator(ruleIterable[Symbol.iterator]()))
			if (unsubscribe != null) {
				if (!unsubscribers) {
					unsubscribers = [unsubscribe]
				} else {
					unsubscribers.push(unsubscribe)
				}
			}
		}

		if (!unsubscribers) {
			return null
		}

		return () => {
			for (let i = 0, len = unsubscribers.length; i < len; i++) {
				unsubscribers[i]()
			}
		}
	}

	const nextIterable = ruleIterator.next().value as GetIterableFunction

	return subscribeNode(
		ruleOrIterable as IRuleSubscribe,
		nextIterable
			? () => new PeekIterator(nextIterable()[Symbol.iterator]())
			: null,
	)
}