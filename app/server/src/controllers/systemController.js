/**
 * System Controller
 * Provides endpoints for system health monitoring, logs, and performance metrics
 * with role-based access control
 * @module controllers/systemController
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { sequelize } = require('../models');
const logger = require('../utils/logger');

/**
 * Get basic system health status (public access)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} Basic health information
 */
const getHealthStatus = async (req, res) => {
  try {
    // Check database connection with minimal info
    await sequelize.authenticate();
    
    const healthData = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development'
    };

    return res.status(200).json({ success: true, data: healthData });
  } catch (error) {
    logger.error('Health check failed:', error);
    return res.status(500).json({ 
      success: false, 
      status: 'unhealthy',
      message: 'System health check failed'
    });
  }
};

/**
 * Get health summary for authenticated users
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} Summary health information
 */
const getHealthSummary = async (req, res) => {
  try {
    // Check database connection
    await sequelize.authenticate();
    
    const healthData = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      systemLoad: os.loadavg()[0].toFixed(2),  // 1 minute load average
      memoryUsage: {
        free: Math.round(os.freemem() / 1024 / 1024) + ' MB',
        total: Math.round(os.totalmem() / 1024 / 1024) + ' MB',
        percentFree: Math.round((os.freemem() / os.totalmem()) * 100) + '%'
      }
    };

    return res.status(200).json({ success: true, data: healthData });
  } catch (error) {
    logger.error('Health summary check failed:', error);
    return res.status(500).json({ 
      success: false, 
      status: 'unhealthy',
      message: 'System health summary check failed',
      error: process.env.NODE_ENV === 'production' ? null : error.message
    });
  }
};

/**
 * Get detailed system health information (developers and admins)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} Detailed health information
 */
const getDetailedHealth = async (req, res) => {
  try {
    // Check database connection
    await sequelize.authenticate();
    
    // Gather extensive system information
    const detailedHealth = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      system: {
        platform: process.platform,
        nodeVersion: process.version,
        memoryUsage: process.memoryUsage(),
        cpuUsage: process.cpuUsage(),
        os: {
          type: os.type(),
          release: os.release(),
          totalMemory: os.totalmem(),
          freeMemory: os.freemem(),
          loadAverage: os.loadavg(),
          cpus: os.cpus().length
        }
      },
      database: {
        connected: true,
        dialect: sequelize.getDialect(),
        name: sequelize.getDatabaseName()
      },
      process: {
        pid: process.pid,
        title: process.title,
        arch: process.arch,
        versions: process.versions
      }
    };

    return res.status(200).json({ success: true, data: detailedHealth });
  } catch (error) {
    logger.error('Detailed health check failed:', error);
    return res.status(500).json({ 
      success: false, 
      status: 'unhealthy',
      message: 'System detailed health check failed',
      error: process.env.NODE_ENV === 'production' ? null : error.message
    });
  }
};

/**
 * Get performance metrics (developers and admins)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} Performance metrics
 */
const getPerformanceMetrics = async (req, res) => {
  try {
    const startTime = process.hrtime();
    await sequelize.query('SELECT 1+1 as result');
    const dbQueryTime = process.hrtime(startTime);
    const dbQueryTimeMs = Math.round((dbQueryTime[0] * 1000) + (dbQueryTime[1] / 1000000));
    
    const performanceData = {
      timestamp: new Date().toISOString(),
      memoryUsage: {
        rss: Math.round(process.memoryUsage().rss / 1024 / 1024) + ' MB',
        heapTotal: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + ' MB', 
        heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB',
        external: Math.round(process.memoryUsage().external / 1024 / 1024) + ' MB',
      },
      cpuUsage: process.cpuUsage(),
      loadAverage: os.loadavg(),
      uptime: process.uptime(),
      databaseResponseTime: dbQueryTimeMs + ' ms'
    };
    
    return res.status(200).json({ success: true, data: performanceData });
  } catch (error) {
    logger.error('Performance metrics check failed:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to retrieve performance metrics',
      error: process.env.NODE_ENV === 'production' ? null : error.message
    });
  }
};

/**
 * Get memory usage details (developers and admins)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} Memory usage details
 */
const getMemoryUsage = async (req, res) => {
  try {
    const formatMemory = (bytes) => {
      return {
        bytes,
        kb: Math.round(bytes / 1024),
        mb: Math.round(bytes / 1024 / 1024),
        gb: (bytes / 1024 / 1024 / 1024).toFixed(2)
      };
    };
    
    const memUsage = process.memoryUsage();
    const memoryData = {
      timestamp: new Date().toISOString(),
      process: {
        rss: formatMemory(memUsage.rss),
        heapTotal: formatMemory(memUsage.heapTotal),
        heapUsed: formatMemory(memUsage.heapUsed),
        external: formatMemory(memUsage.external),
        arrayBuffers: formatMemory(memUsage.arrayBuffers || 0)
      },
      system: {
        total: formatMemory(os.totalmem()),
        free: formatMemory(os.freemem()),
        used: formatMemory(os.totalmem() - os.freemem()),
        percentUsed: ((os.totalmem() - os.freemem()) / os.totalmem() * 100).toFixed(2) + '%'
      }
    };
    
    return res.status(200).json({ success: true, data: memoryData });
  } catch (error) {
    logger.error('Memory usage check failed:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to retrieve memory usage',
      error: process.env.NODE_ENV === 'production' ? null : error.message
    });
  }
};

/**
 * Get system logs (admin only)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} System logs
 */
const getLogs = async (req, res) => {
  try {
    const { limit = 100, type = 'application' } = req.query;
    
    // Define log file paths based on type
    const logPaths = {
      application: path.join(process.cwd(), 'logs', 'app.log'),
      error: path.join(process.cwd(), 'logs', 'error.log'),
      access: path.join(process.cwd(), 'logs', 'access.log')
    };
    
    // Check if requested log type exists
    if (!logPaths[type]) {
      return res.status(400).json({
        success: false,
        message: `Invalid log type: ${type}`
      });
    }
    
    // Check if log file exists
    if (!fs.existsSync(logPaths[type])) {
      return res.status(404).json({
        success: false,
        message: `Log file not found: ${type}`
      });
    }
    
    // Read logs (most recent entries)
    const data = fs.readFileSync(logPaths[type], 'utf8');
    const lines = data.split('\n').filter(line => line.trim() !== '');
    const logs = lines.slice(-limit).map(line => {
      try {
        return JSON.parse(line);
      } catch (e) {
        return { raw: line };
      }
    });
    
    return res.status(200).json({
      success: true,
      data: {
        type,
        count: logs.length,
        logs
      }
    });
  } catch (error) {
    logger.error('Error retrieving logs:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to retrieve system logs',
      error: process.env.NODE_ENV === 'production' ? null : error.message
    });
  }
};

/**
 * Get error logs (admin only)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} Error logs
 */
const getErrorLogs = async (req, res) => {
  try {
    const { limit = 100 } = req.query;
    const errorLogPath = path.join(process.cwd(), 'logs', 'error.log');
    
    if (!fs.existsSync(errorLogPath)) {
      return res.status(404).json({
        success: false,
        message: 'Error log file not found'
      });
    }
    
    const data = fs.readFileSync(errorLogPath, 'utf8');
    const lines = data.split('\n').filter(line => line.trim() !== '');
    const logs = lines.slice(-limit).map(line => {
      try {
        return JSON.parse(line);
      } catch (e) {
        return { raw: line };
      }
    });
    
    return res.status(200).json({
      success: true,
      data: {
        type: 'error',
        count: logs.length,
        logs
      }
    });
  } catch (error) {
    logger.error('Error retrieving error logs:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to retrieve error logs',
      error: process.env.NODE_ENV === 'production' ? null : error.message
    });
  }
};

/**
 * Get access logs (admin only)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} Access logs
 */
const getAccessLogs = async (req, res) => {
  try {
    const { limit = 100 } = req.query;
    const accessLogPath = path.join(process.cwd(), 'logs', 'access.log');
    
    if (!fs.existsSync(accessLogPath)) {
      return res.status(404).json({
        success: false,
        message: 'Access log file not found'
      });
    }
    
    const data = fs.readFileSync(accessLogPath, 'utf8');
    const lines = data.split('\n').filter(line => line.trim() !== '');
    const logs = lines.slice(-limit).map(line => {
      try {
        return JSON.parse(line);
      } catch (e) {
        return { raw: line };
      }
    });
    
    return res.status(200).json({
      success: true,
      data: {
        type: 'access',
        count: logs.length,
        logs
      }
    });
  } catch (error) {
    logger.error('Error retrieving access logs:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to retrieve access logs',
      error: process.env.NODE_ENV === 'production' ? null : error.message
    });
  }
};

/**
 * Get system statistics (admin only)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} System statistics
 */
const getSystemStats = async (req, res) => {
  try {
    // This would typically gather statistics from various sources
    // For example: database stats, cache stats, request stats, etc.
    
    const stats = {
      timestamp: new Date().toISOString(),
      system: {
        uptime: process.uptime(),
        processStartTime: new Date(Date.now() - (process.uptime() * 1000)).toISOString(),
        nodeVersion: process.version,
        hostname: os.hostname(),
        platform: process.platform,
        arch: process.arch,
        cpus: os.cpus().length
      },
      // You would add more statistics here from your monitoring system
      // This is just a placeholder
    };
    
    return res.status(200).json({ success: true, data: stats });
  } catch (error) {
    logger.error('Error retrieving system stats:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to retrieve system statistics',
      error: process.env.NODE_ENV === 'production' ? null : error.message
    });
  }
};

module.exports = {
  getHealthStatus,
  getHealthSummary,
  getDetailedHealth,
  getPerformanceMetrics,
  getMemoryUsage,
  getLogs,
  getErrorLogs,
  getAccessLogs,
  getSystemStats
};
