import React from 'react';
import { useNavigate } from 'react-router-dom';
import dormpic1 from '../../../assets/images/dormpic1.jpg';
import dormpic2 from '../../../assets/images/dormpic2.jpg';
import dormpic3 from '../../../assets/images/dormpic3.webp';
import './Auth.css';

const PRIMARY = '#E8622E';
const SECONDARY = '#5BADA8';

export default function AuthLayout({ children }) {
    const navigate = useNavigate();

    return (
        <main className="auth-page">

            <div className="auth-left">

                <button
                    type="button"
                    onClick={() => navigate('/')}
                    className="auth-logo"
                >
                    <span style={{ color: PRIMARY }}>Dorm</span>
                    <span style={{ color: SECONDARY }}>Scout</span>
                </button>

            
                <div className="auth-photo-collage">
                    <img src={dormpic1} alt="Dormitory" className="auth-photo auth-photo--left" />
                    <img src={dormpic2} alt="Dormitory" className="auth-photo auth-photo--right" />
                    <img src={dormpic3} alt="Dormitory" className="auth-photo auth-photo--bottom" />
                </div>

                <p className="auth-tagline">
                    Your campus life starts in your{' '}
                    <span style={{ color: SECONDARY }}>dorm-</span>
                    <span style={{ color: PRIMARY, fontStyle: 'italic' }}>fort zone</span>.
                </p>
            </div>

            <div className="auth-right">
                <div className="auth-card">
                    {children}
                </div>
            </div>

        </main>
    );
}