import TurndownService from "turndown";

const turndownService = new TurndownService();

// Add a rule to ignore script tags
turndownService.addRule("ignoreScriptTags", {
  filter: ["script"],
  replacement: function () {
    return ""; // Return an empty string for script tags
  },
});

// Add a rule to remove HTML comments
turndownService.addRule("removeHtmlComments", {
  filter: function (node, options) {
    return node.nodeType === 8; // Node type 8 corresponds to comments
  },
  replacement: function () {
    return ""; // Return an empty string for comments
  },
});

// Add a rule to ignore <style> tags
turndownService.addRule("ignoreStyleTags", {
  filter: ["style"],
  replacement: function () {
    return ""; // Return an empty string for style tags
  },
});

// Add a rule to process <img> tags by keeping only the alt text
turndownService.addRule("keepAltTextOfImages", {
  filter: ["img"],
  replacement: function (content, node) {
    const altText = (node as HTMLImageElement).alt || "";
    return altText; // Return only the alt text, removing the URL
  },
});

// Add a rule to process <a> tags by keeping only the text
turndownService.addRule("keepTextOfLinks", {
  filter: ["a"],
  replacement: function (content, node) {
    return node.textContent || ""; // Return only the text content of the link
  },
});

// // Add a rule to ignore <img> tags
// turndownService.addRule("ignoreImageTags", {
//   filter: ["img"],
//   replacement: function () {
//     return ""; // Return an empty string for image tags, effectively removing them
//   },
// });

export { turndownService };
