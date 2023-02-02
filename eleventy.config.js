const pkg = require("./package.json");
const shortcodesPlugin = require("./eleventy.shortcodes.js");
const debug = require("debug")("Eleventy:Bundle");

function normalizeOptions(options) {
	let shortcodes = Object.assign({
		get: "getBundle",
		toFile: "getBundleFileUrl",
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

let hasExecuted = false;

function eleventyBundlePlugin(eleventyConfig, options = {}) {
	try {
		eleventyConfig.versionCheck(pkg["11ty"].compatibility);
	} catch(e) {
		console.log( `WARN: Eleventy Plugin (${pkg.name}) Compatibility: ${e.message}` );
	}

	options = normalizeOptions(options);

	eleventyConfig.on("eleventy.before", () => {
		hasExecuted = false;
	});

	if(hasExecuted) {
		debug("Warning: Currently @11ty/eleventy-plugin-bundle only supports one addPlugin of this plugin per project. Subsequent adds are ignored.");
	} else {
		hasExecuted = true;
		shortcodesPlugin(eleventyConfig, options);
	}
};

module.exports = eleventyBundlePlugin;
