const express = require('express');
const { body } = require('express-validator');
const { createEntry, getEntries, getEntryById, updateEntry, deleteEntry } = require('../controllers/journalController');
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

// All routes are protected
router.use(auth);

// POST /api/journal
router.post(
  '/',
  [
    body('title')
      .trim()
      .notEmpty()
      .withMessage('Title is required')
      .isLength({ max: 200 })
      .withMessage('Title cannot exceed 200 characters'),
    body('content')
      .notEmpty()
      .withMessage('Content is required')
      .isLength({ max: 5000 })
      .withMessage('Content cannot exceed 5000 characters'),
    body('mood')
      .optional()
      .isIn(['great', 'good', 'okay', 'low', 'bad'])
      .withMessage('Invalid mood value'),
    body('tags')
      .optional()
      .isArray({ max: 10 })
      .withMessage('Tags must be an array with max 10 items'),
    body('tags.*')
      .optional()
      .isLength({ max: 30 })
      .withMessage('Each tag cannot exceed 30 characters'),
  ],
  validate,
  createEntry
);

// GET /api/journal
router.get('/', getEntries);

// GET /api/journal/:id
router.get('/:id', getEntryById);

// PUT /api/journal/:id
router.put('/:id', updateEntry);

// DELETE /api/journal/:id
router.delete('/:id', deleteEntry);

module.exports = router;
