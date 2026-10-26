const express = require('express');
const { body } = require('express-validator');
const { createMood, getMoods, getMoodById, updateMood, deleteMood } = require('../controllers/moodController');
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

// All routes are protected
router.use(auth);

// POST /api/moods
router.post(
  '/',
  [
    body('mood')
      .notEmpty()
      .withMessage('Mood is required')
      .isIn(['great', 'good', 'okay', 'low', 'bad'])
      .withMessage('Invalid mood value'),
    body('intensity')
      .isInt({ min: 1, max: 10 })
      .withMessage('Intensity must be between 1 and 10'),
    body('note')
      .optional()
      .isLength({ max: 500 })
      .withMessage('Note cannot exceed 500 characters'),
    body('activities')
      .optional()
      .isArray()
      .withMessage('Activities must be an array'),
    body('activities.*')
      .optional()
      .isIn(['exercise', 'meditation', 'reading', 'socializing', 'work', 'hobby', 'nature', 'music', 'cooking', 'gaming', 'travel', 'rest'])
      .withMessage('Invalid activity'),
    body('energyLevel')
      .optional()
      .isInt({ min: 1, max: 5 })
      .withMessage('Energy level must be between 1 and 5'),
  ],
  validate,
  createMood
);

// GET /api/moods
router.get('/', getMoods);

// GET /api/moods/:id
router.get('/:id', getMoodById);

// PUT /api/moods/:id
router.put('/:id', updateMood);

// DELETE /api/moods/:id
router.delete('/:id', deleteMood);

module.exports = router;
