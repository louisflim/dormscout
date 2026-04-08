import React, { useState } from 'react';

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
    border: '#e8e8e8',
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

const ICONS = {
  overview: '📊',
  map: '🗺️',
  listing: '📋',
  booking: '📅',
  messages: '💬',
  settings: '⚙️',
  reviews: '⭐',
};

const Toggle = ({ checked, onChange }) => (
  <button
    type="button"
    onClick={() => onChange(!checked)}
    style={{
      width: '50px',
      height: '28px',
      borderRadius: '14px',
      border: 'none',
      background: checked ? PRIMARY : '#ddd',
      cursor: 'pointer',
      position: 'relative',
      transition: 'background 0.3s',
    }}
  >
    <div
      style={{
        width: '24px',
        height: '24px',
        borderRadius: '12px',
        background: '#fff',
        position: 'absolute',
        top: '2px',
        left: checked ? '24px' : '2px',
        transition: 'left 0.3s',
      }}
    />
  </button>
);

const SettingRow = ({ label, control, colors }) => (
  <div style={{
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 0',
    borderBottom: `1px solid ${colors.border}`,
  }}>
    <label style={{ fontSize: '14px', color: colors.text, fontWeight: '500', cursor: 'pointer' }}>
      {label}
    </label>
    {control}
  </div>
);

const SettingSection = ({ title, children, colors }) => (
  <div style={{ marginBottom: '32px' }}>
    <h3 style={{
      fontSize: '18px',
      fontWeight: '700',
      color: colors.text,
      margin: '0 0 18px 0',
      paddingBottom: '12px',
      borderBottom: `3px solid ${PRIMARY}`,
    }}>
      {title}
    </h3>
    <div style={{ marginTop: '16px' }}>
      {children}
    </div>
  </div>
);

export default function Settings({ userType = 'tenant', onLogout, setScreen, darkMode = false, setDarkMode }) {
  const colors = darkMode ? COLORS.dark : COLORS.light;
  const [activeNav, setActiveNav] = useState('settings');

  const [emailNotifications, setEmailNotifications] = useState(true);
  const [inAppNotifications, setInAppNotifications] = useState(true);
  const [messageAlerts, setMessageAlerts] = useState(true);

  const [showProfile, setShowProfile] = useState(true);
  const [showContact, setShowContact] = useState(true);

  const navItems = NAV_ITEMS[userType] || NAV_ITEMS.tenant;
  const isLandlord = userType === 'landlord';

  const handleNavClick = (id) => {
    if (id === 'settings') {
      setActiveNav(id);
    } else {
      setScreen(isLandlord ? 'dashboard-landlord' : 'dashboard-tenant');
    }
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
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <div
            onClick={() => setScreen(isLandlord ? 'profile-landlord' : 'profile-tenant')}
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
            }}
          >
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
        <div style={{ marginBottom: '28px' }}>
          <h2 style={{
            fontSize: '32px',
            fontWeight: '700',
            margin: '0 0 8px 0',
            color: colors.text,
          }}>
            Settings
          </h2>
          <p style={{
            fontSize: '14px',
            color: colors.secondaryText,
            margin: 0,
          }}>
            Manage your account preferences and settings.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '24px' }}>
          <div style={{
            width: '280px',
            background: colors.sidebarBg,
            borderRadius: '20px',
            padding: '24px',
            height: 'fit-content',
            border: `1px solid ${colors.border}`,
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
              </button>
            ))}
          </div>

          <div style={{
            flex: 1,
            background: colors.cardBg,
            borderRadius: '16px',
            padding: '32px',
            border: `1px solid ${colors.border}`,
          }}>
            <SettingSection title="Appearance" colors={colors}>
              <SettingRow
                label="Dark Mode"
                control={<Toggle checked={darkMode} onChange={setDarkMode} />}
                colors={colors}
              />
            </SettingSection>

            <SettingSection title="Notifications" colors={colors}>
              <SettingRow
                label="Email Notifications"
                control={<Toggle checked={emailNotifications} onChange={setEmailNotifications} />}
                colors={colors}
              />
              <SettingRow
                label="In-App Notifications"
                control={<Toggle checked={inAppNotifications} onChange={setInAppNotifications} />}
                colors={colors}
              />
              <SettingRow
                label="New Message Alerts"
                control={<Toggle checked={messageAlerts} onChange={setMessageAlerts} />}
                colors={colors}
              />
            </SettingSection>

            <SettingSection title="Privacy" colors={colors}>
              <SettingRow
                label="Show Profile"
                control={<Toggle checked={showProfile} onChange={setShowProfile} />}
                colors={colors}
              />
              <SettingRow
                label="Show Contact Number"
                control={<Toggle checked={showContact} onChange={setShowContact} />}
                colors={colors}
              />
            </SettingSection>

            <SettingSection title="Account" colors={colors}>
              <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                <button
                  style={{
                    padding: '12px 24px',
                    borderRadius: '6px',
                    border: `1px solid ${PRIMARY}`,
                    background: '#fff',
                    color: PRIMARY,
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '600',
                  }}
                >
                  Change Password
                </button>
                <button
                  style={{
                    padding: '12px 24px',
                    borderRadius: '6px',
                    border: 'none',
                    background: '#dc3545',
                    color: '#fff',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '600',
                  }}
                >
                  Delete Account
                </button>
              </div>
            </SettingSection>
          </div>
        </div>
      </div>
    </div>
  );
}
