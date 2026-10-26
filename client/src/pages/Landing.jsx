import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Button from '../components/common/Button';

export default function Landing() {
  const { isAuthenticated, loading } = useAuth();

  if (!loading && isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="landing">
      <header className="landing-header">
        <div className="landing-logo">
          <span className="landing-logo-icon">🌿</span>
          <span className="landing-logo-text">MindSpace</span>
        </div>
        <div className="landing-header-actions">
          <Link to="/login">
            <Button variant="ghost" size="sm">
              Log In
            </Button>
          </Link>
          <Link to="/register">
            <Button variant="primary" size="sm">
              Get Started
            </Button>
          </Link>
        </div>
      </header>

      <section className="landing-hero">
        <h1>
          Your sanctuary for <span>mindful living</span> and emotional clarity
        </h1>
        <p className="landing-hero-subtitle">
          MindSpace helps you observe your feelings, reflect through personal journaling,
          and build supportive daily habits — all in a calm, private space designed for your well-being.
        </p>
        <div className="landing-hero-actions">
          <Link to="/register">
            <Button variant="primary" size="lg">
              Start Your Journey
            </Button>
          </Link>
          <Link to="/login">
            <Button variant="secondary" size="lg">
              Sign In
            </Button>
          </Link>
        </div>
      </section>

      <section className="landing-features">
        <h2 className="landing-features-title">Mindful Tools for Everyday Clarity</h2>
        <div className="landing-features-grid">
          <div className="landing-feature-card">
            <div className="landing-feature-icon">😊</div>
            <h3>Mood Tracking</h3>
            <p>
              Log your daily emotions with intuitive emoji-based selectors, intensity levels,
              and contextual activities. Discover patterns in how you feel over time.
            </p>
          </div>

          <div className="landing-feature-card">
            <div className="landing-feature-icon">📓</div>
            <h3>Wellness Journal</h3>
            <p>
              Express thoughts freely in your private sanctuary. Tag entries, pair them with
              your mood, and easily search your archive whenever you need reflection.
            </p>
          </div>

          <div className="landing-feature-card">
            <div className="landing-feature-icon">✅</div>
            <h3>Habit Building</h3>
            <p>
              Cultivate positive routines that nurture mental balance. Track consistent
              completion across the week and celebrate small daily victories.
            </p>
          </div>
        </div>
      </section>

      <div className="landing-disclaimer">
        <p>
          MindSpace is a personal wellness journal designed for self-reflection and habit tracking.
          It is not a diagnostic tool or substitute for professional medical or mental healthcare.
        </p>
      </div>

      <footer className="landing-footer">
        <p>&copy; {new Date().getFullYear()} MindSpace — Mood Tracker & Wellness Journal. All rights reserved.</p>
      </footer>
    </div>
  );
}
