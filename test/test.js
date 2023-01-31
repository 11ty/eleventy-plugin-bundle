const test = require("ava");
const Eleventy = require("@11ty/eleventy");

test("CSS (Nunjucks)", async t => {
	// automatically uses eleventy.config.js in root
	let elev = new Eleventy("test/stubs/nunjucks/");
	let results = await elev.toJSON();
	t.deepEqual(results[0].content, `<style>* { color: blue; }
* { color: red; }
* { color: orange; }</style>
<style>* { color: blue; }
* { color: red; }
* { color: orange; }</style>
<style>* { color: blue; }
* { color: red; }
* { color: orange; }</style>`)
});

test("CSS (Liquid)", async t => {
	// automatically uses eleventy.config.js in root
	let elev = new Eleventy("test/stubs/liquid/");
	let results = await elev.toJSON();
	t.deepEqual(results[0].content, `<style>* { color: blue; }
* { color: red; }
* { color: orange; }</style>
<style>* { color: blue; }
* { color: red; }
* { color: orange; }</style>
<style>* { color: blue; }
* { color: red; }
* { color: orange; }</style>`)
});

test("CSS (Markdown)", async t => {
	// automatically uses eleventy.config.js in root
	let elev = new Eleventy("test/stubs/markdown/");
	let results = await elev.toJSON();
	t.deepEqual(results[0].content, `<style>* { color: blue; }
* { color: red; }
* { color: orange; }</style>
<style>* { color: blue; }
* { color: red; }
* { color: orange; }</style>
<style>* { color: blue; }
* { color: red; }
* { color: orange; }</style>`)
});

test("CSS (Handlebars)", async t => {
	// automatically uses eleventy.config.js in root
	let elev = new Eleventy("test/stubs/handlebars/");
	let results = await elev.toJSON();
	t.deepEqual(results[0].content, `<style>* { color: blue; }
* { color: red; }
* { color: orange; }</style>

<style>* { color: blue; }
* { color: red; }
* { color: orange; }</style>


<style>* { color: blue; }
* { color: red; }
* { color: orange; }</style>
`)
});

test("SVG", async t => {
	// automatically uses eleventy.config.js in root
	let elev = new Eleventy("test/stubs/nunjucks-svg/");
	let results = await elev.toJSON();
	t.deepEqual(results[0].content, `<svg width="0" height="0" aria-hidden="true" style="position: absolute;">
	<defs><g id="icon-close-legacy"><path d="M8,15 C4.13400675,15 1,11.8659932 1,8 C1,4.13400675 4.13400675,1 8,1 C11.8659932,1 15,4.13400675 15,8 C15,11.8659932 11.8659932,15 8,15 Z M10.44352,10.7233105 L10.4528296,10.7326201 L10.7326201,10.4528296 C11.0310632,10.1543865 11.0314986,9.66985171 10.7335912,9.37194437 L9.36507937,8.0034325 L10.7360526,6.63245928 C11.0344957,6.33401613 11.0349311,5.84948135 10.7370237,5.55157401 L10.448426,5.26297627 C10.1505186,4.96506892 9.66598387,4.96550426 9.36754072,5.26394741 L8.00589385,6.62559428 L6.63738198,5.25708241 C6.33947464,4.95917507 5.85493986,4.95961041 5.55649671,5.25805356 L5.26737991,5.54717036 C4.96893676,5.84561351 4.96850142,6.33014829 5.26640876,6.62805563 L6.62561103,7.9872579 L5.25463781,9.35823112 C4.95619466,9.65667427 4.95575932,10.141209 5.25366666,10.4391164 L5.5422644,10.7277141 C5.84017175,11.0256215 6.32470652,11.0251861 6.62314967,10.726743 L7.99412289,9.35576976 L9.36263476,10.7242816 C9.66054211,11.022189 10.1450769,11.0217536 10.44352,10.7233105 Z" /></g></defs>
</svg>`)
});

test("JS", async t => {
	// automatically uses eleventy.config.js in root
	let elev = new Eleventy("test/stubs/liquid-js/");
	let results = await elev.toJSON();
	t.deepEqual(results[0].content, `<script>alert(1);
alert(2);
alert(3);</script>
<script>alert(1);
alert(2);
alert(3);</script>
<script>alert(1);
alert(2);
alert(3);</script>`)
});

test("CSS, two buckets", async t => {
	// automatically uses eleventy.config.js in root
	let elev = new Eleventy("test/stubs/liquid-buckets/");
	let results = await elev.toJSON();
	t.deepEqual(results[0].content, `<style>* { color: blue; }
* { color: orange; }</style>
<style>* { color: blue; }
* { color: red; }</style>`)
});

test("CSS, two buckets, explicit `default`", async t => {
	// automatically uses eleventy.config.js in root
	let elev = new Eleventy("test/stubs/liquid-buckets-default/");
	let results = await elev.toJSON();
	t.deepEqual(results[0].content, `<style>* { color: blue; }
* { color: orange; }</style>
<style>* { color: blue; }
* { color: red; }</style>`)
});

test("CSS, get two buckets at once", async t => {
	// automatically uses eleventy.config.js in root
	let elev = new Eleventy("test/stubs/buckets-get-multiple/");
	let results = await elev.toJSON();
	t.deepEqual(results[0].content, `<style>* { color: blue; }
* { color: orange; }
* { color: red; }</style>`); // note that blue is only listed once, we de-dupe entries across buckets
});

test("CSS, get two buckets at once, reverse order", async t => {
	// automatically uses eleventy.config.js in root
	let elev = new Eleventy("test/stubs/buckets-ordering/");
	let results = await elev.toJSON();
	t.deepEqual(results[0].content, `<style>* { color: blue; }
* { color: red; }
* { color: orange; }</style>`); // note that blue is only listed once, we de-dupe entries across buckets
});

test("CSS, get two buckets at once (comma separated list)", async t => {
	// automatically uses eleventy.config.js in root
	let elev = new Eleventy("test/stubs/buckets-get-multiple-comma-sep/");
	let results = await elev.toJSON();
	t.deepEqual(results[0].content, `<style>* { color: blue; }
* { color: orange; }
* { color: red; }</style>`); // note that blue is only listed once, we de-dupe entries across buckets
});

