import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import dormpic1 from '../../../assets/images/dormpic1.jpg';
import dormpic2 from '../../../assets/images/dormpic2.jpg';
import dormpic3 from '../../../assets/images/dormpic3.webp';
import { useAuth } from '../../../context/AuthContext';

const PRIMARY = '#E8622E';
const SECONDARY = '#5BADA8';

export default function Homepage() {
  const navigate = useNavigate();
  const { login, user} = useAuth();

  // State to track which type is selected (default to 'tenant')
  const [selectedType, setSelectedType] = useState('tenant');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Reset state whenever component mounts (including after logout)
  useEffect(() => {
    setSelectedType('tenant');
    setEmail('');
    setPassword('');
    setError('');
    setLoading(false);
  }, []);

  // Get button styling based on selection
  const getButtonStyle = (type) => {
    const isSelected = selectedType === type;
    const color = type === 'landlord' ? SECONDARY : PRIMARY;

    return {
      flex: 1,
      padding: '10px',
      borderRadius: '6px',
      cursor: 'pointer',
      fontWeight: '600',
      fontSize: '14px',
      border: isSelected ? `2px solid ${color}` : '1px solid #ddd',
      background: isSelected ? color : '#fff',
      color: isSelected ? '#fff' : '#333',
      transition: 'all 0.2s ease',
    };
  };

  const handleLogin = (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = login(email, password);

    if (result.success) {
      // Get the ACTUAL userType from the stored account
      const users = JSON.parse(localStorage.getItem('dormScoutUsers')) || [];
      const loggedInUser = users.find(u => u.email === email && u.password === password);

      const realUserType = loggedInUser?.userType;

      // Validate: Check if user is logging in with the correct type
      if (realUserType !== selectedType) {
        setError(`This account is registered as ${realUserType}. Please login as ${realUserType}.`);
        setLoading(false);
        return;
      }

      // Save userType
      localStorage.setItem('userType', realUserType);
      navigate('/dashboard');
    } else {
      setError(result.message);
      setLoading(false);
    }
  };

  const buttonColor = selectedType === 'landlord' ? SECONDARY : PRIMARY;

  return (
    <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'row', background: 'linear-gradient(135deg, #f5d5c0 0%, #d4ece8 100%)' }}>
      {/* Left Section - Branding */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '40px 60px', justifyContent: 'center', alignItems: 'center', position: 'relative' }}>
        <h1 style={{ fontSize: '56px', fontWeight: '800', position: 'absolute', top: '5px', left: '60px' }}><span style={{ color: PRIMARY }}>Dorm</span><span style={{ color: SECONDARY }}>Scout</span></h1>

        {/* Photo Collage */}
        <div style={{ position: 'relative', width: '460px', height: '420px', margin: '0 auto' }}>
          <img src={dormpic1} alt="Dorm" style={{ position: 'absolute', top: '0', left: '10px', width: '220px', height: '260px', objectFit: 'cover', borderRadius: '16px', boxShadow: '0 8px 24px rgba(0,0,0,0.2)', transform: 'rotate(-5deg)', zIndex: 2 }} />
          <img src={dormpic2} alt="Dorm" style={{ position: 'absolute', top: '0', right: '10px', width: '210px', height: '250px', objectFit: 'cover', borderRadius: '16px', boxShadow: '0 8px 24px rgba(0,0,0,0.2)', transform: 'rotate(4deg)', zIndex: 3 }} />
          <img src={dormpic3} alt="Dorm" style={{ position: 'absolute', bottom: '0', left: '50%', transform: 'translateX(-50%) rotate(-1deg)', width: '300px', height: '180px', objectFit: 'cover', borderRadius: '16px', boxShadow: '0 8px 24px rgba(0,0,0,0.2)', zIndex: 1 }} />
        </div>

        <p style={{ fontSize: '28px', fontWeight: '400', color: '#333', lineHeight: '1.4', marginTop: '24px', alignSelf: 'flex-start' }}>
          Look for the dorms <span style={{ color: SECONDARY, fontStyle: 'italic' }}>you </span><span style={{ color: PRIMARY, fontStyle: 'italic' }}>deserve.</span>
        </p>
      </div>

      {/* Right Card */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '40px' }}>
        <div style={{ maxWidth: '400px', width: '100%' }}>
          <div style={{ backgroundColor: '#fff', borderRadius: '8px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '20px', textAlign: 'center' }}>
              Log into <span style={{ color: PRIMARY }}>Dorm</span><span style={{ color: SECONDARY }}>Scout</span>
            </h2>

            {/* User Type Toggle - Just indicator, not navigation */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
              <button
                type="button"
                onClick={() => setSelectedType('tenant')}
                style={getButtonStyle('tenant')}
              >
                🏠 Tenant
              </button>
              <button
                type="button"
                onClick={() => setSelectedType('landlord')}
                style={getButtonStyle('landlord')}
              >
                🏢 Landlord
              </button>
            </div>

            {error && (
              <div style={{
                padding: '10px',
                backgroundColor: '#fee',
                color: '#c00',
                borderRadius: '6px',
                marginBottom: '12px',
                fontSize: '14px',
                textAlign: 'center'
              }}>
                {error}
              </div>
            )}

            {/* Email and Password Fields */}
            <form onSubmit={handleLogin}>
              <input
                name="email"
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '14px',
                  marginBottom: '12px',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  fontSize: '16px',
                  fontFamily: 'inherit',
                  boxSizing: 'border-box',
                }}
              />
              <input
                name="password"
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '14px',
                  marginBottom: '16px',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  fontSize: '16px',
                  fontFamily: 'inherit',
                  boxSizing: 'border-box',
                }}
              />

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '14px',
                  backgroundColor: buttonColor,
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '16px',
                  fontWeight: '700',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.7 : 1,
                }}
              >
                {loading ? 'Logging in...' : 'Log In'}
              </button>
            </form>

            <div style={{ textAlign: 'center', marginTop: '16px' }}>
              <button
                type="button"
                onClick={() => navigate('/forgot-password')}
                style={{ background: 'none', border: 'none', color: PRIMARY, cursor: 'pointer', fontSize: '14px', fontFamily: 'inherit' }}
              >
                Forgot password?
              </button>
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid #ddd', margin: '20px 0' }} />

            {/* Create new account as hyperlink */}
            <div style={{ textAlign: 'center' }}>
              <span style={{ fontSize: '14px', color: '#666' }}>Don't have an account? </span>
              <br/>
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  navigate(`/register?type=${selectedType}`);
                }}
                style={{
                  color: SECONDARY,
                  textDecoration: 'none',
                  fontWeight: '600',
                  fontSize: '14px',
                  cursor: 'pointer',
                }}
              >
                Create new account (as {selectedType === 'landlord' ? 'Landlord' : 'Tenant'})
              </a>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}