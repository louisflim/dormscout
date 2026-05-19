import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import './ProfilePage.css';
import { User, HelpCircle, Info, Moon, Sun, LogOut, BadgeCheck } from 'lucide-react';
import { userAPI, listingsAPI, bookingsAPI, reviewsAPI } from '../../../utils/api';
import { isLandlordVerified } from '../../../utils/landlordVerification';

const PRIMARY = '#E8622E';
const TEAL = '#5BADA8';

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

function normalizeUserType(ut) {
  const s = String(ut || '').toLowerCase();
  if (s === 'landlord') return 'landlord';
  return 'tenant';
}

function isCurrentBooking(b) {
  const s = String(b?.status || '').toLowerCase();
  return ['pending', 'accepted', 'approved', 'confirmed', 'active'].includes(s);
}

function displayNameFromUser(u) {
  if (!u) return 'Guest User';
  if (u.name) return u.name;
  const joined = `${u.firstName || ''} ${u.lastName || ''}`.trim();
  return joined || 'Guest User';
}

export default function ProfilePage({ role, userType, darkMode, setDarkMode }) {
  const navigate = useNavigate();
  const { viewUserId } = useParams();
  const { user, logout, setUser } = useAuth();

  const [localDarkMode, setLocalDarkMode] = useState(Boolean(darkMode));
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  const [remoteProfile, setRemoteProfile] = useState(null);
  const [remoteLoadState, setRemoteLoadState] = useState('idle');
  const [landlordListings, setLandlordListings] = useState([]);
  const [tenantBookings, setTenantBookings] = useState([]);

  const isDark = typeof setDarkMode === 'function' ? Boolean(darkMode) : localDarkMode;

  const isOwnProfile = !viewUserId || String(viewUserId) === String(user?.id);
  const profileData = isOwnProfile ? user : remoteProfile;

  const profileRole = profileData
    ? normalizeUserType(profileData.userType)
    : normalizeUserType(role || userType || user?.userType);
  const isLandlord = profileRole === 'landlord';

  const colors = isDark ? COLORS.dark : COLORS.light;

  const isVerifiedLandlord = isLandlord && isLandlordVerified(profileData);

  const userSchool = profileData?.school || profileData?.university || '';
  const profileImage = profileData?.profileImage || null;

  const displayName = displayNameFromUser(profileData);

  const navDisplayName = [user?.firstName, user?.lastName].filter(Boolean).join(' ').trim()
    || user?.name || user?.email || 'Account';
  const userInitials = navDisplayName
    .split(' ').filter(Boolean).map((p) => p[0]).join('').toUpperCase().slice(0, 2) || 'A';

  const currentBookings = useMemo(
    () => (Array.isArray(tenantBookings) ? tenantBookings : []).filter(isCurrentBooking),
    [tenantBookings]
  );

  const listingsCount = isLandlord ? landlordListings.length : 0;
  const totalReviewsCount = useMemo(
    () => landlordListings.reduce((n, l) => n + (Array.isArray(l.reviews) ? l.reviews.length : 0), 0),
    [landlordListings]
  );

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

  useEffect(() => {
    if (!isOwnProfile || !user?.id) return undefined;
    let cancelled = false;
    (async () => {
      const fresh = await userAPI.getUserById(user.id);
      if (cancelled || !fresh || fresh.success === false) return;
      setUser((prev) => {
        const merged = { ...prev, ...fresh };
        sessionStorage.setItem('authUser', JSON.stringify(merged));
        return merged;
      });
    })();
    return () => { cancelled = true; };
  }, [isOwnProfile, user?.id, setUser]);

  useEffect(() => {
    if (!viewUserId || String(viewUserId) === String(user?.id)) {
      setRemoteProfile(null);
      setRemoteLoadState('idle');
      return;
    }
    let cancelled = false;
    setRemoteLoadState('loading');
    (async () => {
      const data = await userAPI.getUserById(viewUserId);
      if (cancelled) return;
      setRemoteProfile(data);
      setRemoteLoadState(data ? 'done' : 'error');
    })();
    return () => { cancelled = true; };
  }, [viewUserId, user?.id]);

  useEffect(() => {
    if (!profileData?.id) return;
    if (!isLandlord) {
      setLandlordListings([]);
      return;
    }
    let cancelled = false;
    (async () => {
      const listings = await listingsAPI.getListingsByLandlord(profileData.id);
      const base = Array.isArray(listings) ? listings : [];
      const withReviews = await Promise.all(
        base.map(async (listing) => {
          const revs = await reviewsAPI.getByListing(listing.id);
          return { ...listing, reviews: Array.isArray(revs) ? revs : [] };
        })
      );
      if (!cancelled) setLandlordListings(withReviews);
    })();
    return () => { cancelled = true; };
  }, [profileData?.id, isLandlord]);

  useEffect(() => {
    if (!profileData?.id || isLandlord || !isOwnProfile) {
      setTenantBookings([]);
      return;
    }
    let cancelled = false;
    (async () => {
      const raw = await bookingsAPI.getBookingsByTenant(profileData.id);
      const arr = Array.isArray(raw) ? raw : [];
      if (!cancelled) setTenantBookings(arr);
    })();
    return () => { cancelled = true; };
  }, [profileData?.id, isLandlord, isOwnProfile]);

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
      } catch (_) { /* ignore */ }
    }
    setShowDropdown(false);
  };

  const bioText = (profileData?.bio || '').trim() || (
    isLandlord
      ? 'Providing quality accommodation for students.'
      : 'Looking for the perfect place to stay near campus.'
  );

  const verificationCaption = () => {
    if (!isLandlord || !isOwnProfile) return null;
    if (isVerifiedLandlord) return 'Verified landlord';
    const st = String(profileData?.verificationStatus || '').toLowerCase();
    if (st === 'pending') return 'Verification pending';
    if (st === 'rejected') return 'Verification not approved';
    return null;
  };

  const vCap = verificationCaption();
  const themeClass = isDark ? 'dark' : 'light';

  if (!isOwnProfile && remoteLoadState === 'loading') {
    return (
      <div className={`profile-page ${themeClass}`} style={{ background: colors.bg, minHeight: '100vh', paddingTop: 80, textAlign: 'center', color: colors.text }}>
        <p>Loading profile…</p>
      </div>
    );
  }

  if (!isOwnProfile && (remoteLoadState === 'error' || !profileData)) {
    return (
      <div className={`profile-page ${themeClass}`} style={{ background: colors.bg, minHeight: '100vh', paddingTop: 80, textAlign: 'center', color: colors.text }}>
        <p style={{ marginBottom: 16 }}>User not found.</p>
        <button type="button" className="btn btn--primary" style={{ background: '#E8622E', color: '#fff' }} onClick={() => navigate('/messages')}>
          Back to Messages
        </button>
      </div>
    );
  }

  if (isOwnProfile && !user) {
    return null;
  }

  return (
    <div className={`profile-page ${themeClass}`} style={{ background: colors.bg }}>

      <nav className="dashboard-nav">
        <button
          className="dashboard-nav-title-btn"
          aria-label="Go to Overview"
          onClick={() => navigate('/overview')}
        >
          <span style={{ color: PRIMARY }}>Dorm</span>
          <span style={{ color: TEAL }}>Scout</span>
        </button>

        <div ref={dropdownRef} className="dashboard-dropdown-wrap">
          <div className="dashboard-avatar" onClick={() => setShowDropdown(!showDropdown)}>
            {user?.profileImage
              ? <img src={user.profileImage} alt="Profile" />
              : <span>{userInitials}</span>
            }
          </div>

          {showDropdown && (
            <div className="dashboard-dropdown">
              <div
                className="dropdown-item dropdown-item-profile"
                onClick={() => { navigate('/profile'); setShowDropdown(false); }}
              >
                <User size={14} /> {navDisplayName}
              </div>

              <div
                className="dropdown-item dropdown-item-default"
                onClick={() => { navigate('/support'); setShowDropdown(false); }}
              >
                <HelpCircle size={14} /> Help and Support
              </div>

              <div
                className="dropdown-item dropdown-item-default"
                onClick={() => { navigate('/about'); setShowDropdown(false); }}
              >
                <Info size={14} /> About Us
              </div>

              <div
                className="dropdown-item dropdown-item-default dropdown-item-dark-toggle"
                onClick={toggleTheme}
              >
                {isDark ? <Sun size={14} /> : <Moon size={14} />}
                <span>{isDark ? 'Light Mode' : 'Dark Mode'}</span>
              </div>

              <div
                className="dropdown-item dropdown-item-logout"
                onClick={() => { setShowDropdown(false); handleLogout(); }}
              >
                <LogOut size={14} /> Logout
              </div>
            </div>
          )}
        </div>
      </nav>

      <div className="profile-content">

        {!isOwnProfile && (
          <div style={{ marginBottom: 20, textAlign: 'left' }}>
            <button
              type="button"
              className="btn btn--secondary"
              onClick={() => navigate(-1)}
              style={{ border: `1px solid ${colors.border}`, background: colors.cardBg, color: colors.text }}
            >
              ← Back
            </button>
          </div>
        )}

        <div
          className="profile-card"
          style={{ background: colors.cardBg, border: `1px solid ${colors.border}` }}
        >
          <div
            className="avatar-btn avatar-btn--profile"
            onClick={() => isOwnProfile && navigate('/settings')}
            title={isOwnProfile ? 'Change profile picture in Settings' : ''}
            style={{ cursor: isOwnProfile ? 'pointer' : 'default' }}
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

          <h1 className="profile-card__name" style={{ color: isDark ? '#fff' : '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span>{displayName}</span>
            {isLandlord && isVerifiedLandlord && (
              <BadgeCheck size={32} color="#16a34a" aria-label="Verified landlord" style={{ flexShrink: 0 }} />
            )}
          </h1>

          {vCap && (
            <p style={{ color: colors.secondaryText, fontSize: '13px', marginBottom: '8px' }}>
              {vCap}
            </p>
          )}

          {isLandlord && String(profileData?.businessName || '').trim() && (
            <p style={{ color: colors.secondaryText, fontSize: '14px', marginBottom: '8px' }}>
              <span style={{ fontWeight: 600 }}>Business:</span>{' '}
              {String(profileData.businessName).trim()}
            </p>
          )}

          {!isLandlord && userSchool && (
            <p style={{ color: colors.secondaryText, fontSize: '14px', marginBottom: '8px' }}>
              🎓 {userSchool}
            </p>
          )}

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
            {isLandlord ? '🏢 Landlord' : '🎓 Student'}
          </p>

          <p className="profile-card__bio" style={{ color: colors.secondaryText }}>
            {bioText}
          </p>

          <div className="profile-stats">
            {isLandlord ? (
              <>
                <div className="profile-stats__item">
                  <p className="profile-stats__value">{listingsCount}</p>
                  <p className="profile-stats__label" style={{ color: colors.secondaryText }}>Listings</p>
                </div>
                <div className="profile-stats__item">
                  <p className="profile-stats__value">{totalReviewsCount}</p>
                  <p className="profile-stats__label" style={{ color: colors.secondaryText }}>Reviews</p>
                </div>
                <div className="profile-stats__item">
                  <p className="profile-stats__value">{profileData?.gender || '-'}</p>
                  <p className="profile-stats__label" style={{ color: colors.secondaryText }}>Gender</p>
                </div>
              </>
            ) : (
              <>
                <div className="profile-stats__item">
                  <p className="profile-stats__value">{currentBookings.length}</p>
                  <p className="profile-stats__label" style={{ color: colors.secondaryText }}>Current bookings</p>
                </div>
                <div className="profile-stats__item">
                  <p className="profile-stats__value">{profileData?.yearLevel || '-'}</p>
                  <p className="profile-stats__label" style={{ color: colors.secondaryText }}>Year Level</p>
                </div>
                <div className="profile-stats__item">
                  <p className="profile-stats__value">{profileData?.gender || '-'}</p>
                  <p className="profile-stats__label" style={{ color: colors.secondaryText }}>Gender</p>
                </div>
              </>
            )}
          </div>

          {isOwnProfile && (
            <div className="profile-actions">
              <button
                className="btn btn--primary"
                style={{ background: '#E8622E', color: '#fff' }}
                onClick={() => navigate('/settings')}
              >
                Edit Profile
              </button>
              {isLandlord && (
                <button
                  className="btn btn--secondary"
                  onClick={() => navigate('/listing')}
                >
                  Manage Listings
                </button>
              )}
            </div>
          )}
        </div>

        {!isLandlord && isOwnProfile && (
          <section style={{ marginTop: 32, textAlign: 'left' }}>
            <h2 className="listings-section__title" style={{ color: colors.text }}>
              Current <span className="listings-section__title-accent">bookings</span>
            </h2>
            {currentBookings.length === 0 ? (
              <div className="profile-empty" style={{ background: colors.cardBg, border: `1px solid ${colors.border}`, borderRadius: 16 }}>
                <p className="profile-empty__text" style={{ color: colors.secondaryText }}>No active or pending bookings.</p>
              </div>
            ) : (
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
                {currentBookings.map((b) => (
                  <li
                    key={b.id}
                    style={{
                      background: colors.cardBg,
                      border: `1px solid ${colors.border}`,
                      borderRadius: 12,
                      padding: 16,
                      color: colors.text,
                    }}
                  >
                    <strong>{b.listing?.title || 'Listing'}</strong>
                    <div style={{ color: colors.secondaryText, fontSize: 14, marginTop: 6 }}>
                      Status: {b.status}
                      {(b.checkInDate || b.moveInDate) && (
                        <span> · Move-in: {b.checkInDate || b.moveInDate}</span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        {isLandlord && (
          <section style={{ marginTop: 32, textAlign: 'left' }}>
            <h2 className="listings-section__title" style={{ color: colors.text }}>
              <span className="listings-section__title-accent">Listings</span> & reviews
            </h2>
            {landlordListings.length === 0 ? (
              <div className="profile-empty" style={{ background: colors.cardBg, border: `1px solid ${colors.border}`, borderRadius: 16 }}>
                <p className="profile-empty__text" style={{ color: colors.secondaryText }}>No listings yet.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                {landlordListings.map((listing) => (
                  <article
                    key={listing.id}
                    style={{
                      background: colors.cardBg,
                      border: `1px solid ${colors.border}`,
                      borderRadius: 16,
                      overflow: 'hidden',
                    }}
                  >
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, padding: 20 }}>
                      <div
                        style={{
                          width: 120,
                          height: 90,
                          borderRadius: 8,
                          background: '#e8e8e8',
                          flexShrink: 0,
                          overflow: 'hidden',
                        }}
                      >
                        {listing.images?.[0] ? (
                          <img src={listing.images[0]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>🏠</div>
                        )}
                      </div>
                      <div style={{ flex: '1 1 200px' }}>
                        <h3 style={{ margin: '0 0 6px 0', color: colors.text, fontSize: 18 }}>{listing.title}</h3>
                        <p style={{ margin: 0, color: colors.secondaryText, fontSize: 14 }}>{listing.address}</p>
                        {listing.price != null && (
                          <p style={{ margin: '8px 0 0 0', color: '#E8622E', fontWeight: 700 }}>₱{Number(listing.price).toLocaleString()}</p>
                        )}
                      </div>
                    </div>
                    <div style={{ borderTop: `1px solid ${colors.border}`, padding: '12px 20px 20px' }}>
                      <h4 style={{ margin: '0 0 10px 0', fontSize: 14, color: colors.secondaryText }}>Reviews</h4>
                      {!listing.reviews?.length ? (
                        <p style={{ margin: 0, color: colors.secondaryText, fontSize: 14 }}>No reviews yet.</p>
                      ) : (
                        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
                          {listing.reviews.map((r) => (
                            <li key={r.id} style={{ fontSize: 14, color: colors.text }}>
                              <span style={{ color: '#E8622E', fontWeight: 600 }}>{'★'.repeat(Math.min(5, Math.max(0, r.rating || 0)))}</span>
                              {r.body && <span style={{ marginLeft: 8 }}>{r.body}</span>}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
