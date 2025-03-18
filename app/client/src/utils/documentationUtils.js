/**
 * Documentation Utilities - Client Side
 * 
 * This module provides utilities for working with the project's documentation system
 * within the client application. It handles documentation paths and allows for
 * fetching documentation content when needed.
 */

/**
 * Resolves the correct URL path to access documentation through the server's API
 * 
 * @param {string} relativePath - Path relative to documentation structure
 * @returns {string} API URL to access the documentation 
 * @example
 * // Get URL for a central documentation file
 * const dbGuideUrl = resolveDocPath('shared/guides/database/database-migration-guide.md');
 * 
 * // Get URL for an application-specific documentation file
 * const serverSecurityUrl = resolveDocPath('app/server/docs/SECURITY.md');
 */
export function resolveDocPath(relativePath) {
  // For app-specific documentation
  if (relativePath.startsWith('app/')) {
    return `/api/documentation/app-specific?path=${encodeURIComponent(relativePath)}`;
  }
  
  // For centralized documentation
  return `/api/documentation/central?path=${encodeURIComponent(relativePath)}`;
}

/**
 * Fetches documentation content from the server
 * 
 * @param {string} relativePath - Path relative to documentation structure
 * @returns {Promise<string>} Content of the documentation file
 */
export async function fetchDocumentation(relativePath) {
  try {
    const url = resolveDocPath(relativePath);
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch documentation: ${response.statusText}`);
    }
    
    return await response.text();
  } catch (error) {
    console.error(`Error fetching documentation at ${relativePath}:`, error.message);
    return null;
  }
}

/**
 * Gets a list of available documentation files for a specific category
 * 
 * @param {string} category - Documentation category (e.g., 'database', 'authentication')
 * @returns {Promise<Array>} Array of documentation metadata
 */
export async function listDocumentationByCategory(category) {
  try {
    const response = await fetch(`/api/documentation/list?category=${encodeURIComponent(category)}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch documentation list: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Error listing documentation for category ${category}:`, error.message);
    return [];
  }
}

/**
 * Checks if a documentation path exists and is accessible
 * 
 * @param {string} relativePath - Path relative to documentation structure
 * @returns {Promise<boolean>} Whether the documentation exists
 */
export async function checkDocumentationExists(relativePath) {
  try {
    const url = resolveDocPath(relativePath);
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok;
  } catch (error) {
    return false;
  }
}
