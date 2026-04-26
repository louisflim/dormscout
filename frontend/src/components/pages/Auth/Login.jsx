import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import dormpic1 from '../../../assets/images/dormpic1.jpg';
import dormpic2 from '../../../assets/images/dormpic2.jpg';
import dormpic3 from '../../../assets/images/dormpic3.webp';
import { useAuth } from '../../../context/AuthContext';

const PRIMARY = '#E8622E';
const SECONDARY = '#5BADA8';

export default function Login({ setUserType }) {
    const [searchParams] = useSearchParams();
    const urlUserType = searchParams.get('type') || 'tenant';

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const result = await login(email, password);

            if (result.success) {
                const realUserType = result.user.userType;

                // Validate userType matches the login page
                if (realUserType && realUserType.toUpperCase() !== urlUserType.toUpperCase()) {
                    setError(
                        `This account is registered as a ${realUserType.toLowerCase()}. Please use the ${realUserType.toLowerCase()} login page.`
                    );
                    setLoading(false);
                    return;
                }

                if (setUserType) setUserType(realUserType);
                navigate('/overview');
            } else {
                setError(result.message);
                setLoading(false);
            }
        } catch (err) {
            setError('Something went wrong. Please try again.');
            setLoading(false);
        }
    };

    const buttonLabel = urlUserType === 'landlord' ? 'Landlord' : 'Tenant';
    const buttonColor = urlUserType === 'landlord' ? SECONDARY : PRIMARY;

    return (
        <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'row', background: 'linear-gradient(135deg, #f5d5c0 0%, #d4ece8 100%)' }}>
            {/* Left — Branding */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '40px 60px', justifyContent: 'center', alignItems: 'center', position: 'relative' }}>
                <button type="button" onClick={() => navigate('/')} style={{ fontSize: '56px', fontWeight: '800', position: 'absolute', top: '5px', left: '60px', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                    <span style={{ color: PRIMARY }}>Dorm</span><span style={{ color: SECONDARY }}>Scout</span>
                </button>

                <div style={{ position: 'relative', width: '460px', height: '420px', margin: '0 auto' }}>
                    <img src={dormpic1} alt="Dorm" style={{ position: 'absolute', top: '0', left: '10px', width: '220px', height: '260px', objectFit: 'cover', borderRadius: '16px', boxShadow: '0 8px 24px rgba(0,0,0,0.2)', transform: 'rotate(-5deg)', zIndex: 2 }} />
                    <img src={dormpic2} alt="Dorm" style={{ position: 'absolute', top: '0', right: '10px', width: '210px', height: '250px', objectFit: 'cover', borderRadius: '16px', boxShadow: '0 8px 24px rgba(0,0,0,0.2)', transform: 'rotate(4deg)', zIndex: 3 }} />
                    <img src={dormpic3} alt="Dorm" style={{ position: 'absolute', bottom: '0', left: '50%', transform: 'translateX(-50%) rotate(-1deg)', width: '300px', height: '180px', objectFit: 'cover', borderRadius: '16px', boxShadow: '0 8px 24px rgba(0,0,0,0.2)', zIndex: 1 }} />
                </div>

                <p style={{ fontSize: '28px', fontWeight: '400', color: '#333', lineHeight: '1.4', marginTop: '24px', alignSelf: 'flex-start' }}>
                    Look for the dorms <span style={{ color: SECONDARY, fontStyle: 'italic' }}>you </span><span style={{ color: PRIMARY, fontStyle: 'italic' }}>deserve.</span>
                </p>
            </div>

            {/* Right — Login Card */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '40px' }}>
                <div style={{ maxWidth: '400px', width: '100%' }}>
                    <div style={{ backgroundColor: '#fff', borderRadius: '8px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.1), 0 0 1px rgba(0,0,0,0.1)' }}>
                        <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '20px', color: '#1c1e21', textAlign: 'center' }}>
                            <span style={{ color: buttonColor }}>{buttonLabel}</span> Login
                        </h2>

                        {error && (
                            <div style={{ padding: '10px', backgroundColor: '#fee', color: '#c00', borderRadius: '6px', marginBottom: '12px', fontSize: '14px', textAlign: 'center' }}>
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit}>
                            <input name="email" type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required style={{ width: '100%', padding: '14px', marginBottom: '12px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '16px', fontFamily: 'inherit', boxSizing: 'border-box' }} />
                            <input name="password" type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required style={{ width: '100%', padding: '14px', marginBottom: '16px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '16px', fontFamily: 'inherit', boxSizing: 'border-box' }} />
                            <button type="submit" disabled={loading} style={{ width: '100%', padding: '14px', backgroundColor: buttonColor, color: '#fff', border: 'none', borderRadius: '6px', fontSize: '18px', fontWeight: '700', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}>
                                {loading ? 'Logging in...' : 'Log In'}
                            </button>
                        </form>

                        <div style={{ textAlign: 'center', marginTop: '16px' }}>
                            <button type="button" onClick={() => navigate('/forgot-password')} style={{ background: 'none', border: 'none', color: PRIMARY, cursor: 'pointer', fontSize: '14px', fontFamily: 'inherit' }}>Forgot password?</button>
                        </div>

                        <hr style={{ border: 'none', borderTop: '1px solid #ddd', margin: '20px 0' }} />

                        <div style={{ textAlign: 'center' }}>
                            <button onClick={() => navigate(`/register?type=${urlUserType}`)} style={{ padding: '12px 24px', backgroundColor: buttonColor, color: '#fff', border: 'none', borderRadius: '6px', fontSize: '16px', fontWeight: '700', cursor: 'pointer' }}>
                                Create new {buttonLabel} account
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}