import bundlePlugin from "../../../eleventy.bundle.js";

export default function(eleventyConfig) {
	eleventyConfig.addPlugin(bundlePlugin, {
		force: true, // for testing
		immediate: true,
    // toFileDirectory: "bundle",
    bundles: false,
	});

	// eleventyConfig.addBundle("css");
	eleventyConfig.addBundle("css", {
		bundleHtmlContentFromSelector: "style",
	});
};