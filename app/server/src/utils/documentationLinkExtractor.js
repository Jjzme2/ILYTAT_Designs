/**
 * Documentation Link Extractor Utility
 * 
 * This utility extracts and validates links from markdown content.
 * It helps ensure documentation references point to valid resources.
 */

const fs = require('fs').promises;
const path = require('path');
const logger = require('./logger');
const { glob } = require('glob');
const util = require('util');
const globPromise = util.promisify(glob);

/**
 * Extract markdown links from content
 * 
 * @param {string} content - Markdown content to parse
 * @returns {Array} Array of link objects with text and url
 */
function extractMarkdownLinks(content) {
  // Regular expression to match markdown links
  // Format: [link text](url)
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  const links = [];
  let match;

  while ((match = linkRegex.exec(content)) !== null) {
    links.push({
      text: match[1],
      url: match[2],
    });
  }

  return links;
}

/**
 * Check if a documentation link points to a valid resource
 * 
 * @param {string} link - Link URL to check
 * @param {string} basePath - Base path for resolving relative links
 * @returns {Promise<Object>} Validation result with status and details
 */
async function validateDocumentationLink(link, basePath) {
  try {
    // Skip external links and anchor links
    if (link.startsWith('http://') || 
        link.startsWith('https://') || 
        link.startsWith('#') ||
        link.startsWith('mailto:')) {
      return { 
        isValid: true, 
        type: 'external',
        link 
      };
    }

    // Handle anchor links within the same document
    if (link.includes('#')) {
      const [filePath, anchor] = link.split('#');
      if (!filePath) {
        return { 
          isValid: true, 
          type: 'anchor',
          link 
        };
      }
    }

    // Handle relative paths
    let fullPath;
    if (link.startsWith('../')) {
      // For relative paths, resolve from the base path
      fullPath = path.resolve(path.dirname(basePath), link);
    } else if (link.startsWith('./')) {
      // For explicit relative paths in the same directory
      fullPath = path.resolve(path.dirname(basePath), link.substring(2));
    } else if (link.startsWith('/')) {
      // For absolute paths from project root
      fullPath = path.join(process.cwd(), link);
    } else if (link.startsWith('_dev/') || link.startsWith('app/')) {
      // For paths relative to project root
      fullPath = path.join(process.cwd(), link);
    } else {
      // For paths in the same directory
      fullPath = path.resolve(path.dirname(basePath), link);
    }

    // Check if the file exists
    await fs.access(fullPath);
    
    return { 
      isValid: true, 
      type: 'internal',
      link,
      resolvedPath: fullPath
    };
  } catch (error) {
    return {
      isValid: false,
      type: 'internal',
      link,
      error: error.message,
      possiblePath: link
    };
  }
}

/**
 * Find the most likely valid target for an invalid link
 * 
 * @param {string} link - The invalid link
 * @param {string} projectRoot - Project root directory
 * @returns {Promise<string|null>} The suggested replacement or null if no good match
 */
async function findPossibleReplacement(link, projectRoot = process.cwd()) {
  try {
    // Extract the filename part of the link
    const basename = path.basename(link);
    
    // Find all markdown files in the project
    const allFiles = await globPromise('**/*.md', { cwd: projectRoot });
    
    // Look for files with matching names
    const matchingFiles = allFiles.filter(file => {
      const fileBasename = path.basename(file);
      // Check for exact match or similarity
      return fileBasename === basename || 
             fileBasename.replace(/[-_]/g, '') === basename.replace(/[-_]/g, '') ||
             fileBasename.toLowerCase() === basename.toLowerCase();
    });
    
    if (matchingFiles.length === 1) {
      // If we have exactly one match, use it
      return matchingFiles[0];
    } else if (matchingFiles.length > 1) {
      // If multiple matches, try to find the best one
      // Priority: same directory > same topic area > deeper in hierarchy
      const linkDir = path.dirname(link);
      
      // Try to find a match in the same directory structure
      const sameAreaMatches = matchingFiles.filter(file => {
        const fileDir = path.dirname(file);
        return fileDir.includes(linkDir) || linkDir.includes(fileDir);
      });
      
      if (sameAreaMatches.length > 0) {
        return sameAreaMatches[0];
      }
      
      // If still multiple matches, just pick the first one
      return matchingFiles[0];
    }
    
    return null;
  } catch (error) {
    logger.error(`Error finding replacement for ${link}: ${error.message}`);
    return null;
  }
}

/**
 * Validates all links in a markdown file
 * 
 * @param {string} filePath - Path to the markdown file
 * @returns {Promise<Object>} Validation results
 */
async function validateFileLinks(filePath) {
  try {
    const content = await fs.readFile(filePath, 'utf8');
    const links = extractMarkdownLinks(content);
    
    const results = {
      file: filePath,
      validLinks: [],
      invalidLinks: [],
      totalLinks: links.length
    };
    
    // Validate each link
    for (const link of links) {
      const validation = await validateDocumentationLink(link.url, filePath);
      
      if (validation.isValid) {
        results.validLinks.push({
          text: link.text,
          url: link.url,
          type: validation.type
        });
      } else {
        results.invalidLinks.push({
          text: link.text,
          url: link.url,
          error: validation.error
        });
      }
    }
    
    return results;
  } catch (error) {
    logger.error(`Error validating links in ${filePath}: ${error.message}`);
    throw error;
  }
}

/**
 * Check and extract markdown metadata (frontmatter)
 * 
 * @param {string} content - Markdown content
 * @returns {Object} Object with extracted metadata and content without frontmatter
 */
function extractMarkdownMetadata(content) {
  const metadata = {};
  let processedContent = content;
  
  // Check for YAML frontmatter
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---\n/);
  if (frontmatterMatch) {
    try {
      // Simple parsing of key-value pairs from frontmatter
      const frontmatter = frontmatterMatch[1];
      frontmatter.split('\n').forEach(line => {
        const [key, ...values] = line.split(':');
        if (key && values.length) {
          const value = values.join(':').trim();
          metadata[key.trim()] = value;
        }
      });
      
      // Remove frontmatter from content
      processedContent = content.replace(frontmatterMatch[0], '');
    } catch (error) {
      logger.warn(`Error parsing frontmatter: ${error.message}`);
    }
  }
  
  return {
    metadata,
    content: processedContent
  };
}

module.exports = {
  extractMarkdownLinks,
  validateDocumentationLink,
  findPossibleReplacement,
  validateFileLinks,
  extractMarkdownMetadata
};
