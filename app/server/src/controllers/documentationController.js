const { Documentation, Role, User } = require('../models');
const { ValidationError } = require('sequelize');
const fs = require('fs').promises;
const path = require('path');
const { processMarkdownWithMetadata } = require('../utils/markdownProcessor');
const { catchAsync, createError, createNotFoundError } = require('../utils/errorHandler');
const logger = require('../utils/logger');
const documentationService = require('../services/documentationService');

// Base paths for documentation files
const DOC_PATHS = [
  path.join(__dirname, '../../docs'),
  path.join(__dirname, '../../../_dev/docs'),
  path.join(__dirname, '../../../_dev/docs/shared'),
];

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
        role_id: roleId,
        is_active: true 
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
      const filePath = path.join(DOCS_DIR, doc.file_path);
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
              filePath: doc.file_path
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
  /**
   * Get public documentation that requires no authentication
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  getPublicDocumentation = catchAsync(async (req, res) => {
    const startTime = Date.now();
    
    this.logger.info(
      this.logger.response.business({
        message: 'Fetching public documentation',
        data: {}
      }).withRequestDetails(req)
    );
    
    const docs = await Documentation.findAll({
      where: { 
        is_public: true,
        is_active: true 
      },
      order: [['order', 'ASC']],
      attributes: ['id', 'title', 'summary', 'category', 'updated_at']
    });

    this.logger.debug(
      this.logger.response.business({
        message: 'Found public documentation entries',
        data: { count: docs.length }
      })
    );

    // Process content for display
    const docsWithContent = await Promise.all(docs.map(async (doc) => {
      try {
        const filePath = path.join(DOCS_DIR, doc.file_path);
        const markdown = await fs.readFile(filePath, 'utf8');
        const { html, metadata } = processMarkdownWithMetadata(markdown);
        return {
          ...doc.toJSON(),
          content: html,
          metadata
        };
      } catch (error) {
        return {
          ...doc.toJSON(),
          content: '**Documentation content unavailable**',
          metadata: { error: 'Content not available' }
        };
      }
    }));

    this.logger.info(
      this.logger.response.business({
        success: true,
        message: 'Public documentation retrieved successfully',
        data: { count: docs.length }
      }).withPerformanceMetrics({
        duration: Date.now() - startTime
      })
    );

    return res.sendSuccess(
      docsWithContent,
      'Public documentation retrieved successfully'
    );
  });

  /**
   * Get documentation for the current authenticated user based on their role
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  getForCurrentUser = catchAsync(async (req, res) => {
    const startTime = Date.now();
    const { role } = req.user;
    
    this.logger.info(
      this.logger.response.business({
        message: 'Fetching documentation for current user',
        data: { role, userId: req.user.id }
      }).withRequestDetails(req)
    );
    
    // Get documentation appropriate for this user's role
    const userRoleInfo = await Role.findOne({ where: { name: role } });
    if (!userRoleInfo) {
      return res.sendNotFound('User role not found');
    }
    
    const docs = await Documentation.findAll({
      where: { 
        is_active: true,
        $or: [
          { is_public: true },
          { role_id: userRoleInfo.id }
        ]
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
        message: 'Found documentation entries for user',
        data: { role, count: docs.length }
      })
    );

    // Process content for display
    const docsWithContent = await Promise.all(docs.map(async (doc) => {
      try {
        const filePath = path.join(DOCS_DIR, doc.file_path);
        const markdown = await fs.readFile(filePath, 'utf8');
        const { html, metadata } = processMarkdownWithMetadata(markdown);
        return {
          ...doc.toJSON(),
          content: html,
          metadata
        };
      } catch (error) {
        return {
          ...doc.toJSON(),
          content: '**Documentation content unavailable**',
          metadata: { error: 'Content not available' }
        };
      }
    }));

    this.logger.info(
      this.logger.response.business({
        success: true,
        message: 'User documentation retrieved successfully',
        data: { role, count: docs.length }
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
   * Get documentation by specific ID with permission checks
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  getById = catchAsync(async (req, res) => {
    const startTime = Date.now();
    const { id } = req.params;
    
    this.logger.info(
      this.logger.response.business({
        message: 'Fetching documentation by ID',
        data: { id, userId: req.user.id }
      }).withRequestDetails(req)
    );
    
    const doc = await Documentation.findOne({
      where: { 
        id,
        is_active: true 
      },
      include: [{
        model: Role,
        as: 'role',
        attributes: ['name']
      }]
    });

    if (!doc) {
      return res.sendNotFound(`Documentation with ID ${id} not found`);
    }

    // Process content
    try {
      const filePath = path.join(DOCS_DIR, doc.file_path);
      const markdown = await fs.readFile(filePath, 'utf8');
      const { html, metadata } = processMarkdownWithMetadata(markdown);
      
      const result = {
        ...doc.toJSON(),
        content: html,
        metadata
      };

      this.logger.info(
        this.logger.response.business({
          success: true,
          message: 'Documentation retrieved successfully',
          data: { id }
        }).withPerformanceMetrics({
          duration: Date.now() - startTime
        })
      );

      return res.sendSuccess(
        result,
        'Documentation retrieved successfully'
      );
    } catch (error) {
      this.logger.error(
        this.logger.response.error({
          message: `Error reading documentation file`,
          error,
          data: { docId: doc.id, filePath: doc.file_path }
        })
      );
      
      return res.sendError(
        'Error retrieving documentation content',
        error.message
      );
    }
  });

  /**
   * Check if a user can access a specific documentation
   * Used by permission middleware for resource-specific checks
   * @param {Object} user - User object from request
   * @param {string} docId - Documentation ID
   * @returns {boolean} Whether user can access the documentation
   */
  canUserAccessDoc = async (user, docId) => {
    try {
      // Get user role information
      const userRole = await Role.findOne({ where: { name: user.role } });
      if (!userRole) return false;
      
      // Find the documentation
      const doc = await Documentation.findOne({ 
        where: { id: docId, is_active: true } 
      });
      
      if (!doc) return false;
      
      // Public docs are accessible to all authenticated users
      if (doc.is_public) return true;
      
      // Check if doc is accessible to user's role
      if (doc.role_id === userRole.id) return true;
      
      // Admin and developers have access to all docs
      if (['admin', 'developer'].includes(user.role)) return true;
      
      // User is the creator of the doc
      if (doc.created_by === user.id) return true;
      
      return false;
    } catch (error) {
      this.logger.error(
        this.logger.response.error({
          message: `Error checking document access`,
          error,
          data: { userId: user.id, docId }
        })
      );
      return false; // Fail closed - deny access on error
    }
  };

  /**
   * Get documentation specific to developers
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  getDeveloperDocs = catchAsync(async (req, res) => {
    const startTime = Date.now();
    
    this.logger.info(
      this.logger.response.business({
        message: 'Fetching developer documentation',
        data: { userId: req.user.id }
      }).withRequestDetails(req)
    );
    
    // Get developer role ID
    const developerRole = await Role.findOne({ where: { name: 'developer' } });
    if (!developerRole) {
      return res.sendNotFound('Developer role not found');
    }
    
    const docs = await Documentation.findAll({
      where: { 
        role_id: developerRole.id,
        is_active: true 
      },
      order: [['category', 'ASC'], ['order', 'ASC']],
      include: [{
        model: Role,
        as: 'role',
        attributes: ['name']
      }]
    });

    // Process content for display
    const docsWithContent = await Promise.all(docs.map(async (doc) => {
      try {
        const filePath = path.join(DOCS_DIR, doc.file_path);
        const markdown = await fs.readFile(filePath, 'utf8');
        const { html, metadata } = processMarkdownWithMetadata(markdown);
        return {
          ...doc.toJSON(),
          content: html,
          metadata
        };
      } catch (error) {
        return {
          ...doc.toJSON(),
          content: '**Documentation content unavailable**',
          metadata: { error: 'Content not available' }
        };
      }
    }));

    this.logger.info(
      this.logger.response.business({
        success: true,
        message: 'Developer documentation retrieved successfully',
        data: { count: docs.length }
      }).withPerformanceMetrics({
        duration: Date.now() - startTime
      })
    );

    return res.sendSuccess(
      docsWithContent,
      'Developer documentation retrieved successfully'
    );
  });

  /**
   * Get documentation specific to regular users
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  getUserDocs = catchAsync(async (req, res) => {
    const startTime = Date.now();
    
    this.logger.info(
      this.logger.response.business({
        message: 'Fetching user documentation',
        data: { userId: req.user.id }
      }).withRequestDetails(req)
    );
    
    // Get user role ID
    const userRole = await Role.findOne({ where: { name: 'user' } });
    if (!userRole) {
      return res.sendNotFound('User role not found');
    }
    
    const docs = await Documentation.findAll({
      where: { 
        role_id: userRole.id,
        is_active: true 
      },
      order: [['category', 'ASC'], ['order', 'ASC']],
      include: [{
        model: Role,
        as: 'role',
        attributes: ['name']
      }]
    });

    // Process content for display
    const docsWithContent = await Promise.all(docs.map(async (doc) => {
      try {
        const filePath = path.join(DOCS_DIR, doc.file_path);
        const markdown = await fs.readFile(filePath, 'utf8');
        const { html, metadata } = processMarkdownWithMetadata(markdown);
        return {
          ...doc.toJSON(),
          content: html,
          metadata
        };
      } catch (error) {
        return {
          ...doc.toJSON(),
          content: '**Documentation content unavailable**',
          metadata: { error: 'Content not available' }
        };
      }
    }));

    this.logger.info(
      this.logger.response.business({
        success: true,
        message: 'User documentation retrieved successfully',
        data: { count: docs.length }
      }).withPerformanceMetrics({
        duration: Date.now() - startTime
      })
    );

    return res.sendSuccess(
      docsWithContent,
      'User documentation retrieved successfully'
    );
  });

  /**
   * Get documentation specific to administrators
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  getAdminDocs = catchAsync(async (req, res) => {
    const startTime = Date.now();
    
    this.logger.info(
      this.logger.response.business({
        message: 'Fetching admin documentation',
        data: { userId: req.user.id }
      }).withRequestDetails(req)
    );
    
    // Get admin role ID
    const adminRole = await Role.findOne({ where: { name: 'admin' } });
    if (!adminRole) {
      return res.sendNotFound('Admin role not found');
    }
    
    const docs = await Documentation.findAll({
      where: { 
        role_id: adminRole.id,
        is_active: true 
      },
      order: [['category', 'ASC'], ['order', 'ASC']],
      include: [{
        model: Role,
        as: 'role',
        attributes: ['name']
      }]
    });

    // Process content for display
    const docsWithContent = await Promise.all(docs.map(async (doc) => {
      try {
        const filePath = path.join(DOCS_DIR, doc.file_path);
        const markdown = await fs.readFile(filePath, 'utf8');
        const { html, metadata } = processMarkdownWithMetadata(markdown);
        return {
          ...doc.toJSON(),
          content: html,
          metadata
        };
      } catch (error) {
        return {
          ...doc.toJSON(),
          content: '**Documentation content unavailable**',
          metadata: { error: 'Content not available' }
        };
      }
    }));

    this.logger.info(
      this.logger.response.business({
        success: true,
        message: 'Admin documentation retrieved successfully',
        data: { count: docs.length }
      }).withPerformanceMetrics({
        duration: Date.now() - startTime
      })
    );

    return res.sendSuccess(
      docsWithContent,
      'Admin documentation retrieved successfully'
    );
  });

  create = catchAsync(async (req, res) => {
    const startTime = Date.now();
    const { title, content, role_id, category, order, is_public } = req.body;
    
    this.logger.info(
      this.logger.response.business({
        message: 'Creating new documentation',
        data: { 
          title,
          role_id,
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
      file_path: fileName,
      role_id,
      category,
      order,
      created_by: req.user.id,
      updated_by: req.user.id
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
    const { title, content, role_id, category, order, is_active } = req.body;
    
    this.logger.info(
      this.logger.response.business({
        message: 'Updating documentation',
        data: { 
          id,
          title,
          role_id,
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
    let fileName = doc.file_path;
    if (title && title !== doc.title) {
      fileName = `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now()}.md`;
      
      this.logger.debug(
        this.logger.response.business({
          message: 'Generating new filename for documentation',
          data: { 
            id,
            oldFileName: doc.file_path,
            newFileName: fileName
          }
        })
      );
    }

    // Update the documentation entry
    await doc.update({
      title,
      file_path: fileName,
      role_id,
      category,
      order,
      is_active,
      updated_by: req.user.id
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
      if (fileName !== doc.file_path) {
        try {
          await fs.unlink(path.join(DOCS_DIR, doc.file_path));
          
          this.logger.debug(
            this.logger.response.business({
              message: 'Old documentation file deleted',
              data: { 
                oldFilePath: doc.file_path
              }
            })
          );
        } catch (error) {
          this.logger.warn(
            this.logger.response.error({
              message: 'Error deleting old documentation file',
              error,
              data: { 
                filePath: doc.file_path
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
      is_active: false,
      updated_by: req.user.id
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
    
    const oldPath = path.join(DOCS_DIR, doc.file_path);
    const newPath = path.join(archivePath, `${path.parse(doc.file_path).name}-archived-${Date.now()}.md`);
    
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
            filePath: doc.file_path
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
        is_active: true 
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
      const filePath = path.join(DOCS_DIR, doc.file_path);
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
              filePath: doc.file_path
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

  /**
   * Get markdown files from multiple locations in the codebase
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  getMarkdownFiles = catchAsync(async (req, res) => {
    const startTime = Date.now();
    
    this.logger.info(
      this.logger.response.business({
        message: 'Fetching markdown files from codebase',
        data: {}
      }).withRequestDetails(req)
    );
    
    const files = await documentationService.getDocFiles();
    
    this.logger.info(
      this.logger.response.business({
        success: true,
        message: 'Markdown files retrieved successfully',
        data: { count: files.length }
      }).withPerformanceMetrics({
        duration: Date.now() - startTime
      })
    );

    return res.sendSuccess(
      files,
      'Markdown files retrieved successfully'
    );
  });

  /**
   * Get content of a specific markdown file
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  getMarkdownFileContent = catchAsync(async (req, res) => {
    const startTime = Date.now();
    const { filePath } = req.params;
    
    this.logger.info(
      this.logger.response.business({
        message: 'Fetching markdown file content',
        data: { filePath }
      }).withRequestDetails(req)
    );
    
    try {
      const fileData = await documentationService.getDocFile(filePath);
      
      this.logger.info(
        this.logger.response.business({
          success: true,
          message: 'Markdown file retrieved successfully',
          data: { 
            filePath,
            title: fileData.title,
            size: fileData.size
          }
        }).withPerformanceMetrics({
          duration: Date.now() - startTime
        })
      );

      return res.sendSuccess(
        fileData,
        'Markdown file retrieved successfully'
      );
    } catch (error) {
      this.logger.error(
        this.logger.response.error({
          message: 'Error retrieving markdown file',
          error,
          data: { filePath }
        })
      );
      
      return res.sendError(
        error.message,
        404,
        'Markdown file not found'
      );
    }
  });

  /**
   * Save content to a markdown file
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  saveMarkdownFile = catchAsync(async (req, res) => {
    const startTime = Date.now();
    const { filePath } = req.params;
    const { content, frontMatter } = req.body;
    
    if (!content) {
      return res.sendError(
        'Content is required',
        400,
        'Invalid request'
      );
    }
    
    this.logger.info(
      this.logger.response.business({
        message: 'Saving markdown file content',
        data: { filePath }
      }).withRequestDetails(req)
    );
    
    try {
      const savedFile = await documentationService.saveDocFile(filePath, content, frontMatter);
      
      this.logger.info(
        this.logger.response.business({
          success: true,
          message: 'Markdown file saved successfully',
          data: { 
            filePath: savedFile.relativePath,
            size: savedFile.size
          }
        }).withPerformanceMetrics({
          duration: Date.now() - startTime
        })
      );

      return res.sendSuccess(
        savedFile,
        'Markdown file saved successfully'
      );
    } catch (error) {
      this.logger.error(
        this.logger.response.error({
          message: 'Error saving markdown file',
          error,
          data: { filePath }
        })
      );
      
      return res.sendError(
        error.message,
        500,
        'Failed to save markdown file'
      );
    }
  });
}

// Create and export controller instance
const documentationController = new DocumentationController();
module.exports = documentationController;
