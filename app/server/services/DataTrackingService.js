const fs = require('fs').promises;
const path = require('path');
const { format } = require('date-fns');

class DataTrackingService {
    constructor() {
        this.logPath = path.join(__dirname, '../logs/data_tracking');
        this.initializeService();
    }

    async initializeService() {
        try {
            await fs.mkdir(this.logPath, { recursive: true });
        } catch (error) {
            console.error('Failed to initialize DataTrackingService:', error);
        }
    }

    /**
     * Log a data tracking event
     * @param {string} category - Category of tracking (auth, profile, system, etc.)
     * @param {string} action - Specific action being tracked
     * @param {Object} data - Data being tracked
     * @param {string} userId - Optional user ID
     */
    async logTracking(category, action, data, userId = null) {
        const timestamp = new Date();
        const logEntry = {
            timestamp: format(timestamp, 'yyyy-MM-dd HH:mm:ss'),
            category,
            action,
            userId,
            data
        };

        const fileName = `${format(timestamp, 'yyyy-MM-dd')}.log`;
        const logFile = path.join(this.logPath, fileName);

        try {
            await fs.appendFile(
                logFile,
                JSON.stringify(logEntry) + '\n',
                'utf8'
            );
        } catch (error) {
            console.error('Failed to log tracking data:', error);
        }
    }

    /**
     * Log authentication related events
     * @param {string} action - Auth action (login, register, etc.)
     * @param {Object} data - Auth related data
     * @param {string} userId - User ID if available
     */
    async logAuth(action, data, userId = null) {
        await this.logTracking('auth', action, data, userId);
    }

    /**
     * Log profile related events
     * @param {string} action - Profile action (update, view, etc.)
     * @param {Object} data - Profile related data
     * @param {string} userId - User ID
     */
    async logProfile(action, data, userId) {
        await this.logTracking('profile', action, data, userId);
    }

    /**
     * Log system related events
     * @param {string} action - System action (api_call, error, etc.)
     * @param {Object} data - System related data
     * @param {string} userId - Optional user ID
     */
    async logSystem(action, data, userId = null) {
        await this.logTracking('system', action, data, userId);
    }

    /**
     * Get logs for a specific date
     * @param {Date} date - Date to get logs for
     * @returns {Promise<Array>} Array of log entries
     */
    async getLogsByDate(date) {
        const fileName = `${format(date, 'yyyy-MM-dd')}.log`;
        const logFile = path.join(this.logPath, fileName);

        try {
            const content = await fs.readFile(logFile, 'utf8');
            return content
                .split('\n')
                .filter(line => line.trim())
                .map(line => JSON.parse(line));
        } catch (error) {
            if (error.code === 'ENOENT') {
                return [];
            }
            throw error;
        }
    }
}

module.exports = new DataTrackingService();
