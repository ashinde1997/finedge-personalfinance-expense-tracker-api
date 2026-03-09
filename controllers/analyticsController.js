// analytics controller - summary endpoint + a handy cache stats route
const analyticsService = require('../services/analyticsService');
const cache = require('../utils/cache');

// GET /summary - returns income/expense breakdown, trends, tips etc.
// results are cached so repeated calls are fast
const getSummary = async (req, res, next) => {
  try {
    const summary = await analyticsService.getSummary(req.user.id);
    res.status(200).json({
      status: 'success',
      data: summary,
    });
  } catch (err) {
    next(err);
  }
};

// GET /cache/stats - just for debugging, shows what's in the cache
const getCacheStats = (req, res) => {
  res.status(200).json({
    status: 'success',
    data: cache.stats(),
  });
};

module.exports = { getSummary, getCacheStats };
