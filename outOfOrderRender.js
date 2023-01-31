/* This class defers any `bundleGet` calls to a post-build transform step,
 * to allow `getPageCss` to be called before all of the `css` additions have been processed
 */
class OutOfOrderRender {
	static SPLIT_REGEX = /(\/\*__EleventyBundle:[^:]*:[^:]*:EleventyBundle__\*\/)/;
	static SEPARATOR = ":";

	constructor(content) {
		this.content = content;
		this.managers = {};
	}

	static getAssetKey(name, bucket) {
		if(Array.isArray(bucket)) {
			bucket = bucket.join(",")
		}
		return `/*__EleventyBundle:${name}:${bucket || "default"}:EleventyBundle__*/`
	}

	setAssetManager(name, assetManager) {
		this.managers[name] = assetManager;
	}

	normalizeMatch(match) {
		if(match.startsWith("/*__EleventyBundle:")) {
			let [prefix, name, bucket, suffix] = match.split(OutOfOrderRender.SEPARATOR);
			return { name, bucket };
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

	replaceAll(url) {
		let matches = this.findAll();
		return matches.map(match => {
			if(typeof match === "string") {
				return match;
			}
			let {name, bucket} = match;
			if(!this.managers[name]) {
				throw new Error(`No asset manager found for ${name}. Known keys: ${Object.keys(this.managers)}`);
			}
			return this.managers[name].getForPage(url, bucket.split(","));
		}).join("");
	}
}

module.exports = OutOfOrderRender;
