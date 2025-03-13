/**
 * Documentation Service
 * 
 * Service for interacting with the documentation API endpoints.
 * Provides functions for fetching and managing documentation.
 */

import axios from 'axios';

/**
 * Base API URL for documentation endpoints
 */
const API_BASE_URL = '/api/documentations';

/**
 * Fetch all documentation files available in the codebase
 * @returns {Promise} Promise resolving to the file list
 */
export const fetchDocumentFiles = async () => {
  try {
    return await axios.get(`${API_BASE_URL}/files`);
  } catch (error) {
    console.error('Error fetching documentation files:', error);
    throw error;
  }
};

/**
 * Fetch the content of a specific documentation file
 * @param {string} filePath - Path to the documentation file
 * @returns {Promise} Promise resolving to the file content
 */
export const fetchDocumentContent = async (filePath) => {
  try {
    return await axios.get(`${API_BASE_URL}/files/${encodeURIComponent(filePath)}`);
  } catch (error) {
    console.error(`Error fetching documentation content for ${filePath}:`, error);
    throw error;
  }
};

/**
 * Save content to a documentation file
 * @param {string} filePath - Path to the documentation file
 * @param {string} content - Content to save
 * @param {Object} [frontMatter] - Optional front matter metadata
 * @returns {Promise} Promise resolving to the saved file data
 */
export const saveDocumentContent = async (filePath, content, frontMatter = null) => {
  try {
    return await axios.post(
      `${API_BASE_URL}/files/${encodeURIComponent(filePath)}/save`,
      { content, frontMatter }
    );
  } catch (error) {
    console.error(`Error saving documentation content for ${filePath}:`, error);
    throw error;
  }
};

/**
 * Fetch all documentation categories
 * @returns {Promise} Promise resolving to the categories list
 */
export const fetchCategories = async () => {
  try {
    return await axios.get(`${API_BASE_URL}/categories`);
  } catch (error) {
    console.error('Error fetching documentation categories:', error);
    throw error;
  }
};

/**
 * Fetch documentation for the current user based on their role
 * @returns {Promise} Promise resolving to the documentation list
 */
export const fetchCurrentUserDocumentation = async () => {
  try {
    return await axios.get(API_BASE_URL);
  } catch (error) {
    console.error('Error fetching user documentation:', error);
    throw error;
  }
};

/**
 * Fetch public documentation (no authentication required)
 * @returns {Promise} Promise resolving to the public documentation list
 */
export const fetchPublicDocumentation = async () => {
  try {
    return await axios.get(`${API_BASE_URL}/public`);
  } catch (error) {
    console.error('Error fetching public documentation:', error);
    throw error;
  }
};

/**
 * Fetch documentation by specific ID
 * @param {string|number} id - Documentation ID
 * @returns {Promise} Promise resolving to the documentation item
 */
export const fetchDocumentById = async (id) => {
  try {
    return await axios.get(`${API_BASE_URL}/${id}`);
  } catch (error) {
    console.error(`Error fetching documentation ${id}:`, error);
    throw error;
  }
};

export default {
  fetchDocumentFiles,
  fetchDocumentContent,
  saveDocumentContent,
  fetchCategories,
  fetchCurrentUserDocumentation,
  fetchPublicDocumentation,
  fetchDocumentById
};
