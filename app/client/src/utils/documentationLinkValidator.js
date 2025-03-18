/**
 * Documentation Link Validator Utility
 * 
 * Client-side utility for validating documentation links and displaying validation results.
 * This helps identify and fix broken links in documentation files.
 */

import axios from 'axios';
import { resolveDocPath } from './documentationUtils';

/**
 * Validate links in a documentation file
 * 
 * @param {string} docPath - Path to the documentation file
 * @returns {Promise<Object>} Validation results with link details
 */
export async function validateDocumentationLinks(docPath) {
  try {
    const response = await axios.get('/api/documentation/validate-links', {
      params: { path: docPath }
    });
    
    return response.data.data;
  } catch (error) {
    console.error('Error validating documentation links:', error);
    throw error;
  }
}

/**
 * Get documentation content with link validation
 * 
 * @param {string} docPath - Path to the documentation file
 * @param {string} format - Response format (html or markdown)
 * @returns {Promise<Object>} Documentation content with validation results
 */
export async function getDocumentationWithValidation(docPath, format = 'html') {
  try {
    const response = await axios.get('/api/documentation/central', {
      params: { 
        path: docPath,
        format,
        validateLinks: true,
        responseType: 'json'
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Error getting documentation with validation:', error);
    throw error;
  }
}

/**
 * Format link validation results for display
 * 
 * @param {Object} validationResults - Validation results from the API
 * @returns {Object} Formatted results with CSS classes and messages
 */
export function formatLinkValidation(validationResults) {
  if (!validationResults) {
    return null;
  }
  
  const { totalLinks, validLinks, invalidLinks, details } = validationResults;
  
  // Generate summary status
  let status = 'success';
  let statusMessage = 'All links are valid';
  
  if (invalidLinks > 0) {
    status = invalidLinks > validLinks ? 'error' : 'warning';
    statusMessage = `${invalidLinks} of ${totalLinks} links are invalid`;
  }
  
  // Format individual link details
  const formattedLinks = details ? {
    valid: details.valid.map(link => ({
      ...link,
      status: 'success',
      statusClass: 'valid-link',
      message: `Valid ${link.type} link`
    })),
    invalid: details.invalid.map(link => ({
      ...link,
      status: 'error',
      statusClass: 'invalid-link',
      message: link.error || 'Invalid link'
    }))
  } : null;
  
  return {
    status,
    statusClass: `link-validation-${status}`,
    statusMessage,
    totalLinks,
    validLinks,
    invalidLinks,
    links: formattedLinks
  };
}

/**
 * Create an HTML overlay for link validation in documentation content
 * 
 * @param {string} htmlContent - HTML documentation content
 * @param {Object} validationResults - Validation results from the API
 * @returns {string} HTML content with validation overlays
 */
export function createLinkValidationOverlay(htmlContent, validationResults) {
  if (!validationResults || !validationResults.links) {
    return htmlContent;
  }
  
  let processedContent = htmlContent;
  const { valid, invalid } = validationResults.links;
  
  // Process valid links first
  valid.forEach(link => {
    const linkRegex = new RegExp(`<a\\s+href=["']${escapeRegExp(link.url)}["'][^>]*>${escapeRegExp(link.text)}</a>`, 'g');
    processedContent = processedContent.replace(linkRegex, 
      `<a href="${link.url}" class="valid-link" title="Valid ${link.type} link">${link.text}</a>`
    );
  });
  
  // Process invalid links
  invalid.forEach(link => {
    const linkRegex = new RegExp(`<a\\s+href=["']${escapeRegExp(link.url)}["'][^>]*>${escapeRegExp(link.text)}</a>`, 'g');
    processedContent = processedContent.replace(linkRegex, 
      `<a href="${link.url}" class="invalid-link" title="Invalid link: ${link.error}" 
         style="color: red; text-decoration: line-through;">${link.text}</a>`
    );
  });
  
  return processedContent;
}

/**
 * Escape special regex characters in a string
 * 
 * @param {string} string - String to escape
 * @returns {string} Escaped string
 */
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Generate a validation summary component for documentation
 * 
 * @param {Object} validationResults - Validation results from the API
 * @returns {string} HTML for a validation summary component
 */
export function generateValidationSummary(validationResults) {
  if (!validationResults) {
    return '';
  }
  
  const formatted = formatLinkValidation(validationResults);
  if (!formatted) {
    return '';
  }
  
  let summaryHtml = `
    <div class="link-validation-summary ${formatted.statusClass}">
      <h4>Link Validation</h4>
      <p>${formatted.statusMessage}</p>
      <ul>
        <li>Total Links: ${formatted.totalLinks}</li>
        <li>Valid Links: ${formatted.validLinks}</li>
        <li>Invalid Links: ${formatted.invalidLinks}</li>
      </ul>
  `;
  
  if (formatted.invalidLinks > 0) {
    summaryHtml += `
      <div class="invalid-links-list">
        <h5>Invalid Links:</h5>
        <ul>
    `;
    
    formatted.links.invalid.forEach(link => {
      summaryHtml += `
        <li>
          <span class="link-text">${link.text}</span>
          <span class="link-url">${link.url}</span>
          <span class="link-error">${link.message}</span>
        </li>
      `;
    });
    
    summaryHtml += `
        </ul>
      </div>
    `;
  }
  
  summaryHtml += `</div>`;
  
  return summaryHtml;
}

/**
 * CSS styles for link validation
 * 
 * @returns {string} CSS styles for link validation
 */
export const linkValidationStyles = `
.link-validation-summary {
  margin: 20px 0;
  padding: 15px;
  border-radius: 5px;
  font-family: sans-serif;
}

.link-validation-success {
  background-color: #e8f5e9;
  border: 1px solid #388e3c;
  color: #2e7d32;
}

.link-validation-warning {
  background-color: #fff8e1;
  border: 1px solid #ffa000;
  color: #ff8f00;
}

.link-validation-error {
  background-color: #ffebee;
  border: 1px solid #d32f2f;
  color: #c62828;
}

.invalid-links-list {
  margin-top: 10px;
  font-size: 0.9em;
}

.invalid-links-list ul {
  padding-left: 20px;
}

.invalid-links-list li {
  margin-bottom: 5px;
}

.link-text {
  font-weight: bold;
}

.link-url {
  font-family: monospace;
  display: block;
  margin: 2px 0;
}

.link-error {
  font-style: italic;
  display: block;
  margin-top: 2px;
  color: #d32f2f;
}

a.valid-link {
  border-bottom: 1px solid #4caf50;
}

a.invalid-link {
  color: #d32f2f;
  text-decoration: line-through;
  border-bottom: 1px dashed #d32f2f;
}
`;

export default {
  validateDocumentationLinks,
  getDocumentationWithValidation,
  formatLinkValidation,
  createLinkValidationOverlay,
  generateValidationSummary,
  linkValidationStyles
};
