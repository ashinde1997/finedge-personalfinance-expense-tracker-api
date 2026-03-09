// tests for all transaction endpoints
const request = require('supertest');
const app = require('../app');
const { writeData } = require('../utils/fileStore');

let token;
let userId;

const testUser = {
  name: 'Txn Tester',
  email: 'txntest@finedge.com',
  password: 'password123',
};

beforeAll(async () => {
  await writeData('users', []);
  await writeData('transactions', []);

  // sign up and log in so we have a token
  const regRes = await request(app).post('/users').send(testUser);
  userId = regRes.body.data.user.id;

  const loginRes = await request(app)
    .post('/users/login')
    .send({ email: testUser.email, password: testUser.password });
  token = loginRes.body.data.token;
});

afterAll(async () => {
  await writeData('users', []);
  await writeData('transactions', []);
});

// helper to avoid repeating the auth header everywhere
const authHeader = () => ({ Authorization: `Bearer ${token}` });

describe('POST /transactions – Add Transaction', () => {
  it('should create an expense transaction', async () => {
    const res = await request(app)
      .post('/transactions')
      .set(authHeader())
      .send({ type: 'expense', amount: 500, category: 'food', description: 'Zomato order' });

    expect(res.statusCode).toBe(201);
    expect(res.body.status).toBe('success');
    expect(res.body.data.transaction).toHaveProperty('id');
    expect(res.body.data.transaction.type).toBe('expense');
    expect(res.body.data.transaction.amount).toBe(500);
    expect(res.body.data.transaction.category).toBe('food');
  });

  it('should create an income transaction', async () => {
    const res = await request(app)
      .post('/transactions')
      .set(authHeader())
      .send({ type: 'income', amount: 50000, category: 'salary', description: 'Monthly salary' });

    expect(res.statusCode).toBe(201);
    expect(res.body.data.transaction.type).toBe('income');
  });

  it('should auto-detect category from description', async () => {
    const res = await request(app)
      .post('/transactions')
      .set(authHeader())
      .send({ type: 'expense', amount: 200, description: 'Uber ride to office' });

    expect(res.statusCode).toBe(201);
    expect(res.body.data.transaction.category).toBe('transport');
  });

  it('should reject transaction with invalid type', async () => {
    const res = await request(app)
      .post('/transactions')
      .set(authHeader())
      .send({ type: 'invalid', amount: 100 });

    expect(res.statusCode).toBe(400);
    expect(res.body.status).toBe('fail');
  });

  it('should reject transaction with negative amount', async () => {
    const res = await request(app)
      .post('/transactions')
      .set(authHeader())
      .send({ type: 'expense', amount: -100, category: 'food' });

    expect(res.statusCode).toBe(400);
  });

  it('should reject unauthenticated requests', async () => {
    const res = await request(app)
      .post('/transactions')
      .send({ type: 'expense', amount: 100 });

    expect(res.statusCode).toBe(401);
  });
});

describe('GET /transactions – Fetch All', () => {
  it('should return paginated transactions', async () => {
    const res = await request(app)
      .get('/transactions')
      .set(authHeader());

    expect(res.statusCode).toBe(200);
    expect(res.body.data).toHaveProperty('transactions');
    expect(res.body.data).toHaveProperty('pagination');
    expect(Array.isArray(res.body.data.transactions)).toBe(true);
  });

  it('should filter transactions by type', async () => {
    const res = await request(app)
      .get('/transactions?type=income')
      .set(authHeader());

    expect(res.statusCode).toBe(200);
    res.body.data.transactions.forEach((t) => {
      expect(t.type).toBe('income');
    });
  });

  it('should filter transactions by category', async () => {
    const res = await request(app)
      .get('/transactions?category=food')
      .set(authHeader());

    expect(res.statusCode).toBe(200);
    res.body.data.transactions.forEach((t) => {
      expect(t.category).toBe('food');
    });
  });
});

describe('GET /transactions/:id – Single Transaction', () => {
  let transactionId;

  beforeAll(async () => {
    const res = await request(app)
      .post('/transactions')
      .set(authHeader())
      .send({ type: 'expense', amount: 1200, category: 'shopping', description: 'Amazon order' });
    transactionId = res.body.data.transaction.id;
  });

  it('should return a specific transaction', async () => {
    const res = await request(app)
      .get(`/transactions/${transactionId}`)
      .set(authHeader());

    expect(res.statusCode).toBe(200);
    expect(res.body.data.transaction.id).toBe(transactionId);
  });

  it('should return 404 for non-existent transaction', async () => {
    const res = await request(app)
      .get('/transactions/nonexistent-id')
      .set(authHeader());

    expect(res.statusCode).toBe(404);
  });
});

describe('PATCH /transactions/:id – Update Transaction', () => {
  let transactionId;

  beforeAll(async () => {
    const res = await request(app)
      .post('/transactions')
      .set(authHeader())
      .send({ type: 'expense', amount: 300, category: 'utilities', description: 'Electricity bill' });
    transactionId = res.body.data.transaction.id;
  });

  it('should update a transaction', async () => {
    const res = await request(app)
      .patch(`/transactions/${transactionId}`)
      .set(authHeader())
      .send({ amount: 350, description: 'Updated electricity bill' });

    expect(res.statusCode).toBe(200);
    expect(res.body.data.transaction.amount).toBe(350);
    expect(res.body.data.transaction.description).toBe('Updated electricity bill');
  });

  it('should reject update with invalid category', async () => {
    const res = await request(app)
      .patch(`/transactions/${transactionId}`)
      .set(authHeader())
      .send({ category: 'invalidcat' });

    expect(res.statusCode).toBe(400);
  });
});

describe('DELETE /transactions/:id – Delete Transaction', () => {
  let transactionId;

  beforeAll(async () => {
    const res = await request(app)
      .post('/transactions')
      .set(authHeader())
      .send({ type: 'expense', amount: 100, category: 'food', description: 'to delete' });
    transactionId = res.body.data.transaction.id;
  });

  it('should delete a transaction', async () => {
    const res = await request(app)
      .delete(`/transactions/${transactionId}`)
      .set(authHeader());

    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('success');
  });

  it('should return 404 after deletion', async () => {
    const res = await request(app)
      .get(`/transactions/${transactionId}`)
      .set(authHeader());

    expect(res.statusCode).toBe(404);
  });
});
