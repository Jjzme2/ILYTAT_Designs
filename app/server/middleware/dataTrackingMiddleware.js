const DataTrackingService = require('../services/DataTrackingService');

/**
 * Middleware to track API requests and user activity
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Next middleware function
 */
const dataTrackingMiddleware = async (req, res, next) => {
    // Capture the start time for performance tracking
    const startTime = Date.now();

    // Get basic request information
    const requestData = {
        method: req.method,
        path: req.path,
        ip: req.ip,
        userAgent: req.get('user-agent'),
        referrer: req.get('referrer'),
    };

    // Track the response
    res.on('finish', async () => {
        const duration = Date.now() - startTime;
        
        const responseData = {
            ...requestData,
            statusCode: res.statusCode,
            duration,
            timestamp: new Date().toISOString()
        };

        // Log the API request
        await DataTrackingService.logSystem('api_request', responseData, req.user?.id);

        // Additional tracking for specific endpoints
        if (req.path.startsWith('/auth')) {
            await DataTrackingService.logAuth(
                req.path.split('/')[2], // login, register, etc.
                {
                    success: res.statusCode < 400,
                    method: req.method,
                    ip: req.ip
                },
                req.user?.id
            );
        }

        // Track profile related activities
        if (req.path.startsWith('/profile')) {
            await DataTrackingService.logProfile(
                req.method.toLowerCase(),
                {
                    path: req.path,
                    success: res.statusCode < 400
                },
                req.user?.id
            );
        }
    });

    next();
};

module.exports = dataTrackingMiddleware;
