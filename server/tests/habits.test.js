const request = require('supertest');
const app = require('../server');

process.env.JWT_SECRET = 'test-jwt-secret';

describe('Habits API', () => {
  let token1, token2;

  const registerAndLogin = async (name, email) => {
    await request(app).post('/api/auth/register').send({
      name,
      email,
      password: 'password123',
      passwordConfirm: 'password123',
    });
    const res = await request(app).post('/api/auth/login').send({ email, password: 'password123' });
    return res.body.token;
  };

  beforeEach(async () => {
    token1 = await registerAndLogin('User One', 'user1@example.com');
    token2 = await registerAndLogin('User Two', 'user2@example.com');
  });

  describe('POST /api/habits', () => {
    it('should create a habit', async () => {
      const res = await request(app)
        .post('/api/habits')
        .set('Authorization', `Bearer ${token1}`)
        .send({ name: 'Morning Run', description: 'Run 5km every morning' });

      expect(res.status).toBe(201);
      expect(res.body.habit).toBeDefined();
      expect(res.body.habit.name).toBe('Morning Run');
      expect(res.body.habit.isActive).toBe(true);
    });

    it('should reject habit without name', async () => {
      const res = await request(app)
        .post('/api/habits')
        .set('Authorization', `Bearer ${token1}`)
        .send({ description: 'No name' });

      expect(res.status).toBe(400);
    });
  });

  describe('Habit Completions', () => {
    let habitId;

    beforeEach(async () => {
      const res = await request(app)
        .post('/api/habits')
        .set('Authorization', `Bearer ${token1}`)
        .send({ name: 'Meditation' });
      habitId = res.body.habit._id;
    });

    it('should complete a habit for a date', async () => {
      const res = await request(app)
        .put(`/api/habits/${habitId}/completion`)
        .set('Authorization', `Bearer ${token1}`)
        .send({ date: '2026-10-26', completed: true });

      expect(res.status).toBe(200);
      expect(res.body.completion).toBeDefined();
      expect(res.body.completion.completed).toBe(true);
    });

    it('should be idempotent for same date', async () => {
      await request(app)
        .put(`/api/habits/${habitId}/completion`)
        .set('Authorization', `Bearer ${token1}`)
        .send({ date: '2026-10-26', completed: true });

      const res = await request(app)
        .put(`/api/habits/${habitId}/completion`)
        .set('Authorization', `Bearer ${token1}`)
        .send({ date: '2026-10-26', completed: true });

      expect(res.status).toBe(200);
      expect(res.body.completion.completed).toBe(true);
    });

    it('should toggle completion off', async () => {
      await request(app)
        .put(`/api/habits/${habitId}/completion`)
        .set('Authorization', `Bearer ${token1}`)
        .send({ date: '2026-10-26', completed: true });

      const res = await request(app)
        .put(`/api/habits/${habitId}/completion`)
        .set('Authorization', `Bearer ${token1}`)
        .send({ date: '2026-10-26', completed: false });

      expect(res.status).toBe(200);
      expect(res.body.completion.completed).toBe(false);
    });

    it('should reject completion for another user\'s habit', async () => {
      const res = await request(app)
        .put(`/api/habits/${habitId}/completion`)
        .set('Authorization', `Bearer ${token2}`)
        .send({ date: '2026-10-26', completed: true });

      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /api/habits/:id', () => {
    it('should delete habit and its completions', async () => {
      const createRes = await request(app)
        .post('/api/habits')
        .set('Authorization', `Bearer ${token1}`)
        .send({ name: 'To Delete' });

      const habitId = createRes.body.habit._id;

      // Add a completion
      await request(app)
        .put(`/api/habits/${habitId}/completion`)
        .set('Authorization', `Bearer ${token1}`)
        .send({ date: '2026-10-26', completed: true });

      const deleteRes = await request(app)
        .delete(`/api/habits/${habitId}`)
        .set('Authorization', `Bearer ${token1}`);

      expect(deleteRes.status).toBe(200);

      // Verify completions are gone
      const completionsRes = await request(app)
        .get('/api/habits/completions')
        .set('Authorization', `Bearer ${token1}`);

      expect(completionsRes.body.completions).toHaveLength(0);
    });
  });
});
