import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import './AboutUs.css';
import {
  User,
  LogOut,
  Moon,
  Sun,
  HelpCircle,
  Info,
  Map,
  Search,
  MessageSquare,
  Star,
  Target,
  Sparkles,
  ArrowRight,
} from 'lucide-react';

const PRIMARY = '#E8622E';
const TEAL    = '#5BADA8';

const FEATURES = [
  {
    icon: Map,
    color: PRIMARY,
    title: 'Interactive Maps',
    description: 'Discover dorms near your university with our advanced map interface.',
  },
  {
    icon: Search,
    color: TEAL,
    title: 'Smart Search',
    description: 'Filter by location, price, and room type to find your perfect dorm.',
  },
  {
    icon: MessageSquare,
    color: PRIMARY,
    title: 'Direct Communication',
    description: 'Connect with landlords instantly through our built-in messaging platform.',
  },
  {
    icon: Star,
    color: TEAL,
    title: 'Reviews & Ratings',
    description: 'Make informed decisions with genuine reviews from fellow students.',
  },
];

export default function AboutUs({ darkMode = false, setDarkMode }) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [localDarkMode, setLocalDarkMode] = useState(Boolean(darkMode));
  const isDark = typeof setDarkMode === 'function' ? Boolean(darkMode) : localDarkMode;
  const theme = isDark ? 'dark' : 'light';
  const dropdownRef = useRef(null);
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

  const handleLogout = () => {
    logout();
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

  return (
    <div className={`about-wrapper ${theme}`}>

      {/* ── Navbar ── */}
      <nav className="dashboard-nav">
        <button className="dashboard-nav-title-btn" aria-label="Go to Overview" onClick={() => navigate('/overview')}>
          <span style={{ color: PRIMARY }}>Dorm</span>
          <span style={{ color: TEAL }}>Scout</span>
        </button>

        <div ref={dropdownRef} className="dashboard-dropdown-wrap">
          <div className="dashboard-avatar" onClick={() => setShowDropdown(!showDropdown)}>
            {user?.profileImage ? <img src={user.profileImage} alt="Profile" /> : <span>{userInitials}</span>}
          </div>
          {showDropdown && (
            <div className="dashboard-dropdown">
              <div className="dropdown-item dropdown-item-profile"
                onClick={() => { navigate('/profile'); setShowDropdown(false); }}>
                <User size={14} /> {displayName}
              </div>
              <div className="dropdown-item dropdown-item-default"
                onClick={() => { navigate('/support'); setShowDropdown(false); }}>
                <HelpCircle size={14} /> Help and Support
              </div>
              <div className="dropdown-item dropdown-item-default"
                onClick={() => { navigate('/about'); setShowDropdown(false); }}>
                <Info size={14} /> About Us
              </div>
              <div className="dropdown-item dropdown-item-default dropdown-item-dark-toggle" onClick={toggleTheme}>
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

      <div className="about-content">

        {/* ── Hero ── */}
        <div className="about-hero">
          <div className="about-hero__badge">
            <Info size={14} strokeWidth={2.5} />
            About Us
          </div>
          <h1 className="about-hero__title">
            About <span className="brand-dorm">Dorm</span><span className="brand-scout">Scout</span>
          </h1>
          <p className="about-hero__subtitle">
            Making it easy for students to find their perfect dorm — and for landlords to find reliable tenants.
          </p>
        </div>

        {/* ── Mission ── */}
        <div className="about-card">
          <div className="about-card__header">
            <div className="about-card__icon-wrap" style={{ background: `${PRIMARY}15` }}>
              <Target size={18} color={PRIMARY} strokeWidth={2} />
            </div>
            <h2 className="about-card__title mission-title">Our Mission</h2>
          </div>
          <p className="about-card__body">
            At DormScout, we believe that finding a dorm shouldn't be stressful. Our mission is to create a seamless,
            transparent, and trustworthy platform that connects students with quality accommodations. We're committed to
            making the dorm-hunting experience simple, safe, and enjoyable for both students and landlords.
          </p>
        </div>

        {/* ── Vision ── */}
        <div className="about-card">
          <div className="about-card__header">
            <div className="about-card__icon-wrap" style={{ background: `${TEAL}15` }}>
              <Sparkles size={18} color={TEAL} strokeWidth={2} />
            </div>
            <h2 className="about-card__title vision-title">Our Vision</h2>
          </div>
          <p className="about-card__body">
            We envision a future where every student in Cebu has access to safe, affordable, and quality housing options.
            Through technology and community building, we aim to transform the student accommodation industry across the
            Philippines and beyond.
          </p>
        </div>

        {/* ── Features ── */}
        <section className="about-features">
          <h2 className="about-features-title">Why Choose DormScout?</h2>
          <div className="features-grid">
            {FEATURES.map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <div key={idx} className="feature-card">
                  <div className="feature-icon-wrap" style={{ background: `${feature.color}12` }}>
                    <Icon size={22} color={feature.color} strokeWidth={2} />
                  </div>
                  <h3 className="feature-card__title">{feature.title}</h3>
                  <p className="feature-card__desc">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── CTA ── */}
        <div className="about-card about-cta">
          <h2 className="about-cta__title">Questions? We're Here to Help</h2>
          <p className="about-cta__body">
            Have questions about DormScout? Our support team is ready to assist you.
          </p>
          <button className="about-contact-btn" onClick={() => navigate('/support')}>
            Contact Support
            <ArrowRight size={15} strokeWidth={2.5} />
          </button>
        </div>

      </div>
    </div>
  );
}