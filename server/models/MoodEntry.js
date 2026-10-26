const mongoose = require('mongoose');

const VALID_ACTIVITIES = [
  'exercise', 'meditation', 'reading', 'socializing', 'work',
  'hobby', 'nature', 'music', 'cooking', 'gaming', 'travel', 'rest',
];

const moodEntrySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    mood: {
      type: String,
      required: [true, 'Mood is required'],
      enum: ['great', 'good', 'okay', 'low', 'bad'],
    },
    intensity: {
      type: Number,
      required: [true, 'Intensity is required'],
      min: [1, 'Intensity must be at least 1'],
      max: [10, 'Intensity cannot exceed 10'],
    },
    note: {
      type: String,
      maxlength: [500, 'Note cannot exceed 500 characters'],
      default: '',
    },
    activities: {
      type: [
        {
          type: String,
          enum: VALID_ACTIVITIES,
        },
      ],
      default: [],
    },
    energyLevel: {
      type: Number,
      min: [1, 'Energy level must be at least 1'],
      max: [5, 'Energy level cannot exceed 5'],
    },
    entryDate: {
      type: Date,
      required: [true, 'Entry date is required'],
    },
  },
  { timestamps: true }
);

moodEntrySchema.index({ userId: 1, entryDate: -1 });

module.exports = mongoose.model('MoodEntry', moodEntrySchema);
