/**
 * Transaction service - all the logic for adding, fetching, updating, deleting transactions
 */
const { readData, writeData } = require('../utils/fileStore');
const { createTransaction, autoDetectCategory, CATEGORIES, TYPES } = require('../models/transactionModel');
const { NotFoundError, ValidationError, ForbiddenError } = require('../utils/errors');
const cache = require('../utils/cache');

// cache key prefix for summary - used here and in analytics service
const SUMMARY_CACHE_KEY = 'summary_';

/**
 * Add a transaction for the logged in user
 */
const addTransaction = async ({ userId, type, category, amount, description, date }) => {
  if (!type || !amount) throw new ValidationError('Type and amount are required');
  if (!TYPES.includes(type)) throw new ValidationError(`Type must be one of: ${TYPES.join(', ')}`);
  if (amount <= 0) throw new ValidationError('Amount must be a positive number');

  // if category not given, try to guess it from the description
  const resolvedCategory = category
    ? CATEGORIES.includes(category)
      ? category
      : (() => { throw new ValidationError(`Category must be one of: ${CATEGORIES.join(', ')}`); })()
    : autoDetectCategory(description, type);

  const transactions = await readData('transactions');
  const newTransaction = createTransaction({ userId, type, category: resolvedCategory, amount, description, date });
  transactions.push(newTransaction);
  await writeData('transactions', transactions);

  // clear the cached summary so next call gives fresh data
  cache.invalidate(SUMMARY_CACHE_KEY + userId);

  return newTransaction;
};

/**
 * Get all transactions for a user with optional filters + pagination
 */
const getTransactions = async (userId, { category, type, startDate, endDate, page = 1, limit = 20 } = {}) => {
  const transactions = await readData('transactions');
  let filtered = transactions.filter((t) => t.userId === userId);

  if (category) filtered = filtered.filter((t) => t.category === category);
  if (type) filtered = filtered.filter((t) => t.type === type);
  if (startDate) filtered = filtered.filter((t) => new Date(t.date) >= new Date(startDate));
  if (endDate) filtered = filtered.filter((t) => new Date(t.date) <= new Date(endDate));

  // newest first
  filtered.sort((a, b) => new Date(b.date) - new Date(a.date));

  const total = filtered.length;
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const start = (pageNum - 1) * limitNum;
  const paginated = filtered.slice(start, start + limitNum);

  return {
    transactions: paginated,
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    },
  };
};

/**
 * Get one transaction by id - also checks ownership
 */
const getTransactionById = async (transactionId, userId) => {
  const transactions = await readData('transactions');
  const transaction = transactions.find((t) => t.id === transactionId);
  if (!transaction) throw new NotFoundError('Transaction');
  if (transaction.userId !== userId) throw new ForbiddenError('Access denied to this transaction');
  return transaction;
};

/**
 * Update fields of an existing transaction
 */
const updateTransaction = async (transactionId, userId, updates) => {
  const transactions = await readData('transactions');
  const index = transactions.findIndex((t) => t.id === transactionId);
  if (index === -1) throw new NotFoundError('Transaction');
  if (transactions[index].userId !== userId) throw new ForbiddenError('Access denied to this transaction');

  // only allow updating these fields
  const allowedUpdates = ['type', 'category', 'amount', 'description', 'date'];
  const filteredUpdates = {};

  for (const key of allowedUpdates) {
    if (updates[key] !== undefined) {
      filteredUpdates[key] = updates[key];
    }
  }

  if (filteredUpdates.type && !TYPES.includes(filteredUpdates.type)) {
    throw new ValidationError(`Type must be one of: ${TYPES.join(', ')}`);
  }
  if (filteredUpdates.category && !CATEGORIES.includes(filteredUpdates.category)) {
    throw new ValidationError(`Category must be one of: ${CATEGORIES.join(', ')}`);
  }
  if (filteredUpdates.amount !== undefined && filteredUpdates.amount <= 0) {
    throw new ValidationError('Amount must be a positive number');
  }

  transactions[index] = {
    ...transactions[index],
    ...filteredUpdates,
    amount: filteredUpdates.amount ? parseFloat(filteredUpdates.amount) : transactions[index].amount,
    updatedAt: new Date().toISOString(),
  };

  await writeData('transactions', transactions);
  cache.invalidate(SUMMARY_CACHE_KEY + userId);
  return transactions[index];
};

/**
 * Delete a transaction - only the owner can do this
 */
const deleteTransaction = async (transactionId, userId) => {
  const transactions = await readData('transactions');
  const index = transactions.findIndex((t) => t.id === transactionId);
  if (index === -1) throw new NotFoundError('Transaction');
  if (transactions[index].userId !== userId) throw new ForbiddenError('Access denied to this transaction');

  const [deleted] = transactions.splice(index, 1);
  await writeData('transactions', transactions);
  cache.invalidate(SUMMARY_CACHE_KEY + userId);
  return deleted;
};

module.exports = {
  addTransaction,
  getTransactions,
  getTransactionById,
  updateTransaction,
  deleteTransaction,
  SUMMARY_CACHE_KEY,
};
