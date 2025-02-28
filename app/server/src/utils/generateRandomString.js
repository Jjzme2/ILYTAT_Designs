#!/usr/bin/env node
const crypto = require('crypto');

/**
 * Generates a cryptographically secure random string
 * @param {number} length - The length of the string to generate (default: 36)
 * @param {string} encoding - The encoding to use ('hex' or 'base64') (default: 'hex')
 * @returns {string} The generated random string
 */
const generateRandomString = (length = 36, encoding = 'hex') => {
  if (length < 1) throw new Error('Length must be greater than 0');
  if (!['hex', 'base64'].includes(encoding)) {
    throw new Error('Encoding must be either "hex" or "base64"');
  }

  const bytesNeeded = encoding === 'hex' ? Math.ceil(length / 2) : Math.ceil(length * 3 / 4);
  const randomBytes = crypto.randomBytes(bytesNeeded);
  return randomBytes.toString(encoding).slice(0, length);
};

// For command line usage
if (require.main === module) {
  const args = process.argv.slice(2);
  const length = parseInt(args[0]) || 36;
  const encoding = args[1] || 'hex';

  try {
    console.log(generateRandomString(length, encoding));
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

module.exports = generateRandomString;