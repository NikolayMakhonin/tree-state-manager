import '../extensions/autoConnect'
import {PropertyChangedObject} from './PropertyChangedObject'

export interface ISetOptions {
	equalsFunc?: (oldValue, newValue) => boolean,
	fillFunc?: (oldValue, newValue) => boolean,
	convertFunc?: (newValue) => any,
	beforeChange?: (oldValue) => void,
	afterChange?: (newValue) => void,
	suppressPropertyChanged?: boolean,
}

export class ObservableClass extends PropertyChangedObject {

	/** @internal */
	public readonly __fields?: {
		[key: string]: any;
		[key: number]: any;
	}

	constructor() {
		super()

		Object.defineProperty(this, '__fields', {
			configurable: false,
			enumerable  : false,
			writable    : false,
			value       : {},
		})
	}
}

/** @internal */
export function _setExt(
	name: string | number,
	getValue: () => any,
	setValue: (v) => void,
	options: ISetOptions,
	object: ObservableClass,
	newValue,
) {
	if (!options) {
		return _set(name, getValue, setValue, object, newValue)
	}

	const oldValue = getValue ? getValue.call(object) : object.__fields[name]

	const equalsFunc = options.equalsFunc
	if (equalsFunc ? equalsFunc.call(object, oldValue, newValue) : oldValue === newValue) {
		return false
	}

	const fillFunc = options.fillFunc
	if (fillFunc && oldValue != null && newValue != null && fillFunc.call(object, oldValue, newValue)) {
		return false
	}

	const convertFunc = options.convertFunc
	if (convertFunc) {
		newValue = convertFunc.call(object, newValue)
	}

	if (oldValue === newValue) {
		return false
	}

	const beforeChange = options.beforeChange
	if (beforeChange) {
		beforeChange.call(object, oldValue)
	}

	if (setValue) {
		setValue.call(object, newValue)
	} else {
		object.__fields[name] = newValue
	}

	const afterChange = options.afterChange
	if (afterChange) {
		afterChange.call(object, newValue)
	}

	if (!options || !options.suppressPropertyChanged) {
		const {propertyChangedIfCanEmit} = object
		if (propertyChangedIfCanEmit) {
			propertyChangedIfCanEmit.onPropertyChanged({
				name,
				oldValue,
				newValue,
			})
		}
	}

	return true
}

/** @internal */
export function _set(
	name: string | number,
	getValue: () => any,
	setValue: (v) => void,
	object: ObservableClass,
	newValue,
) {
	const oldValue = getValue.call(object)

	if (oldValue === newValue) {
		return false
	}

	setValue.call(object, newValue)

	const {propertyChangedDisabled, propertyChanged} = object.__meta
	if (!propertyChangedDisabled && propertyChanged) {
		propertyChanged.emit({
			name,
			oldValue,
			newValue,
		})
	}

	return true
}