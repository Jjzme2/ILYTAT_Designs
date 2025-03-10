# ILYTAT Designs - Application Overview

**Last Updated:** March 10, 2025

## Introduction

ILYTAT Designs is a full-stack e-commerce application built with:
- **Frontend**: Vue.js with Vite
- **Backend**: Express.js and Node.js
- **Database**: MySQL with Sequelize ORM

This document provides a comprehensive overview of the application architecture, key components, and important implementation details to help new developers quickly understand and contribute to the codebase.

## System Architecture

The application follows a modern client-server architecture:

1. **Client**: Vue.js single-page application
2. **Server**: Express.js REST API
3. **Database**: MySQL relational database
4. **External Services**: 
    - Printify integration for product fulfillment
    - Stripe for payment processing

### Key Architectural Principles

- **Mobile-first approach**: All UI components are designed for mobile devices first, then enhanced for desktop
- **Separation of concerns**: Clear boundaries between frontend, backend, and database layers
- **Modularity**: Components are designed to be reusable and independently maintainable
- **Security**: Authentication, authorization, and data validation at multiple levels

## Directory Structure

```
ILYTAT_Designs/
├── app/
│   ├── client/                # Vue.js frontend
│   └── server/                # Express.js backend
│       ├── src/
│       │   ├── config/        # Configuration files
│       │   ├── controllers/   # Route controllers
│       │   ├── middleware/    # Express middleware
│       │   ├── migrations/    # Sequelize migrations
│       │   ├── models/        # Sequelize models
│       │   ├── routes/        # Express routes
│       │   ├── services/      # Business logic
│       │   └── utils/         # Utility functions
│       └── tests/             # Server-side tests
├── _dev/                      # Development resources
│   ├── personal/              # Personal dev files (gitignored)
│   └── shared/                # Shared development resources
└── docs/                      # Project documentation
```

## Key Components

### Authentication System

The application uses a token-based authentication system with:
- JWT for session management
- Bcrypt for password hashing
- Role-based access control (RBAC) for authorization

See the [Authentication System](./authentication_system.md) document for details.

### Database Models

The database schema includes the following key models:
- Users
- Roles & Permissions
- Sessions
- Orders & OrderItems
- Printify Cache

See the [Database Schema](./database_schema.md) document for details.

### External Integrations

- **Printify**: Product catalog and order fulfillment
- **Stripe**: Payment processing

See the [External Integrations](./external_integrations.md) document for details.

## Development Workflow

- **Version Control**: Git with feature branch workflow
- **Testing**: Unit, integration, and E2E tests
- **Deployment**: CI/CD pipeline with staging and production environments

## Known Issues and Future Improvements

- Performance optimization for product catalog
- Enhanced analytics dashboard
- Mobile app development

See the [Roadmap](./roadmap.md) document for details.
