import {IRuleAction} from '../../../../deep-subscribe/contracts/rules'
import {IRuleSubscribe} from './contracts/rule-subscribe'
import {IRuleAny, IRuleIf, IRuleRepeat, RuleRepeatAction} from './contracts/rules'
import {IRule, RuleType} from './contracts/rules'

export type INextRuleIterable = (object: any) => IRuleIterable
export type IRuleOrIterable = IRuleAction | IRuleIterable | INextRuleIterable
export interface IRuleIterable extends Iterable<IRuleOrIterable> {}

const repeatNext = function*(
	nextObject: any,
	index: number,
	repeatRule: IRuleRepeat,
	ruleNext,
): IRuleIterable {
	let repeatAction = repeatRule.condition
		? repeatRule.condition(nextObject, index)
		: RuleRepeatAction.All

	if (index < repeatRule.countMin) {
		repeatAction = repeatAction & ~RuleRepeatAction.Fork
	}
	if (index >= repeatRule.countMax) {
		repeatAction = repeatAction & ~RuleRepeatAction.Next
	}

	if ((repeatAction & RuleRepeatAction.Fork) === 0) {
		if ((repeatAction & RuleRepeatAction.Next) === 0) {
			return
		}
		forEachRules(repeatRule.rule, nextObject, repeatRuleNext)
		return
	}

	if ((repeatAction & RuleRepeatAction.Next) === 0) {
		if (ruleNext) {
			ruleNext(nextObject)
		}
		return
	}

	if (ruleNext) {
		ruleNext(nextObject)
	}

	forEachRules(repeatRule.rule, nextObject, repeatRuleNext)

	function repeatRuleNext(nextIterationObject) {
		return repeatNext(
			nextIterationObject,
			index + 1,
			repeatRule,
			ruleNext,
		)
	}
}

export function forEachRules<TValue>(
	rule: IRule,
	object: any,
	next,
): IRuleIterable {
	while (true) {
		if (rule == null) {
			if (next != null) {
				next(object)
			}
			return
		}

		const ruleNext = rule.next || next
			? (nextObject: any) => forEachRules(rule.next, nextObject, next)
			: null

		switch (rule.type) {
			case RuleType.Nothing:
				rule = rule.next
				break
			case RuleType.Never:
				return
			case RuleType.Action:
				if (ruleNext != null) {
					ruleNext(rule)
				}
				break
			case RuleType.If: {
				const {conditionRules} = (rule as IRuleIf)
				const len = conditionRules.length
				let i = 0
				for (; i < len; i++) {
					const conditionRule = conditionRules[i]
					if (Array.isArray(conditionRule)) {
						if (conditionRule[0](object)) {
							forEachRules(conditionRule[1], object, ruleNext)
							break
						}
					} else {
						forEachRules(conditionRule, object, ruleNext)
						break
					}
				}

				if (i === len && ruleNext != null) {
					ruleNext(object)
				}
				break
			}
			case RuleType.Any:
				const {rules} = (rule as IRuleAny)
				if (!rules.length) {
					return
				}
				if (rules.length === 1) {
					forEachRules(rules[0], object, ruleNext)
				}

				for (let i = 0, len = rules.length; i < len; i++) {
					const subRule = rules[i]
					if (!subRule) {
						throw new Error(`RuleType.Any rule=${subRule}`)
					}
					forEachRules(subRule, object, ruleNext)
				}
				break
			case RuleType.Repeat: {
				const {countMin, countMax} = rule as IRuleRepeat

				if (countMax < countMin || countMax < 0) {
					return
				}

				repeatNext(object, 0, rule as IRuleRepeat, ruleNext)

				break
			}
			default:
				throw new Error('Unknown RuleType: ' + rule.type)
		}
	}
}