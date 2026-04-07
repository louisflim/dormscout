import React, { useState, useEffect } from 'react';
import Map from './map.jsx';
import Listings from './components/Listings';

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
    { id: 'messages', label: 'Messages' },
    { id: 'settings', label: 'Settings' },
    { id: 'reviews', label: 'Reviews' },
  ],
  tenant: [
    { id: 'overview', label: 'Overview' },
    { id: 'map', label: 'Map View' },
    { id: 'booking', label: 'Booking' },
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

const LISTINGS = [
  'Sunshine Boarding House',
  'BlueSky Apartments',
  'Casa Mariposa',
];

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
  messages: '💬',
  settings: '⚙️',
  reviews: '⭐',
};

export default function Dashboard({ userType = 'tenant', onLogout, setScreen, darkMode = false }) {
  const colors = darkMode ? COLORS.dark : COLORS.light;
  const [activeNav, setActiveNav] = useState('overview');
  const navItems = NAV_ITEMS[userType] || NAV_ITEMS.tenant;
  const stats = STATS[userType] || STATS.tenant;
  const isLandlord = userType === 'landlord';

  // Live listings synced from localStorage / Listings component
  const [currentListings, setCurrentListings] = useState([]);

  useEffect(() => {
    function loadFromStorage() {
      try {
        const raw = localStorage.getItem('dormscout_listings');
        if (raw) setCurrentListings(JSON.parse(raw));
        else {
          // seed dashboard with fallback LISTINGS and persist so Listings component sees it too
          setCurrentListings(LISTINGS);
          try {
            localStorage.setItem('dormscout_listings', JSON.stringify(LISTINGS));
          } catch (e) {
            // ignore storage errors
          }
        }
      } catch (e) {
        console.error('Failed to load listings in Dashboard', e);
        setCurrentListings([]);
      }
    }

    loadFromStorage();

    const handler = (e) => {
      if (e && e.detail) setCurrentListings(e.detail);
      else loadFromStorage();
    };

    window.addEventListener('dormscout:listingsUpdated', handler);
    return () => window.removeEventListener('dormscout:listingsUpdated', handler);
  }, []);

  const handleNavClick = (id) => {
    if (id === 'settings') {
      setScreen(isLandlord ? 'settings-landlord' : 'settings-tenant');
    } else {
      setActiveNav(id);
    }
  };

  // If landlord, replace All Listings stat value with live count
  const listingCount = (currentListings && currentListings.length > 0) ? currentListings.length : LISTINGS.length;
  const statsToRender = stats.map((s) => (isLandlord && s.title === 'All Listings' ? { ...s, value: String(listingCount) } : s));

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
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            background: '#9370DB',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontSize: '18px',
          }}>
            👤
          </div>
          <button
            onClick={onLogout}
            style={{
              padding: '8px 16px',
              border: `1px solid ${PRIMARY}`,
              borderRadius: '6px',
              background: PRIMARY,
              color: '#fff',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600',
            }}
          >
            Logout
          </button>
        </div>
      </nav>

      <div style={{ padding: '32px 40px', maxWidth: '1400px', margin: '0 auto' }}>
        <h2 style={{
          fontSize: '48px',
          fontWeight: '700',
          margin: isLandlord ? '0 0 8px 0' : '0 0 32px 0',
          textAlign: 'center',
          lineHeight: '1.1',
        }}>
          {activeNav === 'map' ? (
            <>
              <span style={{ color: PRIMARY }}>Map</span>
              <span style={{ color: SECONDARY }}> View</span>
            </>
          ) : (
            <>
              <span style={{ color: PRIMARY }}>Welcome</span>
              <span style={{ color: SECONDARY }}> Back</span>
            </>
          )}
        </h2>
        {isLandlord && (
          <h3 style={{
            fontSize: '36px',
            fontWeight: '700',
            margin: '0 0 32px 0',
            textAlign: 'center',
            color: SECONDARY,
          }}>
            Kobe Bryant!
          </h3>
        )}

        <div style={{ marginBottom: '28px' }}>
          <h4 style={{
            fontSize: '20px',
            fontWeight: '700',
            margin: '0 0 8px 0',
            color: colors.text,
          }}>
            {activeNav === 'map' ? 'Map' : 'Dashboard'}
          </h4>
          <p style={{
            fontSize: '14px',
            color: colors.secondaryText,
            margin: 0,
          }}>
            {activeNav === 'map'
              ? 'Search for dorms around Cebu City and find the perfect dorm near campus'
              : isLandlord
                ? 'See an overview of your current listings, messages, and recent activity.'
                : 'See an overview of your current bookings, messages, and recent activity.'}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '24px' }}>
          <div style={{
            width: '280px',
            background: colors.sidebarBg,
            borderRadius: '20px',
            padding: '24px',
            height: 'fit-content',
          }}>
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
                  color: activeNav === item.id ? '#fff' : PRIMARY, // inactive should be PRIMARY so it's readable
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
                  // On hover, if not active, give a subtle highlight and keep text readable
                  if (activeNav !== item.id) {
                    e.currentTarget.style.background = '#f5f5f5';
                    e.currentTarget.style.color = PRIMARY;
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeNav !== item.id) {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = PRIMARY;
                  }
                }}
              >
                <span style={{ fontSize: '16px' }}>{ICONS[item.id] || '•'}</span>
                {item.label}
              </button>
            ))}
          </div>

          <div style={{ flex: 1 }}>
            {activeNav === 'map' ? (
              <Map darkMode={darkMode} />
            ) : activeNav === 'listing' && isLandlord ? (
              // If landlord selected the Listing nav, show the Listings board as the main content only
              <div style={{ marginTop: 24 }}>
                <Listings mode="board" />
              </div>
            ) : (
              <>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '20px',
                  marginBottom: '24px',
                }}>
                  {statsToRender.map((stat) => (
                    <div key={stat.title} style={{
                      background: colors.cardBg,
                      borderRadius: '16px',
                      padding: '24px',
                      textAlign: stat.align,
                    }}>
                      <h5 style={{ fontSize: '12px', color: colors.secondaryText, fontWeight: '500', margin: '0 0 12px 0', textTransform: 'uppercase' }}>
                        {stat.title}
                      </h5>
                      <p style={{ fontSize: stat.align === 'center' ? '48px' : '16px', fontWeight: '700', margin: 0, color: stat.align === 'center' ? PRIMARY : colors.text }}>
                        {stat.value}
                      </p>
                    </div>
                  ))}
                </div>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: isLandlord ? '1fr 1fr' : '1fr',
                  gap: '20px',
                }}>
                  {isLandlord && (
                    <div style={{
                      background: colors.cardBg,
                      borderRadius: '16px',
                      padding: '24px',
                    }}>
                      <h5 style={{ fontSize: '14px', fontWeight: '700', margin: '0 0 16px 0', color: colors.text }}>Current Listings</h5>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {(currentListings && currentListings.length > 0 ? currentListings : LISTINGS).map((listing, idx) => (
                          <div key={listing.id || idx} style={{
                            padding: '12px',
                            background: darkMode ? '#0f3460' : '#f9f9f9',
                            borderRadius: '8px',
                            fontSize: '13px',
                            color: colors.text,
                          }}>
                            {typeof listing === 'string' ? listing : listing.title}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div style={{
                    background: colors.cardBg,
                    borderRadius: '16px',
                    padding: '24px',
                  }}>
                    <h5 style={{ fontSize: '14px', fontWeight: '700', margin: '0 0 16px 0', color: colors.text }}>Recent Messages</h5>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {MESSAGES.map((msg, idx) => (
                        <div key={idx} style={{
                          padding: '12px',
                          background: darkMode ? '#0f3460' : '#f9f9f9',
                          borderRadius: '8px',
                          fontSize: '13px',
                          color: colors.text,
                        }}>
                          <div style={{ fontWeight: '600', color: colors.text }}>{msg.name}</div>
                          <div style={{ fontSize: '12px', color: colors.secondaryText }}>{msg.property}</div>
                        </div>
                      ))}
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
