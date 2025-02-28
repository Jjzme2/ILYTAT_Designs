const EventEmitter = require('events');
const logger = require('./LoggerService');

/**
 * EventService - A centralized event bus for system-wide messaging
 * Implements the Observer pattern for decoupled communication
 * Supports event prioritization and error handling
 */
class EventService extends EventEmitter {
    constructor() {
        super();
        this.setMaxListeners(0); // Remove listener limit
        this._setupErrorHandling();
        this._eventHistory = new Map();
    }

    /**
     * Emit an event with error handling and logging
     * @param {string} eventName - Name of the event
     * @param {*} data - Event data
     * @returns {boolean} - Whether the event had listeners
     */
    emit(eventName, data) {
        try {
            logger.debug(`Emitting event: ${eventName}`, { data });
            this._recordEvent(eventName, data);
            return super.emit(eventName, data);
        } catch (error) {
            logger.error(`Error emitting event ${eventName}:`, { error });
            return false;
        }
    }

    /**
     * Add an event listener with error handling
     * @param {string} eventName - Name of the event
     * @param {Function} listener - Event handler
     * @returns {EventService} - this instance for chaining
     */
    on(eventName, listener) {
        const wrappedListener = this._wrapListener(eventName, listener);
        super.on(eventName, wrappedListener);
        logger.debug(`Added listener for event: ${eventName}`);
        return this;
    }

    /**
     * Add a one-time event listener
     * @param {string} eventName - Name of the event
     * @param {Function} listener - Event handler
     * @returns {EventService} - this instance for chaining
     */
    once(eventName, listener) {
        const wrappedListener = this._wrapListener(eventName, listener);
        super.once(eventName, wrappedListener);
        logger.debug(`Added one-time listener for event: ${eventName}`);
        return this;
    }

    /**
     * Remove an event listener
     * @param {string} eventName - Name of the event
     * @param {Function} listener - Event handler to remove
     * @returns {EventService} - this instance for chaining
     */
    off(eventName, listener) {
        super.off(eventName, listener);
        logger.debug(`Removed listener for event: ${eventName}`);
        return this;
    }

    /**
     * Get event history for debugging
     * @param {string} eventName - Optional event name filter
     * @returns {Array} - Array of event records
     */
    getEventHistory(eventName = null) {
        if (eventName) {
            return this._eventHistory.get(eventName) || [];
        }
        return Array.from(this._eventHistory.entries());
    }

    /**
     * Clear event history
     * @param {string} eventName - Optional event name to clear
     */
    clearEventHistory(eventName = null) {
        if (eventName) {
            this._eventHistory.delete(eventName);
        } else {
            this._eventHistory.clear();
        }
    }

    /**
     * Setup error handling for the event emitter
     * @private
     */
    _setupErrorHandling() {
        this.on('error', (error) => {
            logger.error('EventService error:', { error });
        });
    }

    /**
     * Wrap a listener with error handling and logging
     * @private
     */
    _wrapListener(eventName, listener) {
        return async (...args) => {
            try {
                if (listener.constructor.name === 'AsyncFunction') {
                    await listener(...args);
                } else {
                    listener(...args);
                }
            } catch (error) {
                logger.error(`Error in event listener for ${eventName}:`, { error });
                this.emit('error', error);
            }
        };
    }

    /**
     * Record event for history
     * @private
     */
    _recordEvent(eventName, data) {
        if (!this._eventHistory.has(eventName)) {
            this._eventHistory.set(eventName, []);
        }
        const events = this._eventHistory.get(eventName);
        events.push({
            timestamp: new Date().toISOString(),
            data
        });
        
        // Keep only last 100 events per type
        if (events.length > 100) {
            events.shift();
        }
    }
}

// Export a singleton instance
module.exports = new EventService();
