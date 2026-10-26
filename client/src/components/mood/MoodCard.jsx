import MoodBadge from './MoodBadge';
import { MOOD_COLORS, ACTIVITIES, ENERGY_LEVELS } from '../../utils/constants';
import { formatDateTime } from '../../utils/dateUtils';

export default function MoodCard({ entry, onEdit, onDelete }) {
  if (!entry) return null;

  const color = MOOD_COLORS[entry.mood] || 'var(--primary)';
  const intensityPercent = ((entry.intensity || 5) / 10) * 100;

  const getActivityLabel = (actVal) => {
    const found = ACTIVITIES.find((a) => a.value === actVal);
    return found ? `${found.icon} ${found.label}` : actVal;
  };

  const getEnergyLabel = (lvl) => {
    const found = ENERGY_LEVELS.find((e) => e.value === lvl);
    return found ? `${found.icon} ${found.label}` : `Level ${lvl}`;
  };

  return (
    <div className="mood-card">
      <div className="mood-card-header">
        <div className="mood-card-header-left">
          <MoodBadge mood={entry.mood} />
          <span className="mood-card-date">
            {formatDateTime(entry.createdAt || entry.entryDate)}
          </span>
        </div>
        <div className="mood-card-actions">
          {onEdit && (
            <button
              type="button"
              className="mood-card-action-btn"
              onClick={() => onEdit(entry)}
              title="Edit mood entry"
            >
              ✏️
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              className="mood-card-action-btn delete"
              onClick={() => onDelete(entry)}
              title="Delete mood entry"
            >
              🗑️
            </button>
          )}
        </div>
      </div>

      <div className="mood-card-intensity">
        <div className="intensity-bar">
          <div
            className="intensity-bar-fill"
            style={{ width: `${intensityPercent}%`, backgroundColor: color }}
          />
        </div>
        <div className="intensity-label">Intensity: {entry.intensity}/10</div>
      </div>

      {entry.note && <p className="mood-card-note">{entry.note}</p>}

      {entry.activities && entry.activities.length > 0 && (
        <div className="mood-card-tags">
          {entry.activities.map((act) => (
            <span key={act} className="mood-card-tag">
              {getActivityLabel(act)}
            </span>
          ))}
        </div>
      )}

      {entry.energyLevel && (
        <div className="mood-card-energy">
          Energy: {getEnergyLabel(entry.energyLevel)}
        </div>
      )}
    </div>
  );
}
