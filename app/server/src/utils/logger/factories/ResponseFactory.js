const logger = require('../baseLogger');
const BaseFactory = require('./BaseFactory');

class ResponseFactory extends BaseFactory {
    static #createBaseResponse(success, message, data = null) {
        return {
            success,
            message,
            data,
            timestamp: new Date().toISOString()
        };
    }

    static success(data = null, message = 'Operation successful') {
        const response = this.#createBaseResponse(true, message, data);
        logger.info('Success response', {
            type: 'API_RESPONSE',
            status: 'success',
            message,
            ...this.enrichBaseMetadata()
        });
        return response;
    }

    static error(error, message = 'Operation failed') {
        const errorResponse = this.#createBaseResponse(false, message, {
            error: {
                message: error.message,
                code: error.code || error.statusCode,
                type: error.type || 'UnknownError'
            }
        });

        if (process.env.NODE_ENV !== 'production') {
            errorResponse.data.error.stack = error.stack;
        }

        logger.error('Error response', {
            type: 'API_RESPONSE',
            status: 'error',
            error: errorResponse.data.error,
            ...this.enrichBaseMetadata()
        });

        return errorResponse;
    }

    static pagination(data, page, limit, total) {
        const response = this.#createBaseResponse(true, 'Data retrieved successfully', {
            items: data,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });

        logger.info('Pagination response', {
            type: 'API_RESPONSE',
            status: 'success',
            pagination: response.data.pagination,
            ...this.enrichBaseMetadata()
        });

        return response;
    }

    static stream(stream, metadata = {}) {
        const response = {
            stream,
            ...metadata,
            timestamp: new Date().toISOString()
        };

        logger.info('Stream response', {
            type: 'API_RESPONSE',
            status: 'success',
            ...this.enrichBaseMetadata(metadata)
        });

        return response;
    }

    static async sendResponse(res, responseData) {
        const logData = LogFactory.createApiLog(res.req, {
            responseData: responseData,
            duration: Date.now() - res.req.startTime
        });

        if (responseData.success) {
            logger.info('Response sent successfully', logData);
        } else {
            logger.error('Error response sent', logData);
        }

        return res.status(responseData.data?.error?.code || 200).json(responseData);
    }
}

module.exports = ResponseFactory;
