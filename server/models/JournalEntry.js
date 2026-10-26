const mongoose = require('mongoose');

const journalEntrySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    content: {
      type: String,
      required: [true, 'Content is required'],
      maxlength: [5000, 'Content cannot exceed 5000 characters'],
    },
    mood: {
      type: String,
      enum: ['great', 'good', 'okay', 'low', 'bad'],
    },
    tags: {
      type: [
        {
          type: String,
          maxlength: [30, 'Each tag cannot exceed 30 characters'],
          lowercase: true,
          trim: true,
        },
      ],
      validate: {
        validator: function (v) {
          return v.length <= 10;
        },
        message: 'Cannot have more than 10 tags',
      },
      default: [],
    },
  },
  { timestamps: true }
);

journalEntrySchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('JournalEntry', journalEntrySchema);
