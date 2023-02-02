const path = require("path");
const CodeManager = require("./codeManager.js");
const OutOfOrderRender = require("./outOfOrderRender.js");
const debug = require("debug")("Eleventy:Bundle");

module.exports = function(eleventyConfig, options = {}) {
	let managers = {};

	if(Array.isArray(options.bundles)) {
		options.bundles.forEach(name => {
			managers[name] = new CodeManager(name);

			// e.g. `css` shortcode to add code to page bundle
			let addShortcodeName = name;
			if(options.shortcodes.add && options.shortcodes.add[name] !== undefined) {
				addShortcodeName = options.shortcodes.add[name];
			}

			if(addShortcodeName) {
				eleventyConfig.addPairedShortcode(addShortcodeName, function addContent(content, bucket, urlOverride) {
					let url = urlOverride || this.page.url;
					managers[name].addToPage(url, content, bucket);
					return "";
				});
			}
		});
	}

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
	if(options.shortcodes.get) {
		// bucket can be an array
		eleventyConfig.addShortcode(options.shortcodes.get, function getContent(type, bucket) {
			if(!type || !(type in managers)) {
				throw new Error("Invalid bundle type: " + type);
			}

			return OutOfOrderRender.getAssetKey("get", type, bucket);
		});
	}

	// write a bundle to the file system
	if(options.shortcodes.toFile) {
		eleventyConfig.addShortcode(options.shortcodes.toFile, function(type, bucket) {
			if(!type || !(type in managers)) {
				throw new Error("Invalid bundle type: " + type);
			}

			return OutOfOrderRender.getAssetKey("file", type, bucket);
		});
	}

	if(options.shortcodes.get || options.shortcodes.toFile) {
		eleventyConfig.addTransform("@11ty/eleventy-bundle", function(content) {
			if((this.page.outputPath || "").endsWith(".html")) {
				let render = new OutOfOrderRender(content);
				for(let key in managers) {
					render.setAssetManager(key, managers[key]);
				}

				render.setOutputDirectory(eleventyConfig.dir.output);
				render.setBundleDirectory(options.toFileDirectory);
				render.setWriteToFileSystem(writeToFileSystem);

				return render.replaceAll(this.page.url);
			}
		});
	}
};
