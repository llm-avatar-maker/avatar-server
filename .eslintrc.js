require('dotenv').config();
const plugins = ['prettier'];
if (process.env.ESLINT_ONLY_WARN !== 'false') {
	plugins.push('only-warn');
}

module.exports = {
	root: true,
	env: {
		browser: true,
		commonjs: true,
		es2021: true,
		node: true,
	},
	extends: ['eslint:recommended', 'prettier'],
	plugins: plugins,
	overrides: [],
	parserOptions: {
		ecmaVersion: 'latest',
	},
	rules: {
		'prettier/prettier': 'error',
	},
};
