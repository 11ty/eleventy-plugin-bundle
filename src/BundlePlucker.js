import { createDebug } from "obug";
import matchHelper from "posthtml-match-helper";

const debug = createDebug("Eleventy:Bundle");

const ATTRS = {
	// TODO buildawesome:
	ignore: "eleventy:ignore",
	bucket: "eleventy:bucket",
};

const POSTHTML_PLUGIN_NAME = "11ty/eleventy/html-bundle-plucker";

function hasAttribute(node, name) {
	return node?.attrs?.[name] !== undefined;
}

export function addHtmlPlucker(eleventyConfig, bundleManager) {
	let matchSelector = bundleManager.getPluckedSelector();

	if(!matchSelector) {
		throw new Error("Internal error: missing plucked selector on bundle manager.");
	}

	eleventyConfig.htmlTransformer.addPosthtmlPlugin(
		"html",
		function (context = {}) {
			let pageUrl = context?.url;
			if(!pageUrl) {
				throw new Error("Internal error: missing `url` property from context.");
			}

			return function (tree) {
				tree.match(matchHelper(matchSelector), function (node) {
					try {
						if(hasAttribute(node, ATTRS.ignore)) {
							delete node.attrs[ATTRS.ignore];
							return node;
						}

						if(Array.isArray(node?.content) && node.content.length > 0) {
							// TODO make this better decoupled
							if(node?.content.find(entry => entry.includes(`__EleventyBundle:`) || entry.includes(`#BaBundle:`))) {
								// preserve {% getBundle %} calls as-is
								return node;
							}

							let bucketName = node?.attrs?.[ATTRS.bucket];
							bundleManager.addToPage(pageUrl, [ ...node.content ], bucketName);

							return { attrs: [], content: [], tag: false };
						}
					} catch(e) {
						debug(`Bundle plucker: error adding content to bundle in HTML Assets: %o`, e);
						return node;
					}
					return node;
				});
			};
		},
		{
			// pluginOptions
			name: POSTHTML_PLUGIN_NAME,

			// needs to run before prune empty bundles, which has priority -1
			// priority: 0,

			// the `enabled` callback for plugins is available on v3.0.0-alpha.20+ and v3.0.0-beta.2+
			enabled: () => {
				return Object.keys(eleventyConfig.getBundleManagers()).length > 0;
			}
		},
	);
}
