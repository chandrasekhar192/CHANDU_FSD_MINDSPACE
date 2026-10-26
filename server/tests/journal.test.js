const request = require('supertest');
const app = require('../server');

process.env.JWT_SECRET = 'test-jwt-secret';

describe('Journal API', () => {
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

  describe('POST /api/journal', () => {
    it('should create a journal entry', async () => {
      const res = await request(app)
        .post('/api/journal')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          title: 'My First Entry',
          content: 'Today was a great day!',
          mood: 'great',
          tags: ['personal', 'reflection'],
        });

      expect(res.status).toBe(201);
      expect(res.body.entry).toBeDefined();
      expect(res.body.entry.title).toBe('My First Entry');
      expect(res.body.entry.tags).toContain('personal');
    });

    it('should reject entry without title', async () => {
      const res = await request(app)
        .post('/api/journal')
        .set('Authorization', `Bearer ${token1}`)
        .send({ content: 'Some content' });

      expect(res.status).toBe(400);
    });

    it('should reject entry without content', async () => {
      const res = await request(app)
        .post('/api/journal')
        .set('Authorization', `Bearer ${token1}`)
        .send({ title: 'A title' });

      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/journal', () => {
    beforeEach(async () => {
      await request(app)
        .post('/api/journal')
        .set('Authorization', `Bearer ${token1}`)
        .send({ title: 'Morning thoughts', content: 'Woke up feeling refreshed' });
      await request(app)
        .post('/api/journal')
        .set('Authorization', `Bearer ${token1}`)
        .send({ title: 'Evening reflection', content: 'Had a productive day at work' });
      await request(app)
        .post('/api/journal')
        .set('Authorization', `Bearer ${token2}`)
        .send({ title: 'Private Entry', content: 'This is user2 only' });
    });

    it('should return only the authenticated user\'s entries', async () => {
      const res = await request(app)
        .get('/api/journal')
        .set('Authorization', `Bearer ${token1}`);

      expect(res.status).toBe(200);
      expect(res.body.entries).toHaveLength(2);
      expect(res.body.total).toBe(2);
    });

    it('should search by title and content', async () => {
      const res = await request(app)
        .get('/api/journal?search=morning')
        .set('Authorization', `Bearer ${token1}`);

      expect(res.body.entries).toHaveLength(1);
      expect(res.body.entries[0].title).toBe('Morning thoughts');
    });

    it('should search in content', async () => {
      const res = await request(app)
        .get('/api/journal?search=productive')
        .set('Authorization', `Bearer ${token1}`);

      expect(res.body.entries).toHaveLength(1);
      expect(res.body.entries[0].title).toBe('Evening reflection');
    });
  });

  describe('PUT /api/journal/:id', () => {
    let entryId;

    beforeEach(async () => {
      const res = await request(app)
        .post('/api/journal')
        .set('Authorization', `Bearer ${token1}`)
        .send({ title: 'Original Title', content: 'Original content' });
      entryId = res.body.entry._id;
    });

    it('should update own journal entry', async () => {
      const res = await request(app)
        .put(`/api/journal/${entryId}`)
        .set('Authorization', `Bearer ${token1}`)
        .send({ title: 'Updated Title', content: 'Updated content' });

      expect(res.status).toBe(200);
      expect(res.body.entry.title).toBe('Updated Title');
    });

    it('should reject update of another user\'s entry', async () => {
      const res = await request(app)
        .put(`/api/journal/${entryId}`)
        .set('Authorization', `Bearer ${token2}`)
        .send({ title: 'Hacked Title' });

      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /api/journal/:id', () => {
    let entryId;

    beforeEach(async () => {
      const res = await request(app)
        .post('/api/journal')
        .set('Authorization', `Bearer ${token1}`)
        .send({ title: 'To Delete', content: 'Will be deleted' });
      entryId = res.body.entry._id;
    });

    it('should delete own journal entry', async () => {
      const res = await request(app)
        .delete(`/api/journal/${entryId}`)
        .set('Authorization', `Bearer ${token1}`);

      expect(res.status).toBe(200);
    });

    it('should reject deletion of another user\'s entry', async () => {
      const res = await request(app)
        .delete(`/api/journal/${entryId}`)
        .set('Authorization', `Bearer ${token2}`);

      expect(res.status).toBe(404);
    });
  });
});
