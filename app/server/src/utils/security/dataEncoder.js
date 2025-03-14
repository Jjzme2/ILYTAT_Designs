/**
 * Data Encoder - Provides secure encoding and encryption for sensitive data
 * Used to encode/encrypt data when sending to client and decode/decrypt when receiving
 */
const crypto = require('crypto');

class DataEncoder {
  constructor(options = {}) {
    // Default options
    this.options = {
      encryptionEnabled: process.env.NODE_ENV === 'production',
      encryptionAlgorithm: 'aes-256-gcm',
      encryptionKey: process.env.DATA_ENCRYPTION_KEY || this._generateFallbackKey(),
      ...options
    };

    // Ensure encryption key is properly sized for the algorithm
    this.encryptionKey = Buffer.from(
      this.options.encryptionKey.length === 32 
        ? this.options.encryptionKey 
        : crypto.createHash('sha256').update(this.options.encryptionKey).digest()
    );

    // Bind methods to preserve context
    this.encode = this.encode.bind(this);
    this.decode = this.decode.bind(this);
    this.encrypt = this.encrypt.bind(this);
    this.decrypt = this.decrypt.bind(this);
    this.hash = this.hash.bind(this);
  }

  /**
   * Generate a fallback encryption key (only for development)
   * WARNING: This should never be used in production
   * 
   * @private
   * @returns {string} A fallback encryption key
   */
  _generateFallbackKey() {
    if (process.env.NODE_ENV === 'production') {
      console.error('ERROR: No encryption key provided in production environment');
      process.exit(1);
    }
    
    // For development only, create a deterministic but not easily guessable key
    return crypto
      .createHash('sha256')
      .update(`ILYTAT_DEV_${process.env.NODE_ENV || 'development'}_KEY`)
      .digest('hex')
      .substring(0, 32);
  }

  /**
   * Encode data for transmission to client
   * This is the main method to use when sending data to the client
   * It applies appropriate security measures based on sensitivity
   * 
   * @param {any} data - Data to encode
   * @param {Object} options - Encoding options
   * @param {boolean} options.sensitive - Whether the data is sensitive
   * @param {string} options.scope - Scope of the data (e.g., 'user', 'payment')
   * @returns {Object} Encoded data with metadata
   */
  encode(data, options = {}) {
    // Default options
    const { sensitive = false, scope = 'general' } = options;
    
    // Check if data needs to be encrypted
    const shouldEncrypt = sensitive && this.options.encryptionEnabled;
    
    // Start with original data
    let processedData = data;
    let metadata = { encoded: false };

    // Apply transformations based on sensitivity
    if (shouldEncrypt) {
      // For sensitive data, encrypt it
      const encrypted = this.encrypt(JSON.stringify(data));
      processedData = encrypted.data;
      metadata = {
        encoded: true,
        encrypted: true,
        algorithm: this.options.encryptionAlgorithm,
        iv: encrypted.iv,
        authTag: encrypted.authTag,
        scope
      };
    } else if (sensitive) {
      // If encryption is disabled but data is sensitive, at least create a signature
      const signature = this.hash(JSON.stringify(data));
      metadata = {
        encoded: true,
        encrypted: false,
        signature,
        scope
      };
    }

    return {
      data: processedData,
      metadata
    };
  }

  /**
   * Decode data received from client
   * This is the companion to encode()
   * 
   * @param {any} encodedData - Data to decode
   * @param {Object} metadata - Metadata from encode()
   * @returns {any} Decoded data
   */
  decode(encodedData, metadata) {
    // If data wasn't encoded, return as is
    if (!metadata || !metadata.encoded) {
      return encodedData;
    }

    // Handle encrypted data
    if (metadata.encrypted) {
      const decrypted = this.decrypt(encodedData, {
        iv: metadata.iv,
        authTag: metadata.authTag
      });
      return JSON.parse(decrypted);
    }

    // Handle signed data
    if (metadata.signature) {
      // Verify signature
      const calculatedSignature = this.hash(JSON.stringify(encodedData));
      if (calculatedSignature !== metadata.signature) {
        throw new Error('Data signature verification failed');
      }
    }

    return encodedData;
  }

  /**
   * Encrypt data with AES-GCM
   * 
   * @param {string} data - String data to encrypt
   * @returns {Object} Encrypted data with IV and auth tag
   */
  encrypt(data) {
    // Generate a random initialization vector
    const iv = crypto.randomBytes(16);
    
    // Create cipher
    const cipher = crypto.createCipheriv(
      this.options.encryptionAlgorithm, 
      this.encryptionKey,
      iv
    );
    
    // Encrypt data
    let encrypted = cipher.update(data, 'utf8', 'base64');
    encrypted += cipher.final('base64');
    
    // Get authentication tag
    const authTag = cipher.getAuthTag().toString('base64');

    return {
      data: encrypted,
      iv: iv.toString('base64'),
      authTag
    };
  }

  /**
   * Decrypt data encrypted with AES-GCM
   * 
   * @param {string} encryptedData - Encrypted data (base64)
   * @param {Object} options - Decryption options
   * @param {string} options.iv - Initialization vector (base64)
   * @param {string} options.authTag - Authentication tag (base64)
   * @returns {string} Decrypted data
   */
  decrypt(encryptedData, { iv, authTag }) {
    try {
      // Convert IV and auth tag from base64
      const ivBuffer = Buffer.from(iv, 'base64');
      const authTagBuffer = Buffer.from(authTag, 'base64');
      
      // Create decipher
      const decipher = crypto.createDecipheriv(
        this.options.encryptionAlgorithm,
        this.encryptionKey,
        ivBuffer
      );
      
      // Set authentication tag
      decipher.setAuthTag(authTagBuffer);
      
      // Decrypt data
      let decrypted = decipher.update(encryptedData, 'base64', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      throw new Error(`Decryption failed: ${error.message}`);
    }
  }

  /**
   * Generate a secure hash of data
   * 
   * @param {string} data - Data to hash
   * @returns {string} Hash of the data
   */
  hash(data) {
    return crypto
      .createHmac('sha256', this.encryptionKey)
      .update(data)
      .digest('base64');
  }

  /**
   * Create obfuscated version of sensitive data for logging
   * 
   * @param {string} value - Sensitive value to obfuscate
   * @param {Object} options - Obfuscation options
   * @param {number} options.visibleChars - Number of chars to show (default: 4)
   * @param {boolean} options.showFirst - Show first N chars (default: false)
   * @returns {string} Obfuscated value
   */
  obfuscate(value, { visibleChars = 4, showFirst = false } = {}) {
    if (!value || typeof value !== 'string') {
      return '[REDACTED]';
    }

    if (value.length <= visibleChars) {
      return '*'.repeat(value.length);
    }

    if (showFirst) {
      return value.substring(0, visibleChars) + '*'.repeat(value.length - visibleChars);
    } else {
      return '*'.repeat(value.length - visibleChars) + value.slice(-visibleChars);
    }
  }
}

module.exports = new DataEncoder();
