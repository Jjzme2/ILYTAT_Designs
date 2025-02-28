const { Sequelize } = require('sequelize');
const os = require('os');
const database = require('../../services/database');

class HealthService {
  constructor() {
    this.startTime = Date.now();
  }

  /**
   * Get system health metrics
   * @returns {Promise<Object>} Health metrics
   */
  async getHealthMetrics() {
    const [dbHealth, systemHealth, memoryHealth] = await Promise.all([
      this.checkDatabaseHealth(),
      this.checkSystemHealth(),
      this.checkMemoryHealth()
    ]);

    const status = this.calculateOverallStatus([
      dbHealth.status,
      systemHealth.status,
      memoryHealth.status
    ]);

    return {
      status,
      timestamp: new Date().toISOString(),
      uptime: this.getUptime(),
      checks: {
        database: dbHealth,
        system: systemHealth,
        memory: memoryHealth
      }
    };
  }

  /**
   * Check database health
   * @returns {Promise<Object>} Database health metrics
   */
  async checkDatabaseHealth() {
    try {
      const startTime = process.hrtime();
      await database.authenticate();
      const [seconds, nanoseconds] = process.hrtime(startTime);
      const responseTime = (seconds * 1000 + nanoseconds / 1000000).toFixed(2);

      return {
        status: 'healthy',
        responseTime: `${responseTime}ms`,
        connection: 'established'
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        connection: 'failed'
      };
    }
  }

  /**
   * Check system health
   * @returns {Promise<Object>} System health metrics
   */
  async checkSystemHealth() {
    try {
      const cpuLoad = await this.getCPULoad();
      const cpuUsage = process.cpuUsage();
      
      return {
        status: 'healthy',
        cpu: {
          load: cpuLoad,
          cores: os.cpus().length,
          model: os.cpus()[0].model,
          usage: {
            user: cpuUsage.user,
            system: cpuUsage.system
          }
        },
        platform: {
          type: os.type(),
          platform: os.platform(),
          arch: os.arch(),
          release: os.release()
        }
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message
      };
    }
  }

  /**
   * Check memory health
   * @returns {Promise<Object>} Memory health metrics
   */
  async checkMemoryHealth() {
    try {
      const totalMemory = os.totalmem();
      const freeMemory = os.freemem();
      const usedMemory = totalMemory - freeMemory;
      const memoryUsagePercent = ((usedMemory / totalMemory) * 100).toFixed(2);

      const processMemory = process.memoryUsage();
      
      return {
        status: this.getMemoryStatus(memoryUsagePercent),
        system: {
          total: this.formatBytes(totalMemory),
          free: this.formatBytes(freeMemory),
          used: this.formatBytes(usedMemory),
          usagePercent: `${memoryUsagePercent}%`
        },
        process: {
          heapTotal: this.formatBytes(processMemory.heapTotal),
          heapUsed: this.formatBytes(processMemory.heapUsed),
          rss: this.formatBytes(processMemory.rss),
          external: this.formatBytes(processMemory.external)
        }
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message
      };
    }
  }

  /**
   * Calculate CPU load
   * @returns {Promise<number>} CPU load percentage
   */
  getCPULoad() {
    return new Promise((resolve) => {
      const startMeasure = os.cpus();
      setTimeout(() => {
        const endMeasure = os.cpus();
        const idleDifference = endMeasure.reduce((acc, cpu, index) => {
          return acc + (cpu.times.idle - startMeasure[index].times.idle);
        }, 0);
        const totalDifference = endMeasure.reduce((acc, cpu, index) => {
          const startTotal = Object.values(startMeasure[index].times).reduce((a, b) => a + b);
          const endTotal = Object.values(cpu.times).reduce((a, b) => a + b);
          return acc + (endTotal - startTotal);
        }, 0);
        resolve(((1 - idleDifference / totalDifference) * 100).toFixed(2));
      }, 100);
    });
  }

  /**
   * Format bytes to human readable format
   * @param {number} bytes
   * @returns {string} Formatted string
   */
  formatBytes(bytes) {
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 Bytes';
    const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
    return Math.round(bytes / Math.pow(1024, i), 2) + ' ' + sizes[i];
  }

  /**
   * Get memory status based on usage percentage
   * @param {number} usagePercent
   * @returns {string} Status
   */
  getMemoryStatus(usagePercent) {
    if (usagePercent > 90) return 'critical';
    if (usagePercent > 75) return 'warning';
    return 'healthy';
  }

  /**
   * Calculate overall status based on component statuses
   * @param {Array<string>} statuses
   * @returns {string} Overall status
   */
  calculateOverallStatus(statuses) {
    if (statuses.includes('critical')) return 'critical';
    if (statuses.includes('unhealthy')) return 'unhealthy';
    if (statuses.includes('warning')) return 'warning';
    return 'healthy';
  }

  /**
   * Get system uptime
   * @returns {string} Formatted uptime
   */
  getUptime() {
    const uptime = Date.now() - this.startTime;
    const days = Math.floor(uptime / (24 * 60 * 60 * 1000));
    const hours = Math.floor((uptime % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
    const minutes = Math.floor((uptime % (60 * 60 * 1000)) / (60 * 1000));
    const seconds = Math.floor((uptime % (60 * 1000)) / 1000);
    
    return `${days}d ${hours}h ${minutes}m ${seconds}s`;
  }
}

module.exports = new HealthService();
