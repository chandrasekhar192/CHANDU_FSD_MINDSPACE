const mongoose = require('mongoose');
const MoodEntry = require('../models/MoodEntry');
const { daysAgoUTC } = require('../utils/dateHelpers');
const { MOOD_SCORES } = require('../utils/moodScores');

/**
 * @desc    Get mood insights/analytics for authenticated user
 * @route   GET /api/insights/moods
 */
const getMoodInsights = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const period = req.query.period || 'week';
    const days = period === 'month' ? 30 : 7;
    const startDate = daysAgoUTC(days);

    const userObjectId = new mongoose.Types.ObjectId(userId);

    // Get mood counts
    const moodCountsAgg = await MoodEntry.aggregate([
      { $match: { userId: userObjectId, entryDate: { $gte: startDate } } },
      { $group: { _id: '$mood', count: { $sum: 1 } } },
    ]);

    // Build mood counts object
    const moodCounts = { great: 0, good: 0, okay: 0, low: 0, bad: 0 };
    let totalEntries = 0;
    moodCountsAgg.forEach((item) => {
      moodCounts[item._id] = item.count;
      totalEntries += item.count;
    });

    // Build mood distribution
    const moodDistribution = Object.entries(moodCounts).map(([mood, count]) => ({
      mood,
      count,
      percentage: totalEntries > 0 ? Math.round((count / totalEntries) * 100) : 0,
    }));

    // Daily averages using aggregation pipeline
    const dailyAveragesAgg = await MoodEntry.aggregate([
      { $match: { userId: userObjectId, entryDate: { $gte: startDate } } },
      {
        $group: {
          _id: '$entryDate',
          count: { $sum: 1 },
          moods: { $push: '$mood' },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const dailyAverages = dailyAveragesAgg.map((day) => {
      const totalScore = day.moods.reduce((sum, mood) => sum + (MOOD_SCORES[mood] || 0), 0);
      const avgScore = Math.round((totalScore / day.count) * 100) / 100;
      const dateStr = day._id.toISOString().split('T')[0];
      return { date: dateStr, avgScore, count: day.count };
    });

    // Recent entries (last 10)
    const recentEntries = await MoodEntry.find({ userId, entryDate: { $gte: startDate } })
      .sort({ entryDate: -1, createdAt: -1 })
      .limit(10);

    res.json({
      moodCounts,
      moodDistribution,
      dailyAverages,
      recentEntries,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getMoodInsights };
