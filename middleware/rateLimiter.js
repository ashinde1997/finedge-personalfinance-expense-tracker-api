const rateLimit = require('express-rate-limit');

// skip rate limiting during tests so it doesn't block test requests
const skipInTest = () => process.env.NODE_ENV === 'test';

// general rate limiter for all routes
const rateLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX) || 100,
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipInTest,
  message: {
    status: 'fail',
    message: 'Too many requests from this IP. Please try again after 15 minutes.',
  },
  handler: (req, res, next, options) => {
    res.status(429).json(options.message);
  },
});

// stricter limiter just for login/register to prevent brute force
const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  skip: skipInTest,
  message: {
    status: 'fail',
    message: 'Too many authentication attempts. Please try again after 15 minutes.',
  },
});

module.exports = { rateLimiter, authRateLimiter };

