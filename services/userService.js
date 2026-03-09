// user service - all the business logic for accounts
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { readData, writeData } = require('../utils/fileStore');
const { createUser } = require('../models/userModel');
const { ConflictError, NotFoundError, UnauthorizedError, ValidationError } = require('../utils/errors');

const SALT_ROUNDS = 10;

// register a new user - hash password, save to file
const registerUser = async ({ name, email, password, preferences }) => {
  if (!name || !email || !password) {
    throw new ValidationError('Name, email, and password are required');
  }

  const users = await readData('users');
  const exists = users.find((u) => u.email === email.toLowerCase().trim());
  if (exists) throw new ConflictError('User with this email already exists');

  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
  const newUser = createUser({ name, email, password: hashedPassword, preferences });
  users.push(newUser);
  await writeData('users', users);

  // don't return the password field
  const { password: _, ...userWithoutPassword } = newUser;
  return userWithoutPassword;
};

// login - check credentials and hand back a JWT
const loginUser = async ({ email, password }) => {
  if (!email || !password) throw new ValidationError('Email and password are required');

  const users = await readData('users');
  const user = users.find((u) => u.email === email.toLowerCase().trim());
  if (!user) throw new UnauthorizedError('Invalid email or password');

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) throw new UnauthorizedError('Invalid email or password');

  const token = jwt.sign(
    { id: user.id, email: user.email, name: user.name },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

  const { password: _, ...userWithoutPassword } = user;
  return { token, user: userWithoutPassword };
};

// get user by id - used when checking /users/me
const getUserById = async (userId) => {
  const users = await readData('users');
  const user = users.find((u) => u.id === userId);
  if (!user) throw new NotFoundError('User');

  const { password: _, ...userWithoutPassword } = user;
  return userWithoutPassword;
};

// update preferences like currency or theme
const updateUserPreferences = async (userId, preferences) => {
  const users = await readData('users');
  const index = users.findIndex((u) => u.id === userId);
  if (index === -1) throw new NotFoundError('User');

  users[index].preferences = { ...users[index].preferences, ...preferences };
  users[index].updatedAt = new Date().toISOString();
  await writeData('users', users);

  const { password: _, ...userWithoutPassword } = users[index];
  return userWithoutPassword;
};

module.exports = { registerUser, loginUser, getUserById, updateUserPreferences };
