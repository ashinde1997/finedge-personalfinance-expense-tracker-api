// all the transaction endpoints live here
const transactionService = require('../services/transactionService');

// POST /transactions - add a new income or expense
const addTransaction = async (req, res, next) => {
  try {
    const { type, category, amount, description, date } = req.body;
    const transaction = await transactionService.addTransaction({
      userId: req.user.id,
      type,
      category,
      amount,
      description,
      date,
    });
    res.status(201).json({
      status: 'success',
      message: 'Transaction added successfully',
      data: { transaction },
    });
  } catch (err) {
    next(err);
  }
};

// GET /transactions - list all your transactions, supports filters & pagination
const getTransactions = async (req, res, next) => {
  try {
    const { category, type, startDate, endDate, page, limit } = req.query;
    const result = await transactionService.getTransactions(req.user.id, {
      category,
      type,
      startDate,
      endDate,
      page,
      limit,
    });
    res.status(200).json({
      status: 'success',
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

// GET /transactions/:id - get one specific transaction
const getTransaction = async (req, res, next) => {
  try {
    const transaction = await transactionService.getTransactionById(req.params.id, req.user.id);
    res.status(200).json({
      status: 'success',
      data: { transaction },
    });
  } catch (err) {
    next(err);
  }
};

// PATCH /transactions/:id - update an existing transaction
const updateTransaction = async (req, res, next) => {
  try {
    const transaction = await transactionService.updateTransaction(
      req.params.id,
      req.user.id,
      req.body
    );
    res.status(200).json({
      status: 'success',
      message: 'Transaction updated successfully',
      data: { transaction },
    });
  } catch (err) {
    next(err);
  }
};

// DELETE /transactions/:id - remove a transaction
const deleteTransaction = async (req, res, next) => {
  try {
    const transaction = await transactionService.deleteTransaction(req.params.id, req.user.id);
    res.status(200).json({
      status: 'success',
      message: 'Transaction deleted successfully',
      data: { transaction },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  addTransaction,
  getTransactions,
  getTransaction,
  updateTransaction,
  deleteTransaction,
};
