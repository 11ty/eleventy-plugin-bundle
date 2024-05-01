const pkg = require("./package.json");
const bundleManagersPlugin = require("./eleventy.bundleManagers.js");
const shortcodesPlugin = require("./eleventy.shortcodes.js");
const debug = require("debug")("Eleventy:Bundle");

function normalizeOptions(options = {}) {
	options = Object.assign({
		// Plugin defaults
		bundles: [], // extra bundles: css, js, and html are guaranteed unless `bundles: false`
		toFileDirectory: "bundle",
		// post-process
		transforms: [],
		hoistDuplicateBundlesFor: [],
		bundleExportKey: "bundle", // use a `bundle` export in a 11ty.js template to populate bundles
	}, options);

	if(options.bundles !== false) {
		options.bundles = Array.from(new Set(["css", "js", "html", ...(options.bundles || [])]));
	}

	return options;
}

function eleventyBundlePlugin(eleventyConfig, pluginOptions = {}) {
	eleventyConfig.versionCheck(pkg["11ty"].compatibility);

	pluginOptions = normalizeOptions(pluginOptions);

	if(!("getBundleManagers" in eleventyConfig) && !("addBundle" in eleventyConfig)) {
		bundleManagersPlugin(eleventyConfig, pluginOptions);
	}

	shortcodesPlugin(eleventyConfig, pluginOptions);

	if(Array.isArray(pluginOptions.bundles)) {
		debug("Adding bundles via `addPlugin`: %o", pluginOptions.bundles)
		pluginOptions.bundles.forEach(name => {
			let isHoisting = Array.isArray(pluginOptions.hoistDuplicateBundlesFor) && pluginOptions.hoistDuplicateBundlesFor.includes(name);

			eleventyConfig.addBundle(name, {
				hoist: isHoisting,
				outputFileExtension: name, // default as `name`
				shortcodeName: name, // `false` will skip shortcode
				transforms: pluginOptions.transforms,
				toFileDirectory: pluginOptions.toFileDirectory,
				bundleExportKey: pluginOptions.bundleExportKey, // `false` will skip bundle export
			});
		});
	}
};

// This is used to find the package name for this plugin (used in eleventy-plugin-webc to prevent dupes)
Object.defineProperty(eleventyBundlePlugin, "eleventyPackage", {
	value: pkg.name
});

module.exports = eleventyBundlePlugin;
module.exports.normalizeOptions = normalizeOptions;
