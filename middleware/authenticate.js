const jwt = require('jsonwebtoken');
const { UnauthorizedError } = require('../utils/errors');

// checks if the request has a valid jwt token
// if yes, attaches user info to req.user
const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new UnauthorizedError('No token provided. Please log in.'));
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // has id, email, name
    next();
  } catch (err) {
    next(err);
  }
};

module.exports = authenticate;

