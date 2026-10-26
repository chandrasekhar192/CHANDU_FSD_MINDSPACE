const express = require('express');
const { body } = require('express-validator');
const { createHabit, getHabits, updateHabit, deleteHabit, getCompletions, toggleCompletion } = require('../controllers/habitController');
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

// All routes are protected
router.use(auth);

// GET /api/habits/completions — must be before /:id
router.get('/completions', getCompletions);

// POST /api/habits
router.post(
  '/',
  [
    body('name')
      .trim()
      .notEmpty()
      .withMessage('Habit name is required')
      .isLength({ max: 100 })
      .withMessage('Habit name cannot exceed 100 characters'),
    body('description')
      .optional()
      .isLength({ max: 300 })
      .withMessage('Description cannot exceed 300 characters'),
  ],
  validate,
  createHabit
);

// GET /api/habits
router.get('/', getHabits);

// PUT /api/habits/:id
router.put('/:id', updateHabit);

// DELETE /api/habits/:id
router.delete('/:id', deleteHabit);

// PUT /api/habits/:habitId/completion
router.put('/:habitId/completion', toggleCompletion);

module.exports = router;
