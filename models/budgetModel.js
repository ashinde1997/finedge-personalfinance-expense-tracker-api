// budget model - just a factory function to build budget objects
const { randomUUID } = require('crypto');

const createBudget = ({ userId, month, year, monthlyGoal, savingsTarget, categories = {} }) => ({
  id: randomUUID(),
  userId,
  month: parseInt(month),
  year: parseInt(year),
  monthlyGoal: parseFloat(monthlyGoal),
  savingsTarget: parseFloat(savingsTarget || 0),
  categories, // optional per-category limits like { food: 5000, transport: 2000 }
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

module.exports = { createBudget };
