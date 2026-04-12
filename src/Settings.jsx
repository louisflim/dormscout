import React, { useState } from 'react';

const PRIMARY = '#E8622E';

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

const InputField = ({ label, type = 'text', value, onChange, placeholder, colors }) => (
  <div>
    <label style={{ fontSize: '12px', color: colors.secondaryText, fontWeight: '600', display: 'block', marginBottom: '8px' }}>
      {label}
    </label>
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      style={{
        width: '100%',
        padding: '10px 12px',
        borderRadius: '6px',
        border: `1px solid ${colors.border}`,
        background: colors.inputBg,
        color: colors.text,
        fontSize: '14px',
        boxSizing: 'border-box',
        outline: 'none',
      }}
    />
  </div>
);

export default function Settings({ userType = 'tenant', darkMode = false, setDarkMode }) {
  const dk = darkMode;
  const colors = {
    cardBg: dk ? '#16213e' : '#fff',
    text: dk ? '#eaeaea' : '#333',
    secondaryText: dk ? '#a0a0b0' : '#666',
    border: dk ? '#2a2a4a' : '#e8e8e8',
    inputBg: dk ? '#0f3460' : '#fff',
    tabBg: dk ? '#2a2a4a' : '#f0f0f0',
  };

  const isLandlord = userType === 'landlord';

  const [activeSettingTab, setActiveSettingTab] = useState('profile');

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

  return (
    <div style={{
      background: colors.cardBg,
      borderRadius: '16px',
      padding: '32px',
      border: `1px solid ${colors.border}`,
    }}>
      {/* Tabs */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '32px' }}>
        <button
          onClick={() => setActiveSettingTab('profile')}
          style={{
            padding: '12px 24px',
            borderRadius: '8px',
            border: 'none',
            background: activeSettingTab === 'profile' ? PRIMARY : colors.tabBg,
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
            background: activeSettingTab === 'application' ? PRIMARY : colors.tabBg,
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
          {/* Profile Picture */}
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
                ??
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

          {/* Personal Information */}
          <SettingSection title="Personal Information" colors={colors}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <InputField label="First Name" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="John" colors={colors} />
              <InputField label="Last Name" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Doe" colors={colors} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <InputField label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="john@example.com" colors={colors} />
              <InputField label="Phone Number" type="tel" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} placeholder="+63 9XX XXX XXXX" colors={colors} />
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

          {/* Landlord: Business Information */}
          {isLandlord && (
            <SettingSection title="Business Information" colors={colors}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <InputField label="Business Name" value={businessName} onChange={(e) => setBusinessName(e.target.value)} placeholder="Enter business name" colors={colors} />
                <InputField label="Business Permit Number" value={businessPermit} onChange={(e) => setBusinessPermit(e.target.value)} placeholder="Enter permit number" colors={colors} />
              </div>
              <p style={{ fontSize: '13px', color: colors.secondaryText, margin: '12px 0', fontStyle: 'italic' }}>
                Fill in your business details to be verified as a legitimate landlord
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

          {/* Tenant: Student Information */}
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
                      background: colors.inputBg,
                      color: colors.text,
                      fontSize: '14px',
                      boxSizing: 'border-box',
                      outline: 'none',
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
                <InputField label="Course" value={course} onChange={(e) => setCourse(e.target.value)} placeholder="Bachelor of Science in Computer Science" colors={colors} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <InputField label="Year Level" value={yearLevel} onChange={(e) => setYearLevel(e.target.value)} placeholder="2nd Year / 3rd Year" colors={colors} />
                <InputField label="Student ID" value={studentId} onChange={(e) => setStudentId(e.target.value)} placeholder="2024001234" colors={colors} />
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

          {/* Change Password */}
          <SettingSection title="Change Password" colors={colors}>
            <div style={{ marginBottom: '16px' }}>
              <InputField label="Current Password" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="Enter your current password" colors={colors} />
            </div>
            <div style={{ marginBottom: '16px' }}>
              <InputField label="New Password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Enter your new password" colors={colors} />
            </div>
            <div style={{ marginBottom: '16px' }}>
              <InputField label="Confirm New Password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm your new password" colors={colors} />
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

          {/* Danger Zone */}
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
  );
}
