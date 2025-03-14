# Configuration System Documentation

## Overview

The ILYTAT Designs application now uses a centralized, comprehensive configuration system to manage all application settings, replacing the previous contact-specific configuration. This system provides a more maintainable, extensible approach to application settings.

## Core Components

### 1. Configuration Files

- **`application.json`**: Main configuration file containing all application settings
  - Located at: `/app/server/config/application.json`
  - Replaces the previous `contact.json` file

### 2. Store Implementation 

- **`configStore.js`**: Central store for all application configuration
  - Located at: `/app/client/src/stores/configStore.js`
  - Uses a nested state structure for better organization
  - Provides comprehensive getters and actions

- **`contactStore.js`**: Compatibility layer
  - Maintains backward compatibility with existing code
  - Internally uses the configStore for data access

### 3. API Routes

- **`/api/config`**: New endpoints for accessing configuration
  - Full configuration: `GET /api/config`
  - Sections: `GET /api/config/{section}` (company, brand, social, features)
  - Admin: `GET /api/config/admin` (includes sensitive data)
  - Update: `PUT /api/config/admin/update`

## Configuration Structure

The new configuration system organizes settings into logical sections:

```
{
  "application": {
    // Core application information
    "name": "ILYTAT Designs",
    "version": "1.0.0",
    "environment": "development",
    "description": "...",
    "lastUpdated": "2025-03-14"
  },
  "company": {
    // Company information (previously in contactDetails.company)
    "name": "ILYTAT LLC",
    "website": "https://www.ILYTAT.com",
    // ...address and other fields
  },
  "brand": {
    // Visual identity settings
    "colors": { ... },
    "fonts": { ... },
    "logo": { ... }
  },
  "social": {
    // Social media links (previously in contactDetails.socialMedia)
    "tiktok": "...",
    "facebook": "...",
    // ...additional platforms
  },
  "contact": {
    // Contact-specific information
    "hours": "Monday-Friday, 9am-5pm CST",
    "supportResponseTime": "24-48 hours",
    "additionalNotes": "..."
  },
  "features": {
    // Feature flags and settings
    "shop": { ... },
    "cart": { ... },
    "authentication": { ... }
  },
  "integration": {
    // Third-party integration settings
    "printify": { ... }
  },
  "seo": {
    // SEO-related configuration
    "defaultTitle": "...",
    "defaultDescription": "...",
    "defaultKeywords": "..."
  }
}
```

## Usage Examples

### In Vue Components

```javascript
import { useConfigStore } from '@/stores/configStore';

// In setup()
const configStore = useConfigStore();

// Access configuration
const companyName = configStore.company.name;
const primaryColor = configStore.brand.colors.primary;
const formattedAddress = configStore.getFormattedAddress;
```

### Backward Compatibility

Existing code using the contactStore will continue to work without changes:

```javascript
import { useContactStore } from '@/stores/contactStore';

// In setup()
const contactStore = useContactStore();

// Still works as before
const companyName = contactStore.companyName;
```

## Migration Guide

### For Existing Components

No immediate changes required. The compatibility layer ensures existing code continues to work.

### For New Components

Use the configStore directly for better organization and access to all configuration options:

```javascript
// Before
import { useContactStore } from '@/stores/contactStore';
const contactStore = useContactStore();
const companyName = contactStore.companyName;

// After
import { useConfigStore } from '@/stores/configStore';
const configStore = useConfigStore();
const companyName = configStore.company.name;
```

## Best Practices

1. **Use Nested Access**: Access configuration with the full path to improve code clarity
   - Good: `configStore.company.address.city`
   - Avoid: Direct property access from compatibility layer

2. **Leverage Getters**: Use provided getters for formatted or computed values
   - Example: `configStore.getFormattedAddress` or `configStore.activeSocialLinks`

3. **Consider Centralization**: Keep all configuration in the application.json file
   - Avoid creating separate configuration files for different parts of the application

4. **Update Documentation**: When adding new configuration options, update this documentation
