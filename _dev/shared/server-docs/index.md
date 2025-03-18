# Server Documentation

## Overview
This directory contains references to the server-specific documentation that is stored within the server codebase. These files remain in their original locations to ensure they are accessible during server deployment and for developers working directly with the server code.

## Server Documentation Index

### Core Server Documentation
- [Getting Started for Developers](../../../app/server/docs/getting-started-developer.md)
- [Security Guidelines](../../../app/server/docs/SECURITY.md)
- [Logging Standards](../../../app/server/docs/LOGGING.md)
- [Data Tracking](../../../app/server/docs/DATA_TRACKING.md)
- [Server Standards](../../../app/server/docs/standards.md)
- [User Guide](../../../app/server/docs/user_guide.md)

### Integration Documentation
- [Printify Integration](../../../app/server/docs/printify-integration.md)
- [Email Authentication System](../../../app/server/docs/email-auth-system.md)

### Technical Documentation
- [Cache Comparison](../../../app/server/docs/cache-comparison.md)
- [Response System Documentation](../../../app/server/src/docs/response_system_documentation.md)

## Documentation Approach

The server documentation follows a specific approach:

1. **Location**: Server documentation remains in its original location to ensure it's:
   - Accessible to developers working directly with the server code
   - Included in server deployments
   - Versioned alongside the server code

2. **Cross-Reference**: This index provides a central point of reference to all server documentation
   - Relative paths are used to maintain consistency across environments
   - Updates to server docs are automatically reflected here

3. **Integration**: The main topics from server docs are integrated into the appropriate guide categories:
   - Security documentation is referenced in the [Security Guides](../guides/security/index.md)
   - Authentication documentation is referenced in the [Authentication Guides](../guides/authentication/index.md)
   - API documentation is referenced in the [API Guides](../guides/api/index.md)

## Maintaining Documentation

When updating server code that affects documentation:

1. Update the relevant documentation file in the server directory
2. Ensure cross-references in the centralized documentation system remain accurate
3. Add new entries to this index if new documentation files are created
