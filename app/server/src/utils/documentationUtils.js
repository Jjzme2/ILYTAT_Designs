/**
 * Documentation Utilities
 * 
 * This module provides utilities for working with the project's documentation system.
 * It simplifies access to documentation files across the central _dev structure and application-specific locations.
 */

const path = require('path');
const fs = require('fs');

/**
 * Resolves a documentation path relative to the project root
 * 
 * @param {string} relativePath - Path relative to documentation structure
 * @returns {string} Absolute path to the documentation file
 * @example
 * // Get path to a central documentation file
 * const dbGuidePath = resolveDocPath('shared/guides/database/database-migration-guide.md');
 * 
 * // Get path to an application-specific documentation file
 * const serverSecurityPath = resolveDocPath('app/server/docs/SECURITY.md');
 */
function resolveDocPath(relativePath) {
  // Detect project root by looking for package.json
  const projectRoot = findProjectRoot(process.cwd());
  
  // For app-specific documentation
  if (relativePath.startsWith('app/')) {
    return path.join(projectRoot, relativePath);
  }
  
  // For centralized documentation
  return path.join(projectRoot, '_dev', relativePath);
}

/**
 * Reads documentation content from a specified path
 * 
 * @param {string} relativePath - Path relative to documentation structure
 * @returns {Promise<string>} Content of the documentation file
 */
async function readDocumentation(relativePath) {
  const docPath = resolveDocPath(relativePath);
  
  try {
    return await fs.promises.readFile(docPath, 'utf8');
  } catch (error) {
    console.error(`Error reading documentation at ${relativePath}:`, error.message);
    return null;
  }
}

/**
 * Lists all documentation files in a specified directory
 * 
 * @param {string} relativeDirPath - Directory path relative to documentation structure
 * @returns {Promise<string[]>} Array of file paths relative to the given directory
 */
async function listDocumentationFiles(relativeDirPath) {
  const dirPath = resolveDocPath(relativeDirPath);
  
  try {
    const files = await fs.promises.readdir(dirPath);
    return files.filter(file => file.endsWith('.md'));
  } catch (error) {
    console.error(`Error listing documentation in ${relativeDirPath}:`, error.message);
    return [];
  }
}

/**
 * Finds the project root by looking for package.json, starting from the current directory
 * and moving up the directory tree until found
 * 
 * @param {string} startDir - Directory to start searching from
 * @returns {string} Path to the project root
 */
function findProjectRoot(startDir) {
  let currentDir = startDir;
  
  while (currentDir !== path.parse(currentDir).root) {
    if (fs.existsSync(path.join(currentDir, 'package.json'))) {
      return currentDir;
    }
    currentDir = path.dirname(currentDir);
  }
  
  // If no package.json found, assume current directory is root
  return startDir;
}

module.exports = {
  resolveDocPath,
  readDocumentation,
  listDocumentationFiles
};
