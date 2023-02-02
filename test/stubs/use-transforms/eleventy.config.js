const bundlePlugin = require("../../../");
const postcss = require('postcss');
const postcssNested = require('postcss-nested')

module.exports = function(eleventyConfig) {
	eleventyConfig.addPlugin(bundlePlugin, {
		transforms: [async function(content) {
			return new Promise(resolve => {
				setTimeout(() => resolve(content), 50);
			});
		}, async function(content) {
			let result = await postcss([postcssNested]).process(content, { from: null, to: null })
			return result.css;
		}]
	});
};