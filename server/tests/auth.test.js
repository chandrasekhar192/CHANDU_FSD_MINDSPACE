const request = require('supertest');
const app = require('../server');

// Set JWT_SECRET for tests
process.env.JWT_SECRET = 'test-jwt-secret';

describe('Auth API', () => {
  const validUser = {
    name: 'Test User',
    email: 'test@example.com',
    password: 'password123',
    passwordConfirm: 'password123',
  };

  describe('POST /api/auth/register', () => {
    it('should register a new user', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send(validUser);

      expect(res.status).toBe(201);
      expect(res.body.user).toBeDefined();
      expect(res.body.user.name).toBe(validUser.name);
      expect(res.body.user.email).toBe(validUser.email);
      expect(res.body.user.password).toBeUndefined();
    });

    it('should reject duplicate email', async () => {
      await request(app).post('/api/auth/register').send(validUser);
      const res = await request(app).post('/api/auth/register').send(validUser);

      expect(res.status).toBe(409);
      expect(res.body.message).toBeDefined();
    });

    it('should reject invalid email', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ ...validUser, email: 'notanemail' });

      expect(res.status).toBe(400);
    });

    it('should reject short password', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ ...validUser, password: '123', passwordConfirm: '123' });

      expect(res.status).toBe(400);
    });

    it('should reject mismatched passwords', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ ...validUser, passwordConfirm: 'differentpassword' });

      expect(res.status).toBe(400);
    });

    it('should reject missing name', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: 'test@example.com', password: 'password123', passwordConfirm: 'password123' });

      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      await request(app).post('/api/auth/register').send(validUser);
    });

    it('should login with correct credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: validUser.email, password: validUser.password });

      expect(res.status).toBe(200);
      expect(res.body.token).toBeDefined();
      expect(res.body.user).toBeDefined();
      expect(res.body.user.email).toBe(validUser.email);
      expect(res.body.user.password).toBeUndefined();
    });

    it('should reject wrong password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: validUser.email, password: 'wrongpassword' });

      expect(res.status).toBe(401);
    });

    it('should reject non-existent email', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'nobody@example.com', password: 'password123' });

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return user profile with valid token', async () => {
      await request(app).post('/api/auth/register').send(validUser);
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ email: validUser.email, password: validUser.password });

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${loginRes.body.token}`);

      expect(res.status).toBe(200);
      expect(res.body.user.email).toBe(validUser.email);
    });

    it('should reject request without token', async () => {
      const res = await request(app).get('/api/auth/me');

      expect(res.status).toBe(401);
    });

    it('should reject invalid token', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalidtoken123');

      expect(res.status).toBe(401);
    });
  });

  describe('Cross-user access', () => {
    it('should not allow accessing another user\'s data via auth', async () => {
      // Register two users
      await request(app).post('/api/auth/register').send(validUser);
      await request(app).post('/api/auth/register').send({
        name: 'Other User',
        email: 'other@example.com',
        password: 'password123',
        passwordConfirm: 'password123',
      });

      const login1 = await request(app)
        .post('/api/auth/login')
        .send({ email: validUser.email, password: validUser.password });

      const login2 = await request(app)
        .post('/api/auth/login')
        .send({ email: 'other@example.com', password: 'password123' });

      // Each user should see their own profile
      const me1 = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${login1.body.token}`);

      const me2 = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${login2.body.token}`);

      expect(me1.body.user.email).toBe(validUser.email);
      expect(me2.body.user.email).toBe('other@example.com');
      expect(me1.body.user.id).not.toBe(me2.body.user.id);
    });
  });
});
