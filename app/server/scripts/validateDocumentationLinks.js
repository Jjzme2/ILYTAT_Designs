#!/usr/bin/env node
/**
 * Documentation Link Validation Script
 * 
 * This script validates all links in the project documentation files and generates a report.
 * It can also automatically fix broken links when suitable replacements are found.
 * 
 * Usage:
 * - To generate a validation report: node validateDocumentationLinks.js
 * - To fix broken links automatically: node validateDocumentationLinks.js --fix
 */

const path = require('path');
const fs = require('fs').promises;
const { 
  generateLinkValidationReport,
  fixFileLinks,
  validateFileLinks,
  findPossibleReplacement
} = require('../src/utils/documentationLinkValidator');
const logger = require('../src/utils/logger');

// Set up logging for the script
if (!logger.response) {
  logger.response = {
    error: (err) => err,
    success: (data) => data
  };
}

/**
 * Main script execution
 */
async function main() {
  try {
    const projectRoot = path.resolve(process.cwd(), '../../');
    console.log(`Project root: ${projectRoot}`);
    
    // Parse command-line arguments
    const args = process.argv.slice(2);
    const shouldFix = args.includes('--fix');
    
    // Report output path
    const reportDir = path.join(projectRoot, '_dev', 'reports');
    const reportPath = path.join(reportDir, `doc-links-validation-${new Date().toISOString().slice(0,10)}.json`);
    
    // Ensure reports directory exists
    try {
      await fs.mkdir(reportDir, { recursive: true });
    } catch (error) {
      if (error.code !== 'EEXIST') {
        throw error;
      }
    }
    
    console.log('Starting documentation link validation...');
    console.log(`Generated report will be saved to: ${reportPath}`);
    
    // Generate validation report
    const report = await generateLinkValidationReport(reportPath);
    
    // Display summary
    console.log('\n--- Validation Summary ---');
    console.log(`Total Files: ${report.summary.totalFiles}`);
    console.log(`Total Valid Links: ${report.summary.totalValidLinks}`);
    console.log(`Total Invalid Links: ${report.summary.totalInvalidLinks}`);
    console.log(`Report saved to ${report.jsonReport}`);
    console.log(`Markdown report saved to ${report.markdownReport}`);
    
    // Fix invalid links if requested
    if (shouldFix && report.summary.totalInvalidLinks > 0) {
      console.log('\nAttempting to fix invalid links...');
      
      // Load the report
      const reportContent = await fs.readFile(report.jsonReport, 'utf8');
      const reportData = JSON.parse(reportContent);
      
      // Track fix results
      const fixResults = {
        totalFixed: 0,
        totalUnfixed: 0,
        fileResults: []
      };
      
      // Process each file with invalid links
      for (const fileProblems of reportData.problemDetails) {
        const filePath = fileProblems.file;
        
        // Prepare suggestions for fixing
        const suggestions = fileProblems.invalidLinks.map(link => ({
          text: link.text,
          oldUrl: link.url,
          replacement: link.suggestedReplacement
        }));
        
        if (suggestions.length > 0) {
          console.log(`Fixing links in ${filePath}...`);
          
          // Fix links in the file
          const fileFixResults = await fixFileLinks(filePath, suggestions);
          
          // Update totals
          fixResults.totalFixed += fileFixResults.fixedLinks.length;
          fixResults.totalUnfixed += fileFixResults.unfixableLinks.length;
          
          // Store file results
          fixResults.fileResults.push({
            file: filePath,
            fixed: fileFixResults.fixedLinks.length,
            unfixed: fileFixResults.unfixableLinks.length,
            details: fileFixResults
          });
          
          // Display results for this file
          console.log(`  - Fixed ${fileFixResults.fixedLinks.length} links`);
          console.log(`  - Could not fix ${fileFixResults.unfixableLinks.length} links`);
        }
      }
      
      // Save fix report
      const fixReportPath = path.join(reportDir, `doc-links-fix-${new Date().toISOString().slice(0,10)}.json`);
      await fs.writeFile(fixReportPath, JSON.stringify(fixResults, null, 2), 'utf8');
      
      // Display summary of fixes
      console.log('\n--- Fix Summary ---');
      console.log(`Total Fixed Links: ${fixResults.totalFixed}`);
      console.log(`Total Unfixed Links: ${fixResults.totalUnfixed}`);
      console.log(`Fix report saved to ${fixReportPath}`);
    }
    
    console.log('\nDocumentation link validation complete!');
    
    // Return success or failure based on invalid links
    if (report.summary.totalInvalidLinks > 0) {
      console.log('\nWarning: Some documentation links are invalid. Review the report for details.');
      return 1;
    } else {
      console.log('\nSuccess: All documentation links are valid!');
      return 0;
    }
  } catch (error) {
    console.error('Error during documentation link validation:', error);
    return 1;
  }
}

// Run the main function
main()
  .then(exitCode => {
    process.exit(exitCode);
  })
  .catch(error => {
    console.error('Unexpected error:', error);
    process.exit(1);
  });
