const fs = require("fs");
const path = require("path");
// const fsp = fs.promises;
const { createHash } = require("crypto");

const CodeManager = require("./codeManager.js");
const OutOfOrderRender = require("./outOfOrderRender.js");
const debug = require("debug")("Eleventy:Bundle");

const hashCache = {};
const directoryExistsCache = {};

function getFilenameHash(content, hashLength = 10) {
	if(hashCache[content]) {
		return hashCache[content];
	}

	let hash = createHash("sha256");
	hash.update(content);
	let base64hash = hash.digest('base64').replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
	let filenameHash = base64hash.substring(0, hashLength);
	hashCache[content] = filenameHash;
	return filenameHash;
}

function getFilename(filename, extension) {
	return filename + (extension && !extension.startsWith(".") ? `.${extension}` : "");
}

function modifyPathToUrl(dir, filename) {
	return "/" + path.join(dir, filename).split(path.sep).join("/");
}


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
		debug("Resetting");
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

			return OutOfOrderRender.getAssetKey(type, bucket);
		});

		eleventyConfig.addTransform("@11ty/eleventy-bundle", function(content) {
			if(this.page.outputPath.endsWith(".html")) {
				let render = new OutOfOrderRender(content);
				for(let key in managers) {
					render.setAssetManager(key, managers[key]);
				}
	
				return render.replaceAll(this.page.url);
			}
		});
	}

	// write a bundle to the file system
	if(options.shortcodes.toFile) {
		eleventyConfig.addShortcode(options.shortcodes.toFile, function(type, bucket = "default") {
			if(!type || !(type in managers)) {
				throw new Error("Invalid bundle type: " + type);
			}

			let content = managers[type].getForPage(this.page.url, bucket.split(","));
			let filenameHash = getFilenameHash(content);
			let filename = getFilename(filenameHash, type);

			let dir = path.join(eleventyConfig.dir.output, options.toFileDirectory);
			
			if(writeToFileSystem) {
				if(!directoryExistsCache[dir]) {
					fs.mkdirSync(dir, { recursive: true });
					directoryExistsCache[dir] = true;
				}

				fs.writeFileSync(path.join(dir, filename), content);
			}

			return modifyPathToUrl(options.toFileDirectory, filename);
		})
	}
};