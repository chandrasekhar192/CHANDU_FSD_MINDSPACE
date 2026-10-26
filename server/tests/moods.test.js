const request = require('supertest');
const app = require('../server');

process.env.JWT_SECRET = 'test-jwt-secret';

describe('Moods API', () => {
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

  describe('POST /api/moods', () => {
    it('should create a mood entry', async () => {
      const res = await request(app)
        .post('/api/moods')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          mood: 'good',
          intensity: 7,
          note: 'Feeling great today',
          activities: ['exercise', 'reading'],
          energyLevel: 4,
          entryDate: '2026-10-26',
        });

      expect(res.status).toBe(201);
      expect(res.body.mood).toBeDefined();
      expect(res.body.mood.mood).toBe('good');
      expect(res.body.mood.intensity).toBe(7);
      expect(res.body.mood.activities).toContain('exercise');
    });

    it('should default entryDate to today if not provided', async () => {
      const res = await request(app)
        .post('/api/moods')
        .set('Authorization', `Bearer ${token1}`)
        .send({ mood: 'okay', intensity: 5 });

      expect(res.status).toBe(201);
      expect(res.body.mood.entryDate).toBeDefined();
    });

    it('should reject invalid mood value', async () => {
      const res = await request(app)
        .post('/api/moods')
        .set('Authorization', `Bearer ${token1}`)
        .send({ mood: 'invalid', intensity: 5 });

      expect(res.status).toBe(400);
    });

    it('should reject missing intensity', async () => {
      const res = await request(app)
        .post('/api/moods')
        .set('Authorization', `Bearer ${token1}`)
        .send({ mood: 'good' });

      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/moods', () => {
    beforeEach(async () => {
      // Create entries for user 1
      await request(app)
        .post('/api/moods')
        .set('Authorization', `Bearer ${token1}`)
        .send({ mood: 'good', intensity: 7, entryDate: '2026-10-25' });
      await request(app)
        .post('/api/moods')
        .set('Authorization', `Bearer ${token1}`)
        .send({ mood: 'great', intensity: 9, entryDate: '2026-10-26' });
      // Create entry for user 2
      await request(app)
        .post('/api/moods')
        .set('Authorization', `Bearer ${token2}`)
        .send({ mood: 'bad', intensity: 2, entryDate: '2026-10-26' });
    });

    it('should return only the authenticated user\'s entries', async () => {
      const res = await request(app)
        .get('/api/moods')
        .set('Authorization', `Bearer ${token1}`);

      expect(res.status).toBe(200);
      expect(res.body.moods).toHaveLength(2);
      expect(res.body.total).toBe(2);
    });

    it('should not return other user\'s entries', async () => {
      const res = await request(app)
        .get('/api/moods')
        .set('Authorization', `Bearer ${token2}`);

      expect(res.body.moods).toHaveLength(1);
      expect(res.body.moods[0].mood).toBe('bad');
    });

    it('should support multiple entries on the same date', async () => {
      await request(app)
        .post('/api/moods')
        .set('Authorization', `Bearer ${token1}`)
        .send({ mood: 'low', intensity: 3, entryDate: '2026-10-26' });

      const res = await request(app)
        .get('/api/moods')
        .set('Authorization', `Bearer ${token1}`);

      expect(res.body.total).toBe(3);
    });

    it('should support pagination', async () => {
      const res = await request(app)
        .get('/api/moods?page=1&limit=1')
        .set('Authorization', `Bearer ${token1}`);

      expect(res.body.moods).toHaveLength(1);
      expect(res.body.pages).toBe(2);
    });
  });

  describe('PUT /api/moods/:id', () => {
    let moodId;

    beforeEach(async () => {
      const res = await request(app)
        .post('/api/moods')
        .set('Authorization', `Bearer ${token1}`)
        .send({ mood: 'good', intensity: 7, entryDate: '2026-10-26' });
      moodId = res.body.mood._id;
    });

    it('should update own mood entry', async () => {
      const res = await request(app)
        .put(`/api/moods/${moodId}`)
        .set('Authorization', `Bearer ${token1}`)
        .send({ mood: 'great', intensity: 9 });

      expect(res.status).toBe(200);
      expect(res.body.mood.mood).toBe('great');
      expect(res.body.mood.intensity).toBe(9);
    });

    it('should reject update of another user\'s entry', async () => {
      const res = await request(app)
        .put(`/api/moods/${moodId}`)
        .set('Authorization', `Bearer ${token2}`)
        .send({ mood: 'bad' });

      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /api/moods/:id', () => {
    let moodId;

    beforeEach(async () => {
      const res = await request(app)
        .post('/api/moods')
        .set('Authorization', `Bearer ${token1}`)
        .send({ mood: 'good', intensity: 7, entryDate: '2026-10-26' });
      moodId = res.body.mood._id;
    });

    it('should delete own mood entry', async () => {
      const res = await request(app)
        .delete(`/api/moods/${moodId}`)
        .set('Authorization', `Bearer ${token1}`);

      expect(res.status).toBe(200);

      const getRes = await request(app)
        .get(`/api/moods/${moodId}`)
        .set('Authorization', `Bearer ${token1}`);

      expect(getRes.status).toBe(404);
    });

    it('should reject deletion of another user\'s entry', async () => {
      const res = await request(app)
        .delete(`/api/moods/${moodId}`)
        .set('Authorization', `Bearer ${token2}`);

      expect(res.status).toBe(404);
    });
  });
});
