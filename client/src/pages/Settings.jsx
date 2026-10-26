import { useAuth } from '../contexts/AuthContext';
import PageHeader from '../components/common/PageHeader';
import Button from '../components/common/Button';

export default function Settings() {
  const { user, logout } = useAuth();

  const userInitial = user?.name ? user.name.charAt(0).toUpperCase() : 'U';

  return (
    <div className="settings-page">
      <PageHeader
        title="Settings & Account"
        description="View your profile details and app preferences"
      />

      <div className="settings-section">
        <h3 className="settings-section-title">Profile Information</h3>

        <div className="settings-user-avatar">
          {userInitial}
        </div>

        <div className="settings-info-row">
          <span className="settings-info-label">Full Name</span>
          <span className="settings-info-value">{user?.name || '—'}</span>
        </div>

        <div className="settings-info-row">
          <span className="settings-info-label">Email Address</span>
          <span className="settings-info-value">{user?.email || '—'}</span>
        </div>

        <div className="settings-info-row">
          <span className="settings-info-label">Account Status</span>
          <span className="settings-info-value" style={{ color: 'var(--success)' }}>
            Active (Authenticated)
          </span>
        </div>

        <div className="settings-actions">
          <Button variant="danger" size="md" onClick={logout}>
            Sign Out of MindSpace
          </Button>
        </div>
      </div>

      <div className="settings-section">
        <h3 className="settings-section-title">About MindSpace</h3>
        <p className="settings-app-info">
          <strong>MindSpace</strong> — Personal Mood Tracker & Wellness Journal • Version 1.0.0
        </p>
        <p className="settings-disclaimer">
          MindSpace is designed as a personal self-reflection and wellness tracking companion.
          It does not provide medical diagnoses, psychological counseling, or clinical therapy.
          If you are experiencing distress, please reach out to a certified healthcare professional.
        </p>
      </div>
    </div>
  );
}
