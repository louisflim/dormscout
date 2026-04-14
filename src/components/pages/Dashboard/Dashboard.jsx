import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Map from '../Map/Map';
import ListingPage from '../Listing/ListingPage';
import BookingPage from '../Booking/BookingPage';
import Reviews from '../Reviews/Reviews';
import Messaging from '../Messaging/Messaging';
import Settings from '../Settings/Settings';
import Notifications from '../Notifications/Notifications';
import { useBooking } from '../../../context/BookingContext';

const PRIMARY = '#E8622E';
const SECONDARY = '#5BADA8';

const COLORS = {
  light: {
    bg: 'linear-gradient(120deg, #d7ebe9 0%, #e8d8c8 55%, #f6dfc9 100%)',
    navBg: '#fff',
    cardBg: '#fff',
    sidebarBg: '#fff',
    text: '#333',
    secondaryText: '#666',
    border: '#f0f0f0',
  },
  dark: {
    bg: '#1a1a2e',
    navBg: '#16213e',
    cardBg: '#16213e',
    sidebarBg: '#0f3460',
    text: '#eaeaea',
    secondaryText: '#a0a0b0',
    border: '#2a2a4a',
  },
};

const NAV_ITEMS = {
  landlord: [
    { id: 'overview', label: 'Overview' },
    { id: 'map', label: 'Map View' },
    { id: 'listing', label: 'Listing' },
    { id: 'notifications', label: 'Notifications' },
    { id: 'messages', label: 'Messages' },
    { id: 'settings', label: 'Settings' },
    { id: 'reviews', label: 'Reviews' },
  ],
  tenant: [
    { id: 'overview', label: 'Overview' },
    { id: 'map', label: 'Map View' },
    { id: 'booking', label: 'Booking' },
    { id: 'notifications', label: 'Notifications' },
    { id: 'messages', label: 'Messages' },
    { id: 'settings', label: 'Settings' },
    { id: 'reviews', label: 'Reviews' },
  ],
};

const STATS = {
  landlord: [
    { title: 'All Listings', value: '4', align: 'center' },
    { title: 'Notifications', value: '3', align: 'center' },
    { title: 'Messages', value: '3', align: 'center' },
  ],
  tenant: [
    { title: 'Your Current Booking', value: 'Sunshine Boarding House', align: 'left' },
    { title: 'Notifications', value: '1', align: 'center' },
    { title: 'Messages', value: '1', align: 'center' },
  ],
};

const MESSAGES = [
  { name: 'LeBron James', property: 'Sunshine Boarding House' },
  { name: 'Steph Curry', property: 'Sunshine Boarding House' },
  { name: 'Michael Jordan', property: 'Sunshine Boarding House' },
];

const ICONS = {
  overview: '📊',
  map: '🗺️',
  listing: '📋',
  booking: '📅',
  notifications: '🔔',
  messages: '💬',
  settings: '⚙️',
  reviews: '⭐',
};

export default function Dashboard({ userType = 'tenant', darkMode = false, setDarkMode }) {
  const [searchParams] = useSearchParams();
  const colors = darkMode ? COLORS.dark : COLORS.light;
  const sectionFromUrl = searchParams.get('section') || 'overview';
  const [activeNav, setActiveNav] = useState(sectionFromUrl);
  const [editListingData, setEditListingData] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const navItems = NAV_ITEMS[userType] || NAV_ITEMS.tenant;
  const stats = STATS[userType] || STATS.tenant;
  const isLandlord = userType === 'landlord';
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const { getUnreadCount, getNotifications, markNotificationRead } = useBooking();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown]);

  const handleNavClick = (id) => {
    setActiveNav(id);
  };

  return (
    <div style={{
      background: colors.bg,
      minHeight: '100vh',
      paddingTop: '60px',
    }}>
      <nav style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        background: colors.navBg,
        borderBottom: `3px solid ${SECONDARY}`,
        padding: '16px 32px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <h1 style={{ fontSize: '24px', fontWeight: '700', margin: 0, color: colors.text }}>DormScout</h1>
        <div ref={dropdownRef} style={{ display: 'flex', gap: '16px', alignItems: 'center', position: 'relative' }}>
          <div
            onClick={() => setShowDropdown(!showDropdown)}
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: '#9370DB',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontSize: '18px',
              cursor: 'pointer',
              transition: 'transform 0.2s ease',
              transform: 'scale(1)',
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            👤
          </div>

          {showDropdown && (
            <div style={{
              position: 'absolute',
              top: '60px',
              right: '0',
              background: colors.cardBg,
              borderRadius: '12px',
              border: `1px solid ${colors.border}`,
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              minWidth: '220px',
              zIndex: 1001,
              overflow: 'hidden',
            }}>
              <div
                onClick={() => {
                  navigate('/profile');
                  setShowDropdown(false);
                }}
                style={{
                  padding: '12px 16px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  borderBottom: `1px solid ${colors.border}`,
                  fontWeight: '600',
                  background: PRIMARY,
                  color: '#fff',
                }}
                onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
                onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
              >
                👤 My Profile
              </div>

              <div
                onClick={() => {
                  setActiveNav('settings');
                  setShowDropdown(false);
                }}
                style={{
                  padding: '12px 16px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  color: colors.text,
                  borderBottom: `1px solid ${colors.border}`,
                  transition: 'background 0.2s ease',
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = colors.border}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                ⚙️ Profile Settings
              </div>

              <div
                onClick={() => {
                  navigate('/support');
                  setShowDropdown(false);
                }}
                style={{
                  padding: '12px 16px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  color: colors.text,
                  borderBottom: `1px solid ${colors.border}`,
                  transition: 'background 0.2s ease',
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = colors.border}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                ❓ Help and Support
              </div>

              <div
                onClick={() => {
                  navigate('/about');
                  setShowDropdown(false);
                }}
                style={{
                  padding: '12px 16px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  color: colors.text,
                  borderBottom: `1px solid ${colors.border}`,
                  transition: 'background 0.2s ease',
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = colors.border}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                ℹ️ About Us
              </div>

              <div
                onClick={() => setDarkMode(!darkMode)}
                style={{
                  padding: '12px 16px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  color: colors.text,
                  borderBottom: `1px solid ${colors.border}`,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  transition: 'background 0.2s ease',
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = colors.border}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <span>{darkMode ? '☀️' : '🌙'} {darkMode ? 'Light Mode' : 'Dark Mode'}</span>
              </div>

              <div
                onClick={() => {
                  setShowDropdown(false);
                  navigate('/');
                }}
                style={{
                  padding: '12px 16px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  color: '#dc3545',
                  fontWeight: '600',
                  transition: 'background 0.2s ease',
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = colors.border}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                🚪 Logout
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Everything below this line is unchanged */}
      <div style={{ padding: '32px 40px', maxWidth: '1400px', margin: '0 auto' }}>
        {activeNav !== 'messages' && activeNav !== 'reviews' && activeNav !== 'notifications' && (
          <h2 style={{
            fontSize: '48px',
            fontWeight: '700',
            margin: isLandlord ? '0 0 8px 0' : '0 0 32px 0',
            textAlign: 'center',
            lineHeight: '1.1',
          }}>
            {activeNav === 'map' ? (
              <><span style={{ color: PRIMARY }}>Map </span><span style={{ color: SECONDARY }}>View</span></>
            ) : activeNav === 'listing' && isLandlord ? (
              <span style={{ color: PRIMARY }}>Listings</span>
            ) : activeNav === 'booking' && !isLandlord ? (
              <><span style={{ color: PRIMARY }}>My </span><span style={{ color: SECONDARY }}>Bookings</span></>
            ) : activeNav === 'settings' ? (
              <span style={{ color: PRIMARY }}>Settings</span>
            ) : (
              <><span style={{ color: PRIMARY }}>Welcome</span><span style={{ color: SECONDARY }}>Back</span></>
            )}
          </h2>
        )}
        {activeNav === 'reviews' && (
          <h2 style={{ fontSize: '48px', fontWeight: '700', margin: '0 0 32px 0', textAlign: 'center', lineHeight: '1.1' }}>
            <span style={{ color: PRIMARY }}>Reviews</span>
          </h2>
        )}
        {activeNav === 'notifications' && (
          <h2 style={{ fontSize: '48px', fontWeight: '700', margin: '0 0 32px 0', textAlign: 'center', lineHeight: '1.1' }}>
            <span style={{ color: PRIMARY }}>Notifications</span>
          </h2>
        )}
        {activeNav === 'messages' && (
          <h2 style={{ fontSize: '48px', fontWeight: '700', margin: '0 0 32px 0', textAlign: 'center', lineHeight: '1.1' }}>
            <span style={{ color: PRIMARY }}>Messages</span>
          </h2>
        )}

        <div style={{ marginBottom: '28px' }}>
          {activeNav === 'messages' ? (
            <>
              <h4 style={{ fontSize: '20px', fontWeight: '700', margin: '0 0 8px 0', color: colors.text }}>Messages</h4>
              <p style={{ fontSize: '14px', color: colors.secondaryText, margin: 0 }}>
                Chat with landlords and property managers about bookings.
              </p>
            </>
          ) : (
            <>
              <h4 style={{ fontSize: '20px', fontWeight: '700', margin: '0 0 8px 0', color: colors.text }}>
                {activeNav === 'map' ? 'Map' : activeNav === 'listing' ? 'Listing' : activeNav === 'settings' ? 'Settings' : activeNav === 'reviews' ? 'Reviews' : activeNav === 'booking' ? 'Booking' : activeNav === 'notifications' ? 'Notifications' : 'Dashboard'}
              </h4>
              <p style={{ fontSize: '14px', color: colors.secondaryText, margin: 0 }}>
                {activeNav === 'map' ? 'Search for dorms around Cebu City and find the perfect dorm near campus'
                  : activeNav === 'listing' ? 'Create or delete your listing.'
                  : activeNav === 'settings' ? 'Manage your profile, security, and application preferences.'
                  : activeNav === 'reviews' ? 'Real feedback from students who have lived there'
                  : activeNav === 'booking' ? 'Manage and track all your boarding house booking requests.'
                  : activeNav === 'notifications' ? 'Stay updated with booking requests, approvals, and messages.'
                  : isLandlord ? 'See an overview of your current listings, messages, and recent activity.'
                  : 'See an overview of your current bookings, messages, and recent activity.'}
              </p>
            </>
          )}
        </div>

        <div style={{ display: 'flex', gap: '24px' }}>
          <div style={{ width: '280px', background: colors.sidebarBg, borderRadius: '20px', padding: '24px', height: 'fit-content' }}>
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  textAlign: 'left',
                  border: 'none',
                  background: activeNav === item.id ? PRIMARY : 'transparent',
                  color: activeNav === item.id ? '#ffffff' : (darkMode ? '#ffffff' : '#E8622E'),
                  borderRadius: activeNav === item.id ? '12px' : '0',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: activeNav === item.id ? '600' : '500',
                  margin: activeNav === item.id ? '6px' : '0',
                  marginBottom: '4px',
                  transition: 'all 0.25s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                }}
                onMouseEnter={(e) => {
                  if (activeNav !== item.id) {
                    e.currentTarget.style.background = darkMode ? '#1a1a4a' : '#f5f5f5';
                    e.currentTarget.style.color = darkMode ? '#ffffff' : '#E8622E';
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeNav !== item.id) {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = darkMode ? '#ffffff' : '#E8622E';
                  }
                }}
              >
                <span style={{ fontSize: '16px' }}>{ICONS[item.id] || '•'}</span>
                {item.label}
                {item.id === 'notifications' && getUnreadCount(userType) > 0 && (
                  <span style={{
                    marginLeft: 'auto', background: '#dc3545', color: '#fff', fontSize: '11px',
                    padding: '2px 7px', borderRadius: '10px', fontWeight: '700', minWidth: '18px', textAlign: 'center',
                  }}>
                    {getUnreadCount(userType)}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div style={{ flex: 1 }}>
            {activeNav === 'map' ? (
              <Map darkMode={darkMode} userType={userType} onEditListing={(listing) => { setEditListingData(listing); setActiveNav('listing'); }} />
            ) : activeNav === 'listing' && isLandlord ? (
              <ListingPage darkMode={darkMode} editListingData={editListingData} onEditHandled={() => setEditListingData(null)} />
            ) : activeNav === 'booking' && !isLandlord ? (
              <BookingPage darkMode={darkMode} />
            ) : activeNav === 'notifications' ? (
              <Notifications darkMode={darkMode} userType={userType} />
            ) : activeNav === 'reviews' ? (
              <Reviews userType={userType} darkMode={darkMode} setDarkMode={setDarkMode} />
            ) : activeNav === 'messages' ? (
              <Messaging darkMode={darkMode} userType={userType} />
            ) : activeNav === 'settings' ? (
              <Settings darkMode={darkMode} setDarkMode={setDarkMode} userType={userType} />
            ) : (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '24px' }}>
                  {stats.map((stat) => (
                    <div key={stat.title} style={{ background: colors.cardBg, borderRadius: '16px', padding: '24px', textAlign: stat.align }}>
                      <h5 style={{ fontSize: '12px', color: colors.secondaryText, fontWeight: '500', margin: '0 0 12px 0', textTransform: 'uppercase' }}>
                        {stat.title}
                      </h5>
                      <p style={{ fontSize: stat.align === 'center' ? '48px' : '16px', fontWeight: '700', margin: 0, color: stat.align === 'center' ? PRIMARY : colors.text }}>
                        {stat.value}
                      </p>
                    </div>
                  ))}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  {/* Recent Messages */}
                  <div style={{ background: colors.cardBg, borderRadius: '16px', padding: '24px' }}>
                    <h5 style={{ fontSize: '14px', fontWeight: '700', margin: '0 0 16px 0', color: colors.text }}>💬 Recent Messages</h5>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {MESSAGES.map((msg, idx) => (
                        <div key={idx} style={{ padding: '12px', background: darkMode ? '#0f3460' : '#f9f9f9', borderRadius: '8px', fontSize: '13px', color: colors.text }}>
                          <div style={{ fontWeight: '600', color: colors.text }}>{msg.name}</div>
                          <div style={{ fontSize: '12px', color: colors.secondaryText }}>{msg.property}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Recent Notifications */}
                  <div style={{ background: colors.cardBg, borderRadius: '16px', padding: '24px' }}>
                    <h5 style={{ fontSize: '14px', fontWeight: '700', margin: '0 0 16px 0', color: colors.text }}>
                      🔔 Recent Notifications
                      {getUnreadCount(userType) > 0 && (
                        <span style={{
                          marginLeft: '8px', background: '#dc3545', color: '#fff',
                          fontSize: '11px', padding: '2px 7px', borderRadius: '10px', fontWeight: '700',
                        }}>
                          {getUnreadCount(userType)} new
                        </span>
                      )}
                    </h5>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {getNotifications(userType).slice(0, 3).length === 0 ? (
                        <div style={{ padding: '12px', background: darkMode ? '#0f3460' : '#f9f9f9', borderRadius: '8px', fontSize: '13px', color: colors.secondaryText, textAlign: 'center' }}>
                          No notifications yet
                        </div>
                      ) : (
                        getNotifications(userType).slice(0, 3).map((notif) => (
                          <div
                            key={notif.id}
                            onClick={() => { markNotificationRead(notif.id); setActiveNav('notifications'); }}
                            style={{
                              padding: '10px 12px',
                              background: notif.read ? (darkMode ? '#0f3460' : '#f9f9f9') : (darkMode ? '#1a2a50' : '#fff8f0'),
                              border: notif.read ? 'none' : `1px solid ${PRIMARY}`,
                              borderRadius: '8px',
                              cursor: 'pointer',
                              display: 'flex',
                              gap: '10px',
                              alignItems: 'flex-start',
                              transition: 'opacity 0.2s',
                            }}
                          >
                            <span style={{ fontSize: '16px', flexShrink: 0 }}>
                              {notif.type === 'new_booking' ? '📦' : notif.type === 'booking_accepted' ? '✅' : notif.type === 'booking_rejected' ? '❌' : '💬'}
                            </span>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontWeight: '600', fontSize: '12px', color: colors.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {notif.title}
                              </div>
                              <div style={{ fontSize: '11px', color: colors.secondaryText, marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {notif.message}
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                      {getNotifications(userType).length > 3 && (
                        <button
                          onClick={() => setActiveNav('notifications')}
                          style={{ background: 'transparent', border: 'none', color: PRIMARY, fontSize: '12px', fontWeight: '600', cursor: 'pointer', padding: '4px 0', textAlign: 'left' }}
                        >
                          View all {getNotifications(userType).length} notifications →
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}