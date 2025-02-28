const logger = require('../baseLogger');
const BaseFactory = require('./BaseFactory');

class ValidationFactory extends BaseFactory {
    static #schemas = new Map();

    static registerSchema(name, schema) {
        this.#schemas.set(name, schema);
        logger.debug('Schema registered', {
            type: 'VALIDATION',
            schema: name,
            fields: Object.keys(schema),
            ...this.enrichBaseMetadata()
        });
    }

    static getSchema(name) {
        return this.#schemas.get(name);
    }

    static #createValidationError(validationErrors, message = 'Validation failed') {
        const error = new Error(message);
        error.code = 'VALIDATION_ERROR';
        error.validationErrors = validationErrors;
        error.metadata = this.enrichBaseMetadata();
        return error;
    }

    static async validate(schemaName, data, options = {}) {
        const schema = this.getSchema(schemaName);
        
        if (!schema) {
            throw this.#createValidationError(
                { schema: 'Schema not found' },
                `Schema '${schemaName}' not registered`
            );
        }

        try {
            const validatedData = await schema.validateAsync(data, {
                abortEarly: false,
                ...options
            });

            logger.debug('Validation successful', {
                type: 'VALIDATION',
                schema: schemaName,
                data: this.maskSensitiveData(validatedData),
                ...this.enrichBaseMetadata()
            });

            return validatedData;
        } catch (error) {
            const validationErrors = {};

            if (error.details) {
                error.details.forEach(detail => {
                    const path = detail.path.join('.');
                    validationErrors[path] = detail.message;
                });
            }

            const validationError = this.#createValidationError(
                validationErrors,
                `Validation failed for schema '${schemaName}'`
            );

            logger.warn('Validation failed', {
                type: 'VALIDATION',
                schema: schemaName,
                errors: validationErrors,
                ...this.enrichBaseMetadata()
            });

            throw validationError;
        }
    }

    static getAllSchemas() {
        return Array.from(this.#schemas.keys());
    }

    static clearSchemas() {
        this.#schemas.clear();
        logger.debug('All schemas cleared', {
            type: 'VALIDATION',
            ...this.enrichBaseMetadata()
        });
    }

    static createValidator(schemaName) {
        return async (data, options = {}) => {
            return this.validate(schemaName, data, options);
        };
    }

    static middleware(schemaName, dataSource = 'body') {
        return async (req, res, next) => {
            try {
                const data = req[dataSource];
                const validatedData = await this.validate(schemaName, data);
                req[dataSource] = validatedData;
                next();
            } catch (error) {
                next(error);
            }
        };
    }
}

module.exports = ValidationFactory;
