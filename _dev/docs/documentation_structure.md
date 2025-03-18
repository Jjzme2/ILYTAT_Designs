# ILYTAT_Designs Documentation Structure

## Overview
This document outlines the standardized structure for all documentation in the ILYTAT_Designs project. Following this structure ensures consistency and makes information easily discoverable.

## Root Documentation Structure

```
_dev/
├── docs/                           # Central documentation about using the documentation system
├── personal/                       # Developer-specific files (gitignored)
│   ├── goals/                      # Personal development goals
│   ├── notes/                      # Personal notes
│   ├── reminders/                  # Personal reminders
│   ├── snippets/                   # Personal code snippets
│   └── tasks/                      # Personal task tracking
│
└── shared/                         # Team-shared documentation (git tracked)
    ├── architecture/               # Overall system architecture documentation
    │   ├── client/                 # Client architecture
    │   └── server/                 # Server architecture
    ├── guides/                     # Comprehensive guides by domain
    │   ├── api/                    # API-related guides
    │   ├── authentication/         # Authentication system guides
    │   ├── database/               # Database guides
    │   ├── deployment/             # Deployment guides
    │   ├── patterns/               # Design patterns guides
    │   ├── security/               # Security-related guides
    │   └── testing/                # Testing guides
    ├── operations/                 # Operational procedures
    ├── standards/                  # Coding standards and conventions
    ├── templates/                  # Templates for docs, code, etc.
    └── updates/                    # Documented updates
        ├── bugfixes/               # Bug fix documentation
        └── enhancements/           # Enhancement documentation
```

## File Naming Conventions

1. **Use kebab-case for all documentation files**: `database-migration-guide.md`
2. **Be descriptive but concise**: `authentication-system-overview.md` not `auth.md`
3. **Group related documents by prefix**: `api-endpoints.md`, `api-authentication.md`
4. **Include version in filename when applicable**: `database-schema-v2.md`

## Document Structure Guidelines

1. **Every document should begin with a title and brief description**
2. **Use clear section headings with proper markdown hierarchy**
3. **Include a "Related Documents" section at the end when applicable**
4. **Document modification history at the bottom of significant documents**

## Accessing Documentation

- For project documentation, reference using relative paths from project root:
  ```js
  // Example of accessing documentation in code comments
  // See: _dev/shared/guides/database/database-migration-guide.md
  ```

- For programmatic access to documentation, standardize paths:
  ```js
  const docsBasePath = path.join(__dirname, '../../_dev');
  const guidePath = path.join(docsBasePath, 'shared/guides/database/database-migration-guide.md');
  ```
