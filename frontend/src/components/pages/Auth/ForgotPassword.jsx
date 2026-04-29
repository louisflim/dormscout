import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthLayout from './AuthLayout';


const PRIMARY = '#E8622E';
const SECONDARY = '#5BADA8';

export default function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = (e) => {
        e.preventDefault();
        setSubmitted(true);
        // TODO: wire up to backend reset API when ready
    };

    return (
        <AuthLayout>
            <h2 className="auth-card-title">
                <span style={{ color: PRIMARY }}>Forgot</span>{' '}
                <span style={{ color: SECONDARY }}>Password?</span>
            </h2>

            
            {submitted ? (
                <div style={{ textAlign: 'center' }}>
                    <p className="auth-success-message">
                        If an account exists for <strong>{email}</strong>, a password reset link has been sent. Check your inbox.
                    </p>
                    <button
                        type="button"
                        onClick={() => navigate('/login')}
                        className="auth-submit-btn"
                        style={{ backgroundColor: PRIMARY }}
                    >
                        Back to Login
                    </button>
                </div>
            ) : (
                <>
                    <p className="auth-card-subtitle" style={{ marginBottom: '20px' }}>
                        Enter your email and we'll send you a link to reset your password.
                    </p>

                    <form onSubmit={handleSubmit} className="auth-form">
                        <input
                            name="email"
                            type="email"
                            placeholder="Your email address"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="auth-input"
                        />
                        <button
                            type="submit"
                            className="auth-submit-btn"
                            style={{ backgroundColor: PRIMARY }}
                        >
                            Send Reset Link
                        </button>
                    </form>
                </>
            )}

            <hr className="auth-divider" />

            <div className="auth-footer">
                <button
                    type="button"
                    onClick={() => navigate('/login')}
                    className="auth-link-btn"
                    style={{ color: PRIMARY, fontWeight: 600 }}
                >
                    Back to Login
                </button>
            </div>
        </AuthLayout>
    );
}