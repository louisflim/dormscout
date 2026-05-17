import React, { createContext, useContext, useState, useCallback } from 'react';
import { userAPI } from '../utils/api';

const AuthContext = createContext(null);

function readStoredUser() {
    try {
        const raw = sessionStorage.getItem('authUser');
        return raw ? JSON.parse(raw) : null;
    } catch (_) {
        return null;
    }
}

export function AuthProvider({ children }) {
    const [user, setUser] = useState(() => readStoredUser());
    const [userType, setUserType] = useState(() => {
        const stored = readStoredUser();
        return stored?.userType || localStorage.getItem('userType') || null;
    });
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
                sessionStorage.setItem('authUser', JSON.stringify(userData));
                localStorage.setItem('userType', userData.userType || '');

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
                sessionStorage.setItem('authUser', JSON.stringify(newUser));
                localStorage.setItem('userType', newUser.userType || '');

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
        sessionStorage.removeItem('authUser');
        sessionStorage.removeItem('token');
        localStorage.removeItem('userType');
    }, []);

    const updateUser = useCallback(async (userData) => {
        try {
            if (!user || !user.id) {
                console.error('❌ AuthContext: No user or user ID available for update');
                return { success: false, message: 'No user logged in' };
            }

            setLoading(true);
            console.log('🔄 AuthContext: Starting updateUser...');

            const result = await userAPI.updateUser(user.id, userData);
            console.log('📦 AuthContext: updateUser result:', result);

            if (!result || result.success === false) {
                return {
                    success: false,
                    message: result?.message || 'Update failed',
                };
            }

            const updatedUser = {
                ...user,
                ...result,
                profileImage:
                    result.profileImage !== undefined && result.profileImage !== null
                        ? result.profileImage
                        : userData.profileImage !== undefined
                            ? userData.profileImage
                            : user.profileImage,
                phone: result.phone ?? userData.phone ?? userData.phoneNumber ?? user.phone,
                phoneNumber: result.phone ?? userData.phoneNumber ?? userData.phone ?? user.phoneNumber,
                school: result.school ?? userData.school ?? userData.university ?? user.school,
                university: result.school ?? userData.university ?? userData.school ?? user.university,
                settings: result.settings ?? userData.settings ?? user.settings,
            };

            setUser(updatedUser);
            sessionStorage.setItem('authUser', JSON.stringify(updatedUser));
            localStorage.setItem('userType', updatedUser.userType || userType || '');

            return { success: true, user: updatedUser };
        } catch (error) {
            console.error('❌ AuthContext: updateUser error:', error);
            return { success: false, message: 'Connection error. Please try again.' };
        } finally {
            setLoading(false);
        }
    }, [user, userType]);

    const deleteAccount = useCallback(async () => {
        try {
            if (!user?.id) {
                return { success: false, message: 'No user logged in' };
            }

            const result = await userAPI.deleteUser(user.id);
            if (result?.success === false) {
                return { success: false, message: result.message || 'Failed to delete account' };
            }

            setUser(null);
            setUserType(null);
            sessionStorage.removeItem('authUser');
            sessionStorage.removeItem('token');
            localStorage.removeItem('userType');

            return { success: true };
        } catch (error) {
            console.error('❌ AuthContext: deleteAccount error:', error);
            return { success: false, message: 'Connection error. Please try again.' };
        }
    }, [user?.id]);

    return (
        <AuthContext.Provider value={{
            user,
            userType,
            login,
            register,
            logout,
            updateUser,
            deleteAccount,
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