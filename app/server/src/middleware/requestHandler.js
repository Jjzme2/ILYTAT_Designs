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
        // Determine resource type based on request and response context
        const resourceType = determineResourceType(req, data);
        
        // Ensure data is never null
        const responseData = data === null ? {} : data;
        
        return res.json(APIResponse.success({
            data: responseData,
            message,
            resourceType,
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
 * Helper function to determine the resource type based on the request and data
 * This helps the response formatter know whether to default to an array or object
 * 
 * @param {Object} req - Express request object
 * @param {any} data - Response data
 * @returns {string} Resource type ('collection' or 'single')
 */
function determineResourceType(req, data) {
    // If data is already an array, it's a collection
    if (Array.isArray(data)) {
        return 'collection';
    }
    
    // Check the URL path - endpoints with plural resources typically return collections
    const pathSegments = req.path.split('/').filter(Boolean);
    const lastSegment = pathSegments[pathSegments.length - 1];
    
    // Check the HTTP method - GET requests without IDs often return collections
    const isGetAll = req.method === 'GET' && !req.params.id && 
                    (!lastSegment || !lastSegment.match(/^[0-9a-fA-F]{24}$/));
    
    // Common collection endpoint patterns
    const collectionPatterns = [
        /s$/, // plural endpoints (users, products)
        /list/i, 
        /all/i,
        /search/i,
        /find/i,
        /query/i
    ];
    
    const isCollectionEndpoint = collectionPatterns.some(pattern => 
        pattern.test(lastSegment) || pattern.test(req.path)
    );
    
    return (isGetAll || isCollectionEndpoint) ? 'collection' : 'single';
}

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
