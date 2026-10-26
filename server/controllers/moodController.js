const mongoose = require('mongoose');
const MoodEntry = require('../models/MoodEntry');
const { getUTCToday, toUTCMidnight } = require('../utils/dateHelpers');

/**
 * @desc    Create a mood entry
 * @route   POST /api/moods
 */
const createMood = async (req, res, next) => {
  try {
    const { mood, intensity, note, activities, energyLevel, entryDate } = req.body;

    const moodEntry = await MoodEntry.create({
      userId: req.user.id,
      mood,
      intensity,
      note,
      activities,
      energyLevel,
      entryDate: entryDate ? toUTCMidnight(entryDate) : getUTCToday(),
    });

    res.status(201).json({ mood: moodEntry });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get mood entries with filtering & pagination
 * @route   GET /api/moods
 */
const getMoods = async (req, res, next) => {
  try {
    const { startDate, endDate, mood, page: pageStr, limit: limitStr } = req.query;
    const page = Math.max(1, parseInt(pageStr) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(limitStr) || 20));

    const filter = { userId: req.user.id };

    if (startDate || endDate) {
      filter.entryDate = {};
      if (startDate) filter.entryDate.$gte = toUTCMidnight(startDate);
      if (endDate) {
        const end = toUTCMidnight(endDate);
        end.setUTCDate(end.getUTCDate() + 1);
        filter.entryDate.$lt = end;
      }
    }

    if (mood) {
      filter.mood = mood;
    }

    const total = await MoodEntry.countDocuments(filter);
    const moods = await MoodEntry.find(filter)
      .sort({ entryDate: -1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.json({
      moods,
      total,
      page,
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get a single mood entry by ID
 * @route   GET /api/moods/:id
 */
const getMoodById = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid mood entry ID' });
    }

    const moodEntry = await MoodEntry.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!moodEntry) {
      return res.status(404).json({ message: 'Mood entry not found' });
    }

    res.json({ mood: moodEntry });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update a mood entry
 * @route   PUT /api/moods/:id
 */
const updateMood = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid mood entry ID' });
    }

    const { mood, intensity, note, activities, energyLevel } = req.body;
    const updateData = {};

    if (mood !== undefined) updateData.mood = mood;
    if (intensity !== undefined) updateData.intensity = intensity;
    if (note !== undefined) updateData.note = note;
    if (activities !== undefined) updateData.activities = activities;
    if (energyLevel !== undefined) updateData.energyLevel = energyLevel;

    const moodEntry = await MoodEntry.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      updateData,
      { new: true, runValidators: true }
    );

    if (!moodEntry) {
      return res.status(404).json({ message: 'Mood entry not found' });
    }

    res.json({ mood: moodEntry });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a mood entry
 * @route   DELETE /api/moods/:id
 */
const deleteMood = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid mood entry ID' });
    }

    const moodEntry = await MoodEntry.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!moodEntry) {
      return res.status(404).json({ message: 'Mood entry not found' });
    }

    res.json({ message: 'Mood entry deleted' });
  } catch (error) {
    next(error);
  }
};

module.exports = { createMood, getMoods, getMoodById, updateMood, deleteMood };
