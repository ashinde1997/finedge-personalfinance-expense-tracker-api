const { ValidationError } = require('../utils/errors');
const { CATEGORIES, TYPES } = require('../models/transactionModel');

// validates transaction fields - used for both create and update
const validateTransaction = (req, res, next) => {
  const { type, amount, category, date } = req.body;

  if (type !== undefined && !TYPES.includes(type)) {
    return next(new ValidationError(`Transaction type must be one of: ${TYPES.join(', ')}`));
  }

  if (amount !== undefined) {
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return next(new ValidationError('Amount must be a positive number'));
    }
  }

  if (category !== undefined && !CATEGORIES.includes(category)) {
    return next(new ValidationError(`Category must be one of: ${CATEGORIES.join(', ')}`));
  }

  if (date !== undefined) {
    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) {
      return next(new ValidationError('Date must be a valid ISO date string'));
    }
  }

  next();
};

// used only on POST /transactions - makes sure required fields are present
const validateTransactionCreate = (req, res, next) => {
  const { type, amount } = req.body;

  if (!type) return next(new ValidationError('Transaction type is required'));
  if (!amount) return next(new ValidationError('Transaction amount is required'));

  validateTransaction(req, res, next);
};

module.exports = { validateTransaction, validateTransactionCreate };


module.exports = { validateTransaction, validateTransactionCreate };
