import { useState, useEffect } from 'react';
import { insightsAPI, moodsAPI } from '../services/api';
import PageHeader from '../components/common/PageHeader';
import Card from '../components/common/Card';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorMessage from '../components/common/ErrorMessage';
import MoodBadge from '../components/mood/MoodBadge';
import MoodLineChart from '../components/charts/MoodLineChart';
import MoodDistributionChart from '../components/charts/MoodDistributionChart';
import { MOOD_VALUES, MOOD_LABELS } from '../utils/constants';
import { formatDate } from '../utils/dateUtils';

export default function MoodHistory() {
  const [period, setPeriod] = useState('week'); // 'week' or 'month'
  const [selectedMoodFilter, setSelectedMoodFilter] = useState('');
  const [insights, setInsights] = useState(null);
  const [filteredEntries, setFilteredEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchInsights = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await insightsAPI.getMoodInsights(period);
      setInsights(data);
    } catch (err) {
      setError(err.message || 'Failed to load mood history insights');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInsights();
  }, [period]);

  // Fetch entries with filter if a mood filter is applied
  useEffect(() => {
    if (!insights) return;

    if (!selectedMoodFilter) {
      setFilteredEntries(insights.recentEntries || []);
    } else {
      setFilteredEntries(
        (insights.recentEntries || []).filter((e) => e.mood === selectedMoodFilter)
      );
    }
  }, [insights, selectedMoodFilter]);

  if (loading) {
    return <LoadingSpinner message="Calculating mood insights..." fullPage />;
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={fetchInsights} />;
  }

  const hasData = (insights?.recentEntries && insights.recentEntries.length > 0) ||
    (insights?.dailyAverages && insights.dailyAverages.length > 0);

  return (
    <div className="mood-history">
      <PageHeader
        title="Mood History & Analytics"
        description="Reflect on emotional patterns, averages, and distributions over time"
      />

      <div className="mood-history-controls">
        <div className="period-toggle">
          <button
            type="button"
            className={`period-toggle-btn ${period === 'week' ? 'active' : ''}`}
            onClick={() => setPeriod('week')}
          >
            Past 7 Days
          </button>
          <button
            type="button"
            className={`period-toggle-btn ${period === 'month' ? 'active' : ''}`}
            onClick={() => setPeriod('month')}
          >
            Past 30 Days
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
          <label htmlFor="mood-filter-select" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Filter by Mood:
          </label>
          <select
            id="mood-filter-select"
            className="form-input"
            style={{ width: 'auto', padding: '6px 12px' }}
            value={selectedMoodFilter}
            onChange={(e) => setSelectedMoodFilter(e.target.value)}
          >
            <option value="">All Moods</option>
            {MOOD_VALUES.map((m) => (
              <option key={m} value={m}>
                {MOOD_LABELS[m]}
              </option>
            ))}
          </select>
        </div>
      </div>

      {!hasData ? (
        <Card>
          <div style={{ textAlign: 'center', padding: 'var(--spacing-2xl) var(--spacing-lg)' }}>
            <span style={{ fontSize: '3rem', display: 'block', marginBottom: 'var(--spacing-md)' }}>📊</span>
            <h3 style={{ fontSize: '1.2rem', marginBottom: 'var(--spacing-sm)' }}>No Data for this Period</h3>
            <p style={{ color: 'var(--text-secondary)', maxWidth: 400, margin: '0 auto' }}>
              Check back once you log your emotions in the Mood Tracker to view analytics and distribution trends.
            </p>
          </div>
        </Card>
      ) : (
        <>
          {/* Charts Row */}
          <div className="mood-history-charts">
            <div className="mood-history-section">
              <h3 className="mood-history-section-title">
                📈 Daily Average Mood Score (1 = Bad, 5 = Great)
              </h3>
              <MoodLineChart data={insights?.dailyAverages || []} />
            </div>

            <div className="mood-history-section">
              <h3 className="mood-history-section-title">
                🍰 Mood Frequency & Distribution
              </h3>
              <MoodDistributionChart data={insights?.moodDistribution || []} />
            </div>
          </div>

          {/* Entries Table/List */}
          <div className="mood-history-section">
            <h3 className="mood-history-section-title">
              📋 Recorded Check-ins ({filteredEntries.length})
            </h3>
            {filteredEntries.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)', padding: 'var(--spacing-md) 0' }}>
                No entries match the selected filter.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
                {filteredEntries.map((entry) => (
                  <div
                    key={entry._id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: 'var(--spacing-md)',
                      background: 'var(--bg-main)',
                      borderRadius: 'var(--radius-sm)',
                      flexWrap: 'wrap',
                      gap: 'var(--spacing-sm)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
                      <MoodBadge mood={entry.mood} />
                      <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>
                        Intensity: {entry.intensity}/10
                      </span>
                      {entry.note && (
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          "{entry.note}"
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}>
                      {formatDate(entry.entryDate || entry.createdAt)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
