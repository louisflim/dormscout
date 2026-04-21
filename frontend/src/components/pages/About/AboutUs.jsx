import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './AboutUs.css';
import {
  User,
  LogOut,
  Moon,
  Sun,
  HelpCircle,
  Info,
} from 'lucide-react';

const FEATURES = [
  {
    icon: '🗺️',
    title: 'Interactive Maps',
    description: 'Discover dorms near your university with our advanced map interface.',
  },
  {
    icon: '🔍',
    title: 'Smart Search',
    description: 'Filter by location to find your perfect dorm.',
  },
  {
    icon: '💬',
    title: 'Direct Communication',
    description: 'Connect with landlords and other students instantly through our platform.',
  },
  {
    icon: '⭐',
    title: 'Reviews & Ratings',
    description: 'Make informed decisions with genuine reviews from other students.',
  },
];

export default function AboutUs({ darkMode = false, setDarkMode, onBack, setScreen }) {
  const navigate = useNavigate();
  const [localDarkMode, setLocalDarkMode] = useState(Boolean(darkMode));
  const isDark = typeof setDarkMode === 'function' ? Boolean(darkMode) : localDarkMode;
  const theme = isDark ? 'dark' : 'light';
  const dropdownRef = useRef(null);
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

  return (
    <div className={`about-wrapper ${theme}`}>
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
            color: theme === 'dark' ? '#eaeaea' : '#333',
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

      <div className="about-content">
        {/* Hero */}
        <div className="about-hero">
          <h2>
            About <span className="brand-dorm">Dorm</span><span className="brand-scout">Scout</span>
          </h2>
          <p>
            Making it easy for students to find their perfect dorm and landlords to find reliable tenants
          </p>
        </div>

        {/* Mission */}
        <div className="about-card">
          <h3 className="mission-title">🎯 Our Mission</h3>
          <p>
            At DormScout, we believe that finding a dorm shouldn't be stressful. Our mission is to create a seamless,
            transparent, and trustworthy platform that connects students with quality accommodations. We're committed to
            making the dorm-hunting experience simple, safe, and enjoyable for both students and landlords.
          </p>
        </div>

        {/* Vision */}
        <div className="about-card">
          <h3 className="vision-title">✨ Our Vision</h3>
          <p>
            We envision a future where every student in Cebu has access to safe, affordable, and quality housing options.
            Through technology and community building, we aim to transform the student accommodation industry across the
            Philippines and beyond.
          </p>
        </div>

        {/* Features */}
        <div className="about-features">
          <h3 className="about-features-title">Why Choose DormScout?</h3>
          <div className="features-grid">
            {FEATURES.map((feature, idx) => (
              <div key={idx} className="feature-card">
                <div className="feature-icon">{feature.icon}</div>
                <h4>{feature.title}</h4>
                <p>{feature.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="about-card about-cta">
          <h4>Questions? We're Here to Help</h4>
          <p>Have any questions about DormScout? Feel free to reach out to our support team.</p>
          <button
            className="about-contact-btn"
            onClick={() => { if (setScreen) setScreen('support'); }}
          >
            Contact Us
          </button>
        </div>
      </div>
    </div>
  );
}

