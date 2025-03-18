# ILYTAT Designs Documentation System

## Introduction

This document describes the comprehensive documentation system for ILYTAT Designs. Our documentation follows a centralized approach while respecting application-specific documentation needs.

## Documentation Structure

```
_dev/
├── docs/                             # Meta-documentation about the documentation system
│   ├── documentation_structure.md    # Structure overview
│   ├── documentation_system.md       # This file - comprehensive guide
│   ├── cross_reference_guide.md      # Guide to cross-referencing docs
│   └── index.md                      # Main entry point
│
├── personal/                         # Developer-specific files (gitignored)
│   ├── goals/                        # Personal development goals
│   ├── notes/                        # Personal notes
│   ├── reminders/                    # Personal reminders
│   ├── snippets/                     # Personal code snippets
│   └── tasks/                        # Personal task tracking
│
└── shared/                           # Team-shared documentation (git tracked)
    ├── architecture/                 # System architecture documentation
    │   ├── client/                   # Client architecture
    │   └── server/                   # Server architecture
    ├── client-docs/                  # References to client-specific docs
    ├── guides/                       # Domain-specific comprehensive guides
    │   ├── api/                      # API documentation
    │   ├── authentication/           # Authentication system
    │   ├── database/                 # Database guides
    │   ├── deployment/               # Deployment guides
    │   ├── patterns/                 # Design patterns guides
    │   ├── security/                 # Security documentation
    │   └── testing/                  # Testing documentation
    ├── operations/                   # Operational procedures
    ├── server-docs/                  # References to server-specific docs
    ├── standards/                    # Coding standards and conventions
    ├── templates/                    # Documentation & code templates
    └── updates/                      # Documented updates
        ├── bugfixes/                 # Bug fix documentation
        └── enhancements/             # Enhancement documentation
```

## Documentation Philosophy

1. **Centralization with Cross-References**:
   - Centralized structure in `_dev/` for easy navigation
   - Application-specific docs remain in place with cross-references
   - All documentation is findable from the main index

2. **Clear Separation of Concerns**:
   - Personal vs. shared documentation
   - Categorized by domain (security, database, etc.)
   - Meta-documentation about the system itself

3. **Consistent File Naming**:
   - Use kebab-case for all documentation files
   - Use descriptive but concise names
   - Group related documentation by prefix

## Special Documentation Areas

### Application-Specific Documentation

The following documentation remains in the application directories but is cross-referenced in our centralized system:

- **Server Documentation**:
  - `app/server/docs/` - Core server documentation
  - `app/server/src/docs/` - API and implementation documentation
  
- **Client Documentation**:
  - `app/client/src/docs/` - Client-specific documentation

These are accessible through:
- `_dev/shared/server-docs/index.md`
- `_dev/shared/client-docs/index.md`

## Programmatic Documentation Access

To access documentation programmatically, use the following pattern:

```javascript
/**
 * Resolve a documentation path relative to project root
 * @param {string} relativePath - Path relative to documentation structure
 * @returns {string} Absolute path to the documentation file
 */
function resolveDocPath(relativePath) {
  // Project root detection - use appropriate method for your environment
  const projectRoot = process.cwd();
  
  // Check if this is an application-specific document
  if (relativePath.startsWith('app/')) {
    return path.join(projectRoot, relativePath);
  }
  
  // Otherwise assume it's in the _dev structure
  return path.join(projectRoot, '_dev', relativePath);
}

// Examples
const securityGuide = resolveDocPath('shared/guides/security/index.md');
const serverSecurity = resolveDocPath('app/server/docs/SECURITY.md');
```

## Best Practices for Documentation

1. **Update Documentation With Code Changes**:
   - When modifying code, update related documentation
   - If documentation doesn't exist, create it in the appropriate location

2. **Use Cross-References**:
   - Link to related documents using relative paths
   - Link to code examples when helpful

3. **Keep Documentation DRY**:
   - Don't duplicate information - use cross-references
   - Centralize common information

4. **Document Assumptions and Design Decisions**:
   - Explain why, not just how
   - Document trade-offs and alternatives considered

5. **Use Consistent Formatting**:
   - Follow markdown best practices
   - Use consistent headers, lists, and code blocks

## Documentation Workflow

1. **Finding Documentation**:
   - Start with `_dev/docs/index.md`
   - Use the directory structure to navigate to specific domains
   - Check cross-references for application-specific details

2. **Creating Documentation**:
   - Determine the appropriate location based on the documentation type
   - Follow file naming conventions
   - Include cross-references to related documents

3. **Updating Documentation**:
   - Keep documentation in sync with code changes
   - Update cross-references when moving or renaming files

4. **Removing Documentation**:
   - Update or remove cross-references
   - Document the reason for removal

## Conclusion

This documentation system provides a structured, centralized approach while respecting application-specific documentation needs. By following these guidelines, we ensure our documentation remains valuable, accessible, and maintainable.
