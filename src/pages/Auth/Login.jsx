import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const PRIMARY = '#E8622E';
const SECONDARY = '#5BADA8';

export default function Login({ setUserType }) {
  const [userType, setUserTypeLocal] = useState('tenant');
  const navigate = useNavigate();

  const loginFields = [
    { name: 'email', placeholder: 'Email', type: 'email' },
    { name: 'password', placeholder: 'Password', type: 'password' },
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    // Navigate to dashboard based on user type
    if (setUserType) {
      setUserType(userType);
    }
    if (userType === 'landlord') {
    navigate('/dashboard');
    } else {
        navigate('/dashboard');
    }
  };

  return (
    <main className="screen auth-screen">

      <div className="auth-card">
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginBottom: '20px' }}>
          <button
            onClick={() => setUserTypeLocal('tenant')}
            style={{
              padding: '8px 16px',
              border: userType === 'tenant' ? `2px solid ${PRIMARY}` : '1px solid #ddd',
              borderRadius: '6px',
              background: userType === 'tenant' ? PRIMARY : '#fff',
              color: userType === 'tenant' ? '#fff' : '#333',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '14px',
            }}
          >
            Tenant
          </button>
          <button
            onClick={() => setUserTypeLocal('landlord')}
            style={{
              padding: '8px 16px',
              border: userType === 'landlord' ? `2px solid ${PRIMARY}` : '1px solid #ddd',
              borderRadius: '6px',
              background: userType === 'landlord' ? PRIMARY : '#fff',
              color: userType === 'landlord' ? '#fff' : '#333',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '14px',
            }}
          >
            Landlord
          </button>
        </div>

        <h1 style={{ textAlign: 'center', marginBottom: '20px', fontSize: '26px', fontWeight: '700' }}>
          <span style={{ color: PRIMARY }}>Log-In</span>
          {' '}
          <span style={{ color: SECONDARY }}>
            To Your Account
          </span>
          <br />
          <strong style={{ textTransform: 'capitalize' }}>{userType}</strong>
        </h1>

        <form className="auth-form" onSubmit={handleSubmit}>
          {loginFields.map(({ name, placeholder, type }) => (
            <input key={name} name={name} type={type} placeholder={placeholder} />
          ))}

          <div style={{ textAlign: 'right', marginTop: '-8px', marginBottom: '12px' }}>
            <button
              type="button"
              onClick={() => navigate('/forgot-password')}
              style={{
                fontSize: '12px',
                color: PRIMARY,
                textDecoration: 'none',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              Forgot Password?
            </button>
          </div>

          <button type="submit" className="primary-btn" style={{ marginTop: '14px' }}>
            Login
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '16px' }}>
          <button
            onClick={() => navigate('/register')}
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
            Don't have an account? Sign Up
          </button>
        </div>
      </div>
    </main>
  );
}