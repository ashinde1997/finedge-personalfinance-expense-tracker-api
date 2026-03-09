// transaction model - defines the shape of a transaction and category/type constants
const { randomUUID } = require('crypto');

// all valid categories a transaction can have
const CATEGORIES = [
  'food',
  'transport',
  'entertainment',
  'shopping',
  'utilities',
  'healthcare',
  'education',
  'salary',
  'freelance',
  'investment',
  'rent',
  'other',
];

const TYPES = ['income', 'expense'];

// i map keywords to categories so we can guess from description
const CATEGORY_KEYWORDS = {
  food: ['food', 'restaurant', 'grocery', 'meal', 'lunch', 'dinner', 'breakfast', 'cafe', 'zomato', 'swiggy', 'pizza', 'burger', 'snack'],
  transport: ['uber', 'ola', 'cab', 'taxi', 'bus', 'metro', 'train', 'fuel', 'petrol', 'diesel', 'parking', 'transport', 'travel', 'flight', 'auto'],
  entertainment: ['netflix', 'amazon prime', 'hotstar', 'movie', 'cinema', 'concert', 'games', 'spotify', 'music', 'entertainment'],
  shopping: ['amazon', 'flipkart', 'myntra', 'shopping', 'clothes', 'fashion', 'shoes', 'accessories', 'mall'],
  utilities: ['electricity', 'water', 'gas', 'internet', 'wifi', 'broadband', 'mobile', 'phone', 'recharge', 'bill', 'utility'],
  healthcare: ['doctor', 'hospital', 'medicine', 'pharmacy', 'medical', 'health', 'clinic', 'chemist', 'lab', 'test'],
  education: ['school', 'college', 'course', 'book', 'tuition', 'fee', 'education', 'udemy', 'coursera', 'class'],
  salary: ['salary', 'wage', 'payroll', 'stipend'],
  freelance: ['freelance', 'project', 'client', 'gig', 'consulting'],
  investment: ['stock', 'mutual fund', 'sip', 'dividend', 'returns', 'investment', 'bond', 'crypto'],
  rent: ['rent', 'lease', 'landlord', 'pg', 'hostel'],
};

// scan the description for keywords to pick a category automatically
const autoDetectCategory = (description, type) => {
  if (!description) return type === 'income' ? 'salary' : 'other';
  const lower = description.toLowerCase();

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some((kw) => lower.includes(kw))) {
      return category;
    }
  }
  // fallback
  return type === 'income' ? 'salary' : 'other';
};

// builds a new transaction object with a random id and timestamps
const createTransaction = ({ userId, type, category, amount, description, date }) => ({
  id: randomUUID(),
  userId,
  type,
  category,
  amount: parseFloat(amount),
  description: description || '',
  date: date || new Date().toISOString(),
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

module.exports = { createTransaction, autoDetectCategory, CATEGORIES, TYPES };

