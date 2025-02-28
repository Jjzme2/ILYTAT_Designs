const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');
const APIResponse = require('../utils/apiResponse');

/**
 * Middleware to add request ID and basic request logging
 */
const requestMiddleware = (req, res, next) => {
    // Generate unique request ID
    req.requestId = uuidv4();

    // Add requestId to response headers
    res.setHeader('X-Request-ID', req.requestId);

    // Log incoming request
    logger.info({
        message: 'Incoming request',
        method: req.method,
        path: req.path,
        requestId: req.requestId,
        ip: req.ip
    });

    // Enhance response object with standardized methods
    res.sendSuccess = function({ data, message }) {
        return res.json(APIResponse.success({
            data,
            message,
            requestId: req.requestId
        }));
    };

    res.sendError = function({ error, clientMessage, context }) {
        const response = APIResponse.error({
            error,
            clientMessage,
            requestId: req.requestId,
            context: {
                ...context,
                path: req.path,
                method: req.method
            }
        });
        return res.status(error.status || 500).json(response);
    };

    res.sendValidationError = function({ validationErrors, clientMessage }) {
        const response = APIResponse.validationError({
            validationErrors,
            clientMessage,
            requestId: req.requestId
        });
        return res.status(400).json(response);
    };

    next();
};

/**
 * Global error handling middleware
 */
const errorHandler = (err, req, res, next) => {
    // Don't expose internal server errors to client
    const clientMessage = process.env.NODE_ENV === 'production' 
        ? 'An unexpected error occurred'
        : err.message;

    const response = APIResponse.error({
        error: err,
        clientMessage,
        requestId: req.requestId,
        context: {
            path: req.path,
            method: req.method
        }
    });

    res.status(err.status || 500).json(response);
};

module.exports = {
    requestMiddleware,
    errorHandler
};
