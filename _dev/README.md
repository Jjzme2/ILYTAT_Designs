# Developer Resources Directory

This directory contains resources for developers working on the ILYTAT_Designs project.

## Structure

### Personal Resources (Gitignored)
- `/personal` - Personal development files (not tracked in git)
  - `/tasks` - Personal task lists and TODOs
  - `/notes` - Personal development notes
    - `/api` - API-related notes
    - `/database` - Database-related notes
    - `/frontend` - Frontend-related notes
    - `/bugs` - Notes on bugs and fixes
  - `/reminders` - Personal reminders and quick references
  - `/snippets` - Useful code snippets for personal reference
  
### Shared Resources (Tracked in Git)
- `/shared` - Shared development resources (included in git)
  - `/notes` - Shared development notes
    - `/architecture` - System architecture documentation
    - `/database` - Database schema and relationship documentation
    - `/patterns` - Design pattern implementation notes
    - `/general` - General project notes
  - `/templates` - Templates for documentation, code, etc.
    - `/code` - Code templates
    - `/docs` - Documentation templates
  - `/procedures` - Standard procedures for development workflows
    - `/deployment` - Deployment procedures
    - `/testing` - Testing procedures
  - `/diagrams` - System diagrams and visual representations
  - `/standards` - Coding standards and best practices

## Usage

The `/personal` directory is gitignored and meant for individual developer use. Each developer can maintain their own task lists, notes, and reminders without affecting others.

The `/shared` directory is tracked in git and should contain resources that are useful for the entire team.

## Guidelines

1. Do not store sensitive information in any of these directories
2. Keep shared resources up-to-date and relevant
3. Clean up your personal directories regularly
4. Use appropriate templates from the `/shared/templates` directory
5. Follow the established directory structure to maintain organization

## Related Resources

For official documentation, refer to the `app/server/docs` directory, which contains production-ready documentation that is distributed with the application.
