import test from "node:test";
import assert from "node:assert/strict";
import fs from "fs";
import Eleventy, { RenderPlugin, InputPathToUrlTransformPlugin } from "@11ty/eleventy";
import * as sass from "sass";
import bundlePlugin, { Bundle } from "../src/BundlePlugin.js";
import { OutOfOrderRender } from "../src/OutOfOrderRender.js";
import { CodeManager } from "../src/CodeManager.js";

// Use this when core v4.0.0-alpha.9 is released
// process.env.ELEVENTY_SKIP_BUNDLE_PLUGIN = true;

// Special testing notes regarding overriding the bundled-with-core Bundle Plugin and using the Bundle Plugin from this repo:
// Options: use a `configPath` with `force: true`
// Use `eleventy.beforeConfig` event with `config` callback (read more below)

// Configuration order of execution:
// 1. `config` callback
// 2. `defaultConfig.js` file from core repo (adds bundle plugin included with core)
// 3. `configPath` file

// eleventy.beforeConfig event approach:
// If you want to use a `config` callback to overwrite the built-in Bundle Plugin, use this pattern instead:
// config: function($config) {
// 	$config.on("eleventy.beforeConfig", () => {
// 		$config.addPlugin(bundlePlugin, {
// 			immediate: true,
// 			force: true,
// 		});
// 	});
// }

function normalize(str) {
  if(typeof str !== "string") {
    throw new Error("Could not find content: " + str);
  }
  return str.trim().replace(/\r\n/g, "\n");
}

test("CSS (Nunjucks)", async () => {
  let elev = new Eleventy("test/stubs/nunjucks/", "_site", {
    config: $config => {
      // see testing note at the top of this file
      $config.on("eleventy.beforeConfig", () => {
        // runs after bundler included with core
        $config.addPlugin(bundlePlugin, { force: true, immediate: true });
      });
    }
  });

  let results = await elev.toJSON();
  assert.deepEqual(normalize(results[0].content), `<style>* { color: blue; }
* { color: red; }
* { color: orange; }</style>
<style>* { color: blue; }
* { color: red; }
* { color: orange; }</style>
<style>* { color: blue; }
* { color: red; }
* { color: orange; }</style>`)
});

test("CSS (Liquid)", async () => {
  let elev = new Eleventy("test/stubs/liquid/", "_site", {
    config: $config => {
      // see testing note at the top of this file
      $config.on("eleventy.beforeConfig", () => {
        $config.addPlugin(bundlePlugin, { force: true, immediate: true });
      });
    }
  });
  let results = await elev.toJSON();
  assert.deepEqual(normalize(results[0].content), `<style>* { color: blue; }
* { color: red; }
* { color: orange; }</style>
<style>* { color: blue; }
* { color: red; }
* { color: orange; }</style>
<style>* { color: blue; }
* { color: red; }
* { color: orange; }</style>`)
});

test("CSS (Markdown)", async () => {
  let elev = new Eleventy("test/stubs/markdown/", "_site", {
    config: $config => {
      // see testing note at the top of this file
      $config.on("eleventy.beforeConfig", () => {
        $config.addPlugin(bundlePlugin, { force: true, immediate: true });
      });
    }
  });
  let results = await elev.toJSON();
  assert.deepEqual(normalize(results[0].content), `<style>* { color: blue; }
* { color: red; }
* { color: orange; }</style>
<style>* { color: blue; }
* { color: red; }
* { color: orange; }</style>
<style>* { color: blue; }
* { color: red; }
* { color: orange; }</style>`)
});

test("SVG", async () => {
  let elev = new Eleventy("test/stubs/nunjucks-svg/", "_site", {
    config: $config => {
      // see testing note at the top of this file
      $config.on("eleventy.beforeConfig", () => {
        $config.addPlugin(bundlePlugin, { force: true, immediate: true });
      });
    }
  });
  let results = await elev.toJSON();
  assert.deepEqual(normalize(results[0].content), `<svg width="0" height="0" aria-hidden="true" style="position: absolute;">
<defs><g id="icon-close-legacy"><path d="M8,15 C4.13400675,15 1,11.8659932 1,8 C1,4.13400675 4.13400675,1 8,1 C11.8659932,1 15,4.13400675 15,8 C15,11.8659932 11.8659932,15 8,15 Z M10.44352,10.7233105 L10.4528296,10.7326201 L10.7326201,10.4528296 C11.0310632,10.1543865 11.0314986,9.66985171 10.7335912,9.37194437 L9.36507937,8.0034325 L10.7360526,6.63245928 C11.0344957,6.33401613 11.0349311,5.84948135 10.7370237,5.55157401 L10.448426,5.26297627 C10.1505186,4.96506892 9.66598387,4.96550426 9.36754072,5.26394741 L8.00589385,6.62559428 L6.63738198,5.25708241 C6.33947464,4.95917507 5.85493986,4.95961041 5.55649671,5.25805356 L5.26737991,5.54717036 C4.96893676,5.84561351 4.96850142,6.33014829 5.26640876,6.62805563 L6.62561103,7.9872579 L5.25463781,9.35823112 C4.95619466,9.65667427 4.95575932,10.141209 5.25366666,10.4391164 L5.5422644,10.7277141 C5.84017175,11.0256215 6.32470652,11.0251861 6.62314967,10.726743 L7.99412289,9.35576976 L9.36263476,10.7242816 C9.66054211,11.022189 10.1450769,11.0217536 10.44352,10.7233105 Z"></path></g></defs>
</svg>`)
});

test("JS", async () => {
  let elev = new Eleventy("test/stubs/liquid-js/", "_site", {
    config: $config => {
      // see testing note at the top of this file
      $config.on("eleventy.beforeConfig", () => {
        $config.addPlugin(bundlePlugin, { force: true, immediate: true });
      });
    }
  });
  let results = await elev.toJSON();
  assert.deepEqual(normalize(results[0].content), `<script>alert(1);
alert(2);
alert(3);</script>
<script>alert(1);
alert(2);
alert(3);</script>
<script>alert(1);
alert(2);
alert(3);</script>`)
});

test("CSS, two buckets", async () => {
  let elev = new Eleventy("test/stubs/liquid-buckets/", "_site", {
    config: $config => {
      // see testing note at the top of this file
      $config.on("eleventy.beforeConfig", () => {
        $config.addPlugin(bundlePlugin, { force: true, immediate: true });
      });
    }
  });
  let results = await elev.toJSON();
  assert.deepEqual(normalize(results[0].content), `<style>* { color: blue; }
* { color: orange; }</style>
<style>* { color: blue; }
* { color: red; }</style>`)
});

test("CSS, two buckets, explicit `default`", async () => {
  let elev = new Eleventy("test/stubs/liquid-buckets-default/", "_site", {
    config: $config => {
      // see testing note at the top of this file
      $config.on("eleventy.beforeConfig", () => {
        $config.addPlugin(bundlePlugin, { force: true, immediate: true });
      });
    }
  });
  let results = await elev.toJSON();

  assert.deepEqual(normalize(results[0].content), `<style>* { color: blue; }
* { color: orange; }</style>
<style>* { color: blue; }
* { color: red; }</style>`)
});

test("CSS, get two buckets at once", async () => {
  let elev = new Eleventy("test/stubs/buckets-get-multiple/", "_site", {
    config: $config => {
      // see testing note at the top of this file
      $config.on("eleventy.beforeConfig", () => {
        $config.addPlugin(bundlePlugin, { force: true, immediate: true });
      });
    }
  });
  let results = await elev.toJSON();
  assert.deepEqual(normalize(results[0].content), `<style>* { color: blue; }
* { color: orange; }
* { color: red; }</style>`); // note that blue is only listed once, we de-dupe entries across buckets
});

test("CSS, get two buckets at once, reverse order", async () => {
  let elev = new Eleventy("test/stubs/buckets-ordering/", "_site", {
    config: $config => {
      // see testing note at the top of this file
      $config.on("eleventy.beforeConfig", () => {
        $config.addPlugin(bundlePlugin, { force: true, immediate: true });
      });
    }
  });
  let results = await elev.toJSON();
  assert.deepEqual(normalize(results[0].content), `<style>* { color: blue; }
* { color: red; }
* { color: orange; }</style>`); // note that blue is only listed once, we de-dupe entries across buckets
});

test("CSS, get two buckets at once (comma separated list)", async () => {
  let elev = new Eleventy("test/stubs/buckets-get-multiple-comma-sep/", "_site", {
    config: $config => {
      // see testing note at the top of this file
      $config.on("eleventy.beforeConfig", () => {
        $config.addPlugin(bundlePlugin, { force: true, immediate: true });
      });
    }
  });
  let results = await elev.toJSON();
  assert.deepEqual(normalize(results[0].content), `<style>* { color: blue; }
* { color: orange; }
* { color: red; }</style>`); // note that blue is only listed once, we de-dupe entries across buckets
});

test("toFile Filter (no writes)", async () => {
  let elev = new Eleventy("test/stubs/to-file/", "_site", {
    config: $config => {
      // see testing note at the top of this file
      $config.on("eleventy.beforeConfig", () => {
        $config.addPlugin(bundlePlugin, { force: true, immediate: true });
      });
    }
  });
  let results = await elev.toJSON();
  assert.deepEqual(normalize(results[0].content), `<style>* { color: blue; }
* { color: red; }
* { color: orange; }/* lololol */</style>
<link rel="stylesheet" href="/bundle/AZBTWWtF0t.css">`); // note that blue is only listed once, we de-dupe entries across buckets

  // does *not* write to the file system because of `toJSON` usage above.
  assert.ok(!fs.existsSync("./_site/bundle/AZBTWWtF0t.css"));
});

test("toFile Filter (write files)", async () => {
  let elev = new Eleventy("test/stubs/to-file-write/", undefined, {
    config: function($config) {
      // see testing note at the top of this file
      $config.on("eleventy.beforeConfig", () => {
        $config.addPlugin(bundlePlugin, { force: true, immediate: true });
      });

      $config.setQuietMode(true);
    }
  });

  await elev.write();

  assert.equal(normalize(fs.readFileSync("_site/to-file-write/index.html", "utf8")), `<style>* { color: blue; }
* { color: red; }
* { color: orange; }/* lololol2 */</style>
<link rel="stylesheet" href="/bundle/Es4dSlOfrv.css">`); // note that blue is only listed once, we de-dupe entries across buckets

  // does write to the file system because of `write` usage above.
  assert.equal(normalize(fs.readFileSync("_site/bundle/Es4dSlOfrv.css", "utf8")), `* { color: blue; }
* { color: red; }
* { color: orange; }/* lololol2 */`);

  fs.unlinkSync("_site/to-file-write/index.html");
  fs.unlinkSync("_site/bundle/Es4dSlOfrv.css");

  assert.equal(fs.existsSync("_site/to-file-write/index.html"), false);
  assert.equal(fs.existsSync("_site/bundle/Es4dSlOfrv.css"), false);
});

test("toFile Filter (write files, deep output dir, issue #4)", async () => {
  let elev = new Eleventy("test/stubs/to-file-write/", "test/stubs/to-file-write/_site", {
    config: function($config) {
      // see testing note at the top of this file
      $config.on("eleventy.beforeConfig", () => {
        $config.addPlugin(bundlePlugin, { force: true, immediate: true });
      });

      $config.setQuietMode(true);
    }
  });

  await elev.write();

  assert.equal(normalize(fs.readFileSync("test/stubs/to-file-write/_site/to-file-write/index.html", "utf8")), `<style>* { color: blue; }
* { color: red; }
* { color: orange; }/* lololol2 */</style>
<link rel="stylesheet" href="/bundle/Es4dSlOfrv.css">`); // note that blue is only listed once, we de-dupe entries across buckets

  // does write to the file system because of `write` usage above.
  assert.equal(normalize(fs.readFileSync("test/stubs/to-file-write/_site/bundle/Es4dSlOfrv.css", "utf8")), `* { color: blue; }
* { color: red; }
* { color: orange; }/* lololol2 */`);

  fs.unlinkSync("test/stubs/to-file-write/_site/to-file-write/index.html");
  fs.unlinkSync("test/stubs/to-file-write/_site/bundle/Es4dSlOfrv.css");

  assert.equal(fs.existsSync("test/stubs/to-file-write/_site/to-file-write/index.html"), false);
  assert.equal(fs.existsSync("test/stubs/to-file-write/_site/bundle/Es4dSlOfrv.css"), false);
});

test("toFile Filter (write files, out of order)", async () => {
  let elev = new Eleventy("test/stubs/to-file-ordering/", undefined, {
    config: function($config) {
      // see testing note at the top of this file
      $config.on("eleventy.beforeConfig", () => {
        $config.addPlugin(bundlePlugin, { force: true, immediate: true });
      });
      $config.setQuietMode(true);
    }
  });

  await elev.write();

  assert.equal(normalize(fs.readFileSync("./_site/to-file-ordering/index.html", "utf8")), `<style>* { color: blue; }
* { color: rebeccapurple; }</style>
<link rel="stylesheet" href="/bundle/6_wo_c5eqX.css">`); // note that blue is only listed once, we de-dupe entries across buckets

  // does write to the file system because of `write` usage above.
  assert.equal(normalize(fs.readFileSync("./_site/bundle/6_wo_c5eqX.css", "utf8")), `* { color: blue; }
* { color: rebeccapurple; }`);

  fs.unlinkSync("./_site/to-file-ordering/index.html");
  fs.unlinkSync("./_site/bundle/6_wo_c5eqX.css");

  assert.equal(fs.existsSync("./_site/to-file-ordering/index.html"), false);
  assert.equal(fs.existsSync("./_site/bundle/6_wo_c5eqX.css"), false);
});

test("Bundle in Layout file", async () => {
  let elev = new Eleventy("test/stubs/bundle-in-layout/", "_site", {
    config: $config => {
      // see testing note at the top of this file
      $config.on("eleventy.beforeConfig", () => {
        $config.addPlugin(bundlePlugin, { force: true, immediate: true });
      });
    }
  });
  let results = await elev.toJSON();
  assert.deepEqual(normalize(results[0].content), `<!doctype html><html><head><link href="https://v1.opengraph.11ty.dev" rel="preconnect" crossorigin></head></html>`);
});

// Tested locally with core v4.0.0-alpha.9, uncomment after it ships
test.skip("Bundle with render plugin renderTemplate liquid", async () => {
  let elev = new Eleventy("test/stubs-virtual/", undefined, {
    config: function($config) {
      // see testing note at the top of this file
      $config.on("eleventy.beforeConfig", () => {
        $config.addPlugin(bundlePlugin, { force: true, immediate: true });
      });

      $config.addPlugin(RenderPlugin);

      $config.addExtension("scss", {
        outputFileExtension: "css",

        compile: async function(inputContent) {
          let result = sass.compileString(inputContent);

          // This is the render function, `data` is the full data cascade
          return async (data) => {
            return result.css;
          };
        }
      });

      $config.addTemplate("index.liquid", `{% css %}{% renderTemplate "scss" %}h1 { .test { color: red; } }{% endrenderTemplate %}{% endcss %}
<!-- inbetween -->
<style>{% getBundle "css" %}</style>`);
    }
  });

  let results = await elev.toJSON();
  assert.deepEqual(normalize(results[0].content), `<!-- inbetween -->
<style>h1 .test {
  color: red;
}</style>`);
});

// Tested locally with core v4.0.0-alpha.9, uncomment after it ships
test.skip("Bundle with render plugin renderTemplate njk", async () => {
  let elev = new Eleventy("test/stubs-virtual/", undefined, {
    config: function($config) {
      // see testing note at the top of this file
      $config.on("eleventy.beforeConfig", () => {
        $config.addPlugin(bundlePlugin, { force: true, immediate: true });
      });

      $config.addPlugin(RenderPlugin);

      $config.addExtension("scss", {
        outputFileExtension: "css",

        compile: async function(inputContent) {
          let result = sass.compileString(inputContent);

          // This is the render function, `data` is the full data cascade
          return async (data) => {
            return result.css;
          };
        }
      });

      $config.addTemplate("index.njk", `{% css %}/* hi */{% renderTemplate "scss" %}h1 { .test { color: red; } }{% endrenderTemplate %}{% endcss %}
<!-- inbetween --><style>/* bundle */{% getBundle "css" %}</style>`)
    }
  });

  let results = await elev.toJSON();
  assert.deepEqual(normalize(results[0].content), `<!-- inbetween --><style>/* bundle *//* hi */h1 .test {
  color: red;
}</style>`);
});

// Tested locally with core v4.0.0-alpha.9, uncomment after it ships
test.skip("Bundle with render plugin renderFile", async () => {
  let elev = new Eleventy("test/stubs/render-file/", undefined, {
    config: function($config) {
      // see testing note at the top of this file
      $config.on("eleventy.beforeConfig", () => {
        $config.addPlugin(bundlePlugin, { force: true, immediate: true });
      });

      $config.addPlugin(RenderPlugin);

      $config.addExtension("scss", {
        outputFileExtension: "css",

        compile: async function(inputContent) {
          let result = sass.compileString(inputContent);

          // This is the render function, `data` is the full data cascade
          return async (data) => {
            return result.css;
          };
        }
      });

      $config.addTemplate("index.njk", `{% css %}{% renderFile "test/stubs/render-file/_includes/test.scss" %}{% endcss -%}<!-- inbetween -->
<style>{% getBundle "css" %}</style>`)
    }
  });

  let results = await elev.toJSON();
  assert.deepEqual(normalize(results[0].content), `<!-- inbetween -->
<style>* {
  color: blue;
}</style>`);
});

test("No bundling", async () => {
  let elev = new Eleventy("test/stubs/no-bundles/", "_site", {
    config: $config => {
      // see testing note at the top of this file
      $config.on("eleventy.beforeConfig", () => {
        $config.addPlugin(bundlePlugin, { force: true, immediate: true });
      });
    }
  });

  let results = await elev.toJSON();
  assert.deepEqual(normalize(results[0].content), `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="">
    <title></title>
  </head>
  <body>

  </body>
</html>`);
});

test("Use Transforms", async () => {
  let elev = new Eleventy("test/stubs/use-transforms/", undefined, {
    configPath: "test/stubs/use-transforms/eleventy.config.js"
  });
  let results = await elev.toJSON();
  assert.deepEqual(normalize(results[0].content), `<style>* { color: blue; }
* { color: red; }
#id * { color: orange; }</style>`);
});

test("Use Transforms on specific bundle type", async () => {
  let elev = new Eleventy("test/stubs/use-transforms-on-type/", undefined, {
    configPath: "test/stubs/use-transforms-on-type/eleventy.config.js"
  });
  let results = await elev.toJSON();
  assert.deepEqual(normalize(results[0].content), `<style>* { color: blue; }
* { color: red; }
#id * { color: orange; }</style>
<script>console.log("bundle me up")</script>`);
});

test("Output `defer` bucket multiple times (hoisting disabled)", async () => {
  let elev = new Eleventy("test/stubs/output-same-bucket-multiple-times-nohoist/", undefined, {
    config: $config => {
      // see testing note at the top of this file
      $config.on("eleventy.beforeConfig", () => {
        $config.addPlugin(bundlePlugin, { force: true, immediate: true });
      });
    }
  });

  let results = await elev.toJSON();
  assert.deepEqual(normalize(results[0].content), `<style>* { color: blue; }</style>
<style>* { color: blue; }
* { color: red; }</style>
<style>* { color: blue; }
* { color: red; }</style>`);
});

test("Output `defer` bucket multiple times (does hoisting)", async () => {
  let elev = new Eleventy("test/stubs/output-same-bucket-multiple-times/", undefined, {
    configPath: "test/stubs/output-same-bucket-multiple-times/eleventy.config.js"
  });

  let results = await elev.toJSON();
  assert.deepEqual(normalize(results[0].content), `<style>* { color: blue; }
* { color: red; }</style>`);
});

test("Output `default` bucket multiple times (no hoisting)", async () => {
  let elev = new Eleventy("test/stubs/output-default-multiple-times/", undefined, {
    config: ($config) => {
      // see testing note at the top of this file
      $config.on("eleventy.beforeConfig", () => {
        $config.addPlugin(bundlePlugin, {
          force: true,
          immediate: true,
          hoistDuplicateBundlesFor: ["css", "js"],
        });
      });
    }
  });

  let results = await elev.toJSON();
  assert.deepEqual(normalize(results[0].content), `<style>* { color: blue; }</style>
<style>* { color: blue; }</style>`);
});

test("`defer` hoisting", async () => {
  let elev = new Eleventy("test/stubs/to-file-duplicates/", undefined, {
    config: ($config) => {
      // see testing note at the top of this file
      $config.on("eleventy.beforeConfig", () => {
        $config.addPlugin(bundlePlugin, {
          force: true,
          immediate: true,
          hoistDuplicateBundlesFor: ["css", "js"],
        });
      });
    }
  });

  let results = await elev.toJSON();
  results.sort((a, b) => {
    if(a.inputPath > b.inputPath) {
      return 1;
    }
    return -1;
  })

  assert.deepEqual(normalize(results[0].content), `<link rel="stylesheet" href="/bundle/S_XQgJiZBL.css">
<link rel="stylesheet" href="/bundle/S_XQgJiZBL.css">`);

  assert.deepEqual(normalize(results[1].content), `<style>* { color: blue; }</style>`);

  assert.deepEqual(normalize(results[2].content), `<style>* { color: blue; }</style>`);
});

test("Bundle export key as string (11ty.js)", async () => {
  let elev = new Eleventy("test/stubs/export-key-str/", "_site", { configPath: "test/stubs/export-key-str/eleventy.config.js" });
  let results = await elev.toJSON();
  assert.deepEqual(normalize(results[0].content), `<style>/* Hello */</style><script>/* Hello */</script>`)
});

test("Bundle export key as object (11ty.js)", async () => {
  let elev = new Eleventy("test/stubs/export-key-obj/", "_site", { configPath: "test/stubs/export-key-obj/eleventy.config.js" });
  let results = await elev.toJSON();
  assert.deepEqual(normalize(results[0].content), `<style>/* CSS */</style><script>/* JS */</script>`)
});

test("Bundle export key as string, using separate bundleExportKey’s (11ty.js)", async () => {
  let elev = new Eleventy("test/stubs/export-key-str-rename/", "_site", { configPath: "test/stubs/export-key-str-rename/eleventy.config.js" });
  let results = await elev.toJSON();
  assert.deepEqual(normalize(results[0].content), `<style>/* CSS */</style><script>/* JS */</script>`)
});

test("Empty CSS bundle (trimmed) removes empty <style> tag", async () => {
  let elev = new Eleventy("test/stubs-virtual/", "_site", {
    config: function($config) {
      $config.on("eleventy.beforeConfig", () => {
        // runs after bundler included with core
        $config.addPlugin(bundlePlugin, { force: true, immediate: true });
      });

      $config.addTemplate('test.njk', `<div></div><style>{% getBundle "css" %}</style>
{%- css %}            {% endcss %}`)
    }
  });
  let results = await elev.toJSON();
  assert.deepEqual(normalize(results[0].content), `<div></div>`)
});

test("Empty JS bundle (trimmed) removes empty <script> tag", async () => {
  let elev = new Eleventy("test/stubs-virtual/", "_site", {
    config: function($config) {
      $config.addPlugin(bundlePlugin);

      $config.addTemplate('test.njk', `<div></div><script>{% getBundle "js" %}</script>
{%- js %}            {% endjs %}`)
    }
  });
  let results = await elev.toJSON();
  assert.deepEqual(normalize(results[0].content), `<div></div>`)
});

test("Empty JS bundle opt-out of trimmed empty <script> tag", async () => {
  let elev = new Eleventy("test/stubs-virtual/", "_site", {
    config: function($config) {
      $config.on("eleventy.beforeConfig", () => {
        $config.addPlugin(bundlePlugin, {
					force: true,
					immediate: true,
          bundles: false,
        });

        let jsBundle = new Bundle("js");
        jsBundle.setPruneEmptySelector(false);
        $config.addBundle(jsBundle);
      });

      $config.addTemplate('test.njk', `<div></div><script>{% getBundle "js" %}</script>
{%- js %}            {% endjs %}`)
    }
  });
  let results = await elev.toJSON();
  assert.deepEqual(normalize(results[0].content), `<div></div><script></script>`)
});

test("Empty CSS bundle (trimmed) removes empty <link rel=stylesheet> tag", async () => {
  let elev = new Eleventy("test/stubs-virtual/", "_site", {
    config: function($config) {
      $config.addPlugin(bundlePlugin, {
        force: true,
      });

      $config.addTemplate('test.njk', `<div></div><link rel="stylesheet" href="{% getBundleFileUrl "css" %}">
{%- css %}            {% endcss %}`)
    }
  });
  let results = await elev.toJSON();
  assert.deepEqual(normalize(results[0].content), `<div></div>`)
});

test("Empty CSS bundle opt-out of trimmed empty <style> tag", async () => {
  let elev = new Eleventy("test/stubs-virtual/", "_site", {
    config: function($config) {
      $config.on("eleventy.beforeConfig", () => {
        $config.addPlugin(bundlePlugin, {
					force: true,
					immediate: true,
          bundles: false,
        });

        let cssBundle = new Bundle("css");
        cssBundle.setPruneEmptySelector(false);
        $config.addBundle(cssBundle);
      });

      $config.addTemplate('test.njk', `<div></div><style>{% getBundle "css" %}</style>
{%- css %}            {% endcss %}`)
    }
  });
  let results = await elev.toJSON();
  assert.deepEqual(normalize(results[0].content), `<div></div><style></style>`)
});

// This requires `htmlTransformer.remove` which is core v3.0.1-alpha.4+
test("Empty CSS bundle (trimmed) does *not* remove empty <style> tag", async () => {
  let elev = new Eleventy("test/stubs-virtual/", "_site", {
    config: function($config) {
      $config.addPlugin(bundlePlugin, {
        pruneEmptySelector: false,
        force: true,
      });

      $config.addTemplate('test.njk', `<div></div><style>{% getBundle "css" %}</style>
{%- css %}            {% endcss %}`);
    }
  });
  let results = await elev.toJSON();
  assert.deepEqual(normalize(results[0].content), `<div></div><style></style>`)
});

// This requires `htmlTransformer.remove` which is core v3.0.1-alpha.4+
test("Empty CSS bundle (trimmed) does *not* remove empty <style eleventy:keep> tag", async () => {
  let elev = new Eleventy("test/stubs-virtual/", "_site", {
    config: function(eleventyConfig) {
      eleventyConfig.addPlugin(bundlePlugin);

      eleventyConfig.addTemplate('test.njk', `<div></div><style eleventy:keep>{% getBundle "css" %}</style>
{%- css %}            {% endcss %}`)
    }
  });

  let results = await elev.toJSON();
  assert.deepEqual(normalize(results[0].content), `<div></div><style></style>`)
});

// This one requires a new Eleventy v3.0.0-alpha.20 or -beta.2 release, per the `enabled` option on plugins to HtmlTransformer
test("<style> is left as-is (not removed) because there are *no* bundles", async () => {
  let elev = new Eleventy("test/stubs-virtual/", "_site", {
    config: function(eleventyConfig) {
      eleventyConfig.addPlugin(bundlePlugin, {
        bundles: false,
      });

      eleventyConfig.addTemplate('test.njk', `<div></div><style></style>`)
    }
  });

  let results = await elev.toJSON();
  assert.deepEqual(normalize(results[0].content), `<div></div><style></style>`)
});

test("Delayed Bundle can be modified by transforms", async () => {
  let elev = new Eleventy("test/stubs-virtual/", "_site", {
    // See testing note at top of this file
    configPath: "test/stubs/delayed-bundle/eleventy.config.js",
  });

  let results = await elev.toJSON();
  assert.deepEqual(normalize(results[0].content), `testing:this is svg`)
});

test("config and configPath handles multiple addPlugin calls just fine", async () => {
  let elev = new Eleventy("test/stubs-virtual/", "_site", {
    // See testing note at top of this file
    configPath: "test/stubs/duplicate-addplugins/eleventy.config.js",
    config: function(eleventyConfig) {
      eleventyConfig.addPlugin(bundlePlugin, {
        bundles: false,
      });

      eleventyConfig.addTemplate('test.njk', `<div></div>`)
    }
  });

  let results = await elev.toJSON();
  assert.deepEqual(normalize(results[0].content), `<div></div>`)
});

test("<style> plucked into bundle", async () => {
  let elev = new Eleventy("test/stubs/pluck-html-css/", "_site", {
    configPath: "test/stubs/pluck-html-css/eleventy.config.js",
  });

  let results = await elev.toJSON();
  assert.deepEqual(normalize(results[0].content), `<style>* { color: yellow }</style><div></div><style>* { color: red }
body { color: blue }</style>`)
});

test("<script> plucked into bundle (and transforms)", async () => {
  let elev = new Eleventy("test/stubs-virtual/", "_site", {
    config: $config => {
      $config.on("eleventy.beforeConfig", () => {
        $config.addPlugin(bundlePlugin, {
          force: true, // for testing
          bundles: false,
          immediate: true,
        });

        $config.addBundle("js", {
          bundleHtmlContentFromSelector: "script",
          transforms: [
            function(content) {
              return `/* Banner from Transforms */
${content}`;
            }
          ]
        })
      });
      $config.addTemplate("index.njk", `<script>/* Bundle one */</script><script>/* Bundle two */</script><div></div><script>{% getBundle "js" %}</script>`);
    }
  });

  let results = await elev.toJSON();
  assert.deepEqual(normalize(results[0].content), `<div></div><script>/* Banner from Transforms */
/* Bundle one */
/* Bundle two */</script>`)
});

test("<style> plucked into bundle with buckets", async () => {
  let elev = new Eleventy("test/stubs/pluck-html-css-buckets/", "_site", {
    configPath: "test/stubs/pluck-html-css-buckets/eleventy.config.js",
  });

  let results = await elev.toJSON();
  assert.deepEqual(normalize(results[0].content), `<div></div><style>@layer layer1 { * { color: yellow }
body { color: blue } } @layer layer2 { * { color: red } } * { color: orange }</style>`)
});

test("Markdown bundle in a markdown file, Issue #31", async () => {
  let elev = new Eleventy("test/stubs-virtual/", "_site", {
  config: function($config) {
    // see testing note at the top of this file
    $config.on("eleventy.beforeConfig", () => {
      $config.addPlugin(bundlePlugin, { bundles: false, immediate: true });

      $config.addBundle("mybundle")
    });

    $config.addTemplate('index.md', `{% getBundle "mybundle" %}
{% mybundle %}
> Lorem ipsum dolor sit amet.
{% endmybundle %}`)
    }
  });
  let results = await elev.toJSON();
  assert.deepEqual(normalize(results[0].content), `> Lorem ipsum dolor sit amet.`)
});

test("Pluck and empty bundles Issue #39", async () => {
  let elev = new Eleventy("test/stubs-virtual/", "_site", {
  config: function($config) {
    // see testing note at the top of this file
    $config.on("eleventy.beforeConfig", () => {
      $config.addPlugin(bundlePlugin, { bundles: false, immediate: true });

        $config.addBundle("css", {
          bundleHtmlContentFromSelector: "style",
        });
      });

      $config.addTemplate('index.liquid', `<!doctype html><link href="{% getBundleFileUrl "css" %}" rel="stylesheet">`)
    }
  });

  let results = await elev.toJSON();
  assert.deepEqual(normalize(results[0].content), `<!doctype html>`)
});

test.skip("<selectedcontent> Issue #40", async () => {
  let elev = new Eleventy("test/stubs-virtual/", "_site", {
  config: function($config) {
    // see testing note at the top of this file
    $config.on("eleventy.beforeConfig", () => {
      $config.addPlugin(bundlePlugin, { bundles: false, force: true, immediate: true });

      $config.addBundle("css");
    });

    $config.addTemplate('index.html', `<!doctype html><select>
<button><selectedcontent></selectedcontent></button>
<option value="pokeball">Pokeball</option>
<option value="greatball">Great ball</option>
<option value="ultraball">Ultra ball</option>
</select>`)
    }
  });

  let results = await elev.toJSON();
  assert.deepEqual(normalize(results[0].content), `<!doctype html><select>
<button><selectedcontent></selectedcontent></button>
<option value="pokeball">Pokeball</option>
<option value="greatball">Great ball</option>
<option value="ultraball">Ultra ball</option>
</select>`)
});

test("Pagination bundles plucked, Issue #37", async () => {
  let elev = new Eleventy("./test/stubs-virtual/", undefined, {
    config: $config => {
      // see testing note at the top of this file
      $config.on("eleventy.beforeConfig", () => {
        // immediate is important if you want to add bundles immediately
        $config.addPlugin(bundlePlugin, { bundles: false, force: true, immediate: true });

        $config.addBundle("css", {
          bundleHtmlContentFromSelector: "style",
        });
      });

      $config.addTemplate("paged.njk", `---
pagination:
  data: collections.all
  size: 2
  alias: posts
layout: "layout.njk"
---
Paged<style>* { color: blue }</style>{% for post in posts %}{{ post.content | safe }}{% endfor %}`);

      $config.addTemplate("index.njk", "Index<style>* { color: red }</style>", { layout: "layout.njk" });
      $config.addTemplate("_includes/layout.njk", `{{ content | safe }}<style>{% getBundle "css" %}</style>`);
    }
  });

  let results = await elev.toJSON();
  assert.equal(results.length, 2);
  assert.equal(results[0].inputPath, `./test/stubs-virtual/paged.njk`);
  assert.equal(results[0].content, `PagedIndex<style>* { color: blue }
* { color: red }</style>`);

  assert.equal(results[1].inputPath, `./test/stubs-virtual/index.njk`);
  assert.equal(results[1].content, `Index<style>* { color: red }</style>`);
});

test("getBundle and 11ty.js Issue #26", async () => {
  let elev = new Eleventy("./test/stubs-virtual/", undefined, {
    config: $config => {
      // see testing note at the top of this file
      $config.on("eleventy.beforeConfig", () => {
        $config.addPlugin(bundlePlugin, { bundles: false, force: true, immediate: true });

        $config.addBundle("css", {
          bundleHtmlContentFromSelector: "style",
        });
      })

      $config.addTemplate("index.11ty.js", function() {
        return `Index<style>* { color: red }</style><style>/* Generated Bundle */${this.getBundle("css")}</style>`;
      });
    }
  });

  let results = await elev.toJSON();
  assert.equal(results.length, 1);
  assert.equal(results[0].content, `Index<style>/* Generated Bundle */* { color: red }</style>`);
});

test("Programmatic bundle Issue #25", async () => {
  let cssBundle = new Bundle("css");

  let elev = new Eleventy("./test/stubs-virtual/", undefined, {
    config: $config => {
      // see testing note at the top of this file
      $config.on("eleventy.beforeConfig", () => {
        $config.addPlugin(bundlePlugin, { bundles: false, force: true, immediate: true });
        $config.addBundle(cssBundle);
      });

      $config.addTemplate("index.11ty.js", async function() {
        return `Index${this.css("* { color: red }")}<style>/* Generated Bundle */${this.getBundle("css")}</style>`;
      });
    }
  });

  let results = await elev.toJSON();
  assert.equal(results.length, 1);
  assert.equal(results[0].content, `Index<style>/* Generated Bundle */* { color: red }</style>`);
});

test("Programmatic bundle plucked Issue #25", async () => {
  let cssBundle = new Bundle("css");
  // also sets delayed
  cssBundle.setPluckedSelector("style");

  let elev = new Eleventy("./test/stubs-virtual/", undefined, {
    config: $config => {
      // see testing note at the top of this file
      $config.on("eleventy.beforeConfig", () => {
        $config.addPlugin(bundlePlugin, { bundles: false, force: true, immediate: true });
        $config.addBundle(cssBundle);
      });

      $config.addTemplate("index.11ty.js", async function() {
        let bundleOutput = this.getBundle("css");
        return `Index${this.css("* { color: red }")}<style>/* Generated Bundle */${bundleOutput}</style>`;
      });
    }
  });

  let results = await elev.toJSON();
  assert.equal(results.length, 1);
  assert.equal(results[0].content, `Index<style>/* Generated Bundle */* { color: red }</style>`);
});

test("Regression <script src=''> removed (webc bundles side loaded)", async () => {
  let elev = new Eleventy("./test/stubs-virtual/", undefined, {
    config: $config => {
      // see testing note at the top of this file
      $config.on("eleventy.beforeConfig", () => {
        $config.addPlugin(bundlePlugin, { bundles: "js", force: true, immediate: true });
      });

      $config.addTemplate("index.njk", `Test<script src="/js/eleventy.js" type="module"></script>`);
    }
  });

  let results = await elev.toJSON();
  assert.equal(results.length, 1);
  assert.equal(results[0].content, `Test<script src="/js/eleventy.js" type="module"></script>`);
});

test("Regression <script src> removed (webc bundles side loaded)", async () => {
  let elev = new Eleventy("./test/stubs-virtual/", undefined, {
    config: $config => {
      // see testing note at the top of this file
      $config.on("eleventy.beforeConfig", () => {
        $config.addPlugin(bundlePlugin, { bundles: "js", force: true, immediate: true });
      });

      $config.addTemplate("index.njk", `Test<script src type="module"></script>`);
    }
  });

  let results = await elev.toJSON();
  assert.equal(results.length, 1);
  assert.equal(results[0].content, `Test<script src type="module"></script>`);
});

test("Asset keys: `get` is an HTML comment, `file` is a bare token", () => {
  let prefix = OutOfOrderRender.PREFIX;
  assert.match(prefix, /^#BaBundle-[0-9a-f]{16}$/);

  // `get` is swapped in as content, where the comment keeps Markdown from wrapping it in a <p> (Issue #31)
  assert.equal(OutOfOrderRender.getAssetKey("get", "css"), `<!--${prefix}:get:css:default:BaBundle#-->`);
  // `file` becomes a URL in an attribute, where `<!--` would break HTML parsing
  assert.equal(OutOfOrderRender.getAssetKey("file", "css"), `${prefix}:file:css:default:BaBundle#`);

  assert.deepEqual(OutOfOrderRender.parseAssetKey(`<!--${prefix}:get:css:default:BaBundle#-->`), { type: "get", name: "css", bucket: "default" });
  assert.deepEqual(OutOfOrderRender.parseAssetKey(`${prefix}:file:css:default:BaBundle#`), { type: "file", name: "css", bucket: "default" });

  let render = new OutOfOrderRender(`<style><!--${prefix}:get:css:default:BaBundle#--></style><link href="${prefix}:file:css:default:BaBundle#">`);
  assert.deepEqual(render.findAll(), [
    `<style>`,
    { type: "get", name: "css", bucket: "default" },
    `</style><link href="`,
    { type: "file", name: "css", bucket: "default" },
    `">`,
  ]);
});

test("Literal asset key text without the nonce is left alone (Issue #54)", async () => {
  let manager = new CodeManager("css");
  manager.addToPage("/page1/", "body { color: red; }");

  let literal = `<!--#BaBundle:get:css:default:BaBundle#--> #BaBundle:file:css:default:BaBundle#`;
  let render = new OutOfOrderRender(`<style>${OutOfOrderRender.getAssetKey("get", "css")}</style><p>${literal}</p>`);
  render.setAssetManager("css", manager);
  render.setWriteToFileSystem(false);

  assert.equal(await render.replaceAll({ url: "/page1/" }), `<style>body { color: red; }</style><p>${literal}</p>`);
  assert.equal(OutOfOrderRender.parseAssetKey(`<!--#BaBundle:get:css:default:BaBundle#-->`), false);
});

test("getBundleFileUrl in an attribute survives a posthtml transform", async () => {
  let elev = new Eleventy("./test/stubs-virtual/", undefined, {
    config: $config => {
      // see testing note at the top of this file
      $config.on("eleventy.beforeConfig", () => {
        $config.addPlugin(bundlePlugin, { bundles: false, force: true, immediate: true });
        // delayed: the asset key is still on the page when the HTML Transformer API parses it
        $config.addBundle("js", { delayed: true });
      });

      $config.addPlugin(InputPathToUrlTransformPlugin);

      $config.addTemplate("index.liquid", `<!doctype html><html><head><script type="module" src="{% getBundleFileUrl "js" %}"></script></head><body><p>After</p></body></html>
{% js %}alert("hi");{% endjs %}`);
    }
  });

  let results = await elev.toJSON();
  assert.equal(results.length, 1);
  assert.equal(normalize(results[0].content), `<!doctype html><html><head><script type="module" src="/I-aF1T6Gxf.js"></script></head><body><p>After</p></body></html>`);
});

async function getInjectResult(bundleOptions, template) {
  let elev = new Eleventy("./test/stubs-virtual/", undefined, {
    config: $config => {
      // see testing note at the top of this file
      $config.on("eleventy.beforeConfig", () => {
        $config.addPlugin(bundlePlugin, { bundles: false, force: true, immediate: true });
        $config.addBundle(bundleOptions.name, bundleOptions);
      });

      $config.addTemplate("index.liquid", template);
    }
  });

  let results = await elev.toJSON();
  assert.equal(results.length, 1);
  return normalize(results[0].content);
}

const INJECT_PAGE = `<!doctype html><html><head><meta charset="utf-8"><title>Title</title></head><body class="b"><p>Hi</p></body></html>
{% css %}* { color: red; }{% endcss %}`;

test("inject inline at each location (Issue #53)", async () => {
  let expected = {
    "<title>": `<!doctype html><html><head><meta charset="utf-8"><title>Title</title><style>* { color: red; }</style></head><body class="b"><p>Hi</p></body></html>`,
    "</head>": `<!doctype html><html><head><meta charset="utf-8"><title>Title</title><style>* { color: red; }</style></head><body class="b"><p>Hi</p></body></html>`,
    "<body>": `<!doctype html><html><head><meta charset="utf-8"><title>Title</title></head><body class="b"><style>* { color: red; }</style><p>Hi</p></body></html>`,
    "</body>": `<!doctype html><html><head><meta charset="utf-8"><title>Title</title></head><body class="b"><p>Hi</p><style>* { color: red; }</style></body></html>`,
  };

  for(let location in expected) {
    let content = await getInjectResult({ name: "css", inject: { location } }, INJECT_PAGE);
    assert.equal(content, expected[location], location);
  }
});

test("inject defaults to </head> (Issue #53)", async () => {
  let content = await getInjectResult({ name: "css", inject: true }, INJECT_PAGE);
  assert.equal(content, `<!doctype html><html><head><meta charset="utf-8"><title>Title</title><style>* { color: red; }</style></head><body class="b"><p>Hi</p></body></html>`);
});

test("inject file (Issue #53)", async () => {
  let content = await getInjectResult({ name: "js", inject: { mode: "file", location: "</body>" } }, `<!doctype html><html><head></head><body><p>Hi</p></body></html>
{% js %}alert("hi");{% endjs %}`);
  assert.equal(content, `<!doctype html><html><head></head><body><p>Hi</p><script type="module" src="/I-aF1T6Gxf.js"></script></body></html>`);
});

test("inject missingLocation (Issue #53)", async () => {
  let page = `<p>Hi</p>
{% css %}* { color: red; }{% endcss %}`;
  let expected = {
    ignore: `<p>Hi</p>`,
    append: `<p>Hi</p>\n<style>* { color: red; }</style>`,
    prepend: `<style>* { color: red; }</style><p>Hi</p>`,
  };

  for(let missingLocation in expected) {
    let content = await getInjectResult({ name: "css", inject: { missingLocation } }, page);
    assert.equal(content, expected[missingLocation], missingLocation);
  }

  assert.equal(await getInjectResult({ name: "css", inject: true }, page), expected.ignore, "default");
  await assert.rejects(getInjectResult({ name: "css", inject: { missingLocation: "error" } }, page));
  assert.throws(() => new CodeManager("css").setInject({ missingLocation: "skip" }));
});

test("inject skipped when the page already uses getBundle (Issue #53)", async () => {
  let content = await getInjectResult({ name: "css", inject: "inline" }, `<html><head></head><body><style>{% getBundle "css" %}</style></body></html>
{% css %}* { color: red; }{% endcss %}`);
  assert.equal(content, `<html><head></head><body><style>* { color: red; }</style></body></html>`);
});

test("inject skipped for empty bundles (Issue #53)", async () => {
  let content = await getInjectResult({ name: "css", inject: "inline" }, `<html><head></head><body></body></html>`);
  assert.equal(content, `<html><head></head><body></body></html>`);
});

test("inject rejects invalid options (Issue #53)", () => {
  let manager = new CodeManager("css");
  assert.throws(() => manager.setInject({ location: "<header>" }));
  assert.throws(() => manager.setInject("external"));
  assert.throws(() => manager.setInject(["inline"]));
});

test("inject html callback on inline and file output (Issue #53)", async () => {
  let inline = await getInjectResult({
    name: "js",
    inject: { html: ({ mode, name }) => `<script type="module" data-mode="${mode}" data-name="${name}">%s</script>` },
  }, `<html><head></head><body></body></html>
{% js %}alert("hi");{% endjs %}`);
  assert.equal(inline, `<html><head><script type="module" data-mode="inline" data-name="js">alert("hi");</script></head><body></body></html>`);

  let file = await getInjectResult({
    name: "js",
    inject: { mode: "file", html: () => `<script type="module" src="%s" defer></script>` },
  }, `<html><head></head><body></body></html>
{% js %}alert("hi");{% endjs %}`);
  assert.equal(file, `<html><head><script type="module" src="/I-aF1T6Gxf.js" defer></script></head><body></body></html>`);

  // Callback allows `file` output for extensions without built-in markup
  let svg = await getInjectResult({
    name: "svg",
    inject: { mode: "file", html: () => `<link rel="preload" as="image" href="%s">` },
  }, `<html><head></head><body></body></html>
{% svg %}<svg></svg>{% endsvg %}`);
  assert.match(svg, /<link rel="preload" as="image" href="\/[^"]+\.svg"><\/head>/);
});

test("inject html rejects non-functions and returns without %s (Issue #53)", async () => {
  let manager = new CodeManager("css");
  assert.throws(() => manager.setInject({ html: "<style></style>" }));

  await assert.rejects(getInjectResult({ name: "css", inject: { html: () => {} } }, INJECT_PAGE));
  await assert.rejects(getInjectResult({ name: "css", inject: { html: () => "<style></style>" } }, INJECT_PAGE));
});

test("inject size inlines small bundles (Issue #53)", async () => {
  let content = await getInjectResult({ name: "css", inject: "size" }, INJECT_PAGE);
  assert.equal(content, `<!doctype html><html><head><meta charset="utf-8"><title>Title</title><style>* { color: red; }</style></head><body class="b"><p>Hi</p></body></html>`);
});

test("inject size writes large bundles to a file (Issue #53)", async () => {
  let content = await getInjectResult({ name: "css", inject: { mode: "size", maxInlineSize: 10 } }, INJECT_PAGE);
  assert.match(content, /<title>Title<\/title><link rel="stylesheet" href="\/[^"]+\.css"><\/head>/);
});

test("inject size measures transformed content (Issue #53)", async () => {
  let content = await getInjectResult({
    name: "js",
    inject: { mode: "size", maxInlineSize: 20 },
    transforms: [content => `/* a long license comment */${content}`],
  }, `<html><head></head><body></body></html>
{% js %}alert("hi");{% endjs %}`);
  assert.match(content, /<head><script type="module" src="\/[^"]+\.js"><\/script><\/head>/);
});

test("inject size passes the chosen mode to inject html (Issue #53)", async () => {
  let html = ({ mode }) => mode === "inline" ? `<style data-inline>%s</style>` : `<link rel="stylesheet" href="%s" data-file>`;
  let inline = await getInjectResult({ name: "css", inject: { mode: "size", html } }, INJECT_PAGE);
  assert.match(inline, /<style data-inline>\* \{ color: red; \}<\/style>/);

  let file = await getInjectResult({ name: "css", inject: { mode: "size", maxInlineSize: 0, html } }, INJECT_PAGE);
  assert.match(file, /<link rel="stylesheet" href="\/[^"]+\.css" data-file>/);
});

test("inject maxInlineSize rejects invalid values (Issue #53)", () => {
  let manager = new CodeManager("css");
  assert.throws(() => manager.setInject({ mode: "size", maxInlineSize: -1 }));
  assert.throws(() => manager.setInject({ mode: "size", maxInlineSize: "4kb" }));
});
