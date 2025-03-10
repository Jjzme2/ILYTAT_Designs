# Contact Information Module Guide

## Overview

The Contact Information Module provides centralized access to organization contact details throughout the application. The data is sourced from a JSON file and made available via:

1. A server-side module for direct import in backend code
2. REST API endpoints for client-side access

## Usage Options

### Server-Side Usage

Import the contact information directly in any server file:

```javascript
// Import the entire contact information object
const contactInfo = require('../../config/contact');

// Use the data in your code
const companyName = contactInfo.contactDetails.company.name;
const supportEmail = contactInfo.contactDetails.company.supportEmail;
```

### Client-Side Usage via API

Access the contact information through REST API endpoints:

- **GET /api/contact** - Retrieve all contact information
- **GET /api/contact/company** - Retrieve only company information
- **GET /api/contact/social** - Retrieve only social media links

Example usage in Vue.js:

```javascript
// Fetch all contact info
async fetchContactInfo() {
  try {
    const response = await fetch('/api/contact');
    const data = await response.json();
    this.contactInfo = data;
  } catch (error) {
    console.error('Error fetching contact info:', error);
  }
}

// Fetch only company info
async fetchCompanyInfo() {
  try {
    const response = await fetch('/api/contact/company');
    const data = await response.json();
    this.companyInfo = data;
  } catch (error) {
    console.error('Error fetching company info:', error);
  }
}
```

## Data Structure

The contact information is structured as follows:

```json
{
  "contactDetails": {
    "company": {
      "name": "ILYTAT Designs",
      "website": "https://www.ILYTAT.com",
      "supportEmail": "support@ilytat.com",
      "commonEmail": "info@ilytat.com",
      "phone": "7086271854",
      "address": { ... },
      "tagline": "Unique. Creative. Yours."
    },
    "socialMedia": {
      "tiktok": "https://www.tiktok.com/@Positive_Echoes",
      "facebook": "https://www.facebook.com/people/Ilytat-Designs/61565010253579"
    },
    "additionalNotes": "For urgent inquiries, please call our phone number."
  }
}
```

## Updating Contact Information

To update the contact information, modify the JSON file at:
`app/server/config/contact.json`

The changes will be automatically reflected in both the server module and API endpoints without requiring any code changes or server restart.

## Error Handling

The contact module includes error handling to provide fallback data if the contact.json file cannot be loaded. This ensures the application can continue to function even if the data file is missing or corrupted.

## Security Considerations

Contact information is considered public data in this implementation. If sensitive contact details need to be added in the future, consider:

1. Moving sensitive data to environment variables
2. Implementing access controls for certain endpoints
3. Limiting which fields are exposed through the public API
