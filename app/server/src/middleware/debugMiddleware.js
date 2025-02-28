const { colorize, debugColors } = require('../utils/colors');
const logger = require('../utils/logger');

/**
 * Format debug information with colors based on importance
 * @param {Object} info - Debug information to format
 * @returns {string} Formatted debug string
 */
const formatDebugInfo = (info) => {
    const timestamp = colorize(new Date().toISOString(), debugColors.muted);
    const requestId = colorize(`[${info.requestId || 'NO_ID'}]`, debugColors.system);
    
    let output = `${timestamp} ${requestId} `;
    
    // Request information
    if (info.method && info.url) {
        const method = colorize(info.method.padEnd(7), debugColors.request);
        const url = colorize(info.url, info.statusCode >= 400 ? debugColors.error : debugColors.info);
        output += `${method} ${url} `;
    }
    
    // Status code with color based on range
    if (info.statusCode) {
        const statusColor = info.statusCode >= 500 ? debugColors.error :
                          info.statusCode >= 400 ? debugColors.warn :
                          info.statusCode >= 300 ? debugColors.highlight :
                          debugColors.success;
        output += colorize(`[${info.statusCode}]`, statusColor) + ' ';
    }
    
    // Response time
    if (info.responseTime) {
        const timeColor = info.responseTime > 1000 ? debugColors.error :
                         info.responseTime > 500 ? debugColors.warn :
                         debugColors.success;
        output += colorize(`${info.responseTime}ms`, timeColor) + ' ';
    }
    
    // Error information
    if (info.error) {
        output += '\n' + colorize(info.error.stack || info.error.message, debugColors.error);
    }
    
    // Additional debug information
    if (info.debug) {
        const debugStr = typeof info.debug === 'string' ? info.debug : JSON.stringify(info.debug, null, 2);
        output += '\n' + colorize(debugStr, debugColors.debug);
    }
    
    return output;
};

/**
 * Debug middleware for enhanced logging
 */
const debugMiddleware = (req, res, next) => {
    const startTime = Date.now();
    const requestId = req.id || Math.random().toString(36).substring(7);
    
    // Log request
    const requestInfo = {
        requestId,
        method: req.method,
        url: req.originalUrl,
        debug: {
            headers: req.headers,
            query: req.query,
            body: req.body
        }
    };
    
    logger.debug(formatDebugInfo(requestInfo));
    
    // Capture response
    const oldWrite = res.write;
    const oldEnd = res.end;
    const chunks = [];
    
    res.write = function (chunk) {
        chunks.push(chunk);
        return oldWrite.apply(res, arguments);
    };
    
    res.end = function (chunk) {
        if (chunk) chunks.push(chunk);
        
        const responseTime = Date.now() - startTime;
        const responseInfo = {
            requestId,
            method: req.method,
            url: req.originalUrl,
            statusCode: res.statusCode,
            responseTime,
            debug: {
                responseBody: Buffer.concat(chunks).toString('utf8')
            }
        };
        
        logger.debug(formatDebugInfo(responseInfo));
        oldEnd.apply(res, arguments);
    };
    
    next();
};

module.exports = debugMiddleware;
