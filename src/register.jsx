import React, { useState } from 'react';

const PRIMARY = '#E8622E';
const SECONDARY = '#5BADA8';

export default function Register({ setScreen }) {
  const [userType, setUserType] = useState('tenant');
  const [school, setSchool] = useState('');

  const schools = ['USC - Talamban', 'CIT', 'UC - Main', 'CNU'];
  const registerFields = [
    { name: 'name', placeholder: 'Full Name', type: 'text' },
    { name: 'email', placeholder: 'Email', type: 'email' },
    { name: 'phone', placeholder: 'Phone Number', type: 'tel' },
    { name: 'password', placeholder: 'Password', type: 'password' },
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    // Navigate to dashboard based on user type
    if (userType === 'landlord') {
      setScreen('dashboard-landlord');
    } else if (userType === 'tenant') {
      setScreen('dashboard-tenant');
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
          <span style={{ color: PRIMARY }}>Create</span>
          {' '}
          <span style={{ color: SECONDARY }}>
            Your Account
          </span>
          <br />
          <strong style={{ textTransform: 'capitalize' }}>{userType}</strong>
        </h1>

        <form className="auth-form" onSubmit={handleSubmit}>
          {registerFields.map(({ name, placeholder, type }) => (
            <input key={name} name={name} type={type} placeholder={placeholder} />
          ))}

          {userType === 'tenant' && (
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

          <button type="submit" className="primary-btn" style={{ marginTop: '14px' }}>
            Sign Up
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '16px' }}>
          <button
            onClick={() => setScreen('auth')}
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
            Already have an account? Login
          </button>
        </div>
      </div>
    </main>
  );
}