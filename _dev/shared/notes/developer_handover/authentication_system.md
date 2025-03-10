# Authentication System Documentation

**Last Updated:** March 10, 2025

## Overview

The ILYTAT Designs authentication system implements a secure, token-based authentication flow with role-based access control (RBAC). This document provides detailed information about the authentication implementation, security measures, and common workflows.

## Key Components

### Models

1. **User Model** (`app/server/src/models/User.js`)
   - Core user data including credentials and profile information
   - Password hashing via bcrypt
   - Email/username uniqueness enforcement
   - Account status tracking (active, verified, locked)

2. **Session Model** (`app/server/src/models/Session.js`)
   - Manages active user sessions
   - Tracks device information and IP addresses
   - Handles token validation and expiration

3. **Role & Permission Models** (`app/server/src/models/Role.js`, `app/server/src/models/Permission.js`)
   - Implements RBAC through role assignments
   - Granular permissions based on resource and action

### Services

1. **AuthService** (`app/server/src/services/authService.js`)
   - Handles user registration, login, and logout
   - Manages password reset and email verification flows
   - Implements security measures like rate limiting and account lockouts
   - Generates and validates JWT tokens

2. **PermissionService** (`app/server/src/services/permissionService.js`)
   - Manages role and permission assignments
   - Validates user access to protected resources

### Middleware

1. **Authentication Middleware** (`app/server/src/middleware/auth.js`)
   - Validates JWT tokens on protected routes
   - Attaches user context to request objects
   - Handles authentication errors

2. **Authorization Middleware** (`app/server/src/middleware/authorize.js`)
   - Validates user permissions for specific routes
   - Implements role-based access checks

## Authentication Flow

1. **Registration**
   - User submits registration data
   - System validates input and checks for existing accounts
   - Password is hashed with bcrypt
   - Verification email is sent with a secure token
   - User record is created with `isVerified: false`

2. **Email Verification**
   - User clicks verification link with token
   - System validates token and updates user to `isVerified: true`
   - User is redirected to login

3. **Login**
   - User submits credentials
   - System validates credentials against stored hash
   - On success, JWT token is generated and returned
   - Session record is created
   - Failed attempts are tracked for security

4. **Session Management**
   - JWT token is included in Authorization header
   - Token is validated on each request
   - Sessions can be revoked server-side
   - Automatic token refresh mechanism

5. **Logout**
   - Session is invalidated
   - Client removes stored token

## Security Measures

1. **Password Security**
   - Bcrypt hashing with salt rounds = 10
   - Password strength validation
   - No plaintext passwords stored

2. **Brute Force Protection**
   - Account lockout after multiple failed attempts
   - Progressive delays between attempts
   - IP-based rate limiting

3. **Token Security**
   - Short-lived JWT tokens (1 hour)
   - Secure, HTTP-only cookies
   - CSRF protection

4. **Additional Measures**
   - Input validation and sanitization
   - SQL injection protection via Sequelize
   - XSS protection

## Common Issues and Troubleshooting

1. **Token Expiration**
   - Tokens expire after 1 hour
   - Implement token refresh before expiration
   - Check for proper token storage on client

2. **Account Lockouts**
   - Accounts lock after 5 failed attempts
   - Lockout duration increases progressively
   - Admin can manually unlock accounts

3. **Permission Issues**
   - Verify user has correct role assignments
   - Check permission definitions in database
   - Review authorization middleware configuration

## Recent Optimizations

1. **Removed redundant database indices** to improve write performance
2. **Enhanced password validation logging** for easier debugging
3. **Implemented progressive lockout strategy** for better security balance

## Future Improvements

1. Implement multi-factor authentication
2. Add OAuth provider integration
3. Enhance session analytics for security monitoring
