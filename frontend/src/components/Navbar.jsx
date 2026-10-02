import { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getUnreadCount } from '../api/notificationApi';

const patientNav = [
  { to: '/patient/dashboard', label: 'Dashboard' },
  { to: '/patient/book', label: 'Book Visit' },
  { to: '/patient/appointments', label: 'Appointments' },
  { to: '/patient/profile', label: 'Profile' },
];

const doctorNav = [
  { to: '/doctor/dashboard', label: 'Dashboard' },
  { to: '/doctor/appointments', label: 'Clinical Schedule' },
  { to: '/doctor/profile', label: 'Profile' },
];

const adminNav = [
  { to: '/admin/dashboard', label: 'Dashboard' },
  { to: '/admin/departments', label: 'Departments' },
  { to: '/admin/doctors', label: 'Doctors' },
  { to: '/admin/appointments', label: 'Appointments' },
  { to: '/admin/profile', label: 'Profile' },
];

function initials(name = '') {
  return name.split(' ').map(w => w[0]).filter(Boolean).join('').slice(0, 2).toUpperCase() || 'U';
}

function roleLabel(roles = []) {
  if (roles.includes('ROLE_ADMIN')) return 'Administrator';
  if (roles.includes('ROLE_DOCTOR')) return 'Doctor';
  return 'Patient';
}

export default function Navbar() {
  const { user, logout, hasRole } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [unread, setUnread] = useState(0);
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = hasRole('ROLE_ADMIN') ? adminNav
    : hasRole('ROLE_DOCTOR') ? doctorNav
      : patientNav;

  const notifPath = hasRole('ROLE_ADMIN') ? '/admin/notifications'
    : hasRole('ROLE_DOCTOR') ? '/doctor/notifications'
      : '/patient/notifications';

  const profilePath = hasRole('ROLE_ADMIN') ? '/admin/profile'
    : hasRole('ROLE_DOCTOR') ? '/doctor/profile'
      : '/patient/profile';

  useEffect(() => {
    getUnreadCount()
      .then(r => setUnread(r.data?.count || 0))
      .catch(() => { });
  }, [location.pathname]);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isPatient = hasRole('ROLE_PATIENT') && !hasRole('ROLE_ADMIN') && !hasRole('ROLE_DOCTOR');

  return (
    <header className="navbar-root">
      <div className="navbar-container">
        <div className="navbar-brand">
          <NavLink to="/" className="brand-link" aria-label="MediBook Home">
            <span className="brand-mark-text">MB</span>
            <div className="brand-text-group">
              <span className="brand-name">MediBook</span>
              <span className="brand-badge">{roleLabel(user?.roles)}</span>
            </div>
          </NavLink>
        </div>

        <nav className="navbar-nav-desktop" aria-label="Main Navigation">
          {navItems.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => `navbar-link ${isActive ? 'active' : ''}`}
            >
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="navbar-actions">
          {isPatient && (
            <NavLink to="/patient/book" className="btn-nav-action" title="Quick Appointment Booking">
              <span>+ Book Appointment</span>
            </NavLink>
          )}

          <button
            className={`navbar-text-btn ${location.pathname === notifPath ? 'active' : ''}`}
            onClick={() => navigate(notifPath)}
            title="Notifications"
            aria-label="View notifications"
          >
            <span>Alerts</span>
            {unread > 0 && (
              <span className="navbar-notif-badge">
                {unread > 99 ? '99+' : unread}
              </span>
            )}
          </button>

          <div className="navbar-user-chip">
            <NavLink
              to={profilePath}
              style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', textDecoration: 'none', color: 'inherit' }}
              title="View & Edit Profile"
            >
              <div className="user-avatar-pill">
                {initials(user?.name)}
              </div>
              <div className="user-meta">
                <span className="user-display-name">{user?.name || 'User'}</span>
                <span className="user-role-tag">{roleLabel(user?.roles)}</span>
              </div>
            </NavLink>
            <button
              className="navbar-logout-btn"
              onClick={handleLogout}
              title="Sign out"
              aria-label="Sign out of account"
            >
              Sign out
            </button>
          </div>

          <button
            className="navbar-mobile-toggle"
            onClick={() => setMobileOpen(prev => !prev)}
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? 'Close' : 'Menu'}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="navbar-mobile-drawer">
          <nav className="navbar-mobile-nav">
            <div className="mobile-section-label">Navigation</div>
            {navItems.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) => `mobile-nav-link ${isActive ? 'active' : ''}`}
              >
                <span>{label}</span>
              </NavLink>
            ))}

            <NavLink
              to={notifPath}
              className={({ isActive }) => `mobile-nav-link ${isActive ? 'active' : ''}`}
            >
              <div className="mobile-link-left">
                <span>Alerts</span>
              </div>
              {unread > 0 && <span className="mobile-unread-count">{unread}</span>}
            </NavLink>
          </nav>

          <div className="navbar-mobile-footer">
            <NavLink
              to={profilePath}
              className="mobile-user-details"
              style={{ textDecoration: 'none', color: 'inherit' }}
            >
              <div className="user-avatar-pill">{initials(user?.name)}</div>
              <div>
                <div className="user-display-name">{user?.name}</div>
                <div className="user-role-tag">{roleLabel(user?.roles)}</div>
              </div>
            </NavLink>
            <button className="btn-mobile-logout" onClick={handleLogout}>
              Sign out
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
