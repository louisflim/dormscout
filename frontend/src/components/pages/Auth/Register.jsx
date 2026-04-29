import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { UNIVERSITY_NAMES } from '../../../constants/universities';
import AuthLayout from './AuthLayout';

const PRIMARY = '#E8622E';
const SECONDARY = '#5BADA8';

export default function Register({ setUserType }) {
    const [searchParams] = useSearchParams();
    const userType = searchParams.get('type') || 'tenant';  

    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
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

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        const firstName = formData.firstName.trim();
        const lastName = formData.lastName.trim();

        if (!firstName || !lastName) {
            setError('Please enter your first and last name');
            return;
        }
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
            firstName,
            lastName,
            email: formData.email,
            phone: formData.phone,
            password: formData.password,
            userType: userType.toUpperCase(),
            gender,
            school: userType === 'tenant' ? school : null,
        };

        try {
            const result = await register(userData);  

            if (result.success) {
                if (setUserType) setUserType(result.user.userType);
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

    const isLandlord = userType === 'landlord';
    const buttonColor = isLandlord ? SECONDARY : PRIMARY;
    const buttonIcon = isLandlord ? '🏢' : '🏠';

    return (
        <AuthLayout>
            <h2 className="auth-card-title">
                {buttonIcon}{' '}
                <span style={{ color: buttonColor }}>
                    Register as {isLandlord ? 'Landlord' : 'Student'}
                </span>
            </h2>

            <p className="auth-card-subtitle">
                {isLandlord
                    ? 'List your property and connect with students.'
                    : 'Find a dorm near your campus in minutes.'}
            </p>

            {error && <div className="auth-error">{error}</div>}

            <form onSubmit={handleSubmit} className="auth-form">
                {/* First + Last name on the same row */}
                <div style={{ display: 'flex', gap: '10px' }}>
                    <input
                        name="firstName"
                        type="text"
                        placeholder="First Name"
                        value={formData.firstName}
                        onChange={handleChange}
                        required
                        className="auth-input"
                    />
                    <input
                        name="lastName"
                        type="text"
                        placeholder="Last Name"
                        value={formData.lastName}
                        onChange={handleChange}
                        required
                        className="auth-input"
                    />
                </div>

                <input
                    name="email"
                    type="email"
                    placeholder="Email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="auth-input"
                />
                <input
                    name="phone"
                    type="tel"
                    placeholder="Phone Number"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                    className="auth-input"
                />
                <input
                    name="password"
                    type="password"
                    placeholder="Password (min. 6 characters)"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    className="auth-input"
                />

                {userType === 'tenant' && (
                    <select
                        value={school}
                        onChange={(e) => setSchool(e.target.value)}
                        className="auth-select"
                    >
                        <option value="">Select Your School</option>
                        {UNIVERSITY_NAMES.map((name) => (
                            <option key={name} value={name}>{name}</option>
                        ))}
                    </select>
                )}

                <div>
                    <label className="auth-gender-label">Gender</label>
                    <div className="auth-toggle">
                        {['Male', 'Female'].map((g) => (
                            <button
                                key={g}
                                type="button"
                                onClick={() => setGender(g)}
                                className={`auth-toggle-btn ${
                                    gender === g
                                        ? g === 'Male' ? 'active-landlord' : 'active-tenant'
                                        : ''
                                }`}
                            >
                                {g === 'Male' ? '♂ Male' : '♀ Female'}
                            </button>
                        ))}
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="auth-submit-btn"
                    style={{ backgroundColor: buttonColor }}
                >
                    {loading ? 'Creating Account...' : `${buttonIcon} Register as ${isLandlord ? 'Landlord' : 'Student'}`}
                </button>
            </form>

            <hr className="auth-divider" />

            <div className="auth-footer">
                <span className="auth-footer-text">Already have an account?</span>
                <button
                    type="button"
                    onClick={() => navigate(`/login?type=${userType}`)}
                    className="auth-link-btn"
                    style={{ color: PRIMARY, fontWeight: 600 }}
                >
                    Log In
                </button>
            </div>
        </AuthLayout>
    );
}