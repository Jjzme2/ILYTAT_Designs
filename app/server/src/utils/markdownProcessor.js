const { marked } = require('marked');
const hljs = require('highlight.js');
const sanitizeHtml = require('sanitize-html');

// Configure marked with highlight.js for code highlighting
marked.setOptions({
  highlight: function(code, lang) {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return hljs.highlight(code, { language: lang }).value;
      } catch (err) {
        console.error('Highlight.js error:', err);
      }
    }
    return hljs.highlightAuto(code).value;
  },
  headerIds: true, // Enable header IDs for navigation
  gfm: true // Enable GitHub Flavored Markdown
});

// Sanitization options
const sanitizeOptions = {
  allowedTags: sanitizeHtml.defaults.allowedTags.concat([
    'img', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'
  ]),
  allowedAttributes: {
    ...sanitizeHtml.defaults.allowedAttributes,
    'code': ['class'], // Allow syntax highlighting classes
    'img': ['src', 'alt', 'title'],
    '*': ['id', 'class'] // Allow ids for header anchors and general classes
  },
  allowedClasses: {
    'code': ['*'], // Allow all classes on code elements for syntax highlighting
    'pre': ['*'],
    '*': ['heading', 'paragraph'] // Basic typography classes
  }
};

/**
 * Process markdown content with syntax highlighting and sanitization
 * @param {string} markdown - Raw markdown content
 * @returns {string} - Processed HTML content
 */
function processMarkdown(markdown) {
  try {
    // Convert markdown to HTML
    const rawHtml = marked(markdown);
    
    // Sanitize the HTML
    const sanitizedHtml = sanitizeHtml(rawHtml, sanitizeOptions);
    
    return sanitizedHtml;
  } catch (error) {
    console.error('Error processing markdown:', error);
    return sanitizeHtml('**Error processing markdown content**');
  }
}

/**
 * Process markdown content and return both HTML and metadata
 * @param {string} markdown - Raw markdown content
 * @returns {Object} - Object containing HTML content and metadata
 */
function processMarkdownWithMetadata(markdown) {
  try {
    const html = processMarkdown(markdown);
    
    // Extract headers for navigation
    const headers = [];
    const tokens = marked.lexer(markdown);
    tokens.forEach(token => {
      if (token.type === 'heading') {
        headers.push({
          level: token.depth,
          text: token.text,
          id: token.text.toLowerCase().replace(/[^\w]+/g, '-')
        });
      }
    });

    return {
      html,
      metadata: {
        headers,
        lastProcessed: new Date().toISOString()
      }
    };
  } catch (error) {
    console.error('Error processing markdown with metadata:', error);
    return {
      html: sanitizeHtml('**Error processing markdown content**'),
      metadata: {
        headers: [],
        lastProcessed: new Date().toISOString(),
        error: error.message
      }
    };
  }
}

module.exports = {
  processMarkdown,
  processMarkdownWithMetadata
};
