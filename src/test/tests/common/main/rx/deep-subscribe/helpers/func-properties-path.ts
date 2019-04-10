/* eslint-disable no-useless-escape,computed-property-spacing */
import {
	getFuncPropertiesPath,
	parsePropertiesPath,
	parsePropertiesPathString,
} from '../../../../../../../main/common/rx/deep-subscribe/helpers/func-properties-path'

declare const assert

describe('common > main > rx > deep-subscribe > func-properties-path', function() {
	it('parsePropertiesPathString', function() {
		const path = '. o[ "\\`\\"\\\'\\\\`\'[]]" ] . o [ 0 ] . o [ \'\\`\\"\\\'\\\\`"][]\' ] . o'

		function testParse(funcStr) {
			assert.strictEqual(parsePropertiesPathString(funcStr), path)
		}

		testParse(`(a) => a ${path}`)
		testParse(`b => ( ( b ${path} ) ) `)
		testParse(`c =>  {  return c ${path} ; }`)
		testParse(`function  (d)  {  return d ${path}}`)
		testParse(`function funcName (e)  {  return e ${path}}`)
		testParse(` funcName (f)  {  return f ${path}}`)
		testParse(new Function('o', `return o${path}`) as any)

		assert.throws(() => parsePropertiesPathString(''), Error)
		assert.throws(() => parsePropertiesPathString(`(a) => b ${path}`), Error)
		assert.throws(() => parsePropertiesPathString(`b => ( ( c ${path} ) ) `), Error)
		assert.throws(() => parsePropertiesPathString(new Function('w', `return o${path}`) as any), Error)
	})

	it('parsePropertiesPath', function() {
		const path = '. o[ "\\`\\"\\\'\\\\`\'[]]" ] . o [ 0 ] . o [ \'\\`\\"\\\'\\\\`"][]\' ] . o'

		function assertParse(properties) {
			assert.deepStrictEqual(properties, [
				'o',
				'`\"\'\\`\'[]]',
				'o',
				'0',
				'o',
				'`\"\'\\`\"][]',
				'o',
			])
		}

		function testParse(propertiesPath) {
			assertParse(parsePropertiesPath(propertiesPath))
		}

		function testParseFunc(func) {
			assertParse(getFuncPropertiesPath(func))
			assertParse(getFuncPropertiesPath(func))
		}

		testParse(path)
		testParseFunc(new Function('o', `return o${path} ; `))
		testParseFunc(o => o . o[ "\`\"\'\\`'[]]" ] . o [ 0 ] . o [ '\`\"\'\\`"][]' ] . o)

		assert.throws(() => parsePropertiesPath('.' + path), Error)
	})
})