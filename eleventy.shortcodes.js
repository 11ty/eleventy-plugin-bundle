const CodeManager = require("./codeManager.js");
const OutOfOrderRender = require("./outOfOrderRender.js");
const debug = require("debug")("Eleventy:Bundle");

module.exports = function(eleventyConfig, options = {}) {
	let managers = {};

	options.bundles.forEach(name => {
		managers[name] = new CodeManager(name);
		managers[name].setTransforms(options.transforms);

		// e.g. `css` shortcode to add code to page bundle
		// These shortcode names are not configurable on purpose (for wider plugin compatibility)
		eleventyConfig.addPairedShortcode(name, function addContent(content, bucket, urlOverride) {
			let url = urlOverride || this.page.url;
			managers[name].addToPage(url, content, bucket);
			return "";
		});
	});

	let writeToFileSystem = true;
	eleventyConfig.on("eleventy.before", async ({ outputMode }) => {
		for(let key in managers) {
			managers[key].reset();
		}

		if(outputMode !== "fs") {
			writeToFileSystem = false;
			debug("Skipping writing to the file system due to output mode: %o", outputMode);
		}
	});

	// e.g. `getBundle` shortcode to get code in current page bundle
	// bucket can be an array
	// This shortcode name is not configurable on purpose (for wider plugin compatibility)
	eleventyConfig.addShortcode("getBundle", function getContent(type, bucket) {
		if(!type || !(type in managers)) {
			throw new Error("Invalid bundle type: " + type);
		}

		return OutOfOrderRender.getAssetKey("get", type, bucket);
	});

	// write a bundle to the file system
	// This shortcode name is not configurable on purpose (for wider plugin compatibility)
	eleventyConfig.addShortcode("getBundleFileUrl", function(type, bucket) {
		if(!type || !(type in managers)) {
			throw new Error("Invalid bundle type: " + type);
		}

		return OutOfOrderRender.getAssetKey("file", type, bucket);
	});

	eleventyConfig.addTransform("@11ty/eleventy-bundle", async function(content) {
		if(!this.page.outputPath || typeof content !== "string") {
			return content;
		}

		let render = new OutOfOrderRender(content);
		for(let key in managers) {
			render.setAssetManager(key, managers[key]);
		}

		render.setOutputDirectory(eleventyConfig.dir.output);
		render.setBundleDirectory(options.toFileDirectory);
		render.setWriteToFileSystem(writeToFileSystem);

		return render.replaceAll(this.page);
	});
};
