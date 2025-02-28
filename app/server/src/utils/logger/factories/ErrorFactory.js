const logger = require('../baseLogger');
const BaseFactory = require('./BaseFactory');

class ErrorFactory extends BaseFactory {
    static createError(message, code, metadata = {}) {
        const error = new Error(message);
        error.code = code;
        error.metadata = this.enrichBaseMetadata(metadata);
        return error;
    }

    static createValidationError(validationErrors, metadata = {}) {
        const error = this.createError('Validation failed', 'VALIDATION_ERROR', metadata);
        error.validationErrors = validationErrors;
        return error;
    }

    static createDatabaseError(operation, originalError, metadata = {}) {
        const error = this.createError(
            `Database operation '${operation}' failed: ${originalError.message}`,
            'DATABASE_ERROR',
            metadata
        );
        error.originalError = originalError;
        return error;
    }

    static createAuthenticationError(message = 'Authentication failed', metadata = {}) {
        return this.createError(message, 'AUTHENTICATION_ERROR', metadata);
    }

    static createAuthorizationError(message = 'Not authorized', metadata = {}) {
        return this.createError(message, 'AUTHORIZATION_ERROR', metadata);
    }

    static createNotFoundError(resource, metadata = {}) {
        return this.createError(
            `Resource '${resource}' not found`,
            'NOT_FOUND_ERROR',
            metadata
        );
    }

    static createBusinessError(message, code = 'BUSINESS_ERROR', metadata = {}) {
        return this.createError(message, code, metadata);
    }

    static createSystemError(originalError, metadata = {}) {
        const error = this.createError(
            `System error: ${originalError.message}`,
            'SYSTEM_ERROR',
            metadata
        );
        error.originalError = originalError;
        return error;
    }
}

module.exports = ErrorFactory;
