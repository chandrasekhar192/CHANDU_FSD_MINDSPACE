const mongoose = require('mongoose');

const habitCompletionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    habitId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Habit',
      required: true,
    },
    completionDate: {
      type: Date,
      required: [true, 'Completion date is required'],
    },
    completed: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

habitCompletionSchema.index({ userId: 1, habitId: 1, completionDate: 1 }, { unique: true });

module.exports = mongoose.model('HabitCompletion', habitCompletionSchema);
