export default function(eleventyConfig) {
	eleventyConfig.addBundle("css", { bundleExportKey: "css" });
	eleventyConfig.addBundle("js", { bundleExportKey: "js" });
};