// routes.js
const {
  validateRegistration,
  validateLogin,
  validatePasswordReset,
  validateForgotPassword
} = require('../../middleware/validation');
const {
  authenticateToken
} = require('../../middleware/auth');
const AuthController = require('../../controllers/AuthController');

const ROUTES = {
  REGISTER: '/register',
  LOGIN: '/login',
  ME: '/me',
  LOGOUT: '/logout',
  LOGOUT_ALL: '/logout-all',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',
  RESEND_VERIFICATION: '/resend-verification'
};

const authRoutes = (router) => {
  router.post(ROUTES.REGISTER, validateRegistration, AuthController.register);
  router.post(ROUTES.LOGIN, validateLogin, AuthController.login);
  router.get(ROUTES.ME, authenticateToken, AuthController.getCurrentUser);
  router.post(ROUTES.LOGOUT, authenticateToken, AuthController.logout);
  router.post(ROUTES.LOGOUT_ALL, authenticateToken, AuthController.logoutAllDevices);
  router.post(ROUTES.FORGOT_PASSWORD, validateForgotPassword, AuthController.forgotPassword);
  router.post(ROUTES.RESET_PASSWORD, validatePasswordReset, AuthController.resetPassword);
  router.post(ROUTES.RESEND_VERIFICATION, AuthController.resendVerification);
};

module.exports = authRoutes;