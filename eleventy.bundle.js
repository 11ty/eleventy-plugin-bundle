const pkg = require("./package.json");
const shortcodesPlugin = require("./eleventy.shortcodes.js");

function normalizeOptions(options = {}) {
	options = Object.assign({
		// Plugin defaults
		bundles: [], // extra bundles: css, js, and html are guaranteed
		toFileDirectory: "bundle",
		// post-process
		transforms: []
	}, options);

	options.bundles = Array.from(new Set(["css", "js", "html", ...(options.bundles || [])]));

	return options;
}

function eleventyBundlePlugin(eleventyConfig, options = {}) {
	try {
		eleventyConfig.versionCheck(pkg["11ty"].compatibility);
	} catch(e) {
		console.log( `WARN: Eleventy Plugin (${pkg.name}) Compatibility: ${e.message}` );
	}

	options = normalizeOptions(options);

	shortcodesPlugin(eleventyConfig, options);
};

// This plugin is used to find the package name for this plugin (used by eleventy-plugin-webc)
Object.defineProperty(eleventyBundlePlugin, "eleventyPackage", {
	value: pkg.name
});

module.exports = eleventyBundlePlugin;
module.exports.normalizeOptions = normalizeOptions;
