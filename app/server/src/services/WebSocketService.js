const WebSocket = require('ws');
const logger = require('./LoggerService');

/**
 * WebSocketService - Handles real-time bidirectional communication
 * Implements pub/sub pattern for flexible message routing
 * Supports different message types and room-based communication
 */
class WebSocketService {
    constructor() {
        this.clients = new Map();
        this.rooms = new Map();
        this.messageHandlers = new Map();
    }

    /**
     * Initialize WebSocket server
     * @param {Object} server - HTTP/HTTPS server instance
     */
    initialize(server) {
        this.wss = new WebSocket.Server({ server });

        this.wss.on('connection', (ws, req) => {
            const clientId = this._generateClientId();
            this.clients.set(clientId, {
                ws,
                rooms: new Set(),
                metadata: {}
            });

            logger.info(`Client connected: ${clientId}`);

            ws.on('message', (message) => this._handleMessage(clientId, message));
            ws.on('close', () => this._handleDisconnect(clientId));
            ws.on('error', (error) => {
                logger.error(`WebSocket error for client ${clientId}:`, { error });
            });

            // Send welcome message
            this.sendToClient(clientId, {
                type: 'system',
                action: 'welcome',
                clientId
            });
        });
    }

    /**
     * Register a message handler
     * @param {string} type - Message type
     * @param {Function} handler - Handler function
     */
    registerHandler(type, handler) {
        this.messageHandlers.set(type, handler);
    }

    /**
     * Send message to specific client
     * @param {string} clientId - Target client ID
     * @param {Object} message - Message to send
     */
    sendToClient(clientId, message) {
        const client = this.clients.get(clientId);
        if (client && client.ws.readyState === WebSocket.OPEN) {
            client.ws.send(JSON.stringify(message));
        }
    }

    /**
     * Broadcast message to all clients in a room
     * @param {string} room - Room name
     * @param {Object} message - Message to broadcast
     * @param {string} [excludeClientId] - Client to exclude
     */
    broadcastToRoom(room, message, excludeClientId = null) {
        const roomClients = this.rooms.get(room) || new Set();
        roomClients.forEach(clientId => {
            if (clientId !== excludeClientId) {
                this.sendToClient(clientId, message);
            }
        });
    }

    /**
     * Join a room
     * @param {string} clientId - Client ID
     * @param {string} room - Room to join
     */
    joinRoom(clientId, room) {
        const client = this.clients.get(clientId);
        if (client) {
            client.rooms.add(room);
            if (!this.rooms.has(room)) {
                this.rooms.set(room, new Set());
            }
            this.rooms.get(room).add(clientId);
            
            logger.info(`Client ${clientId} joined room: ${room}`);
        }
    }

    /**
     * Leave a room
     * @param {string} clientId - Client ID
     * @param {string} room - Room to leave
     */
    leaveRoom(clientId, room) {
        const client = this.clients.get(clientId);
        if (client) {
            client.rooms.delete(room);
            const roomClients = this.rooms.get(room);
            if (roomClients) {
                roomClients.delete(clientId);
                if (roomClients.size === 0) {
                    this.rooms.delete(room);
                }
            }
            
            logger.info(`Client ${clientId} left room: ${room}`);
        }
    }

    /**
     * Handle incoming messages
     * @private
     */
    _handleMessage(clientId, message) {
        try {
            const parsedMessage = JSON.parse(message);
            const handler = this.messageHandlers.get(parsedMessage.type);
            
            if (handler) {
                handler(clientId, parsedMessage);
            } else {
                logger.warn(`No handler for message type: ${parsedMessage.type}`);
            }
        } catch (error) {
            logger.error('Error handling message:', { error, clientId, message });
        }
    }

    /**
     * Handle client disconnection
     * @private
     */
    _handleDisconnect(clientId) {
        const client = this.clients.get(clientId);
        if (client) {
            // Remove from all rooms
            client.rooms.forEach(room => {
                this.leaveRoom(clientId, room);
            });
            this.clients.delete(clientId);
        }
        logger.info(`Client disconnected: ${clientId}`);
    }

    /**
     * Generate unique client ID
     * @private
     */
    _generateClientId() {
        return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
}

// Export a singleton instance
module.exports = new WebSocketService();
