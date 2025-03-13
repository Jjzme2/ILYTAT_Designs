/**
 * NameMapper - Utility for converting between snake_case and camelCase naming conventions
 * 
 * This utility helps maintain consistency across the application by providing
 * conversion functions between different naming conventions.
 */

/**
 * Convert a snake_case string to camelCase
 * @param {string} snakeStr - The snake_case string to convert
 * @returns {string} The camelCase version of the string
 */
const snakeToCamel = (snakeStr) => {
  return snakeStr.replace(/_([a-z])/g, (match, char) => char.toUpperCase());
};

/**
 * Convert a camelCase string to snake_case
 * @param {string} camelStr - The camelCase string to convert
 * @returns {string} The snake_case version of the string
 */
const camelToSnake = (camelStr) => {
  return camelStr.replace(/[A-Z]/g, (match) => `_${match.toLowerCase()}`);
};

/**
 * Convert object keys from snake_case to camelCase
 * @param {Object} snakeObj - Object with snake_case keys
 * @returns {Object} Object with camelCase keys
 */
const objectSnakeToCamel = (snakeObj) => {
  if (!snakeObj || typeof snakeObj !== 'object' || Array.isArray(snakeObj)) {
    return snakeObj;
  }

  const camelObj = {};
  for (const key in snakeObj) {
    if (Object.prototype.hasOwnProperty.call(snakeObj, key)) {
      const camelKey = snakeToCamel(key);
      const value = snakeObj[key];
      
      // Recursively convert nested objects
      camelObj[camelKey] = typeof value === 'object' && value !== null 
        ? (Array.isArray(value) 
            ? value.map(item => typeof item === 'object' && item !== null ? objectSnakeToCamel(item) : item)
            : objectSnakeToCamel(value))
        : value;
    }
  }
  return camelObj;
};

/**
 * Convert object keys from camelCase to snake_case
 * @param {Object} camelObj - Object with camelCase keys
 * @returns {Object} Object with snake_case keys
 */
const objectCamelToSnake = (camelObj) => {
  if (!camelObj || typeof camelObj !== 'object' || Array.isArray(camelObj)) {
    return camelObj;
  }

  const snakeObj = {};
  for (const key in camelObj) {
    if (Object.prototype.hasOwnProperty.call(camelObj, key)) {
      const snakeKey = camelToSnake(key);
      const value = camelObj[key];
      
      // Recursively convert nested objects
      snakeObj[snakeKey] = typeof value === 'object' && value !== null 
        ? (Array.isArray(value) 
            ? value.map(item => typeof item === 'object' && item !== null ? objectCamelToSnake(item) : item)
            : objectCamelToSnake(value))
        : value;
    }
  }
  return snakeObj;
};

/**
 * Field mapping object containing common database field mappings
 * between snake_case and camelCase
 */
const fieldMappings = {
  // User fields
  is_verified: 'isVerified',
  is_active: 'isActive',
  first_name: 'firstName',
  last_name: 'lastName',
  reset_password_token: 'resetPasswordToken',
  reset_password_expires: 'resetPasswordExpires',
  verification_token: 'verificationToken',
  verification_expires: 'verificationExpires',
  last_login: 'lastLogin',
  login_attempts: 'loginAttempts',
  lock_until: 'lockUntil',
  user_id: 'userId',
  
  // Add additional mappings as needed
};

/**
 * Get the equivalent field name in the opposite convention
 * @param {string} fieldName - Original field name
 * @param {boolean} toCamel - If true, convert to camelCase, otherwise to snake_case
 * @returns {string} Converted field name
 */
const mapField = (fieldName, toCamel = true) => {
  if (toCamel) {
    // If mapping exists, use it, otherwise convert using the function
    return fieldMappings[fieldName] || snakeToCamel(fieldName);
  } else {
    // Reverse lookup in mappings or convert using function
    const entry = Object.entries(fieldMappings).find(([_, camel]) => camel === fieldName);
    return entry ? entry[0] : camelToSnake(fieldName);
  }
};

module.exports = {
  snakeToCamel,
  camelToSnake,
  objectSnakeToCamel,
  objectCamelToSnake,
  fieldMappings,
  mapField
};
