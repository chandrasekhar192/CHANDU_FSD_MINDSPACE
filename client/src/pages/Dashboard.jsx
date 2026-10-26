import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { dashboardAPI } from '../services/api';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorMessage from '../components/common/ErrorMessage';
import MoodBadge from '../components/mood/MoodBadge';
import MoodLineChart from '../components/charts/MoodLineChart';
import { MOOD_SCORES } from '../utils/constants';
import { timeAgo } from '../utils/dateUtils';

export default function Dashboard() {
  const { user } = useAuth();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSummary = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await dashboardAPI.getSummary();
      setSummary(data);
    } catch (err) {
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const getTodayFormatted = () => {
    return new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return <LoadingSpinner message="Loading your wellness overview..." fullPage />;
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={fetchSummary} />;
  }

  // Calculate daily averages for the weekly chart from summary.weeklyMoods
  const weeklyChartData = (() => {
    if (!summary?.weeklyMoods || summary.weeklyMoods.length === 0) return [];

    const grouped = {};
    summary.weeklyMoods.forEach((entry) => {
      const dateStr = new Date(entry.entryDate).toISOString().split('T')[0];
      if (!grouped[dateStr]) {
        grouped[dateStr] = { scores: [], count: 0 };
      }
      grouped[dateStr].scores.push(MOOD_SCORES[entry.mood] || 3);
      grouped[dateStr].count += 1;
    });

    return Object.keys(grouped)
      .sort()
      .map((date) => {
        const item = grouped[date];
        const sum = item.scores.reduce((a, b) => a + b, 0);
        return {
          date,
          avgScore: Math.round((sum / item.count) * 100) / 100,
          count: item.count,
        };
      });
  })();

  const habitCompletionRate = summary?.totalHabits > 0
    ? Math.round((summary.todayCompletedHabits / summary.totalHabits) * 100)
    : 0;

  return (
    <div className="dashboard">
      <div className="dashboard-greeting">
        <h1>{getGreeting()}, {user?.name || 'Friend'}!</h1>
      </div>
      <div className="dashboard-date">{getTodayFormatted()}</div>

      {/* Stats Cards */}
      <div className="dashboard-stats">
        <div className="stat-card">
          <div className="stat-icon mood-icon">😊</div>
          <div className="stat-info">
            <div className="stat-value">{summary?.todayMoodCount || 0}</div>
            <div className="stat-label">Moods Logged Today</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon journal-icon">📓</div>
          <div className="stat-info">
            <div className="stat-value">{summary?.todayJournalCount || 0}</div>
            <div className="stat-label">Journal Entries Today</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon habit-icon">✅</div>
          <div className="stat-info">
            <div className="stat-value">
              {summary?.todayCompletedHabits || 0} / {summary?.totalHabits || 0}
            </div>
            <div className="stat-label">Habits Done ({habitCompletionRate}%)</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon active-icon">🌱</div>
          <div className="stat-info">
            <div className="stat-value">{summary?.activeHabitCount || 0}</div>
            <div className="stat-label">Active Habits</div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <Link to="/mood" className="quick-action-card">
          <div className="quick-action-icon">✨</div>
          <h3>Log Mood</h3>
          <p>Record how you're feeling right now</p>
        </Link>

        <Link to="/journal/new" className="quick-action-card">
          <div className="quick-action-icon">✍️</div>
          <h3>Write Journal</h3>
          <p>Capture your thoughts and reflections</p>
        </Link>

        <Link to="/habits" className="quick-action-card">
          <div className="quick-action-icon">🎯</div>
          <h3>Check Habits</h3>
          <p>Review and complete your daily routines</p>
        </Link>
      </div>

      {/* Main Grid: Weekly Chart & Recent Entries */}
      <div className="dashboard-grid">
        <div className="dashboard-section">
          <div className="dashboard-section-title">
            <span>📈</span>
            <span>Weekly Mood Trend</span>
          </div>
          {weeklyChartData.length > 0 ? (
            <MoodLineChart data={weeklyChartData} />
          ) : (
            <div style={{ padding: 'var(--spacing-xl) 0', textAlign: 'center', color: 'var(--text-secondary)' }}>
              <p style={{ marginBottom: 'var(--spacing-md)' }}>No mood entries logged in the past week.</p>
              <Link to="/mood">
                <Button variant="primary" size="sm">
                  Log Your First Mood
                </Button>
              </Link>
            </div>
          )}
        </div>

        <div className="dashboard-section">
          <div className="dashboard-section-title">
            <span>🕒</span>
            <span>Recent Moods</span>
          </div>
          {summary?.recentMoods && summary.recentMoods.length > 0 ? (
            <div className="recent-moods-list">
              {summary.recentMoods.map((entry) => (
                <div key={entry._id} className="recent-mood-item">
                  <MoodBadge mood={entry.mood} />
                  <div className="recent-mood-note">
                    {entry.note || (entry.activities?.length ? entry.activities.join(', ') : 'No notes')}
                  </div>
                  <div className="recent-mood-time">
                    {timeAgo(entry.createdAt || entry.entryDate)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', padding: 'var(--spacing-md) 0' }}>
              No recent mood entries. Start tracking to see your patterns!
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
