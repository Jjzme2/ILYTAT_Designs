const path = require('path');

const config = {
    // Base configuration
    base: {
        service: 'ilytat-designs-api',
        logsDir: path.join(__dirname, '../../../logs'),
        maxSize: '20m',
        maxFiles: '14d',
        zippedArchive: true,
        datePattern: 'YYYY-MM-DD'
    },

    // Log retention configuration
    retention: {
        emergency: '30d',
        error: '14d',
        combined: '7d',
        performance: '7d'
    },

    // Performance monitoring thresholds
    performance: {
        slowQueryThreshold: 1000, // ms
        highMemoryThreshold: 1024 * 1024 * 1024, // 1GB
        highCpuThreshold: 80, // percentage
        slowResponseThreshold: 2000 // ms
    },

    // Security logging configuration
    security: {
        sensitiveFields: [
            'password',
            'token',
            'authorization',
            'cookie',
            'secret',
            'key'
        ],
        maxAuthFailures: 5,
        suspiciousIpThreshold: 100 // requests per minute
    },

    // Environment-specific configurations
    environments: {
        development: {
            level: 'debug',
            console: {
                enabled: true,
                colorize: true
            }
        },
        test: {
            level: 'debug',
            console: {
                enabled: true,
                colorize: false
            }
        },
        production: {
            level: 'info',
            console: {
                enabled: false
            }
        }
    }
};

module.exports = config;
