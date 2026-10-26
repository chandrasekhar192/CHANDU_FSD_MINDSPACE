import { useState, useEffect } from 'react';
import { moodsAPI } from '../services/api';
import PageHeader from '../components/common/PageHeader';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorMessage from '../components/common/ErrorMessage';
import EmptyState from '../components/common/EmptyState';
import ConfirmDialog from '../components/common/ConfirmDialog';
import MoodSelector from '../components/mood/MoodSelector';
import MoodCard from '../components/mood/MoodCard';
import { ACTIVITIES, ENERGY_LEVELS } from '../utils/constants';

export default function MoodTracker() {
  // Form State
  const [mood, setMood] = useState('good');
  const [intensity, setIntensity] = useState(7);
  const [note, setNote] = useState('');
  const [selectedActivities, setSelectedActivities] = useState([]);
  const [energyLevel, setEnergyLevel] = useState(3);
  const [editingId, setEditingId] = useState(null);

  // Status State
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  // List State
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Delete Dialog State
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchEntries = async (pageNum = 1, append = false) => {
    try {
      if (!append) setLoading(true);
      setError(null);
      const data = await moodsAPI.getAll({ page: pageNum, limit: 10 });
      if (append) {
        setEntries((prev) => [...prev, ...(data.moods || [])]);
      } else {
        setEntries(data.moods || []);
      }
      setPage(data.page || 1);
      setTotalPages(data.pages || 1);
    } catch (err) {
      setError(err.message || 'Failed to fetch mood entries');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEntries(1);
  }, []);

  const toggleActivity = (actValue) => {
    setSelectedActivities((prev) =>
      prev.includes(actValue)
        ? prev.filter((a) => a !== actValue)
        : [...prev, actValue]
    );
  };

  const resetForm = () => {
    setMood('good');
    setIntensity(7);
    setNote('');
    setSelectedActivities([]);
    setEnergyLevel(3);
    setEditingId(null);
    setFormError('');
  };

  const handleEdit = (entry) => {
    setEditingId(entry._id);
    setMood(entry.mood || 'good');
    setIntensity(entry.intensity || 5);
    setNote(entry.note || '');
    setSelectedActivities(entry.activities || []);
    setEnergyLevel(entry.energyLevel || 3);
    setFormSuccess('');
    setFormError('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (saving) return;

    setFormError('');
    setFormSuccess('');

    if (!mood) {
      setFormError('Please select a mood.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        mood,
        intensity: Number(intensity),
        note: note.trim(),
        activities: selectedActivities,
        energyLevel: Number(energyLevel),
      };

      if (editingId) {
        await moodsAPI.update(editingId, payload);
        setFormSuccess('Mood entry updated successfully!');
      } else {
        await moodsAPI.create(payload);
        setFormSuccess('Mood logged successfully!');
      }

      resetForm();
      fetchEntries(1);
    } catch (err) {
      setFormError(err.message || 'Failed to save mood entry.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await moodsAPI.delete(deleteTarget._id);
      setEntries((prev) => prev.filter((e) => e._id !== deleteTarget._id));
      setDeleteTarget(null);
      if (editingId === deleteTarget._id) {
        resetForm();
      }
    } catch (err) {
      alert(err.message || 'Failed to delete mood entry');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="mood-tracker">
      <PageHeader
        title="Mood Tracker"
        description="Check in with yourself and log your emotions throughout the day"
      />

      <div className="mood-tracker-grid">
        {/* Form Card */}
        <Card>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 600, marginBottom: 'var(--spacing-md)' }}>
            {editingId ? 'Edit Mood Entry' : 'How are you feeling right now?'}
          </h2>

          {formSuccess && <div className="auth-success" style={{ marginBottom: 'var(--spacing-md)' }}>{formSuccess}</div>}
          {formError && <div className="auth-error" style={{ marginBottom: 'var(--spacing-md)' }}>{formError}</div>}

          <form onSubmit={handleSubmit} className="mood-form">
            <div className="mood-form-section">
              <label className="mood-form-label">Select Mood</label>
              <MoodSelector value={mood} onChange={setMood} />
            </div>

            <div className="mood-form-section">
              <label className="mood-form-label">
                Intensity: {intensity} / 10
              </label>
              <div className="intensity-slider-container">
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={intensity}
                  onChange={(e) => setIntensity(Number(e.target.value))}
                  className="intensity-slider"
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-light)' }}>
                  <span>Gentle (1)</span>
                  <span>Moderate (5)</span>
                  <span>Very Intense (10)</span>
                </div>
              </div>
            </div>

            <div className="mood-form-section">
              <label className="mood-form-label">What have you been doing?</label>
              <div className="activities-grid">
                {ACTIVITIES.map((act) => {
                  const isSelected = selectedActivities.includes(act.value);
                  return (
                    <button
                      key={act.value}
                      type="button"
                      className={`activity-chip ${isSelected ? 'selected' : ''}`}
                      onClick={() => toggleActivity(act.value)}
                    >
                      <span className="activity-chip-icon">{act.icon}</span>
                      <span>{act.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mood-form-section">
              <label className="mood-form-label">Energy Level</label>
              <div className="energy-selector">
                {ENERGY_LEVELS.map((lvl) => (
                  <button
                    key={lvl.value}
                    type="button"
                    className={`energy-btn ${energyLevel === lvl.value ? 'selected' : ''}`}
                    onClick={() => setEnergyLevel(lvl.value)}
                  >
                    <span>{lvl.icon}</span>
                    <span>{lvl.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="mood-form-section">
              <label className="mood-form-label" htmlFor="mood-note">
                Personal Note (Optional)
              </label>
              <textarea
                id="mood-note"
                className="form-input"
                rows="3"
                maxLength="500"
                placeholder="What contributed to this mood? Any reflections?"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
              <div style={{ textAlign: 'right', fontSize: '0.75rem', color: 'var(--text-light)' }}>
                {note.length} / 500
              </div>
            </div>

            <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
              <Button
                type="submit"
                variant="primary"
                size="md"
                loading={saving}
                disabled={saving}
                fullWidth
              >
                {editingId ? 'Update Entry' : 'Log Mood'}
              </Button>
              {editingId && (
                <Button
                  type="button"
                  variant="ghost"
                  size="md"
                  onClick={resetForm}
                  disabled={saving}
                >
                  Cancel
                </Button>
              )}
            </div>
          </form>
        </Card>

        {/* Entries List */}
        <div>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 600, marginBottom: 'var(--spacing-md)' }}>
            Recent Mood Check-ins
          </h2>

          {loading && entries.length === 0 ? (
            <LoadingSpinner message="Loading entries..." />
          ) : error && entries.length === 0 ? (
            <ErrorMessage message={error} onRetry={() => fetchEntries(1)} />
          ) : entries.length === 0 ? (
            <Card>
              <EmptyState
                icon="😊"
                title="No moods logged yet"
                description="Your check-in history will appear here once you log your first mood."
              />
            </Card>
          ) : (
            <div className="mood-entries-list">
              {entries.map((entry) => (
                <MoodCard
                  key={entry._id}
                  entry={entry}
                  onEdit={handleEdit}
                  onDelete={(e) => setDeleteTarget(e)}
                />
              ))}

              {page < totalPages && (
                <Button
                  variant="secondary"
                  size="sm"
                  className="load-more-btn"
                  onClick={() => fetchEntries(page + 1, true)}
                >
                  Load More Entries
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Delete Mood Entry"
        message="Are you sure you want to remove this mood check-in? This action cannot be undone."
        confirmLabel={deleting ? 'Deleting...' : 'Delete'}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
