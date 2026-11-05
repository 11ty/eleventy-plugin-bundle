import { createDebug } from "obug";
import { BundleFileOutput } from "./BundleFileOutput.js";

const debug = createDebug("Eleventy:Bundle");
const DEBUG_LOG_TRUNCATION_SIZE = 100;

export class CodeManager {
	// code is placed in this bucket by default
	static DEFAULT_BUCKET_NAME = "default";

	// code is hoisted to this bucket when necessary
	static HOISTED_BUCKET_NAME = "default";

	static AUTO_OUTPUT_LOCATIONS = ["<title>", "</head>", "<body>", "</body>"];

	constructor(name) {
		this.name = name;
		this.trimOnAdd = true;
		// TODO unindent on add
		this.reset();
		this.transforms = [];
		this.isHoisting = true;
		this.fileExtension = name;
		this.toFileDirectory = undefined;
		this.bundleExportKey = "bundle";
		this.runsAfterHtmlTransformer = false;
		this.pluckedSelector = undefined;
		this.autoOutput = false;
		this.autoOutputLocation = "</head>";
		this.autoOutputAttributes = {};

		if(name === "js") {
			this.pruneEmptySelector = "script";
		} else if(name === "css") {
			this.pruneEmptySelector = `style,link[rel="stylesheet"]`;
		} else {
			this.pruneEmptySelector = undefined;
		}
	}

	setDelayed(isDelayed) {
		this.runsAfterHtmlTransformer = Boolean(isDelayed);
	}

	isDelayed() {
		return this.runsAfterHtmlTransformer;
	}

	// posthtml-match-selector friendly
	setPluckedSelector(selector) {
		this.pluckedSelector = selector;
		this.setDelayed(Boolean(selector));
	}

	getPluckedSelector() {
		return this.pluckedSelector;
	}

	setPruneEmptySelector(selector) {
		this.pruneEmptySelector = selector;
	}

	getPruneEmptySelector() {
		return this.pruneEmptySelector;
	}

	setFileExtension(ext) {
		this.fileExtension = ext;
	}

	setHoisting(enabled) {
		this.isHoisting = !!enabled;
	}

	setBundleDirectory(dir) {
		this.toFileDirectory = dir;
	}

	setBundleExportKey(key) {
		this.bundleExportKey = key;
	}

	getBundleExportKey() {
		return this.bundleExportKey;
	}

	// mode is `inline` (or `true`), `file`, or `false`
	setAutoOutput(mode, location = "</head>") {
		if(mode === true) {
			mode = "inline";
		}
		if(mode && mode !== "inline" && mode !== "file") {
			throw new Error(`Invalid autoOutput value for bundle ${this.name}: ${mode}. Expected "inline", "file", or false.`);
		}
		if(!CodeManager.AUTO_OUTPUT_LOCATIONS.includes(location)) {
			throw new Error(`Invalid autoOutputLocation for bundle ${this.name}: ${location}. Expected one of: ${CodeManager.AUTO_OUTPUT_LOCATIONS.join(", ")}`);
		}

		this.autoOutput = mode || false;
		this.autoOutputLocation = location;
	}

	// `true` renders a boolean attribute, `false`/`null`/`undefined` omits it
	setAutoOutputAttributes(attributes = {}) {
		if(!attributes || typeof attributes !== "object" || Array.isArray(attributes)) {
			throw new Error(`Invalid autoOutputAttributes for bundle ${this.name}: object expected.`);
		}
		this.autoOutputAttributes = attributes;
	}

	getAutoOutput() {
		if(!this.autoOutput) {
			return false;
		}
		return {
			mode: this.autoOutput,
			location: this.autoOutputLocation,
			attributes: this.autoOutputAttributes,
		};
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
		return [CodeManager.DEFAULT_BUCKET_NAME];
	}

	setTransforms(transforms) {
		if(!Array.isArray(transforms)) {
			throw new Error("Array expected to setTransforms");
		}

		this.transforms = transforms;
	}

	_initBucket(pageUrl, bucket) {
		if(!this.pages[pageUrl][bucket]) {
			this.pages[pageUrl][bucket] = new Set();
		}
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

		let codeContent = code.map(entry => {
			if(this.trimOnAdd) {
				return entry.trim();
			}
			return entry;
		});


		for(let b of buckets) {
			this._initBucket(pageUrl, b);

			for(let content of codeContent) {
				if(content) {
					if(!this.pages[pageUrl][b].has(content)) {
						debug("Adding code to bundle %o for %o (bucket: %o, size: %o): %o", this.name, pageUrl, b, content.length, content.length > DEBUG_LOG_TRUNCATION_SIZE ? content.slice(0, DEBUG_LOG_TRUNCATION_SIZE) + "…" : content);
						this.pages[pageUrl][b].add(content);
					}
				}
			}
		}
	}

	async runTransforms(str, pageData, buckets) {
		for (let callback of this.transforms) {
			str = await callback.call(
				{
					page: pageData,
					type: this.name,
					buckets: buckets
				},
				str
			);
		}

		return str;
	}

	getBucketsForPage(pageData) {
		let pageUrl = pageData.url;
		if(!this.pages[pageUrl]) {
			return [];
		}
		return Object.keys(this.pages[pageUrl]);
	}

	// Without Bundle Transforms
	getRawForPage(pageData, buckets = undefined) {
		let url = pageData.url;
		if(!this.pages[url]) {
			debug("No bundle code found for %o on %o, %O", this.name, url, this.pages);
			return new Set();
		}

		buckets = CodeManager.normalizeBuckets(buckets);

		let set = new Set();
		let size = 0;
		for(let b of buckets) {
			if(!this.pages[url][b]) {
				// Just continue, if you retrieve code from a bucket that doesn’t exist or has no code, it will return an empty set
				continue;
			}

			for(let entry of this.pages[url][b]) {
				size += entry.length;
				set.add(entry);
			}
		}

		debug("Retrieving %o for %o (buckets: %o, entries: %o, size: %o)", this.name, url, buckets, set.size, size);
		return set;
	}

	// With Bundle Transforms
	async getForPage(pageData, buckets = undefined) {
		let set = this.getRawForPage(pageData, buckets);
		let bundleContent = Array.from(set).join("\n");

		// returns promise
		return this.runTransforms(bundleContent, pageData, buckets);
	}

	async writeBundle(pageData, buckets, options = {}) {
		let url = pageData.url;
		if(!this.pages[url]) {
			debug("No bundle code found for %o on %o, %O", this.name, url, this.pages);
			return "";
		}

		let { output, write } = options;

		buckets = CodeManager.normalizeBuckets(buckets);

		// TODO the bundle output URL might be useful in the transforms for sourcemaps
		let content = await this.getForPage(pageData, buckets);
		let writer = new BundleFileOutput(output, this.toFileDirectory);
		writer.setFileExtension(this.fileExtension);
		return writer.writeBundle(content, this.name, write);
	}

	// Used when a bucket is output multiple times on a page and needs to be hoisted
	hoistBucket(pageData, bucketName) {
		let newTargetBucketName = CodeManager.HOISTED_BUCKET_NAME;
		if(!this.isHoisting || bucketName === newTargetBucketName) {
			return;
		}

		let url = pageData.url;
		if(!this.pages[url] || !this.pages[url][bucketName]) {
			debug("No bundle code found for %o on %o, %O", this.name, url, this.pages);
			return;
		}

		debug("Code in bucket (%o) is being hoisted to a new bucket (%o)", bucketName, newTargetBucketName);

		this._initBucket(url, newTargetBucketName);

		for(let codeEntry of this.pages[url][bucketName]) {
			this.pages[url][bucketName].delete(codeEntry);
			this.pages[url][newTargetBucketName].add(codeEntry);
		}

		// delete the bucket
		delete this.pages[url][bucketName];
	}
}
