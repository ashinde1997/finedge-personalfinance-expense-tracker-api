// budget controller - handles setting, fetching and deleting budgets
const budgetService = require('../services/budgetService');

// POST /budgets - set or update a monthly budget
const setBudget = async (req, res, next) => {
  try {
    const { month, year, monthlyGoal, savingsTarget, categories } = req.body;
    const budget = await budgetService.setBudget({
      userId: req.user.id,
      month,
      year,
      monthlyGoal,
      savingsTarget,
      categories,
    });
    res.status(201).json({
      status: 'success',
      message: 'Budget set successfully',
      data: { budget },
    });
  } catch (err) {
    next(err);
  }
};

// GET /budgets - list all budgets you've created
const getAllBudgets = async (req, res, next) => {
  try {
    const budgets = await budgetService.getAllBudgets(req.user.id);
    res.status(200).json({
      status: 'success',
      results: budgets.length,
      data: { budgets },
    });
  } catch (err) {
    next(err);
  }
};

// GET /budgets/:month/:year - get budget for a specific month
const getBudget = async (req, res, next) => {
  try {
    const { month, year } = req.params;
    const budget = await budgetService.getBudget(req.user.id, month, year);
    res.status(200).json({
      status: 'success',
      data: { budget },
    });
  } catch (err) {
    next(err);
  }
};

// DELETE /budgets/:id - delete a budget you no longer need
const deleteBudget = async (req, res, next) => {
  try {
    const budget = await budgetService.deleteBudget(req.params.id, req.user.id);
    res.status(200).json({
      status: 'success',
      message: 'Budget deleted successfully',
      data: { budget },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { setBudget, getAllBudgets, getBudget, deleteBudget };
