// quick smoke test to make sure the server is alive
const request = require('supertest');
const app = require('../app');

describe('GET /health', () => {
  it('should return 200 with health status', async () => {
    const res = await request(app).get('/health');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.message).toContain('FinEdge API is running');
    expect(res.body).toHaveProperty('timestamp');
    expect(res.body).toHaveProperty('uptime');
    expect(res.body).toHaveProperty('version');
  });
});

describe('404 Handler', () => {
  it('should return 404 for unknown routes', async () => {
    const res = await request(app).get('/nonexistent-route');
    expect(res.statusCode).toBe(404);
    expect(res.body.status).toBe('fail');
    expect(res.body.message).toContain('not found');
  });
});
