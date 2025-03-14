/**
 * Formatting utility functions for the ILYTAT Designs application
 * 
 * These functions handle common formatting tasks like currency, dates, and text
 */

/**
 * Format a number as currency
 * @param {number|string} amount - The amount to format
 * @param {string} [currencyCode='USD'] - The currency code
 * @param {string} [locale='en-US'] - The locale to use for formatting
 * @returns {string} Formatted currency string
 */
export function formatCurrency(amount, currencyCode = 'USD', locale = 'en-US') {
  // Handle invalid inputs
  if (amount === null || amount === undefined || isNaN(Number(amount))) {
    return 'N/A';
  }
  
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currencyCode
    }).format(Number(amount));
  } catch (error) {
    console.error('Error formatting currency:', error);
    return `${amount} ${currencyCode}`;
  }
}

/**
 * Format a date string or timestamp
 * @param {Date|string|number} date - Date to format
 * @param {object} options - Intl.DateTimeFormat options
 * @param {string} [locale='en-US'] - The locale to use for formatting
 * @returns {string} Formatted date string
 */
export function formatDate(date, options = {}, locale = 'en-US') {
  // Default options
  const defaultOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...options
  };
  
  // Handle invalid inputs
  if (!date) {
    return 'N/A';
  }
  
  try {
    // Convert to Date object if it's not already
    const dateObj = date instanceof Date ? date : new Date(date);
    
    // Check if date is valid
    if (isNaN(dateObj.getTime())) {
      return 'Invalid Date';
    }
    
    return new Intl.DateTimeFormat(locale, defaultOptions).format(dateObj);
  } catch (error) {
    console.error('Error formatting date:', error);
    return String(date);
  }
}

/**
 * Truncate text to a specified length and add ellipsis if needed
 * @param {string} text - Text to truncate
 * @param {number} [length=100] - Maximum length
 * @param {string} [ellipsis='...'] - Ellipsis string to append
 * @returns {string} Truncated text
 */
export function truncateText(text, length = 100, ellipsis = '...') {
  if (!text || typeof text !== 'string') {
    return '';
  }
  
  if (text.length <= length) {
    return text;
  }
  
  return text.slice(0, length).trim() + ellipsis;
}

/**
 * Convert a kebab-case or snake_case string to Title Case
 * @param {string} str - String to convert 
 * @returns {string} Title cased string
 */
export function toTitleCase(str) {
  if (!str || typeof str !== 'string') {
    return '';
  }
  
  // Replace hyphens and underscores with spaces
  const normalized = str.replace(/[-_]/g, ' ');
  
  // Title case each word
  return normalized
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Format a file size in bytes to a human-readable string
 * @param {number} bytes - Size in bytes
 * @param {number} [decimals=2] - Number of decimal places
 * @returns {string} Formatted file size
 */
export function formatFileSize(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  if (!bytes || isNaN(Number(bytes))) return 'N/A';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + ' ' + sizes[i];
}
