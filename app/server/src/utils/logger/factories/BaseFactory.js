const os = require('os');

class BaseFactory {
    static enrichBaseMetadata(metadata = {}) {
        const correlationId = require('cls-hooked')
            .getNamespace('request-context')
            ?.get('correlationId');

        return {
            ...metadata,
            correlationId,
            timestamp: new Date().toISOString(),
            hostname: os.hostname(),
            pid: process.pid,
            memory: process.memoryUsage(),
            uptime: process.uptime()
        };
    }

    static maskSensitiveData(data) {
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
}

module.exports = BaseFactory;
