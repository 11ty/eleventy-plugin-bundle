const debug = require("debug")("Eleventy:Bundle");

class CodeManager {
	constructor(name) {
		this.name = name;
		this.trimOnAdd = true;
		this.reset();
	}

	reset() {
		this.pages = {};
	}

	addToPage(pageUrl, code = [], bucket = "default") {
		if(!Array.isArray(code) && code) {
			code = [code];
		}
		if(code.length === 0) {
			return;
		}

		if(!this.pages[pageUrl]) {
			this.pages[pageUrl] = {};
		}
		if(!this.pages[pageUrl][bucket]) {
			this.pages[pageUrl][bucket] = new Set();
		}

		let content = code.map(entry => {
			if(this.trimOnAdd) {
				return entry.trim();
			}
			return entry;
		}).join("\n");

		debug("Adding %o to bundle %o for %o (bucket: %o)", content, this.name, pageUrl, bucket);
		this.pages[pageUrl][bucket].add(content);
	}

	getForPage(pageUrl, bucket = "default") {
		if(this.pages[pageUrl]) {
			debug("Retrieving %o for %o (bucket: %o)", this.name, pageUrl, bucket);
			let set = new Set();
			if(Array.isArray(bucket)) {
				for(let b of bucket) {
					for(let entry of this.pages[pageUrl][b]) {
						set.add(entry);
					}
				}
			}
			return Array.from(set).join("\n");
		}

		debug("No bundle code found for %o on %o, %O", this.name, pageUrl, this.pages);
		return "";
	}
}

module.exports = CodeManager;
