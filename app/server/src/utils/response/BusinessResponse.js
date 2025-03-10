/**
 * BusinessResponse - Specialized response for business domain operations
 * Handles business logic outcomes with appropriate domain information
 */
const ResponseBase = require('./ResponseBase');

class BusinessResponse extends ResponseBase {
    /**
     * Create a business operation response
     * 
     * @param {Object} options - Response options
     * @param {boolean} options.success - Whether the operation was successful
     * @param {string} options.message - Developer message
     * @param {string} options.userMessage - User-friendly message
     * @param {any} [options.data=null] - Response data
     * @param {string} options.operation - Business operation name
     * @param {Object} [options.metadata={}] - Additional metadata
     * @param {string} [options.domain] - Business domain
     */
    constructor({
        success,
        message,
        userMessage,
        data = null,
        operation,
        metadata = {},
        domain = 'general'
    }) {
        super(success, message, userMessage, data, metadata);
        
        // Add business-specific context
        this.withDevContext({
            business: {
                operation,
                domain,
                timestamp: new Date().toISOString()
            }
        });
    }

    /**
     * Add audit information to track changes
     * 
     * @param {Object} auditInfo - Audit information
     * @param {Object} [auditInfo.before] - State before the operation
     * @param {Object} [auditInfo.after] - State after the operation
     * @param {string} [auditInfo.changedBy] - User who made the change
     * @returns {BusinessResponse} This response for chaining
     */
    withAuditTrail({ before, after, changedBy }) {
        // Store detailed audit in the dev context
        this.withDevContext({
            audit: {
                before,
                after,
                changedBy,
                changes: this._extractChanges(before, after),
                timestamp: new Date().toISOString()
            }
        });
        
        // Store a summary of changes in metadata
        if (before && after) {
            this.metadata.changes = {
                count: Object.keys(this._extractChanges(before, after)).length,
                changedBy
            };
        }
        
        return this;
    }

    /**
     * Extract changes between before and after states
     * 
     * @private
     * @param {Object} before - State before the operation
     * @param {Object} after - State after the operation
     * @returns {Object} Changes with field names as keys
     */
    _extractChanges(before, after) {
        if (!before || !after) return {};
        
        const changes = {};
        const allKeys = new Set([...Object.keys(before), ...Object.keys(after)]);
        
        for (const key of allKeys) {
            // Skip functions and objects (simple comparison only)
            if (typeof before[key] === 'function' || typeof after[key] === 'function') {
                continue;
            }
            
            // Track fields that were added, removed, or changed
            if (!before.hasOwnProperty(key)) {
                changes[key] = { added: after[key] };
            } else if (!after.hasOwnProperty(key)) {
                changes[key] = { removed: before[key] };
            } else if (JSON.stringify(before[key]) !== JSON.stringify(after[key])) {
                changes[key] = { 
                    from: before[key], 
                    to: after[key] 
                };
            }
        }
        
        return changes;
    }

    /**
     * Add business workflow information
     * 
     * @param {Object} workflowInfo - Workflow information
     * @param {string} workflowInfo.workflowName - Name of the workflow
     * @param {string} workflowInfo.currentStep - Current step in the workflow
     * @param {string[]} [workflowInfo.nextSteps] - Possible next steps
     * @returns {BusinessResponse} This response for chaining
     */
    withWorkflowInfo(workflowInfo) {
        this.metadata.workflow = workflowInfo;
        return this;
    }
    
    /**
     * Add business metrics information
     * 
     * @param {Object} metrics - Business metrics
     * @returns {BusinessResponse} This response for chaining
     */
    withMetrics(metrics) {
        this.metadata.metrics = metrics;
        return this;
    }
}

module.exports = BusinessResponse;
