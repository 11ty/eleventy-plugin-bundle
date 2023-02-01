const fs = require("fs");
const path = require("path");
// const fsp = fs.promises;
const { createHash } = require("crypto");

const hashCache = {};
const directoryExistsCache = {};

const debug = require("debug")("Eleventy:Bundle");

class BundleFileOutput {
	constructor(outputDirectory, bundleDirectory) {
		this.outputDirectory = outputDirectory;
		this.bundleDirectory = bundleDirectory;
		this.hashLength = 10;
	}

	getFilenameHash(content) {
		if(hashCache[content]) {
			return hashCache[content];
		}
	
		let hash = createHash("sha256");
		hash.update(content);
		let base64hash = hash.digest('base64').replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
		let filenameHash = base64hash.substring(0, this.hashLength);
		hashCache[content] = filenameHash;
		return filenameHash;
	}
	
	getFilename(filename, extension) {
		return filename + (extension && !extension.startsWith(".") ? `.${extension}` : "");
	}
	
	modifyPathToUrl(dir, filename) {
		return "/" + path.join(dir, filename).split(path.sep).join("/");
	}
	
	writeBundle(content, type, writeToFileSystem) {
		let dir = path.join(this.outputDirectory, this.bundleDirectory);
		let filenameHash = this.getFilenameHash(content);
		let filename = this.getFilename(filenameHash, type);

		if(writeToFileSystem) {
			if(!directoryExistsCache[dir]) {
				fs.mkdirSync(dir, { recursive: true });
				directoryExistsCache[dir] = true;
			}

			let fullPath = path.join(dir, filename);
			debug("Writing bundle %o", fullPath);
			fs.writeFileSync(fullPath, content);
		}
	
		return this.modifyPathToUrl(this.bundleDirectory, filename);
	}
}

class CodeManager {
	constructor(name) {
		this.name = name;
		this.trimOnAdd = true;
		this.reset();
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

	getForPage(pageUrl, buckets) {
		if(!this.pages[pageUrl]) {
			debug("No bundle code found for %o on %o, %O", this.name, pageUrl, this.pages);
			return "";
		}

		buckets = CodeManager.normalizeBuckets(buckets);

		debug("Retrieving %o for %o (buckets: %o)", this.name, pageUrl, buckets);
		let set = new Set();
		for(let b of buckets) {
			if(!this.pages[pageUrl][b]) {
				throw new Error("Could not find bucket " + b + " for url " + pageUrl);
			}

			for(let entry of this.pages[pageUrl][b]) {
				set.add(entry);
			}
		}

		return Array.from(set).join("\n");
	}

	writeBundle(pageUrl, buckets, options = {}) {
		if(!this.pages[pageUrl]) {
			debug("No bundle code found for %o on %o, %O", this.name, pageUrl, this.pages);
			return "";
		}

		let { output, bundle, write } = options;
	
		buckets = CodeManager.normalizeBuckets(buckets);
		
		let content = this.getForPage(pageUrl, buckets);

		let writer = new BundleFileOutput(output, bundle);
		return writer.writeBundle(content, this.name, write);
	}
}

module.exports = CodeManager;
