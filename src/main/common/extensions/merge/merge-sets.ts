import {IMergeOptions, IMergeValue} from './contracts'
import {IMergeMapWrapper, mergeMapWrappers, MergeObjectWrapper} from './merge-maps'

export class MergeSetWrapper<V> implements IMergeMapWrapper<V, V> {
	private readonly _set: Set<V>
	private readonly _getKey: Set<V>

	constructor(set: Set<V>) {
		this._set = set
	}

	public delete(key: V): void {
		this._set.delete(key)
	}

	public forEachKeys(callbackfn: (key: V) => void): void {
		for (const key of this._set) {
			callbackfn(key)
		}
	}

	public get(key: V): V {
		return key
	}

	public has(key: V): boolean {
		return this._set.has(key)
	}

	public set(key: V, value: V): void {
		this._set.add(value)
	}
}

export function createMergeSetWrapper<V>(
	setOrObject: object | Set<V> | V[] | Iterable<V>,
	arrayOrIterableToSet: (array) => object | Set<V>,
) {
	if (setOrObject.constructor === Object) {
		return new MergeObjectWrapper(setOrObject)
	}

	if (setOrObject[Symbol.toStringTag] === 'Set') {
		return new MergeSetWrapper(setOrObject as Set<V>)
	}

	if (arrayOrIterableToSet && (setOrObject[Symbol.iterator] || Array.isArray(setOrObject))) {
		return createMergeSetWrapper(arrayOrIterableToSet(setOrObject), null)
	}

	throw new Error(`Unsupported type (${setOrObject.constructor.name}) to merge with Set`)
}

export function mergeSets<TObject extends object>(
	arrayOrIterableToSet: (arrayOrIterable) => object | Set<any>,
	merge: IMergeValue,
	base: TObject,
	older: TObject,
	newer: TObject,
	preferCloneOlder?: boolean,
	preferCloneNewer?: boolean,
	options?: IMergeOptions,
): boolean {
	const baseWrapper = createMergeSetWrapper(base, arrayOrIterableToSet)
	const olderWrapper = older === base ? baseWrapper : createMergeSetWrapper(older, arrayOrIterableToSet)
	const newerWrapper = newer === base
		? baseWrapper
		: (newer === older ? olderWrapper : createMergeSetWrapper(newer, arrayOrIterableToSet))

	return mergeMapWrappers(
		merge,
		baseWrapper,
		olderWrapper,
		newerWrapper,
		preferCloneOlder,
		preferCloneNewer,
		options,
	)
}
