/**
 * Tests for formatting utility functions
 * 
 * These tests validate the behavior of all formatter utility functions
 * to ensure they handle all input cases correctly.
 */
import { 
  formatCurrency, 
  formatDate, 
  truncateText, 
  toTitleCase,
  formatFileSize 
} from '@/utils/formatters';

describe('formatCurrency', () => {
  test('formats numbers as USD currency by default', () => {
    expect(formatCurrency(1234.56)).toBe('$1,234.56');
    expect(formatCurrency(0)).toBe('$0.00');
    expect(formatCurrency(1000000)).toBe('$1,000,000.00');
  });

  test('handles string numbers correctly', () => {
    expect(formatCurrency('1234.56')).toBe('$1,234.56');
    expect(formatCurrency('0')).toBe('$0.00');
  });

  test('uses provided currency code and locale', () => {
    expect(formatCurrency(1234.56, 'EUR', 'de-DE')).toMatch(/1.234,56\s€/);
    // Use a more flexible pattern for JPY to account for potential character differences
    expect(formatCurrency(1234.56, 'JPY', 'ja-JP')).toMatch(/[\¥￥]1,235/);
  });

  test('handles invalid inputs gracefully', () => {
    expect(formatCurrency(null)).toBe('N/A');
    expect(formatCurrency(undefined)).toBe('N/A');
    expect(formatCurrency('not a number')).toBe('N/A');
  });
});

describe('formatDate', () => {
  // Create fixed dates for testing
  const testDate = new Date('2024-03-14T12:00:00');
  const testTimestamp = testDate.getTime();
  const testISOString = testDate.toISOString();

  test('formats Date objects with default options', () => {
    const result = formatDate(testDate);
    expect(result).toMatch(/Mar 14, 2024/);
  });

  test('formats timestamp numbers', () => {
    const result = formatDate(testTimestamp);
    expect(result).toMatch(/Mar 14, 2024/);
  });

  test('formats ISO date strings', () => {
    const result = formatDate(testISOString);
    expect(result).toMatch(/Mar 14, 2024/);
  });

  test('applies custom format options', () => {
    const options = { 
      weekday: 'long',
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    
    const result = formatDate(testDate, options);
    
    // Result should contain full month name and time
    expect(result).toMatch(/Thursday, March 14, 2024/);
    expect(result).toMatch(/12:00/);
  });

  test('handles different locales', () => {
    const result = formatDate(testDate, {}, 'fr-FR');
    // French date format
    expect(result).toMatch(/14 mars 2024/);
  });

  test('handles invalid inputs gracefully', () => {
    expect(formatDate(null)).toBe('N/A');
    expect(formatDate(undefined)).toBe('N/A');
    expect(formatDate('not a date')).toBe('Invalid Date');
  });
});

describe('truncateText', () => {
  const longText = 'This is a very long text that needs to be truncated because it exceeds the maximum allowed length for display in certain UI components.';
  
  test('truncates text longer than specified length', () => {
    const result = truncateText(longText, 20);
    expect(result).toBe('This is a very long...');
    // Don't test exact length as it may vary by implementation
    expect(result.length).toBeGreaterThanOrEqual(20);
    expect(result.length).toBeLessThanOrEqual(25);
  });

  test('does not truncate text shorter than length', () => {
    const shortText = 'Short text';
    expect(truncateText(shortText, 20)).toBe(shortText);
  });

  test('uses custom ellipsis if provided', () => {
    expect(truncateText(longText, 20, ' [more]')).toBe('This is a very long [more]');
  });

  test('handles empty or invalid inputs', () => {
    expect(truncateText('')).toBe('');
    expect(truncateText(null)).toBe('');
    expect(truncateText(undefined)).toBe('');
    expect(truncateText(123)).toBe('');
  });

  test('uses default length of 100 if not specified', () => {
    const exactText = 'a'.repeat(100);
    expect(truncateText(exactText)).toBe(exactText);
    expect(truncateText(exactText + 'extra')).toBe(exactText + '...');
  });
});

describe('toTitleCase', () => {
  test('converts kebab-case to Title Case', () => {
    expect(toTitleCase('hello-world')).toBe('Hello World');
    expect(toTitleCase('product-detail-view')).toBe('Product Detail View');
  });

  test('converts snake_case to Title Case', () => {
    expect(toTitleCase('hello_world')).toBe('Hello World');
    expect(toTitleCase('user_profile_settings')).toBe('User Profile Settings');
  });

  test('handles mixed case input', () => {
    expect(toTitleCase('mixedCASE-string_here')).toBe('Mixedcase String Here');
  });

  test('handles empty or invalid inputs', () => {
    expect(toTitleCase('')).toBe('');
    expect(toTitleCase(null)).toBe('');
    expect(toTitleCase(undefined)).toBe('');
    expect(toTitleCase(123)).toBe('');
  });
});

describe('formatFileSize', () => {
  test('formats bytes correctly for different size ranges', () => {
    expect(formatFileSize(0)).toBe('0 Bytes');
    expect(formatFileSize(512)).toBe('512 Bytes');
    expect(formatFileSize(1024)).toBe('1 KB');
    expect(formatFileSize(1536)).toBe('1.5 KB');
    expect(formatFileSize(1048576)).toBe('1 MB');
    expect(formatFileSize(1073741824)).toBe('1 GB');
  });

  test('respects decimal places parameter', () => {
    expect(formatFileSize(1500, 0)).toBe('1 KB');
    expect(formatFileSize(1500, 1)).toBe('1.5 KB');
    expect(formatFileSize(1500, 3)).toBe('1.465 KB');
  });

  test('handles invalid inputs gracefully', () => {
    expect(formatFileSize(null)).toBe('N/A');
    expect(formatFileSize(undefined)).toBe('N/A');
    expect(formatFileSize('not a size')).toBe('N/A');
  });
});
