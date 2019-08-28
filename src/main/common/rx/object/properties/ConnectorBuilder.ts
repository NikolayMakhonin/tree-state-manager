import {deepSubscribeRule} from '../../deep-subscribe/deep-subscribe'
import {cloneRule, RuleBuilder} from '../../deep-subscribe/RuleBuilder'
import {ObservableObject} from '../ObservableObject'
import {IWritableFieldOptions, ObservableObjectBuilder} from '../ObservableObjectBuilder'
import {Connector} from './Connector'
import {ValueKeys} from './contracts'

export class ConnectorBuilder<
	TObject extends ObservableObject,
	TSource = TObject,
	TValueKeys extends string | number = ValueKeys
>
	extends ObservableObjectBuilder<TObject>
{
	public buildSourceRule: (builder: RuleBuilder<TObject, TValueKeys>)
		=> RuleBuilder<TSource, TValueKeys>

	constructor(
		object?: TObject,
		buildSourceRule?: (builder: RuleBuilder<TObject, TValueKeys>)
			=> RuleBuilder<TSource, TValueKeys>,
	) {
		super(object)
		this.buildSourceRule = buildSourceRule
	}

	public connect<TValue, Name extends string | number>(
		name: Name,
		buildRule: (builder: RuleBuilder<TSource, TValueKeys>) => RuleBuilder<TValue, TValueKeys>,
		options?: IWritableFieldOptions,
		initValue?: TValue,
	): this & { object: { [newProp in Name]: TValue } } {
		const {object, buildSourceRule} = this

		let ruleBuilder = new RuleBuilder<TValue, TValueKeys>()
		if (buildSourceRule) {
			ruleBuilder = buildSourceRule(ruleBuilder as any) as any
		}
		ruleBuilder = buildRule(ruleBuilder as any)

		const ruleBase = ruleBuilder && ruleBuilder.result
		if (ruleBase == null) {
			throw new Error('buildRule() return null or not initialized RuleBuilder')
		}

		const setOptions = options && options.setOptions

		return this.readable(
			name,
			{
				setOptions,
				hidden: options && options.hidden,
				// tslint:disable-next-line:no-shadowed-variable
				factory(this: ObservableObject, initValue: TValue) {
					let setValue = (value: TValue): void => {
						if (typeof value !== 'undefined') {
							initValue = value
						}
					}

					const unsubscribe = deepSubscribeRule<TValue>(
						this,
						value => {
							setValue(value)
							return null
						},
						true,
						this === object
							? ruleBase
							: cloneRule(ruleBase),
					)

					this._setUnsubscriber(name, unsubscribe)

					setValue = value => {
						this._set(name, value, setOptions)
					}

					return initValue
				},
			},
			initValue,
		)
	}
}

export function connectorClass<
	TSource extends ObservableObject,
	TConnector extends ObservableObject,
>(
	build: (connectorBuilder: ConnectorBuilder<ObservableObject, TSource>) => { object: TConnector },
	baseClass?: new (source: TSource) => Connector<TSource>,
): new (source: TSource) => TConnector {
	class NewConnector extends (baseClass || Connector) implements Connector<TSource> { }

	build(new ConnectorBuilder<NewConnector, TSource>(
		NewConnector.prototype,
		b => b.propertyName('connectorSource'),
	))

	return NewConnector as unknown as new (source: TSource) => TConnector
}

export function connectorFactory<
	TSource extends ObservableObject,
	TConnector extends ObservableObject,
>(
	build: (connectorBuilder: ConnectorBuilder<ObservableObject, TSource>) => { object: TConnector },
	baseClass?: new (source: TSource) => Connector<TSource>,
): (source: TSource) => TConnector {
	const NewConnector = connectorClass(build, baseClass)
	return source => new NewConnector(source) as unknown as TConnector
}

// const builder = new ConnectorBuilder(true as any)
//
// export function connect<TObject extends ObservableObject, TValue = any>(
// 	options?: IConnectFieldOptions<TObject, TValue>,
// 	initValue?: TValue,
// ) {
// 	return (target: TObject, propertyKey: string) => {
// 		builder.object = target
// 		builder.connect(propertyKey, options, initValue)
// 	}
// }

// class Class1 extends ObservableObject {
// }
// class Class extends Class1 {
// 	@connect()
// 	public prop: number
// }