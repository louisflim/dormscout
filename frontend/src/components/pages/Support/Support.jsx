import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { supportMessagesAPI } from '../../../utils/api';
import './Support.css';
import {
  User,
  LogOut,
  Moon,
  Sun,
  HelpCircle,
  Info,
} from 'lucide-react';

const PRIMARY = '#E8622E';


const COLORS = {
  light: {
    bg:            'linear-gradient(120deg, #d7ebe9 0%, #e8d8c8 55%, #f6dfc9 100%)',
    cardBg:        '#fff',
    text:          '#333',
    secondaryText: '#666',
    border:        '#f0f0f0',
  },
  dark: {
    bg:            '#1a1a2e',
    cardBg:        '#16213e',
    text:          '#eaeaea',
    secondaryText: '#a0a0b0',
    border:        '#2a2a4a',
  },
};

const FAQ_ITEMS = [
  {
    question: 'How do I book a dorm?',
    answer:   "Navigate to the Map View, search for available dorms, and click on the one you're interested in. Follow the booking process to complete your reservation.",
  },
  {
    question: 'Can I cancel my booking?',
    answer:   'Yes, you can cancel your booking up to 7 days before your check-in date. Visit your bookings and select the cancellation option.',
  },
  {
    question: 'How do I contact landlords?',
    answer:   'Use the Messages section in your dashboard to communicate with landlords. You can send inquiries and receive responses directly through the platform.',
  },
  {
    question: 'How do I list my dorm?',
    answer:   'Go to the Listing section in your landlord dashboard and click "Create New Listing". Fill in your dorm details, photos, and pricing.',
  },
];

const CONTACT_INFO = [
  { icon: '📧', label: 'Email',   value: 'support@dormscout.com' },
  { icon: '📱', label: 'Phone',   value: '+63 (32) 123-4567'     },
  { icon: '📍', label: 'Address', value: 'Cebu City, Philippines' },
];

export default function Support({ darkMode = false, setDarkMode }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [localDarkMode, setLocalDarkMode] = useState(Boolean(darkMode));
  const isDark = typeof setDarkMode === 'function' ? Boolean(darkMode) : localDarkMode;
  const colors   = isDark ? COLORS.dark : COLORS.light;
  const dropdownRef = useRef(null);

  const [expandedIndex, setExpandedIndex] = useState(null);
  const [formData,      setFormData]      = useState({ name: '', email: '', subject: '', message: '' });
  const [submitted,     setSubmitted]     = useState(false);
  const [submitError,   setSubmitError]   = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    setLocalDarkMode(Boolean(darkMode));
  }, [darkMode]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target))
        setShowDropdown(false);
    };
    if (showDropdown) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showDropdown]);

  const handleLogout = () => {
    localStorage.removeItem('dormScoutUser');
    localStorage.removeItem('userType');
    navigate('/');
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');
    try {
      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        subject: formData.subject.trim(),
        message: formData.message.trim(),
      };
      const res = await supportMessagesAPI.create(payload, user?.id);
      if (!res.ok) {
        throw new Error(res.message || 'Failed to send support message');
      }
      setSubmitted(true);
      setFormData({ name: '', email: '', subject: '', message: '' });
      setTimeout(() => setSubmitted(false), 3000);
    } catch (err) {
      setSubmitError(err.message || 'Failed to send support message. Please try again.');
    }
  };

  const toggleTheme = () => {
    const nextMode = !isDark;
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

  /* ── shared input style (dynamic parts only) ── */
  const inputStyle = {
    border:     `1px solid ${colors.border}`,
    background: isDark ? '#0f3460' : '#f9f9f9',
    color:      colors.text,
  };

  const handleFocus = (e) => { e.target.style.borderColor = PRIMARY; };
  const handleBlur  = (e) => { e.target.style.borderColor = colors.border; };

  /* ── Render ── */
  return (
    <div className={`support-page ${isDark ? 'dark' : ''}`} style={{ background: colors.bg }}>

      {/* ── Navbar ── */}
      <nav className="dashboard-nav" style={{ background: isDark ? '#16213e' : '#fff' }}>
        <button
          className="dashboard-nav-title-btn"
          style={{
            background: 'none',
            border: 'none',
            padding: 0,
            margin: 0,
            cursor: 'pointer',
            fontSize: 24,
            fontWeight: 700,
            color: colors.text,
            fontFamily: 'inherit',
          }}
          aria-label="Go to Overview"
          onClick={() => navigate('/overview')}
        >
          DormScout
        </button>
        <div ref={dropdownRef} className="dashboard-dropdown-wrap">
          <div className="dashboard-avatar" onClick={() => setShowDropdown(!showDropdown)}>
            <User size={20} color="#fff" />
          </div>
          {showDropdown && (
            <div className="dashboard-dropdown">
              <div className="dropdown-item dropdown-item-profile"
                onClick={() => { navigate('/profile'); setShowDropdown(false); }}>
                <User size={15} /> My Profile
              </div>
              <div className="dropdown-item dropdown-item-default"
                onClick={() => { navigate('/support'); setShowDropdown(false); }}>
                <HelpCircle size={15} /> Help and Support
              </div>
              <div className="dropdown-item dropdown-item-default"
                onClick={() => { navigate('/about'); setShowDropdown(false); }}>
                <Info size={15} /> About Us
              </div>
              <div
                className="dropdown-item dropdown-item-default dropdown-item-dark-toggle"
                onClick={toggleTheme}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', cursor: 'pointer', padding: '10px 12px', }}
              >
                {isDark ? <Sun size={15} /> : <Moon size={15} />}
                <span style={{ marginLeft: 8 }}>{isDark ? 'Light Mode' : 'Dark Mode'}</span>
              </div>

              <div className="dropdown-item dropdown-item-logout"
                onClick={() => { setShowDropdown(false); handleLogout(); }}>
                <LogOut size={15} /> Logout
              </div>
            </div>
          )}
        </div>
      </nav>

      <div className="support-content">

        {/* ── Page Header ── */}
        <div className="support-header">
          <h2 className="support-header__title" style={{ color: colors.text }}>
            <span className="support-header__title-primary">Help</span>
            {' '}& {' '}
            <span className="support-header__title-secondary">Support</span>
          </h2>
          <p className="support-header__subtitle" style={{ color: colors.secondaryText }}>
            Find answers to your questions and get in touch with our support team
          </p>
        </div>

        {/* ── Contact Cards ── */}
        <div>
          <h3 className="support-section-title" style={{ color: colors.text }}>📞 Get in Touch</h3>
          <div className="contact-grid">
            {CONTACT_INFO.map((item) => (
              <div
                key={item.label}
                className="contact-card"
                style={{ background: colors.cardBg, border: `1px solid ${colors.border}` }}
              >
                <div className="contact-card__icon">{item.icon}</div>
                <div className="contact-card__label" style={{ color: colors.secondaryText }}>{item.label}</div>
                <div className="contact-card__value" style={{ color: colors.text }}>{item.value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── FAQ ── */}
        <div>
          <h3 className="support-section-title" style={{ color: colors.text }}>❓ Frequently Asked Questions</h3>
          <div className="faq-list">
            {FAQ_ITEMS.map((item, idx) => {
              const isOpen = expandedIndex === idx;
              return (
                <div
                  key={idx}
                  className="faq-item"
                  style={{ background: colors.cardBg, border: `1px solid ${colors.border}` }}
                >
                  <div
                    className="faq-item__trigger"
                    onClick={() => setExpandedIndex(isOpen ? null : idx)}
                    onMouseEnter={(e) => { e.currentTarget.style.background = colors.border; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                  >
                    <h4 className="faq-item__question" style={{ color: colors.text }}>
                      {item.question}
                    </h4>
                    <span className={`faq-item__chevron${isOpen ? ' faq-item__chevron--open' : ''}`}>
                      ▼
                    </span>
                  </div>

                  {isOpen && (
                    <div
                      className="faq-item__answer"
                      style={{ borderTop: `1px solid ${colors.border}`, color: colors.secondaryText }}
                    >
                      {item.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Contact Form ── */}
        <div
          className="contact-form-wrapper"
          style={{ background: colors.cardBg, border: `1px solid ${colors.border}` }}
        >
          <h3 className="support-section-title" style={{ color: colors.text }}>✉️ Send us a Message</h3>

          {submitted && (
            <div className="contact-form__success">
              ✓ Thank you! We've received your message and will get back to you soon.
            </div>
          )}

          {submitError && (
            <div className="contact-form__success" style={{ background: 'rgba(220,38,38,0.1)', color: '#b91c1c', borderColor: 'rgba(220,38,38,0.25)' }}>
              {submitError}
            </div>
          )}

          <form className="contact-form" onSubmit={handleSubmit}>
            <div className="contact-form__row">
              <input
                type="text"
                name="name"
                placeholder="Your Name"
                value={formData.name}
                onChange={handleFormChange}
                required
                className="contact-form__input"
                style={inputStyle}
                onFocus={handleFocus}
                onBlur={handleBlur}
              />
              <input
                type="email"
                name="email"
                placeholder="Your Email"
                value={formData.email}
                onChange={handleFormChange}
                required
                className="contact-form__input"
                style={inputStyle}
                onFocus={handleFocus}
                onBlur={handleBlur}
              />
            </div>

            <input
              type="text"
              name="subject"
              placeholder="Subject"
              value={formData.subject}
              onChange={handleFormChange}
              required
              className="contact-form__input"
              style={inputStyle}
              onFocus={handleFocus}
              onBlur={handleBlur}
            />

            <textarea
              name="message"
              placeholder="Your Message"
              value={formData.message}
              onChange={handleFormChange}
              required
              rows="6"
              className="contact-form__textarea"
              style={inputStyle}
              onFocus={handleFocus}
              onBlur={handleBlur}
            />

            <button type="submit" className="contact-form__submit">
              Send Message
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}

