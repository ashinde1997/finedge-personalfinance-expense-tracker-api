/**
 * Summary / Analytics Endpoint Tests
 */
const request = require('supertest');
const app = require('../app');
const { writeData } = require('../utils/fileStore');
const cache = require('../utils/cache');

let token;

const testUser = {
  name: 'Analytics Tester',
  email: 'analytics@finedge.com',
  password: 'password123',
};

beforeAll(async () => {
  await writeData('users', []);
  await writeData('transactions', []);
  cache.flush();

  await request(app).post('/users').send(testUser);
  const loginRes = await request(app)
    .post('/users/login')
    .send({ email: testUser.email, password: testUser.password });
  token = loginRes.body.data.token;

  // seed a few transactions so summary has real data
  const txns = [
    { type: 'income', amount: 60000, category: 'salary', description: 'Monthly salary' },
    { type: 'expense', amount: 5000, category: 'food', description: 'Groceries' },
    { type: 'expense', amount: 2000, category: 'transport', description: 'Uber rides' },
    { type: 'expense', amount: 10000, category: 'rent', description: 'Rent' },
  ];

  for (const txn of txns) {
    await request(app)
      .post('/transactions')
      .set('Authorization', `Bearer ${token}`)
      .send(txn);
  }
});

afterAll(async () => {
  await writeData('users', []);
  await writeData('transactions', []);
  cache.flush();
});

describe('GET /summary – Analytics', () => {
  it('should return a summary with correct totals', async () => {
    const res = await request(app)
      .get('/summary')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.data.overview.totalIncome).toBe(60000);
    expect(res.body.data.overview.totalExpense).toBe(17000);
    expect(res.body.data.overview.balance).toBe(43000);
  });

  it('should include category breakdown', async () => {
    const res = await request(app)
      .get('/summary')
      .set('Authorization', `Bearer ${token}`);

    expect(res.body.data).toHaveProperty('categoryBreakdown');
    expect(res.body.data.categoryBreakdown).toHaveProperty('food');
    expect(res.body.data.categoryBreakdown.food.expense).toBe(5000);
  });

  it('should include monthly trends', async () => {
    const res = await request(app)
      .get('/summary')
      .set('Authorization', `Bearer ${token}`);

    expect(res.body.data).toHaveProperty('monthlyTrends');
  });

  it('should include saving tips', async () => {
    const res = await request(app)
      .get('/summary')
      .set('Authorization', `Bearer ${token}`);

    expect(res.body.data.savingTips).toBeInstanceOf(Array);
    expect(res.body.data.savingTips.length).toBeGreaterThan(0);
  });

  it('should return cached result on second call', async () => {
    // first call fills the cache
    await request(app)
      .get('/summary')
      .set('Authorization', `Bearer ${token}`);

    // second call should come straight from cache
    const res = await request(app)
      .get('/summary')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.data.fromCache).toBe(true);
  });

  it('should require authentication', async () => {
    const res = await request(app).get('/summary');
    expect(res.statusCode).toBe(401);
  });
});

describe('Cache Service', () => {
  it('should store and retrieve values with TTL', () => {
    cache.set('test-key', { data: 'hello' }, 5000);
    const val = cache.get('test-key');
    expect(val).toEqual({ data: 'hello' });
  });

  it('should return null for expired keys', async () => {
    cache.set('expire-key', 'value', 1); // TTL of 1ms so it expires instantly
    await new Promise((r) => setTimeout(r, 10));
    expect(cache.get('expire-key')).toBeNull();
  });

  it('should invalidate a key', () => {
    cache.set('del-key', 'value', 60000);
    cache.invalidate('del-key');
    expect(cache.get('del-key')).toBeNull();
  });

  it('should return stats', () => {
    cache.flush();
    cache.set('k1', 'v1', 60000);
    cache.set('k2', 'v2', 60000);
    const stats = cache.stats();
    expect(stats.active).toBe(2);
  });
});
