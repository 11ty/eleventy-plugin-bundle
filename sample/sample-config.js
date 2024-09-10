import bundlePlugin from "../eleventy.bundle.js";

export default function(eleventyConfig) {
	// This call is what Eleventy will do in the default config in 3.0.0-alpha.10
	eleventyConfig.addPlugin(bundlePlugin, {
		bundles: false,
		immediate: true
	});

	// adds html, css, js (maintain existing API)
	eleventyConfig.addPlugin(bundlePlugin, {
		toFileDirectory: "bundle1"
	});

	eleventyConfig.addPlugin(eleventyConfig => {
		// ignored, already exists
		eleventyConfig.addBundle("css");
		// ignored, already exists
		eleventyConfig.addBundle("css");
		// ignored, already exists
		eleventyConfig.addBundle("css");
		// ignored, already exists
		eleventyConfig.addBundle("html");
	});

	// new!
	eleventyConfig.addBundle("stylesheet", {
		outputFileExtension: "css",
		shortcodeName: "stylesheet",
		transforms: [],
		// hoist: true,
	});
};
