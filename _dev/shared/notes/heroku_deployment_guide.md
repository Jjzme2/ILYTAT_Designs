# Heroku Deployment Guide for ILYTAT Designs

This document outlines the configuration and steps needed for deploying the ILYTAT Designs application to Heroku with the custom domain ILYTAT.com.

## Project Configuration

### Files Created for Heroku Deployment

1. **CNAME File**
   - Location: Root directory
   - Content: `ILYTAT.com`
   - Purpose: Specifies the custom domain for the application

2. **Procfile**
   - Location: Root directory
   - Content: `web: npm run heroku-start`
   - Purpose: Tells Heroku what command to execute when the application starts

### Package.json Scripts

The following scripts have been added to `package.json` for Heroku deployment and maintenance:

```json
"build": "cd app/client && npm run build && cd ../server && npm run build",
"heroku-postbuild": "npm run install:all && npm run build",
"heroku-start": "cd app/server && npm start",
"heroku-logs": "heroku logs --tail",
"heroku-bash": "heroku run bash",
"heroku-config": "heroku config",
"heroku-local": "heroku local",
"heroku-open": "heroku open",
"heroku-db-push": "heroku pg:push",
"heroku-db-pull": "heroku pg:pull",
```

## Deployment Process

### Initial Setup

1. Install the Heroku CLI:
   ```bash
   npm install -g heroku
   ```

2. Login to Heroku:
   ```bash
   heroku login
   ```

3. Create a new Heroku application (if not already created):
   ```bash
   heroku create ilytat-designs
   ```

4. Add Heroku as a remote to your Git repository:
   ```bash
   heroku git:remote -a ilytat-designs
   ```

### Database Configuration

1. Provision a PostgreSQL database:
   ```bash
   heroku addons:create heroku-postgresql:mini
   ```

2. Set environment variables:
   ```bash
   heroku config:set NODE_ENV=production
   ```

### Deployment

1. Push your code to Heroku:
   ```bash
   git push heroku main
   ```

2. Run database migrations:
   ```bash
   heroku run npm run db:migrate
   ```

### Custom Domain Setup

1. Add your custom domain to Heroku:
   ```bash
   heroku domains:add www.ilytat.com
   heroku domains:add ilytat.com
   ```

2. Update your DNS settings with your domain provider:
   - Add a CNAME record pointing `www.ilytat.com` to your Heroku app's domain
   - Add an ALIAS or ANAME record (or A record if those aren't available) pointing `ilytat.com` to your Heroku app's domain

3. Verify the domain setup:
   ```bash
   heroku domains:wait
   ```

### Monitoring and Maintenance

- View application logs:
  ```bash
  npm run heroku-logs
  ```

- Open a bash session on the Heroku dyno:
  ```bash
  npm run heroku-bash
  ```

- View environment variables:
  ```bash
  npm run heroku-config
  ```

- Test the application locally using Heroku's environment:
  ```bash
  npm run heroku-local
  ```

- Open the application in a browser:
  ```bash
  npm run heroku-open
  ```

## SSL Configuration

Heroku provides free SSL certificates through Automatic Certificate Management (ACM):

```bash
heroku certs:auto:enable
```

## Common Issues and Troubleshooting

1. **Database Connection Issues**
   - Check connection string: `heroku config:get DATABASE_URL`
   - Ensure your Sequelize configuration is using the Heroku-provided DATABASE_URL

2. **Build Failures**
   - Check build logs: `heroku builds:info`
   - View detailed build logs: `heroku builds:output`

3. **Application Crashes**
   - Check application logs: `npm run heroku-logs`
   - Ensure proper error handling in your code

## Resources

- [Heroku Node.js Support](https://devcenter.heroku.com/articles/nodejs-support)
- [Heroku Postgres](https://devcenter.heroku.com/articles/heroku-postgresql)
- [Heroku Custom Domains](https://devcenter.heroku.com/articles/custom-domains)
