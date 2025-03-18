# Documentation Cross-Reference Guide

## Overview
This guide explains how the centralized documentation system interfaces with application-specific documentation located in the client and server codebases.

## Documentation Organization Philosophy

ILYTAT Designs follows a hybrid documentation approach:

1. **Centralized Documentation** - The `_dev` directory serves as the primary documentation hub:
   - Contains all development guides, standards, and shared knowledge
   - Provides a consistent structure and navigation system
   - Makes documentation easily discoverable for new team members

2. **Application-Specific Documentation** - Certain documentation remains within the application subdirectories:
   - Server documentation in `app/server/docs` and `app/server/src/docs`
   - Client documentation in `app/client/src/docs`
   - These remain in place to be:
     - Bundled with the application during deployment
     - Versioned alongside the specific code they document
     - Directly accessible to developers working in those specific areas

## Cross-Reference System

To maintain organization while preserving application-specific documentation locations:

1. **Reference Indexes** - Each main category in our centralized documentation includes references to relevant application-specific documentation:
   - `_dev/shared/server-docs` - Index of all server documentation
   - `_dev/shared/client-docs` - Index of all client documentation

2. **Relative Paths** - All references use relative paths from the documentation root:
   ```markdown
   [Server Security Guidelines](../../../app/server/docs/SECURITY.md)
   ```

3. **Integration with Guides** - Topic-specific guides include references to related application documentation:
   - Security guides reference server security documentation
   - Authentication guides reference the email auth system documentation

## Accessing Documentation Programmatically

When accessing documentation programmatically, use path resolution that works with both the centralized system and application-specific documentation:

```javascript
// Base path resolver for documentation
const resolveDocPath = (relativePath) => {
  // Check if this is a reference to application documentation
  if (relativePath.includes('app/')) {
    return path.join(process.cwd(), relativePath);
  }
  
  // Otherwise resolve relative to the _dev directory
  return path.join(process.cwd(), '_dev', relativePath);
};

// Example usage
const securityDocPath = resolveDocPath('shared/guides/security/index.md');
const serverSecurityPath = resolveDocPath('app/server/docs/SECURITY.md');
```
