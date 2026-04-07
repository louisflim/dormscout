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

export default function DashboardTenant({ onLogout, setScreen, darkMode = false }) {
  const colors = darkMode ? COLORS.dark : COLORS.light;
  const [activeNav, setActiveNav] = useState('overview');

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
            setScreen('settings-tenant');
          } else {
            setActiveNav(id);
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
        {/* Welcome Section */}
        <h2 style={{
          fontSize: '48px',
          fontWeight: '700',
          margin: '0 0 32px 0',
          textAlign: 'center',
          lineHeight: '1.1',
        }}>
          <span style={{ color: PRIMARY }}>Welcome</span>
          <span style={{ color: SECONDARY }}> Back</span>
        </h2>

        {/* Dashboard Title */}
        <div style={{ marginBottom: '28px' }}>
          <h4 style={{
            fontSize: '20px',
            fontWeight: '700',
            margin: '0 0 8px 0',
            color: colors.text,
          }}>
            Dashboard
          </h4>
          <p style={{
            fontSize: '14px',
            color: colors.secondaryText,
            margin: 0,
          }}>
            See an overview of your current bookings, messages, and recent activity.
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
          }}>
            <NavItem id="overview" label="Overview" />
            <NavItem id="map" label="Map View" />
            <NavItem id="booking" label="Booking" />
            <NavItem id="messages" label="Messages" />
            <NavItem id="settings" label="Settings" />
            <NavItem id="reviews" label="Reviews" />
          </div>

          {/* Right Content */}
          <div style={{ flex: 1 }}>
            {/* Stats Cards */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '20px',
              marginBottom: '24px',
            }}>
              <div style={{
                background: colors.cardBg,
                borderRadius: '16px',
                padding: '24px',
                textAlign: 'left',
              }}>
                <h5 style={{ fontSize: '12px', color: colors.secondaryText, fontWeight: '500', margin: '0 0 12px 0', textTransform: 'uppercase' }}>Your Current Booking</h5>
                <p style={{ fontSize: '16px', fontWeight: '700', margin: 0, color: colors.text }}>Sunshine Boarding House</p>
              </div>
              <div style={{
                background: colors.cardBg,
                borderRadius: '16px',
                padding: '24px',
                textAlign: 'center',
              }}>
                <h5 style={{ fontSize: '12px', color: colors.secondaryText, fontWeight: '500', margin: '0 0 12px 0', textTransform: 'uppercase' }}>Notifications</h5>
                <p style={{ fontSize: '48px', fontWeight: '700', margin: 0, color: PRIMARY }}>1</p>
              </div>
              <div style={{
                background: colors.cardBg,
                borderRadius: '16px',
                padding: '24px',
                textAlign: 'center',
              }}>
                <h5 style={{ fontSize: '12px', color: colors.secondaryText, fontWeight: '500', margin: '0 0 12px 0', textTransform: 'uppercase' }}>Messages</h5>
                <p style={{ fontSize: '48px', fontWeight: '700', margin: 0, color: PRIMARY }}>1</p>
              </div>
            </div>

            {/* Recent Messages Card */}
            <div style={{
              background: colors.cardBg,
              borderRadius: '16px',
              padding: '24px',
            }}>
              <h5 style={{ fontSize: '14px', fontWeight: '700', margin: '0 0 16px 0', color: colors.text }}>Recent Messages</h5>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {[
                  { name: 'LeBron James', property: 'Sunshine Boarding House' },
                  { name: 'Steph Curry', property: 'Sunshine Boarding House' },
                  { name: 'Michael Jordan', property: 'Sunshine Boarding House' },
                ].map((msg, idx) => (
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
        </div>
      </div>
    </div>
  );
}
