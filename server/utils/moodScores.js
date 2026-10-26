/**
 * Mood score mapping utilities.
 */

const MOOD_SCORES = { great: 5, good: 4, okay: 3, low: 2, bad: 1 };
const MOOD_LABELS = { 5: 'great', 4: 'good', 3: 'okay', 2: 'low', 1: 'bad' };

function getMoodScore(mood) {
  return MOOD_SCORES[mood] || 0;
}

module.exports = { MOOD_SCORES, MOOD_LABELS, getMoodScore };
