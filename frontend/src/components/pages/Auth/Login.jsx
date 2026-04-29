import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import AuthLayout from './AuthLayout';  

const PRIMARY = '#E8622E';
const SECONDARY = '#5BADA8';

export default function Login() {
    const navigate = useNavigate();
    const { login } = useAuth();  

    const [selectedType, setSelectedType] = useState('tenant');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        setEmail('');
        setPassword('');
        setError('');
        setLoading(false);
        setSelectedType('tenant');
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const result = await login(email, password);  

            if (result.success) {
                const realUserType = result.user.userType;

                if (realUserType.toUpperCase() !== selectedType.toUpperCase()) {
                    setError(
                        `This account is registered as ${realUserType.toLowerCase()}. Please login as ${realUserType.toLowerCase()}.`
                    );
                    setLoading(false);
                    return;
                }

                localStorage.setItem('userType', realUserType);
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

    const isLandlord = selectedType === 'landlord';
    const buttonColor = isLandlord ? SECONDARY : PRIMARY;

    return (
        <AuthLayout>
            <h2 className="auth-card-title">
                Welcome back to{' '}
                <span style={{ color: PRIMARY }}>Dorm</span>
                <span style={{ color: SECONDARY }}>Scout</span>
            </h2>

            <p className="auth-card-subtitle">
                Log in to find your next place near campus.
            </p>

            <div className="auth-toggle">
                <button
                    type="button"
                    onClick={() => setSelectedType('tenant')}
                    className={`auth-toggle-btn ${selectedType === 'tenant' ? 'active-tenant' : ''}`}
                >
                    🏠 Tenant
                </button>
                <button
                    type="button"
                    onClick={() => setSelectedType('landlord')}
                    className={`auth-toggle-btn ${selectedType === 'landlord' ? 'active-landlord' : ''}`}
                >
                    🏢 Landlord
                </button>
            </div>

            {error && <div className="auth-error">{error}</div>}

            <form onSubmit={handleSubmit} className="auth-form">
                <input
                    name="email"
                    type="email"
                    placeholder="University email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="auth-input"
                />
                <input
                    name="password"
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="auth-input"
                />
                <button
                    type="submit"
                    disabled={loading}
                    className="auth-submit-btn"
                    style={{ backgroundColor: buttonColor }}
                >
                    {loading ? 'Logging in...' : 'Log In'}
                </button>
            </form>

            <div style={{ textAlign: 'center', marginTop: '14px' }}>
                <button
                    type="button"
                    onClick={() => navigate('/forgot-password')}
                    className="auth-link-btn"
                    style={{ color: PRIMARY }}
                >
                    Forgot password?
                </button>
            </div>

            <hr className="auth-divider" />

            <div className="auth-footer">
                <span className="auth-footer-text">Don't have an account?</span>
                <button
                    type="button"
                    onClick={() => navigate(`/register?type=${selectedType}`)}
                    className="auth-link-btn"
                    style={{ color: SECONDARY, fontWeight: 600 }}
                >
                    Create account as {isLandlord ? 'Landlord' : 'Tenant'}
                </button>
            </div>
        </AuthLayout>
    );
}