import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { User, HelpCircle, Info, Moon, Sun, LogOut } from 'lucide-react';
import { reportsAPI } from '../../../utils/api';
import { useAuth } from '../../../context/AuthContext';
import './Report.css';

const TENANT_REPORT_TYPES = ['Listing', 'Landlord'];
const LANDLORD_REPORT_TYPES = ['Tenant'];

const REASONS_MAP = {
  Listing:  ['False / Misleading Information', 'Scam or Fraudulent Listing', 'Inappropriate Content', 'Already Occupied / Not Available', 'Other'],
  Landlord: ['Harassment or Discrimination', 'Scam or Fraud', 'Unresponsive or Unprofessional', 'Unsafe Living Conditions', 'Other'],
  Tenant:   ['Property Damage', 'Non-Payment / Late Payment', 'Harassment or Threats', 'Violation of House Rules', 'Other'],
};

const COLORS = {
  light: {
    bg:            'linear-gradient(120deg, #d7ebe9 0%, #e8d8c8 55%, #f6dfc9 100%)',
    navBg:         '#fff',
    text:          '#333',
    secondaryText: '#666',
    border:        '#f0f0f0',
    inputBg:       '#fff',
    cardBg:        '#fff',
  },
  dark: {
    bg:            '#1a1a2e',
    navBg:         '#16213e',
    text:          '#eaeaea',
    secondaryText: '#a0a0b0',
    border:        '#2a2a4a',
    inputBg:       '#0f3460',
    cardBg:        '#16213e',
  },
};

export default function Report({ userType = 'tenant', darkMode = false, setDarkMode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const stateUserType = location.state?.userType;
  const stateSubject  = location.state?.subject || '';

  const resolvedUserType = stateUserType || user?.userType || userType;
  const [localDarkMode, setLocalDarkMode] = useState(() => {
    try {
      return typeof darkMode === 'boolean' ? darkMode : localStorage.getItem('darkMode') === 'true';
    } catch (_) {
      return Boolean(darkMode);
    }
  });

  useEffect(() => {
    setLocalDarkMode(Boolean(darkMode));
  }, [darkMode]);

  const dk = typeof setDarkMode === 'function' ? Boolean(darkMode) : localDarkMode;
  const colors = dk ? COLORS.dark : COLORS.light;

  const availableTypes = resolvedUserType === 'landlord' ? LANDLORD_REPORT_TYPES : TENANT_REPORT_TYPES;

  const [reportType,    setReportType]    = useState(availableTypes[0]);
  const [subject,       setSubject]       = useState(stateSubject);
  const [reason,        setReason]        = useState('');
  const [description,   setDescription]   = useState('');
  const [imageFile,     setImageFile]     = useState(null);
  const [imagePreview,  setImagePreview]  = useState(null);
  const [errors,        setErrors]        = useState({});
  const [submitted,     setSubmitted]     = useState(false);
  const [showDropdown,  setShowDropdown]  = useState(false);

  const fileInputRef    = useRef(null);
  const dropdownRef     = useRef(null);

  useEffect(() => {
    function handleClick(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setShowDropdown(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const reasons = REASONS_MAP[reportType] || [];

  function handleTypeChange(type) {
    setReportType(type);
    setReason('');
    setErrors({});
  }

  function handleImageChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setErrors(prev => ({ ...prev, image: 'File must be an image.' }));
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setErrors(prev => ({ ...prev, image: undefined }));
  }

  function removeImage() {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function validate() {
    const next = {};
    if (!subject.trim())      next.subject     = 'This field is required.';
    if (!reason)              next.reason      = 'Please select a reason.';
    if (!description.trim())  next.description = 'Please describe the issue.';
    if (!imageFile)           next.image       = 'Evidence photo is required.';
    return next;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    const reader = new FileReader();
    reader.onload = async () => {
      const report = {
        reportType,
        subject: subject.trim(),
        reason,
        description: description.trim(),
        evidence: reader.result,
        status: 'pending',
      };
      try {
        const result = await reportsAPI.file(report, JSON.parse(localStorage.getItem('dormScoutUser') || '{}')?.id);
        if (result.ok) {
          setSubmitted(true);
        } else {
          alert('Failed to submit report: ' + (result.data?.message || result.message));
        }
      } catch (err) {
        console.error('Failed to file report', err);
        alert('Cannot connect to server. Make sure backend is running.');
      }
    };
    reader.readAsDataURL(imageFile);
  }

  function handleNewReport() {
    setSubject('');
    setReason('');
    setDescription('');
    removeImage();
    setErrors({});
    setSubmitted(false);
    setReportType(availableTypes[0]);
  }

  const handleLogout = () => {
    localStorage.removeItem('dormScoutUser');
    localStorage.removeItem('userType');
    navigate('/');
  };

  const toggleDarkMode = () => {
    const nextMode = !dk;
    if (typeof setDarkMode === 'function') {
      setDarkMode(nextMode);
    } else {
      setLocalDarkMode(nextMode);
      try {
        localStorage.setItem('darkMode', nextMode ? 'true' : 'false');
      } catch (_) {}
    }
    setShowDropdown(false);
  };

  if (submitted) {
    return (
      <div className={`report-page ${dk ? 'dark' : ''}`} style={{ background: colors.bg }}>
        <nav className="dashboard-nav" style={{ background: colors.navBg }}>
          <button
            className="dashboard-nav-title-btn"
            onClick={() => navigate('/overview')}
            style={{
              background: 'none', border: 'none', padding: 0, margin: 0,
              cursor: 'pointer', fontSize: 24, fontWeight: 700,
              color: colors.text, fontFamily: 'inherit',
            }}
          >
            DormScout
          </button>
          <div ref={dropdownRef} className="dashboard-dropdown-wrap">
            <div className="dashboard-avatar" onClick={() => setShowDropdown(!showDropdown)}>
              <User size={20} color="#fff" />
            </div>
            {showDropdown && (
              <div className="dashboard-dropdown" style={{ background: colors.cardBg, borderColor: colors.border }}>
                <div className="dropdown-item dropdown-item-profile"
                  onClick={() => { navigate('/profile'); setShowDropdown(false); }}>
                  <User size={15} /> My Profile
                </div>
                <div className="dropdown-item dropdown-item-default" style={{ color: colors.text, borderColor: colors.border }}
                  onClick={() => { navigate('/support'); setShowDropdown(false); }}>
                  <HelpCircle size={15} /> Help and Support
                </div>
                <div className="dropdown-item dropdown-item-default" style={{ color: colors.text, borderColor: colors.border }}
                  onClick={() => { navigate('/about'); setShowDropdown(false); }}>
                  <Info size={15} /> About Us
                </div>
                <div className="dropdown-item dropdown-item-default dropdown-item-dark-toggle" style={{ color: colors.text, borderColor: colors.border }}
                  onClick={toggleDarkMode}>
                  {dk ? <><Sun size={15} /> Light Mode</> : <><Moon size={15} /> Dark Mode</>}
                </div>
                <div className="dropdown-item dropdown-item-logout"
                  onClick={() => { setShowDropdown(false); handleLogout(); }}>
                  <LogOut size={15} /> Logout
                </div>
              </div>
            )}
          </div>
        </nav>
        <div className="report-wrapper">
          <div className="report-success-card" style={{ background: colors.cardBg, border: `1px solid ${colors.border}` }}>
          <div className="report-success-icon">✅</div>
          <h2 className="report-success-title" style={{ color: colors.text }}>Report Submitted</h2>
          <p className="report-success-msg" style={{ color: colors.secondaryText }}>
            Thank you for your report. Our team will review it within 24–48 hours and take appropriate action.
          </p>
          <button className="report-btn-primary" onClick={handleNewReport}>
            Submit Another Report
          </button>
        </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`report-page ${dk ? 'dark' : ''}`} style={{ background: colors.bg }}>

      {/* Nav */}
      <nav className="dashboard-nav" style={{ background: colors.navBg }}>
        <button
          className="dashboard-nav-title-btn"
          onClick={() => navigate('/overview')}
          style={{
            background: 'none', border: 'none', padding: 0, margin: 0,
            cursor: 'pointer', fontSize: 24, fontWeight: 700,
            color: colors.text, fontFamily: 'inherit',
          }}
        >
          DormScout
        </button>
        <div ref={dropdownRef} className="dashboard-dropdown-wrap">
          <div className="dashboard-avatar" onClick={() => setShowDropdown(!showDropdown)}>
            <User size={20} color="#fff" />
          </div>
          {showDropdown && (
            <div className="dashboard-dropdown" style={{ background: colors.cardBg, borderColor: colors.border }}>
              <div className="dropdown-item dropdown-item-profile"
                onClick={() => { navigate('/profile'); setShowDropdown(false); }}>
                <User size={15} /> My Profile
              </div>
              <div className="dropdown-item dropdown-item-default" style={{ color: colors.text, borderColor: colors.border }}
                onClick={() => { navigate('/support'); setShowDropdown(false); }}>
                <HelpCircle size={15} /> Help and Support
              </div>
              <div className="dropdown-item dropdown-item-default" style={{ color: colors.text, borderColor: colors.border }}
                onClick={() => { navigate('/about'); setShowDropdown(false); }}>
                <Info size={15} /> About Us
              </div>
              <div className="dropdown-item dropdown-item-default dropdown-item-dark-toggle" style={{ color: colors.text, borderColor: colors.border }}
                onClick={toggleDarkMode}>
                {dk ? <><Sun size={15} /> Light Mode</> : <><Moon size={15} /> Dark Mode</>}
              </div>
              <div className="dropdown-item dropdown-item-logout"
                onClick={() => { setShowDropdown(false); handleLogout(); }}>
                <LogOut size={15} /> Logout
              </div>
            </div>
          )}
        </div>
      </nav>

      <div className="report-wrapper">
  <div className="report-container" style={{ background: colors.cardBg, border: `1px solid ${colors.border}` }}>

        {/* Header */}
        <div className="report-header">
          <h2 className="report-title" style={{ color: colors.text }}>
            <span style={{ color: '#E8622E' }}>Submit</span> a Report
          </h2>
          <p className="report-subtitle" style={{ color: colors.secondaryText }}>
            {resolvedUserType === 'landlord'
              ? 'Report a tenant for violations or misconduct.'
              : 'Report a listing or landlord for issues you have encountered.'}
          </p>
        </div>

        <form className="report-form" onSubmit={handleSubmit} noValidate>

          {/* Report Type Tabs (only for tenants who have multiple types) */}
          {availableTypes.length > 1 && (
            <div className="report-section">
              <label className="report-label" style={{ color: colors.text }}>
                What are you reporting? <span className="report-required">*</span>
              </label>
              <div className="report-type-tabs">
                {availableTypes.map((type) => (
                  <button
                    key={type}
                    type="button"
                    className={`report-type-tab ${reportType === type ? 'active' : ''}`}
                    onClick={() => handleTypeChange(type)}
                  >
                    {type === 'Listing' ? '🏠 Listing' : type === 'Landlord' ? '👤 Landlord' : '👤 Tenant'}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Subject */}
          <div className="report-section">
            <label className="report-label" style={{ color: colors.text }}>
              {reportType === 'Listing'
                ? 'Listing Name / Address'
                : reportType === 'Landlord'
                ? 'Landlord Name'
                : 'Tenant Name'}{' '}
              <span className="report-required">*</span>
            </label>
            <input
              type="text"
              className={`report-input ${errors.subject ? 'input-error' : ''}`}
              style={{ background: colors.inputBg, border: `1px solid ${errors.subject ? '#e53e3e' : colors.border}`, color: colors.text }}
              placeholder={
                reportType === 'Listing'
                  ? 'Enter the listing name or address'
                  : reportType === 'Landlord'
                  ? "Enter the landlord's full name"
                  : "Enter the tenant's full name"
              }
              value={subject}
              onChange={(e) => { setSubject(e.target.value); setErrors(p => ({ ...p, subject: undefined })); }}
            />
            {errors.subject && <p className="report-error">{errors.subject}</p>}
          </div>

          {/* Reason */}
          <div className="report-section">
            <label className="report-label" style={{ color: colors.text }}>
              Reason for Report <span className="report-required">*</span>
            </label>
            <select
              className={`report-select ${errors.reason ? 'input-error' : ''}`}
              style={{ background: colors.inputBg, border: `1px solid ${errors.reason ? '#e53e3e' : colors.border}`, color: reason ? colors.text : colors.secondaryText }}
              value={reason}
              onChange={(e) => { setReason(e.target.value); setErrors(p => ({ ...p, reason: undefined })); }}
            >
              <option value="">Select a reason...</option>
              {reasons.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
            {errors.reason && <p className="report-error">{errors.reason}</p>}
          </div>

          {/* Description */}
          <div className="report-section">
            <label className="report-label" style={{ color: colors.text }}>
              Describe the Issue <span className="report-required">*</span>
            </label>
            <textarea
              className={`report-textarea ${errors.description ? 'input-error' : ''}`}
              style={{ background: colors.inputBg, border: `1px solid ${errors.description ? '#e53e3e' : colors.border}`, color: colors.text }}
              placeholder="Please provide as much detail as possible about the issue. Include dates, specific incidents, and any relevant context."
              rows={5}
              value={description}
              onChange={(e) => { setDescription(e.target.value); setErrors(p => ({ ...p, description: undefined })); }}
            />
            <div className="report-char-count" style={{ color: colors.secondaryText }}>
              {description.length} characters
            </div>
            {errors.description && <p className="report-error">{errors.description}</p>}
          </div>

          {/* Evidence Photo */}
          <div className="report-section">
            <label className="report-label" style={{ color: colors.text }}>
              Evidence Photo <span className="report-required">*</span>
            </label>
            <p className="report-field-hint" style={{ color: colors.secondaryText }}>
              Upload a screenshot or photo as evidence. This is required to process your report.
            </p>

            {!imagePreview ? (
              <label
                className={`report-upload-box ${errors.image ? 'upload-error' : ''}`}
                style={{ border: `2px dashed ${errors.image ? '#e53e3e' : colors.border}`, background: colors.inputBg }}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="report-file-hidden"
                  onChange={handleImageChange}
                />
                <div className="report-upload-icon">📷</div>
                <p className="report-upload-text" style={{ color: colors.secondaryText }}>
                  Click to upload evidence photo
                </p>
                <p className="report-upload-hint" style={{ color: colors.secondaryText }}>
                  PNG, JPG, WEBP supported
                </p>
              </label>
            ) : (
              <div className="report-image-preview-wrap">
                <img src={imagePreview} alt="Evidence" className="report-image-preview" />
                <button type="button" className="report-image-remove" onClick={removeImage}>
                  ✕ Remove
                </button>
              </div>
            )}
            {errors.image && <p className="report-error">{errors.image}</p>}
          </div>

          {/* Disclaimer */}
          <div className="report-disclaimer" style={{ background: dk ? '#0f2040' : '#fff8f0', border: `1px solid ${dk ? '#2a4060' : '#fde3c8'}` }}>
            <p style={{ color: colors.secondaryText }}>
              ⚠️ <strong style={{ color: colors.text }}>Important:</strong> False reports may result in account suspension.
              All reports are reviewed by our team before any action is taken.
            </p>
          </div>

          {/* Submit */}
          <button type="submit" className="report-btn-primary report-submit-btn">
            🚩 Submit Report
          </button>
        </form>
      </div>
      </div>
    </div>
  );
}


