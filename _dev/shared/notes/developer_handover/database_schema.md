# Database Schema Documentation

**Last Updated:** March 10, 2025

## Overview

ILYTAT Designs uses MySQL as its database system with Sequelize as the ORM. This document provides a comprehensive overview of the database schema, model relationships, and important implementation details.

## Database Models

### Users

**Model File:** `app/server/src/models/User.js`  
**Migration Files:** 
- `20250227000001-create-users.js` (Base table)
- `20250305000001-add-verification-fields-to-users.js` (Verification fields)

**Description:** Stores user account information including authentication credentials and profile data.

**Key Fields:**
- `id` (UUID, Primary Key)
- `email` (String, Unique)
- `username` (String, Unique)
- `password` (String, Hashed)
- `firstName` (String)
- `lastName` (String)
- `isActive` (Boolean)
- `isVerified` (Boolean)
- `verificationToken` (String)
- `verificationExpires` (Date)
- `lastLogin` (Date)
- `resetPasswordToken` (String)
- `resetPasswordExpires` (Date)
- `loginAttempts` (Integer)
- `lockUntil` (Date)

**Indices:**
- Unique index on `email` (migration-defined)
- Unique index on `username` (migration-defined)
- Index on `verificationToken` (migration-defined)
- Index on `resetPasswordToken` (model-defined)

**Relationships:**
- Has many `Sessions`
- Belongs to many `Roles` through `UserRoles`

**Notes:**
- Password hashing is handled in the beforeSave hook
- Sensitive data is excluded in the toJSON method

### Sessions

**Model File:** `app/server/src/models/Session.js`  
**Migration File:** `20250227000006-create-sessions.js`

**Description:** Tracks user authentication sessions across devices.

**Key Fields:**
- `id` (UUID, Primary Key)
- `userId` (UUID, Foreign Key)
- `token` (String, Unique)
- `ipAddress` (String)
- `userAgent` (String)
- `isValid` (Boolean)
- `expiresAt` (Date)

**Indices:**
- Index on `userId` (migration-defined)
- Unique index on `token` (migration-defined)

**Relationships:**
- Belongs to `User`

### Roles

**Model File:** `app/server/src/models/Role.js`  
**Migration File:** `20250227000002-create-roles.js`

**Description:** Defines user roles for access control.

**Key Fields:**
- `id` (UUID, Primary Key)
- `name` (String, Unique)
- `description` (String)
- `isActive` (Boolean)

**Indices:**
- Unique index on `name` (migration-defined)
- Indices on timestamp fields (from add-timestamps migration)

**Relationships:**
- Belongs to many `Users` through `UserRoles`
- Belongs to many `Permissions` through `RolePermissions`

### Permissions

**Model File:** `app/server/src/models/Permission.js`  
**Migration File:** `20250227000003-create-permissions.js`

**Description:** Defines granular permissions for role-based access control.

**Key Fields:**
- `id` (UUID, Primary Key)
- `name` (String, Unique)
- `description` (String)
- `resource` (String)
- `action` (String)
- `attributes` (JSON)

**Indices:**
- Unique index on `name` (migration-defined)
- Index on `resource` (migration-defined)
- Index on `action` (migration-defined)
- Indices on timestamp fields (from add-timestamps migration)

**Relationships:**
- Belongs to many `Roles` through `RolePermissions`

### Orders

**Model File:** `app/server/src/models/Order.js`

**Description:** Stores customer order information linked to Stripe and Printify.

**Key Fields:**
- `id` (UUID, Primary Key)
- `stripeSessionId` (String, Unique)
- `stripePaymentIntentId` (String)
- `customerId` (UUID, Foreign Key to Users)
- `customerEmail` (String)
- `customerName` (String)
- `totalAmount` (Decimal)
- `currency` (String)
- `status` (Enum: 'pending', 'paid', 'failed', 'refunded')
- `printifyOrderId` (String)
- `fulfillmentStatus` (Enum: 'pending', 'processing', 'shipped', 'delivered', 'cancelled')
- `shippingAddress` (JSON)
- `metadata` (JSON)

**Indices:**
- Unique index on `stripeSessionId`
- Index on `stripePaymentIntentId`
- Index on `customerId`
- Index on `customerEmail`
- Index on `printifyOrderId`
- Index on `status`
- Index on `fulfillmentStatus`
- Index on `createdAt`

**Relationships:**
- Has many `OrderItems`
- Belongs to `User` (as customer)

### OrderItems

**Model File:** `app/server/src/models/OrderItem.js`

**Description:** Stores individual line items within an order.

**Key Fields:**
- `id` (UUID, Primary Key)
- `orderId` (UUID, Foreign Key to Orders)
- `productId` (String)
- `variantId` (String)
- `quantity` (Integer)
- `price` (Decimal)
- `title` (String)
- `variantTitle` (String)
- `imageUrl` (String)
- `metadata` (JSON)

**Indices:**
- Index on `orderId`
- Index on `productId`
- Index on `variantId`

**Relationships:**
- Belongs to `Order`

### PrintifyCache

**Model File:** `app/server/src/models/printifyCache.js`  
**Migration File:** `20250227_create_printify_cache.js`

**Description:** Caches Printify API responses to reduce API calls.

**Key Fields:**
- `id` (UUID, Primary Key)
- `type` (Enum: 'product', 'shop', 'order')
- `externalId` (String)
- `data` (JSON)
- `lastUpdated` (Date)

**Indices:**
- Unique composite index on `type` and `externalId` (migration-defined)
- Indices on timestamp fields (from add-timestamps migration)

## Database Migrations

The application uses Sequelize migrations to manage database schema changes. Key migration files include:

1. **Base Entity Creation** (20250227000001 - 20250227000006)
   - Creates core tables (Users, Roles, Permissions, etc.)
   - Establishes initial indices and constraints

2. **Relationship Tables** (20250227000004 - 20250227000005)
   - Creates junction tables for many-to-many relationships
   - Sets up foreign key constraints

3. **Feature Additions** (20250305000001)
   - Adds verification fields to Users table
   - Adds additional indices for performance

4. **Timestamp Standardization** (20250228135213)
   - Ensures consistent timestamp fields across tables
   - Adds indices on timestamp columns

## Important Implementation Notes

### Index Optimization

We recently identified and fixed redundant indices across multiple models:

1. **Issue:** Indices were being defined in both model files and migration files, creating duplicate indices
2. **Solution:** Removed redundant indices from model files, keeping only those not defined in migrations
3. **Affected Models:** User, Session, Role, Permission
4. **Performance Impact:** Improved write performance and reduced storage overhead

### JSON Data Handling

Several models use JSON fields for flexible data storage:

1. **Implementation:** 
   - Stored as TEXT in MySQL
   - Custom getters/setters for JSON serialization/deserialization
   - Validation in model methods

2. **Usage Examples:**
   - `Order.shippingAddress`
   - `Order.metadata`
   - `OrderItem.metadata`
   - `Permission.attributes`

### Soft Delete Implementation

Some models implement soft delete functionality:

1. **Implementation:**
   - `paranoid: true` in model options
   - `deletedAt` timestamp field
   - Sequelize automatically filters out soft-deleted records

2. **Affected Models:**
   - Role
   - Permission

## Database Seeding

For development and testing, database seeders are available:

1. **Location:** `app/server/src/seeders/`
2. **Implementation:** Uses factory pattern for generating test data
3. **Documentation:** See `_dev/shared/notes/database/seeding_guide.md` for details

## Best Practices for Database Changes

1. **Always use migrations** for schema changes
2. **Avoid defining indices in both** models and migrations
3. **Document complex queries** in code comments
4. **Use transactions** for operations affecting multiple tables
5. **Follow naming conventions** for consistency
