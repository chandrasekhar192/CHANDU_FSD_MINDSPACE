import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { journalAPI } from '../services/api';
import PageHeader from '../components/common/PageHeader';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorMessage from '../components/common/ErrorMessage';
import EmptyState from '../components/common/EmptyState';
import MoodBadge from '../components/mood/MoodBadge';
import { MOOD_VALUES, MOOD_LABELS } from '../utils/constants';
import { formatDate } from '../utils/dateUtils';

export default function Journal() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [selectedMood, setSelectedMood] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const navigate = useNavigate();

  const fetchEntries = async (pageNum = 1) => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page: pageNum,
        limit: 10,
      };
      if (search.trim()) params.search = search.trim();
      if (selectedMood) params.mood = selectedMood;

      const data = await journalAPI.getAll(params);
      setEntries(data.entries || []);
      setPage(data.page || 1);
      setTotalPages(data.pages || 1);
    } catch (err) {
      setError(err.message || 'Failed to load journal entries');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchEntries(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search, selectedMood]);

  return (
    <div className="journal">
      <PageHeader
        title="Wellness Journal"
        description="A private haven for self-expression, introspection, and personal growth"
        action={
          <Link to="/journal/new">
            <Button variant="primary" size="md">
              + New Journal Entry
            </Button>
          </Link>
        }
      />

      <div className="journal-filters">
        <div className="journal-search">
          <input
            type="text"
            className="form-input"
            placeholder="Search entries by title or content..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select
          className="journal-filter-select"
          value={selectedMood}
          onChange={(e) => setSelectedMood(e.target.value)}
        >
          <option value="">All Moods</option>
          {MOOD_VALUES.map((m) => (
            <option key={m} value={m}>
              {MOOD_LABELS[m]}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <LoadingSpinner message="Opening journal archive..." fullPage />
      ) : error ? (
        <ErrorMessage message={error} onRetry={() => fetchEntries(1)} />
      ) : entries.length === 0 ? (
        <Card>
          <EmptyState
            icon="📓"
            title={search || selectedMood ? 'No matching entries found' : 'Your journal is empty'}
            description={
              search || selectedMood
                ? 'Try adjusting your search keywords or mood filter.'
                : 'Writing down your feelings and experiences helps bring clarity and calm.'
            }
            actionLabel={search || selectedMood ? undefined : 'Write Your First Entry'}
            onAction={search || selectedMood ? undefined : () => navigate('/journal/new')}
          />
        </Card>
      ) : (
        <>
          <div className="journal-list">
            {entries.map((entry) => (
              <Link
                key={entry._id}
                to={`/journal/${entry._id}`}
                className="journal-card"
              >
                <div className="journal-card-header">
                  <h3 className="journal-card-title">{entry.title}</h3>
                  <span className="journal-card-date">
                    {formatDate(entry.createdAt)}
                  </span>
                </div>

                <p className="journal-card-preview">{entry.content}</p>

                <div className="journal-card-footer">
                  {entry.mood && <MoodBadge mood={entry.mood} />}
                  {entry.tags && entry.tags.length > 0 && (
                    <div className="journal-card-tags">
                      {entry.tags.map((tag) => (
                        <span key={tag} className="journal-tag">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>

          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: 'var(--spacing-sm)', marginTop: 'var(--spacing-xl)' }}>
              <Button
                variant="ghost"
                size="sm"
                disabled={page <= 1}
                onClick={() => fetchEntries(page - 1)}
              >
                Previous
              </Button>
              <span style={{ display: 'flex', alignItems: 'center', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Page {page} of {totalPages}
              </span>
              <Button
                variant="ghost"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => fetchEntries(page + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
