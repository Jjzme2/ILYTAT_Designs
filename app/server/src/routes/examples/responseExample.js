/**
 * Enhanced Response System Examples
 * This file demonstrates how to use the integrated logging and response system
 * throughout API routes and request handling
 */
const express = require('express');
const router = express.Router();
const logger = require('../../utils/logger');
const { catchAsync } = require('../../utils/errorHandler');

/**
 * Example route demonstrating basic success response
 */
router.get('/success', catchAsync(async (req, res) => {
    // Create a successful response with data
    return res.sendSuccess(
        { message: "This is a test success response", timestamp: new Date().toISOString() },
        "Data retrieved successfully"
    );
}));

/**
 * Example route demonstrating error handling
 */
router.get('/error', catchAsync(async (req, res) => {
    // Simulate an error
    const error = new Error('This is a test error');
    
    // Log the error with additional context using our enhanced logging
    logger.error(
        logger.response.error({
            error,
            message: 'Example error occurred',
            userMessage: 'Something went wrong with the request'
        }).withRequestDetails(req)
    );
    
    // Send error response to the client
    return res.sendError(
        error,
        'Something went wrong with the request',
        500
    );
}));

/**
 * Example route demonstrating validation error handling
 */
router.post('/validation', catchAsync(async (req, res) => {
    // Example validation errors object
    const validationErrors = {
        email: req.body.email ? undefined : 'Email is required',
        password: req.body.password && req.body.password.length >= 8 
            ? undefined 
            : 'Password must be at least 8 characters'
    };
    
    // Filter out undefined validation errors
    const errors = Object.entries(validationErrors)
        .filter(([_, value]) => value !== undefined)
        .reduce((acc, [key, value]) => {
            acc[key] = value;
            return acc;
        }, {});
    
    // If there are validation errors, send a validation error response
    if (Object.keys(errors).length > 0) {
        return res.sendValidationError(
            errors,
            'Please check your input and try again'
        );
    }
    
    // If validation passes, send a success response
    return res.sendSuccess(
        { message: 'Validation passed successfully' },
        'Input validated successfully'
    );
}));

/**
 * Example route demonstrating not found response
 */
router.get('/not-found/:resourceId', catchAsync(async (req, res) => {
    const { resourceId } = req.params;
    
    // Simulate a database lookup that returns null
    const resource = null;
    
    if (!resource) {
        return res.sendNotFound(
            'Resource',
            resourceId,
            'The requested resource could not be found'
        );
    }
    
    return res.sendSuccess({
        id: resourceId,
        name: 'Example Resource'
    });
}));

/**
 * Example route demonstrating unauthorized response
 */
router.get('/unauthorized', catchAsync(async (req, res) => {
    return res.sendUnauthorized(
        'You are not authorized to access this resource. Please log in.'
    );
}));

/**
 * Example route demonstrating business logic response
 * Business responses are for tracking business processes and flows
 */
router.post('/business-process', catchAsync(async (req, res) => {
    // Start time for performance tracking
    const startTime = Date.now();
    
    // Simulate some business process
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Create a business response with the logger
    const businessResponse = logger.response.business({
        success: true,
        message: 'Business process completed',
        userMessage: 'Your request was processed successfully',
        data: {
            processId: 'PROC-' + Date.now(),
            status: 'completed'
        }
    }).withPerformanceMetrics({
        duration: Date.now() - startTime
    });
    
    // Log the business process completion
    logger.info(businessResponse);
    
    // Send success response to client
    return res.sendSuccess(
        businessResponse.data,
        businessResponse.userMessage
    );
}));

/**
 * Example route demonstrating network response tracking
 */
router.get('/external-api', catchAsync(async (req, res) => {
    // Start time for performance tracking
    const startTime = Date.now();
    
    try {
        // Simulate external API call
        await new Promise(resolve => setTimeout(resolve, 200));
        
        // Log the successful external API call
        const networkResponse = logger.response.network({
            success: true,
            message: 'External API call successful',
            endpoint: 'https://api.example.com/data'
        }).withLatency({
            requestDuration: Date.now() - startTime
        });
        
        logger.debug(networkResponse);
        
        // Send success response to client
        return res.sendSuccess(
            { externalData: { id: 123, name: 'External Resource' } },
            'External API data retrieved successfully'
        );
    } catch (error) {
        // Log the failed external API call
        const networkErrorResponse = logger.response.network({
            success: false,
            message: 'External API call failed',
            endpoint: 'https://api.example.com/data',
            error
        }).withLatency({
            requestDuration: Date.now() - startTime
        });
        
        logger.error(networkErrorResponse);
        
        // Send error response to client
        return res.sendError(
            error,
            'Failed to retrieve data from external service',
            503
        );
    }
}));

/**
 * Example route demonstrating paginated response
 */
router.get('/paginated', catchAsync(async (req, res) => {
    const page = parseInt(req.query.page || '1');
    const limit = parseInt(req.query.limit || '10');
    
    // Simulate retrieving items from database
    const items = Array.from({ length: limit }, (_, i) => ({
        id: (page - 1) * limit + i + 1,
        name: `Item ${(page - 1) * limit + i + 1}`
    }));
    
    // Create pagination metadata
    const pagination = {
        total: 100, // Total number of items
        page,
        limit,
        pages: Math.ceil(100 / limit)
    };
    
    // Send paginated success response
    return res.sendPaginatedSuccess(
        items,
        pagination,
        'Items retrieved successfully'
    );
}));

/**
 * Example route demonstrating advanced response with correlation ID
 */
router.get('/correlated', catchAsync(async (req, res) => {
    // Get correlation ID from request (set by correlationMiddleware)
    const correlationId = req.correlationId || 'unknown';
    
    // Log with correlation ID
    logger.info(
        logger.response.business({
            success: true,
            message: 'Correlated request received',
            data: { correlationId }
        })
    );
    
    // Send response with correlation ID
    return res.sendSuccess({
        message: 'This response is correlated with logs',
        correlationId
    });
}));

/**
 * Example route showing how to combine all aspects
 */
router.post('/complete-example', catchAsync(async (req, res) => {
    const startTime = Date.now();
    
    // 1. Log the incoming request with details
    logger.info(
        logger.response.business({
            success: true,
            message: 'Processing complete example request',
            data: {
                body: req.body,
                query: req.query,
                params: req.params
            }
        }).withRequestDetails(req)
    );
    
    try {
        // 2. Validate input
        const { name, email } = req.body;
        const validationErrors = {};
        
        if (!name) validationErrors.name = 'Name is required';
        if (!email) validationErrors.email = 'Email is required';
        
        if (Object.keys(validationErrors).length > 0) {
            return res.sendValidationError(
                validationErrors,
                'Please provide all required information'
            );
        }
        
        // 3. Process the request (simulated)
        await new Promise(resolve => setTimeout(resolve, 50));
        
        // 4. Log the successful processing
        const response = logger.response.business({
            success: true,
            message: 'Complete example processed successfully',
            userMessage: 'Your request was processed successfully',
            data: {
                requestId: req.requestId || 'unknown',
                processingTime: `${Date.now() - startTime}ms`
            }
        }).withPerformanceMetrics({
            duration: Date.now() - startTime,
            memoryUsage: process.memoryUsage().heapUsed
        });
        
        logger.info(response);
        
        // 5. Send the success response
        return res.sendSuccess({
            id: Date.now(),
            name,
            email,
            processed: true,
            timestamp: new Date().toISOString()
        }, 'Request processed successfully');
        
    } catch (error) {
        // 6. Handle and log any errors
        const errorResponse = logger.response.error({
            error,
            message: 'Error processing complete example',
            userMessage: 'An error occurred while processing your request'
        }).withRequestDetails(req).withPerformanceMetrics({
            duration: Date.now() - startTime
        });
        
        logger.error(errorResponse);
        
        return res.sendError(
            error,
            'An error occurred while processing your request',
            500
        );
    }
}));

module.exports = router;
