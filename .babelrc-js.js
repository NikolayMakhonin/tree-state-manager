module.exports = {
	presets: [
		[
			'@babel/preset-env',
			{
				targets: {
					node: '8.6.0'
				}
			}
		]
	],
	plugins: [
		'@babel/plugin-transform-typescript',
		[
			'@babel/plugin-proposal-decorators', {
				legacy: true
			}
		],

		'@babel/plugin-syntax-dynamic-import',
		'@babel/plugin-transform-runtime',

		'@babel/plugin-proposal-optional-chaining',
		'@babel/plugin-proposal-throw-expressions',
		['@babel/plugin-proposal-class-properties', {loose: true}],
	]
}
