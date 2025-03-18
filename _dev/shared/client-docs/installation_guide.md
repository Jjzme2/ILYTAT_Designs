---
title: Installation Guide
createdAt: 2025-03-13
updatedAt: 2025-03-13
category: developer_docs
isPublic: true
author: ILYTAT Development Team
---

# Installation Guide

This guide will walk you through the process of setting up the ILYTAT Designs application on your local development environment.

## Prerequisites

Before you begin, make sure you have the following installed:

- Node.js (v14 or newer)
- npm (v6 or newer)
- MySQL (v8 or newer)
- Git

## Client Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/ILYTAT-Designs/ecommerce-platform.git
   ```

2. Navigate to the client directory:
   ```bash
   cd ILYTAT_Designs/app/client
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

4. Create a `.env` file in the client directory with the following content:
   ```
   VITE_API_URL=http://localhost:3000/api
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

## Server Installation

1. Navigate to the server directory:
   ```bash
   cd ../server
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the server directory with the following content:
   ```
   NODE_ENV=development
   PORT=3000
   DB_HOST=localhost
   DB_PORT=3306
   DB_NAME=ilytat_designs
   DB_USER=your_db_username
   DB_PASSWORD=your_db_password
   JWT_SECRET=your_secret_key
   JWT_EXPIRATION=8h
   ```

4. Set up the database:
   ```bash
   npx sequelize-cli db:create
   npx sequelize-cli db:migrate
   npx sequelize-cli db:seed:all
   ```

5. Start the server:
   ```bash
   npm run dev
   ```

## Troubleshooting

If you encounter any issues during installation:

1. Make sure all prerequisites are installed correctly
2. Check that your environment variables are set correctly
3. Ensure your MySQL server is running
4. Review the error logs for specific issues

For additional help, please refer to our [developer documentation](https://github.com/ILYTAT-Designs/ecommerce-platform/wiki).
