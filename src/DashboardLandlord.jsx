import React, { useState } from 'react';

const PRIMARY = '#E8622E';
const SECONDARY = '#5BADA8';

export default function DashboardLandlord({ onLogout }) {
  const [activeNav, setActiveNav] = useState('overview');

  const NavItem = ({ id, label }) => (
    <button
      onClick={() => setActiveNav(id)}
      style={{
        width: '100%',
        padding: '12px 16px',
        textAlign: 'left',
        border: 'none',
        background: activeNav === id ? PRIMARY : 'transparent',
        color: activeNav === id ? '#fff' : '#333',
        borderRadius: activeNav === id ? '20px' : '0',
        cursor: 'pointer',
        fontSize: '14px',
        fontWeight: activeNav === id ? '600' : '500',
        margin: activeNav === id ? '8px' : '0',
      }}
    >
      {label}
    </button>
  );

  return (
    <div style={{
      background: 'linear-gradient(120deg, #d7ebe9 0%, #e8d8c8 55%, #f6dfc9 100%)',
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
        background: '#fff',
        borderBottom: `3px solid ${SECONDARY}`,
        padding: '16px 32px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <h1 style={{ fontSize: '24px', fontWeight: '700', margin: 0, color: '#000' }}>DormScout</h1>
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
          margin: '0 0 8px 0',
          textAlign: 'center',
          lineHeight: '1.1',
        }}>
          <span style={{ color: PRIMARY }}>Welcome</span>
          <span style={{ color: SECONDARY }}> Back</span>
        </h2>
        <h3 style={{
          fontSize: '36px',
          fontWeight: '700',
          margin: '0 0 32px 0',
          textAlign: 'center',
          color: SECONDARY,
        }}>
          Kobe Bryant!
        </h3>

        {/* Dashboard Title */}
        <div style={{ marginBottom: '28px' }}>
          <h4 style={{
            fontSize: '20px',
            fontWeight: '700',
            margin: '0 0 8px 0',
            color: '#333',
          }}>
            Dashboard
          </h4>
          <p style={{
            fontSize: '14px',
            color: '#666',
            margin: 0,
          }}>
            See an overview of your current listings, messages, and recent activity.
          </p>
        </div>

        {/* Main Layout */}
        <div style={{ display: 'flex', gap: '24px' }}>
          {/* Left Sidebar */}
          <div style={{
            width: '280px',
            background: '#fff',
            borderRadius: '20px',
            padding: '24px',
            height: 'fit-content',
          }}>
            <NavItem id="overview" label="Overview" />
            <NavItem id="map" label="Map View" />
            <NavItem id="listing" label="Listing" />
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
                background: '#fff',
                borderRadius: '16px',
                padding: '24px',
                textAlign: 'center',
              }}>
                <h5 style={{ fontSize: '12px', color: '#999', fontWeight: '500', margin: '0 0 12px 0', textTransform: 'uppercase' }}>All Listings</h5>
                <p style={{ fontSize: '48px', fontWeight: '700', margin: 0, color: PRIMARY }}>4</p>
              </div>
              <div style={{
                background: '#fff',
                borderRadius: '16px',
                padding: '24px',
                textAlign: 'center',
              }}>
                <h5 style={{ fontSize: '12px', color: '#999', fontWeight: '500', margin: '0 0 12px 0', textTransform: 'uppercase' }}>Notifications</h5>
                <p style={{ fontSize: '48px', fontWeight: '700', margin: 0, color: PRIMARY }}>3</p>
              </div>
              <div style={{
                background: '#fff',
                borderRadius: '16px',
                padding: '24px',
                textAlign: 'center',
              }}>
                <h5 style={{ fontSize: '12px', color: '#999', fontWeight: '500', margin: '0 0 12px 0', textTransform: 'uppercase' }}>Messages</h5>
                <p style={{ fontSize: '48px', fontWeight: '700', margin: 0, color: PRIMARY }}>3</p>
              </div>
            </div>

            {/* Bottom Cards Row */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '20px',
            }}>
              {/* Current Listings */}
              <div style={{
                background: '#fff',
                borderRadius: '16px',
                padding: '24px',
              }}>
                <h5 style={{ fontSize: '14px', fontWeight: '700', margin: '0 0 16px 0', color: '#333' }}>Current Listings</h5>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {['Sunshine Boarding House', 'BlueSky Apartments', 'Casa Mariposa'].map((listing, idx) => (
                    <div key={idx} style={{
                      padding: '12px',
                      background: '#f9f9f9',
                      borderRadius: '8px',
                      fontSize: '13px',
                      color: '#555',
                    }}>
                      {listing}
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Messages */}
              <div style={{
                background: '#fff',
                borderRadius: '16px',
                padding: '24px',
              }}>
                <h5 style={{ fontSize: '14px', fontWeight: '700', margin: '0 0 16px 0', color: '#333' }}>Recent Messages</h5>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {[
                    { name: 'LeBron James', property: 'Sunshine Boarding House' },
                    { name: 'Steph Curry', property: 'Sunshine Boarding House' },
                    { name: 'Michael Jordan', property: 'Sunshine Boarding House' },
                  ].map((msg, idx) => (
                    <div key={idx} style={{
                      padding: '12px',
                      background: '#f9f9f9',
                      borderRadius: '8px',
                      fontSize: '13px',
                      color: '#555',
                    }}>
                      <div style={{ fontWeight: '600', color: '#333' }}>{msg.name}</div>
                      <div style={{ fontSize: '12px', color: '#999' }}>{msg.property}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
