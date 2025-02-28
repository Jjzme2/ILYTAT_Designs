const logger = require('../baseLogger');
const BaseFactory = require('./BaseFactory');
const { performance } = require('perf_hooks');
const os = require('os');

class LogFactory extends BaseFactory {
    static #maskSensitiveData(data) {
        const sensitiveFields = [
            'password', 'token', 'secret', 'key', 'authorization',
            'creditCard', 'ssn', 'email'
        ];

        const maskedData = { ...data };
        
        const maskValue = (obj) => {
            for (const key in obj) {
                if (typeof obj[key] === 'object' && obj[key] !== null) {
                    maskValue(obj[key]);
                } else if (sensitiveFields.some(field => 
                    key.toLowerCase().includes(field.toLowerCase()))) {
                    obj[key] = '[REDACTED]';
                }
            }
        };

        maskValue(maskedData);
        return maskedData;
    }

    static createApiLog(req, metadata = {}) {
        const enrichedMetadata = this.enrichBaseMetadata(metadata);
        return {
            type: 'API_REQUEST',
            method: req.method,
            url: req.originalUrl,
            headers: this.#maskSensitiveData(req.headers),
            query: req.query,
            body: this.#maskSensitiveData(req.body),
            userId: req.user?.id,
            ip: req.ip,
            userAgent: req.get('user-agent'),
            ...enrichedMetadata
        };
    }

    static createPerformanceLog(metricName, value, metadata = {}) {
        const enrichedMetadata = this.enrichBaseMetadata(metadata);
        return {
            type: 'PERFORMANCE_METRIC',
            metric: metricName,
            value,
            ...enrichedMetadata
        };
    }

    static createSecurityLog(event, metadata = {}) {
        const enrichedMetadata = this.enrichBaseMetadata(metadata);
        return {
            type: 'SECURITY',
            event,
            severity: metadata.severity || 'info',
            ip: metadata.ip,
            userId: metadata.userId,
            action: metadata.action,
            resource: metadata.resource,
            outcome: metadata.outcome,
            ...enrichedMetadata
        };
    }

    static createDatabaseLog(query, duration, result, metadata = {}) {
        const enrichedMetadata = this.enrichBaseMetadata(metadata);
        return {
            type: 'DATABASE',
            query: this.#maskSensitiveData({
                sql: query.sql,
                parameters: query.bindings
            }),
            duration,
            rowCount: Array.isArray(result) ? result.length : null,
            success: metadata.success !== false,
            ...enrichedMetadata
        };
    }

    static createBusinessLog(action, data, metadata = {}) {
        const enrichedMetadata = this.enrichBaseMetadata(metadata);
        return {
            type: 'BUSINESS',
            action,
            data: this.#maskSensitiveData(data),
            status: metadata.status || 'success',
            ...enrichedMetadata
        };
    }

    static createAuditLog(action, before, after, metadata = {}) {
        const enrichedMetadata = this.enrichBaseMetadata(metadata);
        return {
            type: 'AUDIT',
            action,
            resource: metadata.resource,
            resourceId: metadata.resourceId,
            changes: {
                before: this.#maskSensitiveData(before),
                after: this.#maskSensitiveData(after)
            },
            userId: metadata.userId,
            ...enrichedMetadata
        };
    }
}

module.exports = LogFactory;
