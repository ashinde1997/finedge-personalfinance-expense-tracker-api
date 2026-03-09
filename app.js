require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const logger = require('./middleware/logger');
const errorHandler = require('./middleware/errorHandler');
const { rateLimiter } = require('./middleware/rateLimiter');

const userRoutes = require('./routes/userRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const budgetRoutes = require('./routes/budgetRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');

const app = express();

// basic middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));
app.use(logger);
app.use(rateLimiter);

// health check route - just to confirm server is running
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'FinEdge API is running',
    timestamp: new Date().toISOString(),
    uptime: `${Math.floor(process.uptime())}s`,
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0',
  });
});

// all routes
app.use('/users', userRoutes);
app.use('/transactions', transactionRoutes);
app.use('/budgets', budgetRoutes);
app.use('/', analyticsRoutes);

// if no route matched
app.use((req, res) => {
  res.status(404).json({
    status: 'fail',
    message: `Route ${req.method} ${req.originalUrl} not found`,
  });
});

// global error handler - handles everything thrown from controllers
app.use(errorHandler);

module.exports = app;

