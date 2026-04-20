import React, { useState } from 'react';
import './Settings.css';

const PRIMARY = '#E8622E';

/* ─────────────────────────── Toggle ─────────────────────────── */
const Toggle = ({ checked, onChange }) => (
  <button
    type="button"
    className="toggle-btn"
    onClick={() => onChange(!checked)}
    style={{ background: checked ? PRIMARY : '#ddd' }}
  >
    <div
      className="toggle-btn__knob"
      style={{ left: checked ? '24px' : '2px' }}
    />
  </button>
);

/* ─────────────────────────── SettingRow ─────────────────────── */
const SettingRow = ({ label, control, colors }) => (
  <div
    className="setting-row"
    style={{ borderBottom: `1px solid ${colors.border}` }}
  >
    <label className="setting-row__label" style={{ color: colors.text }}>
      {label}
    </label>
    {control}
  </div>
);

/* ─────────────────────────── SettingSection ─────────────────── */
const SettingSection = ({ title, children, colors }) => (
  <div className="settings-section">
    <h3 className="settings-section__title" style={{ color: colors.text }}>
      {title}
    </h3>
    <div className="settings-section__body">{children}</div>
  </div>
);

/* ─────────────────────────── InputField ─────────────────────── */
const InputField = ({ label, type = 'text', value, onChange, placeholder, colors }) => (
  <div className="input-field">
    <label className="input-field__label" style={{ color: colors.secondaryText }}>
      {label}
    </label>
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className="input-field__input"
      style={{
        border: `1px solid ${colors.border}`,
        background: colors.inputBg,
        color: colors.text,
      }}
    />
  </div>
);

/* ─────────────────────────── Settings ───────────────────────── */
export default function Settings({ userType = 'tenant', darkMode = false, setDarkMode }) {
  const dk = darkMode;

  const colors = {
    cardBg:        dk ? '#16213e' : '#fff',
    text:          dk ? '#eaeaea' : '#333',
    secondaryText: dk ? '#a0a0b0' : '#666',
    border:        dk ? '#2a2a4a' : '#e8e8e8',
    inputBg:       dk ? '#0f3460' : '#fff',
    tabBg:         dk ? '#2a2a4a' : '#f0f0f0',
  };

  const isLandlord = userType === 'landlord';

  const [activeSettingTab, setActiveSettingTab] = useState('profile');

  // Load saved profile from localStorage on mount
  const savedProfile = (() => {
    try { return JSON.parse(localStorage.getItem('dormscout_landlord_profile') || '{}'); } catch (_) { return {}; }
  })();

  // Profile fields
  const [firstName,       setFirstName]       = useState(savedProfile.firstName       || '');
  const [lastName,        setLastName]         = useState(savedProfile.lastName        || '');
  const [email,           setEmail]            = useState(savedProfile.email           || '');
  const [phoneNumber,     setPhoneNumber]      = useState(savedProfile.phoneNumber     || '');
  const [university,      setUniversity]       = useState('');
  const [course,          setCourse]           = useState('');
  const [yearLevel,       setYearLevel]        = useState('');
  const [studentId,       setStudentId]        = useState('');
  const [currentPassword, setCurrentPassword]  = useState('');
  const [newPassword,     setNewPassword]      = useState('');
  const [confirmPassword, setConfirmPassword]  = useState('');
  const [businessName,    setBusinessName]     = useState(savedProfile.businessName    || '');
  const [businessPermit,  setBusinessPermit]   = useState(savedProfile.businessPermit  || '');
  const [isVerified,      setIsVerified]       = useState(savedProfile.isVerified      || false);

  // App settings
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [inAppNotifications,  setInAppNotifications]  = useState(true);
  const [messageAlerts,       setMessageAlerts]       = useState(true);

  /* ── Helpers ── */
  const tabStyle = (tab) => ({
    background: activeSettingTab === tab ? PRIMARY : colors.tabBg,
    color:      activeSettingTab === tab ? '#fff'  : colors.text,
  });

  function saveLandlordProfile(extra = {}) {
    const profile = { firstName, lastName, email, phoneNumber, businessName, businessPermit, isVerified, ...extra };
    try { localStorage.setItem('dormscout_landlord_profile', JSON.stringify(profile)); } catch (_) {}
    window.dispatchEvent(new Event('dormscout:profileUpdated'));
  }

  function handleVerify() {
    if (!businessName.trim() || !businessPermit.trim()) {
      alert('Please fill in both Business Name and Business Permit Number before verifying.'); return;
    }
    setIsVerified(true);
    saveLandlordProfile({ isVerified: true });
    alert('Business verified successfully! ✓');
  }

  const UNIVERSITIES = [
    'Cebu Institute of Technology - University',
    'University of San Carlos - Downtown',
    'University of the Visayas',
    'University of Cebu - Main',
    'University of San Carlos - Talamban',
    'University of Cebu - Banilad',
    'University of Cebu - METC',
    'University of San Jose-Recoletos - Main',
    'University of San Jose-Recoletos - Basak',
    'Cebu Normal University',
    'University of the Philippines Cebu',
    'Southwestern University PHINMA',
    'Cebu Technological University',
    "Saint Theresa's College",
  ];

  /* ── Render ── */
  return (
    <div
      className="settings-wrapper"
      style={{ background: colors.cardBg, border: `1px solid ${colors.border}` }}
    >
      {/* ── Tabs ── */}
      <div className="settings-tabs">
        {[
          { key: 'profile',     label: 'Profile Settings' },
          { key: 'application', label: 'Application Settings' },
        ].map(({ key, label }) => (
          <button
            key={key}
            className="settings-tab-btn"
            style={tabStyle(key)}
            onClick={() => setActiveSettingTab(key)}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ══════════════ PROFILE TAB ══════════════ */}
      {activeSettingTab === 'profile' && (
        <>
          {/* Profile Picture */}
          <SettingSection title="Profile Picture" colors={colors}>
            <div className="settings-avatar">
              <div className="settings-avatar__circle">??</div>
              <div>
                <p className="settings-avatar__hint" style={{ color: colors.secondaryText }}>
                  Click the avatar to upload a new profile picture.
                </p>
                <button className="btn-primary">Upload Profile</button>
              </div>
            </div>
          </SettingSection>

          {/* Personal Information */}
          <SettingSection title="Personal Information" colors={colors}>
            <div className="settings-grid-2 settings-grid-2--mb">
              <InputField label="First Name"   value={firstName}   onChange={(e) => setFirstName(e.target.value)}   placeholder="John"  colors={colors} />
              <InputField label="Last Name"    value={lastName}    onChange={(e) => setLastName(e.target.value)}    placeholder="Doe"   colors={colors} />
            </div>
            <div className="settings-grid-2">
              <InputField label="Email"        type="email" value={email}        onChange={(e) => setEmail(e.target.value)}        placeholder="john@example.com"   colors={colors} />
              <InputField label="Phone Number" type="tel"   value={phoneNumber}  onChange={(e) => setPhoneNumber(e.target.value)}  placeholder="+63 9XX XXX XXXX"   colors={colors} />
            </div>
            <button className="btn-primary btn-primary--mt" onClick={() => saveLandlordProfile()}>Save Changes</button>
          </SettingSection>

          {/* Landlord: Business Information */}
          {isLandlord && (
            <SettingSection title="Business Information" colors={colors}>
              {isVerified && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', padding: '8px 12px', background: 'rgba(34,197,94,0.1)', borderRadius: '8px', border: '1px solid rgba(34,197,94,0.3)' }}>
                  <span style={{ fontSize: '1.1rem' }}>✅</span>
                  <span style={{ color: '#16a34a', fontWeight: 700, fontSize: '0.9rem' }}>Verified Business</span>
                </div>
              )}
              <div className="settings-grid-2 settings-grid-2--mb">
                <InputField label="Business Name"          value={businessName}   onChange={(e) => setBusinessName(e.target.value)}   placeholder="Enter business name"   colors={colors} />
                <InputField label="Business Permit Number" value={businessPermit} onChange={(e) => setBusinessPermit(e.target.value)} placeholder="Enter permit number"    colors={colors} />
              </div>
              <p className="settings-verify-hint" style={{ color: colors.secondaryText }}>
                Fill in your business details to be verified as a legitimate landlord
              </p>
              <button className="btn-primary btn-primary--mt" onClick={handleVerify}>
                {isVerified ? '✓ Verified' : 'Verify'}
              </button>
            </SettingSection>
          )}

          {/* Tenant: Student Information */}
          {!isLandlord && (
            <SettingSection title="Student Information" colors={colors}>
              <div className="settings-grid-2 settings-grid-2--mb">
                {/* University select */}
                <div className="input-field">
                  <label className="input-field__label" style={{ color: colors.secondaryText }}>
                    University
                  </label>
                  <select
                    value={university}
                    onChange={(e) => setUniversity(e.target.value)}
                    className="input-field__select"
                    style={{
                      border: `1px solid ${colors.border}`,
                      background: colors.inputBg,
                      color: colors.text,
                    }}
                  >
                    <option value="">Select Your School</option>
                    {UNIVERSITIES.map((u) => (
                      <option key={u}>{u}</option>
                    ))}
                  </select>
                </div>

                <InputField label="Course" value={course} onChange={(e) => setCourse(e.target.value)} placeholder="Bachelor of Science in Computer Science" colors={colors} />
              </div>

              <div className="settings-grid-2">
                <InputField label="Year Level" value={yearLevel} onChange={(e) => setYearLevel(e.target.value)} placeholder="2nd Year / 3rd Year" colors={colors} />
                <InputField label="Student ID"  value={studentId}  onChange={(e) => setStudentId(e.target.value)}  placeholder="2024001234"          colors={colors} />
              </div>

              <button className="btn-primary btn-primary--mt">Save Changes</button>
            </SettingSection>
          )}

          {/* Change Password */}
          <SettingSection title="Change Password" colors={colors}>
            <div className="settings-password-field">
              <InputField label="Current Password"     type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="Enter your current password" colors={colors} />
            </div>
            <div className="settings-password-field">
              <InputField label="New Password"         type="password" value={newPassword}     onChange={(e) => setNewPassword(e.target.value)}     placeholder="Enter your new password"     colors={colors} />
            </div>
            <div className="settings-password-field">
              <InputField label="Confirm New Password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm your new password"   colors={colors} />
            </div>
            <button className="btn-primary">Save Changes</button>
          </SettingSection>

          {/* Danger Zone */}
          <SettingSection title="Danger Zone" colors={colors}>
            <p className="settings-danger-text" style={{ color: colors.secondaryText }}>
              Once you delete your account, there is no going back. Please be certain.
            </p>
            <button className="btn-danger">Delete Account</button>
          </SettingSection>
        </>
      )}

      {/* ══════════════ APPLICATION TAB ══════════════ */}
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
            <SettingRow label="Email Notifications"  control={<Toggle checked={emailNotifications} onChange={setEmailNotifications} />} colors={colors} />
            <SettingRow label="In-App Notifications" control={<Toggle checked={inAppNotifications}  onChange={setInAppNotifications}  />} colors={colors} />
            <SettingRow label="New Message Alerts"   control={<Toggle checked={messageAlerts}       onChange={setMessageAlerts}       />} colors={colors} />
          </SettingSection>
        </>
      )}
    </div>
  );
}

