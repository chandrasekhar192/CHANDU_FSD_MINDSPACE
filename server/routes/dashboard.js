const express = require('express');
const { getSummary } = require('../controllers/dashboardController');
const auth = require('../middleware/auth');

const router = express.Router();

// All routes are protected
router.use(auth);

// GET /api/dashboard/summary
router.get('/summary', getSummary);

module.exports = router;
