import bundlePlugin from "../../../eleventy.bundle.js";

export default function(eleventyConfig) {
	eleventyConfig.addPlugin(bundlePlugin, {
		pruneEmptySelector: false,
		force: true,
	});

	eleventyConfig.addTemplate('test.njk', `<div></div><style>{% getBundle "css" %}</style>
{%- css %}            {% endcss %}`);
};