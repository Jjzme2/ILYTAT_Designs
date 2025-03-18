/**
 * Auth Controller
 * Manages authentication-related operations
 * Enhanced with integrated logging and response system
 */
const BaseController = require('./BaseController');
const AuthService = require('../services/authService');
const { User } = require('../models');
const { createNotFoundError } = require('../utils/errorHandler');
const path = require('path');

class AuthController extends BaseController {
  constructor() {
    // Initialize with User model but most methods will be custom
    super(User);
  }

  /**
   * Register a new user
   */
  register = async (req, res, next) => {
    try {
      const startTime = Date.now();
      
      // Log the registration attempt
      this.logger.response.business({
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
      this.logger.response.business({
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
    } catch (error) {
      next(error);
    }
  };

  /**
   * Login a user
   */
  login = async (req, res, next) => {
    try {
      const startTime = Date.now();
      
      // Log the login attempt
      this.logger.info(
        this.logger.response.business({
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
        this.logger.info(
          this.logger.response.business({
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
        
        // Log response structure for troubleshooting
        this.logger.debug(
          this.logger.response.business({
            message: 'Login response structure',
            data: result
          })
        );
        
        // Send success response with token data explicitly included
        // We're making sure the tokens are properly included in the response
        return res.status(200).json({
          success: true,
          message: 'Login successful',
          data: {
            user: result.user,
            accessToken: result.accessToken,
            refreshToken: result.refreshToken
          },
          requestId: req.requestId || null
        });
      } catch (error) {
        // Check if this is a verification error
        if (error.statusCode === 403 && error.details?.requiresVerification) {
          // Send a more helpful error message with instructions
          return this.sendErrorResponse(res, 'Email not verified', 403, {
            requiresVerification: true,
            email: error.details.email,
            userId: error.details.userId,
            actions: [
              {
                type: 'resend_verification',
                message: 'Resend verification email',
                endpoint: '/api/auth/resend-verification'
              },
              {
                type: 'check_dev_email',
                message: process.env.NODE_ENV !== 'production'
                  ? (process.env.SAVE_EMAILS_TO_DISK === 'true'
                      ? 'check email files in the logs/emails directory' 
                      : 'check your configured email service for verification links.')
                  : 'Please check your email inbox for a verification link.'
              }
            ]
          });
        }
        
        // For other errors, log the detailed error
        this.logger.error('Login error:', {
          error: error.message,
          stack: error.stack,
          details: error.details || {}
        });
        
        // Enhanced error response handling - convert error object to string message
        const errorMessage = error ? (typeof error === 'object' 
          ? (error.message || 'Authentication failed. Please check your credentials.') 
          : error.toString()) : 'An unexpected error occurred';
          
        return res.sendError(
          null,
          errorMessage,
          error ? (error.statusCode || 401) : 500
        );
      }
    } catch (error) {
      // Log the unexpected error
      this.logger.error('Unexpected error in login controller:', {
        error: error.message,
        stack: error.stack
      });
      
      // Format error properly to avoid [object Object] in response
      const errorMessage = error ? (typeof error === 'object'
        ? (error.message || 'An unexpected error occurred')
        : error.toString()) : 'An unexpected error occurred';
        
      next({ ...error, message: errorMessage });
    }
  };

  /**
   * Get current user profile
   */
  getCurrentUser = async (req, res, next) => {
    try {
      // Find the user by ID
      const user = await User.findByPk(req.user.id, {
        attributes: ['id', 'firstName', 'lastName', 'email', 'role']
      });

      // If user not found, throw a not found error
      if (!user) {
        throw createNotFoundError('User', req.user.id, 'User profile not found');
      }

      // Log profile retrieval
      this.logger.info(
        this.logger.response.business({
          success: true,
          message: 'User profile retrieved successfully',
          data: { userId: user.id }
        })
      );
      
      // Send success response
      return res.sendSuccess(user, 'User profile fetched successfully');
    } catch (error) {
      next(error);
    }
  };

  /**
   * Logout user and invalidate their token
   */
  logout = async (req, res, next) => {
    try {
      const token = req.headers.authorization?.split(' ')[1];
      
      // Log logout attempt
      this.logger.info(
        this.logger.response.business({
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
      this.logger.info(
        this.logger.response.business({
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
    } catch (error) {
      next(error);
    }
  };

  /**
   * Logout from all devices
   */
  logoutAllDevices = async (req, res, next) => {
    try {
      // Log logout all devices attempt
      this.logger.info(
        this.logger.response.business({
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
      this.logger.info(
        this.logger.response.business({
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
    } catch (error) {
      next(error);
    }
  };

  /**
   * Request password reset
   */
  forgotPassword = async (req, res, next) => {
    try {
      const startTime = Date.now();
      
      // Log the password reset request with minimal info
      this.logger.info(
        this.logger.response.business({
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
      this.logger.response.business({
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
    } catch (error) {
      next(error);
    }
  };

  /**
   * Reset password using token
   */
  resetPassword = async (req, res, next) => {
    try {
      const startTime = Date.now();
      
      // Log the password reset attempt
      this.logger.info(
        this.logger.response.business({
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
      this.logger.info(
        this.logger.response.business({
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
    } catch (error) {
      next(error);
    }
  };

  /**
   * Resend verification email
   */
  resendVerification = async (req, res, next) => {
    try {
      const startTime = Date.now();
      const { email } = req.body;
      
      if (!email) {
        return res.sendError('Email is required', 400);
      }
      
      // Log the verification email resend request
      this.logger.info(
        this.logger.response.business({
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
          const EmailService = require('../services/emailService');
          devEmailInfo = {
            devMode: true,
            emailServiceInfo: EmailService.getDevEmailInfo()
          };
        }
        
        // Log successful verification email resend
        this.logger.info(
          this.logger.response.business({
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
          return this.sendErrorResponse(res, 'Email service unavailable', 503, {
            devMode: true,
            emailConfig: process.env.SAVE_EMAILS_TO_DISK === 'true' ? {
              savingToFile: true,
              location: path.join(process.cwd(), 'logs', 'emails')
            } : null,
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
          });
        }
        
        // For other errors, let the error handler manage it
        throw error;
      }
    } catch (error) {
      next(error);
    }
  };

  /**
   * Helper method for standardized error responses
   */
  sendErrorResponse(res, message, statusCode, details = {}) {
    return res.status(statusCode).json({
      success: false,
      message,
      error: {
        message,
        details,
        ...details.actions ? {} : {
          actions: []
        }
      }
    });
  }
}

module.exports = new AuthController();
