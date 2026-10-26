import { MOOD_VALUES, MOOD_LABELS, MOOD_EMOJIS } from '../../utils/constants';

export default function MoodSelector({ value, onChange }) {
  return (
    <div className="mood-selector">
      {MOOD_VALUES.map((mood) => {
        const isSelected = value === mood;
        return (
          <button
            key={mood}
            type="button"
            className={`mood-selector-btn ${isSelected ? 'selected' : ''}`}
            onClick={() => onChange(mood)}
          >
            <span className="mood-selector-emoji">{MOOD_EMOJIS[mood]}</span>
            <span className="mood-selector-label">{MOOD_LABELS[mood]}</span>
          </button>
        );
      })}
    </div>
  );
}
