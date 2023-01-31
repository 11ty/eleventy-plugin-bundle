const pkg = require("./package.json");
const CodeManager = require("./codeManager.js");
const OutOfOrderRender = require("./outOfOrderRender.js");
const debug = require("debug")("Eleventy:Bundle");

function normalizeOptions(options) {
	let shortcodes = Object.assign({
		get: {
			// use `getCss` instead of `getPageCss`
			// css: "getCss",
		},
		add: {
			// use `addCss` instead of `css`
			// css: "addCss"
		}
	}, options.shortcodes);

	options = Object.assign({
		// Plugin defaults
		bundles: ["css", "js", "svg"],
	}, options);

	options.shortcodes = shortcodes;

	return options;
}

module.exports = function(eleventyConfig, options = {}) {
	try {
		eleventyConfig.versionCheck(pkg["11ty"].compatibility);
	} catch(e) {
		console.log( `WARN: Eleventy Plugin (${pkg.name}) Compatibility: ${e.message}` );
	}

	options = normalizeOptions(options);

	let managers = {};
	let isTransformNeeded = false;

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

			// e.g. `getPageCss` shortcode to get code in current page bundle
			let getShortcodeName;
			if(options.shortcodes.get && options.shortcodes.get[name] !== undefined) {
				getShortcodeName = options.shortcodes.get[name];
			} else {
				getShortcodeName = "getPage" + name.slice(0, 1).toUpperCase() + name.slice(1);
			}
			if(getShortcodeName) {
				isTransformNeeded = true;

				// bucket can be an array
				eleventyConfig.addShortcode(getShortcodeName, function getContent(bucket) {
					return OutOfOrderRender.getAssetKey(name, bucket);
				});
			}
		});
	}

	eleventyConfig.on("eleventy.before", async () => {
		debug("Resetting");
		for(let key in managers) {
			managers[key].reset();
		}
	});

	if(isTransformNeeded) {
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
};