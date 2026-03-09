// analytics service - builds the full financial summary for a user
// results are cached so we don't recompute on every request
const { readData } = require('../utils/fileStore');
const cache = require('../utils/cache');
const { SUMMARY_CACHE_KEY } = require('./transactionService');

const CACHE_TTL = parseInt(process.env.CACHE_TTL) || 60000; // 60 seconds by default

// main summary function - income, expenses, trends, tips, budget status
const getSummary = async (userId) => {
  const cacheKey = SUMMARY_CACHE_KEY + userId;
  const cached = cache.get(cacheKey);
  if (cached) {
    return { ...cached, fromCache: true };
  }

  // load transactions and budgets at the same time
  const [transactions, budgets] = await Promise.all([
    readData('transactions'),
    readData('budgets'),
  ]);

  const userTransactions = transactions.filter((t) => t.userId === userId);

  const totalIncome = userTransactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = userTransactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const balance = totalIncome - totalExpense;

  // breakdown by category
  const categoryBreakdown = {};
  userTransactions.forEach((t) => {
    if (!categoryBreakdown[t.category]) {
      categoryBreakdown[t.category] = { income: 0, expense: 0 };
    }
    categoryBreakdown[t.category][t.type] += t.amount;
  });

  // monthly totals
  const monthlyTrends = {};
  userTransactions.forEach((t) => {
    const d = new Date(t.date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    if (!monthlyTrends[key]) monthlyTrends[key] = { income: 0, expense: 0, balance: 0 };
    monthlyTrends[key][t.type] += t.amount;
    monthlyTrends[key].balance = monthlyTrends[key].income - monthlyTrends[key].expense;
  });

  // check if user has a budget for the current month
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();
  const currentBudget = budgets.find(
    (b) => b.userId === userId && b.month === currentMonth && b.year === currentYear
  );

  const currentMonthKey = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;
  const currentMonthData = monthlyTrends[currentMonthKey] || { income: 0, expense: 0, balance: 0 };

  const budgetStatus = currentBudget
    ? {
        monthlyGoal: currentBudget.monthlyGoal,
        savingsTarget: currentBudget.savingsTarget,
        spent: currentMonthData.expense,
        remaining: currentBudget.monthlyGoal - currentMonthData.expense,
        percentUsed: currentBudget.monthlyGoal > 0
          ? ((currentMonthData.expense / currentBudget.monthlyGoal) * 100).toFixed(2)
          : 0,
        onTrack: currentMonthData.expense <= currentBudget.monthlyGoal,
      }
    : null;

  // generate some tips based on spending habits
  const savingTips = generateSavingTips(categoryBreakdown, totalIncome, totalExpense, currentBudget);

  const summary = {
    overview: {
      totalIncome: parseFloat(totalIncome.toFixed(2)),
      totalExpense: parseFloat(totalExpense.toFixed(2)),
      balance: parseFloat(balance.toFixed(2)),
      transactionCount: userTransactions.length,
    },
    categoryBreakdown,
    monthlyTrends: Object.entries(monthlyTrends)
      .sort(([a], [b]) => a.localeCompare(b))
      .reduce((obj, [k, v]) => ({ ...obj, [k]: v }), {}),
    budgetStatus,
    savingTips,
    generatedAt: new Date().toISOString(),
    fromCache: false,
  };

  cache.set(cacheKey, summary, CACHE_TTL);
  return summary;
};

// gives some basic tips based on how the user is spending
const generateSavingTips = (categoryBreakdown, totalIncome, totalExpense, budget) => {
  const tips = [];
  const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpense) / totalIncome) * 100 : 0;

  if (savingsRate < 10) {
    tips.push('⚠️ Your savings rate is below 10%. Aim to save at least 20% of your income.');
  } else if (savingsRate >= 20) {
    tips.push('✅ Great job! You are saving over 20% of your income. Keep it up!');
  }

  // food spending check
  const foodExpense = categoryBreakdown.food?.expense || 0;
  if (totalIncome > 0 && (foodExpense / totalIncome) > 0.3) {
    tips.push('🍽️ Food expenses are above 30% of your income. Consider meal prepping to reduce costs.');
  }

  // entertainment check
  const entExpense = categoryBreakdown.entertainment?.expense || 0;
  if (totalIncome > 0 && (entExpense / totalIncome) > 0.1) {
    tips.push('🎬 Entertainment costs are high (>10% of income). Review your subscriptions.');
  }

  // shopping check
  const shopExpense = categoryBreakdown.shopping?.expense || 0;
  if (totalIncome > 0 && (shopExpense / totalIncome) > 0.15) {
    tips.push('🛍️ Shopping is consuming >15% of income. Try a 30-day waiting rule before big purchases.');
  }

  // over budget warning
  if (budget && totalExpense > budget.monthlyGoal) {
    tips.push(`🚨 You have exceeded your monthly budget of ₹${budget.monthlyGoal}. Review your expenses immediately.`);
  }

  if (tips.length === 0) {
    tips.push('💡 Keep tracking your expenses consistently for better financial insights.');
  }

  // 50/30/20 suggestion if we know income
  if (totalIncome > 0) {
    tips.push(`📊 Suggested budget (50/30/20 rule): Needs ₹${(totalIncome * 0.5).toFixed(0)}, Wants ₹${(totalIncome * 0.3).toFixed(0)}, Savings ₹${(totalIncome * 0.2).toFixed(0)}`);
  }

  return tips;
};

module.exports = { getSummary };
