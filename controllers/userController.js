// handles all user-related requests - register, login, profile stuff
const userService = require('../services/userService');

// POST /users - create a new account
const register = async (req, res, next) => {
  try {
    const { name, email, password, preferences } = req.body;
    const user = await userService.registerUser({ name, email, password, preferences });
    res.status(201).json({
      status: 'success',
      message: 'User registered successfully',
      data: { user },
    });
  } catch (err) {
    next(err);
  }
};

// POST /users/login - log in and get a token back
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const result = await userService.loginUser({ email, password });
    res.status(200).json({
      status: 'success',
      message: 'Login successful',
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

// GET /users/me - see your own profile (token required)
const getProfile = async (req, res, next) => {
  try {
    const user = await userService.getUserById(req.user.id);
    res.status(200).json({
      status: 'success',
      data: { user },
    });
  } catch (err) {
    next(err);
  }
};

// PATCH /users/me/preferences - update things like currency, theme etc.
const updatePreferences = async (req, res, next) => {
  try {
    const user = await userService.updateUserPreferences(req.user.id, req.body);
    res.status(200).json({
      status: 'success',
      message: 'Preferences updated successfully',
      data: { user },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { register, login, getProfile, updatePreferences };
