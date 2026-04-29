import React from 'react';
import { useNavigate } from 'react-router-dom';
import AuthLayout from '../Auth/AuthLayout';

import {
  MapPin,
  BadgeCheck,
  MessageCircle,
  ClipboardList,
} from 'lucide-react';

const FEATURE_ICON = {
  location: (c) => <MapPin size={16} color={c} />,
  verified: (c) => <BadgeCheck size={16} color={c} />,
  message: (c) => <MessageCircle size={16} color={c} />,
  booking: (c) => <ClipboardList size={16} color={c} />,
};



const PRIMARY = '#E8622E';
const SECONDARY = '#5BADA8';

export default function Homepage() {
    const navigate = useNavigate();

    return (
        <AuthLayout>
            <h2 className="auth-card-title">
                Find your dorm near{' '}
                <span style={{ color: PRIMARY }}>campus</span>
            </h2>

            <p className="auth-card-subtitle">
                Browse verified dorms close to your university.
            </p>

        
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
            {[
                { key: 'location', text: 'Dorms mapped near your university' },
                { key: 'verified', text: 'Verified listings from real landlords' },
                { key: 'message', text: 'Message landlords directly' },
                { key: 'booking', text: 'Book and track your application' },
            ].map(({ key, text }) => (
                <div
                key={text}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    fontSize: '13px',
                    color: '#333',
                    padding: '8px 12px',
                    background: '#FAFAFA',
                    borderRadius: '8px',
                }}
                >
                <span style={{ display: 'flex', alignItems: 'center' }}>
                    {FEATURE_ICON[key](SECONDARY)}
                </span>
                {text}
                </div>
            ))}
            </div>

        
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <button
                    type="button"
                    onClick={() => navigate('/login')}
                    className="auth-submit-btn"
                    style={{ backgroundColor: PRIMARY }}
                >
                    Log In
                </button>

                <button
                    type="button"
                    onClick={() => navigate('/register?type=tenant')}
                    className="auth-submit-btn"
                    style={{
                        backgroundColor: '#fff',
                        color: SECONDARY,
                        border: `2px solid ${SECONDARY}`,
                    }}
                >
                    Create Student Account
                </button>

                <button
                    type="button"
                    onClick={() => navigate('/register?type=landlord')}
                    className="auth-link-btn"
                    style={{
                        color: '#888',
                        textAlign: 'center',
                        marginTop: '4px',
                        fontSize: '13px',
                    }}
                >
                    Are you a landlord? Register here →
                </button>
            </div>
        </AuthLayout>
    );
}