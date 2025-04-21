import { createRequire } from "node:module";
import debugUtil from "debug";
import { CodeManager } from "./CodeManager.js";
import { addHtmlPlucker } from "./bundlePlucker.js"

const require = createRequire(import.meta.url);
const debug = debugUtil("Eleventy:Bundle");
const pkg = require("../package.json");

function eleventyBundleManagers(eleventyConfig, pluginOptions = {}) {
	if(pluginOptions.force) {
		// no errors
	} else if(("getBundleManagers" in eleventyConfig || "addBundle" in eleventyConfig)) {
		throw new Error("Duplicate addPlugin calls for " + pkg.name);
	}

	let managers = {};

	function addBundle(name, bundleOptions = {}) {
		if(name in managers) {
			// note: shortcode must still be added
			debug("Bundle exists %o, skipping.", name);
		} else {
			debug("Creating new bundle %o", name);
			let mgr = new CodeManager(name);
			managers[name] = mgr;

			if(bundleOptions.delayed !== undefined) {
				mgr.setDelayed(bundleOptions.delayed);
			}

			if(bundleOptions.hoist !== undefined) {
				mgr.setHoisting(bundleOptions.hoist);
			}

			if(bundleOptions.bundleHtmlContentFromSelector !== undefined) {
				mgr.setPluckedSelector(bundleOptions.bundleHtmlContentFromSelector);
				mgr.setDelayed(true); // must override `delayed` above

				addHtmlPlucker(eleventyConfig, mgr);
			}

			if(bundleOptions.bundleExportKey !== undefined) {
				mgr.setBundleExportKey(bundleOptions.bundleExportKey);
			}

			if(bundleOptions.outputFileExtension) {
				mgr.setFileExtension(bundleOptions.outputFileExtension);
			}

			if(bundleOptions.toFileDirectory) {
				mgr.setBundleDirectory(bundleOptions.toFileDirectory);
			}

			if(bundleOptions.transforms) {
				mgr.setTransforms(bundleOptions.transforms);
			}
		}

		// if undefined, defaults to `name`
		if(bundleOptions.shortcodeName !== false) {
			let shortcodeName = bundleOptions.shortcodeName || name;

			// e.g. `css` shortcode to add code to page bundle
			// These shortcode names are not configurable on purpose (for wider plugin compatibility)
			eleventyConfig.addPairedShortcode(shortcodeName, function addContent(content, bucket, explicitUrl) {
				let url = explicitUrl || this.page?.url;
				if(url) { // don’t add if a file doesn’t have an output URL
					mgr.addToPage(url, content, bucket);
				}
				return "";
			});
		}
	};

	eleventyConfig.addBundle = addBundle;

	eleventyConfig.getBundleManagers = function() {
		return managers;
	};

	eleventyConfig.on("eleventy.before", async () => {
		for(let key in managers) {
			managers[key].reset();
		}
	});
};

export default eleventyBundleManagers;
