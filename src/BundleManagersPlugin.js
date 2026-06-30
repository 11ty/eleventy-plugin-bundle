import { createDebug } from "obug";
import { CodeManager } from "./CodeManager.js";
import { addHtmlPlucker } from "./BundlePlucker.js"

const debug = createDebug("Eleventy:Bundle");

function generateManager(name, bundleOptions = {}) {
	let manager = new CodeManager(name);

	if(bundleOptions.delayed !== undefined) {
		manager.setDelayed(bundleOptions.delayed);
	}

	if(bundleOptions.hoist !== undefined) {
		manager.setHoisting(bundleOptions.hoist);
	}

	if(bundleOptions.bundleHtmlContentFromSelector !== undefined) {
		manager.setPluckedSelector(bundleOptions.bundleHtmlContentFromSelector);
		manager.setDelayed(true); // must override `delayed` above
	}

	if(bundleOptions.bundleExportKey !== undefined) {
		manager.setBundleExportKey(bundleOptions.bundleExportKey);
	}

	if(bundleOptions.outputFileExtension) {
		manager.setFileExtension(bundleOptions.outputFileExtension);
	}

	if(bundleOptions.toFileDirectory) {
		manager.setBundleDirectory(bundleOptions.toFileDirectory);
	}

	if(bundleOptions.transforms) {
		manager.setTransforms(bundleOptions.transforms);
	}
	return manager;
}

export default function eleventyBundleManagers(eleventyConfig, pluginOptions = {}) {
	if(pluginOptions.force) {
		// no errors
	} else if(("getBundleManagers" in eleventyConfig || "addBundle" in eleventyConfig)) {
		throw new Error("Duplicate addPlugin calls for @11ty/eleventy-plugin-bundle");
	}

	let managers = {};
	eleventyConfig.addBundle = function addBundle(name, bundleOptions = {}) {
		let manager;
		if(typeof name === "function" && name.constructor.name === "CodeManager") {
			manager = name;
			managers[manager.name] === manager;
		} else if(typeof name === "string") {
			if(name in managers) {
				// note: shortcode must still be added
				debug("Bundle exists %o, skipping.", name);
			} else {
				debug("Creating new bundle %o", name);
				manager = generateManager(name, bundleOptions);
				managers[name] = manager;
			}
		}

		if(manager && bundleOptions.bundleHtmlContentFromSelector !== undefined) {
			addHtmlPlucker(eleventyConfig, manager);
		}

		// if undefined, defaults to `name`
		if(bundleOptions.shortcodeName !== false) {
			let shortcodeName = bundleOptions.shortcodeName || name;

			// e.g. `css` shortcode to add code to page bundle
			// These shortcode names are not configurable on purpose (for wider plugin compatibility)

			// Core v4.0.0-alpha.5 regression in https://github.com/11ty/buildawesome/issues/2261
			//     Nunjucks paired shortcodes need to be async to receive async rendered child `content` argument.
			//     Related to https://github.com/11ty/eleventy-plugin-bundle/issues/36

			// Core v4.0.0-alpha.9 uses fully-async nunjucks (v4.0.0-alpha.3) see test for Issue #25
			eleventyConfig.addPairedShortcode(shortcodeName, function addContent(content, bucket, explicitUrl) {
				let url = explicitUrl || this.page?.url;
				if(url) { // don’t add if a file doesn’t have an output URL
					managers[name].addToPage(url, content, bucket);
				}
				return "";
			});
		}
	};

	eleventyConfig.getBundleManagers = function() {
		return managers;
	};

	eleventyConfig.on("eleventy.before", async () => {
		for(let key in managers) {
			managers[key].reset();
		}
	});
};

