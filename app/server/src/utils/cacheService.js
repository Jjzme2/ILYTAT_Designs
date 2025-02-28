const NodeCache = require('node-cache');

/**
 * CacheService provides a simple interface for caching data
 * Can be easily swapped with Redis or other caching solutions if needed
 */
class CacheService {
    constructor() {
        this.cache = new NodeCache({
            stdTTL: 600, // Default TTL: 10 minutes
            checkperiod: 120, // Cleanup every 2 minutes
            useClones: false // Better performance, safe for our use case
        });
    }

    /**
     * Get a value from cache
     * @param {string} key - Cache key
     * @returns {*} Cached value or undefined
     */
    get(key) {
        return this.cache.get(key);
    }

    /**
     * Set a value in cache
     * @param {string} key - Cache key
     * @param {*} value - Value to cache
     * @param {number} ttl - Time to live in seconds
     * @returns {boolean} Success
     */
    set(key, value, ttl) {
        return this.cache.set(key, value, ttl);
    }

    /**
     * Delete a value from cache
     * @param {string} key - Cache key
     * @returns {number} Number of deleted entries
     */
    del(key) {
        return this.cache.del(key);
    }

    /**
     * Increment a numeric value
     * @param {string} key - Cache key
     * @param {number} value - Value to increment by (default: 1)
     * @returns {number|boolean} New value or false if key doesn't exist
     */
    increment(key, value = 1) {
        const current = this.get(key);
        if (typeof current !== 'number') {
            return this.set(key, value);
        }
        return this.set(key, current + value);
    }

    /**
     * Get or set a value with a factory function
     * @param {string} key - Cache key
     * @param {number} ttl - Time to live in seconds
     * @param {Function} factory - Function to generate value if not in cache
     * @returns {*} Cached or generated value
     */
    async getOrSet(key, ttl, factory) {
        const value = this.get(key);
        if (value !== undefined) {
            return value;
        }
        const generated = await factory();
        this.set(key, generated, ttl);
        return generated;
    }

    /**
     * Clear all cached values
     */
    flush() {
        this.cache.flushAll();
    }
}

// Export singleton instance
module.exports = new CacheService();
