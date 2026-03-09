/**
 * User Routes
 */
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authenticate = require('../middleware/authenticate');
const { authRateLimiter } = require('../middleware/rateLimiter');

// Public routes - anyone can hit these
router.post('/', authRateLimiter, userController.register);           // POST /users
router.post('/login', authRateLimiter, userController.login);         // POST /users/login

// Protected routes - need a valid token
router.get('/me', authenticate, userController.getProfile);           // GET /users/me
router.patch('/me/preferences', authenticate, userController.updatePreferences); // PATCH /users/me/preferences

module.exports = router;
