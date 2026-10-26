const express = require('express');
const { getMoodInsights } = require('../controllers/insightsController');
const auth = require('../middleware/auth');

const router = express.Router();

// All routes are protected
router.use(auth);

// GET /api/insights/moods
router.get('/moods', getMoodInsights);

module.exports = router;
