import bundlePlugin from "../../../src/BundlePlugin.js";

export default function(eleventyConfig) {
	eleventyConfig.addPlugin(bundlePlugin, {
		hoistDuplicateBundlesFor: ["css", "js"],
	});
};