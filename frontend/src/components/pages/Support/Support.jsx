import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import './Support.css';
import {
  User,
  LogOut,
  Moon,
  Sun,
  HelpCircle,
  Info,
  Mail,
  Phone,
  MapPin,
  ChevronDown,
  Send,
  CheckCircle,
  MessageSquare,
  BookOpen,
  Clock,
} from 'lucide-react';

import {
  SUPPORT_MESSAGES_KEY,
  formatSupportContent,
  fetchAdminUser,
  sendSupportToAdmin,
} from '../../../utils/adminMessaging';

const PRIMARY  = '#E8622E';
const TEAL     = '#5BADA8';

const COLORS = {
  light: {
    bg:            'linear-gradient(135deg, #d7ebe9 0%, #e8d8c8 55%, #f6dfc9 100%)',
    cardBg:        '#ffffff',
    surfaceBg:     '#f8f9fa',
    text:          '#1a1a2e',
    secondaryText: '#6b7280',
    border:        '#e5e7eb',
    inputBg:       '#f9fafb',
    navBg:         '#ffffff',
  },
  dark: {
    bg:            '#0f0f1a',
    cardBg:        '#16213e',
    surfaceBg:     '#1a1a2e',
    text:          '#f1f5f9',
    secondaryText: '#94a3b8',
    border:        '#2a2a4a',
    inputBg:       '#0f3460',
    navBg:         '#16213e',
  },
};

const FAQ_ITEMS = [
  {
    icon: BookOpen,
    question: 'How do I book a dorm?',
    answer: "Navigate to the Map View, search for available dorms, and click on the one you're interested in. Follow the booking process to complete your reservation.",
  },
  {
    icon: Clock,
    question: 'Can I cancel my booking?',
    answer: 'Yes, you can cancel your booking. Visit your bookings and select the cancellation option.',
  },
  {
    icon: MessageSquare,
    question: 'How do I contact landlords?',
    answer: 'Use the Messages section in your dashboard to communicate with landlords. You can send inquiries and receive responses directly through the platform.',
  },
  {
    icon: MapPin,
    question: 'How do I list my dorm?',
    answer: 'Go to the Listing section in your landlord dashboard and click "Create New Listing". Fill in your dorm details, photos, and pricing.',
  },
];

const CONTACT_INFO = [
  {
    icon: Mail,
    label: 'Email Us',
    value: 'support@dormscout.com',
    description: 'We reply within 24 hours',
    color: PRIMARY,
  },
  {
    icon: Phone,
    label: 'Call Us',
    value: '+63 (32) 123-4567',
    description: 'Mon – Fri, 9 AM – 6 PM PHT',
    color: TEAL,
  },
  {
    icon: MapPin,
    label: 'Visit Us',
    value: 'Cebu City, Philippines',
    description: 'Central Visayas Office',
    color: PRIMARY,
  },
];
 
export default function Support({ darkMode = false, setDarkMode }) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [localDarkMode, setLocalDarkMode] = useState(Boolean(darkMode));
  const isDark   = typeof setDarkMode === 'function' ? Boolean(darkMode) : localDarkMode;
  const colors   = isDark ? COLORS.dark : COLORS.light;
  const dropdownRef = useRef(null);
 
  const [expandedIndex, setExpandedIndex] = useState(null);
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });
  const [submitted, setSubmitted] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
 
  const displayName = [user?.firstName, user?.lastName].filter(Boolean).join(' ').trim()
    || user?.name || user?.email || 'Account';
  const userInitials = displayName
    .split(' ').filter(Boolean).map((p) => p[0]).join('').toUpperCase().slice(0, 2) || 'A';
 
  useEffect(() => { setLocalDarkMode(Boolean(darkMode)); }, [darkMode]);
 
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target))
        setShowDropdown(false);
    };
    if (showDropdown) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showDropdown]);
 
  const handleSubmit = async (e) => {
    e.preventDefault();
 
    let existingSupportMessages = [];
    try {
      const saved = JSON.parse(localStorage.getItem(SUPPORT_MESSAGES_KEY) || '[]');
      existingSupportMessages = Array.isArray(saved) ? saved : [];
    } catch (_) { existingSupportMessages = []; }
 
    const senderRole = (localStorage.getItem('userType') || 'all').toLowerCase();
    const formattedContent = formatSupportContent(formData.subject, formData.message);
    const supportMessage = {
      id: `support-${Date.now()}`,
      userId: user?.id,
      name: formData.name,
      email: formData.email,
      subject: formData.subject,
      message: formattedContent,
      forRole: senderRole,
      createdAt: new Date().toISOString(),
      replied: false,
    };
 
    localStorage.setItem(SUPPORT_MESSAGES_KEY, JSON.stringify([supportMessage, ...existingSupportMessages]));
 
    if (user?.id) {
      try {
        const adminAccount = await fetchAdminUser();
        if (adminAccount?.id) {
          await sendSupportToAdmin({
            senderId: Number(user.id),
            adminId: Number(adminAccount.id),
            subject: formData.subject,
            message: formData.message,
          });
        }
      } catch (_) {}
    }
 
    setSubmitted(true);
    setFormData({ name: '', email: '', subject: '', message: '' });
    setTimeout(() => setSubmitted(false), 5000);
  };
 
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };
 
  const handleLogout = () => {
    logout();
    localStorage.removeItem('userType');
    navigate('/');
  };
 
  const toggleTheme = () => {
    const nextMode = !isDark;
    if (typeof setDarkMode === 'function') {
      setDarkMode(nextMode);
    } else {
      setLocalDarkMode(nextMode);
      try { localStorage.setItem('darkMode', nextMode ? 'true' : 'false'); } catch (_) {}
    }
    setShowDropdown(false);
  };
 
  const inputStyle = {
    border:     `1.5px solid ${colors.border}`,
    background: colors.inputBg,
    color:      colors.text,
  };
 
  const handleFocus = (e) => { e.target.style.borderColor = PRIMARY; e.target.style.boxShadow = `0 0 0 3px ${PRIMARY}18`; };
  const handleBlur  = (e) => { e.target.style.borderColor = colors.border; e.target.style.boxShadow = 'none'; };
 
  return (
    <div className={`support-page ${isDark ? 'dark' : ''}`} style={{ background: colors.bg }}>
 
      {/* ── Navbar ── */}
      <nav className="dashboard-nav" style={{ background: colors.navBg }}>
        <button
          className="dashboard-nav-title-btn"
          aria-label="Go to Overview"
          onClick={() => navigate('/overview')}
        >
          <span style={{ color: PRIMARY }}>Dorm</span>
          <span style={{ color: TEAL }}>Scout</span>
        </button>
 
        <div ref={dropdownRef} className="dashboard-dropdown-wrap">
          <div className="dashboard-avatar" onClick={() => setShowDropdown(!showDropdown)}>
            {user?.profileImage
              ? <img src={user.profileImage} alt="Profile" />
              : <span>{userInitials}</span>
            }
          </div>
          {showDropdown && (
            <div className="dashboard-dropdown" style={{ background: colors.cardBg, borderColor: colors.border }}>
              <div className="dropdown-item dropdown-item-profile"
                onClick={() => { navigate('/profile'); setShowDropdown(false); }}>
                <User size={14} /> {displayName}
              </div>
              <div className="dropdown-item dropdown-item-default"
                style={{ color: colors.text, borderColor: colors.border }}
                onClick={() => { navigate('/support'); setShowDropdown(false); }}>
                <HelpCircle size={14} /> Help and Support
              </div>
              <div className="dropdown-item dropdown-item-default"
                style={{ color: colors.text, borderColor: colors.border }}
                onClick={() => { navigate('/about'); setShowDropdown(false); }}>
                <Info size={14} /> About Us
              </div>
              <div className="dropdown-item dropdown-item-default dropdown-item-dark-toggle"
                style={{ color: colors.text, borderColor: colors.border }}
                onClick={toggleTheme}>
                {isDark ? <Sun size={14} /> : <Moon size={14} />}
                <span>{isDark ? 'Light Mode' : 'Dark Mode'}</span>
              </div>
              <div className="dropdown-item dropdown-item-logout"
                onClick={() => { setShowDropdown(false); handleLogout(); }}>
                <LogOut size={14} /> Logout
              </div>
            </div>
          )}
        </div>
      </nav>
 
      <div className="support-content">
 
        {/* ── Page Header ── */}
        <div className="support-header">
          <div className="support-header__badge">
            <HelpCircle size={14} strokeWidth={2.5} />
            Support Center
          </div>
          <h1 className="support-header__title">
            <span className="support-header__title-primary">Help</span>
            {' & '}
            <span className="support-header__title-secondary">Support</span>
          </h1>
          <p className="support-header__subtitle" style={{ color: colors.secondaryText }}>
            Find answers to common questions or reach out — our team is ready to help.
          </p>
        </div>
 
        {/* ── Contact Cards ── */}
        <section className="support-section">
          <div className="support-section-header">
            <div className="support-section-icon" style={{ background: `${PRIMARY}15`, color: PRIMARY }}>
              <Phone size={16} strokeWidth={2.5} />
            </div>
            <h2 className="support-section-title" style={{ color: colors.text }}>Get in Touch</h2>
          </div>
          <div className="contact-grid">
            {CONTACT_INFO.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="contact-card"
                  style={{ background: colors.cardBg, borderColor: colors.border }}>
                  <div className="contact-card__icon-wrap" style={{ background: `${item.color}12` }}>
                    <Icon size={20} color={item.color} strokeWidth={2} />
                  </div>
                  <div className="contact-card__label" style={{ color: colors.secondaryText }}>
                    {item.label}
                  </div>
                  <div className="contact-card__value" style={{ color: colors.text }}>
                    {item.value}
                  </div>
                  <div className="contact-card__desc" style={{ color: colors.secondaryText }}>
                    {item.description}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
 
        {/* ── FAQ ── */}
        <section className="support-section">
          <div className="support-section-header">
            <div className="support-section-icon" style={{ background: `${TEAL}15`, color: TEAL }}>
              <HelpCircle size={16} strokeWidth={2.5} />
            </div>
            <h2 className="support-section-title" style={{ color: colors.text }}>
              Frequently Asked Questions
            </h2>
          </div>
          <div className="faq-list">
            {FAQ_ITEMS.map((item, idx) => {
              const isOpen = expandedIndex === idx;
              const Icon = item.icon;
              return (
                <div key={idx} className={`faq-item ${isOpen ? 'faq-item--open' : ''}`}
                  style={{ background: colors.cardBg, borderColor: isOpen ? PRIMARY : colors.border }}>
                  <div className="faq-item__trigger"
                    onClick={() => setExpandedIndex(isOpen ? null : idx)}>
                    <div className="faq-item__trigger-left">
                      <div className="faq-item__icon-wrap" style={{ background: isOpen ? `${PRIMARY}15` : colors.surfaceBg }}>
                        <Icon size={15} color={isOpen ? PRIMARY : colors.secondaryText} strokeWidth={2} />
                      </div>
                      <h3 className="faq-item__question" style={{ color: colors.text }}>
                        {item.question}
                      </h3>
                    </div>
                    <ChevronDown
                      size={18}
                      strokeWidth={2.5}
                      color={isOpen ? PRIMARY : colors.secondaryText}
                      className={`faq-item__chevron ${isOpen ? 'faq-item__chevron--open' : ''}`}
                    />
                  </div>
                  {isOpen && (
                    <div className="faq-item__answer" style={{ borderColor: colors.border, color: colors.secondaryText }}>
                      {item.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
 
        {/* ── Contact Form ── */}
        <section className="support-section">
          <div className="contact-form-wrapper"
            style={{ background: colors.cardBg, borderColor: colors.border }}>
            <div className="contact-form-header">
              <div className="support-section-header" style={{ marginBottom: 0 }}>
                <div className="support-section-icon" style={{ background: `${PRIMARY}15`, color: PRIMARY }}>
                  <Send size={16} strokeWidth={2.5} />
                </div>
                <h2 className="support-section-title" style={{ color: colors.text, margin: 0 }}>
                  Send us a Message
                </h2>
              </div>
              <p className="contact-form-subtitle" style={{ color: colors.secondaryText }}>
                We typically respond within one business day.
              </p>
            </div>
 
            {submitted && (
              <div className="contact-form__success">
                <CheckCircle size={18} strokeWidth={2.5} />
                <span>Message sent! We'll get back to you within 24 hours.</span>
              </div>
            )}
 
            <form className="contact-form" onSubmit={handleSubmit}>
              <div className="contact-form__row">
                <div className="form-field">
                  <label className="form-label" style={{ color: colors.secondaryText }}>Full Name</label>
                  <input
                    type="text" name="name" placeholder="e.g. Juan dela Cruz"
                    value={formData.name} onChange={handleFormChange} required
                    className="contact-form__input" style={inputStyle}
                    onFocus={handleFocus} onBlur={handleBlur}
                  />
                </div>
                <div className="form-field">
                  <label className="form-label" style={{ color: colors.secondaryText }}>Email Address</label>
                  <input
                    type="email" name="email" placeholder="you@example.com"
                    value={formData.email} onChange={handleFormChange} required
                    className="contact-form__input" style={inputStyle}
                    onFocus={handleFocus} onBlur={handleBlur}
                  />
                </div>
              </div>
 
              <div className="form-field">
                <label className="form-label" style={{ color: colors.secondaryText }}>Subject</label>
                <input
                  type="text" name="subject" placeholder="What's your concern about?"
                  value={formData.subject} onChange={handleFormChange} required
                  className="contact-form__input" style={inputStyle}
                  onFocus={handleFocus} onBlur={handleBlur}
                />
              </div>
 
              <div className="form-field">
                <label className="form-label" style={{ color: colors.secondaryText }}>Message</label>
                <textarea
                  name="message" placeholder="Describe your issue or question in detail…"
                  value={formData.message} onChange={handleFormChange} required rows="6"
                  className="contact-form__textarea" style={inputStyle}
                  onFocus={handleFocus} onBlur={handleBlur}
                />
              </div>
 
              <div className="contact-form__footer">
                <p className="contact-form__note" style={{ color: colors.secondaryText }}>
                  Your message will be securely delivered to our support team.
                </p>
                <button type="submit" className="contact-form__submit">
                  <Send size={15} strokeWidth={2.5} />
                  Send Message
                </button>
              </div>
            </form>
          </div>
        </section>
 
      </div>
    </div>
  );
}