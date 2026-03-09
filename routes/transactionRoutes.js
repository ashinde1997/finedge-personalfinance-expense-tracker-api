/**
 * Transaction Routes
 */
const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transactionController');
const authenticate = require('../middleware/authenticate');
const { validateTransactionCreate, validateTransaction } = require('../middleware/validateTransaction');

// transaction routes - all protected, must be logged in

// every route here needs a valid token
router.use(authenticate);

router.post('/', validateTransactionCreate, transactionController.addTransaction);       // POST /transactions
router.get('/', transactionController.getTransactions);                                   // GET /transactions
router.get('/:id', transactionController.getTransaction);                                 // GET /transactions/:id
router.patch('/:id', validateTransaction, transactionController.updateTransaction);       // PATCH /transactions/:id
router.delete('/:id', transactionController.deleteTransaction);                           // DELETE /transactions/:id

module.exports = router;
