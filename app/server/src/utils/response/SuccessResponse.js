/**
 * SuccessResponse - Represents a successful operation
 * For standard successful operations returning data or confirmation
 */
const ResponseBase = require('./ResponseBase');

class SuccessResponse extends ResponseBase {
    /**
     * Create a success response
     * 
     * @param {Object} options - Response options
     * @param {string} [options.message='Operation completed successfully'] - Developer message
     * @param {string} [options.userMessage='Success'] - User-friendly message
     * @param {any} [options.data] - Response payload (will never be null when sent to client)
     * @param {string} [options.resourceType] - Type of resource being returned ('single', 'collection')
     * @param {Object} [options.metadata={}] - Additional metadata
     */
    constructor({
        message = 'Operation completed successfully',
        userMessage = 'Success',
        data,
        resourceType,
        metadata = {}
    } = {}) {
        // If resourceType is provided, include it in metadata for proper defaulting in base class
        const enhancedMetadata = resourceType ? { ...metadata, resourceType } : metadata;
        super(true, message, userMessage, data, enhancedMetadata);
    }

    /**
     * Add pagination metadata to the response
     * 
     * @param {Object} pagination - Pagination information
     * @param {number} pagination.page - Current page
     * @param {number} pagination.limit - Items per page
     * @param {number} pagination.total - Total items
     * @returns {SuccessResponse} This response for chaining
     */
    withPagination({ page, limit, total }) {
        const totalPages = Math.ceil(total / limit);
        this.metadata.pagination = {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            totalPages,
            hasNext: page < totalPages,
            hasPrev: page > 1
        };
        return this;
    }

    /**
     * Add cache information to the response
     * 
     * @param {Object} cacheInfo - Cache information
     * @param {boolean} cacheInfo.fromCache - Whether response came from cache
     * @param {string} [cacheInfo.cacheKey] - The cache key used
     * @param {number} [cacheInfo.ttl] - Time to live (in seconds)
     * @returns {SuccessResponse} This response for chaining
     */
    withCacheInfo({ fromCache, cacheKey, ttl }) {
        this.metadata.cache = { fromCache, cacheKey, ttl };
        return this;
    }
    
    /**
     * Override toClientFormat to include pagination in client response
     * 
     * @returns {Object} Client-safe response object with pagination if available
     */
    toClientFormat() {
        const base = super.toClientFormat();
        
        // Include pagination in client response if available
        if (this.metadata.pagination) {
            base.pagination = this.metadata.pagination;
        }
        
        return base;
    }
}

module.exports = SuccessResponse;
