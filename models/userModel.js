// user model - just builds a user object with defaults
const { randomUUID } = require('crypto');

const createUser = ({ name, email, password, preferences = {} }) => ({
  id: randomUUID(),
  name,
  email: email.toLowerCase().trim(),
  password, // gets hashed in the service before being passed here
  preferences: {
    currency: preferences.currency || 'INR',
    monthlyBudget: preferences.monthlyBudget || 0,
    savingsTarget: preferences.savingsTarget || 0,
  },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

module.exports = { createUser };

