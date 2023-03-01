const debug = require("debug")("Eleventy:Bundle");

/* This class defers any `bundleGet` calls to a post-build transform step,
 * to allow `getBundle` to be called before all of the `css` additions have been processed
 */
class OutOfOrderRender {
	static SPLIT_REGEX = /(\/\*__EleventyBundle:[^:]*:[^:]*:[^:]*:EleventyBundle__\*\/)/;
	static SEPARATOR = ":";

	constructor(content) {
		this.content = content;
		this.managers = {};
	}

	static getAssetKey(type, name, bucket) {
		if(Array.isArray(bucket)) {
			bucket = bucket.join(",");
		} else if(typeof bucket === "string") {
		} else {
			bucket = "";
		}
		return `/*__EleventyBundle:${type}:${name}:${bucket || "default"}:EleventyBundle__*/`
	}

	setAssetManager(name, assetManager) {
		this.managers[name] = assetManager;
	}

	setOutputDirectory(dir) {
		this.outputDirectory = dir;
	}

	setBundleDirectory(dir) {
		this.bundleDirectory = dir;
	}

	normalizeMatch(match) {
		if(match.startsWith("/*__EleventyBundle:")) {
			let [prefix, type, name, bucket, suffix] = match.split(OutOfOrderRender.SEPARATOR);
			return { type, name, bucket };
		}
		return match;
	}

	findAll() {
		let matches = this.content.split(OutOfOrderRender.SPLIT_REGEX);
		let ret = [];
		for(let match of matches) {
			ret.push(this.normalizeMatch(match));
		}
		return ret;
	}

	setWriteToFileSystem(isWrite) {
		this.writeToFileSystem = isWrite;
	}

	getAllBucketsForPage(pageData) {
		let availableBucketsForPage = new Set();
		for(let name in this.managers) {
			for(let bucket of this.managers[name].getBucketsForPage(pageData)) {
				availableBucketsForPage.add(`${name}::${bucket}`);
			}
		}
		return availableBucketsForPage;
	}

	async replaceAll(pageData) {
		let matches = this.findAll();
		let availableBucketsForPage = this.getAllBucketsForPage(pageData);
		let usedBucketsOnPage = new Set();

		let content = await Promise.all(matches.map(match => {
			if(typeof match === "string") {
				return match;
			}

			let {type, name, bucket} = match;
			if(!this.managers[name]) {
				throw new Error(`No asset manager found for ${name}. Known keys: ${Object.keys(this.managers)}`);
			}

			usedBucketsOnPage.add(`${name}::${bucket}`);

			if(type === "get") {
				// returns promise
				return this.managers[name].getForPage(pageData, bucket);
			} else if(type === "file") {
				// returns promise
				return this.managers[name].writeBundle(pageData, bucket, {
					output: this.outputDirectory,
					bundle: this.bundleDirectory,
					write: this.writeToFileSystem,
				});
			}
			return "";
		}));

		for(let bucketInfo of availableBucketsForPage) {
			if(!usedBucketsOnPage.has(bucketInfo)) {
				let [type, bucketName] = bucketInfo.split("::");
				debug(`WARNING! \`${pageData.inputPath}\` has unbundled \`${type}\` assets (in the '${bucketName}' bucket) that were not written to or used on the page. You might want to add a call to \`getBundle('${type}', '${bucketName}')\` to your content! Learn more: https://github.com/11ty/eleventy-plugin-bundle#asset-bucketing`)
			}
		}

		return content.join("");
	}
}

module.exports = OutOfOrderRender;
