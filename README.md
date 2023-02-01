# eleventy-bundle

Little bundles of code, little bundles of joy.

Create minimal per-page or app-level bundles of CSS, JavaScript, or HTML bundles to be included in your Eleventy project.

Makes implementing Critical CSS, per-page in-use-only CSS/JS bundles, SVG icon libraries, secondary HTML content to load via XHR.

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

		// Shortcode names
		shortcodes: {
			get: "getBundle",
			toFile: "getBundleFileUrl",

			// override bundle add names:
			add: {
				// use `addCss` instead of `css`
				// css: "addCss"
			}
		}
	});
};
```

</details>

## Usage

The following shortcodes are included in this plugin:

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
	<defs>{%- getBundle "html", "svg" %}</defs>
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

#### Use with WebC

TODO

#### Bundling on the Edge

TODO

## Advanced options:

### Limitations

* `html` bundles are not allowed to reference other bundles in content (yet). If this will be useful to you, please file an issue!

### Add your own bundle type

If you’d like to add your own bundle types (in addition to `css`, `js`, and `html`), you can do so:

```js
const bundlerPlugin = require("@11ty/eleventy-plugin-bundle");

module.exports = function(eleventyConfig) {
	eleventyConfig.addPlugin(bundlerPlugin, {
		bundles: ["css", "js", "html", "mine"]
	});
};
```

You _could_ remove existing bundle types too, the `bundles` array content is not deeply merged. The addition of `"mine"` in this array:

1. creates a new `mine` shortcode for adding arbitrary code to this bundle
2. adds `"mine"` as an eligible type argument to `getBundle` and `getBundleFileUrl`

<!--
Must haves:

* Add postprocessing transforms for postcss modifications
* guarantee that the transform runs first in order somehow (think about transform order)

Version Two:

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