const { Documentation, Role } = require('../models');
const { ValidationError } = require('sequelize');
const fs = require('fs').promises;
const path = require('path');
const { processMarkdownWithMetadata } = require('../utils/markdownProcessor');
const { catchAsync, createError, createNotFoundError } = require('../utils/errorHandler');
const logger = require('../utils/logger');

const DOCS_DIR = path.join(__dirname, '../../docs');

class DocumentationController {
  constructor() {
    this.logger = logger.child({ component: 'DocumentationController' });
  }

  /**
   * Get all documentation entries for a specific role
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  getByRole = catchAsync(async (req, res) => {
    const startTime = Date.now();
    const { roleId } = req.params;
    
    this.logger.info(
      this.logger.response.business({
        message: 'Fetching documentation by role',
        data: { roleId }
      }).withRequestDetails(req)
    );
    
    const docs = await Documentation.findAll({
      where: { 
        roleId,
        isActive: true 
      },
      order: [['order', 'ASC']],
      include: [{
        model: Role,
        as: 'role',
        attributes: ['name']
      }]
    });

    this.logger.debug(
      this.logger.response.business({
        message: 'Found documentation entries',
        data: { 
          roleId,
          count: docs.length
        }
      })
    );

    // Read and process content for each documentation
    const docsWithContent = await Promise.all(docs.map(async (doc) => {
      const filePath = path.join(DOCS_DIR, doc.filePath);
      try {
        const markdown = await fs.readFile(filePath, 'utf8');
        const { html, metadata } = processMarkdownWithMetadata(markdown);
        return {
          ...doc.toJSON(),
          content: html,
          metadata
        };
      } catch (error) {
        this.logger.error(
          this.logger.response.error({
            message: `Error reading documentation file`,
            error,
            data: { 
              docId: doc.id,
              filePath: doc.filePath
            }
          })
        );
        
        return {
          ...doc.toJSON(),
          content: '**Error: Documentation file not found**',
          metadata: { headers: [], lastProcessed: new Date().toISOString(), error: error.message }
        };
      }
    }));

    this.logger.info(
      this.logger.response.business({
        success: true,
        message: 'Documentation retrieved successfully',
        data: { 
          roleId,
          count: docs.length
        }
      }).withPerformanceMetrics({
        duration: Date.now() - startTime
      })
    );

    return res.sendSuccess(
      docsWithContent,
      'Documentation retrieved successfully'
    );
  });

  /**
   * Create a new documentation entry
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  create = catchAsync(async (req, res) => {
    const startTime = Date.now();
    const { title, content, roleId, category, order } = req.body;
    
    this.logger.info(
      this.logger.response.business({
        message: 'Creating new documentation',
        data: { 
          title,
          roleId,
          category,
          userId: req.user.id
        }
      }).withRequestDetails(req)
    );
    
    // Validate markdown content by attempting to process it
    try {
      processMarkdownWithMetadata(content);
    } catch (error) {
      this.logger.warn(
        this.logger.response.validation({
          success: false,
          message: 'Invalid markdown content',
          error,
          data: { title }
        })
      );
      
      return res.sendValidationError('Invalid markdown content');
    }

    // Generate a unique filename based on the title
    const fileName = `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now()}.md`;
    const filePath = path.join(DOCS_DIR, fileName);

    // Create the documentation entry
    const doc = await Documentation.create({
      title,
      filePath: fileName,
      roleId,
      category,
      order,
      createdBy: req.user.id,
      updatedBy: req.user.id
    });

    this.logger.debug(
      this.logger.response.business({
        message: 'Documentation entry created in database',
        data: { 
          id: doc.id,
          title: doc.title,
          fileName
        }
      })
    );

    // Write the content to the file
    await fs.writeFile(filePath, content);

    // Process and return the created document with HTML
    const { html, metadata } = processMarkdownWithMetadata(content);
    
    this.logger.info(
      this.logger.response.business({
        success: true,
        message: 'Documentation created successfully',
        data: { 
          id: doc.id,
          title: doc.title,
          category: doc.category
        }
      }).withPerformanceMetrics({
        duration: Date.now() - startTime
      })
    );

    return res.sendCreated(
      {
        ...doc.toJSON(),
        content: html,
        metadata
      },
      'Documentation created successfully'
    );
  });

  /**
   * Update an existing documentation entry
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  update = catchAsync(async (req, res) => {
    const startTime = Date.now();
    const { id } = req.params;
    const { title, content, roleId, category, order, isActive } = req.body;
    
    this.logger.info(
      this.logger.response.business({
        message: 'Updating documentation',
        data: { 
          id,
          title,
          roleId,
          category,
          userId: req.user.id
        }
      }).withRequestDetails(req)
    );
    
    const doc = await Documentation.findByPk(id);
    if (!doc) {
      this.logger.warn(
        this.logger.response.notFound({
          message: 'Documentation not found',
          data: { id }
        })
      );
      
      throw createNotFoundError('Documentation', id, 'Documentation not found');
    }

    // If content is provided, validate it
    if (content !== undefined) {
      try {
        processMarkdownWithMetadata(content);
      } catch (error) {
        this.logger.warn(
          this.logger.response.validation({
            success: false,
            message: 'Invalid markdown content',
            error,
            data: { id, title }
          })
        );
        
        return res.sendValidationError('Invalid markdown content');
      }
    }

    // If title changed, generate a new filename
    let fileName = doc.filePath;
    if (title && title !== doc.title) {
      fileName = `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now()}.md`;
      
      this.logger.debug(
        this.logger.response.business({
          message: 'Generating new filename for documentation',
          data: { 
            id,
            oldFileName: doc.filePath,
            newFileName: fileName
          }
        })
      );
    }

    // Update the documentation entry
    await doc.update({
      title,
      filePath: fileName,
      roleId,
      category,
      order,
      isActive,
      updatedBy: req.user.id
    });

    this.logger.debug(
      this.logger.response.business({
        message: 'Documentation entry updated in database',
        data: { 
          id: doc.id,
          title: doc.title,
          fileName
        }
      })
    );

    // If content is provided, update the file
    if (content !== undefined) {
      const filePath = path.join(DOCS_DIR, fileName);
      await fs.writeFile(filePath, content);

      // If filename changed, delete the old file
      if (fileName !== doc.filePath) {
        try {
          await fs.unlink(path.join(DOCS_DIR, doc.filePath));
          
          this.logger.debug(
            this.logger.response.business({
              message: 'Old documentation file deleted',
              data: { 
                oldFilePath: doc.filePath
              }
            })
          );
        } catch (error) {
          this.logger.warn(
            this.logger.response.error({
              message: 'Error deleting old documentation file',
              error,
              data: { 
                filePath: doc.filePath
              }
            })
          );
        }
      }
    }

    // Read and process the updated content
    const updatedContent = await fs.readFile(path.join(DOCS_DIR, fileName), 'utf8');
    const { html, metadata } = processMarkdownWithMetadata(updatedContent);

    this.logger.info(
      this.logger.response.business({
        success: true,
        message: 'Documentation updated successfully',
        data: { 
          id: doc.id,
          title: doc.title,
          category: doc.category
        }
      }).withPerformanceMetrics({
        duration: Date.now() - startTime
      })
    );

    return res.sendSuccess(
      {
        ...doc.toJSON(),
        content: html,
        metadata
      },
      'Documentation updated successfully'
    );
  });

  /**
   * Delete a documentation entry
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  delete = catchAsync(async (req, res) => {
    const startTime = Date.now();
    const { id } = req.params;
    
    this.logger.info(
      this.logger.response.business({
        message: 'Deleting documentation',
        data: { 
          id,
          userId: req.user.id
        }
      }).withRequestDetails(req)
    );
    
    const doc = await Documentation.findByPk(id);
    
    if (!doc) {
      this.logger.warn(
        this.logger.response.notFound({
          message: 'Documentation not found',
          data: { id }
        })
      );
      
      throw createNotFoundError('Documentation', id, 'Documentation not found');
    }

    // Soft delete the database entry
    await doc.update({ 
      isActive: false,
      updatedBy: req.user.id
    });

    this.logger.debug(
      this.logger.response.business({
        message: 'Documentation soft deleted in database',
        data: { 
          id: doc.id,
          title: doc.title
        }
      })
    );

    // Move the file to an archive folder instead of deleting it
    const archivePath = path.join(DOCS_DIR, 'archive');
    await fs.mkdir(archivePath, { recursive: true });
    
    const oldPath = path.join(DOCS_DIR, doc.filePath);
    const newPath = path.join(archivePath, `${path.parse(doc.filePath).name}-archived-${Date.now()}.md`);
    
    try {
      await fs.rename(oldPath, newPath);
      
      this.logger.debug(
        this.logger.response.business({
          message: 'Documentation file archived',
          data: { 
            oldPath,
            newPath
          }
        })
      );
    } catch (error) {
      this.logger.warn(
        this.logger.response.error({
          message: 'Error archiving documentation file',
          error,
          data: { 
            filePath: doc.filePath
          }
        })
      );
    }

    this.logger.info(
      this.logger.response.business({
        success: true,
        message: 'Documentation deleted successfully',
        data: { 
          id: doc.id,
          title: doc.title
        }
      }).withPerformanceMetrics({
        duration: Date.now() - startTime
      })
    );

    return res.sendSuccess(
      { id: doc.id },
      'Documentation deleted successfully'
    );
  });

  /**
   * Get documentation by category
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  getByCategory = catchAsync(async (req, res) => {
    const startTime = Date.now();
    const { category } = req.params;
    
    this.logger.info(
      this.logger.response.business({
        message: 'Fetching documentation by category',
        data: { category }
      }).withRequestDetails(req)
    );
    
    const docs = await Documentation.findAll({
      where: { 
        category,
        isActive: true 
      },
      order: [['order', 'ASC']],
      include: [{
        model: Role,
        as: 'role',
        attributes: ['name']
      }]
    });

    this.logger.debug(
      this.logger.response.business({
        message: 'Found documentation entries by category',
        data: { 
          category,
          count: docs.length
        }
      })
    );

    // Read and process content for each documentation
    const docsWithContent = await Promise.all(docs.map(async (doc) => {
      const filePath = path.join(DOCS_DIR, doc.filePath);
      try {
        const markdown = await fs.readFile(filePath, 'utf8');
        const { html, metadata } = processMarkdownWithMetadata(markdown);
        return {
          ...doc.toJSON(),
          content: html,
          metadata
        };
      } catch (error) {
        this.logger.error(
          this.logger.response.error({
            message: `Error reading documentation file`,
            error,
            data: { 
              docId: doc.id,
              filePath: doc.filePath
            }
          })
        );
        
        return {
          ...doc.toJSON(),
          content: '**Error: Documentation file not found**',
          metadata: { headers: [], lastProcessed: new Date().toISOString(), error: error.message }
        };
      }
    }));

    this.logger.info(
      this.logger.response.business({
        success: true,
        message: 'Documentation retrieved by category successfully',
        data: { 
          category,
          count: docs.length
        }
      }).withPerformanceMetrics({
        duration: Date.now() - startTime
      })
    );

    return res.sendSuccess(
      docsWithContent,
      'Documentation retrieved successfully'
    );
  });
}

module.exports = new DocumentationController();
