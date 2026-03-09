const { AppError } = require('../utils/errors');

// central error handler - all errors end up here via next(err)
const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Something went wrong';
  let status = err.status || 'error';

  // handle jwt specific errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    status = 'fail';
    message = 'Invalid token. Please log in again.';
  }
  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    status = 'fail';
    message = 'Token has expired. Please log in again.';
  }

  // bad json body
  if (err.type === 'entity.parse.failed') {
    statusCode = 400;
    status = 'fail';
    message = 'Invalid JSON in request body';
  }

  const response = {
    status,
    message,
    // only show stack trace in development
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  };

  res.status(statusCode).json(response);
};

module.exports = errorHandler;

