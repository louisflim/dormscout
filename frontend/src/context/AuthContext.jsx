import React, { createContext, useContext, useState, useEffect } from 'react';
import { userAPI } from '../utils/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [userType, setUserType] = useState(null);
    const [loading, setLoading] = useState(true);

    // Check for existing user on app load
    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        const storedUserType = localStorage.getItem('userType');

        if (storedUser) {
            setUser(JSON.parse(storedUser));
            setUserType(storedUserType);
        }
        setLoading(false);
    }, []);

    const login = async (email, password) => {
        try {
            const result = await userAPI.login(email, password);

            if (result.success) {
                const userData = result.user;
                setUser(userData);
                setUserType(userData.userType);

                // Save to localStorage
                localStorage.setItem('user', JSON.stringify(userData));
                localStorage.setItem('userType', userData.userType);

                return { success: true, user: userData };
            } else {
                return { success: false, message: result.message };
            }
        } catch (error) {
            console.error('Login error:', error);
            return { success: false, message: 'Connection error. Please try again.' };
        }
    };

    const register = async (userData) => {
        try {
            const result = await userAPI.register(userData);

            if (result.success) {
                const newUser = result.user;
                setUser(newUser);
                setUserType(newUser.userType);

                // Save to localStorage
                localStorage.setItem('user', JSON.stringify(newUser));
                localStorage.setItem('userType', newUser.userType);

                return { success: true, user: newUser };
            } else {
                return { success: false, message: result.message };
            }
        } catch (error) {
            console.error('Registration error:', error);
            return { success: false, message: 'Connection error. Please try again.' };
        }
    };

    const logout = () => {
        setUser(null);
        setUserType(null);
        localStorage.removeItem('user');
        localStorage.removeItem('userType');
    };

    return (
        <AuthContext.Provider value={{ user, userType, login, register, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
}