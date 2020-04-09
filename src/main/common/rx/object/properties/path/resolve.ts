import {isThenable, IThenable, ThenableOrIteratorOrValue, ThenableOrValue} from '../../../../async/async'
import {resolveAsync, ThenableSync} from '../../../../async/ThenableSync'
import {HasDefaultOrValue, VALUE_PROPERTY_DEFAULT} from '../../../../helpers/value-property'
import {CalcPropertyValue} from '../CalcProperty'
import {TGetPropertyValue} from './constracts'

function resolveValueProperty(value: any, getValue?: (value: any) => any) {
	if (value != null && typeof value === 'object') {
		if (VALUE_PROPERTY_DEFAULT in value) {
			if (getValue) {
				const newValue = getValue(value)
				if (typeof newValue !== 'undefined') {
					return newValue
				}
			}
			return value[VALUE_PROPERTY_DEFAULT]
		}

		if (value instanceof CalcPropertyValue) {
			return value.get()
		}
	}

	return value
}

export function resolvePath<TValue>(value: ThenableOrIteratorOrValue<TValue>): TGetPropertyValue<TValue> {
	const get: any = <TNextValue>(getValue, isValueProperty, newValue) => {
		const _getValue = getValue && (val =>
			val != null && typeof val === 'object' || typeof val === 'string'
				? getValue(val, newValue)
				: void 0)

		const customResolveValue = _getValue && isValueProperty
			? val => resolveValueProperty(val, _getValue)
			: resolveValueProperty

		value = resolveAsync(
			value as ThenableOrIteratorOrValue<HasDefaultOrValue<TValue>>,
			null, null, null, customResolveValue)

		if (!_getValue) {
			return value as ThenableOrValue<TValue>
		}

		if (!isValueProperty) {
			if (value instanceof ThenableSync) {
				value = (value as ThenableSync<TValue>).then(
					_getValue,
					null,
					false,
				)
			} else if (isThenable(value)) {
				value = (value as IThenable<TValue>).then(
					_getValue,
				)
			} else {
				value = resolveAsync(_getValue(value as TValue))
			}
		}

		return get
	}

	return get
}

// Test
// const x: TGetPropertyValue<ICalcProperty<Date>>
// const r = x(o => o, true)()