# ILYTAT Designs

![ILYTAT Designs Logo](https://via.placeholder.com/150x150.png?text=ILYTAT)

## Overview

ILYTAT Designs is a full-stack e-commerce application that specializes in custom-designed products. The platform integrates with Printify for product fulfillment and provides a seamless shopping experience for customers.

## 🚀 Features

- **Responsive Design**: Mobile-first approach with excellent desktop experience
- **Product Customization**: Allow customers to personalize products
- **Printify Integration**: Seamless integration with Printify for order fulfillment
- **User Authentication**: Secure login and registration system
- **Shopping Cart**: Persistent shopping cart functionality
- **Order Management**: Complete order tracking and management
- **Admin Dashboard**: Comprehensive admin controls for product and order management

## 🛠️ Tech Stack

### Frontend
- **Vue.js**: Progressive JavaScript framework
- **Vite**: Next generation frontend tooling
- **CSS**: Custom styling with responsive design

### Backend
- **Node.js**: JavaScript runtime
- **Express.js**: Web application framework
- **Sequelize**: ORM for MySQL
- **MySQL**: Relational database

## 📋 Prerequisites

- Node.js (>= 18.0.0)
- npm (>= 9.0.0)
- MySQL

## 🔧 Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/ILYTAT_Designs.git
   cd ILYTAT_Designs
   ```

2. **Install dependencies**
   ```bash
   npm run install:all
   ```

3. **Set up environment variables**
   Create `.env` files in both `app/client` and `app/server` directories following the provided examples.

4. **Initialize the database**
   ```bash
   npm run syncDatabase
   npm run db:migrate
   ```

5. **Start the development server**
   ```bash
   npm start
   ```

## 🏗️ Project Structure

```
ILYTAT_Designs/
├── _dev/                  # Development resources
│   ├── personal/          # Personal development files (gitignored)
│   └── shared/            # Shared development resources
├── app/
│   ├── client/            # Vue.js frontend
│   │   ├── public/        # Static assets
│   │   └── src/           # Vue source code
│   └── server/            # Express.js backend
│       ├── src/           # Server source code
│       ├── migrations/    # Database migrations
│       └── seeders/       # Database seeders
├── docs/                  # Documentation
│   └── printify_api_guide.md  # Printify API documentation
├── CNAME                  # Custom domain configuration
├── Procfile               # Heroku configuration
└── package.json           # Project dependencies and scripts
```

## 🧑‍💻 Development

### Available Scripts

- `npm start`: Start both client and server in development mode
- `npm run client`: Start only the client
- `npm run server`: Start only the server
- `npm run build`: Build the client and server for production
- `npm run lint`: Run linting on client and server code
- `npm run db:migrate`: Run database migrations
- `npm run db:rollback`: Rollback the last database migration

### Development Guidelines

- Mobile-first design approach
- Follow best practices (DRY, KISS, YAGNI, SOLID)
- Centralize and separate concerns
- Document code and maintain consistent styling
- Write unit and integration tests

## 🚢 Deployment

This application is configured for deployment on Heroku with the custom domain ILYTAT.com.

For detailed deployment instructions, refer to the [Heroku Deployment Guide](./_dev/shared/notes/heroku_deployment_guide.md).

### Deployment Scripts

- `npm run heroku-postbuild`: Build script for Heroku deployment
- `npm run heroku-start`: Start script for Heroku
- `npm run heroku-logs`: View application logs
- `npm run heroku-config`: View and edit environment variables

## 📚 Documentation

- [Printify API Guide](./docs/printify_api_guide.md)
- [Database Seeding Guide](./_dev/shared/notes/database_seeding_guide.md)
- [Factory Pattern Guide](./_dev/shared/notes/factory_pattern_guide.md)
- [Dependency Injection Guide](./_dev/shared/notes/dependency_injection_guide.md)
- [Testing Guidelines](./_dev/shared/notes/testing_guidelines.md)
- [Heroku Deployment Guide](./_dev/shared/notes/heroku_deployment_guide.md)

## 📝 License

This project is licensed under the ISC License - see the LICENSE file for details.

## 👥 Contributors

- ILYTAT Designs Team

---

© 2025 ILYTAT Designs. All rights reserved.
