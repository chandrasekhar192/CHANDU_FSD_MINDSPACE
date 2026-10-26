import { MOOD_LABELS, MOOD_EMOJIS, MOOD_COLORS } from '../../utils/constants';

export default function MoodBadge({ mood }) {
  if (!mood) return null;

  const label = MOOD_LABELS[mood] || mood;
  const emoji = MOOD_EMOJIS[mood] || '😐';
  const color = MOOD_COLORS[mood] || 'var(--primary)';

  return (
    <span className="mood-badge" style={{ backgroundColor: color }}>
      <span className="mood-badge-emoji">{emoji}</span>
      <span>{label}</span>
    </span>
  );
}
