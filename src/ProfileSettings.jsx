import React, { useState, useRef } from 'react';

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
    inputBg: '#fff',
  },
  dark: {
    bg: '#1a1a2e',
    navBg: '#16213e',
    cardBg: '#16213e',
    sidebarBg: '#0f3460',
    text: '#eaeaea',
    secondaryText: '#a0a0b0',
    border: '#2a2a4a',
    inputBg: '#0f3460',
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

const SaveButton = ({ onClick }) => (
  <button
    type="button"
    onClick={onClick}
    style={{
      marginTop: '16px',
      padding: '10px 28px',
      borderRadius: '8px',
      border: 'none',
      background: PRIMARY,
      color: '#fff',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: '600',
    }}
  >
    Save Changes
  </button>
);

const InputField = ({ label, value, onChange, type = 'text', placeholder, colors, disabled }) => (
  <div style={{ marginBottom: '14px' }}>
    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: colors.secondaryText, marginBottom: '6px' }}>
      {label}
    </label>
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      style={{
        width: '100%',
        padding: '10px 14px',
        borderRadius: '8px',
        border: `1px solid ${colors.border}`,
        fontSize: '14px',
        color: colors.text,
        background: disabled ? (colors.inputBg === '#fff' ? '#f5f5f5' : '#1a1a2e') : colors.inputBg,
        outline: 'none',
        boxSizing: 'border-box',
      }}
    />
  </div>
);

const Section = ({ title, children, colors }) => (
  <div style={{
    marginBottom: '32px',
    background: colors.cardBg,
    borderRadius: '16px',
    padding: '28px',
    border: `1px solid ${colors.border}`,
  }}>
    <h3 style={{
      fontSize: '18px',
      fontWeight: '700',
      color: colors.text,
      margin: '0 0 20px 0',
      paddingBottom: '12px',
      borderBottom: `3px solid ${PRIMARY}`,
    }}>
      {title}
    </h3>
    {children}
  </div>
);

export default function ProfileSettings({ role = 'tenant', onLogout, setScreen, darkMode = false }) {
  const colors = darkMode ? COLORS.dark : COLORS.light;
  const isLandlord = role === 'landlord';
  const navItems = NAV_ITEMS[role] || NAV_ITEMS.tenant;

  const fileInputRef = useRef(null);
  const [profilePic, setProfilePic] = useState(null);

  // Personal info
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  // Tenant: student info
  const [university, setUniversity] = useState('');
  const [course, setCourse] = useState('');
  const [yearLevel, setYearLevel] = useState('');
  const [studentId, setStudentId] = useState('');

  const schools = [
    'Cebu Institute of Technology - University',
    'Cebu Normal University',
    'Cebu Technological University',
    'Saint Theresa\'s College',
    'Southwestern University PHINMA',
    'University of Cebu - Banilad',
    'University of Cebu - Main',
    'University of Cebu - METC',
    'University of the Philippines Cebu',
    'University of San Carlos - Downtown',
    'University of San Carlos - Talamban',
    'University of San Jose-Recoletos - Basak',
    'University of San Jose-Recoletos - Main',
    'University of the Visayas',
  ];

  // Landlord: business info
  const [businessPermit, setBusinessPermit] = useState('');

  // Password
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Navigation
  const [activeNav, setActiveNav] = useState('settings');

  const handlePicChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setProfilePic(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleNavClick = (id) => {
    setActiveNav(id);
    if (id === 'settings') {
      // Stay on current page
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
            cursor: 'pointer',
            border: `2px solid ${PRIMARY}`,
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
        {/* Header */}
        <div style={{ marginBottom: '28px' }}>
          <h2 style={{
            fontSize: '32px',
            fontWeight: '700',
            margin: '0 0 8px 0',
            color: colors.text,
          }}>
            <span style={{ color: PRIMARY }}>Profile</span>{' '}
            <span style={{ color: SECONDARY }}>Settings</span>
          </h2>
          <p style={{
            fontSize: '14px',
            color: colors.secondaryText,
            margin: 0,
          }}>
            Manage your profile information and account settings.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '24px' }}>
          {/* Sidebar */}
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

          {/* Main content */}
          <div style={{ flex: 1 }}>
            {/* Profile Picture */}
            <Section title="Profile Picture" colors={colors}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                <div
                  onClick={() => fileInputRef.current.click()}
                  style={{
                    width: '100px',
                    height: '100px',
                    borderRadius: '50%',
                    background: profilePic ? `url(${profilePic}) center/cover` : '#9370DB',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    fontSize: '40px',
                    cursor: 'pointer',
                    border: `3px solid ${SECONDARY}`,
                    flexShrink: 0,
                  }}
                >
                  {!profilePic && '👤'}
                </div>
                <div>
                  <p style={{ fontSize: '14px', color: colors.secondaryText, margin: '0 0 10px 0' }}>
                    Click the avatar to upload a new profile picture.
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handlePicChange}
                    style={{ display: 'none' }}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current.click()}
                    style={{
                      padding: '8px 20px',
                      borderRadius: '8px',
                      border: `1px solid ${PRIMARY}`,
                      background: 'transparent',
                      color: PRIMARY,
                      cursor: 'pointer',
                      fontSize: '13px',
                      fontWeight: '600',
                    }}
                  >
                    Upload Photo
                  </button>
                  {profilePic && (
                    <button
                      type="button"
                      onClick={() => setProfilePic(null)}
                      style={{
                        marginLeft: '10px',
                        padding: '8px 20px',
                        borderRadius: '8px',
                        border: '1px solid #dc3545',
                        background: 'transparent',
                        color: '#dc3545',
                        cursor: 'pointer',
                        fontSize: '13px',
                        fontWeight: '600',
                      }}
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
              <SaveButton />
            </Section>

            {/* Personal Information */}
            <Section title="Personal Information" colors={colors}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <InputField label="First Name" value={firstName} onChange={setFirstName} placeholder="Juan" colors={colors} />
                <InputField label="Last Name" value={lastName} onChange={setLastName} placeholder="Dela Cruz" colors={colors} />
                <InputField label="Email" value={email} onChange={setEmail} type="email" placeholder="juan@example.com" colors={colors} />
                <InputField label="Phone Number" value={phone} onChange={setPhone} type="tel" placeholder="09xx-xxx-xxxx" colors={colors} />
              </div>
              <SaveButton />
            </Section>

            {/* Role-specific section */}
            {!isLandlord ? (
              <Section title="Student Information" colors={colors}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div style={{ marginBottom: '14px' }}>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: colors.secondaryText, marginBottom: '6px' }}>
                      University
                    </label>
                    <select
                      value={university}
                      onChange={(e) => setUniversity(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: '8px',
                        border: `1px solid ${colors.border}`,
                        fontSize: '14px',
                        color: colors.text,
                        background: colors.inputBg,
                        outline: 'none',
                        boxSizing: 'border-box',
                        height: '42px',
                        fontFamily: 'inherit',
                      }}
                    >
                      <option value="">Select Your School</option>
                      {schools.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                  <InputField label="Course" value={course} onChange={setCourse} placeholder="BS Computer Science" colors={colors} />
                  <InputField label="Year Level" value={yearLevel} onChange={setYearLevel} placeholder="3rd Year" colors={colors} />
                  <InputField label="Student ID" value={studentId} onChange={setStudentId} placeholder="21-0000-000" colors={colors} />
                </div>
                <SaveButton />
              </Section>
            ) : (
              <Section title="Landlord Information" colors={colors}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
                  <span style={{
                    display: 'inline-block',
                    padding: '4px 14px',
                    borderRadius: '20px',
                    background: SECONDARY,
                    color: '#fff',
                    fontSize: '12px',
                    fontWeight: '700',
                  }}>
                    ✓ Verified Landlord
                  </span>
                </div>
                <InputField label="Business Permit Number" value={businessPermit} onChange={setBusinessPermit} placeholder="BP-2024-XXXXX" colors={colors} />
                <SaveButton />
              </Section>
            )}

            {/* Password */}
            <Section title="Change Password" colors={colors}>
              <div style={{ maxWidth: '400px' }}>
                <InputField label="Current Password" value={currentPassword} onChange={setCurrentPassword} type="password" placeholder="••••••••" colors={colors} />
                <InputField label="New Password" value={newPassword} onChange={setNewPassword} type="password" placeholder="••••••••" colors={colors} />
                <InputField label="Confirm New Password" value={confirmPassword} onChange={setConfirmPassword} type="password" placeholder="••••••••" colors={colors} />
              </div>
              <SaveButton />
            </Section>

            {/* Danger Zone */}
            <Section title="Danger Zone" colors={colors}>
              <p style={{ fontSize: '14px', color: colors.secondaryText, margin: '0 0 16px 0' }}>
                Once you delete your account, there is no going back. Please be certain.
              </p>
              <button
                type="button"
                style={{
                  padding: '10px 24px',
                  borderRadius: '8px',
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
            </Section>
          </div>
        </div>
      </div>
    </div>
  );
}
