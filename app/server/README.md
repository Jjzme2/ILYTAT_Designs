# ILYTAT Designs Server

## Technology Stack
- Node.js with Express.js
- MySQL with Sequelize ORM
- Authentication & Authorization System
- Winston for Logging
- Security Middleware (Helmet, Rate Limiting)

## Project Structure
```
server/
├── config/           # Configuration files
├── src/
│   ├── migrations/   # Database migrations
│   ├── models/      # Sequelize models
│   ├── routes/      # API routes
│   ├── services/    # Business logic
│   └── utils/       # Utility functions
├── logs/            # Application logs
└── _dev/            # Development notes and documentation
```

## Setup Instructions

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file in the root directory with the following variables:
```env
# Database Configuration
DB_HOST=localhost
DB_USERNAME=your_username
DB_PASSWORD=your_password
DB_DATABASE=your_database
DB_DIALECT=mysql

# JWT Configuration
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=24h

# Server Configuration
PORT=5000
NODE_ENV=development
```

3. Run database migrations:
```bash
npx sequelize-cli db:migrate
```

4. Seed the database with initial data:
```bash
npx sequelize-cli db:seed:all
```

## Development Conventions

### Code Style
- Use CommonJS for module system
- Follow ESLint configuration
- Use async/await for asynchronous operations
- Implement proper error handling
- Add JSDoc comments for functions

### Database
- Use migrations for schema changes
- Use seeders for initial data
- Follow naming conventions:
  - Tables: PascalCase, plural (e.g., Users, RolePermissions)
  - Columns: camelCase
  - Foreign keys: camelCase, ending with Id (e.g., userId)

### Security
- Store sensitive data in environment variables
- Use parameterized queries
- Implement rate limiting
- Use secure session handling
- Apply proper CORS configuration

### Logging
- Use Winston for all logging
- Log appropriate levels (error, warn, info, debug)
- Include relevant context in log messages
- Rotate logs to manage disk space

## Available Scripts

- `npm start`: Start the server
- `npm test`: Run tests
- `npm run generate-random-string`: Generate a random string (useful for secrets)

## Authentication System

The system implements a role-based access control (RBAC) with the following models:
- Users
- Roles
- Permissions
- Sessions

Each user can have multiple roles, and each role can have multiple permissions.

## API Documentation

API documentation is available at `/api-docs` when running in development mode.

## Contributing

1. Follow the established code style
2. Write clear commit messages
3. Add appropriate tests
4. Update documentation as needed
5. Create detailed pull requests
