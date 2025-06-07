import { DateTime } from "luxon";
import { feedPlugin } from "@11ty/eleventy-plugin-rss";
import embeds from "eleventy-plugin-embed-everything";
import syntaxHighlight from "@11ty/eleventy-plugin-syntaxhighlight";
import { eleventyImageTransformPlugin } from "@11ty/eleventy-img"

export default async function(eleventyConfig) {

  // Add a filter to format dates
  eleventyConfig.addFilter("postDate", dateObj => {
    return DateTime.fromJSDate(dateObj).toLocaleString(DateTime.DATE_MED)
  })

	// Create a posts collection
	eleventyConfig.addCollection("posts", (collectionApi) =>
		collectionApi.getFilteredByGlob("src/posts/*.md")
	);

  // Embeds plugin
  eleventyConfig.addPlugin(embeds);

  // Syntax highlighting
  eleventyConfig.addPlugin(syntaxHighlight);

  // RSS feed
  eleventyConfig.addPlugin(feedPlugin, {
		type: "atom",
		outputPath: "/feed.xml",
		collection: {
			name: "posts"
		},
		metadata: {
			language: "en",
			title: "toot.community Hub",
			subtitle: "",
			base: "https://hub.toot.community/",
			author: {
				name: "toot.community",
				email: "support@toot.community",
			}
		}
	});

  // Image transformation
  eleventyConfig.addPlugin(eleventyImageTransformPlugin, {
		extensions: "html",
		widths: [800, 500, 300],
		defaultAttributes: {
			sizes: "90vw",
			loading: "lazy",
			decoding: "async",
		},
	});

  // Copy assets
  eleventyConfig.addPassthroughCopy("src/css");
  eleventyConfig.addPassthroughCopy("src/js");
  eleventyConfig.addPassthroughCopy("src/favicon/");
  eleventyConfig.addPassthroughCopy({ 'src/robots.txt': '/robots.txt' });
  eleventyConfig.addPassthroughCopy({ 'src/CNAME': '/CNAME' });

  // Set templating engine and input/output directories
  return {
    markdownTemplateEngine: "njk",
    dataTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
    dir: {
      input: "src",
      output: "dist",
    },
  };

}