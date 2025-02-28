const express = require('express')
const { validateRegistration, validateLogin } = require('../../middleware/validation')
const { authenticateToken } = require('../../middleware/auth')
const AuthService = require('../../services/authService')
const { User } = require('../../models')
const logger = require('../../utils/logger')

const router = express.Router()

/**
 * @route POST /api/auth/register
 * @desc Register a new user
 * @access Public
 */
router.post('/register', validateRegistration, async (req, res) => {
  try {
    const result = await AuthService.registerUser(req.body, req)
    res.status(201).json({
      success: true,
      data: result,
      message: 'Registration successful'
    })
  } catch (error) {
    logger.error('Registration error:', {
      error,
      userData: { ...req.body, password: '[REDACTED]' }
    })

    res.status(error.status || 500).json({
      success: false,
      error: error.message,
      validationErrors: error.validationErrors
    })
  }
})

/**
 * @route POST /api/auth/login
 * @desc Authenticate user & get token
 * @access Public
 */
router.post('/login', validateLogin, async (req, res) => {
  try {
    const result = await AuthService.authenticateUser(req.body, req)
    res.json({
      success: true,
      data: result,
      message: 'Login successful'
    })
  } catch (error) {
    logger.error('Login error:', {
      error,
      email: req.body.email
    })

    res.status(error.status || 500).json({
      success: false,
      error: error.message,
      validationErrors: error.validationErrors
    })
  }
})

/**
 * @route GET /api/auth/me
 * @desc Get current user
 * @access Private
 */
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: ['id', 'firstName', 'lastName', 'email', 'role']
    })

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      })
    }

    res.json({
      success: true,
      data: user,
      message: 'User profile fetched successfully'
    })
  } catch (error) {
    logger.error('Profile retrieval error:', {
      error,
      userId: req.user.id
    })

    res.status(error.status || 500).json({
      success: false,
      error: error.message
    })
  }
})

/**
 * @route POST /api/auth/logout
 * @desc Logout user and invalidate session
 * @access Private
 */
router.post('/logout', authenticateToken, async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1]
    await AuthService.logoutUser(token, req.user.email)
    res.json({
      success: true,
      message: 'Successfully logged out'
    })
  } catch (error) {
    logger.error('Logout error:', {
      error,
      userId: req.user.id
    })

    res.status(error.status || 500).json({
      success: false,
      error: error.message
    })
  }
})

/**
 * @route POST /api/auth/logout-all
 * @desc Logout from all devices
 * @access Private
 */
router.post('/logout-all', authenticateToken, async (req, res) => {
  try {
    await AuthService.logoutAllDevices(req.user.id, req.user.email)
    res.json({
      success: true,
      message: 'Successfully logged out from all devices'
    })
  } catch (error) {
    logger.error('Logout error:', {
      error,
      userId: req.user.id
    })

    res.status(error.status || 500).json({
      success: false,
      error: error.message
    })
  }
})

module.exports = router
