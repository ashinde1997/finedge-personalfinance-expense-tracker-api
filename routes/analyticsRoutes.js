// analytics routes
const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const authenticate = require('../middleware/authenticate');

router.get('/summary', authenticate, analyticsController.getSummary);        // GET /summary
router.get('/cache/stats', authenticate, analyticsController.getCacheStats); // GET /cache/stats

module.exports = router;
