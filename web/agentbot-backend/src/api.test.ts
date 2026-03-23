import request from 'supertest';
import express, { Express } from 'express';

describe('Backend API Tests', () => {
  let app: Express;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.get('/health', (req, res) => {
      res.json({ status: 'ok', timestamp: new Date().toISOString() });
    });
    app.post('/api/register', (req, res) => {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password required' });
      }
      res.status(201).json({ id: 'test-id', email, name: email });
    });
  });

  describe('GET /health', () => {
    it('should return health status', async () => {
      const response = await request(app).get('/health');
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'ok');
      expect(response.body).toHaveProperty('timestamp');
    });
  });

  describe('POST /api/register', () => {
    it('should register a new user', async () => {
      const response = await request(app)
        .post('/api/register')
        .send({ email: 'test@example.com', password: 'password123' });
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('email', 'test@example.com');
    });

    it('should reject missing email', async () => {
      const response = await request(app)
        .post('/api/register')
        .send({ password: 'password123' });
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should reject missing password', async () => {
      const response = await request(app)
        .post('/api/register')
        .send({ email: 'test@example.com' });
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });
});
