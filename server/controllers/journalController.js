const mongoose = require('mongoose');
const JournalEntry = require('../models/JournalEntry');

/**
 * @desc    Create a journal entry
 * @route   POST /api/journal
 */
const createEntry = async (req, res, next) => {
  try {
    const { title, content, mood, tags } = req.body;

    const entry = await JournalEntry.create({
      userId: req.user.id,
      title,
      content,
      mood,
      tags,
    });

    res.status(201).json({ entry });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get journal entries with search, filtering & pagination
 * @route   GET /api/journal
 */
const getEntries = async (req, res, next) => {
  try {
    const { search, startDate, endDate, mood, page: pageStr, limit: limitStr } = req.query;
    const page = Math.max(1, parseInt(pageStr) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(limitStr) || 20));

    const filter = { userId: req.user.id };

    if (search) {
      const regex = new RegExp(search, 'i');
      filter.$or = [{ title: regex }, { content: regex }];
    }

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setUTCDate(end.getUTCDate() + 1);
        filter.createdAt.$lt = end;
      }
    }

    if (mood) {
      filter.mood = mood;
    }

    const total = await JournalEntry.countDocuments(filter);
    const entries = await JournalEntry.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.json({
      entries,
      total,
      page,
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get a single journal entry by ID
 * @route   GET /api/journal/:id
 */
const getEntryById = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid journal entry ID' });
    }

    const entry = await JournalEntry.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!entry) {
      return res.status(404).json({ message: 'Journal entry not found' });
    }

    res.json({ entry });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update a journal entry
 * @route   PUT /api/journal/:id
 */
const updateEntry = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid journal entry ID' });
    }

    const { title, content, mood, tags } = req.body;
    const updateData = {};

    if (title !== undefined) updateData.title = title;
    if (content !== undefined) updateData.content = content;
    if (mood !== undefined) updateData.mood = mood;
    if (tags !== undefined) updateData.tags = tags;

    const entry = await JournalEntry.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      updateData,
      { new: true, runValidators: true }
    );

    if (!entry) {
      return res.status(404).json({ message: 'Journal entry not found' });
    }

    res.json({ entry });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a journal entry
 * @route   DELETE /api/journal/:id
 */
const deleteEntry = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid journal entry ID' });
    }

    const entry = await JournalEntry.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!entry) {
      return res.status(404).json({ message: 'Journal entry not found' });
    }

    res.json({ message: 'Journal entry deleted' });
  } catch (error) {
    next(error);
  }
};

module.exports = { createEntry, getEntries, getEntryById, updateEntry, deleteEntry };
