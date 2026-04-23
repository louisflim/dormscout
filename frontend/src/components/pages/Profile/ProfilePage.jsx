import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import './ProfilePage.css';
import { User, HelpCircle, Info, Moon, Sun, LogOut } from 'lucide-react';

const COLORS = {
  light: {
    bg:            'linear-gradient(120deg, #d7ebe9 0%, #e8d8c8 55%, #f6dfc9 100%)',
    navBg:         '#fff',
    cardBg:        '#fff',
    text:          '#333',
    secondaryText: '#666',
    border:        '#f0f0f0',
  },
  dark: {
    bg:            '#1a1a2e',
    navBg:         '#16213e',
    cardBg:        '#16213e',
    text:          '#eaeaea',
    secondaryText: '#a0a0b0',
    border:        '#2a2a4a',
  },
};

export default function ProfilePage({ role, darkMode, setDarkMode }) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [localDarkMode, setLocalDarkMode] = useState(Boolean(darkMode));
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  const isDark = typeof setDarkMode === 'function' ? Boolean(darkMode) : localDarkMode;

  const userRole   = role || user?.userType || 'tenant';
  const colors     = isDark ? COLORS.dark : COLORS.light;
  const isLandlord = userRole === 'landlord';

  // Real user data from AuthContext
  const displayName  = user?.name || 'Guest User';
  const userEmail    = user?.email || '';
  const userSchool   = user?.school || user?.university || '';
  const profileImage = user?.profileImage || null;

  // Real stats from user data
  const listingsCount = user?.listings?.length || 0;
  const bookingsCount  = user?.bookings?.length || 0;

  useEffect(() => {
    setLocalDarkMode(Boolean(darkMode));
  }, [darkMode]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showDropdown]);

  const handleLogout = () => {
    logout();
    localStorage.removeItem('userType');
    navigate('/');
  };

  const toggleTheme = () => {
    const nextMode = !isDark;
    if (typeof setDarkMode === 'function') {
      setDarkMode(nextMode);
    } else {
      setLocalDarkMode(nextMode);
      try {
        localStorage.setItem('darkMode', nextMode ? 'true' : 'false');
      } catch (_) {}
    }
    setShowDropdown(false);
  };

  const bioText = isLandlord
    ? 'Providing quality accommodation for students.'
    : 'Looking for the perfect place to stay near campus.';

  return (
    <div className="profile-page" style={{ background: colors.bg }}>

      {/* ── Navbar - Matching Dashboard Styles ── */}
      <nav
        className="dashboard-nav"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          width: '100%',
          background: colors.navBg,
        }}
      >
        <button
          className="dashboard-nav-title-btn"
          style={{
            background: 'none',
            border: 'none',
            padding: 0,
            margin: 0,
            cursor: 'pointer',
            fontSize: 24,
            fontWeight: 700,
            color: colors.text,
            fontFamily: 'inherit',
          }}
          aria-label="Go to Overview"
          onClick={() => navigate('/overview')}
        >
          DormScout
        </button>

        {/* Dropdown wrapper - pushed to right */}
        <div ref={dropdownRef} className="dashboard-dropdown-wrap">
          <div
            className="dashboard-avatar"
            onClick={() => setShowDropdown(!showDropdown)}
            style={{ cursor: 'pointer' }}
          >
            {profileImage ? (
              <img
                src={profileImage}
                alt="Profile"
                style={{
                  width: '100%',
                  height: '100%',
                  borderRadius: '50%',
                  objectFit: 'cover',
                }}
              />
            ) : (
              <User size={20} color="#fff" />
            )}
          </div>

          {showDropdown && (
            <div className="dashboard-dropdown">
              <div
                className="dropdown-item dropdown-item-profile"
                onClick={() => { navigate('/profile'); setShowDropdown(false); }}
              >
                <User size={15} /> My Profile
              </div>

              <div
                className="dropdown-item dropdown-item-default"
                onClick={() => { navigate('/support'); setShowDropdown(false); }}
              >
                <HelpCircle size={15} /> Help and Support
              </div>

              <div
                className="dropdown-item dropdown-item-default"
                onClick={() => { navigate('/about'); setShowDropdown(false); }}
              >
                <Info size={15} /> About Us
              </div>

              <div
                className="dropdown-item dropdown-item-default dropdown-item-dark-toggle"
                onClick={toggleTheme}
              >
                {isDark ? <Sun size={15} /> : <Moon size={15} />}
                <span style={{ marginLeft: 8 }}>{isDark ? 'Light Mode' : 'Dark Mode'}</span>
              </div>

              <div
                className="dropdown-item dropdown-item-logout"
                onClick={() => { setShowDropdown(false); handleLogout(); }}
              >
                <LogOut size={15} /> Logout
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* ── Main Content ── */}
      <div className="profile-content">

        {/* ── Profile Card ── */}
        <div
          className="profile-card"
          style={{ background: colors.cardBg, border: `1px solid ${colors.border}` }}
        >
          {/* Profile Avatar */}
          <div
            className="avatar-btn avatar-btn--profile"
            onClick={() => navigate('/settings')}
            title="Click to change profile picture in Settings"
            style={{ cursor: 'pointer' }}
          >
            {profileImage ? (
              <img
                src={profileImage}
                alt="Profile"
                style={{
                  width: '100%',
                  height: '100%',
                  borderRadius: '50%',
                  objectFit: 'cover',
                }}
              />
            ) : (
              <span style={{ fontSize: '3rem' }}>👤</span>
            )}
          </div>

          {/* Name */}
          <h1 className="profile-card__name" style={{ color: isDark ? '#fff' : '#000' }}>
            {displayName}
          </h1>

          {/* Email */}
          {userEmail && (
            <p style={{ color: colors.secondaryText, fontSize: '14px', marginBottom: '8px' }}>
              {userEmail}
            </p>
          )}

          {/* School/University */}
          {userSchool && (
            <p style={{ color: colors.secondaryText, fontSize: '14px', marginBottom: '8px' }}>
              🎓 {userSchool}
            </p>
          )}

          {/* Role Badge */}
          <p style={{
            color: '#fff',
            fontSize: '12px',
            fontWeight: 600,
            background: isLandlord ? '#E8622E' : '#5BADA8',
            padding: '4px 12px',
            borderRadius: '20px',
            display: 'inline-block',
            marginBottom: '12px',
          }}>
            {isLandlord ? '🏠 Landlord' : '🎓 Student'}
          </p>

          {/* Bio */}
          <p className="profile-card__bio" style={{ color: colors.secondaryText }}>
            {bioText}
          </p>

          {/* Stats */}
          <div className="profile-stats">
            <div className="profile-stats__item">
              <p className="profile-stats__value">
                {isLandlord ? listingsCount : bookingsCount}
              </p>
              <p className="profile-stats__label" style={{ color: colors.secondaryText }}>
                {isLandlord ? 'Listings' : 'Bookings'}
              </p>
            </div>
            <div className="profile-stats__item">
              <p className="profile-stats__value">{user?.yearLevel || '-'}</p>
              <p className="profile-stats__label" style={{ color: colors.secondaryText }}>
                Year Level
              </p>
            </div>
            <div className="profile-stats__item">
              <p className="profile-stats__value">{user?.gender || '-'}</p>
              <p className="profile-stats__label" style={{ color: colors.secondaryText }}>
                Gender
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="profile-actions">
            <button
              className="btn btn--primary"
              style={{ background: '#E8622E', color: '#fff' }}
              onClick={() => navigate('/settings')}
            >
              Edit Profile
            </button>
            <button
              className="btn btn--secondary"
              onClick={() => navigate(isLandlord ? '/listing' : '/booking')}
            >
              {isLandlord ? 'Manage Listings' : 'My Bookings'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}