export type TClass = new (...args: any[]) => any

export interface ITypeMeta {
	uuid: string
}

export interface ITypeMetaCollection<TMeta extends ITypeMeta> {
	getType(uuid: string): TClass
	getMeta(type: TClass): TMeta
	putType(type: TClass, meta: TMeta): TMeta
	deleteType(typeOrUuid: TClass|string): TMeta
}

const typeMetaPropertyNameBase: string = Math.random().toString(36)
let typeMetaPropertyNameIndex: number = 0

export class TypeMetaCollection<TMeta extends ITypeMeta> implements ITypeMetaCollection<TMeta> {
	private readonly _typeMetaPropertyName: string = typeMetaPropertyNameBase + (typeMetaPropertyNameIndex++)
	private readonly _typeMap: { [uuid: string]: TClass } = {}
	private readonly _proto: ITypeMetaCollection<TMeta>

	constructor(proto?: ITypeMetaCollection<TMeta>) {
		if (proto) {
			this._proto = proto
		}
	}

	public getMeta(type: TClass): TMeta {
		let meta

		const {_typeMetaPropertyName} = this
		if (Object.prototype.hasOwnProperty.call(type, _typeMetaPropertyName)) {
			meta = type[_typeMetaPropertyName]
		}

		if (typeof meta === 'undefined') {
			const {_proto} = this
			if (_proto) {
				return _proto.getMeta(type)
			}
		}

		return meta
	}

	public getType(uuid: string): TClass {
		const type = this._typeMap[uuid]

		if (typeof type === 'undefined') {
			const {_proto} = this
			if (_proto) {
				return _proto.getType(uuid)
			}
		}

		return type
	}

	public putType(type: TClass, meta: TMeta): TMeta {
		if (!type || typeof type !== 'function') {
			throw new Error(`type (${type}) should be function`)
		}

		const uuid = meta.uuid
		if (!uuid || typeof uuid !== 'string') {
			throw new Error(`meta.uuid (${uuid}) should be a string with length > 0`)
		}

		const { _typeMetaPropertyName } = this

		this._typeMap[uuid] = type

		let prevMeta
		if (Object.prototype.hasOwnProperty.call(type, _typeMetaPropertyName)) {
			prevMeta = type[_typeMetaPropertyName]
			delete type[_typeMetaPropertyName]
		}

		Object.defineProperty(type, _typeMetaPropertyName, {
			configurable: true,
			enumerable: false,
			writable: false,
			value: meta,
		})

		return prevMeta
	}

	public deleteType(typeOrUuid: TClass | string): TMeta {
		let uuid
		let type
		if (typeof typeOrUuid === 'function') {
			const meta = this.getMeta(typeOrUuid)
			uuid = meta && meta.uuid
			type = typeOrUuid
		} else if (typeof typeOrUuid === 'string') {
			type = this.getType(typeOrUuid)
			uuid = typeOrUuid
		} else {
			throw new Error(`typeOrUuid (${typeOrUuid === null ? 'null' : typeof typeOrUuid}) is not a Function or String`)
		}

		const { _typeMetaPropertyName } = this

		let prevMeta
		if (Object.prototype.hasOwnProperty.call(type, _typeMetaPropertyName)) {
			prevMeta = type[_typeMetaPropertyName]
			delete type[_typeMetaPropertyName]
		}

		delete this._typeMap[uuid]

		return prevMeta
	}
}