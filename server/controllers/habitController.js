const mongoose = require('mongoose');
const Habit = require('../models/Habit');
const HabitCompletion = require('../models/HabitCompletion');
const { toUTCMidnight, daysAgoUTC } = require('../utils/dateHelpers');

/**
 * @desc    Create a habit
 * @route   POST /api/habits
 */
const createHabit = async (req, res, next) => {
  try {
    const { name, description } = req.body;

    const habit = await Habit.create({
      userId: req.user.id,
      name,
      description,
    });

    res.status(201).json({ habit });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all habits for user
 * @route   GET /api/habits
 */
const getHabits = async (req, res, next) => {
  try {
    const filter = { userId: req.user.id };

    if (req.query.active === 'true') {
      filter.isActive = true;
    } else if (req.query.active === 'false') {
      filter.isActive = false;
    }

    const habits = await Habit.find(filter).sort({ createdAt: -1 });

    res.json({ habits });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update a habit
 * @route   PUT /api/habits/:id
 */
const updateHabit = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid habit ID' });
    }

    const { name, description, isActive } = req.body;
    const updateData = {};

    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (isActive !== undefined) updateData.isActive = isActive;

    const habit = await Habit.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      updateData,
      { new: true, runValidators: true }
    );

    if (!habit) {
      return res.status(404).json({ message: 'Habit not found' });
    }

    res.json({ habit });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a habit and all its completions
 * @route   DELETE /api/habits/:id
 */
const deleteHabit = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid habit ID' });
    }

    const habit = await Habit.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!habit) {
      return res.status(404).json({ message: 'Habit not found' });
    }

    // Delete all completions for this habit
    await HabitCompletion.deleteMany({ habitId: req.params.id, userId: req.user.id });

    res.json({ message: 'Habit deleted' });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get completions for authenticated user
 * @route   GET /api/habits/completions
 */
const getCompletions = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;

    const filter = { userId: req.user.id };

    if (startDate || endDate) {
      filter.completionDate = {};
      if (startDate) filter.completionDate.$gte = toUTCMidnight(startDate);
      if (endDate) {
        const end = toUTCMidnight(endDate);
        end.setUTCDate(end.getUTCDate() + 1);
        filter.completionDate.$lt = end;
      }
    } else {
      // Default to last 7 days
      filter.completionDate = { $gte: daysAgoUTC(7) };
    }

    const completions = await HabitCompletion.find(filter)
      .populate('habitId', 'name')
      .sort({ completionDate: -1 });

    res.json({ completions });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Toggle habit completion for a date
 * @route   PUT /api/habits/:habitId/completion
 */
const toggleCompletion = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.habitId)) {
      return res.status(400).json({ message: 'Invalid habit ID' });
    }

    const { date, completed } = req.body;

    if (!date) {
      return res.status(400).json({ message: 'Date is required' });
    }

    // Verify habit ownership
    const habit = await Habit.findOne({
      _id: req.params.habitId,
      userId: req.user.id,
    });

    if (!habit) {
      return res.status(404).json({ message: 'Habit not found' });
    }

    const completionDate = toUTCMidnight(date);

    const completion = await HabitCompletion.findOneAndUpdate(
      {
        userId: req.user.id,
        habitId: req.params.habitId,
        completionDate,
      },
      {
        userId: req.user.id,
        habitId: req.params.habitId,
        completionDate,
        completed: completed !== undefined ? completed : true,
      },
      { new: true, upsert: true, runValidators: true }
    );

    res.json({ completion });
  } catch (error) {
    next(error);
  }
};

module.exports = { createHabit, getHabits, updateHabit, deleteHabit, getCompletions, toggleCompletion };
