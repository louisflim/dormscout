import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Moon, Sun } from 'lucide-react';
import dormpic1 from '../../../assets/images/dormpic1.jpg';
import dormpic2 from '../../../assets/images/dormpic2.jpg';
import dormpic3 from '../../../assets/images/dormpic3.webp';
import './Auth.css';

const PRIMARY = '#E8622E';
const SECONDARY = '#5BADA8';

export default function AuthLayout({ children, darkMode = false, setDarkMode }) {
    const navigate = useNavigate();

    return (
        <main className="auth-page">
            {typeof setDarkMode === 'function' && (
                <div
                    style={{
                        position: 'fixed',
                        top: '16px',
                        right: '20px',
                        zIndex: 2000,
                    }}
                >
                    <button
                        type="button"
                        onClick={() => setDarkMode(!darkMode)}
                        aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
                        title={darkMode ? 'Dark mode is on (left). Click for light mode.' : 'Light mode is on (right). Click for dark mode.'}
                        style={{
                            width: '96px',
                            height: '40px',
                            borderRadius: '999px',
                            border: '1px solid var(--border-soft)',
                            background: darkMode
                                ? 'linear-gradient(120deg, #1f2937 0%, #0f172a 100%)'
                                : 'linear-gradient(120deg, #f8fafc 0%, #e5e7eb 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '0 10px',
                            cursor: 'pointer',
                            position: 'relative',
                            boxShadow: darkMode
                                ? '0 6px 16px rgba(2,6,23,0.45)'
                                : '0 6px 14px rgba(15,23,42,0.18)',
                            transition: 'background 280ms cubic-bezier(0.22, 1, 0.36, 1), box-shadow 280ms cubic-bezier(0.22, 1, 0.36, 1)',
                        }}
                    >
                        <span style={{ opacity: darkMode ? 1 : 0.4, display: 'flex', alignItems: 'center' }}>
                            <Moon size={13} color={darkMode ? '#cbd5e1' : '#64748b'} />
                        </span>
                        <span style={{ opacity: darkMode ? 0.4 : 1, display: 'flex', alignItems: 'center' }}>
                            <Sun size={13} color={darkMode ? '#94a3b8' : '#f59e0b'} />
                        </span>
                        <span
                            aria-hidden="true"
                            style={{
                                position: 'absolute',
                                top: '3px',
                                left: darkMode ? '3px' : '59px',
                                width: '34px',
                                height: '34px',
                                borderRadius: '50%',
                                background: darkMode ? '#E8622E' : '#5BADA8',
                                border: darkMode ? '1px solid rgba(232,98,46,0.65)' : '1px solid rgba(91,173,168,0.65)',
                                boxShadow: darkMode
                                    ? '0 3px 10px rgba(232,98,46,0.45)'
                                    : '0 3px 10px rgba(91,173,168,0.45)',
                                transition: 'left 280ms cubic-bezier(0.22, 1, 0.36, 1), background 280ms cubic-bezier(0.22, 1, 0.36, 1), box-shadow 280ms cubic-bezier(0.22, 1, 0.36, 1), border-color 280ms cubic-bezier(0.22, 1, 0.36, 1)',
                            }}
                        />
                    </button>
                </div>
            )}

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