const BundleFileOutput = require("./BundleFileOutput");
const debug = require("debug")("Eleventy:Bundle");

class CodeManager {
	constructor(name) {
		this.name = name;
		this.trimOnAdd = true;
		this.reset();
		this.transforms = [];
	}

	reset() {
		this.pages = {};
	}

	static normalizeBuckets(bucket) {
		if(Array.isArray(bucket)) {
			return bucket;
		} else if(typeof bucket === "string") {
			return bucket.split(",");
		}
		return ["default"];
	}

	setTransforms(transforms) {
		if(!Array.isArray(transforms)) {
			throw new Error("Array expected to setTransforms");
		}

		this.transforms = transforms;
	}

	addToPage(pageUrl, code = [], bucket) {
		if(!Array.isArray(code) && code) {
			code = [code];
		}
		if(code.length === 0) {
			return;
		}

		if(!this.pages[pageUrl]) {
			this.pages[pageUrl] = {};
		}

		let buckets = CodeManager.normalizeBuckets(bucket);
		for(let b of buckets) {
			if(!this.pages[pageUrl][b]) {
				this.pages[pageUrl][b] = new Set();
			}

			let content = code.map(entry => {
				if(this.trimOnAdd) {
					return entry.trim();
				}
				return entry;
			}).join("\n");

			debug("Adding %o to bundle %o for %o (bucket: %o)", content, this.name, pageUrl, b);
			this.pages[pageUrl][b].add(content);
		}
	}

	async runTransforms(str, pageData) {
		for (let callback of this.transforms) {
			str = await callback.call(
				{
					page: pageData
				},
				str
			);
		}

		return str;
	}

	async getForPage(pageData, buckets) {
		let url = pageData.url;
		if(!this.pages[url]) {
			debug("No bundle code found for %o on %o, %O", this.name, url, this.pages);
			return "";
		}

		buckets = CodeManager.normalizeBuckets(buckets);

		debug("Retrieving %o for %o (buckets: %o)", this.name, url, buckets);
		let set = new Set();
		for(let b of buckets) {
			if(!this.pages[url][b]) {
				// Just continue, if you retrieve code from a bucket that doesn’t exist or has no code, it will return an empty set
				continue;
			}

			for(let entry of this.pages[url][b]) {
				set.add(entry);
			}
		}

		let bundleContent = Array.from(set).join("\n");

		// returns promise
		return this.runTransforms(bundleContent, pageData);
	}

	async writeBundle(pageData, buckets, options = {}) {
		let url = pageData.url;
		if(!this.pages[url]) {
			debug("No bundle code found for %o on %o, %O", this.name, url, this.pages);
			return "";
		}

		let { output, bundle, write } = options;

		buckets = CodeManager.normalizeBuckets(buckets);

		// TODO the bundle output URL might be useful in the transforms for sourcemaps
		let content = await this.getForPage(pageData, buckets);

		let writer = new BundleFileOutput(output, bundle);
		return writer.writeBundle(content, this.name, write);
	}
}

module.exports = CodeManager;
