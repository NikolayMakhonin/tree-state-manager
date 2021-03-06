import {VALUE_PROPERTY_DEFAULT} from '../../../../../helpers/value-property'
import {ANY, ANY_DISPLAY, CHANGE_COUNT_PREFIX, COLLECTION_PREFIX, VALUE_PROPERTY_PREFIX} from './contracts/constants'
import {
	IRuleBuilder,
	IRuleFactory,
	IterableValueOf,
	MapValueOf,
	ObjectAnyValueOf,
	ObjectValueOf,
	PropertyValueOf,
} from './contracts/IRuleBuilder'
import {IRuleSubscribe, ISubscribeObject} from './contracts/rule-subscribe'
import {IRepeatCondition, IRule, RuleRepeatAction} from './contracts/rules'
import {RuleAny, RuleIf, RuleNever, RuleNothing, RuleRepeat} from './rules'
import {
	createSubscribeMap,
	createSubscribeObject,
	hasDefaultProperty,
	RuleSubscribe,
	subscribeChange,
	subscribeCollection,
	SubscribeObjectType,
} from './rules-subscribe'

export class RuleBuilder<TObject = any, TValueKeys extends string | number = never>
	implements IRuleBuilder<TObject, TValueKeys>
{
	public ruleFirst: IRule
	public ruleLast: IRule
	public valuePropertyDefaultName: string
	public autoInsertValuePropertyDefault: boolean

	constructor({
		rule,
		valuePropertyDefaultName = VALUE_PROPERTY_DEFAULT,
		autoInsertValuePropertyDefault = true,
	}: {
		rule?: IRule,
		valuePropertyDefaultName?: string,
		autoInsertValuePropertyDefault?: boolean,
	} = {}) {
		this.valuePropertyDefaultName = valuePropertyDefaultName
		this.autoInsertValuePropertyDefault = autoInsertValuePropertyDefault
		if (rule != null) {
			this.ruleFirst = rule

			let ruleLast
			do {
				ruleLast = rule
				rule = rule.next
			} while (rule != null)

			this.ruleLast = ruleLast
		}
	}

	public changeValuePropertyDefault(propertyName: string): this {
		this.valuePropertyDefaultName = propertyName
		return this
	}

	public noAutoRules(): this {
		this.autoInsertValuePropertyDefault = false
		return this
	}

	public result(): IRule {
		return (this.autoInsertValuePropertyDefault
			? this.valuePropertyDefault()
			: this).ruleFirst
	}

	public valuePropertyDefault<TValue>(): RuleBuilder<TValue, TValueKeys> {
		return this
			.repeat(
				0,
				10,
				(o: any) => hasDefaultProperty(o) ? RuleRepeatAction.Next : RuleRepeatAction.Fork,
				b => this.valuePropertyDefaultName === VALUE_PROPERTY_DEFAULT
					? b.func<TValue>(
						createSubscribeObject<any, TValue>(
							SubscribeObjectType.ValueProperty, null, VALUE_PROPERTY_DEFAULT,
						),
						SubscribeObjectType.ValueProperty,
						VALUE_PROPERTY_PREFIX,
					)
					: b.func<TValue>(
						createSubscribeObject<any, TValue>(
							SubscribeObjectType.ValueProperty, null, this.valuePropertyDefaultName,
						),
						SubscribeObjectType.ValueProperty,
						VALUE_PROPERTY_PREFIX + this.valuePropertyDefaultName,
					),
			)
	}

	public rule<TValue>(rule: IRule): RuleBuilder<TValue, TValueKeys> {
		const {ruleLast} = this

		if (ruleLast) {
			ruleLast.next = rule
		} else {
			this.ruleFirst = rule
		}

		this.ruleLast = rule

		return this as unknown as RuleBuilder<TValue, TValueKeys>
	}

	public ruleSubscribe<TValue>(
		ruleSubscribe: IRuleSubscribe<TObject, TValue>,
	): RuleBuilder<TValue, TValueKeys> {
		return this.rule<TValue>(ruleSubscribe)
	}

	public nothing(): RuleBuilder<TObject, TValueKeys> {
		return this.rule<TObject>(new RuleNothing())
	}

	public never(): RuleBuilder<any, TValueKeys> {
		return this.rule<TObject>(RuleNever.instance)
	}

	/**
	 * Custom func
	 */
	public func<TValue>(
		subscribe: ISubscribeObject<TObject, TValue>,
		subType?: SubscribeObjectType,
		description?: string,
	): RuleBuilder<TValue, TValueKeys> {
		return (this.autoInsertValuePropertyDefault
			? this.valuePropertyDefault()
			: this)
			.ruleSubscribe<TValue>(
				new RuleSubscribe(subscribe, subType || SubscribeObjectType.Property, description),
			)
	}

	/**
	 * Custom func
	 */
	public f<TValue>(
		subscribe: ISubscribeObject<TObject, TValue>,
		subType?: SubscribeObjectType,
		description?: string,
	): RuleBuilder<TValue, TValueKeys> {
		return this.func(subscribe, subType, description)
	}

	/**
	 * Object property, Array index
	 */
	public valuePropertyName<TValue = PropertyValueOf<TObject>>(propertyName: string): RuleBuilder<TValue, TValueKeys> {
		return this
			.if([
				o => typeof o === 'undefined',
				b => b.never(),
			], [
				o => (o instanceof Object) && o.constructor !== Object && !Array.isArray(o),
				b => b.func<TValue>(
					createSubscribeObject<any, TValue>(SubscribeObjectType.ValueProperty, null, propertyName),
					SubscribeObjectType.ValueProperty,
					VALUE_PROPERTY_PREFIX + propertyName,
				),
			])
	}

	/**
	 * Object property, Array index
	 */
	public valuePropertyNames<TValue = PropertyValueOf<TObject>>(
		...propertiesNames: string[]
	): RuleBuilder<TValue, TValueKeys> {
		return this
			.if([
				o => typeof o === 'undefined',
				b => b.never(),
			], [
				o => (o instanceof Object) && o.constructor !== Object && !Array.isArray(o),
				b => b.func<TValue>(
					createSubscribeObject<any, TValue>(SubscribeObjectType.ValueProperty, null, ...propertiesNames),
					SubscribeObjectType.ValueProperty,
					VALUE_PROPERTY_PREFIX + propertiesNames.join('|'),
				),
			])
	}

	/**
	 * valuePropertyNames - Object property, Array index
	 */
	public v<TValue = PropertyValueOf<TObject>>(
		...propertiesNames: string[]
	): RuleBuilder<TValue, TValueKeys> {
		return this.valuePropertyNames<TValue>(...propertiesNames)
	}

	/**
	 * Object property, Array index
	 */
	public propertyName<TKeys extends keyof TObject, TValue = ObjectValueOf<TObject, TKeys>>(
		propertyName: TKeys,
	): RuleBuilder<TValue, TValueKeys>
	public propertyName<TValue>(propertyName: string): RuleBuilder<TValue, TValueKeys> {
		return (this.autoInsertValuePropertyDefault
			? this.valuePropertyDefault()
			: this)
			.func<TValue>(
				createSubscribeObject<any, TValue>(SubscribeObjectType.Property, null, propertyName),
				SubscribeObjectType.Property,
				propertyName,
			)
	}

	/**
	 * Object property, Array index
	 */
	public propertyNames<TKeys extends (keyof TObject) | ANY,
		TValue = ObjectValueOf<TObject, TKeys extends ANY ? any : TKeys>>(
		...propertiesNames: TKeys[]
	): RuleBuilder<TValue, TValueKeys>
	public propertyNames<TValue>(...propertiesNames: string[]): RuleBuilder<TValue, TValueKeys> {
		return (this.autoInsertValuePropertyDefault
			? this.valuePropertyDefault()
			: this)
			.func<TValue>(
				createSubscribeObject<any, TValue>(SubscribeObjectType.Property, null, ...propertiesNames),
				SubscribeObjectType.Property,
				propertiesNames.join('|'),
			)
	}

	/**
	 * propertyNames
	 * @param propertiesNames
	 */
	public p<TKeys extends (keyof TObject) | ANY,
		TValue = ObjectValueOf<TObject, TKeys extends ANY ? any : TKeys>>(
		...propertiesNames: TKeys[]
	): RuleBuilder<TValue, TValueKeys>
	public p<TValue>(...propertiesNames: string[]): RuleBuilder<TValue, TValueKeys> {
		return this.propertyNames(...propertiesNames as any)
	}

	/**
	 * Object property, Array index
	 */
	public propertyAny<TValue = ObjectAnyValueOf<TObject>>(): RuleBuilder<TValue, TValueKeys> {
		return (this.autoInsertValuePropertyDefault
			? this.valuePropertyDefault()
			: this)
			.func<TValue>(
				createSubscribeObject<any, TValue>(SubscribeObjectType.Property, null),
				SubscribeObjectType.Property,
				ANY_DISPLAY,
			)
	}

	/**
	 * Object property, Array index
	 */
	public propertyPredicate<TValue = ObjectAnyValueOf<TObject>>(
		predicate: (propertyName: string, object) => boolean,
		description: string,
	): RuleBuilder<TValue, TValueKeys> {
		return (this.autoInsertValuePropertyDefault
			? this.valuePropertyDefault()
			: this)
			.func<TValue>(
				createSubscribeObject<any, TValue>(SubscribeObjectType.Property, predicate),
				SubscribeObjectType.Property,
				description,
			)
	}

	/**
	 * Object property, Array index
	 */
	public propertyRegexp<TValue = ObjectAnyValueOf<TObject>>(regexp: RegExp) {
		if (!(regexp instanceof RegExp)) {
			throw new Error(`regexp (${regexp}) is not instance of RegExp`)
		}

		return this.propertyPredicate<TValue>(
			name => regexp.test(name),
			regexp.toString(),
		)
	}

	/**
	 * IListChanged & Iterable, ISetChanged & Iterable, IMapChanged & Iterable, Iterable
	 */
	public collection<TValue = IterableValueOf<TObject>>(): RuleBuilder<TValue, TValueKeys> {
		return (this.autoInsertValuePropertyDefault
			? this.valuePropertyDefault()
			: this)
			.func<TValue>(subscribeCollection, SubscribeObjectType.Property, COLLECTION_PREFIX)
	}

	public change(): RuleBuilder<number, TValueKeys> {
		return (this.autoInsertValuePropertyDefault
			? this.valuePropertyDefault()
			: this)
			.func(subscribeChange, SubscribeObjectType.Property, CHANGE_COUNT_PREFIX)
	}

	/**
	 * IMapChanged & Map, Map
	 */
	public mapKey<TKey, TValue = MapValueOf<TObject>>(key: TKey): RuleBuilder<TValue, TValueKeys> {
		return (this.autoInsertValuePropertyDefault
			? this.valuePropertyDefault()
			: this)
			.func<TValue>(
				createSubscribeMap<any, any, any>(null, key),
				SubscribeObjectType.Property,
				COLLECTION_PREFIX + key,
			)
	}

	/**
	 * IMapChanged & Map, Map
	 */
	public mapKeys<TKey, TValue = MapValueOf<TObject>>(...keys: TKey[]): RuleBuilder<TValue, TValueKeys> {
		return (this.autoInsertValuePropertyDefault
			? this.valuePropertyDefault()
			: this)
			.func<TValue>(
				createSubscribeMap<any, any, any>(null, ...keys),
				SubscribeObjectType.Property,
				COLLECTION_PREFIX + keys.join('|'),
			)
	}

	/**
	 * IMapChanged & Map, Map
	 */
	public mapAny<TValue = MapValueOf<TObject>>(): RuleBuilder<TValue, TValueKeys> {
		return (this.autoInsertValuePropertyDefault
			? this.valuePropertyDefault()
			: this)
			.func<TValue>(
				createSubscribeMap<any, any, any>(null),
				SubscribeObjectType.Property,
				COLLECTION_PREFIX,
			)
	}

	/**
	 * IMapChanged & Map, Map
	 */
	public mapPredicate<TKey, TValue = MapValueOf<TObject>>(
		keyPredicate: (key: TKey, object) => boolean,
		description: string,
	): RuleBuilder<TValue, TValueKeys> {
		return (this.autoInsertValuePropertyDefault
			? this.valuePropertyDefault()
			: this)
			.func<TValue>(
				createSubscribeMap<any, any, any>(keyPredicate),
				SubscribeObjectType.Property,
				description,
			)
	}

	/**
	 * IMapChanged & Map, Map
	 */
	public mapRegexp<TValue = MapValueOf<TObject>>(keyRegexp: RegExp) {
		if (!(keyRegexp instanceof RegExp)) {
			throw new Error(`keyRegexp (${keyRegexp}) is not instance of RegExp`)
		}

		return this.mapPredicate<string | number, TValue>(
			name => keyRegexp.test(name as string),
			keyRegexp.toString(),
		)
	}

	public if<TValue>(
		...exclusiveConditionRules: Array<[
			(value: TValue) => boolean,
			IRuleFactory<TObject, TValue, TValueKeys>
		] | IRuleFactory<TObject, TValue, TValueKeys>>
	): RuleBuilder<TValue, TValueKeys> {
		if (exclusiveConditionRules.length === 0) {
			throw new Error('if() parameters is empty')
		}

		const rule = new RuleIf<TValue>(exclusiveConditionRules.map(o => {
			if (Array.isArray(o)) {
				return [o[0], o[1](this.clone(true)).ruleFirst]
			}

			return o(this.clone(true)).ruleFirst
		}))

		return this.rule<TValue>(rule)
	}

	public any<TValue>(
		...getChilds: Array<IRuleFactory<TObject, TValue, TValueKeys>>
	): RuleBuilder<TValue, TValueKeys> {
		if (getChilds.length === 0) {
			throw new Error('any() parameters is empty')
		}

		const rule = new RuleAny(getChilds.map((o: any) => {
			const subRule = o(this.clone(true)).result()
			if (!subRule) {
				throw new Error(`Any subRule=${rule}`)
			}
			return subRule
		}))

		return this.rule<TValue>(rule)
	}

	public repeat<TValue>(
		countMin: number,
		countMax: number,
		condition: IRepeatCondition<TValue>,
		getChild: IRuleFactory<TObject, TValue, TValueKeys>,
	): RuleBuilder<TValue, TValueKeys> {
		const subRule = getChild(this.clone(true)).ruleFirst
		if (!subRule) {
			throw new Error(`getChild(...).rule = ${subRule}`)
		}

		if (countMax == null) {
			countMax = Number.MAX_SAFE_INTEGER
		}

		if (countMin == null) {
			countMin = 0
		}

		// if (countMax < countMin || countMax <= 0) {
		// 	return this as unknown as RuleBuilder<TValue, TValueKeys>
		// }

		let rule: IRule
		if (countMax === countMin && countMax === 1 && !condition) {
			rule = subRule
		} else {
			rule = new RuleRepeat(
				countMin,
				countMax,
				condition,
				getChild(this.clone(true)).ruleFirst,
			)
		}

		return this.rule<TValue>(rule)
	}

	public clone(optionsOnly?: boolean) {
		return new RuleBuilder<TObject, TValueKeys>({
			rule: optionsOnly || !this.ruleFirst
				? null
				: this.ruleFirst.clone(),
			valuePropertyDefaultName      : this.valuePropertyDefaultName,
			autoInsertValuePropertyDefault: this.autoInsertValuePropertyDefault,
		})
	}
}

// Test:
// interface ITestInterface1 {
// 	y: number
// }
//
// interface ITestInterface2 {
// 	x: ITestInterface1
// }
//
// export const test = new RuleBuilder<ITestInterface2>()
// 	.path(o => o.x)
