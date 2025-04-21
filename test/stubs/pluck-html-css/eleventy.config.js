import bundlePlugin from "../../../eleventy.bundle.js";

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