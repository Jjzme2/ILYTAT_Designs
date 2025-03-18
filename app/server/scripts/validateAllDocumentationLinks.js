#!/usr/bin/env node
/**
 * Documentation Link Validation Script
 * 
 * This script validates all documentation links across the project and generates
 * a comprehensive report. It can identify broken links in markdown documentation
 * and suggest potential fixes.
 * 
 * Usage:
 *   node validateAllDocumentationLinks.js
 *   node validateAllDocumentationLinks.js --fix (to auto-fix resolvable links)
 */

const path = require('path');
const fs = require('fs').promises;
const { glob } = require('glob');
const util = require('util');
const globPromise = util.promisify(glob);
const { 
  extractMarkdownLinks, 
  validateDocumentationLink, 
  extractMarkdownMetadata 
} = require('../src/utils/documentationLinkExtractor');
const logger = require('../src/utils/logger');

// Directories to validate
const DOCUMENTATION_DIRECTORIES = [
  path.join(process.cwd(), '../../_dev'),
  path.join(process.cwd(), '../../app/server/docs'),
  path.join(process.cwd(), '../../app/client/src/docs'),
  // Include resources documented in memory
  path.join(process.cwd(), '../../_dev/shared/notes')
];

// Output directory for reports
const REPORTS_DIR = path.join(process.cwd(), '../../_dev/reports');

/**
 * Validate all documentation files in the specified directories
 */
async function validateAllDocumentation() {
  try {
    console.log('Starting documentation link validation process...');
    
    // Ensure reports directory exists
    await fs.mkdir(REPORTS_DIR, { recursive: true });
    
    // Timestamp for report files
    const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
    
    // Collect all markdown files from the documentation directories
    const allFiles = [];
    
    for (const directory of DOCUMENTATION_DIRECTORIES) {
      try {
        const pattern = path.join(directory, '**', '*.md');
        const files = await globPromise(pattern);
        allFiles.push(...files);
        console.log(`Found ${files.length} documentation files in ${directory}`);
      } catch (error) {
        console.error(`Error scanning directory ${directory}:`, error.message);
      }
    }
    
    console.log(`Total documentation files to validate: ${allFiles.length}`);
    
    // Validate each file
    const results = {
      summary: {
        totalFiles: allFiles.length,
        filesWithErrors: 0,
        totalLinks: 0,
        validLinks: 0,
        invalidLinks: 0
      },
      fileResults: []
    };
    
    for (const file of allFiles) {
      try {
        const content = await fs.readFile(file, 'utf8');
        const links = extractMarkdownLinks(content);
        
        // Validate each link
        const validatedLinks = [];
        let validCount = 0;
        let invalidCount = 0;
        
        for (const link of links) {
          const validation = await validateDocumentationLink(link.url, file);
          
          const validatedLink = {
            text: link.text,
            url: link.url,
            valid: validation.isValid,
            type: validation.type,
            error: validation.isValid ? null : validation.error
          };
          
          validatedLinks.push(validatedLink);
          
          if (validation.isValid) {
            validCount++;
          } else {
            invalidCount++;
          }
        }
        
        // Update file results
        const fileResult = {
          path: file,
          totalLinks: links.length,
          validLinks: validCount,
          invalidLinks: invalidCount,
          links: validatedLinks
        };
        
        results.fileResults.push(fileResult);
        
        // Update summary
        results.summary.totalLinks += links.length;
        results.summary.validLinks += validCount;
        results.summary.invalidLinks += invalidCount;
        
        if (invalidCount > 0) {
          results.summary.filesWithErrors++;
        }
        
        // Log progress
        console.log(`Validated ${file}: ${validCount}/${links.length} valid links`);
      } catch (error) {
        console.error(`Error validating file ${file}:`, error.message);
      }
    }
    
    // Generate JSON report
    const reportFilePath = path.join(REPORTS_DIR, `doc-links-validation-${timestamp}.json`);
    await fs.writeFile(reportFilePath, JSON.stringify(results, null, 2), 'utf8');
    
    // Generate markdown report for easier reading
    const markdownReport = generateMarkdownReport(results, timestamp);
    const markdownReportPath = path.join(REPORTS_DIR, `doc-links-validation-${timestamp}.md`);
    await fs.writeFile(markdownReportPath, markdownReport, 'utf8');
    
    // Print summary
    console.log('\n--- Validation Summary ---');
    console.log(`Total files: ${results.summary.totalFiles}`);
    console.log(`Files with errors: ${results.summary.filesWithErrors}`);
    console.log(`Total links: ${results.summary.totalLinks}`);
    console.log(`Valid links: ${results.summary.validLinks}`);
    console.log(`Invalid links: ${results.summary.invalidLinks}`);
    console.log(`Reports saved to:\n- ${reportFilePath}\n- ${markdownReportPath}`);
    
    // Check if fixes are requested
    if (process.argv.includes('--fix')) {
      await fixBrokenLinks(results, timestamp);
    } else if (results.summary.invalidLinks > 0) {
      console.log('\nTo attempt to fix broken links, run with --fix flag:');
      console.log('  node validateAllDocumentationLinks.js --fix');
    }
    
    return results;
  } catch (error) {
    console.error('Error in documentation validation:', error);
    throw error;
  }
}

/**
 * Generate a markdown report from validation results
 */
function generateMarkdownReport(results, timestamp) {
  const { summary, fileResults } = results;
  
  let report = `# Documentation Link Validation Report\n\n`;
  report += `Generated: ${new Date().toLocaleString()}\n\n`;
  
  report += `## Summary\n\n`;
  report += `- **Total Files**: ${summary.totalFiles}\n`;
  report += `- **Files With Errors**: ${summary.filesWithErrors}\n`;
  report += `- **Total Links**: ${summary.totalLinks}\n`;
  report += `- **Valid Links**: ${summary.validLinks}\n`;
  report += `- **Invalid Links**: ${summary.invalidLinks}\n\n`;
  
  // Files with errors
  if (summary.filesWithErrors > 0) {
    report += `## Files With Errors\n\n`;
    
    const filesWithErrors = fileResults.filter(file => file.invalidLinks > 0);
    filesWithErrors.sort((a, b) => b.invalidLinks - a.invalidLinks);
    
    for (const file of filesWithErrors) {
      const relativePath = path.relative(process.cwd(), file.path);
      report += `### ${relativePath}\n\n`;
      report += `- **Total Links**: ${file.totalLinks}\n`;
      report += `- **Valid Links**: ${file.validLinks}\n`;
      report += `- **Invalid Links**: ${file.invalidLinks}\n\n`;
      
      // List invalid links
      report += `#### Invalid Links\n\n`;
      report += `| Link Text | URL | Error |\n`;
      report += `|-----------|-----|-------|\n`;
      
      const invalidLinks = file.links.filter(link => !link.valid);
      for (const link of invalidLinks) {
        report += `| ${link.text} | \`${link.url}\` | ${link.error || 'Unknown error'} |\n`;
      }
      
      report += `\n`;
    }
  }
  
  return report;
}

/**
 * Try to fix broken links in documentation files
 */
async function fixBrokenLinks(results, timestamp) {
  console.log('\nAttempting to fix broken links...');
  
  // Files to fix
  const filesWithErrors = results.fileResults.filter(file => file.invalidLinks > 0);
  let totalFixed = 0;
  let totalFilesFixed = 0;
  
  const fixes = {
    summary: {
      filesAttempted: filesWithErrors.length,
      filesFixed: 0,
      totalFixed: 0,
      totalUnfixed: 0
    },
    fileResults: []
  };
  
  for (const file of filesWithErrors) {
    try {
      const content = await fs.readFile(file.path, 'utf8');
      const invalidLinks = file.links.filter(link => !link.valid);
      
      let updatedContent = content;
      let fixedInThisFile = 0;
      const fixResults = [];
      
      // Identify known patterns and common fixes
      for (const link of invalidLinks) {
        // Fix for case-sensitive filesystem issues
        const caseSensitiveFixUrl = await findCaseSensitiveMatch(link.url, file.path);
        if (caseSensitiveFixUrl) {
          const linkRegex = new RegExp(`\\[${escapeRegExp(link.text)}\\]\\(${escapeRegExp(link.url)}\\)`, 'g');
          const newLinkText = `[${link.text}](${caseSensitiveFixUrl})`;
          const originalContent = updatedContent;
          updatedContent = updatedContent.replace(linkRegex, newLinkText);
          
          if (updatedContent !== originalContent) {
            fixedInThisFile++;
            fixResults.push({
              text: link.text,
              oldUrl: link.url,
              newUrl: caseSensitiveFixUrl,
              fixed: true
            });
            continue;
          }
        }
        
        // Fix for missing or incorrect file extensions
        const extensionFixUrl = await findWithCorrectExtension(link.url, file.path);
        if (extensionFixUrl) {
          const linkRegex = new RegExp(`\\[${escapeRegExp(link.text)}\\]\\(${escapeRegExp(link.url)}\\)`, 'g');
          const newLinkText = `[${link.text}](${extensionFixUrl})`;
          const originalContent = updatedContent;
          updatedContent = updatedContent.replace(linkRegex, newLinkText);
          
          if (updatedContent !== originalContent) {
            fixedInThisFile++;
            fixResults.push({
              text: link.text,
              oldUrl: link.url,
              newUrl: extensionFixUrl,
              fixed: true
            });
            continue;
          }
        }
        
        // Fix for relative path issues
        const relativePathFixUrl = await findRelativePathFix(link.url, file.path);
        if (relativePathFixUrl) {
          const linkRegex = new RegExp(`\\[${escapeRegExp(link.text)}\\]\\(${escapeRegExp(link.url)}\\)`, 'g');
          const newLinkText = `[${link.text}](${relativePathFixUrl})`;
          const originalContent = updatedContent;
          updatedContent = updatedContent.replace(linkRegex, newLinkText);
          
          if (updatedContent !== originalContent) {
            fixedInThisFile++;
            fixResults.push({
              text: link.text,
              oldUrl: link.url,
              newUrl: relativePathFixUrl,
              fixed: true
            });
            continue;
          }
        }
        
        // Document unfixed links
        fixResults.push({
          text: link.text,
          oldUrl: link.url,
          fixed: false,
          reason: 'No suitable replacement found'
        });
      }
      
      // Save the file if fixes were made
      if (fixedInThisFile > 0) {
        await fs.writeFile(file.path, updatedContent, 'utf8');
        totalFixed += fixedInThisFile;
        totalFilesFixed++;
        
        fixes.summary.filesFixed++;
        fixes.summary.totalFixed += fixedInThisFile;
        
        console.log(`Fixed ${fixedInThisFile}/${invalidLinks.length} links in ${file.path}`);
      } else {
        console.log(`Could not fix any links in ${file.path}`);
      }
      
      fixes.summary.totalUnfixed += invalidLinks.length - fixedInThisFile;
      
      // Record file results
      fixes.fileResults.push({
        path: file.path,
        totalInvalid: invalidLinks.length,
        fixed: fixedInThisFile,
        unfixed: invalidLinks.length - fixedInThisFile,
        fixes: fixResults
      });
    } catch (error) {
      console.error(`Error fixing file ${file.path}:`, error.message);
    }
  }
  
  // Generate fix report
  const fixReportPath = path.join(REPORTS_DIR, `doc-links-fixes-${timestamp}.json`);
  await fs.writeFile(fixReportPath, JSON.stringify(fixes, null, 2), 'utf8');
  
  // Generate markdown fix report
  const markdownReport = generateFixMarkdownReport(fixes, timestamp);
  const markdownReportPath = path.join(REPORTS_DIR, `doc-links-fixes-${timestamp}.md`);
  await fs.writeFile(markdownReportPath, markdownReport, 'utf8');
  
  console.log('\n--- Fix Summary ---');
  console.log(`Files with broken links: ${filesWithErrors.length}`);
  console.log(`Files with fixes applied: ${totalFilesFixed}`);
  console.log(`Total links fixed: ${totalFixed}`);
  console.log(`Total links unfixed: ${fixes.summary.totalUnfixed}`);
  console.log(`Fix reports saved to:\n- ${fixReportPath}\n- ${markdownReportPath}`);
}

/**
 * Generate a markdown report for fixes
 */
function generateFixMarkdownReport(fixes, timestamp) {
  const { summary, fileResults } = fixes;
  
  let report = `# Documentation Link Fix Report\n\n`;
  report += `Generated: ${new Date().toLocaleString()}\n\n`;
  
  report += `## Summary\n\n`;
  report += `- **Files Attempted**: ${summary.filesAttempted}\n`;
  report += `- **Files Fixed**: ${summary.filesFixed}\n`;
  report += `- **Total Links Fixed**: ${summary.totalFixed}\n`;
  report += `- **Total Links Unfixed**: ${summary.totalUnfixed}\n\n`;
  
  // Files with fixes
  if (summary.filesFixed > 0) {
    report += `## Files With Fixes\n\n`;
    
    const filesWithFixes = fileResults.filter(file => file.fixed > 0);
    filesWithFixes.sort((a, b) => b.fixed - a.fixed);
    
    for (const file of filesWithFixes) {
      const relativePath = path.relative(process.cwd(), file.path);
      report += `### ${relativePath}\n\n`;
      report += `- **Invalid Links**: ${file.totalInvalid}\n`;
      report += `- **Fixed Links**: ${file.fixed}\n`;
      report += `- **Unfixed Links**: ${file.unfixed}\n\n`;
      
      // List fixed links
      report += `#### Fixed Links\n\n`;
      report += `| Link Text | Old URL | New URL |\n`;
      report += `|-----------|---------|--------|\n`;
      
      const fixedLinks = file.fixes.filter(fix => fix.fixed);
      for (const fix of fixedLinks) {
        report += `| ${fix.text} | \`${fix.oldUrl}\` | \`${fix.newUrl}\` |\n`;
      }
      
      report += `\n`;
      
      // List unfixed links
      if (file.unfixed > 0) {
        report += `#### Unfixed Links\n\n`;
        report += `| Link Text | URL | Reason |\n`;
        report += `|-----------|-----|-------|\n`;
        
        const unfixedLinks = file.fixes.filter(fix => !fix.fixed);
        for (const fix of unfixedLinks) {
          report += `| ${fix.text} | \`${fix.oldUrl}\` | ${fix.reason} |\n`;
        }
        
        report += `\n`;
      }
    }
  }
  
  // Recommendations
  report += `## Recommendations\n\n`;
  report += `For any remaining broken links, consider the following approaches:\n\n`;
  report += `1. **Create Missing Documentation**: Some links may point to documentation that hasn't been created yet.\n`;
  report += `2. **Use Consistent Naming**: Ensure documentation files follow a consistent naming pattern.\n`;
  report += `3. **Verify Path Structure**: Ensure paths are consistent with the project structure.\n`;
  report += `4. **Use Relative Paths**: When linking between documents in the same directory, use relative paths.\n`;
  report += `5. **Consider Documentation Index Files**: Create index files to help organize content.\n`;
  
  return report;
}

/**
 * Find a case-sensitive match for a path
 */
async function findCaseSensitiveMatch(urlPath, sourcePath) {
  try {
    // Only process local paths, not external links
    if (urlPath.startsWith('http') || urlPath.startsWith('#')) {
      return null;
    }
    
    const basePath = path.dirname(sourcePath);
    let targetPath;
    
    if (urlPath.startsWith('/')) {
      targetPath = path.join(process.cwd(), '..', '..', urlPath);
    } else if (urlPath.startsWith('../')) {
      targetPath = path.resolve(basePath, urlPath);
    } else {
      targetPath = path.join(basePath, urlPath);
    }
    
    // Get the directory of the target path
    const targetDir = path.dirname(targetPath);
    const targetBasename = path.basename(targetPath);
    
    try {
      // Check if the directory exists
      await fs.access(targetDir);
      
      // Get all files in the directory
      const files = await fs.readdir(targetDir);
      
      // Look for a case-insensitive match
      const match = files.find(file => 
        file.toLowerCase() === targetBasename.toLowerCase() && file !== targetBasename
      );
      
      if (match) {
        // Create a new URL with the correct case
        const newPath = urlPath.replace(targetBasename, match);
        return newPath;
      }
    } catch (err) {
      // Directory might not exist or other issues
      return null;
    }
    
    return null;
  } catch (error) {
    console.error('Error in findCaseSensitiveMatch:', error.message);
    return null;
  }
}

/**
 * Find a path with the correct extension
 */
async function findWithCorrectExtension(urlPath, sourcePath) {
  try {
    // Only process local paths without extensions or with incorrect ones
    if (urlPath.startsWith('http') || urlPath.startsWith('#')) {
      return null;
    }
    
    // Check if the path already has a markdown extension
    if (urlPath.endsWith('.md')) {
      return null;
    }
    
    // Try adding .md extension
    const pathWithMd = `${urlPath}.md`;
    
    const basePath = path.dirname(sourcePath);
    let targetPath;
    
    if (pathWithMd.startsWith('/')) {
      targetPath = path.join(process.cwd(), '..', '..', pathWithMd);
    } else if (pathWithMd.startsWith('../')) {
      targetPath = path.resolve(basePath, pathWithMd);
    } else {
      targetPath = path.join(basePath, pathWithMd);
    }
    
    try {
      // Check if file with markdown extension exists
      await fs.access(targetPath);
      return pathWithMd;
    } catch (err) {
      // File with .md doesn't exist
      return null;
    }
  } catch (error) {
    console.error('Error in findWithCorrectExtension:', error.message);
    return null;
  }
}

/**
 * Find a fix for relative path issues
 */
async function findRelativePathFix(urlPath, sourcePath) {
  try {
    // Only process local paths that don't start with / or ../
    if (urlPath.startsWith('http') || 
        urlPath.startsWith('#') || 
        urlPath.startsWith('/') || 
        urlPath.startsWith('../')) {
      return null;
    }
    
    const basePath = path.dirname(sourcePath);
    
    // Try with ./ prefix
    const withDotSlash = `./${urlPath}`;
    const targetWithDotSlash = path.join(basePath, urlPath);
    
    try {
      await fs.access(targetWithDotSlash);
      return withDotSlash;
    } catch (err) {
      // Not found with ./ prefix
    }
    
    // Try finding in parent directory
    const withParentDir = `../${urlPath}`;
    const parentDir = path.dirname(basePath);
    const targetWithParentDir = path.join(parentDir, urlPath);
    
    try {
      await fs.access(targetWithParentDir);
      return withParentDir;
    } catch (err) {
      // Not found in parent directory
    }
    
    return null;
  } catch (error) {
    console.error('Error in findRelativePathFix:', error.message);
    return null;
  }
}

/**
 * Escape special regex characters in a string
 */
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Execute the validation if this script is run directly
if (require.main === module) {
  validateAllDocumentation()
    .then(() => {
      console.log('Documentation validation complete.');
    })
    .catch(error => {
      console.error('Error during validation:', error);
      process.exit(1);
    });
}

module.exports = {
  validateAllDocumentation,
  fixBrokenLinks
};
