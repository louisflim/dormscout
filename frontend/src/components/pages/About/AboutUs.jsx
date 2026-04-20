import React from 'react';
import { useNavigate } from 'react-router-dom';
import './AboutUs.css';

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

export default function AboutUs({ darkMode = false, onBack, setScreen }) {
  const navigate = useNavigate();
  const theme = darkMode ? 'dark' : 'light';

  return (
    <div className={`about-wrapper ${theme}`}>
      <nav className={`about-nav ${theme}`}>
        <button
          className="about-nav-title-btn"
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
          onClick={() => navigate('/dashboard?section=overview')}
        >
          DormScout
        </button>
        <button className="about-back-btn" onClick={() => navigate(-1)}>
          ← Back
        </button>
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