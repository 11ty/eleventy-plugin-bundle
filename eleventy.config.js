const pkg = require("./package.json");
const shortcodesPlugin = require("./eleventy.shortcodes.js");
// const debug = require("debug")("Eleventy:Bundle");

function normalizeOptions(options) {
	let shortcodes = Object.assign({
		get: "getBundle",
		toFile: "getBundleFile",
		add: {
			// use `addCss` instead of `css`
			// css: "addCss"
		}
	}, options.shortcodes);

	options = Object.assign({
		// Plugin defaults
		bundles: ["css", "js", "html"],
		toFileDirectory: "bundle",
	}, options);

	options.shortcodes = shortcodes;

	return options;
}

module.exports = function(eleventyConfig, options = {}) {
	try {
		eleventyConfig.versionCheck(pkg["11ty"].compatibility);
	} catch(e) {
		console.log( `WARN: Eleventy Plugin (${pkg.name}) Compatibility: ${e.message}` );
	}

	options = normalizeOptions(options);

	eleventyConfig.addPlugin(shortcodesPlugin, options);
};