import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import './ProfilePage.css';

const COLORS = {
  light: {
    bg:            'linear-gradient(120deg, #d7ebe9 0%, #e8d8c8 55%, #f6dfc9 100%)',
    navBg:         '#fff',
    cardBg:        '#fff',
    sidebarBg:     '#fff',
    text:          '#333',
    secondaryText: '#666',
    border:        '#f0f0f0',
  },
  dark: {
    bg:            '#1a1a2e',
    navBg:         '#16213e',
    cardBg:        '#16213e',
    sidebarBg:     '#0f3460',
    text:          '#eaeaea',
    secondaryText: '#a0a0b0',
    border:        '#2a2a4a',
  },
};

const SAMPLE_BOARDING_HOUSES = [
  { id: 1, title: 'Sunshine Boarding House', price: '₱5,500/month', rooms: '15 rooms', availableRooms: '3 available', address: 'Cebu City, Cebu',  image: '🏠' },
  { id: 2, title: 'Cozy Dorm',               price: '₱4,200/month', rooms: '12 rooms', availableRooms: '5 available', address: 'Mandaue, Cebu',    image: '🏢' },
  { id: 3, title: 'Campus Haven',             price: '₱6,000/month', rooms: '20 rooms', availableRooms: '2 available', address: 'Cebu City, Cebu',  image: '🏛️' },
];

export default function ProfilePage({ role, darkMode, setDarkMode }) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const userRole   = role || user?.userType || 'tenant';
  const isDark     = darkMode || false;
  const colors     = isDark ? COLORS.dark : COLORS.light;
  const isLandlord = userRole === 'landlord';

  const [showDropdown,    setShowDropdown]    = useState(false);
  const [profilePicture,  setProfilePicture]  = useState('👤');

  // Use real user data from localStorage
  const displayName = user?.name || 'Guest User';
  const userEmail = user?.email || '';
  const userSchool = user?.school || '';

  useEffect(() => {
    // Load saved profile picture
    const savedPicture = localStorage.getItem('profilePicture');
    if (savedPicture) {
      setProfilePicture(savedPicture);
    }
  }, []);

  const handleProfilePictureChange = () => {
    const emojis = ['👤', '👨', '👩', '🧑', '😊', '🎭'];
    const newPicture = emojis[Math.floor(Math.random() * emojis.length)];
    setProfilePicture(newPicture);
    localStorage.setItem('profilePicture', newPicture);
  };

  const handleLogout = () => {
    logout(); // Clears localStorage via AuthContext
    localStorage.removeItem('userType');
    navigate('/');
  };

  const bioText = isLandlord
    ? 'Passionate about providing quality accommodation for students. Over 5 years of experience in the boarding house business.'
    : 'College student looking for a comfortable place to stay near campus. Love meeting new people!';

  return (
    <div className="profile-page" style={{ background: colors.bg }}>

      {/* ── Navbar ── */}
      <nav className="profile-nav" style={{ background: colors.navBg }}>
        <button
          className="profile-nav-title-btn"
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
          onClick={() => navigate('/dashboard')}
        >
          DormScout
        </button>

        <div className="profile-nav__actions">
          <div
            className="avatar-btn avatar-btn--nav"
            onClick={() => setShowDropdown(!showDropdown)}
          >
            {profilePicture}
          </div>

          {showDropdown && (
            <div
              className="profile-dropdown"
              style={{
                background: colors.cardBg,
                border: `1px solid ${colors.border}`,
              }}
            >
              <div className="profile-dropdown__header">
                {profilePicture} My Profile
              </div>

              {[
                { label: '⚙️ Profile Settings', path: '/settings' },
                { label: '❓ Help and Support',  path: '/support' },
                { label: 'ℹ️ About Us',           path: '/about' },
              ].map(({ label, path }) => (
                <div
                  key={path}
                  className="profile-dropdown__item"
                  style={{ color: colors.text, borderBottom: `1px solid ${colors.border}` }}
                  onClick={() => { navigate(path); setShowDropdown(false); }}
                >
                  {label}
                </div>
              ))}

              <div
                className="profile-dropdown__item"
                style={{ color: colors.text, borderBottom: `1px solid ${colors.border}` }}
                onClick={() => setDarkMode(!isDark)}
              >
                {isDark ? '☀️ Light Mode' : '🌙 Dark Mode'}
              </div>

              <div
                className="profile-dropdown__item profile-dropdown__item--danger"
                onClick={() => { setShowDropdown(false); handleLogout(); }}
              >
                🚪 Logout
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
          {/* Avatar */}
          <div
            className="avatar-btn avatar-btn--profile"
            onClick={handleProfilePictureChange}
            title="Click to change profile picture"
          >
            {profilePicture}
          </div>

          {/* Name - Now uses real user data */}
          <h1 className="profile-card__name" style={{ color: isDark ? '#fff' : '#000' }}>
            {displayName}
          </h1>

          {/* Email (NEW) */}
          <p style={{ color: colors.secondaryText, fontSize: '14px', marginBottom: '8px' }}>
            {userEmail}
          </p>

          {/* School for Tenants (NEW) */}
          {isLandlord === false && userSchool && (
            <p style={{ color: colors.secondaryText, fontSize: '14px', marginBottom: '8px' }}>
              🎓 {userSchool}
            </p>
          )}

          {/* Bio */}
          <p className="profile-card__bio" style={{ color: colors.secondaryText }}>
            {bioText}
          </p>

          {/* Stats */}
          <div className="profile-stats">
            {[
              { value: isLandlord ? '3' : '0',   label: isLandlord ? 'Listings' : 'Bookings' },
              { value: '245',                     label: 'Followers' },
              { value: isLandlord ? '4.8' : '4.5', label: 'Rating' },
            ].map(({ value, label }) => (
              <div key={label} className="profile-stats__item">
                <p className="profile-stats__value">{value}</p>
                <p className="profile-stats__label" style={{ color: colors.secondaryText }}>{label}</p>
              </div>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="profile-actions">
            <button className="btn btn--follow">+ Follow</button>
            <button className="btn btn--followers">
              {isLandlord ? '245' : '0'} Followers
            </button>
            <button className="btn btn--message">Message</button>
          </div>
        </div>

        {/* ── Landlord Listings ── */}
        {isLandlord && (
          <div>
            <h2 className="listings-section__title" style={{ color: colors.text }}>
              <span className="listings-section__title-accent">My</span> Listings
            </h2>

            <div className="listings-grid">
              {SAMPLE_BOARDING_HOUSES.map((house) => (
                <div
                  key={house.id}
                  className="listing-card"
                  style={{ background: colors.cardBg, border: `1px solid ${colors.border}` }}
                >
                  <div className="listing-card__image">{house.image}</div>

                  <div className="listing-card__body">
                    <h3 className="listing-card__title" style={{ color: colors.text }}>
                      {house.title}
                    </h3>
                    <p className="listing-card__address" style={{ color: colors.secondaryText }}>
                      {house.address}
                    </p>

                    <div className="listing-card__meta">
                      {[house.rooms, house.availableRooms].map((label) => (
                        <div
                          key={label}
                          className="listing-card__meta-badge"
                          style={{
                            background: isDark ? '#1a1a4a' : '#f5f5f5',
                            color: colors.secondaryText,
                          }}
                        >
                          {label}
                        </div>
                      ))}
                    </div>

                    <div className="listing-card__footer">
                      <p className="listing-card__price">{house.price}</p>
                      <button className="btn--view">View</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Tenant Empty State ── */}
        {!isLandlord && (
          <div className="profile-empty" style={{ color: colors.secondaryText }}>
          </div>
        )}
      </div>
    </div>
  );
}

