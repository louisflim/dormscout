import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { UNIVERSITY_NAMES } from '../../../constants/universities';
import './Settings.css';

const PRIMARY = '#E8622E';

/* ─────────────────────────── Toggle ─────────────────────────── */
const Toggle = ({ checked, onChange }) => (
  <button
    type="button"
    className="toggle-btn"
    onClick={() => onChange(!checked)}
    style={{ background: checked ? PRIMARY : '#ddd' }}
    aria-pressed={checked}
  >
    <div
      className="toggle-btn__knob"
      style={{ left: checked ? '24px' : '2px' }}
    />
  </button>
);

/* ─────────────────────────── SettingRow ─────────────────────── */
const SettingRow = ({ label, control, colors, description }) => (
  <div
    className="setting-row"
    style={{ borderBottom: `1px solid ${colors.border}` }}
  >
    <div className="setting-row__content">
      <label className="setting-row__label" style={{ color: colors.text }}>
        {label}
      </label>
      {description && (
        <span className="setting-row__description" style={{ color: colors.secondaryText }}>
          {description}
        </span>
      )}
    </div>
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
const InputField = ({
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  colors,
  error,
  required = false
}) => (
  <div className="input-field">
    <label className="input-field__label" style={{ color: colors.secondaryText }}>
      {label} {required && <span style={{ color: '#ef4444' }}>*</span>}
    </label>
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={`input-field__input ${error ? 'input-field__input--error' : ''}`}
      style={{
        border: error ? '1px solid #ef4444' : `1px solid ${colors.border}`,
        background: colors.inputBg,
        color: colors.text,
      }}
    />
    {error && (
      <span className="input-field__error" style={{ color: '#ef4444', fontSize: '0.75rem' }}>
        {error}
      </span>
    )}
  </div>
);

/* ─────────────────────────── FileUpload ─────────────────────── */
const FileUpload = ({
  onFileSelect,
  accept = "image/*",
  currentImage,
  colors
}) => {
  const [preview, setPreview] = useState(currentImage || null);
  const fileInputRef = useRef(null);
  const [fileError, setFileError] = useState('');

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setFileError('File size must be less than 5MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
        onFileSelect(file, reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="file-upload">
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />
      <div
        className="file-upload__preview"
        onClick={() => fileInputRef.current?.click()}
        style={{
          border: `2px dashed ${colors.border}`,
          borderRadius: '12px',
          padding: '20px',
          textAlign: 'center',
          cursor: 'pointer'
        }}
      >
        {preview ? (
          <img
            src={preview}
            alt="Preview"
            style={{
              width: '100px',
              height: '100px',
              borderRadius: '50%',
              objectFit: 'cover'
            }}
          />
        ) : (
          <div style={{ color: colors.secondaryText }}>
            <span style={{ fontSize: '2rem' }}>📷</span>
            <p>Click to upload</p>
          </div>
        )}
      </div>
      <p style={{ color: colors.secondaryText, fontSize: '0.8rem', marginTop: '8px' }}>
        Supported: JPG, PNG (Max 5MB)
      </p>

      {fileError && (
        <p style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '4px' }}>{fileError}</p>
      )}
    </div>
  );
};

/* ─────────────────────────── AlertModal ─────────────────────── */
const AlertModal = ({ isOpen, title, message, type = 'info', onClose, onConfirm }) => {
  if (!isOpen) return null;

  const typeStyles = {
    danger: { bg: 'rgba(239, 68, 68, 0.1)', border: '#ef4444', icon: '⚠️' },
    warning: { bg: 'rgba(245, 158, 11, 0.1)', border: '#f59e0b', icon: '⚡' },
    success: { bg: 'rgba(34, 197, 94, 0.1)', border: '#22c55e', icon: '✅' },
    info: { bg: 'rgba(59, 130, 246, 0.1)', border: '#3b82f6', icon: 'ℹ️' },
  };

  const style = typeStyles[type] || typeStyles.info;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--card-bg, #fff)',
          borderRadius: '16px',
          padding: '24px',
          maxWidth: '400px',
          width: '90%',
          border: `1px solid ${style.border}`,
          boxShadow: '0 20px 60px rgba(0,0,0,0.2)'
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <span style={{ fontSize: '3rem' }}>{style.icon}</span>
          <h3 style={{ margin: '16px 0', color: style.border }}>{title}</h3>
          <p style={{ color: '#666', marginBottom: '24px' }}>{message}</p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <button
              onClick={onClose}
              style={{
                padding: '10px 24px',
                borderRadius: '8px',
                border: '1px solid #ddd',
                background: '#f5f5f5',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            {onConfirm && (
              <button
                onClick={onConfirm}
                style={{
                  padding: '10px 24px',
                  borderRadius: '8px',
                  border: 'none',
                  background: type === 'danger' ? '#ef4444' : PRIMARY,
                  color: '#fff',
                  cursor: 'pointer'
                }}
              >
                {type === 'danger' ? 'Delete Account' : 'Confirm'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

/* ─────────────────────────── LoadingSpinner ─────────────────── */
const LoadingSpinner = ({ text = "Loading..." }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px' }}>
    <div style={{
      width: '40px',
      height: '40px',
      border: `3px solid ${PRIMARY}20`,
      borderTopColor: PRIMARY,
      borderRadius: '50%',
      animation: 'spin 1s linear infinite'
    }} />
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    <span style={{ marginLeft: '12px', color: '#666' }}>{text}</span>
  </div>
);

/* ─────────────────────────── SectionMessage ─────────────────── */
const SectionMessage = ({ message, type = 'success', onClose }) => {
  if (!message) return null;

  const isSuccess = type === 'success';
  return (
    <div style={{
      padding: '12px 16px',
      background: isSuccess ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
      border: `1px solid ${isSuccess ? '#22c55e' : '#ef4444'}`,
      borderRadius: '8px',
      marginTop: '12px',
      color: isSuccess ? '#16a34a' : '#dc2626',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      fontWeight: 500,
      fontSize: '0.9rem',
    }}>
      <span>{isSuccess ? '✅' : '❌'}</span>
      <span>{message}</span>
      <button
        onClick={onClose}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: isSuccess ? '#16a34a' : '#dc2626',
          marginLeft: 'auto',
          fontSize: '18px',
          padding: '0 4px'
        }}
      >
        ×
      </button>
    </div>
  );
};

/* ─────────────────────────── Settings ───────────────────────── */
export default function Settings({ userType: propUserType, darkMode = false, setDarkMode }) {
  const { user, updateUser, deleteAccount, logout } = useAuth();

  const dk = darkMode;
  const [isLoading, setIsLoading] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState({});

  // Section-specific messages
  const [profileMessage, setProfileMessage] = useState({ text: '', type: 'success' });
  const [studentMessage, setStudentMessage] = useState({ text: '', type: 'success' });
  const [passwordMessage, setPasswordMessage] = useState({ text: '', type: 'success' });
  const [applicationMessage, setApplicationMessage] = useState({ text: '', type: 'success' });
  const [verifyMessage, setVerifyMessage] = useState({ text: '', type: 'success' });

  const colors = {
    cardBg:        dk ? '#16213e' : '#fff',
    text:          dk ? '#eaeaea' : '#333',
    secondaryText: dk ? '#a0a0b0' : '#666',
    border:        dk ? '#2a2a4a' : '#e8e8e8',
    inputBg:       dk ? '#0f3460' : '#fff',
    tabBg:         dk ? '#2a2a4a' : '#f0f0f0',
  };

  const userTypeFromContext = user?.userType;
  const isLandlord = userTypeFromContext === 'landlord' || propUserType === 'landlord';

  const [activeSettingTab, setActiveSettingTab] = useState('profile');

  // Load saved profile from localStorage (only once on mount)
  const savedProfileRef = useRef(() => {
    try {
      return JSON.parse(localStorage.getItem('dormscout_landlord_profile') || '{}');
    } catch (_) {
      return {};
    }
  });

  // Profile fields
  const [firstName,       setFirstName]       = useState(user?.firstName || '');
  const [lastName,        setLastName]        = useState(user?.lastName || '');
  const [email,           setEmail]           = useState(user?.email || '');
  const [phoneNumber,     setPhoneNumber]     = useState(user?.phone || user?.phoneNumber || '');
  const [university,      setUniversity]      = useState(user?.university || user?.school || '');
  const [gender,          setGender]          = useState(user?.gender || '');
  const [course,          setCourse]          = useState(user?.course || '');
  const [yearLevel,       setYearLevel]       = useState(user?.yearLevel || '');
  const [studentId,       setStudentId]       = useState(user?.studentId || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword,     setNewPassword]     = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [businessName,    setBusinessName]    = useState(user?.businessName || '');
  const [businessPermit,  setBusinessPermit]  = useState(user?.businessPermit || '');
  const [isVerified,      setIsVerified]      = useState(user?.isVerified || false);
  const [profileImage,    setProfileImage]    = useState(user?.profileImage || null);

  // App settings
  const [emailNotifications, setEmailNotifications] = useState(user?.settings?.emailNotifications !== false);
  const [inAppNotifications, setInAppNotifications]  = useState(user?.settings?.inAppNotifications !== false);
  const [messageAlerts,     setMessageAlerts]       = useState(user?.settings?.messageAlerts !== false);

  // Track if initial sync has been done
  const initialSyncDone = useRef(false);

  // Initial sync from user or saved profile (only on mount and when user.id changes)
  useEffect(() => {
    if (!user && !initialSyncDone.current) {
      const saved = savedProfileRef.current();
      if (Object.keys(saved).length > 0) {
        setFirstName(saved.firstName || '');
        setLastName(saved.lastName || '');
        setEmail(saved.email || '');
        setPhoneNumber(saved.phone || saved.phoneNumber || '');
        setUniversity(saved.university || saved.school || '');
        setGender(saved.gender || '');
        setCourse(saved.course || '');
        setYearLevel(saved.yearLevel || '');
        setStudentId(saved.studentId || '');
        setBusinessName(saved.businessName || '');
        setBusinessPermit(saved.businessPermit || '');
        setIsVerified(saved.isVerified || false);
        setProfileImage(saved.profileImage || null);
      }
      initialSyncDone.current = true;
    } else if (user && !initialSyncDone.current) {
      setFirstName(user.firstName || '');
      setLastName(user.lastName || '');
      setEmail(user.email || '');
      setPhoneNumber(user.phone || user.phoneNumber || '');
      setUniversity(user.university || user.school || '');
      setGender(user.gender || '');
      setCourse(user.course || '');
      setYearLevel(user.yearLevel || '');
      setStudentId(user.studentId || '');
      setBusinessName(user.businessName || '');
      setBusinessPermit(user.businessPermit || '');
      setIsVerified(user.isVerified || false);
      setProfileImage(user.profileImage || null);
      setEmailNotifications(user.settings?.emailNotifications !== false);
      setInAppNotifications(user.settings?.inAppNotifications !== false);
      setMessageAlerts(user.settings?.messageAlerts !== false);
      initialSyncDone.current = true;
    }
  }, [user?.id, user]);

  // Auto-clear messages after 3 seconds
  useEffect(() => {
    if (profileMessage.text) {
      const timer = setTimeout(() => setProfileMessage({ text: '', type: 'success' }), 3000);
      return () => clearTimeout(timer);
    }
  }, [profileMessage.text]);

  useEffect(() => {
    if (studentMessage.text) {
      const timer = setTimeout(() => setStudentMessage({ text: '', type: 'success' }), 3000);
      return () => clearTimeout(timer);
    }
  }, [studentMessage.text]);

  useEffect(() => {
    if (passwordMessage.text) {
      const timer = setTimeout(() => setPasswordMessage({ text: '', type: 'success' }), 3000);
      return () => clearTimeout(timer);
    }
  }, [passwordMessage.text]);

  useEffect(() => {
    if (applicationMessage.text) {
      const timer = setTimeout(() => setApplicationMessage({ text: '', type: 'success' }), 3000);
      return () => clearTimeout(timer);
    }
  }, [applicationMessage.text]);

  useEffect(() => {
    if (verifyMessage.text) {
      const timer = setTimeout(() => setVerifyMessage({ text: '', type: 'success' }), 3000);
      return () => clearTimeout(timer);
    }
  }, [verifyMessage.text]);

  /* ── Helpers ── */
  const tabStyle = (tab) => ({
    background: activeSettingTab === tab ? PRIMARY : colors.tabBg,
    color:      activeSettingTab === tab ? '#fff'  : colors.text,
  });

  // Handle profile image upload
  const handleProfileImageUpload = useCallback((file, dataUrl) => {
    setProfileImage(dataUrl);
    setProfileMessage({ text: 'Profile picture updated! Click Save Changes to apply.', type: 'success' });
  }, []);

  // Validate email format
  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Validate phone number (Philippine format)
  const isValidPhone = (phone) => {
    const phoneRegex = /^(\+63|0)?[0-9]{10}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
  };

  /* ── Save Personal Information Only ── */
  function savePersonalInfo() {
    // Validation for personal info only
    if (!firstName.trim()) {
      setProfileMessage({ text: 'First name is required', type: 'error' });
      return;
    }
    if (!lastName.trim()) {
      setProfileMessage({ text: 'Last name is required', type: 'error' });
      return;
    }
    if (!isValidEmail(email)) {
      setProfileMessage({ text: 'Please enter a valid email address', type: 'error' });
      return;
    }
    if (phoneNumber && !isValidPhone(phoneNumber)) {
      setProfileMessage({ text: 'Please enter a valid phone number', type: 'error' });
      return;
    }

    setIsLoading(true);

    try {
      const normalizedFirstName = firstName.trim();
      const normalizedLastName = lastName.trim();
      const fullName = `${normalizedFirstName} ${normalizedLastName}`.trim();

      // Save to AuthContext - PERSONAL INFO ONLY
      if (user) {
        updateUser({
          firstName: normalizedFirstName,
          lastName: normalizedLastName,
          name: fullName,
          email,
          phone: phoneNumber,
          phoneNumber,
          gender,
          profileImage,
        });
      }

      // Save to localStorage - PERSONAL INFO ONLY
      const currentUser = JSON.parse(localStorage.getItem('dormScoutUser') || '{}');
      const updatedUser = {
        ...currentUser,
        firstName: normalizedFirstName,
        lastName: normalizedLastName,
        name: fullName,
        email,
        phone: phoneNumber,
        phoneNumber,
        gender,
        profileImage,
      };
      localStorage.setItem('dormScoutUser', JSON.stringify(updatedUser));

      // Also update landlord profile if exists
      const savedProfile = JSON.parse(localStorage.getItem('dormscout_landlord_profile') || '{}');
      localStorage.setItem('dormscout_landlord_profile', JSON.stringify({
        ...savedProfile,
        firstName: normalizedFirstName,
        lastName: normalizedLastName,
        name: fullName,
        email,
        phone: phoneNumber,
        gender,
        profileImage,
      }));

      window.dispatchEvent(new CustomEvent('dormscout:profileUpdated', {
        detail: { profileImage }
      }));

      setProfileMessage({ text: 'Personal information saved! ✓', type: 'success' });
    } catch (error) {
      console.error('Profile update error:', error);
      setProfileMessage({ text: 'Failed to update profile. Please try again.', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  }

  /* ── Save Student Information Only ── */
  function saveStudentInfo() {
    // Validation for student info only
    if (!isLandlord && !university) {
      setStudentMessage({ text: 'Please select your university', type: 'error' });
      return;
    }

    setIsLoading(true);

    try {
      // Save to AuthContext - STUDENT INFO ONLY
      if (user) {
        updateUser({
          university,
          school: university,
          course,
          yearLevel,
          studentId,
        });
      }

      // Save to localStorage - STUDENT INFO ONLY
      const currentUser = JSON.parse(localStorage.getItem('dormScoutUser') || '{}');
      const updatedUser = {
        ...currentUser,
        university,
        school: university,
        course,
        yearLevel,
        studentId,
      };
      localStorage.setItem('dormScoutUser', JSON.stringify(updatedUser));

      // Also update landlord profile if exists
      const savedProfile = JSON.parse(localStorage.getItem('dormscout_landlord_profile') || '{}');
      localStorage.setItem('dormscout_landlord_profile', JSON.stringify({
        ...savedProfile,
        university,
        school: university,
        course,
        yearLevel,
        studentId,
      }));

      setStudentMessage({ text: 'Student information saved! ✓', type: 'success' });
    } catch (error) {
      console.error('Student info update error:', error);
      setStudentMessage({ text: 'Failed to update student information. Please try again.', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  }

  // Validate password change
  function validatePasswordChange() {
    const errors = {};

    if (!currentPassword) {
      errors.currentPassword = 'Current password is required';
    }

    if (!newPassword) {
      errors.newPassword = 'New password is required';
    } else if (newPassword.length < 8) {
      errors.newPassword = 'Password must be at least 8 characters';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(newPassword)) {
      errors.newPassword = 'Password must contain uppercase, lowercase, and number';
    }

    if (!confirmPassword) {
      errors.confirmPassword = 'Please confirm your password';
    } else if (newPassword !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    return errors;
  }

  function handlePasswordChange() {
    const errors = validatePasswordChange();
    setPasswordErrors(errors);

    if (Object.keys(errors).length > 0) {
      return;
    }

    setIsLoading(true);

    try {
      // 1. Get current user
      const currentUser = JSON.parse(localStorage.getItem('dormScoutUser') || '{}');

      // 2. Verify current password matches
      if (currentUser.password !== currentPassword) {
        setPasswordErrors({ currentPassword: 'Current password is incorrect' });
        setPasswordMessage({ text: 'Current password is incorrect', type: 'error' });
        setIsLoading(false);
        return;
      }

      // 3. Update password in all users list
      const users = JSON.parse(localStorage.getItem('dormScoutUsers') || '[]');
      const updatedUsers = users.map(u => {
        if (u.id === currentUser.id || u.email === currentUser.email) {
          return { ...u, password: newPassword };
        }
        return u;
      });
      localStorage.setItem('dormScoutUsers', JSON.stringify(updatedUsers));

      // 4. Update current user in localStorage
      const updatedCurrentUser = { ...currentUser, password: newPassword };
      localStorage.setItem('dormScoutUser', JSON.stringify(updatedCurrentUser));

      // 5. Update AuthContext
      if (user) {
        updateUser({ password: newPassword });
      }

      // 6. Clear fields
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordErrors({});

      // 7. Show success message
      setPasswordMessage({ text: 'Password changed successfully! ✓', type: 'success' });
    } catch (error) {
      console.error('Password change error:', error);
      setPasswordMessage({ text: 'Failed to change password. Please try again.', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  }

  function saveNotificationSettings() {
    setIsLoading(true);

    try {
      if (user) {
        updateUser({
          settings: {
            ...(user.settings || {}),
            emailNotifications,
            inAppNotifications,
            messageAlerts,
            darkMode,
          }
        });
      }

      localStorage.setItem('dormscout_settings', JSON.stringify({
        emailNotifications,
        inAppNotifications,
        messageAlerts,
        darkMode,
      }));

      setApplicationMessage({ text: 'Notification settings saved! ✓', type: 'success' });
    } catch (error) {
      setApplicationMessage({ text: 'Failed to save settings', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  }

  function handleVerify() {
    if (!businessName.trim() || !businessPermit.trim()) {
      setVerifyMessage({ text: 'Please fill in both Business Name and Business Permit Number', type: 'error' });
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      setIsVerified(true);
      if (user) {
        updateUser({
          isVerified: true,
          businessName,
          businessPermit,
        });
      }

      localStorage.setItem('dormscout_landlord_profile', JSON.stringify({
        isVerified: true,
        businessName,
        businessPermit
      }));

      setIsLoading(false);
      setVerifyMessage({ text: 'Business verified successfully! ✓', type: 'success' });
    }, 1500);
  }

  async function handleDeleteAccount() {
    setIsLoading(true);

    try {
      if (deleteAccount) {
        const result = await deleteAccount();
        if (result.success) {
          setDeleteModalOpen(false);
          window.location.href = '/login';
        } else {
          setProfileMessage({ text: result.message || 'Failed to delete account', type: 'error' });
        }
      } else {
        localStorage.removeItem('dormscout_landlord_profile');
        localStorage.removeItem('dormScoutUser');
        localStorage.removeItem('dormscout_settings');
        if (logout) logout();
        setDeleteModalOpen(false);
        window.location.href = '/login';
      }
    } catch (error) {
      setProfileMessage({ text: 'Failed to delete account. Please try again.', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  }

  /* ── Render ── */
  return (
    <div
      className="settings-wrapper"
      style={{ background: colors.cardBg, border: `1px solid ${colors.border}` }}
    >
      {/* ── Tabs ── */}
      <div className="settings-tabs">
        {[
          { key: 'profile', label: 'Profile Settings' },
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

      {isLoading && <LoadingSpinner text="Saving..." />}

      {/* ══════════════ PROFILE TAB ══════════════ */}
      {activeSettingTab === 'profile' && !isLoading && (
        <>
          {/* Profile Picture */}
          <SettingSection title="Profile Picture" colors={colors}>
            <div className="settings-avatar">
              <FileUpload
                onFileSelect={handleProfileImageUpload}
                currentImage={profileImage}
                colors={colors}
              />
            </div>
          </SettingSection>

          {/* Personal Information */}
          <SettingSection title="Personal Information" colors={colors}>
            <div className="settings-grid-2 settings-grid-2--mb">
              <InputField
                label="First Name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="John"
                colors={colors}
                required
              />
              <InputField
                label="Last Name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Doe"
                colors={colors}
                required
              />
            </div>
            <div className="settings-grid-2">
              <InputField
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="john@example.com"
                colors={colors}
                required
              />
              <InputField
                label="Phone Number"
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+63 9XX XXX XXXX"
                colors={colors}
              />
            </div>
            <div className="settings-grid-2 settings-grid-2--mb">
              <div className="input-field">
                <label className="input-field__label" style={{ color: colors.secondaryText }}>
                  Gender
                </label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="input-field__select"
                  style={{
                    border: `1px solid ${colors.border}`,
                    background: colors.inputBg,
                    color: colors.text,
                  }}
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Prefer not to say">Prefer not to say</option>
                </select>
              </div>
            </div>

            {/* ✅ Save Button - Calls savePersonalInfo() ONLY */}
            <div>
              <button className="btn-primary btn-primary--mt" onClick={savePersonalInfo}>
                Save Changes
              </button>
              <SectionMessage
                message={profileMessage.text}
                type={profileMessage.type}
                onClose={() => setProfileMessage({ text: '', type: 'success' })}
              />
            </div>
          </SettingSection>

          {/* Landlord: Business Information */}
          {isLandlord && (
            <SettingSection title="Business Information" colors={colors}>
              {isVerified && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '12px',
                  padding: '12px 16px',
                  background: 'rgba(34,197,94,0.1)',
                  borderRadius: '8px',
                  border: '1px solid rgba(34,197,94,0.3)'
                }}>
                  <span style={{ fontSize: '1.2rem' }}>✅</span>
                  <span style={{ color: '#16a34a', fontWeight: 700 }}>Verified Business</span>
                </div>
              )}
              <div className="settings-grid-2 settings-grid-2--mb">
                <InputField
                  label="Business Name"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="Enter business name"
                  colors={colors}
                />
                <InputField
                  label="Business Permit Number"
                  value={businessPermit}
                  onChange={(e) => setBusinessPermit(e.target.value)}
                  placeholder="Enter permit number"
                  colors={colors}
                />
              </div>
              <p style={{ color: colors.secondaryText, marginBottom: '12px' }}>
                {isVerified
                  ? 'Your business has been verified. To update details, please contact support.'
                  : 'Fill in your business details to be verified as a legitimate landlord'
                }
              </p>

              {/* Verify Button and Message */}
              {!isVerified && (
                <div>
                  <button
                    className="btn-primary btn-primary--mt"
                    onClick={handleVerify}
                    disabled={!businessName.trim() || !businessPermit.trim()}
                  >
                    Verify Business
                  </button>
                  <SectionMessage
                    message={verifyMessage.text}
                    type={verifyMessage.type}
                    onClose={() => setVerifyMessage({ text: '', type: 'success' })}
                  />
                </div>
              )}
            </SettingSection>
          )}

          {/* Tenant: Student Information */}
          {!isLandlord && (
            <SettingSection title="Student Information" colors={colors}>
              <div className="settings-grid-2 settings-grid-2--mb">
                <div className="input-field">
                  <label className="input-field__label" style={{ color: colors.secondaryText }}>
                    University <span style={{ color: '#ef4444' }}>*</span>
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
                    {UNIVERSITY_NAMES.map((name) => (
                      <option key={name} value={name}>{name}</option>
                    ))}
                  </select>
                </div>

                <InputField
                  label="Course"
                  value={course}
                  onChange={(e) => setCourse(e.target.value)}
                  placeholder="e.g., BS Computer Science"
                  colors={colors}
                />
              </div>

              <div className="settings-grid-2">
                <div className="input-field">
                  <label className="input-field__label" style={{ color: colors.secondaryText }}>
                    Year Level
                  </label>
                  <select
                    value={yearLevel}
                    onChange={(e) => setYearLevel(e.target.value)}
                    className="input-field__select"
                    style={{
                      border: `1px solid ${colors.border}`,
                      background: colors.inputBg,
                      color: colors.text,
                    }}
                  >
                    <option value="">Select Year Level</option>
                    <option value="1st Year">1st Year</option>
                    <option value="2nd Year">2nd Year</option>
                    <option value="3rd Year">3rd Year</option>
                    <option value="4th Year">4th Year</option>
                    <option value="5th Year+">5th Year+</option>
                  </select>
                </div>
                <InputField
                  label="Student ID"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  placeholder="2024001234"
                  colors={colors}
                />
              </div>

              {/* ✅ Save Button - Calls saveStudentInfo() ONLY */}
              <div>
                <button className="btn-primary btn-primary--mt" onClick={saveStudentInfo}>
                  Save Changes
                </button>
                <SectionMessage
                  message={studentMessage.text}
                  type={studentMessage.type}
                  onClose={() => setStudentMessage({ text: '', type: 'success' })}
                />
              </div>
            </SettingSection>
          )}

          {/* Change Password */}
          <SettingSection title="Change Password" colors={colors}>
            <div className="settings-password-field">
              <InputField
                label="Current Password"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter your current password"
                colors={colors}
                error={passwordErrors.currentPassword}
              />
            </div>
            <div className="settings-password-field">
              <InputField
                label="New Password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Min. 8 characters"
                colors={colors}
                error={passwordErrors.newPassword}
              />
            </div>
            <div className="settings-password-field">
              <InputField
                label="Confirm New Password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                colors={colors}
                error={passwordErrors.confirmPassword}
              />
            </div>
            <div style={{
              background: colors.tabBg,
              padding: '12px',
              borderRadius: '8px',
              marginBottom: '12px',
              fontSize: '0.85rem',
              color: colors.secondaryText
            }}>
              <strong>Password Requirements:</strong>
              <ul style={{ margin: '8px 0 0 20px', padding: 0 }}>
                <li>At least 8 characters long</li>
                <li>One uppercase letter (A-Z)</li>
                <li>One lowercase letter (a-z)</li>
                <li>One number (0-9)</li>
              </ul>
            </div>

            {/* Password Button and Message */}
            <div>
              <button className="btn-primary" onClick={handlePasswordChange}>
                Change Password
              </button>
              <SectionMessage
                message={passwordMessage.text}
                type={passwordMessage.type}
                onClose={() => setPasswordMessage({ text: '', type: 'success' })}
              />
            </div>
          </SettingSection>

          {/* Danger Zone */}
          <SettingSection title="Danger Zone" colors={colors}>
            <p style={{ color: colors.secondaryText }}>
              Once you delete your account, there is no going back. Please be certain.
              {isLandlord ? ' All your listed properties will be removed.' : ' All your bookings and data will be permanently deleted.'}
            </p>
            <button
              onClick={() => setDeleteModalOpen(true)}
              style={{
                background: '#ef4444',
                color: '#fff',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '8px',
                cursor: 'pointer'
              }}
            >
              Delete Account
            </button>
          </SettingSection>
        </>
      )}

      {/* ══════════════ APPLICATION TAB ══════════════ */}
      {activeSettingTab === 'application' && !isLoading && (
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

            {/* Save Preferences Button and Message */}
            <div>
              <button className="btn-primary btn-primary--mt" onClick={saveNotificationSettings}>
                Save Preferences
              </button>
              <SectionMessage
                message={applicationMessage.text}
                type={applicationMessage.type}
                onClose={() => setApplicationMessage({ text: '', type: 'success' })}
              />
            </div>
          </SettingSection>
        </>
      )}

      {/* Delete Account Confirmation Modal */}
      <AlertModal
        isOpen={deleteModalOpen}
        title="Delete Account?"
        message={isLandlord
          ? "Are you sure you want to delete your account? All your properties and data will be permanently removed. This action cannot be undone."
          : "Are you sure you want to delete your account? All your bookings, favorites, and data will be permanently removed. This action cannot be undone."
        }
        type="danger"
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDeleteAccount}
      />
    </div>
  );
}