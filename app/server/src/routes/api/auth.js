const express = require('express')
const { validateRegistration, validateLogin, validatePasswordReset, validateForgotPassword } = require('../../middleware/validation')
const { authenticateToken } = require('../../middleware/auth')
const AuthService = require('../../services/authService')
const { User } = require('../../models')
const logger = require('../../utils/logger')
const { catchAsync, createNotFoundError } = require('../../utils/errorHandler')
const path = require('path');

const router = express.Router()

/**
 * @route POST /api/auth/register
 * @desc Register a new user
 * @access Public
 */
router.post('/register', validateRegistration, catchAsync(async (req, res) => {
  const startTime = Date.now();
  
  // Log the registration attempt with sanitized data
  logger.response.business({
    message: 'User registration attempt',
    data: { 
      email: req.body.email,
      firstName: req.body.firstName,
      lastName: req.body.lastName
    }
  }).withRequestDetails(req).log();
  
  // Register the user through the service
  const result = await AuthService.registerUser(req.body, req);
  
  // Log successful registration
  logger.response.business({
    success: true,
    message: 'User registered successfully',
    userMessage: 'Registration successful',
    data: { 
      userId: result.id,
      email: result.email 
    }
  }).withPerformanceMetrics({
    duration: Date.now() - startTime
  }).withSecurityDetails({
    ip: req.ip,
    event: 'user-registration',
    success: true
  }).log();
  
  // Send success response
  return res.sendSuccess(result, 'Registration successful', 201);
}));

/**
 * @route POST /api/auth/login
 * @desc Authenticate user & get token
 * @access Public
 */
router.post('/login', validateLogin, catchAsync(async (req, res) => {
  const startTime = Date.now();
  
  // Log the login attempt with minimal info
  logger.info(
    logger.response.business({
      message: 'Login attempt',
      data: { email: req.body.email }
    }).withRequestDetails({ 
      ip: req.ip, 
      userAgent: req.headers['user-agent'] 
    })
  );
  
  try {
    // Authenticate the user
    const result = await AuthService.authenticateUser(req.body, req);
    
    // Log successful login
    logger.info(
      logger.response.business({
        success: true,
        message: 'User login successful',
        userMessage: 'Login successful',
        data: { 
          userId: result.user.id,
          email: result.user.email 
        }
      }).withPerformanceMetrics({
        duration: Date.now() - startTime
      }).withSecurityDetails({
        ip: req.ip,
        event: 'login',
        success: true
      })
    );
    
    // Send success response
    return res.sendSuccess(result, 'Login successful');
  } catch (error) {
    // Check if this is a verification error
    if (error.statusCode === 403 && error.details?.requiresVerification) {
      // Send a more helpful error message with instructions
      return res.status(403).json({
        success: false,
        message: 'Email not verified',
        error: {
          message: 'Your email address has not been verified yet.',
          details: {
            requiresVerification: true,
            email: error.details.email,
            userId: error.details.userId
          },
          actions: [
            {
              type: 'resend_verification',
              message: 'Resend verification email',
              endpoint: '/api/auth/resend-verification'
            },
            {
              type: 'check_dev_email',
              message: process.env.NODE_ENV !== 'production'
                ? `In development mode, ${process.env.SAVE_EMAILS_TO_DISK === 'true' 
                    ? 'check email files in the logs/emails directory' 
                    : 'check your configured email service'} for verification links.`
                : 'Please check your email inbox for a verification link.'
            }
          ]
        }
      });
    }
    
    // For other errors, let the error handler manage it
    throw error;
  }
}));

/**
 * @route GET /api/auth/me
 * @desc Get current user
 * @access Private
 */
router.get('/me', authenticateToken, catchAsync(async (req, res) => {
  // Find the user by ID
  const user = await User.findByPk(req.user.id, {
    attributes: ['id', 'firstName', 'lastName', 'email', 'role']
  });

  // If user not found, throw a not found error
  if (!user) {
    throw createNotFoundError('User', req.user.id, 'User profile not found');
  }

  // Log profile retrieval
  logger.info(
    logger.response.business({
      success: true,
      message: 'User profile retrieved successfully',
      data: { userId: user.id }
    })
  );
  
  // Send success response
  return res.sendSuccess(user, 'User profile fetched successfully');
}));

/**
 * @route POST /api/auth/logout
 * @desc Logout user and invalidate session
 * @access Private
 */
router.post('/logout', authenticateToken, catchAsync(async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  // Log logout attempt
  logger.info(
    logger.response.business({
      message: 'User logout attempt',
      data: { 
        userId: req.user.id,
        email: req.user.email 
      }
    })
  );
  
  // Logout user
  await AuthService.logoutUser(token, req.user.email);
  
  // Log successful logout
  logger.info(
    logger.response.business({
      success: true,
      message: 'User logged out successfully',
      userMessage: 'Successfully logged out',
      data: { 
        userId: req.user.id,
        email: req.user.email 
      }
    }).withSecurityDetails({
      ip: req.ip,
      event: 'logout',
      success: true
    })
  );
  
  // Send success response
  return res.sendSuccess(null, 'Successfully logged out');
}));

/**
 * @route POST /api/auth/logout-all
 * @desc Logout from all devices
 * @access Private
 */
router.post('/logout-all', authenticateToken, catchAsync(async (req, res) => {
  // Log logout all devices attempt
  logger.info(
    logger.response.business({
      message: 'User logout from all devices attempt',
      data: { 
        userId: req.user.id,
        email: req.user.email 
      }
    })
  );
  
  // Logout from all devices
  await AuthService.logoutAllDevices(req.user.id, req.user.email);
  
  // Log successful logout from all devices
  logger.info(
    logger.response.business({
      success: true,
      message: 'User logged out from all devices successfully',
      userMessage: 'Successfully logged out from all devices',
      data: { 
        userId: req.user.id,
        email: req.user.email 
      }
    }).withSecurityDetails({
      ip: req.ip,
      event: 'logout-all',
      success: true
    })
  );
  
  // Send success response
  return res.sendSuccess(null, 'Successfully logged out from all devices');
}));

/**
 * @route POST /api/auth/forgot-password
 * @desc Request password reset email
 * @access Public
 */
router.post('/forgot-password', validateForgotPassword, catchAsync(async (req, res) => {
  const startTime = Date.now();
  
  // Log the password reset request with minimal info
  logger.info(
    logger.response.business({
      message: 'Password reset request',
      data: { email: req.body.email }
    }).withRequestDetails({ 
      ip: req.ip, 
      userAgent: req.headers['user-agent'] 
    })
  );
  
  // Request password reset
  const result = await AuthService.requestPasswordReset(req.body.email);
  
  // Log successful password reset request
  logger.response.business({
    success: true,
    message: 'Password reset request processed',
    userMessage: 'If your email is registered, you will receive password reset instructions'
  }).withPerformanceMetrics({
    duration: Date.now() - startTime
  }).withSecurityDetails({
    ip: req.ip,
    event: 'password-reset-request',
    success: true
  }).log();
  
  // Send success response
  return res.sendSuccess(result, 'If your email is registered, you will receive password reset instructions');
}));

/**
 * @route POST /api/auth/reset-password
 * @desc Reset password using token
 * @access Public
 */
router.post('/reset-password', validatePasswordReset, catchAsync(async (req, res) => {
  const startTime = Date.now();
  
  // Log the password reset attempt
  logger.info(
    logger.response.business({
      message: 'Password reset attempt',
      data: { token: req.body.token ? 'provided' : 'missing' }
    }).withRequestDetails({ 
      ip: req.ip, 
      userAgent: req.headers['user-agent'] 
    })
  );
  
  // Reset password
  const result = await AuthService.resetPassword(req.body.token, req.body.newPassword);
  
  // Log successful password reset
  logger.info(
    logger.response.business({
      success: true,
      message: 'Password reset successful',
      userMessage: 'Password has been reset successfully'
    }).withPerformanceMetrics({
      duration: Date.now() - startTime
    }).withSecurityDetails({
      ip: req.ip,
      event: 'password-reset',
      success: true
    })
  );
  
  // Send success response
  return res.sendSuccess(result, 'Password has been reset successfully');
}));

/**
 * @route POST /api/auth/resend-verification
 * @desc Resend verification email
 * @access Public
 */
router.post('/resend-verification', catchAsync(async (req, res) => {
  const startTime = Date.now();
  const { email } = req.body;
  
  if (!email) {
    return res.sendError('Email is required', 400);
  }
  
  // Log the verification email resend request
  logger.info(
    logger.response.business({
      message: 'Verification email resend request',
      data: { email }
    }).withRequestDetails({ 
      ip: req.ip, 
      userAgent: req.headers['user-agent'] 
    })
  );
  
  try {
    // Resend verification email
    const result = await AuthService.resendVerificationEmail(email);
    
    // Get email service details for development environment
    let devEmailInfo = {};
    if (process.env.NODE_ENV !== 'production') {
      const EmailService = require('../../services/emailService');
      devEmailInfo = {
        devMode: true,
        emailServiceInfo: EmailService.getDevEmailInfo()
      };
    }
    
    // Log successful verification email resend
    logger.info(
      logger.response.business({
        success: true,
        message: 'Verification email resent successfully',
        userMessage: 'Verification email sent successfully'
      }).withPerformanceMetrics({
        duration: Date.now() - startTime
      }).withSecurityDetails({
        ip: req.ip,
        event: 'email-verification-resend',
        success: true
      })
    );
    
    // Send success response with dev info if applicable
    return res.sendSuccess(
      { ...result, ...devEmailInfo }, 
      'Verification email sent successfully. Please check your inbox.'
    );
  } catch (error) {
    // If email service is unavailable in development, provide alternative
    if (process.env.NODE_ENV !== 'production' && 
        (error.message.includes('email service') || error.message.includes('email transport'))) {
      return res.status(503).json({
        success: false,
        message: 'Email service unavailable',
        error: {
          message: 'Email service is not properly configured in development mode.',
          details: {
            devMode: true,
            emailConfig: process.env.SAVE_EMAILS_TO_DISK === 'true' ? {
              savingToFile: true,
              location: path.join(process.cwd(), 'logs', 'emails')
            } : null
          },
          actions: [
            {
              type: 'check_env_config',
              message: 'Check your .env file for email configuration. Make sure SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS are set or MAILTRAP_USER, MAILTRAP_PASS are properly configured.'
            },
            {
              type: 'enable_file_saving',
              message: 'Set SAVE_EMAILS_TO_DISK=true in your .env file to save emails to the filesystem for inspection.'
            },
            {
              type: 'manual_verification',
              message: 'For development, you can manually update your user record in the database to set isVerified=true'
            }
          ]
        }
      });
    }
    
    // For other errors, let the error handler manage it
    throw error;
  }
}));

module.exports = router
