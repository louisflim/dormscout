import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

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
    <main className="screen auth-screen">
      <div className="auth-card">
        <h1 style={{ textAlign: 'center', marginBottom: '20px', fontSize: '26px', fontWeight: '700' }}>
          <span style={{ color: PRIMARY }}>Forgot</span>
          {' '}
          <span style={{ color: SECONDARY }}>Password</span>
        </h1>

        {submitted ? (
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: '14px', color: '#555', marginBottom: '20px' }}>
              If an account exists for <strong>{email}</strong>, a password reset link has been sent.
            </p>
            <button
              type="button"
              className="primary-btn"
              onClick={() => navigate('/login')}
              style={{ marginTop: '14px' }}
            >
              Back to Login
            </button>
          </div>
        ) : (
          <>
            <p style={{ textAlign: 'center', fontSize: '14px', color: '#555', marginBottom: '20px' }}>
              Enter your email address and we'll send you a link to reset your password.
            </p>
            <form className="auth-form" onSubmit={handleSubmit}>
              <input
                name="email"
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <button type="submit" className="primary-btn" style={{ marginTop: '14px' }}>
                Send Reset Link
              </button>
            </form>
          </>
        )}

        <div style={{ textAlign: 'center', marginTop: '16px' }}>
          <button
            onClick={() => navigate('/login')}
            style={{
              background: 'none',
              border: 'none',
              color: PRIMARY,
              cursor: 'pointer',
              fontSize: '14px',
              textDecoration: 'underline',
              fontWeight: '600',
            }}
          >
            Back to Login
          </button>
        </div>
      </div>
    </main>
  );
}