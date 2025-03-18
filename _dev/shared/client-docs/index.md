# Client Documentation

## Overview
This directory contains references to client-specific documentation that is stored within the client codebase. These files remain in their original locations to ensure they're accessible to developers working directly with the client code and bundled appropriately with client deployments.

## Client Documentation Index

### Setup and Installation
- [Installation Guide](../../../app/client/src/docs/installation_guide.md)

## Documentation Approach

The client documentation follows a specific approach:

1. **Location**: Client documentation remains in its original location to ensure it's:
   - Accessible to developers working directly with the client code
   - Bundled with client builds when appropriate
   - Versioned alongside the client code

2. **Cross-Reference**: This index provides a central point of reference to all client documentation
   - Relative paths are used to maintain consistency across environments
   - Updates to client docs are automatically reflected here

3. **Integration**: The main topics from client docs are integrated into the appropriate guide categories:
   - Frontend architecture documentation is cross-referenced in the [Architecture Guides](../architecture/client/index.md)
   - Vue component documentation is referenced in the relevant guides

## Maintaining Documentation

When updating client code that affects documentation:

1. Update the relevant documentation file in the client directory
2. Ensure cross-references in the centralized documentation system remain accurate
3. Add new entries to this index if new documentation files are created
