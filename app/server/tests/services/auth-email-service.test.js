/**
 * Authentication and Email Service Integration Test
 * 
 * This test verifies the integration between the authentication service and email service,
 * particularly focusing on password reset functionality with Nodemailer as a fallback.
 */

require('dotenv').config();
const { expect } = require('chai');
const sinon = require('sinon');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const AuthService = require('../../src/services/authService');
const EmailService = require('../../src/services/emailService');
const { User } = require('../../src/models');
const logger = require('../../src/utils/logger').createLogger({
  level: 'debug',
  service: 'auth-email-test'
});

describe('Authentication and Email Service Integration', function() {
  // Increase timeout for async operations
  this.timeout(10000);
  
  // Test user data
  const testUser = {
    email: 'test@example.com',
    password: 'Password123!',
    firstName: 'Test',
    lastName: 'User'
  };
  
  // Store user and tokens for tests
  let user;
  let resetToken;
  
  // Nodemailer test account and transporter
  let testAccount;
  let transporter;
  let sendMailStub;
  
  before(async function() {
    try {
      // Create a Nodemailer test account
      testAccount = await nodemailer.createTestAccount();
      logger.info('Created Nodemailer test account', {
        user: testAccount.user,
        pass: '********',
        smtp: {
          host: 'smtp.ethereal.email',
          port: 587
        }
      });
      
      // Create a reusable transporter
      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass
        }
      });
      
      // Stub the sendMail method
      sendMailStub = sinon.stub(transporter, 'sendMail').callsFake((mailOptions) => {
        logger.info('Intercepted email', {
          to: mailOptions.to,
          subject: mailOptions.subject
        });
        
        // Return a mock successful response
        return Promise.resolve({
          messageId: '<mock-message-id@ethereal.email>',
          envelope: {
            from: mailOptions.from,
            to: [mailOptions.to]
          },
          accepted: [mailOptions.to],
          rejected: [],
          pending: [],
          response: '250 Accepted'
        });
      });
      
      // Clean up any existing test user
      await User.destroy({ where: { email: testUser.email } });
      
      // Create a test user
      user = await User.create({
        email: testUser.email,
        password: await bcrypt.hash(testUser.password, 10),
        firstName: testUser.firstName,
        lastName: testUser.lastName,
        isActive: true,
        isVerified: true
      });
      
      logger.info('Created test user', {
        id: user.id,
        email: user.email
      });
    } catch (error) {
      logger.error('Setup failed', { error });
      throw error;
    }
  });
  
  after(async function() {
    // Restore stubs
    if (sendMailStub) sendMailStub.restore();
    
    // Clean up test user
    await User.destroy({ where: { email: testUser.email } });
    
    logger.info('Test cleanup complete');
  });
  
  describe('Password Reset Flow', function() {
    it('should request a password reset and generate a token', async function() {
      // Request password reset
      const result = await AuthService.requestPasswordReset(testUser.email);
      
      // Verify response
      expect(result).to.be.an('object');
      expect(result.message).to.include('If your email is registered');
      
      // Fetch the user to get the reset token
      const updatedUser = await User.findOne({ where: { email: testUser.email } });
      
      // Verify token was generated
      expect(updatedUser.resetPasswordToken).to.be.a('string');
      expect(updatedUser.resetPasswordExpires).to.be.a('date');
      expect(updatedUser.resetPasswordExpires).to.be.greaterThan(new Date());
      
      // Store token for next test
      resetToken = updatedUser.resetPasswordToken;
      
      logger.info('Password reset requested', {
        token: resetToken.substring(0, 10) + '...',
        expires: updatedUser.resetPasswordExpires
      });
    });
    
    it('should send a password reset email', function() {
      // Verify sendMail was called
      expect(sendMailStub.called).to.be.true;
      
      // Get the last call arguments
      const lastCall = sendMailStub.lastCall;
      
      if (lastCall) {
        const mailOptions = lastCall.args[0];
        
        // Verify email content
        expect(mailOptions.to).to.equal(testUser.email);
        expect(mailOptions.subject).to.include('Password Reset');
        
        if (mailOptions.html) {
          expect(mailOptions.html).to.include('reset');
        }
        
        if (mailOptions.text) {
          expect(mailOptions.text).to.include('reset');
        }
        
        logger.info('Password reset email verified', {
          to: mailOptions.to,
          subject: mailOptions.subject
        });
      }
    });
    
    it('should reset the password with a valid token', async function() {
      // Skip if no token was generated
      if (!resetToken) {
        this.skip();
      }
      
      const newPassword = 'NewPassword456!';
      
      // Reset password
      const result = await AuthService.resetPassword(resetToken, newPassword);
      
      // Verify response
      expect(result).to.be.an('object');
      expect(result.message).to.include('Password has been reset successfully');
      
      // Fetch the user to verify changes
      const updatedUser = await User.findOne({ where: { email: testUser.email } });
      
      // Verify token was cleared
      expect(updatedUser.resetPasswordToken).to.be.null;
      expect(updatedUser.resetPasswordExpires).to.be.null;
      
      // Verify password was changed
      const passwordValid = await bcrypt.compare(newPassword, updatedUser.password);
      expect(passwordValid).to.be.true;
      
      logger.info('Password reset successful', {
        userId: updatedUser.id
      });
    });
    
    it('should send a password changed confirmation email', function() {
      // Verify sendMail was called again
      expect(sendMailStub.calledTwice).to.be.true;
      
      // Get the last call arguments
      const lastCall = sendMailStub.lastCall;
      
      if (lastCall) {
        const mailOptions = lastCall.args[0];
        
        // Verify email content
        expect(mailOptions.to).to.equal(testUser.email);
        expect(mailOptions.subject).to.include('Password');
        expect(mailOptions.subject).to.include('Changed');
        
        if (mailOptions.html) {
          expect(mailOptions.html).to.include('changed');
        }
        
        if (mailOptions.text) {
          expect(mailOptions.text).to.include('changed');
        }
        
        logger.info('Password changed email verified', {
          to: mailOptions.to,
          subject: mailOptions.subject
        });
      }
    });
  });
  
  describe('Authentication with New Password', function() {
    it('should authenticate with the new password', async function() {
      const newPassword = 'NewPassword456!';
      
      // Authenticate with new password
      const authResult = await AuthService.authenticateUser({
        email: testUser.email,
        password: newPassword
      }, { ip: '127.0.0.1' });
      
      // Verify authentication succeeded
      expect(authResult).to.be.an('object');
      expect(authResult.user).to.be.an('object');
      expect(authResult.user.email).to.equal(testUser.email);
      expect(authResult.accessToken).to.be.a('string');
      expect(authResult.refreshToken).to.be.a('string');
      
      logger.info('Authentication with new password successful', {
        userId: authResult.user.id
      });
    });
    
    it('should fail authentication with the old password', async function() {
      try {
        // Attempt to authenticate with old password
        await AuthService.authenticateUser({
          email: testUser.email,
          password: testUser.password
        }, { ip: '127.0.0.1' });
        
        // Should not reach here
        expect.fail('Authentication should have failed with old password');
      } catch (error) {
        // Verify error
        expect(error).to.be.an('error');
        expect(error.message).to.include('Invalid credentials');
        
        logger.info('Authentication with old password failed as expected');
      }
    });
  });
});
