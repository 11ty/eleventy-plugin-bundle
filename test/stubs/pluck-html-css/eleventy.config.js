import bundlePlugin from "../../../src/BundlePlugin.js";

export default function(eleventyConfig) {
	eleventyConfig.addPlugin(bundlePlugin, {
		force: true, // for testing
		bundles: false,
		immediate: true,
	});

	eleventyConfig.addBundle("css", {
		bundleHtmlContentFromSelector: "style",
	})
};