const bundlePlugin = require("../../../");

module.exports = function(eleventyConfig) {
	eleventyConfig.addPlugin(bundlePlugin, {
		hoistDuplicateBundlesFor: ["css", "js"],
	});
};