/**
 * Documentation Service
 * Provides functions for fetching, rendering, and saving documentation files.
 * @module services/documentationService
 */
const fs = require('fs-extra');
const path = require('path');
const glob = require('glob');
const MarkdownIt = require('markdown-it');
const markdownItAnchor = require('markdown-it-anchor');
const markdownItToc = require('markdown-it-table-of-contents');
const matter = require('gray-matter');
const logger = require('../utils/logger');

// Configure markdown parser
const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
  highlight: function (str, lang) {
    // Add syntax highlighting implementation here if needed
    return `<pre class="language-${lang}"><code>${str}</code></pre>`;
  }
});

// Add plugins
md.use(markdownItAnchor);
md.use(markdownItToc, {
  includeLevel: [1, 2, 3],
  containerClass: 'table-of-contents',
  slugify: s => s.toLowerCase().replace(/[^\w]+/g, '-'),
});

// Base paths for documentation files
const DOC_PATHS = [
  path.join(__dirname, '../../../_dev/shared'),
  path.join(__dirname, '../../../_dev/shared/notes'),
  path.join(__dirname, '../../docs'),
  path.join(__dirname, '../../src/docs'),
  path.join(__dirname, '../docs')
];

/**
 * Documentation Service
 * Provides functions for fetching, rendering, and saving documentation files
 */
class DocumentationService {
  constructor() {
    this.logger = logger.child({ component: 'DocumentationService' });
  }

  /**
   * Get all documentation files from various locations
   * @returns {Promise<Array>} Array of file objects
   */
  async getDocFiles() {
    const results = [];
    
    for (const basePath of DOC_PATHS) {
      if (!await this._pathExists(basePath)) {
        this.logger.debug(`Path does not exist: ${basePath}`);
        continue;
      }
      
      try {
        const pattern = path.join(basePath, '**/*.@(md|markdown)');
        const files = await this._globPromise(pattern);
        
        for (const file of files) {
          try {
            const stats = await fs.stat(file);
            const relativePath = path.relative(path.resolve(path.join(__dirname, '../../..')), file).replace(/\\/g, '/');
            const directory = path.dirname(relativePath);
            const name = path.basename(file, path.extname(file));
            
            // Read file content to extract front matter
            const content = await fs.readFile(file, 'utf8');
            const { data: frontMatter } = matter(content);
            
            results.push({
              absolute_path: file,
              relative_path: relativePath,
              directory,
              name: frontMatter.title || name,
              title: frontMatter.title,
              description: frontMatter.description,
              category: frontMatter.category,
              tags: frontMatter.tags,
              size: stats.size,
              created_at: stats.birthtime,
              modified_at: stats.mtime
            });
          } catch (err) {
            this.logger.error({
              message: `Error processing file: ${file}`,
              error: err
            });
          }
        }
      } catch (err) {
        this.logger.error({
          message: `Error searching for files in: ${basePath}`,
          error: err
        });
      }
    }
    
    // Sort by modified date (newest first)
    return results.sort((a, b) => new Date(b.modified_at) - new Date(a.modified_at));
  }
  
  /**
   * Get a specific documentation file by path
   * @param {string} filePath - Relative path to the documentation file
   * @returns {Promise<Object>} File content and metadata
   */
  async getDocFile(file_path) {
    const fullPath = path.join(__dirname, '../../..', file_path);
    
    if (!await this._pathExists(fullPath)) {
      throw new Error(`File not found: ${file_path}`);
    }
    
    try {
      const stats = await fs.stat(fullPath);
      const content = await fs.readFile(fullPath, 'utf8');
      
      // Parse front matter
      const { data: frontMatter, content: markdownContent } = matter(content);
      
      // Render markdown to HTML
      const renderedContent = md.render(markdownContent);
      
      return {
        absolute_path: fullPath,
        relative_path: file_path,
        name: path.basename(fullPath, path.extname(fullPath)),
        title: frontMatter.title || path.basename(fullPath, path.extname(fullPath)),
        description: frontMatter.description,
        category: frontMatter.category,
        tags: frontMatter.tags,
        content: markdownContent,
        renderedContent,
        frontMatter,
        size: stats.size,
        created_at: stats.birthtime,
        modified_at: stats.mtime
      };
    } catch (err) {
      this.logger.error({
        message: `Error reading file: ${fullPath}`,
        error: err
      });
      throw err;
    }
  }
  
  /**
   * Save content to a documentation file
   * @param {string} file_path - Relative path to the documentation file
   * @param {string} content - Markdown content to save
   * @param {Object} frontMatter - Front matter metadata
   * @returns {Promise<Object>} Saved file metadata
   */
  async saveDocFile(file_path, content, frontMatter = {}) {
    const fullPath = path.join(__dirname, '../../..', file_path);
    
    try {
      // Ensure the directory exists
      await fs.ensureDir(path.dirname(fullPath));
      
      // Create content with front matter
      let fileContent;
      if (frontMatter && Object.keys(frontMatter).length > 0) {
        fileContent = matter.stringify(content, frontMatter);
      } else {
        fileContent = content;
      }
      
      // Write the file
      await fs.writeFile(fullPath, fileContent);
      
      // Get updated stats
      const stats = await fs.stat(fullPath);
      
      return {
        absolute_path: fullPath,
        relative_path: file_path,
        name: path.basename(fullPath, path.extname(fullPath)),
        content,
        frontMatter,
        size: stats.size,
        created_at: stats.birthtime,
        modified_at: stats.mtime
      };
    } catch (err) {
      this.logger.error({
        message: `Error saving file: ${fullPath}`,
        error: err
      });
      throw err;
    }
  }
  
  /**
   * Render Markdown content to HTML
   * @param {string} markdown - Markdown content
   * @returns {string} HTML content
   */
  renderMarkdown(markdown) {
    return md.render(markdown);
  }
  
  /**
   * Check if a path exists
   * @param {string} p - Path to check
   * @returns {Promise<boolean>} Whether the path exists
   * @private
   */
  async _pathExists(p) {
    try {
      await fs.access(p);
      return true;
    } catch (err) {
      return false;
    }
  }
  
  /**
   * Promisified glob
   * @param {string} pattern - Glob pattern
   * @returns {Promise<Array>} Array of matching files
   * @private
   */
  _globPromise(pattern) {
    return new Promise((resolve, reject) => {
      glob(pattern, { nodir: true }, (err, files) => {
        if (err) {
          reject(err);
        } else {
          resolve(files);
        }
      });
    });
  }
}

module.exports = new DocumentationService();
