import React, { createContext, useContext, useState, useCallback } from 'react';
import { userAPI } from '../utils/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [userType, setUserType] = useState(null);
    const [loading, setLoading] = useState(false);

    const login = useCallback(async (email, password) => {
        try {
            setLoading(true);
            console.log('🔄 AuthContext: Starting login...');

            const result = await userAPI.login(email, password);
            console.log('📦 AuthContext: Login result:', result);

            if (result.success) {
                const userData = result.user;

                console.log('✅ AuthContext: Login successful');
                console.log('📦 userData:', userData);
                console.log('📦 userData.userType:', userData?.userType);

                setUser(userData);
                setUserType(userData.userType);

                return { success: true, user: userData };
            } else {
                return { success: false, message: result.message };
            }
        } catch (error) {
            console.error('❌ AuthContext: Login error:', error);
            return { success: false, message: 'Connection error. Please try again.' };
        } finally {
            setLoading(false);
        }
    }, []);

    const register = useCallback(async (userData) => {
        try {
            setLoading(true);
            console.log('🔄 AuthContext: Starting register...');

            const result = await userAPI.register(userData);
            console.log('📦 AuthContext: Register result:', result);

            if (result.success) {
                const newUser = result.user;

                console.log('✅ AuthContext: Registration successful');
                console.log('📦 newUser:', newUser);
                console.log('📦 newUser.userType:', newUser?.userType);

                setUser(newUser);
                setUserType(newUser.userType);

                return { success: true, user: newUser };
            } else {
                return { success: false, message: result.message };
            }
        } catch (error) {
            console.error('❌ AuthContext: Register error:', error);
            return { success: false, message: 'Connection error. Please try again.' };
        } finally {
            setLoading(false);
        }
    }, []);

    const logout = useCallback(() => {
        setUser(null);
        setUserType(null);
    }, []);

    return (
        <AuthContext.Provider value={{
            user,
            userType,
            login,
            register,
            logout,
            loading,
            setUser,
            setUserType
        }}>
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