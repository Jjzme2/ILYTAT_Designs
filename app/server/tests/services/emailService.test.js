/**
 * Email Service Tests
 * Tests the functionality of the email service
 */

const { expect } = require('chai');
const sinon = require('sinon');
const sgMail = require('@sendgrid/mail');
const EmailService = require('../../src/services/emailService');
const logger = require('../../src/utils/logger');

describe('Email Service', () => {
  let sendStub;
  let loggerStub;

  beforeEach(() => {
    // Stub SendGrid's send method
    sendStub = sinon.stub(sgMail, 'send').resolves([
      { statusCode: 202 },
      { headers: {}, body: {} }
    ]);

    // Stub logger to prevent console output during tests
    loggerStub = {
      info: sinon.stub(logger, 'info'),
      debug: sinon.stub(logger, 'debug'),
      error: sinon.stub(logger, 'error'),
      response: {
        business: sinon.stub().returns({
          withSecurityDetails: sinon.stub().returnsThis(),
          withPerformanceMetrics: sinon.stub().returnsThis(),
          log: sinon.stub().returnsThis()
        })
      }
    };

    // Set mock API key for testing
    process.env.SENDGRID_API_KEY = 'test-api-key';
    process.env.CLIENT_URL = 'http://localhost:5173';
    process.env.EMAIL_FROM = 'test@example.com';
  });

  afterEach(() => {
    // Restore all stubs
    sinon.restore();
    
    // Reset environment variables
    delete process.env.SENDGRID_API_KEY;
    delete process.env.CLIENT_URL;
    delete process.env.EMAIL_FROM;
    delete process.env.SENDGRID_VERIFICATION_TEMPLATE_ID;
  });

  describe('sendEmail()', () => {
    it('should send an email with the provided options', async () => {
      const options = {
        to: 'recipient@example.com',
        subject: 'Test Email',
        html: '<p>Test content</p>',
        text: 'Test content'
      };

      await EmailService.sendEmail(options);

      expect(sendStub.calledOnce).to.be.true;
      const sentMessage = sendStub.firstCall.args[0];
      expect(sentMessage.to).to.equal(options.to);
      expect(sentMessage.subject).to.equal(options.subject);
      expect(sentMessage.html).to.equal(options.html);
    });

    it('should throw an error if recipient email is missing', async () => {
      const options = {
        subject: 'Test Email',
        html: '<p>Test content</p>'
      };

      try {
        await EmailService.sendEmail(options);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).to.include('Recipient email is required');
      }
    });

    it('should use template ID when provided', async () => {
      const options = {
        to: 'recipient@example.com',
        templateId: 'd-test-template-id',
        dynamicTemplateData: { name: 'Test User' }
      };

      await EmailService.sendEmail(options);

      expect(sendStub.calledOnce).to.be.true;
      const sentMessage = sendStub.firstCall.args[0];
      expect(sentMessage.templateId).to.equal(options.templateId);
      expect(sentMessage.dynamicTemplateData).to.deep.equal(options.dynamicTemplateData);
    });

    it('should simulate sending in development mode when API key is not set', async () => {
      // Remove API key to simulate development environment
      delete process.env.SENDGRID_API_KEY;
      
      const options = {
        to: 'recipient@example.com',
        subject: 'Test Email',
        html: '<p>Test content</p>'
      };

      const result = await EmailService.sendEmail(options);

      // Should not call SendGrid in dev mode
      expect(sendStub.called).to.be.false;
      
      // Should log the simulated email
      expect(loggerStub.info.called).to.be.true;
      
      // Should return simulated response
      expect(result._simulated).to.be.true;
    });
  });

  describe('sendVerificationEmail()', () => {
    it('should send a verification email with the correct template if configured', async () => {
      // Set template ID for test
      process.env.SENDGRID_VERIFICATION_TEMPLATE_ID = 'd-verification-template';
      
      const user = { email: 'user@example.com', firstName: 'Test' };
      const verificationToken = 'test-verification-token';

      await EmailService.sendVerificationEmail(user, verificationToken);

      expect(sendStub.calledOnce).to.be.true;
      const sentMessage = sendStub.firstCall.args[0];
      expect(sentMessage.templateId).to.equal('d-verification-template');
      expect(sentMessage.to).to.equal(user.email);
      expect(sentMessage.dynamicTemplateData.first_name).to.equal(user.firstName);
      expect(sentMessage.dynamicTemplateData.verification_url).to.include(verificationToken);
    });

    it('should send a verification email with HTML content if no template is configured', async () => {
      const user = { email: 'user@example.com', firstName: 'Test' };
      const verificationToken = 'test-verification-token';

      await EmailService.sendVerificationEmail(user, verificationToken);

      expect(sendStub.calledOnce).to.be.true;
      const sentMessage = sendStub.firstCall.args[0];
      expect(sentMessage.to).to.equal(user.email);
      expect(sentMessage.subject).to.include('verify');
      expect(sentMessage.html).to.include(verificationToken);
      expect(sentMessage.text).to.include(verificationToken);
    });
  });

  describe('sendPasswordResetEmail()', () => {
    it('should send a password reset email with the correct content', async () => {
      const user = { email: 'user@example.com', firstName: 'Test' };
      const resetToken = 'test-reset-token';

      await EmailService.sendPasswordResetEmail(user, resetToken);

      expect(sendStub.calledOnce).to.be.true;
      const sentMessage = sendStub.firstCall.args[0];
      expect(sentMessage.to).to.equal(user.email);
      expect(sentMessage.subject).to.include('Reset');
      expect(sentMessage.html).to.include(resetToken);
      expect(sentMessage.categories).to.include('password-reset');
    });
  });

  describe('sendPasswordChangedEmail()', () => {
    it('should send a password changed confirmation email', async () => {
      const user = { email: 'user@example.com', firstName: 'Test' };

      await EmailService.sendPasswordChangedEmail(user);

      expect(sendStub.calledOnce).to.be.true;
      const sentMessage = sendStub.firstCall.args[0];
      expect(sentMessage.to).to.equal(user.email);
      expect(sentMessage.subject).to.include('Password');
      expect(sentMessage.subject).to.include('Changed');
      expect(sentMessage.categories).to.include('password-changed');
    });
  });

  describe('sendOrderConfirmationEmail()', () => {
    it('should send an order confirmation email with order details', async () => {
      const user = { email: 'user@example.com', firstName: 'Test' };
      const order = { 
        id: 'ORD-12345', 
        createdAt: new Date(), 
        total: 99.99,
        items: [{ name: 'Test Product', quantity: 1, price: 99.99 }],
        shippingAddress: { street: '123 Test St', city: 'Test City', zip: '12345' }
      };

      await EmailService.sendOrderConfirmationEmail(user, order);

      expect(sendStub.calledOnce).to.be.true;
      const sentMessage = sendStub.firstCall.args[0];
      expect(sentMessage.to).to.equal(user.email);
      expect(sentMessage.subject).to.include('Order Confirmation');
      expect(sentMessage.subject).to.include(order.id);
      expect(sentMessage.html).to.include(order.total.toFixed(2));
      expect(sentMessage.categories).to.include('order-confirmation');
    });
  });
});
