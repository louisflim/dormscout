import React, { useState, useEffect, useRef } from 'react';

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
  const [activeSettingTab, setActiveSettingTab] = useState('profile');
  const [showDropdown, setShowDropdown] = useState(false);

  // Profile settings states
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [university, setUniversity] = useState('');
  const [course, setCourse] = useState('');
  const [yearLevel, setYearLevel] = useState('');
  const [studentId, setStudentId] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [businessPermit, setBusinessPermit] = useState('');

  const [emailNotifications, setEmailNotifications] = useState(true);
  const [inAppNotifications, setInAppNotifications] = useState(true);
  const [messageAlerts, setMessageAlerts] = useState(true);

  const dropdownRef = useRef(null);

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
            <div
              style={{
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
              }}
            >
              <div
                onClick={() => {
                  setActiveSettingTab('profile');
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
                👤 Profile Settings
              </div>

              <div
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
                  onLogout();
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
            <div style={{ display: 'flex', gap: '12px', marginBottom: '32px' }}>
              <button
                onClick={() => setActiveSettingTab('profile')}
                style={{
                  padding: '12px 24px',
                  borderRadius: '8px',
                  border: 'none',
                  background: activeSettingTab === 'profile' ? PRIMARY : colors.border,
                  color: activeSettingTab === 'profile' ? '#fff' : colors.text,
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600',
                  transition: 'all 0.25s ease',
                }}
              >
                Profile Settings
              </button>
              <button
                onClick={() => setActiveSettingTab('application')}
                style={{
                  padding: '12px 24px',
                  borderRadius: '8px',
                  border: 'none',
                  background: activeSettingTab === 'application' ? PRIMARY : colors.border,
                  color: activeSettingTab === 'application' ? '#fff' : colors.text,
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600',
                  transition: 'all 0.25s ease',
                }}
              >
                Application Settings
              </button>
            </div>

            {activeSettingTab === 'profile' && (
              <>
                <SettingSection title="Profile Picture" colors={colors}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '20px' }}>
                    <div
                      style={{
                        width: '80px',
                        height: '80px',
                        borderRadius: '50%',
                        background: '#9370DB',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#fff',
                        fontSize: '36px',
                      }}
                    >
                      👤
                    </div>
                    <div>
                      <p style={{ color: colors.secondaryText, fontSize: '14px', margin: '0 0 8px 0' }}>
                        Click the avatar to upload a new profile picture.
                      </p>
                      <button
                        style={{
                          padding: '8px 16px',
                          borderRadius: '6px',
                          border: 'none',
                          background: PRIMARY,
                          color: '#fff',
                          cursor: 'pointer',
                          fontSize: '13px',
                          fontWeight: '600',
                        }}
                      >
                        Upload Profile
                      </button>
                    </div>
                  </div>
                </SettingSection>

                <SettingSection title="Personal Information" colors={colors}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                    <div>
                      <label style={{ fontSize: '12px', color: colors.secondaryText, fontWeight: '600', display: 'block', marginBottom: '8px' }}>
                        First Name
                      </label>
                      <input
                        type="text"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          borderRadius: '6px',
                          border: `1px solid ${colors.border}`,
                          background: colors.bg,
                          color: colors.text,
                          fontSize: '14px',
                          boxSizing: 'border-box',
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '12px', color: colors.secondaryText, fontWeight: '600', display: 'block', marginBottom: '8px' }}>
                        Last Name
                      </label>
                      <input
                        type="text"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          borderRadius: '6px',
                          border: `1px solid ${colors.border}`,
                          background: colors.bg,
                          color: colors.text,
                          fontSize: '14px',
                          boxSizing: 'border-box',
                        }}
                      />
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                      <label style={{ fontSize: '12px', color: colors.secondaryText, fontWeight: '600', display: 'block', marginBottom: '8px' }}>
                        Email
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          borderRadius: '6px',
                          border: `1px solid ${colors.border}`,
                          background: colors.bg,
                          color: colors.text,
                          fontSize: '14px',
                          boxSizing: 'border-box',
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '12px', color: colors.secondaryText, fontWeight: '600', display: 'block', marginBottom: '8px' }}>
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          borderRadius: '6px',
                          border: `1px solid ${colors.border}`,
                          background: colors.bg,
                          color: colors.text,
                          fontSize: '14px',
                          boxSizing: 'border-box',
                        }}
                      />
                    </div>
                  </div>
                  <button
                    style={{
                      marginTop: '16px',
                      padding: '8px 16px',
                      borderRadius: '6px',
                      border: 'none',
                      background: PRIMARY,
                      color: '#fff',
                      cursor: 'pointer',
                      fontSize: '13px',
                      fontWeight: '600',
                    }}
                  >
                    Save Changes
                  </button>
                </SettingSection>

                {isLandlord && (
                  <SettingSection title="Business Information" colors={colors}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                      <div>
                        <label style={{ fontSize: '12px', color: colors.secondaryText, fontWeight: '600', display: 'block', marginBottom: '8px' }}>
                          Business Name
                        </label>
                        <input
                          type="text"
                          value={businessName}
                          onChange={(e) => setBusinessName(e.target.value)}
                          style={{
                            width: '100%',
                            padding: '10px 12px',
                            borderRadius: '6px',
                            border: `1px solid ${colors.border}`,
                            background: colors.bg,
                            color: colors.text,
                            fontSize: '14px',
                            boxSizing: 'border-box',
                          }}
                          placeholder="Enter business name"
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: '12px', color: colors.secondaryText, fontWeight: '600', display: 'block', marginBottom: '8px' }}>
                          Business Permit Number
                        </label>
                        <input
                          type="text"
                          value={businessPermit}
                          onChange={(e) => setBusinessPermit(e.target.value)}
                          style={{
                            width: '100%',
                            padding: '10px 12px',
                            borderRadius: '6px',
                            border: `1px solid ${colors.border}`,
                            background: colors.bg,
                            color: colors.text,
                            fontSize: '14px',
                            boxSizing: 'border-box',
                          }}
                          placeholder="Enter permit number"
                        />
                      </div>
                    </div>
                    <p style={{ fontSize: '13px', color: colors.secondaryText, margin: '12px 0', fontStyle: 'italic' }}>
                      ✓ Fill in your business details to be verified as a legitimate landlord
                    </p>
                    <button
                      style={{
                        marginTop: '16px',
                        padding: '8px 16px',
                        borderRadius: '6px',
                        border: 'none',
                        background: PRIMARY,
                        color: '#fff',
                        cursor: 'pointer',
                        fontSize: '13px',
                        fontWeight: '600',
                      }}
                    >
                      Verify
                    </button>
                  </SettingSection>
                )}

                {!isLandlord && (
                  <SettingSection title="Student Information" colors={colors}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                      <div>
                        <label style={{ fontSize: '12px', color: colors.secondaryText, fontWeight: '600', display: 'block', marginBottom: '8px' }}>
                          University
                        </label>
                        <select
                          value={university}
                          onChange={(e) => setUniversity(e.target.value)}
                          style={{
                            width: '100%',
                            padding: '10px 12px',
                            borderRadius: '6px',
                            border: `1px solid ${colors.border}`,
                            background: colors.bg,
                            color: colors.text,
                            fontSize: '14px',
                            boxSizing: 'border-box',
                          }}
                        >
                          <option value="">Select Your School</option>
                          <option>Cebu Institute of Technology - University</option>
                          <option>University of San Carlos - Downtown</option>
                          <option>University of the Visayas</option>
                          <option>University of Cebu - Main</option>
                          <option>University of San Carlos - Talamban</option>
                          <option>University of Cebu - Banilad</option>
                          <option>University of Cebu - METC</option>
                          <option>University of San Jose-Recoletos - Main</option>
                          <option>University of San Jose-Recoletos - Basak</option>
                          <option>Cebu Normal University</option>
                          <option>University of the Philippines Cebu</option>
                          <option>Southwestern University PHINMA</option>
                          <option>Cebu Technological University</option>
                          <option>Saint Theresa's College</option>
                        </select>
                      </div>
                      <div>
                        <label style={{ fontSize: '12px', color: colors.secondaryText, fontWeight: '600', display: 'block', marginBottom: '8px' }}>
                          Course
                        </label>
                        <input
                          type="text"
                          value={course}
                          onChange={(e) => setCourse(e.target.value)}
                          style={{
                            width: '100%',
                            padding: '10px 12px',
                            borderRadius: '6px',
                            border: `1px solid ${colors.border}`,
                            background: colors.bg,
                            color: colors.text,
                            fontSize: '14px',
                            boxSizing: 'border-box',
                          }}
                        />
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                      <div>
                        <label style={{ fontSize: '12px', color: colors.secondaryText, fontWeight: '600', display: 'block', marginBottom: '8px' }}>
                          Year Level
                        </label>
                        <input
                          type="text"
                          value={yearLevel}
                          onChange={(e) => setYearLevel(e.target.value)}
                          style={{
                            width: '100%',
                            padding: '10px 12px',
                            borderRadius: '6px',
                            border: `1px solid ${colors.border}`,
                            background: colors.bg,
                            color: colors.text,
                            fontSize: '14px',
                            boxSizing: 'border-box',
                          }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: '12px', color: colors.secondaryText, fontWeight: '600', display: 'block', marginBottom: '8px' }}>
                          Student ID
                        </label>
                        <input
                          type="text"
                          value={studentId}
                          onChange={(e) => setStudentId(e.target.value)}
                          style={{
                            width: '100%',
                            padding: '10px 12px',
                            borderRadius: '6px',
                            border: `1px solid ${colors.border}`,
                            background: colors.bg,
                            color: colors.text,
                            fontSize: '14px',
                            boxSizing: 'border-box',
                          }}
                        />
                      </div>
                    </div>
                    <button
                      style={{
                        marginTop: '16px',
                        padding: '8px 16px',
                        borderRadius: '6px',
                        border: 'none',
                        background: PRIMARY,
                        color: '#fff',
                        cursor: 'pointer',
                        fontSize: '13px',
                        fontWeight: '600',
                      }}
                    >
                      Save Changes
                    </button>
                  </SettingSection>
                )}

                <SettingSection title="Change Password" colors={colors}>
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ fontSize: '12px', color: colors.secondaryText, fontWeight: '600', display: 'block', marginBottom: '8px' }}>
                      Current Password
                    </label>
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '6px',
                        border: `1px solid ${colors.border}`,
                        background: colors.bg,
                        color: colors.text,
                        fontSize: '14px',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ fontSize: '12px', color: colors.secondaryText, fontWeight: '600', display: 'block', marginBottom: '8px' }}>
                      New Password
                    </label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '6px',
                        border: `1px solid ${colors.border}`,
                        background: colors.bg,
                        color: colors.text,
                        fontSize: '14px',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ fontSize: '12px', color: colors.secondaryText, fontWeight: '600', display: 'block', marginBottom: '8px' }}>
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '6px',
                        border: `1px solid ${colors.border}`,
                        background: colors.bg,
                        color: colors.text,
                        fontSize: '14px',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                  <button
                    style={{
                      padding: '8px 16px',
                      borderRadius: '6px',
                      border: 'none',
                      background: PRIMARY,
                      color: '#fff',
                      cursor: 'pointer',
                      fontSize: '13px',
                      fontWeight: '600',
                    }}
                  >
                    Save Changes
                  </button>
                </SettingSection>

                <SettingSection title="Danger Zone" colors={colors}>
                  <p style={{ color: colors.secondaryText, fontSize: '14px', marginBottom: '16px' }}>
                    Once you delete your account, there is no going back. Please be certain.
                  </p>
                  <button
                    style={{
                      padding: '10px 20px',
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
                </SettingSection>
              </>
            )}

            {activeSettingTab === 'application' && (
              <>
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
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
