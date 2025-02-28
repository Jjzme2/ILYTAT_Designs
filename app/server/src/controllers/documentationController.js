const { Documentation, Role } = require('../models');
const { ValidationError } = require('sequelize');
const fs = require('fs').promises;
const path = require('path');
const { processMarkdownWithMetadata } = require('../utils/markdownProcessor');

const DOCS_DIR = path.join(__dirname, '../../docs');

class DocumentationController {
  /**
   * Get all documentation entries for a specific role
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  getByRole = async (req, res) => {
    try {
      const { roleId } = req.params;
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
          console.error(`Error reading file ${filePath}:`, error);
          return {
            ...doc.toJSON(),
            content: '**Error: Documentation file not found**',
            metadata: { headers: [], lastProcessed: new Date().toISOString(), error: error.message }
          };
        }
      }));

      return res.status(200).json(docsWithContent);
    } catch (error) {
      console.error('Error in getByRole:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Create a new documentation entry
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  create = async (req, res) => {
    try {
      const { title, content, roleId, category, order } = req.body;
      
      // Validate markdown content by attempting to process it
      try {
        processMarkdownWithMetadata(content);
      } catch (error) {
        return res.status(400).json({ error: 'Invalid markdown content' });
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

      // Write the content to the file
      await fs.writeFile(filePath, content);

      // Process and return the created document with HTML
      const { html, metadata } = processMarkdownWithMetadata(content);
      return res.status(201).json({
        ...doc.toJSON(),
        content: html,
        metadata
      });
    } catch (error) {
      if (error instanceof ValidationError) {
        return res.status(400).json({ error: error.message });
      }
      console.error('Error in create:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Update an existing documentation entry
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  update = async (req, res) => {
    try {
      const { id } = req.params;
      const { title, content, roleId, category, order, isActive } = req.body;
      
      const doc = await Documentation.findByPk(id);
      if (!doc) {
        return res.status(404).json({ error: 'Documentation not found' });
      }

      // If content is provided, validate it
      if (content !== undefined) {
        try {
          processMarkdownWithMetadata(content);
        } catch (error) {
          return res.status(400).json({ error: 'Invalid markdown content' });
        }
      }

      // If title changed, generate a new filename
      let fileName = doc.filePath;
      if (title && title !== doc.title) {
        fileName = `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now()}.md`;
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

      // If content is provided, update the file
      if (content !== undefined) {
        const filePath = path.join(DOCS_DIR, fileName);
        await fs.writeFile(filePath, content);

        // If filename changed, delete the old file
        if (fileName !== doc.filePath) {
          try {
            await fs.unlink(path.join(DOCS_DIR, doc.filePath));
          } catch (error) {
            console.error('Error deleting old file:', error);
          }
        }
      }

      // Read and process the updated content
      const updatedContent = await fs.readFile(path.join(DOCS_DIR, fileName), 'utf8');
      const { html, metadata } = processMarkdownWithMetadata(updatedContent);

      return res.status(200).json({
        ...doc.toJSON(),
        content: html,
        metadata
      });
    } catch (error) {
      if (error instanceof ValidationError) {
        return res.status(400).json({ error: error.message });
      }
      console.error('Error in update:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Delete a documentation entry
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  delete = async (req, res) => {
    try {
      const { id } = req.params;
      const doc = await Documentation.findByPk(id);
      
      if (!doc) {
        return res.status(404).json({ error: 'Documentation not found' });
      }

      // Soft delete the database entry
      await doc.update({ 
        isActive: false,
        updatedBy: req.user.id
      });

      // Move the file to an archive folder instead of deleting it
      const archivePath = path.join(DOCS_DIR, 'archive');
      await fs.mkdir(archivePath, { recursive: true });
      
      const oldPath = path.join(DOCS_DIR, doc.filePath);
      const newPath = path.join(archivePath, `${path.parse(doc.filePath).name}-archived-${Date.now()}.md`);
      
      try {
        await fs.rename(oldPath, newPath);
      } catch (error) {
        console.error('Error archiving file:', error);
      }

      return res.status(200).json({ message: 'Documentation deleted successfully' });
    } catch (error) {
      console.error('Error in delete:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Get documentation by category
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  getByCategory = async (req, res) => {
    try {
      const { category } = req.params;
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
          console.error(`Error reading file ${filePath}:`, error);
          return {
            ...doc.toJSON(),
            content: '**Error: Documentation file not found**',
            metadata: { headers: [], lastProcessed: new Date().toISOString(), error: error.message }
          };
        }
      }));

      return res.status(200).json(docsWithContent);
    } catch (error) {
      console.error('Error in getByCategory:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
}

module.exports = new DocumentationController();
