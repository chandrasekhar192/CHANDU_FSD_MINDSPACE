import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { journalAPI } from '../services/api';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorMessage from '../components/common/ErrorMessage';
import MoodSelector from '../components/mood/MoodSelector';

export default function JournalEditor() {
  const { id } = useParams();
  const isEditing = Boolean(id);
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [mood, setMood] = useState('');
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');

  const [initialLoading, setInitialLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    if (isEditing) {
      const fetchEntry = async () => {
        try {
          const data = await journalAPI.getById(id);
          const entry = data.entry || data;
          setTitle(entry.title || '');
          setContent(entry.content || '');
          setMood(entry.mood || '');
          setTags(entry.tags || []);
        } catch (err) {
          setError(err.message || 'Failed to load journal entry');
        } finally {
          setInitialLoading(false);
        }
      };
      fetchEntry();
    }
  }, [id, isEditing]);

  const handleAddTag = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const cleanTag = tagInput.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
      if (cleanTag && !tags.includes(cleanTag) && tags.length < 10) {
        setTags([...tags, cleanTag]);
      }
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const validate = () => {
    const errors = {};
    if (!title.trim()) {
      errors.title = 'Title is required';
    } else if (title.trim().length > 200) {
      errors.title = 'Title must be 200 characters or less';
    }

    if (!content.trim()) {
      errors.content = 'Journal content cannot be empty';
    } else if (content.trim().length > 5000) {
      errors.content = 'Content must be 5000 characters or less';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (saving) return;

    if (!validate()) return;

    setSaving(true);
    setError(null);

    const payload = {
      title: title.trim(),
      content: content.trim(),
      mood: mood || undefined,
      tags,
    };

    try {
      if (isEditing) {
        await journalAPI.update(id, payload);
        navigate(`/journal/${id}`);
      } else {
        const created = await journalAPI.create(payload);
        const newId = created?.entry?._id;
        navigate(newId ? `/journal/${newId}` : '/journal');
      }
    } catch (err) {
      setError(err.message || 'Failed to save journal entry');
      setSaving(false);
    }
  };

  if (initialLoading) {
    return <LoadingSpinner message="Loading journal entry..." fullPage />;
  }

  return (
    <div className="journal-editor">
      <div style={{ marginBottom: 'var(--spacing-md)' }}>
        <Link to={isEditing ? `/journal/${id}` : '/journal'} style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', textDecoration: 'none' }}>
          ← Back to {isEditing ? 'entry' : 'journal list'}
        </Link>
      </div>

      <Card>
        <h2 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: 'var(--spacing-lg)' }}>
          {isEditing ? 'Edit Journal Entry' : 'New Journal Entry'}
        </h2>

        {error && <div className="auth-error" style={{ marginBottom: 'var(--spacing-lg)' }}>{error}</div>}

        <form onSubmit={handleSubmit} className="journal-editor-form">
          <div className="form-group">
            <input
              type="text"
              className="journal-editor-title"
              placeholder="Give your thoughts a title..."
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (formErrors.title) setFormErrors({ ...formErrors, title: '' });
              }}
              maxLength="200"
              autoFocus
            />
            {formErrors.title && <span className="form-error-text">{formErrors.title}</span>}
          </div>

          <div className="form-group">
            <textarea
              className="form-input journal-editor-content"
              placeholder="Write freely... How was your day? What insights or emotions are present right now?"
              value={content}
              onChange={(e) => {
                setContent(e.target.value);
                if (formErrors.content) setFormErrors({ ...formErrors, content: '' });
              }}
              maxLength="5000"
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-light)', marginTop: 4 }}>
              {formErrors.content ? (
                <span className="form-error-text">{formErrors.content}</span>
              ) : <span />}
              <span>{content.length} / 5000</span>
            </div>
          </div>

          <div className="journal-editor-meta">
            <div>
              <label className="form-label" style={{ marginBottom: 'var(--spacing-xs)', display: 'block' }}>
                Associated Mood (Optional)
              </label>
              <MoodSelector
                value={mood}
                onChange={(m) => setMood(m === mood ? '' : m)}
              />
              {mood && (
                <button
                  type="button"
                  style={{ background: 'none', border: 'none', color: 'var(--text-light)', fontSize: '0.75rem', cursor: 'pointer', marginTop: 4 }}
                  onClick={() => setMood('')}
                >
                  Clear mood selection
                </button>
              )}
            </div>

            <div className="journal-tags-input-container">
              <label className="form-label">
                Tags (Press Enter or Comma to add)
              </label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. gratitude, nature, work"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleAddTag}
                disabled={tags.length >= 10}
              />
              {tags.length > 0 && (
                <div className="journal-tags-display">
                  {tags.map((tag) => (
                    <span key={tag} className="journal-tag-removable">
                      #{tag}
                      <button
                        type="button"
                        className="journal-tag-remove"
                        onClick={() => handleRemoveTag(tag)}
                        title="Remove tag"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="journal-editor-actions">
            <Button
              type="button"
              variant="ghost"
              size="md"
              disabled={saving}
              onClick={() => navigate(isEditing ? `/journal/${id}` : '/journal')}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              loading={saving}
              disabled={saving}
            >
              {isEditing ? 'Save Changes' : 'Publish Entry'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
