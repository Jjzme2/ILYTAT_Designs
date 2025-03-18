/**
 * File Documentation Controller
 * 
 * This controller provides access to the project's markdown documentation files
 * located throughout the project. It implements the central documentation system
 * that allows accessing both centralized (_dev) and application-specific documentation.
 */

const fs = require('fs').promises;
const path = require('path');
const { catchAsync, createError, createNotFoundError } = require('../utils/errorHandler');
const logger = require('../utils/logger');
const { resolveDocPath } = require('../utils/documentationUtils');
const { glob } = require('glob');
const util = require('util');
const globPromise = util.promisify(glob);
const marked = require('marked');
const { 
  extractMarkdownLinks, 
  validateDocumentationLink, 
  extractMarkdownMetadata 
} = require('../utils/documentationLinkExtractor');

class FileDocumentationController {
  constructor() {
    this.logger = logger.child({ component: 'FileDocumentationController' });
  }

  /**
   * Get documentation from the central _dev directory
   * @param {Object} req - Express request object with query.path
   * @param {Object} res - Express response object
   */
  getCentralDocumentation = catchAsync(async (req, res) => {
    const startTime = Date.now();
    const { path: docPath } = req.query;
    const validateLinks = req.query.validateLinks === 'true';
    
    if (!docPath) {
      throw createError(400, 'Documentation path is required');
    }
    
    this.logger.info(
      this.logger.response.business({
        message: 'Fetching central documentation',
        data: { path: docPath, validateLinks }
      }).withRequestDetails(req)
    );
    
    try {
      const fullPath = resolveDocPath(docPath);
      const content = await fs.readFile(fullPath, 'utf8');
      
      // Process markdown content (extract metadata and validate links if requested)
      const { metadata, content: processedContent } = extractMarkdownMetadata(content);
      
      // Validate links if requested
      let linkValidation = null;
      if (validateLinks) {
        const links = extractMarkdownLinks(processedContent);
        const validatedLinks = await Promise.all(
          links.map(async link => {
            const validation = await validateDocumentationLink(link.url, fullPath);
            return {
              ...link,
              valid: validation.isValid,
              type: validation.type,
              error: validation.isValid ? null : validation.error
            };
          })
        );
        
        linkValidation = {
          totalLinks: links.length,
          validLinks: validatedLinks.filter(link => link.valid).length,
          invalidLinks: validatedLinks.filter(link => !link.valid).length,
          links: validatedLinks
        };
      }
      
      // Check if client requested HTML format
      let responseContent = processedContent;
      let responseFormat = 'markdown';
      
      if (req.query.format === 'html') {
        responseContent = marked.parse(processedContent);
        responseFormat = 'html';
      }
      
      this.logger.info(
        this.logger.response.business({
          success: true,
          message: 'Central documentation retrieved successfully',
          data: { 
            path: docPath,
            validateLinks,
            linkStats: linkValidation ? 
              `${linkValidation.validLinks}/${linkValidation.totalLinks} valid links` : 
              undefined
          }
        }).withPerformanceMetrics({
          duration: Date.now() - startTime
        })
      );
      
      // Return detailed response if using API format
      if (req.query.responseType === 'json') {
        return res.status(200).json({
          content: responseContent,
          metadata,
          format: responseFormat,
          validation: linkValidation,
          path: docPath
        });
      }
      
      // Otherwise return raw content
      return res.status(200).type(responseFormat === 'html' ? 'html' : 'text/markdown').send(responseContent);
    } catch (error) {
      this.logger.error(
        this.logger.response.error({
          message: 'Error retrieving central documentation',
          error,
          data: { path: docPath }
        })
      );
      
      if (error.code === 'ENOENT') {
        throw createNotFoundError(`Documentation not found: ${docPath}`);
      }
      
      throw error;
    }
  });

  /**
   * Get documentation from application-specific directories
   * @param {Object} req - Express request object with query.path
   * @param {Object} res - Express response object
   */
  getAppSpecificDocumentation = catchAsync(async (req, res) => {
    const startTime = Date.now();
    const { path: docPath } = req.query;
    const validateLinks = req.query.validateLinks === 'true';
    
    if (!docPath) {
      throw createError(400, 'Documentation path is required');
    }
    
    this.logger.info(
      this.logger.response.business({
        message: 'Fetching application-specific documentation',
        data: { path: docPath, validateLinks }
      }).withRequestDetails(req)
    );
    
    try {
      const fullPath = resolveDocPath(docPath);
      const content = await fs.readFile(fullPath, 'utf8');
      
      // Process markdown content (extract metadata and validate links if requested)
      const { metadata, content: processedContent } = extractMarkdownMetadata(content);
      
      // Validate links if requested
      let linkValidation = null;
      if (validateLinks) {
        const links = extractMarkdownLinks(processedContent);
        const validatedLinks = await Promise.all(
          links.map(async link => {
            const validation = await validateDocumentationLink(link.url, fullPath);
            return {
              ...link,
              valid: validation.isValid,
              type: validation.type,
              error: validation.isValid ? null : validation.error
            };
          })
        );
        
        linkValidation = {
          totalLinks: links.length,
          validLinks: validatedLinks.filter(link => link.valid).length,
          invalidLinks: validatedLinks.filter(link => !link.valid).length,
          links: validatedLinks
        };
      }
      
      // Check if client requested HTML format
      let responseContent = processedContent;
      let responseFormat = 'markdown';
      
      if (req.query.format === 'html') {
        responseContent = marked.parse(processedContent);
        responseFormat = 'html';
      }
      
      this.logger.info(
        this.logger.response.business({
          success: true,
          message: 'Application-specific documentation retrieved successfully',
          data: { 
            path: docPath,
            validateLinks,
            linkStats: linkValidation ? 
              `${linkValidation.validLinks}/${linkValidation.totalLinks} valid links` : 
              undefined
          }
        }).withPerformanceMetrics({
          duration: Date.now() - startTime
        })
      );
      
      // Return detailed response if using API format
      if (req.query.responseType === 'json') {
        return res.status(200).json({
          content: responseContent,
          metadata,
          format: responseFormat,
          validation: linkValidation,
          path: docPath
        });
      }
      
      // Otherwise return raw content
      return res.status(200).type(responseFormat === 'html' ? 'html' : 'text/markdown').send(responseContent);
    } catch (error) {
      this.logger.error(
        this.logger.response.error({
          message: 'Error retrieving application-specific documentation',
          error,
          data: { path: docPath }
        })
      );
      
      if (error.code === 'ENOENT') {
        throw createNotFoundError(`Documentation not found: ${docPath}`);
      }
      
      throw error;
    }
  });

  /**
   * List documentation files by category
   * @param {Object} req - Express request object with query.category
   * @param {Object} res - Express response object
   */
  listDocumentationByCategory = catchAsync(async (req, res) => {
    const startTime = Date.now();
    const { category } = req.query;
    
    if (!category) {
      throw createError(400, 'Category is required');
    }
    
    this.logger.info(
      this.logger.response.business({
        message: 'Listing documentation by category',
        data: { category }
      }).withRequestDetails(req)
    );
    
    try {
      // Map category to directory path
      let searchPath;
      if (category === 'server') {
        searchPath = path.join(process.cwd(), 'app', 'server', 'docs', '**', '*.md');
      } else if (category === 'client') {
        searchPath = path.join(process.cwd(), 'app', 'client', 'src', 'docs', '**', '*.md');
      } else {
        searchPath = path.join(process.cwd(), '_dev', 'shared', 'guides', category, '**', '*.md');
      }
      
      // Use glob to find all markdown files in the category
      const files = await globPromise(searchPath);
      
      // Process each file to extract basic metadata
      const fileInfoPromises = files.map(async (filePath) => {
        try {
          const relPath = path.relative(process.cwd(), filePath).replace(/\\/g, '/');
          const content = await fs.readFile(filePath, 'utf8');
          
          // Extract metadata
          const { metadata, content: processedContent } = extractMarkdownMetadata(content);
          
          // Extract title from metadata or h1
          let title = metadata.title;
          if (!title) {
            const titleMatch = processedContent.match(/^#\s+(.+)$/m);
            title = titleMatch ? titleMatch[1] : path.basename(filePath, '.md');
          }
          
          // Extract summary from metadata or first paragraph
          let summary = metadata.summary;
          if (!summary) {
            const summaryMatch = processedContent.match(/^(?:(?!#).*\S.*\n)+/m);
            if (summaryMatch) {
              summary = summaryMatch[0].trim();
              if (summary.length > 150) {
                summary = summary.substring(0, 147) + '...';
              }
            }
          }
          
          return {
            path: relPath,
            title,
            summary,
            metadata,
            filename: path.basename(filePath),
            lastModified: (await fs.stat(filePath)).mtime
          };
        } catch (error) {
          this.logger.warn(
            this.logger.response.warning({
              message: 'Error processing documentation file',
              error,
              data: { filePath }
            })
          );
          
          return {
            path: path.relative(process.cwd(), filePath).replace(/\\/g, '/'),
            title: path.basename(filePath, '.md'),
            filename: path.basename(filePath),
            error: 'Error processing file'
          };
        }
      });
      
      const fileInfos = await Promise.all(fileInfoPromises);
      
      this.logger.info(
        this.logger.response.business({
          success: true,
          message: 'Documentation list retrieved successfully',
          data: { category, count: fileInfos.length }
        }).withPerformanceMetrics({
          duration: Date.now() - startTime
        })
      );
      
      return res.sendSuccess(fileInfos, 'Documentation list retrieved successfully');
    } catch (error) {
      this.logger.error(
        this.logger.response.error({
          message: 'Error listing documentation by category',
          error,
          data: { category }
        })
      );
      
      throw error;
    }
  });

  /**
   * Search documentation content
   * @param {Object} req - Express request object with query.query
   * @param {Object} res - Express response object
   */
  searchDocumentation = catchAsync(async (req, res) => {
    const startTime = Date.now();
    const { query } = req.query;
    
    if (!query) {
      throw createError(400, 'Search query is required');
    }
    
    this.logger.info(
      this.logger.response.business({
        message: 'Searching documentation',
        data: { query }
      }).withRequestDetails(req)
    );
    
    try {
      // First, find all markdown files
      const centralDocsPath = path.join(process.cwd(), '_dev', '**', '*.md');
      const serverDocsPath = path.join(process.cwd(), 'app', 'server', 'docs', '**', '*.md');
      const clientDocsPath = path.join(process.cwd(), 'app', 'client', 'src', 'docs', '**', '*.md');
      
      const [centralFiles, serverFiles, clientFiles] = await Promise.all([
        globPromise(centralDocsPath),
        globPromise(serverDocsPath),
        globPromise(clientDocsPath)
      ]);
      
      const allFiles = [...centralFiles, ...serverFiles, ...clientFiles];
      
      // Simple search implementation - read each file and check for content
      const results = [];
      for (const filePath of allFiles) {
        try {
          const content = await fs.readFile(filePath, 'utf8');
          
          if (content.toLowerCase().includes(query.toLowerCase())) {
            const relPath = path.relative(process.cwd(), filePath).replace(/\\/g, '/');
            
            // Extract metadata
            const { metadata, content: processedContent } = extractMarkdownMetadata(content);
            
            // Extract title from metadata or h1
            let title = metadata.title;
            if (!title) {
              const titleMatch = processedContent.match(/^#\s+(.+)$/m);
              title = titleMatch ? titleMatch[1] : path.basename(filePath, '.md');
            }
            
            // Extract context around the search term
            const lowerContent = content.toLowerCase();
            const queryIndex = lowerContent.indexOf(query.toLowerCase());
            const startIndex = Math.max(0, queryIndex - 50);
            const endIndex = Math.min(content.length, queryIndex + query.length + 100);
            const context = content.substring(startIndex, endIndex).replace(/\n/g, ' ');
            
            results.push({
              path: relPath,
              title,
              metadata,
              filename: path.basename(filePath),
              context,
              type: relPath.includes('_dev') ? 'central' : 
                    relPath.includes('server') ? 'server' : 'client'
            });
          }
        } catch (error) {
          this.logger.warn(
            this.logger.response.warning({
              message: 'Error searching documentation file',
              error,
              data: { filePath }
            })
          );
        }
      }
      
      this.logger.info(
        this.logger.response.business({
          success: true,
          message: 'Documentation search completed successfully',
          data: { query, count: results.length }
        }).withPerformanceMetrics({
          duration: Date.now() - startTime
        })
      );
      
      return res.sendSuccess(results, 'Documentation search completed successfully');
    } catch (error) {
      this.logger.error(
        this.logger.response.error({
          message: 'Error searching documentation',
          error,
          data: { query }
        })
      );
      
      throw error;
    }
  });
  
  /**
   * Validate links in a documentation file
   * @param {Object} req - Express request object with query.path
   * @param {Object} res - Express response object
   */
  validateDocumentationLinks = catchAsync(async (req, res) => {
    const startTime = Date.now();
    const { path: docPath } = req.query;
    
    if (!docPath) {
      throw createError(400, 'Documentation path is required');
    }
    
    this.logger.info(
      this.logger.response.business({
        message: 'Validating documentation links',
        data: { path: docPath }
      }).withRequestDetails(req)
    );
    
    try {
      const fullPath = resolveDocPath(docPath);
      const content = await fs.readFile(fullPath, 'utf8');
      
      // Extract links
      const links = extractMarkdownLinks(content);
      
      if (links.length === 0) {
        return res.sendSuccess({
          path: docPath,
          totalLinks: 0,
          message: 'No links found in document'
        }, 'No links found in document');
      }
      
      // Validate each link
      const validatedLinks = await Promise.all(
        links.map(async link => {
          const validation = await validateDocumentationLink(link.url, fullPath);
          return {
            text: link.text,
            url: link.url,
            valid: validation.isValid,
            type: validation.type,
            error: validation.isValid ? null : validation.error
          };
        })
      );
      
      // Group by valid/invalid
      const validLinks = validatedLinks.filter(link => link.valid);
      const invalidLinks = validatedLinks.filter(link => !link.valid);
      
      this.logger.info(
        this.logger.response.business({
          success: true,
          message: 'Documentation links validated successfully',
          data: { 
            path: docPath, 
            validCount: validLinks.length,
            invalidCount: invalidLinks.length,
            totalCount: links.length
          }
        }).withPerformanceMetrics({
          duration: Date.now() - startTime
        })
      );
      
      return res.sendSuccess({
        path: docPath,
        totalLinks: links.length,
        validLinks: validLinks.length,
        invalidLinks: invalidLinks.length,
        details: {
          valid: validLinks,
          invalid: invalidLinks
        }
      }, 'Documentation links validated successfully');
    } catch (error) {
      this.logger.error(
        this.logger.response.error({
          message: 'Error validating documentation links',
          error,
          data: { path: docPath }
        })
      );
      
      if (error.code === 'ENOENT') {
        throw createNotFoundError(`Documentation not found: ${docPath}`);
      }
      
      throw error;
    }
  });
}

// Create and export controller instance
const fileDocumentationController = new FileDocumentationController();
module.exports = fileDocumentationController;
