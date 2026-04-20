import React from 'react';
import { useNavigate } from 'react-router-dom';
import dormpic1 from '../../../assets/images/dormpic1.jpg';
import dormpic2 from '../../../assets/images/dormpic2.jpg';
import dormpic3 from '../../../assets/images/dormpic3.webp';

const PRIMARY = '#E8622E';
const SECONDARY = '#5BADA8';

export default function Homepage() {
  const navigate = useNavigate();

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
          <div style={{ backgroundColor: '#fff', borderRadius: '8px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '20px', textAlign: 'center' }}>
              Join <span style={{ color: PRIMARY }}>Dorm</span><span style={{ color: SECONDARY }}>Scout</span>
            </h2>

            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <button
                onClick={() => navigate('/login')}
                style={{ background: 'none', border: 'none', color: PRIMARY, cursor: 'pointer', fontSize: '14px', fontFamily: 'inherit', fontWeight: '600' }}
              >
                Already have an account? Log In
              </button>
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid #ddd', margin: '0 0 20px 0' }} />

            <div style={{ textAlign: 'center' }}>
              <button
                onClick={() => navigate('/register')}
                style={{
                  width: '100%',
                  padding: '14px',
                  backgroundColor: SECONDARY,
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '16px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  marginBottom: '12px',
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


