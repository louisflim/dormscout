import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import dormpic1 from '../../../assets/images/dormpic1.jpg';
import dormpic2 from '../../../assets/images/dormpic2.jpg';
import dormpic3 from '../../../assets/images/dormpic3.webp';
import { useAuth } from '../../../context/AuthContext';

const PRIMARY = '#E8622E';
const SECONDARY = '#5BADA8';

export default function Register({ setUserType }) {
  // Get userType from URL parameter - THIS IS LOCKED
  const [searchParams] = useSearchParams();
  const urlUserType = searchParams.get('type') || 'tenant';

  // userType is LOCKED based on URL - cannot be changed
  const userType = urlUserType;

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
  });
  const [school, setSchool] = useState('');
  const [gender, setGender] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const schools = [
    'Asian College of Technology',
    'Cebu Institute of Technology - University',
    'Cebu Normal University',
    'Cebu Technological University',
    "Saint Theresa's College",
    'Southwestern University PHINMA',
    'University of Cebu - Banilad',
    'University of Cebu - Main',
    'University of Cebu - METC',
    'University of the Philippines Cebu',
    'University of San Carlos - Downtown',
    'University of San Carlos - Talamban',
    'University of San Jose-Recoletos - Basak',
    'University of San Jose-Recoletos - Main',
    'University of the Visayas',
  ];

  const registerFields = [
    { name: 'name', placeholder: 'Full Name', type: 'text' },
    { name: 'email', placeholder: 'Email', type: 'email' },
    { name: 'phone', placeholder: 'Phone Number', type: 'tel' },
    { name: 'password', placeholder: 'Password', type: 'password' },
  ];

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (userType === 'tenant' && !school) {
      setError('Please select your school');
      return;
    }

    if (!gender) {
      setError('Please select your gender');
      return;
    }

    setLoading(true);

    const userData = {
      ...formData,
      userType,  // This is LOCKED from URL parameter
      gender,
      school: userType === 'tenant' ? school : null,
    };

    const result = register(userData);

    if (result.success) {
      localStorage.setItem('userType', userType);

      if (setUserType) {
        setUserType(userType);
      }

      navigate('/overview');
    } else {
      setError(result.message);
      setLoading(false);
    }
  };

  // Get colors based on userType
  const buttonColor = userType === 'landlord' ? SECONDARY : PRIMARY;
  const buttonIcon = userType === 'landlord' ? '🏢' : '🏠';

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

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '40px' }}>
        <div style={{ maxWidth: '400px', width: '100%' }}>
          <div style={{ backgroundColor: '#fff', borderRadius: '8px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.1), 0 0 1px rgba(0,0,0,0.1)' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '16px', color: '#1c1e21', textAlign: 'center', fontFamily: 'inherit' }}>
              {buttonIcon} <span style={{ color: buttonColor }}>Register as {userType === 'landlord' ? 'Landlord' : 'Tenant'}</span>
            </h2>

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
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {registerFields.map(({ name, placeholder, type }) => (
                <input
                  key={name}
                  name={name}
                  type={type}
                  placeholder={placeholder}
                  value={formData[name]}
                  onChange={handleChange}
                  required
                  style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '14px', fontFamily: 'inherit', boxSizing: 'border-box' }}
                />
              ))}

              {/* School dropdown - ONLY shows for Tenants */}
              {userType === 'tenant' && (
                <select
                  value={school}
                  onChange={(e) => setSchool(e.target.value)}
                  style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '14px', fontFamily: 'inherit', boxSizing: 'border-box', backgroundColor: '#fff' }}
                >
                  <option value="">Select Your School</option>
                  {schools.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              )}

              <div>
                <label style={{ fontSize: '13px', color: '#666', marginBottom: '6px', display: 'block', fontWeight: '600' }}>Gender</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {['Male', 'Female'].map((g) => (
                    <button key={g} type="button" onClick={() => setGender(g)} style={{ flex: 1, padding: '10px', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '13px', border: gender === g ? `2px solid ${g === 'Male' ? SECONDARY : PRIMARY}` : '1px solid #ddd', background: gender === g ? `${g === 'Male' ? SECONDARY : PRIMARY}15` : '#fff', color: gender === g ? (g === 'Male' ? SECONDARY : PRIMARY) : '#333' }}>{g}</button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{ width: '100%', padding: '14px', backgroundColor: buttonColor, color: '#fff', border: 'none', borderRadius: '6px', fontSize: '16px', fontWeight: '700', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, marginTop: '4px' }}
              >
                {loading ? 'Creating Account...' : `${buttonIcon} Register as ${userType === 'landlord' ? 'Landlord' : 'Tenant'}`}
              </button>
            </form>

            <hr style={{ border: 'none', borderTop: '1px solid #ddd', margin: '16px 0' }} />

            <div style={{ textAlign: 'center' }}>
              <button type="button" onClick={() => navigate(`/homepage?type=${userType}`)} style={{ background: 'none', border: 'none', color: PRIMARY, cursor: 'pointer', fontSize: '14px', fontFamily: 'inherit', fontWeight: '600' }}>
                Already have a {userType} account? Log In
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}