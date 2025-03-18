/**
 * Documentation Link Validator
 * 
 * This utility validates links within markdown documentation files to ensure
 * they point to existing resources. It helps maintain documentation integrity
 * by preventing broken links.
 */

const fs = require('fs').promises;
const path = require('path');
const glob = require('glob-promise');
const { resolveDocPath } = require('./documentationUtils');
const logger = require('./logger');

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
 * Validates all links in a markdown file
 * 
 * @param {string} filePath - Path to the markdown file
 * @returns {Promise<Object>} Validation results
 */
async function validateFileLinks(filePath) {
  try {
    const fullPath = path.isAbsolute(filePath) ? filePath : resolveDocPath(filePath);
    const content = await fs.readFile(fullPath, 'utf8');
    const links = extractMarkdownLinks(content);
    
    const results = {
      file: filePath,
      validLinks: [],
      invalidLinks: [],
      totalLinks: links.length
    };
    
    // Validate each link
    for (const link of links) {
      const validation = await validateDocumentationLink(link.url, fullPath);
      
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
 * Validates all links in all markdown files in a directory
 * 
 * @param {string} directory - Directory to scan for markdown files
 * @param {boolean} recursive - Whether to scan subdirectories
 * @returns {Promise<Object>} Validation results for all files
 */
async function validateDirectoryLinks(directory, recursive = true) {
  try {
    const pattern = path.join(
      directory, 
      recursive ? '**/*.md' : '*.md'
    );
    
    const files = await glob(pattern);
    const results = {
      directory,
      fileCount: files.length,
      validLinkCount: 0,
      invalidLinkCount: 0,
      fileResults: []
    };
    
    for (const file of files) {
      const fileResults = await validateFileLinks(file);
      results.fileResults.push(fileResults);
      results.validLinkCount += fileResults.validLinks.length;
      results.invalidLinkCount += fileResults.invalidLinks.length;
    }
    
    return results;
  } catch (error) {
    logger.error(`Error validating directory ${directory}: ${error.message}`);
    throw error;
  }
}

/**
 * Fixes invalid links in a markdown file if possible
 * 
 * @param {string} filePath - Path to the markdown file
 * @param {Array} suggestions - Array of suggested fixes for links
 * @returns {Promise<Object>} Fix results
 */
async function fixFileLinks(filePath, suggestions) {
  try {
    const fullPath = path.isAbsolute(filePath) ? filePath : resolveDocPath(filePath);
    let content = await fs.readFile(fullPath, 'utf8');
    
    const results = {
      file: filePath,
      fixedLinks: [],
      unfixableLinks: []
    };
    
    for (const suggestion of suggestions) {
      if (suggestion.replacement) {
        // Create a regex that matches this specific link
        const escapedOldLink = suggestion.oldUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const linkRegex = new RegExp(`\\[([^\\]]+)\\]\\(${escapedOldLink}\\)`, 'g');
        
        // Replace the link in the content
        const newLink = `[${suggestion.text}](${suggestion.replacement})`;
        const originalContent = content;
        content = content.replace(linkRegex, newLink);
        
        // Check if replacement was made
        if (content !== originalContent) {
          results.fixedLinks.push({
            text: suggestion.text,
            oldUrl: suggestion.oldUrl,
            newUrl: suggestion.replacement
          });
        } else {
          results.unfixableLinks.push({
            text: suggestion.text,
            url: suggestion.oldUrl,
            reason: 'Link not found in content'
          });
        }
      } else {
        results.unfixableLinks.push({
          text: suggestion.text,
          url: suggestion.oldUrl,
          reason: 'No valid replacement found'
        });
      }
    }
    
    // Save the updated content if there were fixes
    if (results.fixedLinks.length > 0) {
      await fs.writeFile(fullPath, content, 'utf8');
    }
    
    return results;
  } catch (error) {
    logger.error(`Error fixing links in ${filePath}: ${error.message}`);
    throw error;
  }
}

/**
 * Finds the most likely valid target for an invalid link
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
    const allFiles = await glob('**/*.md', { cwd: projectRoot });
    
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
 * Generates a report of all invalid links in the documentation
 * 
 * @param {string} outputPath - Path to save the report
 * @returns {Promise<void>}
 */
async function generateLinkValidationReport(outputPath) {
  try {
    // Validate documentation in key directories
    const centralResults = await validateDirectoryLinks(path.join(process.cwd(), '_dev'));
    const serverResults = await validateDirectoryLinks(path.join(process.cwd(), 'app', 'server', 'docs'));
    const clientResults = await validateDirectoryLinks(path.join(process.cwd(), 'app', 'client', 'src', 'docs'));
    
    // Combine results
    const allResults = {
      generatedAt: new Date().toISOString(),
      summary: {
        totalFiles: centralResults.fileCount + serverResults.fileCount + clientResults.fileCount,
        totalValidLinks: centralResults.validLinkCount + serverResults.validLinkCount + clientResults.validLinkCount,
        totalInvalidLinks: centralResults.invalidLinkCount + serverResults.invalidLinkCount + clientResults.invalidLinkCount
      },
      centralDocumentation: centralResults,
      serverDocumentation: serverResults,
      clientDocumentation: clientResults
    };
    
    // Generate detailed report for files with invalid links
    const filesProblemDetails = [];
    
    // Process central documentation
    for (const fileResult of centralResults.fileResults) {
      if (fileResult.invalidLinks.length > 0) {
        const invalidLinksDetails = await Promise.all(fileResult.invalidLinks.map(async link => {
          const replacement = await findPossibleReplacement(link.url);
          return {
            text: link.text,
            url: link.url,
            error: link.error,
            suggestedReplacement: replacement
          };
        }));
        
        filesProblemDetails.push({
          file: fileResult.file,
          invalidLinks: invalidLinksDetails
        });
      }
    }
    
    // Process server documentation
    for (const fileResult of serverResults.fileResults) {
      if (fileResult.invalidLinks.length > 0) {
        const invalidLinksDetails = await Promise.all(fileResult.invalidLinks.map(async link => {
          const replacement = await findPossibleReplacement(link.url);
          return {
            text: link.text,
            url: link.url,
            error: link.error,
            suggestedReplacement: replacement
          };
        }));
        
        filesProblemDetails.push({
          file: fileResult.file,
          invalidLinks: invalidLinksDetails
        });
      }
    }
    
    // Process client documentation
    for (const fileResult of clientResults.fileResults) {
      if (fileResult.invalidLinks.length > 0) {
        const invalidLinksDetails = await Promise.all(fileResult.invalidLinks.map(async link => {
          const replacement = await findPossibleReplacement(link.url);
          return {
            text: link.text,
            url: link.url,
            error: link.error,
            suggestedReplacement: replacement
          };
        }));
        
        filesProblemDetails.push({
          file: fileResult.file,
          invalidLinks: invalidLinksDetails
        });
      }
    }
    
    // Format the report
    const report = {
      ...allResults,
      problemDetails: filesProblemDetails
    };
    
    // Save the report
    await fs.writeFile(outputPath, JSON.stringify(report, null, 2), 'utf8');
    
    // Also generate a markdown report for easier reading
    let markdownReport = `# Documentation Link Validation Report\n\n`;
    markdownReport += `Generated at: ${report.generatedAt}\n\n`;
    markdownReport += `## Summary\n\n`;
    markdownReport += `- Total Files: ${report.summary.totalFiles}\n`;
    markdownReport += `- Total Valid Links: ${report.summary.totalValidLinks}\n`;
    markdownReport += `- Total Invalid Links: ${report.summary.totalInvalidLinks}\n\n`;
    
    if (report.problemDetails.length > 0) {
      markdownReport += `## Files with Invalid Links\n\n`;
      
      for (const fileProblem of report.problemDetails) {
        markdownReport += `### ${fileProblem.file}\n\n`;
        markdownReport += `| Link Text | Invalid URL | Suggested Replacement |\n`;
        markdownReport += `|-----------|------------|------------------------|\n`;
        
        for (const link of fileProblem.invalidLinks) {
          markdownReport += `| ${link.text} | ${link.url} | ${link.suggestedReplacement || 'No suggestion available'} |\n`;
        }
        
        markdownReport += `\n`;
      }
    }
    
    const markdownPath = outputPath.replace(/\.json$/, '.md');
    await fs.writeFile(markdownPath, markdownReport, 'utf8');
    
    return {
      jsonReport: outputPath,
      markdownReport: markdownPath,
      summary: report.summary
    };
  } catch (error) {
    logger.error(`Error generating link validation report: ${error.message}`);
    throw error;
  }
}

module.exports = {
  validateFileLinks,
  validateDirectoryLinks,
  fixFileLinks,
  findPossibleReplacement,
  generateLinkValidationReport
};
