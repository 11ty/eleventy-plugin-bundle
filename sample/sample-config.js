const bundlePlugin = require("../eleventy.config.js");

module.exports = function(eleventyConfig) {
	eleventyConfig.addPlugin(bundlePlugin);
	eleventyConfig.addPlugin(bundlePlugin);
};
