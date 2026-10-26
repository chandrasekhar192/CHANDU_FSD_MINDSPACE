import { useState, useEffect } from 'react';
import { habitsAPI } from '../services/api';
import PageHeader from '../components/common/PageHeader';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorMessage from '../components/common/ErrorMessage';
import EmptyState from '../components/common/EmptyState';
import ConfirmDialog from '../components/common/ConfirmDialog';
import { getTodayUTC, getDateRangeUTC, formatShortDate } from '../utils/dateUtils';

export default function Habits() {
  const [habits, setHabits] = useState([]);
  const [completions, setCompletions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showInactive, setShowInactive] = useState(false);

  // New Habit Form
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  // Inline Edit State
  const [editingHabitId, setEditingHabitId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [updating, setUpdating] = useState(false);

  // Delete State
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Calculate past 7 days dates in UTC
  const past7Days = (() => {
    const dates = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() - i));
      dates.push(d.toISOString().split('T')[0]);
    }
    return dates;
  })();

  const todayStr = getTodayUTC();

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const range = getDateRangeUTC(7);
      const [habitsData, completionsData] = await Promise.all([
        habitsAPI.getAll(),
        habitsAPI.getCompletions(range),
      ]);
      setHabits(habitsData.habits || []);
      setCompletions(completionsData.completions || []);
    } catch (err) {
      setError(err.message || 'Failed to load habits');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newName.trim()) {
      setCreateError('Habit name is required');
      return;
    }

    setCreating(true);
    setCreateError('');
    try {
      const res = await habitsAPI.create({
        name: newName.trim(),
        description: newDesc.trim(),
      });
      setHabits((prev) => [res.habit, ...prev]);
      setNewName('');
      setNewDesc('');
    } catch (err) {
      setCreateError(err.message || 'Failed to create habit');
    } finally {
      setCreating(false);
    }
  };

  const isCompletedOnDate = (habitId, dateStr) => {
    return completions.some((c) => {
      const cDateStr = new Date(c.completionDate).toISOString().split('T')[0];
      const cHabitId = typeof c.habitId === 'object' ? c.habitId?._id : c.habitId;
      return String(cHabitId) === String(habitId) && cDateStr === dateStr && c.completed;
    });
  };

  const handleToggleToday = async (habitId) => {
    const currentlyCompleted = isCompletedOnDate(habitId, todayStr);
    const nextState = !currentlyCompleted;

    // Optimistic update
    setCompletions((prev) => {
      const filtered = prev.filter((c) => {
        const cDateStr = new Date(c.completionDate).toISOString().split('T')[0];
        const cHabitId = typeof c.habitId === 'object' ? c.habitId?._id : c.habitId;
        return !(String(cHabitId) === String(habitId) && cDateStr === todayStr);
      });
      return [
        ...filtered,
        {
          habitId,
          completionDate: new Date(todayStr),
          completed: nextState,
        },
      ];
    });

    try {
      await habitsAPI.toggleCompletion(habitId, {
        date: todayStr,
        completed: nextState,
      });
    } catch (err) {
      // Revert on failure
      fetchData();
      alert(err.message || 'Failed to update habit completion');
    }
  };

  const startEdit = (habit) => {
    setEditingHabitId(habit._id);
    setEditName(habit.name || '');
    setEditDesc(habit.description || '');
  };

  const handleSaveEdit = async (habitId) => {
    if (!editName.trim()) return;

    setUpdating(true);
    try {
      const res = await habitsAPI.update(habitId, {
        name: editName.trim(),
        description: editDesc.trim(),
      });
      setHabits((prev) =>
        prev.map((h) => (h._id === habitId ? res.habit : h))
      );
      setEditingHabitId(null);
    } catch (err) {
      alert(err.message || 'Failed to update habit');
    } finally {
      setUpdating(false);
    }
  };

  const handleToggleActive = async (habit) => {
    try {
      const res = await habitsAPI.update(habit._id, {
        isActive: !habit.isActive,
      });
      setHabits((prev) =>
        prev.map((h) => (h._id === habit._id ? res.habit : h))
      );
    } catch (err) {
      alert(err.message || 'Failed to change habit status');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await habitsAPI.delete(deleteTarget._id);
      setHabits((prev) => prev.filter((h) => h._id !== deleteTarget._id));
      setCompletions((prev) =>
        prev.filter((c) => {
          const cHabitId = typeof c.habitId === 'object' ? c.habitId?._id : c.habitId;
          return String(cHabitId) !== String(deleteTarget._id);
        })
      );
      setDeleteTarget(null);
    } catch (err) {
      alert(err.message || 'Failed to delete habit');
    } finally {
      setDeleting(false);
    }
  };

  const displayedHabits = showInactive
    ? habits
    : habits.filter((h) => h.isActive);

  return (
    <div className="habits">
      <PageHeader
        title="Habit Builder"
        description="Cultivate consistent, nourishing routines for your mind and body"
      />

      {/* Add Habit Card */}
      <Card className="habits-add-form">
        <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 'var(--spacing-md)' }}>
          Create a New Routine
        </h3>

        {createError && <div className="auth-error" style={{ marginBottom: 'var(--spacing-md)' }}>{createError}</div>}

        <form onSubmit={handleCreate} className="habits-add-form-inner">
          <div className="form-group">
            <input
              type="text"
              className="form-input"
              placeholder="Habit Name (e.g. 10m Meditation, Morning Walk)"
              value={newName}
              onChange={(e) => {
                setNewName(e.target.value);
                if (createError) setCreateError('');
              }}
              maxLength="100"
            />
          </div>

          <div className="form-group">
            <input
              type="text"
              className="form-input"
              placeholder="Description or intention (optional)"
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              maxLength="300"
            />
          </div>

          <Button
            type="submit"
            variant="primary"
            size="md"
            loading={creating}
            disabled={creating}
          >
            + Add Habit
          </Button>
        </form>
      </Card>

      {/* Habits List */}
      {loading ? (
        <LoadingSpinner message="Checking habits..." fullPage />
      ) : error ? (
        <ErrorMessage message={error} onRetry={fetchData} />
      ) : displayedHabits.length === 0 ? (
        <Card>
          <EmptyState
            icon="🎯"
            title={habits.length === 0 ? 'No habits created yet' : 'No active habits'}
            description="Start building consistency by adding your first daily routine above."
          />
        </Card>
      ) : (
        <div className="habits-list">
          {displayedHabits.map((habit) => {
            const todayDone = isCompletedOnDate(habit._id, todayStr);
            const weekCompletionsCount = past7Days.filter((d) =>
              isCompletedOnDate(habit._id, d)
            ).length;

            return (
              <div key={habit._id} className="habit-card">
                <div className="habit-card-header">
                  <div className="habit-card-info">
                    <h4 className="habit-card-name">
                      {habit.name} {!habit.isActive && <span style={{ fontSize: '0.75rem', color: 'var(--text-light)', fontWeight: 400 }}>(Inactive)</span>}
                    </h4>
                    {habit.description && (
                      <p className="habit-card-desc">{habit.description}</p>
                    )}
                  </div>

                  <div className="habit-card-actions">
                    <button
                      type="button"
                      className="habit-action-btn"
                      onClick={() => startEdit(habit)}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="habit-action-btn"
                      onClick={() => handleToggleActive(habit)}
                    >
                      {habit.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                    <button
                      type="button"
                      className="habit-action-btn delete"
                      onClick={() => setDeleteTarget(habit)}
                    >
                      Delete
                    </button>
                  </div>
                </div>

                {editingHabitId === habit._id && (
                  <div className="habit-edit-form">
                    <div className="form-group">
                      <input
                        type="text"
                        className="form-input"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        placeholder="Habit name"
                        maxLength="100"
                      />
                    </div>
                    <div className="form-group">
                      <input
                        type="text"
                        className="form-input"
                        value={editDesc}
                        onChange={(e) => setEditDesc(e.target.value)}
                        placeholder="Description"
                        maxLength="300"
                      />
                    </div>
                    <Button
                      variant="primary"
                      size="sm"
                      loading={updating}
                      onClick={() => handleSaveEdit(habit._id)}
                    >
                      Save
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingHabitId(null)}
                    >
                      Cancel
                    </Button>
                  </div>
                )}

                <div className="habit-card-body">
                  <div className="habit-today">
                    <button
                      type="button"
                      className={`habit-checkbox ${todayDone ? 'completed' : ''}`}
                      onClick={() => handleToggleToday(habit._id)}
                      title={todayDone ? 'Mark as incomplete for today' : 'Mark as completed for today'}
                    >
                      {todayDone ? '✓' : ''}
                    </button>
                    <span className="habit-today-label">
                      {todayDone ? 'Done today! 🎉' : 'Mark done for today'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)' }}>
                    <span className="habit-week-label">Last 7 days:</span>
                    <div className="habit-week-dots">
                      {past7Days.map((dateStr) => {
                        const done = isCompletedOnDate(habit._id, dateStr);
                        return (
                          <div
                            key={dateStr}
                            className={`habit-dot ${done ? 'completed' : ''}`}
                            title={`${formatShortDate(dateStr)}: ${done ? 'Completed' : 'Missed'}`}
                          />
                        );
                      })}
                    </div>
                  </div>

                  <div className="habit-streak">
                    Completed <span className="habit-streak-count">{weekCompletionsCount} of 7</span> days this week
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {habits.some((h) => !h.isActive) && (
        <div className="habits-toggle-inactive">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowInactive(!showInactive)}
          >
            {showInactive ? 'Hide Inactive Habits' : 'Show Inactive Habits'}
          </Button>
        </div>
      )}

      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Delete Habit"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? All its completion history will also be permanently deleted.`}
        confirmLabel={deleting ? 'Deleting...' : 'Delete Habit'}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
