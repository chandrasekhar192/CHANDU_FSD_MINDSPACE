import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const NAV_ITEMS = [
  { path: '/dashboard', label: 'Dashboard', icon: '📊' },
  { path: '/mood', label: 'Mood Tracker', icon: '😊' },
  { path: '/mood-history', label: 'Mood History', icon: '📈' },
  { path: '/journal', label: 'Wellness Journal', icon: '📓' },
  { path: '/habits', label: 'Habits', icon: '✅' },
  { path: '/settings', label: 'Settings', icon: '⚙️' },
];

export default function MobileNav() {
  const [isOpen, setIsOpen] = useState(false);
  const { user, logout } = useAuth();

  const userInitial = user?.name ? user.name.charAt(0).toUpperCase() : 'U';

  const closeMenu = () => setIsOpen(false);

  return (
    <>
      <header className="mobile-header">
        <div className="mobile-header-logo">
          <span>🌿</span>
          <span>MindSpace</span>
        </div>
        <button
          className="mobile-hamburger"
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Toggle navigation menu"
        >
          ☰
        </button>
      </header>

      {isOpen && (
        <div className="mobile-sidebar-overlay" onClick={closeMenu}>
          <div className="mobile-sidebar" onClick={(e) => e.stopPropagation()}>
            <button
              className="mobile-sidebar-close"
              onClick={closeMenu}
              aria-label="Close menu"
            >
              ✕
            </button>

            <div className="sidebar-logo">
              <span className="sidebar-logo-icon">🌿</span>
              <span className="sidebar-logo-text">MindSpace</span>
            </div>

            <nav className="sidebar-nav">
              {NAV_ITEMS.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={closeMenu}
                  className={({ isActive }) =>
                    `sidebar-nav-link ${isActive ? 'active' : ''}`
                  }
                >
                  <span className="sidebar-nav-icon">{item.icon}</span>
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </nav>

            <div className="sidebar-footer">
              <div className="sidebar-user">
                <div className="sidebar-user-avatar">{userInitial}</div>
                <div className="sidebar-user-name" title={user?.name || 'User'}>
                  {user?.name || 'User'}
                </div>
              </div>
              <button
                className="sidebar-logout-btn"
                onClick={() => {
                  closeMenu();
                  logout();
                }}
              >
                Log Out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
