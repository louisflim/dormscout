import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

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

const FAQ_ITEMS = [
  {
    question: 'How do I book a dorm?',
    answer: 'Navigate to the Map View, search for available dorms, and click on the one you\'re interested in. Follow the booking process to complete your reservation.',
  },
  {
    question: 'Can I cancel my booking?',
    answer: 'Yes, you can cancel your booking up to 7 days before your check-in date. Visit your bookings and select the cancellation option.',
  },
  {
    question: 'How do I contact landlords?',
    answer: 'Use the Messages section in your dashboard to communicate with landlords. You can send inquiries and receive responses directly through the platform.',
  },
  {
    question: 'How do I list my dorm?',
    answer: 'Go to the Listing section in your landlord dashboard and click "Create New Listing". Fill in your dorm details, photos, and pricing.',
  },
];

const CONTACT_INFO = [
  { icon: '📧', label: 'Email', value: 'support@dormscout.com' },
  { icon: '📱', label: 'Phone', value: '+63 (32) 123-4567' },
  { icon: '📍', label: 'Address', value: 'Cebu City, Philippines' },
];

export default function Support({ darkMode = false }) {
  const navigate = useNavigate();
  const colors = darkMode ? COLORS.dark : COLORS.light;
  const [expandedIndex, setExpandedIndex] = useState(null);
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });
  const [submitted, setSubmitted] = useState(false);

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    setFormData({ name: '', email: '', subject: '', message: '' });
    setTimeout(() => setSubmitted(false), 3000);
  };

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
          onClick={() => navigate(-1)}
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
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '60px' }}>
          <h2 style={{
            fontSize: '48px',
            fontWeight: '700',
            margin: '0 0 16px 0',
            color: colors.text,
          }}>
            <span style={{ color: PRIMARY }}>Help</span> & <span style={{ color: SECONDARY }}>Support</span>
          </h2>
          <p style={{
            fontSize: '18px',
            color: colors.secondaryText,
            margin: 0,
          }}>
            Find answers to your questions and get in touch with our support team
          </p>
        </div>

        {/* Contact Section */}
        <div style={{ marginBottom: '60px' }}>
          <h3 style={{
            fontSize: '24px',
            fontWeight: '700',
            marginBottom: '24px',
            color: colors.text,
          }}>
            📞 Get in Touch
          </h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '16px',
          }}>
            {CONTACT_INFO.map((item, idx) => (
              <div
                key={idx}
                style={{
                  background: colors.cardBg,
                  padding: '20px',
                  borderRadius: '12px',
                  border: `1px solid ${colors.border}`,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.12)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)';
                }}
              >
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>{item.icon}</div>
                <div style={{
                  fontSize: '12px',
                  color: colors.secondaryText,
                  fontWeight: '600',
                  marginBottom: '4px',
                }}>
                  {item.label}
                </div>
                <div style={{
                  fontSize: '16px',
                  fontWeight: '600',
                  color: colors.text,
                }}>
                  {item.value}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ Section */}
        <div>
          <h3 style={{
            fontSize: '24px',
            fontWeight: '700',
            marginBottom: '24px',
            color: colors.text,
          }}>
            ❓ Frequently Asked Questions
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {FAQ_ITEMS.map((item, idx) => (
              <div
                key={idx}
                style={{
                  background: colors.cardBg,
                  borderRadius: '12px',
                  border: `1px solid ${colors.border}`,
                  overflow: 'hidden',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                }}
              >
                <div
                  onClick={() => setExpandedIndex(expandedIndex === idx ? null : idx)}
                  style={{
                    padding: '20px',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    transition: 'background 0.2s ease',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = colors.border}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <h4 style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    margin: 0,
                    color: colors.text,
                  }}>
                    {item.question}
                  </h4>
                  <span style={{
                    fontSize: '20px',
                    color: PRIMARY,
                    transition: 'transform 0.3s ease',
                    transform: expandedIndex === idx ? 'rotate(180deg)' : 'rotate(0deg)',
                  }}>
                    ▼
                  </span>
                </div>
                {expandedIndex === idx && (
                  <div style={{
                    padding: '0 20px 20px 20px',
                    borderTop: `1px solid ${colors.border}`,
                    fontSize: '14px',
                    color: colors.secondaryText,
                    lineHeight: '1.6',
                  }}>
                    {item.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Contact Form */}
        <div style={{
          marginTop: '60px',
          padding: '40px',
          background: colors.cardBg,
          borderRadius: '12px',
          border: `1px solid ${colors.border}`,
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        }}>
          <h3 style={{
            fontSize: '24px',
            fontWeight: '700',
            marginBottom: '24px',
            color: colors.text,
          }}>
            ✉️ Send us a Message
          </h3>

          {submitted && (
            <div style={{
              padding: '16px',
              background: '#d4edda',
              color: '#155724',
              borderRadius: '8px',
              marginBottom: '24px',
              border: '1px solid #c3e6cb',
              fontSize: '14px',
              fontWeight: '500',
            }}>
              ✓ Thank you! We've received your message and will get back to you soon.
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <input
                type="text"
                name="name"
                placeholder="Your Name"
                value={formData.name}
                onChange={handleFormChange}
                required
                style={{
                  padding: '12px 16px',
                  borderRadius: '8px',
                  border: `1px solid ${colors.border}`,
                  background: darkMode ? '#0f3460' : '#f9f9f9',
                  color: colors.text,
                  fontSize: '14px',
                  fontFamily: 'inherit',
                  transition: 'border 0.2s ease',
                }}
                onFocus={(e) => e.target.style.borderColor = PRIMARY}
                onBlur={(e) => e.target.style.borderColor = colors.border}
              />
              <input
                type="email"
                name="email"
                placeholder="Your Email"
                value={formData.email}
                onChange={handleFormChange}
                required
                style={{
                  padding: '12px 16px',
                  borderRadius: '8px',
                  border: `1px solid ${colors.border}`,
                  background: darkMode ? '#0f3460' : '#f9f9f9',
                  color: colors.text,
                  fontSize: '14px',
                  fontFamily: 'inherit',
                  transition: 'border 0.2s ease',
                }}
                onFocus={(e) => e.target.style.borderColor = PRIMARY}
                onBlur={(e) => e.target.style.borderColor = colors.border}
              />
            </div>

            <input
              type="text"
              name="subject"
              placeholder="Subject"
              value={formData.subject}
              onChange={handleFormChange}
              required
              style={{
                padding: '12px 16px',
                borderRadius: '8px',
                border: `1px solid ${colors.border}`,
                background: darkMode ? '#0f3460' : '#f9f9f9',
                color: colors.text,
                fontSize: '14px',
                fontFamily: 'inherit',
                transition: 'border 0.2s ease',
              }}
              onFocus={(e) => e.target.style.borderColor = PRIMARY}
              onBlur={(e) => e.target.style.borderColor = colors.border}
            />

            <textarea
              name="message"
              placeholder="Your Message"
              value={formData.message}
              onChange={handleFormChange}
              required
              rows="6"
              style={{
                padding: '12px 16px',
                borderRadius: '8px',
                border: `1px solid ${colors.border}`,
                background: darkMode ? '#0f3460' : '#f9f9f9',
                color: colors.text,
                fontSize: '14px',
                fontFamily: 'inherit',
                resize: 'vertical',
                transition: 'border 0.2s ease',
              }}
              onFocus={(e) => e.target.style.borderColor = PRIMARY}
              onBlur={(e) => e.target.style.borderColor = colors.border}
            />

            <button
              type="submit"
              style={{
                padding: '12px 24px',
                background: PRIMARY,
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'opacity 0.2s ease',
                alignSelf: 'flex-start',
              }}
              onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
              onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
            >
              Send Message
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}