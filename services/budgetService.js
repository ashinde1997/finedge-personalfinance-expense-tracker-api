// budget service - create, read, delete budgets for users
const { readData, writeData } = require('../utils/fileStore');
const { createBudget } = require('../models/budgetModel');
const { NotFoundError, ValidationError, ForbiddenError } = require('../utils/errors');

// set a budget - if one already exists for that month/year, update it
const setBudget = async ({ userId, month, year, monthlyGoal, savingsTarget, categories }) => {
  if (!month || !year || !monthlyGoal) {
    throw new ValidationError('Month, year, and monthlyGoal are required');
  }
  if (month < 1 || month > 12) throw new ValidationError('Month must be between 1 and 12');
  if (monthlyGoal <= 0) throw new ValidationError('Monthly goal must be a positive number');

  const budgets = await readData('budgets');
  const existingIndex = budgets.findIndex(
    (b) => b.userId === userId && b.month === parseInt(month) && b.year === parseInt(year)
  );

  if (existingIndex !== -1) {
    // already have one for this month, just update it
    budgets[existingIndex] = {
      ...budgets[existingIndex],
      monthlyGoal: parseFloat(monthlyGoal),
      savingsTarget: parseFloat(savingsTarget || 0),
      categories: categories || budgets[existingIndex].categories,
      updatedAt: new Date().toISOString(),
    };
    await writeData('budgets', budgets);
    return budgets[existingIndex];
  }

  // create a new one
  const newBudget = createBudget({ userId, month, year, monthlyGoal, savingsTarget, categories });
  budgets.push(newBudget);
  await writeData('budgets', budgets);
  return newBudget;
};

// fetch budget for a specific month + year
const getBudget = async (userId, month, year) => {
  const budgets = await readData('budgets');
  const budget = budgets.find(
    (b) => b.userId === userId && b.month === parseInt(month) && b.year === parseInt(year)
  );
  if (!budget) throw new NotFoundError('Budget');
  return budget;
};

// get all budgets for this user
const getAllBudgets = async (userId) => {
  const budgets = await readData('budgets');
  return budgets.filter((b) => b.userId === userId);
};

// delete a budget by id - check ownership first
const deleteBudget = async (budgetId, userId) => {
  const budgets = await readData('budgets');
  const index = budgets.findIndex((b) => b.id === budgetId);
  if (index === -1) throw new NotFoundError('Budget');
  if (budgets[index].userId !== userId) throw new ForbiddenError('Access denied to this budget');

  const [deleted] = budgets.splice(index, 1);
  await writeData('budgets', budgets);
  return deleted;
};

module.exports = { setBudget, getBudget, getAllBudgets, deleteBudget };
