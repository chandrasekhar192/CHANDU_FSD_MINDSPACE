const request = require('supertest');
const app = require('../server');

process.env.JWT_SECRET = 'test-jwt-secret';

describe('Insights API', () => {
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

  describe('GET /api/insights/moods', () => {
    it('should handle zero entries gracefully', async () => {
      const res = await request(app)
        .get('/api/insights/moods')
        .set('Authorization', `Bearer ${token1}`);

      expect(res.status).toBe(200);
      expect(res.body.moodCounts).toBeDefined();
      expect(res.body.moodCounts.great).toBe(0);
      expect(res.body.moodCounts.good).toBe(0);
      expect(res.body.moodDistribution).toBeDefined();
      expect(res.body.dailyAverages).toHaveLength(0);
      expect(res.body.recentEntries).toHaveLength(0);
    });

    it('should compute correct daily averages', async () => {
      const today = new Date().toISOString().split('T')[0];

      // Create multiple entries on the same day
      await request(app)
        .post('/api/moods')
        .set('Authorization', `Bearer ${token1}`)
        .send({ mood: 'great', intensity: 8, entryDate: today }); // score 5
      await request(app)
        .post('/api/moods')
        .set('Authorization', `Bearer ${token1}`)
        .send({ mood: 'good', intensity: 7, entryDate: today }); // score 4

      const res = await request(app)
        .get('/api/insights/moods')
        .set('Authorization', `Bearer ${token1}`);

      expect(res.status).toBe(200);
      expect(res.body.moodCounts.great).toBe(1);
      expect(res.body.moodCounts.good).toBe(1);

      // Daily average should be (5+4)/2 = 4.5
      expect(res.body.dailyAverages).toHaveLength(1);
      expect(res.body.dailyAverages[0].avgScore).toBe(4.5);
      expect(res.body.dailyAverages[0].count).toBe(2);
      expect(res.body.dailyAverages[0].date).toBe(today);
    });

    it('should not mix users\' data', async () => {
      const today = new Date().toISOString().split('T')[0];

      // User 1 entries
      await request(app)
        .post('/api/moods')
        .set('Authorization', `Bearer ${token1}`)
        .send({ mood: 'great', intensity: 9, entryDate: today });

      // User 2 entries
      await request(app)
        .post('/api/moods')
        .set('Authorization', `Bearer ${token2}`)
        .send({ mood: 'bad', intensity: 2, entryDate: today });

      // Check user 1 insights
      const res1 = await request(app)
        .get('/api/insights/moods')
        .set('Authorization', `Bearer ${token1}`);

      expect(res1.body.moodCounts.great).toBe(1);
      expect(res1.body.moodCounts.bad).toBe(0);

      // Check user 2 insights
      const res2 = await request(app)
        .get('/api/insights/moods')
        .set('Authorization', `Bearer ${token2}`);

      expect(res2.body.moodCounts.bad).toBe(1);
      expect(res2.body.moodCounts.great).toBe(0);
    });

    it('should support month period', async () => {
      const res = await request(app)
        .get('/api/insights/moods?period=month')
        .set('Authorization', `Bearer ${token1}`);

      expect(res.status).toBe(200);
      expect(res.body.moodCounts).toBeDefined();
    });

    it('should calculate correct distribution percentages', async () => {
      const today = new Date().toISOString().split('T')[0];

      await request(app)
        .post('/api/moods')
        .set('Authorization', `Bearer ${token1}`)
        .send({ mood: 'great', intensity: 9, entryDate: today });
      await request(app)
        .post('/api/moods')
        .set('Authorization', `Bearer ${token1}`)
        .send({ mood: 'great', intensity: 8, entryDate: today });
      await request(app)
        .post('/api/moods')
        .set('Authorization', `Bearer ${token1}`)
        .send({ mood: 'good', intensity: 7, entryDate: today });
      await request(app)
        .post('/api/moods')
        .set('Authorization', `Bearer ${token1}`)
        .send({ mood: 'okay', intensity: 5, entryDate: today });

      const res = await request(app)
        .get('/api/insights/moods')
        .set('Authorization', `Bearer ${token1}`);

      const greatDist = res.body.moodDistribution.find((d) => d.mood === 'great');
      expect(greatDist.count).toBe(2);
      expect(greatDist.percentage).toBe(50); // 2 out of 4 = 50%

      const goodDist = res.body.moodDistribution.find((d) => d.mood === 'good');
      expect(goodDist.count).toBe(1);
      expect(goodDist.percentage).toBe(25);
    });
  });
});
