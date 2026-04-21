import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import './ProfilePage.css';
import {
  User,
  LogOut,
  Moon,
  Sun,
  HelpCircle,
  Info,
} from 'lucide-react';

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

const AVATAR_OPTIONS = ['👤', '👨', '👩', '🧑', '😊', '🎭', '🧔', '👱'];

export default function ProfilePage({ darkMode, setDarkMode }) {
  const navigate   = useNavigate();
  const { user, logout } = useAuth();

  // Derive everything from the real AuthContext user
  const userRole   = user?.userType || 'tenant';
  const isLandlord = userRole === 'landlord';
  const isDark     = darkMode || false;
  const colors     = isDark ? COLORS.dark : COLORS.light;

  const displayName  = user?.name  || 'Guest User';
  const userEmail    = user?.email || '';
  const userPhone    = user?.phone || '';
  const userSchool   = user?.school || '';
  const userGender   = user?.gender || '';

  // Real stats from user data
  const listings     = user?.listings  || [];
  const bookings     = user?.bookings  || [];
  const activeListings = listings.filter(l => l.status === 'Active').length;
  const activeBookings = bookings.filter(b => b.status === 'accepted').length;

  const [showDropdown,    setShowDropdown]    = useState(false);
  const [profilePicture,  setProfilePicture]  = useState('👤');
  const dropdownRef = useRef(null);

  // Load saved profile picture on mount
  useEffect(() => {
    const saved = localStorage.getItem('profilePicture');
    if (saved) setProfilePicture(saved);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target))
        setShowDropdown(false);
    };
    if (showDropdown) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showDropdown]);

  const handleProfilePictureChange = () => {
    const current = AVATAR_OPTIONS.indexOf(profilePicture);
    const next    = AVATAR_OPTIONS[(current + 1) % AVATAR_OPTIONS.length];
    setProfilePicture(next);
    localStorage.setItem('profilePicture', next);
  };

  const handleLogout = () => {
    logout();
    localStorage.removeItem('userType');
    window.location.href = '/';
  };

  // ✅ FIX: safe toggle — only call setDarkMode if it was actually passed in
  const handleDarkModeToggle = () => {
    if (typeof setDarkMode === 'function') setDarkMode(!isDark);
  };

  // Stat rows differ by role
  const stats = isLandlord
    ? [
        { value: activeListings || listings.length, label: 'Listings' },
        { value: user?.activities?.length || 0,     label: 'Activities' },
        { value: '4.8',                              label: 'Rating' },
      ]
    : [
        { value: bookings.length,  label: 'Bookings'  },
        { value: activeBookings,   label: 'Active'     },
        { value: '4.5',            label: 'Rating'     },
      ];

  return (
    <div className={`profile-page ${isDark ? 'dark' : ''}`} style={{ background: colors.bg }}>

      {/* ── Navbar ── */}
      <nav className="dashboard-nav">
        <button
          className="dashboard-nav-title-btn"
          style={{ background: 'none', border: 'none', padding: 0, margin: 0, cursor: 'pointer', fontSize: 24, fontWeight: 700, color: colors.text, fontFamily: 'inherit' }}
          aria-label="Go to Overview"
          onClick={() => navigate('/overview')}  // ✅ FIX: was /dashboard which doesn't exist
        >
          DormScout
        </button>

        <div ref={dropdownRef} className="dashboard-dropdown-wrap">
          <div className="dashboard-avatar" onClick={() => setShowDropdown(!showDropdown)}>
            <User size={20} color="#fff" />
          </div>
          {showDropdown && (
            <div className="dashboard-dropdown">
              <div className="dropdown-item dropdown-item-profile"
                onClick={() => { navigate('/profile'); setShowDropdown(false); }}>
                <User size={15} /> My Profile
              </div>
              <div className="dropdown-item dropdown-item-default"
                onClick={() => { navigate('/support'); setShowDropdown(false); }}>
                <HelpCircle size={15} /> Help and Support
              </div>
              <div className="dropdown-item dropdown-item-default"
                onClick={() => { navigate('/about'); setShowDropdown(false); }}>
                <Info size={15} /> About Us
              </div>
              <div
                className="dropdown-item dropdown-item-default dropdown-item-dark-toggle"
                onClick={() => { handleDarkModeToggle(); setShowDropdown(false); }}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', cursor: 'pointer', padding: '10px 12px' }}
              >
                {isDark ? <Sun size={15} /> : <Moon size={15} />}
                <span style={{ marginLeft: 8 }}>{isDark ? 'Light Mode' : 'Dark Mode'}</span>
              </div>
              <div className="dropdown-item dropdown-item-logout"
                onClick={() => { setShowDropdown(false); handleLogout(); }}>
                <LogOut size={15} /> Logout
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* ── Main Content ── */}
      <div className="profile-content">

        {/* ── Profile Card ── */}
        <div className="profile-card" style={{ background: colors.cardBg, border: `1px solid ${colors.border}` }}>

          {/* Avatar — cycles through emoji options on click */}
          <div
            className="avatar-btn avatar-btn--profile"
            onClick={handleProfilePictureChange}
            title="Click to change avatar"
          >
            {profilePicture}
          </div>

          {/* Name */}
          <h1 className="profile-card__name" style={{ color: isDark ? '#fff' : '#000' }}>
            {displayName}
          </h1>

          {/* Role badge */}
          <span style={{
            display: 'inline-block',
            padding: '3px 12px',
            borderRadius: 99,
            fontSize: 12,
            fontWeight: 700,
            marginBottom: 8,
            background: isLandlord ? 'rgba(91,173,168,0.15)' : 'rgba(232,98,46,0.12)',
            color:      isLandlord ? '#5BADA8'               : '#E8622E',
          }}>
            {isLandlord ? '🏠 Landlord' : '🎓 Tenant'}
          </span>

          {/* Contact info */}
          <p style={{ color: colors.secondaryText, fontSize: 14, marginBottom: 4 }}>{userEmail}</p>
          {userPhone && (
            <p style={{ color: colors.secondaryText, fontSize: 14, marginBottom: 4 }}>📞 {userPhone}</p>
          )}
          {userGender && (
            <p style={{ color: colors.secondaryText, fontSize: 14, marginBottom: 4 }}>
              {userGender === 'Male' ? '♂️' : '♀️'} {userGender}
            </p>
          )}
          {!isLandlord && userSchool && (
            <p style={{ color: colors.secondaryText, fontSize: 14, marginBottom: 8 }}>
              🎓 {userSchool}
            </p>
          )}

          {/* Stats — real data */}
          <div className="profile-stats">
            {stats.map(({ value, label }) => (
              <div key={label} className="profile-stats__item">
                <p className="profile-stats__value">{value}</p>
                <p className="profile-stats__label" style={{ color: colors.secondaryText }}>{label}</p>
              </div>
            ))}
          </div>

          {/* Action buttons */}
          <div className="profile-actions">
            <button className="btn btn--follow" onClick={() => navigate('/overview')}>
              ← Dashboard
            </button>
            <button className="btn btn--message" onClick={() => navigate('/messages')}>
              Messages
            </button>
          </div>
        </div>

        {/* ── Landlord: real listings ── */}
        {isLandlord && listings.length > 0 && (
          <div>
            <h2 className="listings-section__title" style={{ color: colors.text }}>
              <span className="listings-section__title-accent">My</span> Listings
            </h2>
            <div className="listings-grid">
              {listings.map((house) => (
                <div
                  key={house.id}
                  className="listing-card"
                  style={{ background: colors.cardBg, border: `1px solid ${colors.border}` }}
                >
                  <div className="listing-card__image">
                    {house.images?.[0]
                      ? <img src={house.images[0]} alt={house.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : '🏠'}
                  </div>
                  <div className="listing-card__body">
                    <h3 className="listing-card__title" style={{ color: colors.text }}>{house.title}</h3>
                    <p className="listing-card__address" style={{ color: colors.secondaryText }}>{house.address}</p>
                    <div className="listing-card__meta">
                      {[
                        `${house.availableRooms ?? '?'} available`,
                        house.status || 'Active',
                      ].map((label) => (
                        <div key={label} className="listing-card__meta-badge"
                          style={{ background: isDark ? '#1a1a4a' : '#f5f5f5', color: colors.secondaryText }}>
                          {label}
                        </div>
                      ))}
                    </div>
                    <div className="listing-card__footer">
                      <p className="listing-card__price">₱{house.price}/month</p>
                      <button className="btn--view" onClick={() => navigate('/listing')}>View</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Landlord: no listings yet ── */}
        {isLandlord && listings.length === 0 && (
          <div className="profile-empty" style={{ color: colors.secondaryText, textAlign: 'center', padding: '40px 0' }}>
            <p style={{ fontSize: 16, marginBottom: 12 }}>You haven't added any listings yet.</p>
            <button
              onClick={() => navigate('/listing')}
              style={{ padding: '10px 24px', background: '#E8622E', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}
            >
              + Add Your First Listing
            </button>
          </div>
        )}

        {/* ── Tenant: booking summary ── */}
        {!isLandlord && (
          <div style={{ marginTop: 24 }}>
            {bookings.length === 0 ? (
              <div className="profile-empty" style={{ color: colors.secondaryText, textAlign: 'center', padding: '40px 0' }}>
                <p style={{ fontSize: 16, marginBottom: 12 }}>You haven't made any bookings yet.</p>
                <button
                  onClick={() => navigate('/map')}
                  style={{ padding: '10px 24px', background: '#E8622E', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}
                >
                  Find a Dorm
                </button>
              </div>
            ) : (
              <div>
                <h2 className="listings-section__title" style={{ color: colors.text }}>
                  <span className="listings-section__title-accent">My</span> Bookings
                </h2>
                <div className="listings-grid">
                  {bookings.slice(0, 6).map((b) => (
                    <div key={b.id} className="listing-card"
                      style={{ background: colors.cardBg, border: `1px solid ${colors.border}` }}>
                      <div className="listing-card__image">🏠</div>
                      <div className="listing-card__body">
                        <h3 className="listing-card__title" style={{ color: colors.text }}>{b.dormName || b.listingTitle || 'Booking'}</h3>
                        <p className="listing-card__address" style={{ color: colors.secondaryText }}>{b.listingAddress || ''}</p>
                        <div className="listing-card__meta">
                          <div className="listing-card__meta-badge"
                            style={{ background: isDark ? '#1a1a4a' : '#f5f5f5', color: colors.secondaryText }}>
                            {b.status || 'pending'}
                          </div>
                        </div>
                        <div className="listing-card__footer">
                          <p className="listing-card__price">
                            {b.price ? `₱${b.price}/month` : ''}
                          </p>
                          <button className="btn--view" onClick={() => navigate('/booking')}>View</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}