import React from 'react';

const PRIMARY = '#E8622E';
const SECONDARY = '#5BADA8';

const COLORS = {
  light: {
    bg: 'linear-gradient(120deg, #d7ebe9 0%, #e8d8c8 55%, #f6dfc9 100%)',
    cardBg: '#fff',
    text: '#333',
    secondaryText: '#666',
    border: '#f0f0f0',
  },
  dark: {
    bg: '#1a1a2e',
    cardBg: '#16213e',
    text: '#eaeaea',
    secondaryText: '#a0a0b0',
    border: '#2a2a4a',
  },
};

const FEATURES = [
  {
    icon: '🗺️',
    title: 'Interactive Maps',
    description: 'Discover dorms near your university with our advanced map interface.',
  },
  {
    icon: '🔍',
    title: 'Smart Search',
    description: 'Filter by location, price, amenities, and more to find your perfect dorm.',
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

export default function AboutUs({ darkMode = false, onBack }) {
  const colors = darkMode ? COLORS.dark : COLORS.light;

  return (
    <div style={{
      background: colors.bg,
      minHeight: '100vh',
      paddingTop: '60px',
    }}>
      <nav style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        background: darkMode ? '#16213e' : '#fff',
        borderBottom: `3px solid ${SECONDARY}`,
        padding: '16px 32px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <h1 style={{ fontSize: '24px', fontWeight: '700', margin: 0, color: colors.text }}>DormScout</h1>
        <button
          onClick={onBack}
          style={{
            background: PRIMARY,
            color: '#fff',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '600',
            transition: 'opacity 0.2s ease',
          }}
          onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
          onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
        >
          ← Back
        </button>
      </nav>

      <div style={{ padding: '40px 32px', maxWidth: '1000px', margin: '0 auto' }}>
        {/* Hero Section */}
        <div style={{ textAlign: 'center', marginBottom: '60px' }}>
          <h2 style={{
            fontSize: '48px',
            fontWeight: '700',
            margin: '0 0 16px 0',
            color: colors.text,
          }}>
            About <span style={{ color: PRIMARY }}>Dorm</span><span style={{ color: SECONDARY }}>Scout</span>
          </h2>
          <p style={{
            fontSize: '18px',
            color: colors.secondaryText,
            margin: 0,
            lineHeight: '1.6',
          }}>
            Making it easy for students to find their perfect dorm and landlords to find reliable tenants
          </p>
        </div>

        {/* Mission Section */}
        <div style={{
          background: colors.cardBg,
          padding: '40px',
          borderRadius: '12px',
          border: `1px solid ${colors.border}`,
          marginBottom: '60px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        }}>
          <h3 style={{
            fontSize: '24px',
            fontWeight: '700',
            marginBottom: '16px',
            color: PRIMARY,
          }}>
            🎯 Our Mission
          </h3>
          <p style={{
            fontSize: '16px',
            color: colors.text,
            lineHeight: '1.8',
            margin: 0,
          }}>
            At DormScout, we believe that finding a dorm shouldn't be stressful. Our mission is to create a seamless, 
            transparent, and trustworthy platform that connects students with quality accommodations. We're committed to 
            making the dorm-hunting experience simple, safe, and enjoyable for both students and landlords.
          </p>
        </div>

        {/* Vision Section */}
        <div style={{
          background: colors.cardBg,
          padding: '40px',
          borderRadius: '12px',
          border: `1px solid ${colors.border}`,
          marginBottom: '60px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        }}>
          <h3 style={{
            fontSize: '24px',
            fontWeight: '700',
            marginBottom: '16px',
            color: SECONDARY,
          }}>
            ✨ Our Vision
          </h3>
          <p style={{
            fontSize: '16px',
            color: colors.text,
            lineHeight: '1.8',
            margin: 0,
          }}>
            We envision a future where every student in Cebu has access to safe, affordable, and quality housing options. 
            Through technology and community building, we aim to transform the student accommodation industry across the 
            Philippines and beyond.
          </p>
        </div>

        {/* Features Section */}
        <div style={{ marginBottom: '60px' }}>
          <h3 style={{
            fontSize: '28px',
            fontWeight: '700',
            marginBottom: '32px',
            textAlign: 'center',
            color: colors.text,
          }}>
            Why Choose DormScout?
          </h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '24px',
          }}>
            {FEATURES.map((feature, idx) => (
              <div
                key={idx}
                style={{
                  background: colors.cardBg,
                  padding: '28px 24px',
                  borderRadius: '12px',
                  border: `1px solid ${colors.border}`,
                  textAlign: 'center',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-8px)';
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.12)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)';
                }}
              >
                <div style={{ fontSize: '40px', marginBottom: '12px' }}>
                  {feature.icon}
                </div>
                <h4 style={{
                  fontSize: '18px',
                  fontWeight: '700',
                  margin: '0 0 12px 0',
                  color: colors.text,
                }}>
                  {feature.title}
                </h4>
                <p style={{
                  fontSize: '14px',
                  color: colors.secondaryText,
                  margin: 0,
                  lineHeight: '1.6',
                }}>
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Contact CTA */}
        <div style={{
          background: colors.cardBg,
          padding: '32px',
          borderRadius: '12px',
          border: `1px solid ${colors.border}`,
          textAlign: 'center',
        }}>
          <h4 style={{
            fontSize: '18px',
            fontWeight: '700',
            color: colors.text,
            marginBottom: '12px',
          }}>
            Questions? We're Here to Help
          </h4>
          <p style={{
            fontSize: '14px',
            color: colors.secondaryText,
            margin: '0 0 16px 0',
          }}>
            Have any questions about DormScout? Feel free to reach out to our support team.
          </p>
          <a
            href="mailto:info@dormscout.com"
            style={{
              display: 'inline-block',
              background: PRIMARY,
              color: '#fff',
              padding: '10px 24px',
              borderRadius: '8px',
              textDecoration: 'none',
              fontWeight: '600',
              transition: 'opacity 0.2s ease',
            }}
            onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
            onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
          >
            Contact Us
          </a>
        </div>
      </div>
    </div>
  );
}
