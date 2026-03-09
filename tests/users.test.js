// tests for user registration, login, and profile endpoints
const request = require('supertest');
const app = require('../app');
const { writeData } = require('../utils/fileStore');

afterAll(async () => {
  await writeData('users', []);
});

const testUser = {
  name: 'Test User',
  email: 'test@finedge.com',
  password: 'password123',
};

describe('POST /users – Register', () => {
  beforeEach(async () => {
    await writeData('users', []);
  });

  it('should register a new user successfully', async () => {
    const res = await request(app).post('/users').send(testUser);
    expect(res.statusCode).toBe(201);
    expect(res.body.status).toBe('success');
    expect(res.body.data.user).toHaveProperty('id');
    expect(res.body.data.user.email).toBe(testUser.email);
    expect(res.body.data.user).not.toHaveProperty('password');
  });

  it('should reject registration with missing fields', async () => {
    const res = await request(app).post('/users').send({ email: 'test@test.com' });
    expect(res.statusCode).toBe(400);
    expect(res.body.status).toBe('fail');
  });

  it('should reject duplicate email registration', async () => {
    await request(app).post('/users').send(testUser);
    const res = await request(app).post('/users').send(testUser);
    expect(res.statusCode).toBe(409);
    expect(res.body.status).toBe('fail');
  });
});

describe('POST /users/login – Login', () => {
  beforeEach(async () => {
    await writeData('users', []);
    await request(app).post('/users').send(testUser);
  });

  it('should login successfully with correct credentials', async () => {
    const res = await request(app)
      .post('/users/login')
      .send({ email: testUser.email, password: testUser.password });
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.data).toHaveProperty('token');
    expect(res.body.data.user).toHaveProperty('id');
  });

  it('should reject login with wrong password', async () => {
    const res = await request(app)
      .post('/users/login')
      .send({ email: testUser.email, password: 'wrongpassword' });
    expect(res.statusCode).toBe(401);
    expect(res.body.status).toBe('fail');
  });

  it('should reject login with non-existent email', async () => {
    const res = await request(app)
      .post('/users/login')
      .send({ email: 'nobody@finedge.com', password: 'test' });
    expect(res.statusCode).toBe(401);
  });
});

describe('GET /users/me – Profile', () => {
  let token;

  beforeAll(async () => {
    await writeData('users', []);
    await request(app).post('/users').send(testUser);

    const loginRes = await request(app)
      .post('/users/login')
      .send({ email: testUser.email, password: testUser.password });

    token = (loginRes.body.data || {}).token;
  });

  afterAll(async () => {
    await writeData('users', []);
  });

  it('should return user profile with valid token', async () => {
    const res = await request(app)
      .get('/users/me')
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.data.user.email).toBe(testUser.email);
  });

  it('should reject profile request without token', async () => {
    const res = await request(app).get('/users/me');
    expect(res.statusCode).toBe(401);
  });

  it('should reject with invalid token', async () => {
    const res = await request(app)
      .get('/users/me')
      .set('Authorization', 'Bearer invalidtoken');
    expect(res.statusCode).toBe(401);
  });
});

