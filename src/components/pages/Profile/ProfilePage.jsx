import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

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

const SAMPLE_BOARDING_HOUSES = [
  {
    id: 1,
    title: 'Sunshine Boarding House',
    price: '₱5,500/month',
    rooms: '15 rooms',
    availableRooms: '3 available',
    address: 'Cebu City, Cebu',
    image: '🏠',
  },
  {
    id: 2,
    title: 'Cozy Dorm',
    price: '₱4,200/month',
    rooms: '12 rooms',
    availableRooms: '5 available',
    address: 'Mandaue, Cebu',
    image: '🏢',
  },
  {
    id: 3,
    title: 'Campus Haven',
    price: '₱6,000/month',
    rooms: '20 rooms',
    availableRooms: '2 available',
    address: 'Cebu City, Cebu',
    image: '🏛️',
  },
];

export default function ProfilePage({ role, darkMode, setDarkMode }) {
  const navigate = useNavigate();

  const userRole = role || 'tenant';
  const isDark = darkMode || false;
  const colors = isDark ? COLORS.dark : COLORS.light;
  const isLandlord = userRole === 'landlord';

  const [showDropdown, setShowDropdown] = useState(false);
  const [profilePicture, setProfilePicture] = useState('👤');

  const handleProfilePictureChange = () => {
    const emojis = ['👤', '👨', '👩', '🧑', '😊', '🎭'];
    const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
    setProfilePicture(randomEmoji);
  };

  const handleLogout = () => {
    navigate('/');
  };

  return (
    <div style={{ background: colors.bg, minHeight: '100vh', paddingTop: '60px' }}>
      <nav
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          background: colors.navBg,
          borderBottom: '3px solid ' + SECONDARY,
          padding: '16px 32px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <h1 style={{ fontSize: '24px', fontWeight: '700', margin: 0, color: colors.text }}>
          DormScout
        </h1>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', position: 'relative' }}>
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
            }}
          >
            {profilePicture}
          </div>

          {showDropdown && (
            <div
              style={{
                position: 'absolute',
                top: '60px',
                right: '0',
                background: colors.cardBg,
                borderRadius: '12px',
                border: '1px solid ' + colors.border,
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                minWidth: '220px',
                zIndex: 1001,
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  padding: '12px 16px',
                  fontSize: '14px',
                  borderBottom: '1px solid ' + colors.border,
                  fontWeight: '600',
                  background: PRIMARY,
                  color: '#fff',
                }}
              >
                {profilePicture} My Profile
              </div>
              <div
                onClick={() => {
                  navigate('/dashboard?section=settings');
                  setShowDropdown(false);
                }}
                style={{
                  padding: '12px 16px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  color: colors.text,
                  borderBottom: '1px solid ' + colors.border,
                }}
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
                  borderBottom: '1px solid ' + colors.border,
                }}
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
                  borderBottom: '1px solid ' + colors.border,
                }}
              >
                ℹ️ About Us
              </div>
              <div
                onClick={() => setDarkMode(!isDark)}
                style={{
                  padding: '12px 16px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  color: colors.text,
                  borderBottom: '1px solid ' + colors.border,
                }}
              >
                {isDark ? '☀️ Light Mode' : '🌙 Dark Mode'}
              </div>
              <div
                onClick={() => {
                  setShowDropdown(false);
                  handleLogout();
                }}
                style={{
                  padding: '12px 16px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  color: '#dc3545',
                  fontWeight: '600',
                }}
              >
                🚪 Logout
              </div>
            </div>
          )}
        </div>
      </nav>

      <div style={{ padding: '40px 32px', maxWidth: '1000px', margin: '0 auto' }}>
        <div
          style={{
            background: colors.cardBg,
            borderRadius: '20px',
            padding: '40px',
            textAlign: 'center',
            marginBottom: '40px',
            border: '1px solid ' + colors.border,
          }}
        >
          <div
            onClick={handleProfilePictureChange}
            style={{
              width: '100px',
              height: '100px',
              borderRadius: '50%',
              background: '#9370DB',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontSize: '48px',
              cursor: 'pointer',
              margin: '0 auto 24px auto',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            }}
            title="Click to change profile picture"
          >
            {profilePicture}
          </div>

          <h1 style={{ fontSize: '36px', fontWeight: '700', margin: '0 0 8px 0', color: isDark ? '#fff' : '#000' }}>
            {isLandlord ? 'Maria Santos' : 'John Doe'}
          </h1>

          <p style={{ fontSize: '16px', color: colors.secondaryText, margin: '0 0 24px 0', lineHeight: '1.5' }}>
            {isLandlord
              ? 'Passionate about providing quality accommodation for students. Over 5 years of experience in the boarding house business.'
              : 'College student looking for a comfortable place to stay near campus. Love meeting new people!'}
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginBottom: '24px', flexWrap: 'wrap' }}>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '20px', fontWeight: '700', margin: '0', color: PRIMARY }}>
                {isLandlord ? '3' : '0'}
              </p>
              <p style={{ fontSize: '12px', color: colors.secondaryText, margin: '4px 0 0 0' }}>
                {isLandlord ? 'Listings' : 'Bookings'}
              </p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '20px', fontWeight: '700', margin: '0', color: PRIMARY }}>245</p>
              <p style={{ fontSize: '12px', color: colors.secondaryText, margin: '4px 0 0 0' }}>Followers</p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '20px', fontWeight: '700', margin: '0', color: PRIMARY }}>
                {isLandlord ? '4.8' : '4.5'}
              </p>
              <p style={{ fontSize: '12px', color: colors.secondaryText, margin: '4px 0 0 0' }}>Rating</p>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <button
              style={{
                padding: '10px 24px',
                borderRadius: '8px',
                border: '2px solid ' + PRIMARY,
                background: 'transparent',
                color: PRIMARY,
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600',
              }}
            >
              + Follow
            </button>
            <button
              style={{
                padding: '10px 24px',
                borderRadius: '8px',
                border: 'none',
                background: SECONDARY,
                color: '#fff',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600',
              }}
            >
              {isLandlord ? '245' : '0'} Followers
            </button>
            <button
              style={{
                padding: '10px 24px',
                borderRadius: '8px',
                border: 'none',
                background: PRIMARY,
                color: '#fff',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600',
              }}
            >
              Message
            </button>
          </div>
        </div>

        {isLandlord && (
          <div>
            <h2 style={{ fontSize: '28px', fontWeight: '700', margin: '0 0 24px 0', color: colors.text }}>
              <span style={{ color: PRIMARY }}>My</span> Listings
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
              {SAMPLE_BOARDING_HOUSES.map((house) => (
                <div
                  key={house.id}
                  style={{
                    background: colors.cardBg,
                    borderRadius: '16px',
                    overflow: 'hidden',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                    border: '1px solid ' + colors.border,
                    cursor: 'pointer',
                  }}
                >
                  <div
                    style={{
                      width: '100%',
                      height: '180px',
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '64px',
                    }}
                  >
                    {house.image}
                  </div>
                  <div style={{ padding: '20px' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: '700', margin: '0 0 8px 0', color: colors.text }}>
                      {house.title}
                    </h3>
                    <p style={{ fontSize: '14px', color: colors.secondaryText, margin: '0 0 12px 0' }}>
                      {house.address}
                    </p>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
                      <div style={{
                        background: isDark ? '#1a1a4a' : '#f5f5f5',
                        padding: '8px 12px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        color: colors.secondaryText,
                        textAlign: 'center',
                      }}>
                        {house.rooms}
                      </div>
                      <div style={{
                        background: isDark ? '#1a1a4a' : '#f5f5f5',
                        padding: '8px 12px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        color: colors.secondaryText,
                        textAlign: 'center',
                      }}>
                        {house.availableRooms}
                      </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <p style={{ fontSize: '18px', fontWeight: '700', margin: 0, color: PRIMARY }}>
                        {house.price}
                      </p>
                      <button
                        style={{
                          background: SECONDARY,
                          color: '#fff',
                          border: 'none',
                          padding: '8px 16px',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '13px',
                          fontWeight: '600',
                        }}
                      >
                        View
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {!isLandlord && (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: colors.secondaryText }}>
            <p style={{ fontSize: '16px', lineHeight: '1.6' }}>No additional content to display</p>
          </div>
        )}
      </div>
    </div>
  );
}