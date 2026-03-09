# 💰 FinEdge – Personal Finance & Expense Tracker API

FinEdge is a REST API for managing personal finances. You can track your income and expenses, set monthly budgets, and get a financial summary with smart saving tips. Built with Node.js + Express using a clean MVC structure, JWT authentication, file-based storage, and an in-memory cache.

---

## 📁 Project Structure

I went with an MVC layout — controllers handle requests, services hold the logic, and models just define the data shape.

```
├── app.js                       # Express app setup and all routes mounted here
├── server.js                    # Just starts the server
├── controllers/
│   ├── userController.js        # Register, login, profile
│   ├── transactionController.js # Add, list, update, delete transactions
│   ├── budgetController.js      # Set and manage budgets
│   └── analyticsController.js   # Summary + cache stats
├── routes/
│   ├── userRoutes.js
│   ├── transactionRoutes.js
│   ├── budgetRoutes.js
│   └── analyticsRoutes.js
├── services/
│   ├── userService.js           # All user business logic (hash, JWT etc.)
│   ├── transactionService.js    # CRUD + filters + cache invalidation
│   ├── budgetService.js         # Budget upsert logic
│   └── analyticsService.js      # Summary calculations + saving tips
├── models/
│   ├── userModel.js             # Builds user object with defaults
│   ├── transactionModel.js      # Transaction shape + auto-category logic
│   └── budgetModel.js           # Budget factory function
├── middleware/
│   ├── authenticate.js          # JWT verification
│   ├── errorHandler.js          # Global error handler (catches everything)
│   ├── logger.js                # Logs every request to console + file
│   ├── rateLimiter.js           # Rate limiting on auth routes
│   └── validateTransaction.js   # Body validation for transactions
├── utils/
│   ├── errors.js                # Custom error classes
│   ├── fileStore.js             # Read/write JSON files with fs/promises
│   └── cache.js                 # Simple in-memory cache with TTL
├── data/
│   ├── users.json
│   ├── transactions.json
│   ├── budgets.json
│   └── requests.log
├── tests/
│   ├── health.test.js
│   ├── users.test.js
│   ├── transactions.test.js
│   └── summary.test.js
├── .env
├── .gitignore
└── package.json
```

---

## 🚀 Getting Started

```bash
# install everything
npm install

# run in dev mode (auto-restarts on change)
npm run dev

# run normally
npm start

# run tests
npm test

# run tests with coverage report
npm run test:coverage
```

Make sure you have a `.env` file set up before running (see below).

---

## ⚙️ Environment Variables

Create a `.env` file in the root and add these:

```env
PORT=3000
JWT_SECRET=your_secret_key_here
JWT_EXPIRES_IN=7d
NODE_ENV=development
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
CACHE_TTL=60000
```

| Variable | Default | What it does |
|---|---|---|
| `PORT` | `3000` | Port the server listens on |
| `JWT_SECRET` | — | Secret used to sign JWT tokens |
| `JWT_EXPIRES_IN` | `7d` | How long tokens stay valid |
| `NODE_ENV` | `development` | Switches test/dev/prod behaviour |
| `RATE_LIMIT_WINDOW_MS` | `900000` | Rate limit window (15 minutes) |
| `RATE_LIMIT_MAX` | `100` | Max requests per window per IP |
| `CACHE_TTL` | `60000` | How long to cache the summary (60s) |

---

## 📡 API Endpoints

### Health Check
| Method | Route | Auth | Description |
|---|---|---|---|
| GET | `/health` | ❌ | Check if the server is running |

### Users
| Method | Route | Auth | Description |
|---|---|---|---|
| POST | `/users` | ❌ | Register a new account |
| POST | `/users/login` | ❌ | Login and get a JWT token |
| GET | `/users/me` | ✅ | Get your own profile |
| PATCH | `/users/me/preferences` | ✅ | Update preferences (currency, budget etc.) |

### Transactions
| Method | Route | Auth | Description |
|---|---|---|---|
| POST | `/transactions` | ✅ | Add a new income or expense |
| GET | `/transactions` | ✅ | Get all your transactions (supports filters) |
| GET | `/transactions/:id` | ✅ | Get one specific transaction |
| PATCH | `/transactions/:id` | ✅ | Edit a transaction |
| DELETE | `/transactions/:id` | ✅ | Delete a transaction |

**Filters you can use with `GET /transactions`:**
- `?type=income` or `?type=expense`
- `?category=food` (any valid category)
- `?startDate=2026-01-01`
- `?endDate=2026-03-31`
- `?page=1&limit=20` (pagination)

### Budgets
| Method | Route | Auth | Description |
|---|---|---|---|
| POST | `/budgets` | ✅ | Set a budget for a month (creates or updates) |
| GET | `/budgets` | ✅ | Get all your budgets |
| GET | `/budgets/:month/:year` | ✅ | Get budget for a specific month |
| DELETE | `/budgets/:id` | ✅ | Remove a budget |

### Analytics
| Method | Route | Auth | Description |
|---|---|---|---|
| GET | `/summary` | ✅ | Full financial summary (income, expenses, trends, tips) |
| GET | `/cache/stats` | ✅ | See what's currently in the cache |

---

## 🔐 How Auth Works

After logging in you get a JWT token. Pass it in the `Authorization` header for any protected route:

```
Authorization: Bearer <your_token_here>
```

The token contains your `id`, `email`, and `name`. It expires based on `JWT_EXPIRES_IN`.

---

## 📝 Example Requests & Responses

### Register
```json
POST /users
{
  "name": "Rahul Sharma",
  "email": "rahul@example.com",
  "password": "secure123",
  "preferences": {
    "currency": "INR",
    "monthlyBudget": 30000,
    "savingsTarget": 10000
  }
}
```

### Add a Transaction
```json
POST /transactions
Authorization: Bearer <token>
{
  "type": "expense",
  "amount": 500,
  "description": "Zomato order"
}
// no category needed — it auto-detects "food" from the description
```

### Set a Budget
```json
POST /budgets
Authorization: Bearer <token>
{
  "month": 3,
  "year": 2026,
  "monthlyGoal": 30000,
  "savingsTarget": 10000,
  "categories": {
    "food": 8000,
    "transport": 3000,
    "entertainment": 2000
  }
}
```

### Summary Response
```json
GET /summary
{
  "overview": {
    "totalIncome": 60000,
    "totalExpense": 17000,
    "balance": 43000,
    "transactionCount": 4
  },
  "categoryBreakdown": {
    "food": { "income": 0, "expense": 5000 },
    "rent": { "income": 0, "expense": 10000 }
  },
  "monthlyTrends": {
    "2026-03": { "income": 60000, "expense": 17000, "balance": 43000 }
  },
  "budgetStatus": {
    "monthlyGoal": 30000,
    "spent": 17000,
    "remaining": 13000,
    "percentUsed": "56.67",
    "onTrack": true
  },
  "savingTips": [
    "✅ Great job! You are saving over 20% of your income. Keep it up!",
    "📊 Suggested budget (50/30/20 rule): Needs ₹30000, Wants ₹18000, Savings ₹12000"
  ],
  "fromCache": false
}
```

> Second call to `/summary` returns `"fromCache": true` — results are cached for 60 seconds by default.

---

## 🏷️ Valid Transaction Categories

```
food, transport, entertainment, shopping, utilities,
healthcare, education, salary, freelance, investment, rent, other
```

---

## 🤖 Auto-Category Detection

If you don't pass a `category` when adding a transaction, the API tries to figure it out from the description using keyword matching. For example:

| Description | Detected Category |
|---|---|
| "Uber ride to office" | `transport` |
| "Zomato order" | `food` |
| "Netflix subscription" | `entertainment` |
| "Electricity bill" | `utilities` |
| "Monthly salary" | `salary` |

---

## ✅ Features Checklist

### Fundamentals
- [x] `npm init` project setup with `package.json`
- [x] MVC folder structure (controllers, services, models, routes, middleware, utils)
- [x] `/health` endpoint

### REST API
- [x] Full CRUD for transactions
- [x] User registration and JWT login
- [x] Budget management (set, get, delete)
- [x] `/summary` analytics endpoint

### Async & Middleware
- [x] All file I/O uses `async/await` with `fs/promises`
- [x] Global error-handling middleware
- [x] Custom request logger (logs to console and `data/requests.log`)
- [x] Input validation middleware for transactions

### Advanced Node
- [x] Modular route files
- [x] Separate service layer for business logic
- [x] `.env` config with `dotenv`
- [x] Custom error classes (`AppError`, `NotFoundError`, `ValidationError`, etc.)
- [x] Jest + Supertest for testing (36 tests, all passing)

### Bonus Features
- [x] **Analytics** — income/expense totals, balance, monthly trends, category breakdown
- [x] **Auto-categorization** — keyword matching on transaction descriptions
- [x] **Saving tips** — based on actual spending patterns (savings rate, food %, etc.)
- [x] **50/30/20 rule** — auto-suggested budget based on income
- [x] **In-memory cache with TTL** — `/summary` results cached for 60s
- [x] **Rate limiting** — on `/users` and `/users/login`
- [x] **CORS** support

---

## 🧪 Tests

```bash
npm test
```

All 36 tests pass across 4 test suites:

| File | What it tests |
|---|---|
| `health.test.js` | Health check + 404 handler |
| `users.test.js` | Register, login, profile endpoints |
| `transactions.test.js` | Full CRUD + filters + auth |
| `summary.test.js` | Analytics, caching, saving tips |

Tests use `supertest` to hit the actual Express app and `jest` for assertions. Test data is wiped before/after each suite so tests don't interfere with each other.
