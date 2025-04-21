import bundlePlugin from "../../../eleventy.bundle.js";

export default function(eleventyConfig) {
	eleventyConfig.addPlugin(bundlePlugin, {
		force: true, // for testing
		bundles: false,
		immediate: true,
	});

	eleventyConfig.addBundle("js", {
		bundleHtmlContentFromSelector: "script",
		transforms: [
			function(content) {
				return `/* Banner from Transforms */
${content}`;
			}
		]
	})
};