import bundlePlugin from "../../../src/BundlePlugin.js";

export default function(eleventyConfig) {
	eleventyConfig.addPlugin(bundlePlugin, {
		bundles: false,
	});
};