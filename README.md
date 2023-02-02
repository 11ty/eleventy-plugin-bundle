# eleventy-plugin-bundle

Little bundles of code, little bundles of joy.

Create minimal per-page or app-level bundles of CSS, JavaScript, or HTML bundles to be included in your Eleventy project.

Makes implementing Critical CSS, per-page in-use-only CSS/JS bundles, SVG icon libraries, secondary HTML content to load via XHR.

## Why?

This project is a minimum-viable-bundler and asset pipeline in Eleventy. It does not perform any transpilation or code manipulation (by default). The code you put in is the code you get out (with configurable `transforms` if you’d like to modify the code).

For more larger, more complex use cases you may want to use a more full featured bundler like Vite, Parcel, Webpack, rollup, esbuild, or others.

But do note that a full-featured bundler has a significant build performance cost, so take care to weigh the cost of using that style of bundler against whether or not this plugin has sufficient functionality for your use case—especially as the platform matures and we see diminishing returns on code transpilation (ES modules everywhere).

## Installation

It’s available on [npm as `@11ty/eleventy-plugin-bundle`](https://www.npmjs.com/package/@11ty/eleventy-plugin-bundle):

```
npm install @11ty/eleventy-plugin-bundle
```

And then in your Eleventy configuration file (probably `.eleventy.js`):

```js
const bundlerPlugin = require("@11ty/eleventy-plugin-bundle");

module.exports = function(eleventyConfig) {
	eleventyConfig.addPlugin(bundlerPlugin);
};
```

<details>
<summary><strong>Full options list</strong></summary>

And then in your Eleventy configuration file (probably `.eleventy.js`):

```js
const bundlerPlugin = require("@11ty/eleventy-plugin-bundle");

module.exports = function(eleventyConfig) {
	eleventyConfig.addPlugin(bundlerPlugin, {
		// Folder (in the output directory) bundle files will write to:
		toFileDirectory: "bundle",

		// Default bundle types
		bundles: ["css", "js", "html"],

		// Array of async-friendly callbacks to transform bundle content.
		// Works with getBundle and getBundleFileUrl
		transforms: []
	});
};
```

</details>

## Usage

The following shortcodes are provided by this plugin:

* `css`, `js`, and `html` to add code to a bundle.
* `getBundle` and `getBundleFileUrl` to get bundled code.

### Add bundle code in a Markdown file in Eleventy

```md
# My Blog Post

This is some content, I am writing markup.

{% css %}
em { font-style: italic; }
{% endcss %}

## More Markdown

{% css %}
strong { font-weight: bold; }
{% endcss %}
```

Renders to:

```html
<h1>My Blog Post</h1>

<p>This is some content, I am writing markup.</p>

<h2>More Markdown</h2>
```

Note that the bundled code is excluded!

### Render bundle code

```html
<!-- Use this *anywhere*: a layout file, content template, etc -->
<style>{% getBundle "css" %}</style>

<!--
You can add more code to the bundle after calling
getBundle and it will be included.
-->
{% css %}* { color: orange; }{% endcss %}
```

### Write a bundle to a file

Writes the bundle content to a content-hashed file location in your output directory and returns the URL to the file for use like this:

```html
<link rel="stylesheet" href="{% getBundleFileUrl "css" %}">
```

### Asset bucketing

```html
<!-- This goes into a `defer` bucket (the bucket can be any string value) -->
{% css "defer" %}em { font-style: italic; }{% endcss %}
```

```html
<!-- Pass the arbitrary `defer` bucket name as an additional argument -->
<style>{% getBundle "css", "defer" %}</style>
<link rel="stylesheet" href="{% getBundleFileUrl 'css', 'defer' %}">
```

A `default` bucket is implied:

```html
<!-- These two statements are the same -->
{% css %}em { font-style: italic; }{% endcss %}
{% css "default" %}em { font-style: italic; }{% endcss %}

<!-- These two are the same too -->
<style>{% getBundle "css" %}</style>
<style>{% getBundle "css", "default" %}</style>
```

### Examples

#### Critical CSS

Use asset bucketing to divide CSS between the `default` bucket and a `defer` bucket, loaded asynchronously.

_(Note that some HTML boilerplate has been omitted from the sample below)_

```html
<!-- … -->
<head>
	<!-- Inlined critical styles -->
	<style>{% getBundle "css" %}</style>

	<!-- Deferred non-critical styles -->
	<link rel="stylesheet" href="{% getBundleFileUrl 'css', 'defer' %}" media="print" onload="this.media='all'">
	<noscript>
		<link rel="stylesheet" href="{% getBundleFileUrl 'css', 'defer' %}">
	</noscript>
</head>
<body>
	<!-- This goes into a `default` bucket -->
	{% css %}/* Inline in the head, great with @font-face! */{% endcss %}
	<!-- This goes into a `defer` bucket (the bucket can be any string value) -->
	{% css "defer" %}/* Load me later */{% endcss %}
</body>
<!-- … -->
```

**Related**:

* Check out the [demo of Critical CSS using Eleventy Edge](https://demo-eleventy-edge.netlify.app/critical-css/) for a repeat view optimization without JavaScript.
* You may want to improve the above code with [`fetchpriority`](https://www.smashingmagazine.com/2022/04/boost-resource-loading-new-priority-hint-fetchpriority/) when [browser support improves](https://caniuse.com/mdn-html_elements_link_fetchpriority).

#### SVG Icon Library

Here `svg` is an asset bucket on the `html` bundle.

```html
<svg width="0" height="0" aria-hidden="true" style="position: absolute;">
	<defs>{% getBundle "html", "svg" %}</defs>
</svg>

<!-- And anywhere on your page you can add icons to the set -->
{% html "svg" %}
<g id="icon-close"><path d="…" /></g>
{% endhtml %}

And now you can use `icon-close` in as many SVG instances as you’d like (without repeating the heftier SVG content).

<svg><use xlink:href="#icon-close"></use></svg>
<svg><use xlink:href="#icon-close"></use></svg>
<svg><use xlink:href="#icon-close"></use></svg>
<svg><use xlink:href="#icon-close"></use></svg>
```

#### React Helmet-style `<head>` additions

This might exist in an Eleventy layout file:

```html
<head>
	{% getBundle "html", "head" %}
</head>
```

And then in your content you might want to page-specific `preconnect`:

```html
{% html "head" %}
<link href="https://v1.opengraph.11ty.dev" rel="preconnect" crossorigin>
{% endhtml %}
```

#### Bundle Sass with the Render Plugin

You can render template syntax inside of the `{% css %}` shortcode too, if you’d like to do more advanced things using Eleventy template types.

This example assumes you have added the [Render plugin](https://www.11ty.dev/docs/plugins/render/) and the [`scss` custom template type](https://www.11ty.dev/docs/languages/custom/) to your Eleventy configuration file.

```html
{% css %}
  {% renderTemplate "scss" %}
  h1 { .test { color: red; } }
  {% endrenderTemplate %}
{% endcss %}
```

Now the compiled Sass is available in your default bundle and will show up in `getBundle` and `getBundleFileUrl`.

#### Use with [WebC](https://www.11ty.dev/docs/languages/webc/)

Starting with `@11ty/eleventy-plugin-webc@0.9.0` this plugin is used by default in the Eleventy WebC plugin. Specifically, [WebC Bundler Mode](https://www.11ty.dev/docs/languages/webc/#css-and-js-(bundler-mode)) now uses the bundle plugin under the hood.

To add CSS to a page bundle in WebC, you would use a `<style>` element in a WebC page or component:

```html
<style>/* This is bundled. */</style>
<style webc:keep>/* Do not bundle me—leave as is */</style>
```

To add JS to a page bundle in WebC, you would use a `<script>` element in a WebC page or component:

```html
<script>/* This is bundled. */</script>
<script webc:keep>/* Do not bundle me—leave as is */</script>
```

* Existing calls via WebC helpers `getCss` or `getJs` (e.g. `<style @raw="getCss(page.url)">`) have been wired up to `getBundle('css')` and `getBundle('js')` automatically.
	* For consistency, you may prefer using the bundle plugin method names everywhere: `<style @raw="getBundle('css')">` and `<script @raw="getBundle('js')">` both work fine.
* Outside of WebC, the [Universal Filters `webcGetCss` and `webcGetJs`](https://www.11ty.dev/docs/languages/webc/#css-and-js-(bundler-mode)) were available to access CSS and JS bundles but are considered deprecated in favor of new bundle plugin Universal Shortcodes `getBundle("css")` and `getBundle("js")` respectively.

#### Modify the bundle output

You can wire up your own async-friendly callbacks to transform the bundle output too. Here’s a quick example of [`postcss` integration](https://github.com/postcss/postcss#js-api).

```js
const bundlerPlugin = require("@11ty/eleventy-plugin-bundle");
const postcss = require("postcss");
const postcssNested = require("postcss-nested");

module.exports = function(eleventyConfig) {
	eleventyConfig.addPlugin(bundlerPlugin, {
		transforms: [
			async function(content) {
				// Same as Eleventy transforms, this.page is available here.
				let result = await postcss([postcssNested]).process(content, { from: this.page.inputPath, to: null });
				return result.css;
			}
		]
	});
};
```

#### Bundling on the [Edge](https://www.11ty.dev/docs/plugins/edge/)

_Coming soon_

## Advanced options:


### Add your own bundle type

If you’d like to add your own bundle types (in addition to the guaranteed types: `css`, `js`, and `html`), you can do so:

```js
const bundlerPlugin = require("@11ty/eleventy-plugin-bundle");

module.exports = function(eleventyConfig) {
	eleventyConfig.addPlugin(bundlerPlugin, {
		bundles: ["possum"]
	});
};
```

This does two things:

1. creates a new `possum` shortcode for adding arbitrary code to this bundle
2. adds `"possum"` as an eligible type argument to `getBundle` and `getBundleFileUrl`

### Limitations

Bundles do not support nesting or recursion (yet?). If this will be useful to you, please file an issue!

<!--
Version Two:

* Think about Eleventy transform order, scenarios where this transform needs to run first.
* JavaScript API independent of eleventy
* Clean up the _site/bundle folder on exit?
* Example ideas:
	* App bundle and page bundle
* can we make this work for syntax highlighting? or just defer to WebC for this?

{% css %}
<style>
em { font-style: italic; }
</style>
{% endcss %}
* a way to declare dependencies? or just defer to buckets here
* What if we want to add code duplicates? Adding `alert(1);` `alert(1);` to alert twice?
* sourcemaps (maybe via magic-string module or https://www.npmjs.com/package/concat-with-sourcemaps)
-->