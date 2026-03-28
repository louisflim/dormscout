import React, { useState } from 'react';

const PRIMARY = '#E8622E';
const SECONDARY = '#5BADA8';

export default function AuthScreen({ setScreen }) {
  const [userType, setUserType] = useState('tenant');
  const [authMode, setAuthMode] = useState('login');
  const [school, setSchool] = useState('');

  const isLogin = authMode === 'login';
  const schools = ['USC - Talamban', 'CIT', 'UC - Main', 'CNU'];
  const loginFields = [
    { name: 'email', placeholder: 'Email', type: 'email' },
    { name: 'password', placeholder: 'Password', type: 'password' },
  ];
  const registerFields = [
    { name: 'name', placeholder: 'Full Name', type: 'text' },
    { name: 'email', placeholder: 'Email', type: 'email' },
    { name: 'phone', placeholder: 'Phone Number', type: 'tel' },
    { name: 'password', placeholder: 'Password', type: 'password' },
  ];
  const fields = isLogin ? loginFields : registerFields;

  const handleSubmit = (e) => {
    e.preventDefault();
    // Navigate to dashboard if landlord is logging in
    if (userType === 'landlord' && isLogin) {
      setScreen('dashboard-landlord');
    }
  };

  return (
    <main className="screen auth-screen">
      
      <div className="auth-card">
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginBottom: '20px' }}>
          <button
            onClick={() => setUserType('tenant')}
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
            onClick={() => setUserType('landlord')}
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
          <span style={{ color: PRIMARY }}>{isLogin ? 'Log-In' : 'Create'}</span>
          {' '}
          <span style={{ color: SECONDARY }}>
            {isLogin ? 'To Your Account' : 'Your Account'}
          </span>
          <br />
          <strong style={{ textTransform: 'capitalize' }}>{userType}</strong>
        </h1>

        <form className="auth-form" onSubmit={handleSubmit}>
          {fields.map(({ name, placeholder, type }) => (
            <input key={name} name={name} type={type} placeholder={placeholder} />
          ))}

          {!isLogin && userType === 'tenant' && (
            <select
              value={school}
              onChange={(e) => setSchool(e.target.value)}
              style={{
                height: '46px',
                borderRadius: '12px',
                border: '1px solid rgba(0, 0, 0, 0.15)',
                padding: '0 12px',
                fontSize: '15px',
                fontFamily: 'inherit',
              }}
            >
              <option value="">Select Your School</option>
              {schools.map((schoolName) => (
                <option key={schoolName} value={schoolName}>{schoolName}</option>
              ))}
            </select>
          )}

          {isLogin && (
            <div style={{ textAlign: 'right', marginTop: '-8px', marginBottom: '12px' }}>
              <a href="#" style={{ fontSize: '12px', color: PRIMARY, textDecoration: 'none' }}>
                Forgot Password?
              </a>
            </div>
          )}

          <button type="submit" className="primary-btn" style={{ marginTop: '14px' }}>
            {isLogin ? 'Login' : 'Sign Up'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '16px' }}>
          <button
            onClick={() => setAuthMode(isLogin ? 'register' : 'login')}
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
            {isLogin ? "Don't have an account? Sign Up" : 'Already have an account? Login'}
          </button>
        </div>
      </div>
    </main>
  );
}
