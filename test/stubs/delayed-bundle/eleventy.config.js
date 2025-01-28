import bundlePlugin from "../../../eleventy.bundle.js";

export default function(eleventyConfig) {
	eleventyConfig.addPlugin(bundlePlugin, {
		force: true,
		immediate: true, // immediate required for subsequent addBundle call
	});

	// delayed bundles happen *after* transforms
	eleventyConfig.addBundle("svg", { delayed: true });

	eleventyConfig.addTransform("adds-to-bundle", (content) => {
		let { svg: svgBundle } = eleventyConfig.getBundleManagers();
		svgBundle.addToPage("/", [ "this is svg" ]);
		return content;
	})

	eleventyConfig.addTemplate('index.njk', `testing:{% getBundle "svg" %}`)
};