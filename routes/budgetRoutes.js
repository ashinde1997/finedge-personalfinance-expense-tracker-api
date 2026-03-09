/**
 * Budget Routes
 */
const express = require('express');
const router = express.Router();
const budgetController = require('../controllers/budgetController');
const authenticate = require('../middleware/authenticate');

// budget routes - all need authentication
// lock everything behind auth
router.use(authenticate);

router.post('/', budgetController.setBudget);                         // POST /budgets
router.get('/', budgetController.getAllBudgets);                      // GET /budgets
router.get('/:month/:year', budgetController.getBudget);             // GET /budgets/:month/:year
router.delete('/:id', budgetController.deleteBudget);                // DELETE /budgets/:id

module.exports = router;
