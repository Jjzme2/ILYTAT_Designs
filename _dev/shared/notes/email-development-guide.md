# Email Development Guide for ILYTAT Designs

This guide explains how to configure and use the email system during development, ensuring you can properly test email functionality without sending real emails to customers.

## Email Providers for Development

The system supports multiple email delivery methods for development:

### 1. Ethereal Email (Default)

[Ethereal Email](https://ethereal.email/) is a fake SMTP service that automatically captures emails without delivering them to real recipients. This is the default option and requires no configuration.

- Emails will be captured and viewable via a special preview URL in the console logs
- Credentials are automatically generated at runtime
- Preview links expire after some time, so check them promptly

### 2. Mailtrap

[Mailtrap](https://mailtrap.io/) is a test mail server for development that lets you view emails in a web interface.

**Configuration** (.env file):
```
MAILTRAP_USER=your_mailtrap_username
MAILTRAP_PASS=your_mailtrap_password
```

### 3. Gmail (for testing real delivery)

You can use a Gmail account to test actual delivery to real email addresses.

**Configuration** (.env file):
```
GMAIL_USER=your_gmail_address@gmail.com
GMAIL_APP_PASSWORD=your_app_password
```

**Important**: You must use an [App Password](https://support.google.com/accounts/answer/185833), not your regular Gmail password!

### 4. Custom SMTP Server

Use any SMTP server of your choice:

**Configuration** (.env file):
```
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_username
SMTP_PASS=your_password
```

## Saving Emails to Disk

For easier debugging, you can enable saving all emails to disk:

**Configuration** (.env file):
```
SAVE_EMAILS_TO_DISK=true
```

Emails will be saved as JSON files in the `app/server/logs/emails/` directory with a timestamp and subject line.

## SendGrid Production Configuration

For production, the system uses SendGrid:

**Configuration** (.env file):
```
SENDGRID_API_KEY=your_sendgrid_api_key
EMAIL_FROM=noreply@ilytatdesigns.com
```

You can also configure SendGrid template IDs:
```
SENDGRID_VERIFICATION_TEMPLATE_ID=d-template-id-here
SENDGRID_PASSWORD_RESET_TEMPLATE_ID=d-template-id-here
SENDGRID_PASSWORD_CHANGED_TEMPLATE_ID=d-template-id-here
SENDGRID_ORDER_CONFIRMATION_TEMPLATE_ID=d-template-id-here
```

## Testing Email Functionality

After configuring your email provider, you can test the email functionality with:

```javascript
const EmailService = require('../services/emailService');

// Send a test email
await EmailService.sendEmail({
  to: 'recipient@example.com',
  subject: 'Test Email from ILYTAT Designs',
  text: 'This is a test email from the ILYTAT Designs system.',
  html: '<p>This is a <strong>test email</strong> from the ILYTAT Designs system.</p>',
  categories: ['test']
});
```

## Troubleshooting

If emails are not being sent or received:

1. Check the application logs for detailed error messages
2. Verify your email provider credentials
3. Ensure your SMTP server allows connections from your IP address
4. For Gmail, ensure you're using an App Password and have less secure apps enabled
5. For custom SMTP servers, try connecting with an email client to verify credentials

## Environment Setup

Example complete `.env` configuration for email:

```
# Development email configuration
# Choose one provider option below

# Option 1: Mailtrap (recommended for team development)
MAILTRAP_USER=your_mailtrap_username
MAILTRAP_PASS=your_mailtrap_password

# Option 2: Gmail with App Password
# GMAIL_USER=your_gmail_address@gmail.com
# GMAIL_APP_PASSWORD=your_app_password

# Option 3: Custom SMTP
# SMTP_HOST=smtp.example.com
# SMTP_PORT=587
# SMTP_SECURE=false
# SMTP_USER=your_username
# SMTP_PASS=your_password

# Save emails to disk for easy inspection
SAVE_EMAILS_TO_DISK=true

# Production configuration (SendGrid)
# SENDGRID_API_KEY=your_sendgrid_api_key
# EMAIL_FROM=noreply@ilytatdesigns.com

# Client URL for email links
CLIENT_URL=http://localhost:3000
```
