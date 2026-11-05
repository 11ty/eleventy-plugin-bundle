import { createDebug } from "obug";

const debug = createDebug("Eleventy:Bundle");

// Per-process nonce so literal key text in page content is never treated as a placeholder; shared across duplicate copies of this package.
const NONCE_KEY = Symbol.for("@11ty/eleventy-plugin-bundle/nonce");
globalThis[NONCE_KEY] ??= crypto.randomUUID().replaceAll("-", "").slice(0, 16);
const PREFIX = `#BaBundle-${globalThis[NONCE_KEY]}`;

const DEFAULT_INJECT_HTML = {
	css: { inline: `<style>%s</style>`, file: `<link rel="stylesheet" href="%s">` },
	js: { inline: `<script type="module">%s</script>`, file: `<script type="module" src="%s"></script>` },
};

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

	// type is `get` (return string), `file` (bundle writes to file, returns file url), or `inject` (`size` mode markup)
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

	// Returns tag HTML with a `%s` placeholder for `inline` or `file` mode
	static getInjectTemplate(manager, mode) {
		let { html } = manager.getInject();
		let ext = manager.fileExtension;
		let markup;

		if(typeof html === "function") {
			markup = html({ mode, name: manager.name });
		} else {
			markup = DEFAULT_INJECT_HTML[ext]?.[mode] ?? (mode === "inline" ? "%s" : undefined);
			if(markup === undefined) {
				throw new Error(`inject: "${manager.getInject().mode}" requires a \`css\` or \`js\` file extension or an \`inject.html\` callback (bundle ${manager.name} uses ${ext}).`);
			}
		}

		if(typeof markup !== "string" || !markup.includes("%s")) {
			throw new Error(`inject.html for bundle ${manager.name} must return a string with a %s placeholder.`);
		}

		return markup;
	}

	static getInjectMarkup(manager) {
		let { mode } = manager.getInject();
		if(mode === "size") {
			// Validate both templates now, the choice between them happens in `replaceAll` once the content size is known
			OutOfOrderRender.getInjectTemplate(manager, "inline");
			OutOfOrderRender.getInjectTemplate(manager, "file");
			return OutOfOrderRender.getAssetKey("inject", manager.name);
		}

		let placeholder = OutOfOrderRender.getAssetKey(mode === "file" ? "file" : "get", manager.name);
		return OutOfOrderRender.getInjectTemplate(manager, mode).replaceAll("%s", () => placeholder);
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

	injectAll(pageData, stage) {
		let referenced = new Set();
		for(let match of this.findAll()) {
			if(typeof match !== "string" && match.bucket.split(",").includes("default")) {
				referenced.add(match.name);
			}
		}

		for(let name in this.managers) {
			let manager = this.managers[name];
			// Older CodeManager copies (duplicate package installs) don’t support inject
			let inject = typeof manager.getInject === "function" && manager.getInject();
			if(!inject || referenced.has(name)) {
				continue;
			}

			let isDelayed = typeof manager.isDelayed === "function" && manager.isDelayed();
			if(isDelayed !== (stage > 0) || manager.getRawForPage(pageData).size === 0) {
				continue;
			}

			let content = OutOfOrderRender.insertAt(this.content, inject.location, OutOfOrderRender.getInjectMarkup(manager));
			if(content === false) {
				debug("Skipping inject for %o on %o: no %o found.", name, pageData.inputPath, inject.location);
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

	async getInjectBySize(manager, pageData, bucket) {
		let content = await manager.getForPage(pageData, bucket);
		if(Buffer.byteLength(content) <= manager.getInject().maxInlineSize) {
			return OutOfOrderRender.getInjectTemplate(manager, "inline").replaceAll("%s", () => content);
		}

		let url = await manager.writeBundle(pageData, bucket, {
			output: this.outputDirectory,
			write: this.writeToFileSystem,
			content,
		});
		return OutOfOrderRender.getInjectTemplate(manager, "file").replaceAll("%s", () => url);
	}

	async replaceAll(pageData, stage = 0) {
		this.injectAll(pageData, stage);

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
			} else if(type === "inject") {
				return this.getInjectBySize(manager, pageData, bucket);
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
