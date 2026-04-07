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

export default function SettingsTenant({ onLogout, setScreen, darkMode = false, setDarkMode }) {
  const colors = darkMode ? COLORS.dark : COLORS.light;
  const [activeNav, setActiveNav] = useState('settings');

  // Notifications
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [inAppNotifications, setInAppNotifications] = useState(true);
  const [messageAlerts, setMessageAlerts] = useState(true);

  // Privacy
  const [showProfile, setShowProfile] = useState(true);
  const [showContact, setShowContact] = useState(true);

  const NavItem = ({ id, label }) => {
    const icons = {
      overview: '📊',
      map: '🗺️',
      booking: '📅',
      messages: '💬',
      settings: '⚙️',
      reviews: '⭐'
    };

    return (
      <button
        onClick={() => {
          if (id === 'settings') {
            setActiveNav(id);
          } else {
            setScreen('dashboard-tenant');
          }
        }}
        style={{
          width: '100%',
          padding: '12px 16px',
          textAlign: 'left',
          border: 'none',
          background: activeNav === id ? PRIMARY : 'transparent',
          color: activeNav === id ? '#fff' : PRIMARY,
          borderRadius: activeNav === id ? '12px' : '0',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: activeNav === id ? '600' : '500',
          margin: activeNav === id ? '6px' : '0',
          marginBottom: '4px',
          transition: 'all 0.25s ease',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
        }}
        onMouseEnter={(e) => {
          if (activeNav !== id) {
            e.target.style.background = '#f5f5f5';
            e.target.style.color = PRIMARY;
          }
        }}
        onMouseLeave={(e) => {
          if (activeNav !== id) {
            e.target.style.background = 'transparent';
            e.target.style.color = PRIMARY;
          }
        }}
      >
        <span style={{ fontSize: '16px' }}>{icons[id] || '•'}</span>
        {label}
      </button>
    );
  };

  const SettingRow = ({ label, control }) => (
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

  const SettingSection = ({ title, children }) => (
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

  return (
    <div style={{
      background: colors.bg,
      minHeight: '100vh',
      paddingTop: '60px',
    }}>
      {/* Navbar */}
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

      {/* Main Content */}
      <div style={{ padding: '32px 40px', maxWidth: '1400px', margin: '0 auto' }}>
        {/* Page Title */}
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

        {/* Main Layout */}
        <div style={{ display: 'flex', gap: '24px' }}>
          {/* Left Sidebar */}
          <div style={{
            width: '280px',
            background: colors.sidebarBg,
            borderRadius: '20px',
            padding: '24px',
            height: 'fit-content',
            border: `1px solid ${colors.border}`,
          }}>
            <NavItem id="overview" label="Overview" />
            <NavItem id="map" label="Map View" />
            <NavItem id="booking" label="Booking" />
            <NavItem id="messages" label="Messages" />
            <NavItem id="settings" label="Settings" />
            <NavItem id="reviews" label="Reviews" />
          </div>

          {/* Right Content */}
          <div style={{
            flex: 1,
            background: colors.cardBg,
            borderRadius: '16px',
            padding: '32px',
            border: `1px solid ${colors.border}`,
          }}>
            {/* Appearance Section */}
            <SettingSection title="Appearance">
              <SettingRow
                label="Dark Mode"
                control={<Toggle checked={darkMode} onChange={setDarkMode} />}
              />
            </SettingSection>

            {/* Notifications Section */}
            <SettingSection title="Notifications">
              <SettingRow
                label="Email Notifications"
                control={<Toggle checked={emailNotifications} onChange={setEmailNotifications} />}
              />
              <SettingRow
                label="In-App Notifications"
                control={<Toggle checked={inAppNotifications} onChange={setInAppNotifications} />}
              />
              <SettingRow
                label="New Message Alerts"
                control={<Toggle checked={messageAlerts} onChange={setMessageAlerts} />}
              />
            </SettingSection>

            {/* Privacy Section */}
            <SettingSection title="Privacy">
              <SettingRow
                label="Show Profile"
                control={<Toggle checked={showProfile} onChange={setShowProfile} />}
              />
              <SettingRow
                label="Show Contact Number"
                control={<Toggle checked={showContact} onChange={setShowContact} />}
              />
            </SettingSection>

            {/* Account Section */}
            <SettingSection title="Account">
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
