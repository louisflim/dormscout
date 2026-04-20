import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import dormpic1 from '../../../assets/images/dormpic1.jpg';
import dormpic2 from '../../../assets/images/dormpic2.jpg';
import dormpic3 from '../../../assets/images/dormpic3.webp';

const PRIMARY = '#E8622E';
const SECONDARY = '#5BADA8';

export default function Login({ setUserType }) {
  const [userType, setUserTypeLocal] = useState('tenant');
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (setUserType) {
      setUserType(userType);
    }
    navigate('/dashboard');
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

      {/* Right Card */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '40px' }}>
        <div style={{ maxWidth: '400px', width: '100%' }}>
          <div style={{ backgroundColor: '#fff', borderRadius: '8px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.1), 0 0 1px rgba(0,0,0,0.1)' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '20px', color: '#1c1e21', textAlign: 'center' }}>
              Log into <span style={{ color: PRIMARY }}>Dorm</span><span style={{ color: SECONDARY }}>Scout</span>
            </h2>

            {/* User Type Toggle */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
              <button
                type="button"
                onClick={() => setUserTypeLocal('tenant')}
                style={{
                  flex: 1, padding: '10px', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '14px',
                  border: userType === 'tenant' ? `2px solid ${PRIMARY}` : '1px solid #ddd',
                  background: userType === 'tenant' ? `${PRIMARY}15` : '#fff',
                  color: userType === 'tenant' ? PRIMARY : '#333',
                }}
              >                Tenant
              </button>
              <button
                type="button"
                onClick={() => setUserTypeLocal('landlord')}
                style={{
                  flex: 1, padding: '10px', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '14px',
                  border: userType === 'landlord' ? `2px solid ${SECONDARY}` : '1px solid #ddd',
                  background: userType === 'landlord' ? `${SECONDARY}15` : '#fff',
                  color: userType === 'landlord' ? SECONDARY : '#333',
                }}
              >                Landlord
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <input
                name="email"
                type="email"
                placeholder="Email"
                style={{
                  width: '100%', padding: '14px', marginBottom: '12px',
                  border: '1px solid #ddd', borderRadius: '6px', fontSize: '16px', fontFamily: 'inherit',
                  boxSizing: 'border-box',
                }}
              />
              <input
                name="password"
                type="password"
                placeholder="Password"
                style={{
                  width: '100%', padding: '14px', marginBottom: '16px',
                  border: '1px solid #ddd', borderRadius: '6px', fontSize: '16px', fontFamily: 'inherit',
                  boxSizing: 'border-box',
                }}
              />

              <button
                type="submit"
                style={{
                  width: '100%', padding: '14px', backgroundColor: PRIMARY, color: '#fff',
                  border: 'none', borderRadius: '6px', fontSize: '18px', fontWeight: '700', cursor: 'pointer',
                }}
              >
                Log In
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

            <div style={{ textAlign: 'center' }}>
              <button
                onClick={() => navigate('/register')}
                style={{
                  padding: '12px 24px', backgroundColor: SECONDARY, color: '#fff',
                  border: 'none', borderRadius: '6px', fontSize: '16px', fontWeight: '700', cursor: 'pointer',
                }}
              >
                Create new account
              </button>
            </div>
          </div>
        </div>

      </div>
    </main>
  );
}


