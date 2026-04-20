import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import dormpic1 from '../../../assets/images/dormpic1.jpg';
import dormpic2 from '../../../assets/images/dormpic2.jpg';
import dormpic3 from '../../../assets/images/dormpic3.webp';

const PRIMARY = '#E8622E';
const SECONDARY = '#5BADA8';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'row', background: 'linear-gradient(135deg, #f5d5c0 0%, #d4ece8 100%)' }}>
      {/* Left Section - Branding */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '40px 60px', justifyContent: 'center', alignItems: 'center', position: 'relative' }}>
        <h1 style={{ fontSize: '56px', fontWeight: '800', position: 'absolute', top: '5px', left: '60px' }}><span style={{ color: PRIMARY }}>Dorm</span><span style={{ color: SECONDARY }}>Scout</span></h1>

        {/* Photo Collage - center */}
        <div style={{ position: 'relative', width: '460px', height: '420px', margin: '0 auto' }}>
          <img src={dormpic1} alt="Dorm" style={{ position: 'absolute', top: '0', left: '10px', width: '220px', height: '260px', objectFit: 'cover', borderRadius: '16px', boxShadow: '0 8px 24px rgba(0,0,0,0.2)', transform: 'rotate(-5deg)', zIndex: 2 }} />
          <img src={dormpic2} alt="Dorm" style={{ position: 'absolute', top: '0', right: '10px', width: '210px', height: '250px', objectFit: 'cover', borderRadius: '16px', boxShadow: '0 8px 24px rgba(0,0,0,0.2)', transform: 'rotate(4deg)', zIndex: 3 }} />
          <img src={dormpic3} alt="Dorm" style={{ position: 'absolute', bottom: '0', left: '50%', transform: 'translateX(-50%) rotate(-1deg)', width: '300px', height: '180px', objectFit: 'cover', borderRadius: '16px', boxShadow: '0 8px 24px rgba(0,0,0,0.2)', zIndex: 1 }} />
        </div>

        <p style={{ fontSize: '28px', fontWeight: '400', color: '#333', lineHeight: '1.4', marginTop: '24px', alignSelf: 'flex-start' }}>
          Look for the dorms <span style={{ color: SECONDARY, fontStyle: 'italic' }}>you </span><span style={{ color: PRIMARY, fontStyle: 'italic' }}>deserve.</span>
        </p>
      </div>

      {/* Right Section - Forgot Password Form */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '40px' }}>
        <div style={{ maxWidth: '400px', width: '100%' }}>
          <div style={{ backgroundColor: '#fff', borderRadius: '8px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.1), 0 0 1px rgba(0,0,0,0.1)' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '16px', textAlign: 'center' }}>
              <span style={{ color: PRIMARY }}>Forgot</span> <span style={{ color: SECONDARY }}>Password</span>
            </h2>

            {submitted ? (
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: '14px', color: '#555', marginBottom: '20px' }}>
                  If an account exists for <strong>{email}</strong>, a password reset link has been sent.
                </p>
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  style={{
                    width: '100%', padding: '14px', backgroundColor: PRIMARY, color: '#fff',
                    border: 'none', borderRadius: '6px', fontSize: '16px', fontWeight: '700', cursor: 'pointer',
                  }}
                >
                  Back to Login
                </button>
              </div>
            ) : (
              <>
                <p style={{ textAlign: 'center', fontSize: '14px', color: '#555', marginBottom: '20px' }}>
                  Enter your email address and we'll send you a link to reset your password.
                </p>
                <form onSubmit={handleSubmit}>
                  <input
                    name="email"
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    style={{
                      width: '100%', padding: '14px', marginBottom: '12px',
                      border: '1px solid #ddd', borderRadius: '6px', fontSize: '16px', fontFamily: 'inherit',
                      boxSizing: 'border-box',
                    }}
                  />
                  <button
                    type="submit"
                    style={{
                      width: '100%', padding: '14px', backgroundColor: PRIMARY, color: '#fff',
                      border: 'none', borderRadius: '6px', fontSize: '16px', fontWeight: '700', cursor: 'pointer',
                    }}
                  >
                    Send Reset Link
                  </button>
                </form>
              </>
            )}

            <hr style={{ border: 'none', borderTop: '1px solid #ddd', margin: '16px 0' }} />

            <div style={{ textAlign: 'center' }}>
              <button
                type="button"
                onClick={() => navigate('/login')}
                style={{ background: 'none', border: 'none', color: PRIMARY, cursor: 'pointer', fontSize: '14px', fontFamily: 'inherit', fontWeight: '600' }}
              >
                Back to Login
              </button>
            </div>
          </div>

        </div>
      </div>
    </main>
  );
}