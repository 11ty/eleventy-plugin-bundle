import bundlePlugin from "../../../eleventy.bundle.js";
import postcss from 'postcss';
import postcssNested from 'postcss-nested';


export default function(eleventyConfig) {
	eleventyConfig.addPlugin(bundlePlugin, {
		transforms: [async function(content) {
			return new Promise(resolve => {
				setTimeout(() => resolve(content), 50);
			});
		}, async function(content) {
			if (this.type === "css") {
				let result = await postcss([postcssNested]).process(content, { from: null, to: null })
				return result.css;
			}
			return content;
		}]
	});
};