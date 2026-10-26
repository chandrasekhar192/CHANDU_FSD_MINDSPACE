const MoodEntry = require('../models/MoodEntry');
const JournalEntry = require('../models/JournalEntry');
const Habit = require('../models/Habit');
const HabitCompletion = require('../models/HabitCompletion');
const { getUTCToday, daysAgoUTC } = require('../utils/dateHelpers');

/**
 * @desc    Get dashboard summary for authenticated user
 * @route   GET /api/dashboard/summary
 */
const getSummary = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const today = getUTCToday();
    const tomorrow = new Date(today);
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);

    const weekAgo = daysAgoUTC(7);

    // Run queries in parallel
    const [
      todayMoodCount,
      todayJournalCount,
      activeHabitCount,
      todayCompletedHabits,
      recentMoods,
      weeklyMoods,
    ] = await Promise.all([
      // Count mood entries for today
      MoodEntry.countDocuments({
        userId,
        entryDate: { $gte: today, $lt: tomorrow },
      }),
      // Count journal entries created today
      JournalEntry.countDocuments({
        userId,
        createdAt: { $gte: today, $lt: tomorrow },
      }),
      // Count active habits
      Habit.countDocuments({ userId, isActive: true }),
      // Count completed habits for today
      HabitCompletion.countDocuments({
        userId,
        completionDate: { $gte: today, $lt: tomorrow },
        completed: true,
      }),
      // Last 5 mood entries
      MoodEntry.find({ userId })
        .sort({ createdAt: -1 })
        .limit(5),
      // Mood entries for last 7 days
      MoodEntry.find({
        userId,
        entryDate: { $gte: weekAgo },
      }).sort({ entryDate: -1 }),
    ]);

    res.json({
      todayMoodCount,
      todayJournalCount,
      activeHabitCount,
      todayCompletedHabits,
      totalHabits: activeHabitCount,
      recentMoods,
      weeklyMoods,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getSummary };
