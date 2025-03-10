/**
 * AuthResponse - Specialized response for authentication/authorization operations
 * Includes auth-specific details such as tokens, permissions and session info
 */
const ResponseBase = require('./ResponseBase');

class AuthResponse extends ResponseBase {
    /**
     * Create an authentication response
     * 
     * @param {Object} options - Response options
     * @param {boolean} options.success - Whether the auth operation was successful
     * @param {string} options.message - Developer message
     * @param {string} options.userMessage - User-friendly message
     * @param {Object} [options.user=null] - User information for client
     * @param {Object} [options.metadata={}] - Additional metadata
     * @param {Object} [options.tokens=null] - Auth tokens (if applicable)
     */
    constructor({
        success,
        message,
        userMessage,
        user = null,
        metadata = {},
        tokens = null
    }) {
        // Use a sanitized user object as the data payload
        const sanitizedUser = user ? this._sanitizeUserForClient(user) : null;
        super(success, message, userMessage, sanitizedUser, metadata);
        
        // Store full user details privately
        if (user) {
            this.withDevContext({
                user: {
                    id: user.id,
                    email: user.email,
                    roles: user.roles || [],
                    permissions: user.permissions || []
                }
            });
        }
        
        // Store tokens securely (not exposed in logs)
        if (tokens) {
            this._secureTokens = tokens;
            
            // Store token metadata (not the tokens themselves) for logging
            this.withDevContext({
                tokens: {
                    types: Object.keys(tokens),
                    accessTokenExpiry: tokens.accessTokenExpiry || null,
                    refreshTokenExpiry: tokens.refreshTokenExpiry || null
                }
            });
        }
    }

    /**
     * Sanitize user object for client consumption
     * Removes sensitive fields and information
     * 
     * @private
     * @param {Object} user - Full user object
     * @returns {Object} Sanitized user object safe for client
     */
    _sanitizeUserForClient(user) {
        // Only include safe fields for client consumption
        const safeFields = [
            'id', 'username', 'firstName', 'lastName', 'email',
            'displayName', 'avatar', 'locale', 'timezone',
            'roles', 'permissions'
        ];
        
        const sanitized = {};
        for (const field of safeFields) {
            if (user[field] !== undefined) {
                sanitized[field] = user[field];
            }
        }
        
        return sanitized;
    }

    /**
     * Add session information to the response
     * 
     * @param {Object} sessionInfo - Session information
     * @param {string} sessionInfo.sessionId - Session identifier
     * @param {Date|string} sessionInfo.expiresAt - Session expiration time
     * @param {boolean} [sessionInfo.isNewSession] - Whether this is a new session
     * @returns {AuthResponse} This response for chaining
     */
    withSessionInfo(sessionInfo) {
        this.metadata.session = sessionInfo;
        return this;
    }

    /**
     * Add permission information to the response
     * 
     * @param {Object} permissionInfo - Permission information
     * @param {string[]} permissionInfo.permissions - User permissions
     * @param {string[]} permissionInfo.roles - User roles
     * @returns {AuthResponse} This response for chaining
     */
    withPermissions(permissionInfo) {
        this.metadata.permissions = permissionInfo;
        return this;
    }
    
    /**
     * Override toClientFormat to include auth-specific information
     * 
     * @returns {Object} Client-safe response object with auth data
     */
    toClientFormat() {
        const base = super.toClientFormat();
        
        // Include tokens in client response but not in logs
        if (this._secureTokens) {
            base.tokens = this._secureTokens;
        }
        
        // Include session info if available
        if (this.metadata.session) {
            base.session = this.metadata.session;
        }
        
        return base;
    }
}

module.exports = AuthResponse;
