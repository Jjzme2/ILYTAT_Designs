/**
 * Email Service
 * Handles sending emails for various app functions using SendGrid with Nodemailer fallback
 */

const sgMail = require('@sendgrid/mail');
const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs');
const logger = require('../utils/logger').createLogger({
  level: 'info',
  service: 'emailService'
});
const config = require('../config');
const contactInfo = require('../config/contact');

// Initialize SendGrid with API key if available
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  logger.info('[EMAIL SERVICE] Initialized with SendGrid');
} else {
  logger.warn('[EMAIL SERVICE] SendGrid API key not set. Will use Nodemailer for development.');
}

// Create a reusable Nodemailer transporter for development
let nodemailerTransporter;
let devEmailUrl;

// Email development configuration
const DEV_EMAIL_CONFIG = {
  // Option 1: Use mailtrap.io (if credentials are provided)
  mailtrap: {
    host: 'smtp.mailtrap.io',
    port: 2525,
    auth: {
      user: process.env.MAILTRAP_USER,
      pass: process.env.MAILTRAP_PASS
    }
  },
  
  // Option 2: Use Gmail (if credentials are provided)
  gmail: {
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD // Must be an App Password, not regular password
    }
  },
  
  // Option 3: Use custom SMTP server (if credentials are provided)
  smtp: {
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  },
  
  // Option 4 (Default): Use Ethereal.email test accounts
  ethereal: {
    createAccount: true
  },
  
  // Optional: Store email content to disk for inspection
  saveToFile: {
    enabled: process.env.SAVE_EMAILS_TO_DISK === 'true',
    dir: path.join(__dirname, '../../../logs/emails')
  }
};

// Store information about development email configuration
let devEmailConfig = {
  mode: 'unknown',
  url: null,
  filePath: null,
  isConfigured: false
};

/**
 * Initialize Email Service with appropriate transporter for current environment
 */
async function initializeEmailTransport() {
  // Do not initialize transporter in production mode - use SendGrid
  if (process.env.NODE_ENV === 'production') {
    if (!process.env.SENDGRID_API_KEY) {
      logger.error('[EMAIL SERVICE] No SendGrid API key provided in production environment!');
    }
    return;
  }
  
  try {
    // Try each transport option in order of priority
    
    // 1. Check for Mailtrap credentials
    if (process.env.MAILTRAP_USER && process.env.MAILTRAP_PASS) {
      nodemailerTransporter = nodemailer.createTransport(DEV_EMAIL_CONFIG.mailtrap);
      logger.info('[EMAIL SERVICE] Using Mailtrap for development emails');
      await nodemailerTransporter.verify();
      devEmailUrl = 'https://mailtrap.io/inboxes';
      devEmailConfig.mode = 'mailtrap';
      devEmailConfig.url = devEmailUrl;
      devEmailConfig.isConfigured = true;
      return;
    }
    
    // 2. Check for Gmail credentials
    if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
      nodemailerTransporter = nodemailer.createTransport(DEV_EMAIL_CONFIG.gmail);
      logger.info('[EMAIL SERVICE] Using Gmail for development emails');
      await nodemailerTransporter.verify();
      devEmailConfig.mode = 'gmail';
      devEmailConfig.url = 'https://mail.google.com';
      devEmailConfig.isConfigured = true;
      return;
    }
    
    // 3. Check for custom SMTP server credentials
    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
      nodemailerTransporter = nodemailer.createTransport(DEV_EMAIL_CONFIG.smtp);
      logger.info('[EMAIL SERVICE] Using custom SMTP server for development emails', {
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT
      });
      await nodemailerTransporter.verify();
      devEmailConfig.mode = 'smtp';
      devEmailConfig.url = `smtp://${process.env.SMTP_HOST}:${process.env.SMTP_PORT}`;
      devEmailConfig.isConfigured = true;
      return;
    }
    
    // 4. Default fallback - create Ethereal test account
    logger.info('[EMAIL SERVICE] No SMTP credentials provided, creating Ethereal test account...');
    await createEtherealAccount();
    
    // Ensure email save directory exists if enabled
    if (DEV_EMAIL_CONFIG.saveToFile.enabled) {
      if (!fs.existsSync(DEV_EMAIL_CONFIG.saveToFile.dir)) {
        fs.mkdirSync(DEV_EMAIL_CONFIG.saveToFile.dir, { recursive: true });
      }
      logger.info(`[EMAIL SERVICE] Will save email files to: ${DEV_EMAIL_CONFIG.saveToFile.dir}`);
      devEmailConfig.filePath = DEV_EMAIL_CONFIG.saveToFile.dir;
    }
  } catch (error) {
    logger.error('[EMAIL SERVICE] Failed to initialize email transport:', { error });
  }
}

/**
 * Create an Ethereal test account for development email testing
 */
async function createEtherealAccount() {
  try {
    const testAccount = await nodemailer.createTestAccount();
    
    nodemailerTransporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass
      }
    });
    
    devEmailUrl = 'https://ethereal.email';
    devEmailConfig.mode = 'ethereal';
    devEmailConfig.url = devEmailUrl;
    devEmailConfig.isConfigured = true;
    
    logger.info('[EMAIL SERVICE] Created Ethereal test account', {
      user: testAccount.user,
      pass: testAccount.pass,
      loginUrl: 'https://ethereal.email/login',
      message: 'Login with the credentials above to view sent emails'
    });
  } catch (error) {
    logger.error('[EMAIL SERVICE] Failed to create Ethereal test account:', { error });
  }
}

/**
 * Save email content to file system for development inspection
 * @private
 */
async function saveEmailToFile(message) {
  if (!DEV_EMAIL_CONFIG.saveToFile.enabled) return;

  try {
    // Ensure directory exists
    if (!fs.existsSync(DEV_EMAIL_CONFIG.saveToFile.dir)) {
      fs.mkdirSync(DEV_EMAIL_CONFIG.saveToFile.dir, { recursive: true });
    }
    
    // Generate a unique filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const sanitizedSubject = (message.subject || 'no-subject').replace(/[^a-z0-9]/gi, '-').substring(0, 30);
    const filename = `${timestamp}-${sanitizedSubject}.json`;
    const filePath = path.join(DEV_EMAIL_CONFIG.saveToFile.dir, filename);
    
    // Format email content
    const emailContent = {
      to: message.to,
      from: message.from,
      subject: message.subject,
      text: message.text,
      html: message.html,
      timestamp: new Date().toISOString(),
      metadata: {
        type: message.templateId ? 'template' : 'direct',
        templateId: message.templateId,
        dynamicTemplateData: message.dynamicTemplateData
      }
    };
    
    // Write to file
    fs.writeFileSync(filePath, JSON.stringify(emailContent, null, 2));
    logger.info(`[EMAIL SERVICE] Email saved to file: ${filePath}`);
    
    // Update dev email config with the latest file path
    devEmailConfig.mode = 'file';
    devEmailConfig.filePath = DEV_EMAIL_CONFIG.saveToFile.dir;
    devEmailConfig.isConfigured = true;
    
    return filePath;
  } catch (error) {
    logger.error('[EMAIL SERVICE] Failed to save email to file:', { error });
    return null;
  }
}

/**
 * Get instructions for accessing emails based on the configuration mode
 * @private
 * @param {string} mode - Email configuration mode
 * @returns {string} Instructions for the specific mode
 */
function getEmailInstructions(mode) {
  switch(mode) {
    case 'mailtrap':
      return 'Check your Mailtrap inbox at https://mailtrap.io/inboxes to view verification emails. Login with the credentials in your .env file.';
    
    case 'gmail':
      return 'Check your Gmail inbox. If you don\'t see the email, check your spam folder.';
    
    case 'smtp':
      return 'Check your email account for verification emails. If using Zoho, log in at https://mail.zoho.com';
    
    case 'ethereal':
      return 'Check your Ethereal test inbox at https://ethereal.email - credentials are logged in the server console.';
    
    case 'file':
      return `Emails are being saved to disk. Check the logs/emails directory (${devEmailConfig.filePath}) for email JSON files.`;
    
    default:
      return 'Email service is not properly configured. Check server logs and .env file for proper email settings.';
  }
}

// Initialize email transport on module load
initializeEmailTransport();

class EmailService {
  /**
   * Initialize email service with environment-specific settings
   */
  static async initialize() {
    logger.info('[EMAIL SERVICE] Initializing email service');
    
    // Re-initialize transport if needed
    if (!nodemailerTransporter && process.env.NODE_ENV !== 'production') {
      await initializeEmailTransport();
    }
    
    return true;
  }

  /**
   * Send an email using SendGrid or Nodemailer fallback
   * @param {Object} options - Email options
   * @param {string} options.to - Recipient email
   * @param {string} options.from - Sender email (defaults to configured from email)
   * @param {string} options.subject - Email subject
   * @param {string} options.text - Plain text content
   * @param {string} options.html - HTML content
   * @param {string} options.templateId - SendGrid template ID (if using templates)
   * @param {Object} options.dynamicTemplateData - Template variables (if using templates)
   * @param {Object} options.attachments - Array of attachments
   * @param {Object} options.categories - Array of categories for tracking
   * @returns {Promise<Object>} - SendGrid response or mock response
   */
  static async sendEmail(options) {
    try {
      // Validate required fields
      if (!options.to) {
        throw new Error('Recipient email is required');
      }
      
      if (!options.subject && !options.templateId) {
        throw new Error('Subject or template ID is required');
      }
      
      if (!options.text && !options.html && !options.templateId) {
        throw new Error('Email content or template ID is required');
      }

      // Build email message
      const message = {
        to: options.to,
        from: options.from || process.env.EMAIL_FROM || contactInfo.contactDetails.company.supportEmail || 'noreply@ilytatdesigns.com',
        subject: options.subject,
        text: options.text,
        html: options.html,
        attachments: options.attachments,
        categories: [...(options.categories || []), 'app-email'],
        dynamicTemplateData: options.dynamicTemplateData
      };

      // If using SendGrid templates
      if (options.templateId) {
        message.templateId = options.templateId;
      }

      // Tracking settings if needed
      if (options.trackingSettings) {
        message.trackingSettings = options.trackingSettings;
      }

      // Add custom headers if provided
      if (options.headers) {
        message.headers = options.headers;
      }

      // Security details for logging
      const securityDetails = {
        event: 'email-sent',
        recipient: options.to,
        emailType: options.categories?.[0] || 'system',
        template: options.templateId || 'custom'
      };
      
      // Performance tracking
      const startTime = Date.now();

      // Use SendGrid in production if API key is available, otherwise use Nodemailer
      let response;
      
      if (process.env.SENDGRID_API_KEY) {
        // Use SendGrid
        response = await sgMail.send(message);
        
        // Log success with security and performance details
        logger.info('[EMAIL SERVICE] Email sent successfully via SendGrid', {
          recipient: options.to,
          subject: options.subject,
          templateId: options.templateId,
          categories: options.categories,
          duration: Date.now() - startTime
        });
        
        return response;
      } else if (nodemailerTransporter) {
        // Save email to file if enabled
        if (DEV_EMAIL_CONFIG.saveToFile.enabled) {
          saveEmailToFile(message);
        }
        
        // Use Nodemailer in development
        // Convert SendGrid format to Nodemailer format
        const nodemailerMessage = {
          from: message.from,
          to: message.to,
          subject: message.subject,
          text: message.text,
          html: message.html,
          attachments: message.attachments ? message.attachments.map(attachment => ({
            filename: attachment.filename,
            content: attachment.content,
            contentType: attachment.type
          })) : []
        };
        
        // Send with Nodemailer
        const info = await nodemailerTransporter.sendMail(nodemailerMessage);
        
        // Get preview URL for Ethereal emails
        let previewUrl = null;
        if (devEmailUrl === 'https://ethereal.email') {
          previewUrl = nodemailer.getTestMessageUrl(info);
        } else {
          previewUrl = devEmailUrl;
        }
        
        // Log success with Nodemailer details
        logger.info('[EMAIL SERVICE] Email sent successfully via Nodemailer (Development)', {
          recipient: options.to,
          subject: options.subject,
          messageId: info.messageId,
          previewUrl,
          duration: Date.now() - startTime
        });
        
        // Return Nodemailer info with additional fields for consistency
        return {
          ...info,
          statusCode: 202,
          _provider: 'nodemailer',
          previewUrl
        };
      } else {
        // Fallback to simulation if neither SendGrid nor Nodemailer is available
        logger.info(`[EMAIL SERVICE] Email sending simulated (no provider available)`, {
          to: options.to,
          subject: options.subject,
          templateId: options.templateId
        });
        
        logger.debug('[EMAIL SERVICE] Simulated email content:', { 
          subject: options.subject, 
          templateId: options.templateId,
          dynamicTemplateData: options.dynamicTemplateData
        });
        
        // Save simulated email to file if enabled
        if (DEV_EMAIL_CONFIG.saveToFile.enabled) {
          const filePath = saveEmailToFile(message);
          if (filePath) {
            logger.info(`[EMAIL SERVICE] Simulated email saved to: ${filePath}`);
          }
        }
        
        // Mock response
        response = {
          statusCode: 202,
          body: {},
          headers: {},
          _simulated: true
        };
        
        return response;
      }
    } catch (error) {
      // Log error with structured format
      logger.error('[EMAIL SERVICE] Failed to send email', {
        error: {
          message: error.message,
          code: error.code,
          stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        },
        data: {
          recipient: options.to,
          subject: options.subject,
          templateId: options.templateId
        }
      });
      
      throw error;
    }
  }

  /**
   * Get development email service information for debugging
   * This method provides information about the current email configuration in development
   * to help developers understand where to look for verification emails
   * @returns {Object} Development email configuration information
   */
  static getDevEmailInfo() {
    // Only return details in development mode
    if (process.env.NODE_ENV === 'production') {
      return { 
        environment: 'production',
        message: 'Email information not available in production mode'
      };
    }
    
    return {
      environment: process.env.NODE_ENV,
      emailServiceInfo: {
        configured: devEmailConfig.isConfigured,
        mode: devEmailConfig.mode,
        providerUrl: devEmailConfig.url,
        saveToFile: {
          enabled: DEV_EMAIL_CONFIG.saveToFile.enabled,
          location: devEmailConfig.filePath
        },
        instructions: getEmailInstructions(devEmailConfig.mode)
      }
    };
  }

  /**
   * Send welcome email with verification link
   * @param {Object} user - User object with email, firstName
   * @param {string} verificationToken - Email verification token
   * @returns {Promise<Object>} - Email sending response
   */
  static async sendVerificationEmail(user, verificationToken) {
    try {
      // Build verification URL
      const verificationUrl = `${process.env.CLIENT_URL}/verify-email?token=${verificationToken}`;
      
      // If using SendGrid templates
      if (process.env.SENDGRID_VERIFICATION_TEMPLATE_ID) {
        return await this.sendEmail({
          to: user.email,
          templateId: process.env.SENDGRID_VERIFICATION_TEMPLATE_ID,
          dynamicTemplateData: {
            first_name: user.firstName,
            verification_url: verificationUrl,
            expiry_hours: 24
          },
          categories: ['verification', 'onboarding']
        });
      }
      
      // Fallback to standard email if template ID not configured
      return await this.sendEmail({
        to: user.email,
        subject: 'Welcome to ILYTAT Designs - Please verify your email',
        html: `
          <h1>Welcome to ILYTAT Designs, ${user.firstName}!</h1>
          <p>Thank you for registering. Please verify your email by clicking the link below:</p>
          <p><a href="${verificationUrl}" style="padding: 12px 24px; background-color: #4A90E2; color: white; text-decoration: none; border-radius: 4px; display: inline-block; margin: 16px 0;">Verify my email</a></p>
          <p>Or copy and paste this link in your browser:</p>
          <p>${verificationUrl}</p>
          <p>The link will expire in 24 hours.</p>
          <p>If you did not register on our site, please ignore this email.</p>
          <p>Best regards,<br>The ILYTAT Designs Team</p>
        `,
        text: `Welcome to ILYTAT Designs, ${user.firstName}!\n\nThank you for registering. Please verify your email by clicking the link below:\n\n${verificationUrl}\n\nThe link will expire in 24 hours.\n\nIf you did not register on our site, please ignore this email.\n\nBest regards,\nThe ILYTAT Designs Team`,
        categories: ['verification', 'onboarding']
      });
    } catch (error) {
      logger.error('[EMAIL SERVICE] Error sending verification email:', { error });
      throw error;
    }
  }

  /**
   * Send password reset email with reset link
   * @param {Object} user - User object with email, firstName
   * @param {string} resetToken - Password reset token
   * @returns {Promise<Object>} - Email sending response
   */
  static async sendPasswordResetEmail(user, resetToken) {
    try {
      // Build reset URL
      const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`;
      
      // If using SendGrid templates
      if (process.env.SENDGRID_PASSWORD_RESET_TEMPLATE_ID) {
        return await this.sendEmail({
          to: user.email,
          templateId: process.env.SENDGRID_PASSWORD_RESET_TEMPLATE_ID,
          dynamicTemplateData: {
            first_name: user.firstName,
            reset_url: resetUrl,
            expiry_hours: 1
          },
          categories: ['password-reset', 'account-security']
        });
      }
      
      // Fallback to standard email if template ID not configured
      return await this.sendEmail({
        to: user.email,
        subject: 'ILYTAT Designs - Password Reset Request',
        html: `
          <h1>Password Reset Request</h1>
          <p>Hello ${user.firstName},</p>
          <p>We received a request to reset your password. Please click the link below to reset it:</p>
          <p><a href="${resetUrl}" style="padding: 12px 24px; background-color: #4A90E2; color: white; text-decoration: none; border-radius: 4px; display: inline-block; margin: 16px 0;">Reset my password</a></p>
          <p>Or copy and paste this link in your browser:</p>
          <p>${resetUrl}</p>
          <p>The link will expire in 1 hour.</p>
          <p>If you did not request a password reset, please ignore this email or contact support if you have concerns.</p>
          <p>Best regards,<br>The ILYTAT Designs Team</p>
        `,
        text: `Hello ${user.firstName},\n\nWe received a request to reset your password. Please click the link below to reset it:\n\n${resetUrl}\n\nThe link will expire in 1 hour.\n\nIf you did not request a password reset, please ignore this email or contact support if you have concerns.\n\nBest regards,\nThe ILYTAT Designs Team`,
        categories: ['password-reset', 'account-security']
      });
    } catch (error) {
      logger.error('[EMAIL SERVICE] Error sending password reset email:', { error });
      throw error;
    }
  }

  /**
   * Send password changed confirmation email
   * @param {Object} user - User object with email, firstName
   * @returns {Promise<Object>} - Email sending response
   */
  static async sendPasswordChangedEmail(user) {
    try {
      // If using SendGrid templates
      if (process.env.SENDGRID_PASSWORD_CHANGED_TEMPLATE_ID) {
        return await this.sendEmail({
          to: user.email,
          templateId: process.env.SENDGRID_PASSWORD_CHANGED_TEMPLATE_ID,
          dynamicTemplateData: {
            first_name: user.firstName,
            support_email: process.env.SUPPORT_EMAIL || 'support@ilytatdesigns.com'
          },
          categories: ['password-changed', 'account-security']
        });
      }
      
      // Fallback to standard email if template ID not configured
      return await this.sendEmail({
        to: user.email,
        subject: 'ILYTAT Designs - Your Password Has Been Changed',
        html: `
          <h1>Password Changed</h1>
          <p>Hello ${user.firstName},</p>
          <p>Your password for ILYTAT Designs has been successfully changed.</p>
          <p>If you did not change your password, please contact our support team immediately at ${process.env.SUPPORT_EMAIL || 'support@ilytatdesigns.com'}.</p>
          <p>Best regards,<br>The ILYTAT Designs Team</p>
        `,
        text: `Hello ${user.firstName},\n\nYour password for ILYTAT Designs has been successfully changed.\n\nIf you did not change your password, please contact our support team immediately at ${process.env.SUPPORT_EMAIL || 'support@ilytatdesigns.com'}.\n\nBest regards,\nThe ILYTAT Designs Team`,
        categories: ['password-changed', 'account-security']
      });
    } catch (error) {
      logger.error('[EMAIL SERVICE] Error sending password changed email:', { error });
      throw error;
    }
  }

  /**
   * Send order confirmation email
   * @param {Object} user - User object with email, firstName
   * @param {Object} order - Order details
   * @returns {Promise<Object>} - Email sending response
   */
  static async sendOrderConfirmationEmail(user, order) {
    try {
      // If using SendGrid templates
      if (process.env.SENDGRID_ORDER_CONFIRMATION_TEMPLATE_ID) {
        return await this.sendEmail({
          to: user.email,
          templateId: process.env.SENDGRID_ORDER_CONFIRMATION_TEMPLATE_ID,
          dynamicTemplateData: {
            first_name: user.firstName,
            order_id: order.id,
            order_date: new Date(order.createdAt).toLocaleDateString(),
            order_total: order.total.toFixed(2),
            order_items: order.items,
            shipping_address: order.shippingAddress,
            tracking_url: order.trackingUrl || null
          },
          categories: ['order-confirmation', 'transactional']
        });
      }
      
      // Fallback to standard email if template ID not configured
      // Simplified version - in a real implementation, you'd format order details nicely
      return await this.sendEmail({
        to: user.email,
        subject: `ILYTAT Designs - Order Confirmation #${order.id}`,
        html: `
          <h1>Order Confirmation</h1>
          <p>Hello ${user.firstName},</p>
          <p>Thank you for your order! We've received your order #${order.id} and are processing it now.</p>
          <p>Order Details:</p>
          <p>Date: ${new Date(order.createdAt).toLocaleDateString()}</p>
          <p>Total: $${order.total.toFixed(2)}</p>
          <!-- Order items and shipping details would be formatted here -->
          <p>You can track your order status in your account dashboard.</p>
          <p>Best regards,<br>The ILYTAT Designs Team</p>
        `,
        text: `Hello ${user.firstName},\n\nThank you for your order! We've received your order #${order.id} and are processing it now.\n\nOrder Details:\nDate: ${new Date(order.createdAt).toLocaleDateString()}\nTotal: $${order.total.toFixed(2)}\n\nYou can track your order status in your account dashboard.\n\nBest regards,\nThe ILYTAT Designs Team`,
        categories: ['order-confirmation', 'transactional']
      });
    } catch (error) {
      logger.error('[EMAIL SERVICE] Error sending order confirmation email:', { error });
      throw error;
    }
  }
}

module.exports = EmailService;
