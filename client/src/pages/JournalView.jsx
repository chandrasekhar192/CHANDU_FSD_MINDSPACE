import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { journalAPI } from '../services/api';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorMessage from '../components/common/ErrorMessage';
import ConfirmDialog from '../components/common/ConfirmDialog';
import MoodBadge from '../components/mood/MoodBadge';
import { formatDateTime } from '../utils/dateUtils';

export default function JournalView() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [entry, setEntry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchEntry = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await journalAPI.getById(id);
      setEntry(data.entry || data);
    } catch (err) {
      setError(err.message || 'Journal entry not found');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEntry();
  }, [id]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await journalAPI.delete(id);
      navigate('/journal');
    } catch (err) {
      alert(err.message || 'Failed to delete entry');
      setDeleting(false);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Reading journal entry..." fullPage />;
  }

  if (error || !entry) {
    return (
      <div>
        <div style={{ marginBottom: 'var(--spacing-md)' }}>
          <Link to="/journal" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>
            ← Back to journal
          </Link>
        </div>
        <ErrorMessage message={error || 'Entry not found'} onRetry={fetchEntry} />
      </div>
    );
  }

  return (
    <div className="journal-view">
      <div className="journal-view-back">
        <Link to="/journal" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.9rem' }}>
          ← Back to journal
        </Link>
      </div>

      <Card>
        <div className="journal-view-header">
          <h1 className="journal-view-title">{entry.title}</h1>
          <div className="journal-view-meta">
            <span>Written {formatDateTime(entry.createdAt)}</span>
            {entry.updatedAt && entry.updatedAt !== entry.createdAt && (
              <span>• Edited {formatDateTime(entry.updatedAt)}</span>
            )}
            {entry.mood && (
              <span>
                • <MoodBadge mood={entry.mood} />
              </span>
            )}
          </div>
        </div>

        <div className="journal-view-content">
          {entry.content}
        </div>

        {entry.tags && entry.tags.length > 0 && (
          <div className="journal-view-tags">
            {entry.tags.map((tag) => (
              <span key={tag} className="journal-tag">
                #{tag}
              </span>
            ))}
          </div>
        )}

        <div className="journal-view-actions">
          <Link to={`/journal/edit/${entry._id}`}>
            <Button variant="secondary" size="md">
              ✏️ Edit Entry
            </Button>
          </Link>
          <Button
            variant="danger"
            size="md"
            onClick={() => setShowDeleteDialog(true)}
          >
            🗑️ Delete Entry
          </Button>
        </div>
      </Card>

      <ConfirmDialog
        isOpen={showDeleteDialog}
        title="Delete Journal Entry"
        message="Are you sure you want to permanently delete this entry? This reflection cannot be recovered."
        confirmLabel={deleting ? 'Deleting...' : 'Delete Permanently'}
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteDialog(false)}
      />
    </div>
  );
}
