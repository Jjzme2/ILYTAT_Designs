# Email Service and Authentication System Documentation

## Email Service Overview

The email service has been enhanced with a fallback mechanism to ensure emails can be sent in both production and development environments:

### Key Features

1. **SendGrid Integration**
   - Primary email provider for production environments
   - Configured via `SENDGRID_API_KEY` environment variable
   - Supports template-based emails for consistent branding

2. **Nodemailer Fallback**
   - Automatically activates when SendGrid API key is not available
   - Perfect for development and testing environments
   - Uses Ethereal Email for testing (auto-creates test accounts)
   - Can be configured with custom SMTP settings

3. **Comprehensive Logging**
   - Detailed logs for all email operations
   - Performance metrics for email sending
   - Security details for audit purposes
   - Different log levels based on environment

### Configuration Options

| Environment Variable | Description | Default |
|---------------------|-------------|---------|
| `SENDGRID_API_KEY` | SendGrid API key for production | None |
| `EMAIL_FROM` | Default sender email address | noreply@ilytatdesigns.com |
| `SMTP_HOST` | SMTP server host for Nodemailer | smtp.ethereal.email |
| `SMTP_PORT` | SMTP server port for Nodemailer | 587 |
| `SMTP_USER` | SMTP username for Nodemailer | Auto-generated |
| `SMTP_PASS` | SMTP password for Nodemailer | Auto-generated |
| `SENDGRID_*_TEMPLATE_ID` | Template IDs for different email types | None |

### Email Types Supported

1. **Verification Emails**
   - Sent during user registration
   - Contains verification link with token
   - Expires after 24 hours

2. **Password Reset Emails**
   - Sent when user requests password reset
   - Contains reset link with secure token
   - Expires after 1 hour

3. **Password Changed Confirmation**
   - Sent after successful password reset or change
   - Security notification for account protection

4. **Order Confirmation Emails**
   - Sent after successful order placement
   - Contains order details and tracking information

## Authentication System

The authentication system provides secure user management with the following features:

### Key Features

1. **Secure Password Management**
   - Passwords hashed using bcrypt with salt
   - Password strength validation
   - Secure password reset flow

2. **Account Security**
   - Rate limiting for login attempts
   - Account lockout after multiple failed attempts
   - Email verification for new accounts

3. **Session Management**
   - JWT-based authentication
   - Refresh token mechanism
   - Ability to log out from all devices

### Authentication Flows

#### Registration Flow
1. User submits registration data
2. System validates data and checks for existing users
3. Password is hashed with bcrypt
4. Verification email is sent
5. User must verify email before full access is granted

#### Login Flow
1. User submits credentials
2. System checks for rate limiting and account locks
3. Password is verified using bcrypt
4. JWT tokens are generated
5. Login attempt is recorded

#### Password Reset Flow
1. User requests password reset
2. System generates a secure reset token
3. Reset email is sent via SendGrid or Nodemailer
4. User clicks link and submits new password
5. System verifies token and updates password
6. Confirmation email is sent
7. All existing sessions are invalidated

## Testing the System

A comprehensive test suite has been created to verify the integration between the authentication and email services:

### Test Coverage

1. **Password Reset Flow**
   - Requesting password reset
   - Verifying reset token generation
   - Sending reset email
   - Resetting password with valid token
   - Sending confirmation email

2. **Authentication with New Password**
   - Verifying authentication with new password works
   - Verifying old password no longer works

### Running Tests

```bash
# Run all tests
npm test

# Run specific authentication and email tests
npm test -- --grep "Authentication and Email"
```

## Development Guidelines

1. **Email Templates**
   - Store email templates in SendGrid for production
   - Maintain HTML and text versions for all emails
   - Use consistent branding and messaging

2. **Security Considerations**
   - Never log sensitive user information
   - Use secure tokens with appropriate expiration
   - Implement rate limiting for all authentication endpoints

3. **Testing**
   - Use Nodemailer with Ethereal for email testing
   - Mock external services in unit tests
   - Maintain integration tests for critical flows

## Troubleshooting

### Common Issues

1. **Emails not sending in development**
   - Check if Nodemailer is properly configured
   - Verify Ethereal account creation logs
   - Check for any error messages in the logs

2. **Password reset not working**
   - Verify token generation and storage
   - Check token expiration time
   - Ensure email is being delivered

3. **Authentication failures**
   - Check bcrypt implementation
   - Verify password comparison logic
   - Look for account lockout or rate limiting triggers

### Debugging

Enable debug logging by setting the `LOG_LEVEL` environment variable to `debug` for more detailed information during development.
