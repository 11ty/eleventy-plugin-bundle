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

	async replaceAll(pageData) {
		let matches = this.findAll();

		let content = await Promise.all(matches.map(match => {
			if(typeof match === "string") {
				return match;
			}

			let {type, name, bucket} = match;
			if(!this.managers[name]) {
				throw new Error(`No asset manager found for ${name}. Known keys: ${Object.keys(this.managers)}`);
			}
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

		return content.join("");
	}
}

module.exports = OutOfOrderRender;
