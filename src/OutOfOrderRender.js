import { randomBytes } from "node:crypto";
import { createDebug } from "obug";

const debug = createDebug("Eleventy:Bundle");

// Per-process nonce so literal key text in page content is never treated as a placeholder; shared across duplicate copies of this package.
const NONCE_KEY = Symbol.for("@11ty/eleventy-plugin-bundle/nonce");
globalThis[NONCE_KEY] ??= randomBytes(8).toString("hex");
const PREFIX = `#BaBundle-${globalThis[NONCE_KEY]}`;

/* This class defers any `bundleGet` calls to a post-build transform step,
 * to allow `getBundle` to be called before all of the `css` additions have been processed
 */
export class OutOfOrderRender {
	#regex = new RegExp(`(<!--${PREFIX}:[^:]*:[^:]*:[^:]*:BaBundle#-->|${PREFIX}:[^:]*:[^:]*:[^:]*:BaBundle#)`);

	static SEPARATOR = ":";
	static PREFIX = PREFIX;

	constructor(content) {
		this.content = content;
		this.managers = {};
	}

	// type if `get` (return string) or `file` (bundle writes to file, returns file url)
	static getAssetKey(type, name, bucket) {
		if(Array.isArray(bucket)) {
			bucket = bucket.join(",");
		} else if(typeof bucket === "string") {
		} else {
			bucket = "";
		}

		let key = `${PREFIX}:${type}:${name}:${bucket || "default"}:BaBundle#`;
		// `file` urls are used in attributes (e.g. `src`), where an HTML comment would break parsing
		return type === "file" ? key : `<!--${key}-->`;
	}

	static parseAssetKey(str) {
		if(str.startsWith(`${PREFIX}:`) || str.startsWith(`<!--${PREFIX}:`)) {
			let [prefix, type, name, bucket, suffix] = str.split(OutOfOrderRender.SEPARATOR);
			return { type, name, bucket };
		}
		return false;
	}

	static renderAttributes(attributes) {
		let str = "";
		for(let [name, value] of Object.entries(attributes)) {
			if(value === false || value === null || value === undefined) {
				continue;
			}
			str += value === true ? ` ${name}` : ` ${name}="${String(value).replaceAll("&", "&amp;").replaceAll(`"`, "&quot;")}"`;
		}
		return str;
	}

	static getAutoOutputMarkup(manager) {
		let { mode, attributes = {} } = manager.getAutoOutput();
		let ext = manager.fileExtension;
		if(mode === "file") {
			let url = OutOfOrderRender.getAssetKey("file", manager.name);
			// The bundle URL is set last so it can’t be overridden.
			if(ext === "css") {
				return `<link${OutOfOrderRender.renderAttributes({ rel: "stylesheet", ...attributes, href: url })}>`;
			}
			if(ext === "js") {
				return `<script${OutOfOrderRender.renderAttributes({ ...attributes, src: url })}></script>`;
			}
			throw new Error(`autoOutput: "file" requires a \`css\` or \`js\` file extension (bundle ${manager.name} uses ${ext}).`);
		}

		let key = OutOfOrderRender.getAssetKey("get", manager.name);
		if(ext === "css") {
			return `<style${OutOfOrderRender.renderAttributes(attributes)}>${key}</style>`;
		}
		if(ext === "js") {
			return `<script${OutOfOrderRender.renderAttributes(attributes)}>${key}</script>`;
		}
		return key;
	}

	static insertAt(content, location, markup) {
		let match;
		if(location === "<title>") {
			match = content.match(/<title\b[^>]*>[\s\S]*?<\/title\s*>/i);
		} else if(location === "<body>") {
			match = content.match(/<body\b[^>]*>/i);
		} else if(location === "</head>") {
			match = content.match(/<\/head\s*>/i);
		} else if(location === "</body>") {
			match = Array.from(content.matchAll(/<\/body\s*>/gi)).pop();
		}

		if(!match) {
			return false;
		}

		// Closing tags insert before, opening tags (and <title> elements) insert after.
		let index = location.startsWith("</") ? match.index : match.index + match[0].length;
		return content.slice(0, index) + markup + content.slice(index);
	}

	injectAutoOutput(pageData, stage) {
		let referenced = new Set();
		for(let match of this.findAll()) {
			if(typeof match !== "string" && match.bucket.split(",").includes("default")) {
				referenced.add(match.name);
			}
		}

		for(let name in this.managers) {
			let manager = this.managers[name];
			// Older CodeManager copies (duplicate package installs) don’t support autoOutput
			let autoOutput = typeof manager.getAutoOutput === "function" && manager.getAutoOutput();
			if(!autoOutput || referenced.has(name)) {
				continue;
			}

			let isDelayed = typeof manager.isDelayed === "function" && manager.isDelayed();
			if(isDelayed !== (stage > 0) || manager.getRawForPage(pageData).size === 0) {
				continue;
			}

			let content = OutOfOrderRender.insertAt(this.content, autoOutput.location, OutOfOrderRender.getAutoOutputMarkup(manager));
			if(content === false) {
				debug("Skipping autoOutput for %o on %o: no %o found.", name, pageData.inputPath, autoOutput.location);
				continue;
			}
			this.content = content;
		}
	}

	setAssetManager(name, assetManager) {
		this.managers[name] = assetManager;
	}

	setOutputDirectory(dir) {
		this.outputDirectory = dir;
	}

	normalizeMatch(match) {
		let ret = OutOfOrderRender.parseAssetKey(match);
		return ret || match;
	}

	findAll() {
		let regex = this.#regex;
		let matches = this.content.split(regex);
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

	getManager(name) {
		if(!this.managers[name]) {
			throw new Error(`No asset manager found for ${name}. Known names: ${Object.keys(this.managers)}`);
		}
		return this.managers[name];
	}

	async replaceAll(pageData, stage = 0) {
		this.injectAutoOutput(pageData, stage);

		let matches = this.findAll();
		let availableBucketsForPage = this.getAllBucketsForPage(pageData);
		let usedBucketsOnPage = new Set();
		let bucketsOutputStringCount = {};
		let bucketsFileCount = {};

		for(let match of matches) {
			if(typeof match === "string") {
				continue;
			}

			// type is `file` or `get`
			let {type, name, bucket} = match;
			let key = `${name}::${bucket}`;
			if(!usedBucketsOnPage.has(key)) {
				usedBucketsOnPage.add(key);
			}

			if(type === "get") {
				if(!bucketsOutputStringCount[key]) {
					bucketsOutputStringCount[key] = 0;
				}
				bucketsOutputStringCount[key]++;
			} else if(type === "file") {
				if(!bucketsFileCount[key]) {
					bucketsFileCount[key] = 0;
				}
				bucketsFileCount[key]++;
			}
		}

		// Hoist code in non-default buckets that are output multiple times
		// Only hoist if 2+ `get` OR 1+ `get` and 1+ `file`
		for(let bucketInfo in bucketsOutputStringCount) {
			let stringOutputCount = bucketsOutputStringCount[bucketInfo];
			if(stringOutputCount > 1 || stringOutputCount === 1 && bucketsFileCount[bucketInfo] > 0) {
				let [name, bucketName] = bucketInfo.split("::");
				this.getManager(name).hoistBucket(pageData, bucketName);
			}
		}

		let content = await Promise.all(matches.map(match => {
			if(typeof match === "string") {
				return match;
			}

			let {type, name, bucket} = match;
			let manager = this.getManager(name);
			// Quit early if in stage 0, run delayed replacements if in stage 1+
			if(typeof manager.isDelayed === "function" && manager.isDelayed() && stage === 0) {
				return OutOfOrderRender.getAssetKey(type, name, bucket);
			}

			if(type === "get") {
				// returns promise
				return manager.getForPage(pageData, bucket);
			} else if(type === "file") {
				// returns promise
				return manager.writeBundle(pageData, bucket, {
					output: this.outputDirectory,
					write: this.writeToFileSystem,
				});
			}

			return "";
		}));

		for(let bucketInfo of availableBucketsForPage) {
			if(!usedBucketsOnPage.has(bucketInfo)) {
				let [name, bucketName] = bucketInfo.split("::");
				debug(`WARNING! \`${pageData.inputPath}\` has unbundled \`${name}\` assets (in the '${bucketName}' bucket) that were not written to or used on the page. You might want to add a call to \`getBundle('${name}', '${bucketName}')\` to your content! Learn more: https://github.com/11ty/eleventy-plugin-bundle#asset-bucketing`);
			}
		}

		return content.join("");
	}
}
