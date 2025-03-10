# Email Service Documentation

## Overview

The ILYTAT Designs email service provides a robust, production-ready solution for sending transactional and marketing emails across the application. The system is built on SendGrid's reliable email delivery infrastructure, providing high deliverability rates, analytics, and templating capabilities.

## Architecture

The email service follows a clean, modular design with the following components:

1. **Core Service Layer**: `EmailService.js` provides a comprehensive API for sending various types of emails
2. **Template Integration**: Uses SendGrid's Dynamic Templates for consistent, branded emails
3. **Environment Configuration**: Configurable through environment variables for different deployment environments
4. **Logging**: Comprehensive structured logging for monitoring and debugging
5. **Error Handling**: Robust error handling with detailed logging and fallback mechanisms

## Configuration

### Required Environment Variables

Add the following environment variables to your `.env` file:

```bash
# SendGrid Configuration
SENDGRID_API_KEY=your_sendgrid_api_key
EMAIL_FROM=noreply@ilytatdesigns.com

# Optional: Support email for customer inquiries
SUPPORT_EMAIL=support@ilytatdesigns.com

# Optional: SendGrid Template IDs
SENDGRID_VERIFICATION_TEMPLATE_ID=d-xxxxxxxxxxxx
SENDGRID_PASSWORD_RESET_TEMPLATE_ID=d-xxxxxxxxxxxx
SENDGRID_PASSWORD_CHANGED_TEMPLATE_ID=d-xxxxxxxxxxxx
SENDGRID_ORDER_CONFIRMATION_TEMPLATE_ID=d-xxxxxxxxxxxx
```

### SendGrid Templates

The email service is designed to work with SendGrid's Dynamic Templates. To set up templates:

1. Create an account on [SendGrid](https://sendgrid.com/)
2. Navigate to Design > Email Templates > Create Template
3. Design your template with the Drag & Drop Editor or use HTML/CSS code
4. Use the dynamic data placeholders as documented below for each email type
5. Save the template and copy the Template ID to your environment variables

## API Reference

### Core Sending Method

```javascript
EmailService.sendEmail(options)
```

#### Parameters

- `options.to`: (Required) Recipient email address
- `options.from`: (Optional) Sender email (defaults to `EMAIL_FROM` environment variable)
- `options.subject`: (Required if not using template) Email subject line
- `options.text`: (Required if not using template) Plain text email content
- `options.html`: (Required if not using template) HTML email content
- `options.templateId`: (Optional) SendGrid template ID
- `options.dynamicTemplateData`: (Optional) Template variables for SendGrid templates
- `options.attachments`: (Optional) Array of attachments
- `options.categories`: (Optional) Array of categories for tracking and segmentation
- `options.trackingSettings`: (Optional) Configuration for click/open tracking
- `options.headers`: (Optional) Custom email headers

### Email Types

#### 1. Verification Email

Sends an email with a verification link to confirm user email addresses.

```javascript
EmailService.sendVerificationEmail(user, verificationToken)
```

**Template Variables:**
- `first_name`: User's first name
- `verification_url`: Full verification URL with token
- `expiry_hours`: Token expiration time in hours

#### 2. Password Reset Email

Sends an email with a reset link when users request a password reset.

```javascript
EmailService.sendPasswordResetEmail(user, resetToken)
```

**Template Variables:**
- `first_name`: User's first name
- `reset_url`: Full password reset URL with token
- `expiry_hours`: Token expiration time in hours

#### 3. Password Changed Email

Sends a confirmation email when a user's password has been successfully changed.

```javascript
EmailService.sendPasswordChangedEmail(user)
```

**Template Variables:**
- `first_name`: User's first name
- `support_email`: Support email address for concerns

#### 4. Order Confirmation Email

Sends an order confirmation with details after a successful purchase.

```javascript
EmailService.sendOrderConfirmationEmail(user, order)
```

**Template Variables:**
- `first_name`: User's first name
- `order_id`: Unique order identifier
- `order_date`: Formatted order date
- `order_total`: Order total price
- `order_items`: Array of ordered items
- `shipping_address`: Formatted shipping address
- `tracking_url`: URL for order tracking (if available)

## Email Templates

### Best Practices

1. **Mobile Responsiveness**: All email templates should be responsive and tested on multiple devices and email clients.
2. **Accessibility**: Include proper alt text for images, use semantic HTML, and ensure sufficient color contrast.
3. **Branding Consistency**: Maintain consistent branding (colors, logo, typography) across all email templates.
4. **Plain Text Alternative**: Always provide a plain text alternative for HTML emails.
5. **Call to Action**: Include clear, prominent call-to-action buttons for actionable emails.
6. **Footer Requirements**: Include unsubscribe links (for marketing emails), physical address, and privacy policy links as required by CAN-SPAM regulations.

## Development and Testing

### Local Development

In development environments without a SendGrid API key, the service will:
1. Log email contents to the console
2. Simulate successful delivery
3. Return mock response objects

This allows testing email flows without sending actual emails.

### Test Sending

To test actual email delivery:
1. Add a valid SendGrid API key to your `.env.development` file
2. Use test email addresses (e.g., your development team's emails)
3. Add a prefix to the subject line to identify test emails (e.g., "[TEST]")

## Logging and Monitoring

The email service includes comprehensive logging:

1. **Success Logging**: Each successful email send is logged with performance metrics and recipient details
2. **Error Logging**: Failed email attempts are logged with detailed error information
3. **Security Logging**: Security-related details are tracked for audit purposes
4. **Performance Metrics**: Email sending performance is measured and logged

### Example Log Output

```
[INFO] 2025-03-10T11:20:00.000Z - Email sent successfully - {"recipient":"user@example.com","subject":"Welcome to ILYTAT Designs","templateId":"d-xxxxxxxxxxxx"}
```

## Performance and Reliability

### Rate Limiting

SendGrid imposes rate limits based on your plan. The service has been designed to:
1. Handle rate limiting errors gracefully
2. Provide clear error messages when limits are exceeded
3. Support future implementation of queuing for high-volume scenarios

### Error Handling

The service implements robust error handling:
1. Validates required fields before attempting to send
2. Catches and logs specific SendGrid errors
3. Provides clear error messages to calling code
4. Prevents uncaught exceptions from crashing the application

## Security Considerations

1. **API Key Security**: The SendGrid API key should be treated as a sensitive credential and never committed to version control.
2. **Personal Information**: Minimize the amount of personal information included in emails.
3. **Token Expiry**: All verification and password reset links have appropriate expiration times.
4. **Link Security**: Authentication links use secure, time-bound tokens.
5. **Email Validation**: All recipient emails are validated before sending.

## Extending the Service

### Adding New Email Types

To add a new type of email:

1. Create a new method in `EmailService.js` following the pattern of existing methods
2. Design the corresponding template in SendGrid
3. Add the template ID to your environment variables
4. Update this documentation with the new email type and template variables

### Custom Tracking

For deeper analytics:

1. Use SendGrid categories to segment emails for reporting
2. Implement click tracking for important links
3. Consider implementing custom tracking pixels for open rate tracking in HTML emails

## Troubleshooting

### Common Issues

1. **Emails Not Sending**: Check SendGrid API key is valid and has appropriate permissions
2. **Emails Going to Spam**: Review content for spam triggers, ensure proper authentication (SPF/DKIM)
3. **Template Variables Not Working**: Verify template variable names match exactly with what's defined in the SendGrid template
4. **Low Deliverability**: Check sender reputation in SendGrid dashboard, review bounce reasons

### Email Not Received

If users report not receiving emails:

1. Check logs for errors related to the specific email send attempt
2. Verify the email address is correct and has not previously bounced
3. Check spam/junk folders
4. Verify domain reputation and authentication settings in SendGrid

## Future Enhancements

- Implement email queuing for bulk sends
- Add support for A/B testing email templates
- Develop a preview mechanism for email templates
- Add support for email scheduling
- Implement email analytics dashboard integration
