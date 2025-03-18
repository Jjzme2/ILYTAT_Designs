# Developer Getting Started Guide

## Prerequisites
- Node.js v14 or higher
- MySQL 8.0 or higher
- npm or yarn

## Project Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd ILYTAT_Designs
```

2. Install dependencies:
```bash
# Install server dependencies
cd app/server
npm install

# Install client dependencies
cd ../client
npm install
```

3. Configure environment variables:
```bash
# In app/server
cp .env.example .env
```

4. Set up the database:
```bash
# In app/server
npx sequelize-cli db:create
npx sequelize-cli db:migrate
npx sequelize-cli db:seed:all
```

5. Start the development servers:
```bash
# Start the server (from app/server)
npm run dev

# Start the client (from app/client)
npm run dev
```

## Project Structure

```
app/
├── client/          # Vue.js frontend
├── server/          # Express.js backend
│   ├── src/
│   │   ├── controllers/  # Route controllers
│   │   ├── middleware/   # Express middleware
│   │   ├── models/      # Sequelize models
│   │   ├── routes/      # Express routes
│   │   └── services/    # Business logic
│   └── docs/           # Documentation files
```

## Development Guidelines

1. **Code Style**: Follow the established ESLint and Prettier configurations
2. **Git Workflow**: Create feature branches from `develop`, use conventional commits
3. **Testing**: Write unit tests for new features, ensure all tests pass before PR
4. **Documentation**: Update relevant documentation when making changes
5. **Code Review**: All PRs require at least one review before merging

## Need Help?

- Check the issue tracker for known issues
- Contact the development team on Slack
- Review the API documentation in the `docs` folder
