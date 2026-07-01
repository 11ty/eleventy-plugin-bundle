import { createDebug } from "obug";
import matchHelper from "posthtml-match-helper";

import { OutOfOrderRender } from "./OutOfOrderRender.js"

const debug = createDebug("Eleventy:Bundle");

const ATTRS = {
	// TODO buildawesome:
	keep: "eleventy:keep"
};

const POSTHTML_PLUGIN_NAME = "11ty/eleventy-bundle/prune-empty";

function getTextNodeContent(node) {
	if (!node.content) {
		return "";
	}

	return node.content
		.map((entry) => {
			if (typeof entry === "string") {
				return entry;
			}
			if (Array.isArray(entry.content)) {
				return getTextNodeContent(entry);
			}
			return "";
		})
		.join("");
}

function hasEmptyBundle(bundleAssetKey, context, bundleManagers) {
	if(!bundleAssetKey) {
		// not a bundle
		return false;
	}
	let parsed = OutOfOrderRender.parseAssetKey(bundleAssetKey);
	if(!parsed) {
		// not a bundle
		return false;
	}

	let { name, bucket } = parsed;
	if(bundleManagers?.[name]?.getRawForPage(context, [bucket]).size === 0) {
		// is a bundle and is empty
		return true;
	}

	return false;
}

function getSelector(managers = {}) {
	// Backwards compatibility with v4.0.1 and older: if code manager doesn’t have this function (old version)
	if(Object.values(managers).find(manager => {
		return typeof manager.getPruneEmptySelector !== "function";
	})) {
		return `style,script,link[rel="stylesheet"]`;
	}

	return Object.values(managers).map(manager => {
		return manager.getPruneEmptySelector();
	}).filter(Boolean).join(",");
}

export default function eleventyPruneEmptyBundles(eleventyConfig, options = {}) {
	if(!eleventyConfig.htmlTransformer || !eleventyConfig.htmlTransformer?.constructor?.SUPPORTS_PLUGINS_ENABLED_CALLBACK) {
		debug("You will need to upgrade your version of Eleventy core to remove empty bundle tags automatically (v3 or newer).");
		return;
	}

	// v4.0.2 moved selector configuration into individual Code Manager Bundles via CodeManager->getPruneEmptySelector

	// Subsequent call can remove a previously added `addPosthtmlPlugin` entry
	// htmlTransformer.remove is v3.0.1-alpha.4+
	if(typeof eleventyConfig.htmlTransformer?.remove === "function") {
		eleventyConfig.htmlTransformer.remove("html", entry => {
			if(entry.name === POSTHTML_PLUGIN_NAME) {
				return true;
			}

			// Temporary workaround for missing `name` property.
			let fnStr = entry.fn.toString();
			return !entry.name && fnStr.startsWith("function (pluginOptions = {}) {") && fnStr.includes(`tree.match(matchHelper(options.pruneEmptySelector), function (node)`);
		});
	}

	eleventyConfig.htmlTransformer.addPosthtmlPlugin(
		"html",
		function bundlePruneEmptyPosthtmlPlugin(context = {}) {
			let pageUrl = context?.url;
			if(!pageUrl) {
				throw new Error("Internal error: missing `url` property from context.");
			}

			return function (tree) {
				let managers = eleventyConfig.getBundleManagers();
				let selector = getSelector(managers);
				if(!selector) {
					return;
				}

				tree.match(matchHelper(selector), function (node) {
					if(node.attrs && node.attrs[ATTRS.keep] !== undefined) {
						delete node.attrs[ATTRS.keep];
						return node;
					}

					// <link rel="stylesheet" href="">
					if(node.tag === "link") {
						if(node.attrs?.rel === "stylesheet") {
							if((node.attrs?.href || "").trim().length === 0 || hasEmptyBundle(node.attrs?.href, context, managers)) {
								return false;
							}
						}
					} else {
						if(node.tag === "script" && typeof node.attrs?.src === "string") {
							// <script src=""> (node may or may not be empty)
							if(node.attrs.src.trim().length === 0 || hasEmptyBundle(node.attrs.src, context, managers)) {
								return false;
							}
						}

						let content = getTextNodeContent(node);

						if(node.tag === "script" && node.attrs?.src === undefined) {
							// <script></script> or <script>EMPTY BUNDLE ASSET KEY</script>
							if(!content || hasEmptyBundle(content, context, managers)) {
								return false;
							}
						}

						if(node.tag === "style") {
							// <style></style> or <style>EMPTY BUNDLE ASSET KEY</style>
							if(!content || hasEmptyBundle(content, context, managers)) {
								return false;
							}
						}
					}


					return node;
				});
			};
		},
		{
			name: POSTHTML_PLUGIN_NAME,

			// needs to run *after* bundle plucker
			priority: -1,

			// the `enabled` callback for plugins is available on v3.0.0-alpha.20+ and v3.0.0-beta.2+
			enabled: () => {
				return options.pruneEmptySelector !== false && Boolean(getSelector(eleventyConfig.getBundleManagers()));
			}
		}
	);
}
