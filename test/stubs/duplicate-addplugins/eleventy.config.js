import bundlePlugin from "../../../eleventy.bundle.js";

export default function(eleventyConfig) {
	eleventyConfig.addPlugin(bundlePlugin, {
		bundles: false,
	});
};