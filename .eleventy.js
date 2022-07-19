module.exports = function(eleventyConfig) {
	eleventyConfig.addPassthroughCopy("src/css");
	eleventyConfig.addPassthroughCopy("src/js");
	eleventyConfig.addPassthroughCopy("src/fonts");
	eleventyConfig.addPassthroughCopy("src/images");

	return {
		pathPrefix: "/metro-art-bus-tracker/",
		dir: {
			input: "src",
			output: "docs"
		}
	};
};
