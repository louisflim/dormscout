import React, { createContext, useContext, useState, useCallback } from 'react';
import { userAPI } from '../utils/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [userType, setUserType] = useState(null);
    const [loading, setLoading] = useState(false);

<<<<<<< Updated upstream
    const login = useCallback(async (email, password) => {
=======
    // Check for existing user on app load
    useEffect(() => {
        const storedUser = localStorage.getItem('dormScoutUser') || localStorage.getItem('user');
        const storedUserType = localStorage.getItem('userType');

        if (storedUser) {
            setUser(JSON.parse(storedUser));
            setUserType(storedUserType);
        }
        setLoading(false);
    }, []);

    const login = async (email, password) => {
>>>>>>> Stashed changes
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

<<<<<<< Updated upstream
=======
                // Save to localStorage
                localStorage.setItem('user', JSON.stringify(userData));
                localStorage.setItem('dormScoutUser', JSON.stringify(userData));
                localStorage.setItem('userType', userData.userType);

>>>>>>> Stashed changes
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

<<<<<<< Updated upstream
=======
                // Save to localStorage
                localStorage.setItem('user', JSON.stringify(newUser));
                localStorage.setItem('dormScoutUser', JSON.stringify(newUser));
                localStorage.setItem('userType', newUser.userType);

>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
    }, []);
=======
        localStorage.removeItem('user');
        localStorage.removeItem('dormScoutUser');
        localStorage.removeItem('userType');
    };
>>>>>>> Stashed changes

    const addBooking = (bookingData) => {
        setUser((prev) => {
            if (!prev) return prev;
            const next = {
                ...prev,
                bookings: [bookingData, ...(prev.bookings || [])],
            };
            localStorage.setItem('user', JSON.stringify(next));
            localStorage.setItem('dormScoutUser', JSON.stringify(next));
            return next;
        });
    };

    const updateBookingStatus = () => ({ success: true });
    const addActivity = () => ({ success: true });

    const updateUser = async (updates) => {
        if (!user?.id) return { success: false, message: 'User not found' };
        try {
            const result = await userAPI.update(user.id, updates);
            if (result.ok) {
                const nextUser = { ...user, ...(result.data || updates) };
                setUser(nextUser);
                localStorage.setItem('user', JSON.stringify(nextUser));
                localStorage.setItem('dormScoutUser', JSON.stringify(nextUser));
                return { success: true, user: nextUser };
            }
            return { success: false, message: result.message || 'Update failed' };
        } catch (error) {
            console.error('Update user error:', error);
            return { success: false, message: 'Connection error. Please try again.' };
        }
    };

    const deleteAccount = async () => {
        if (!user?.id) return { success: false, message: 'User not found' };
        try {
            const result = await userAPI.delete(user.id);
            if (result.ok) {
                logout();
                return { success: true };
            }
            return { success: false, message: result.message || 'Delete failed' };
        } catch (error) {
            console.error('Delete account error:', error);
            return { success: false, message: 'Connection error. Please try again.' };
        }
    };

    return (
<<<<<<< Updated upstream
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
=======
        <AuthContext.Provider
            value={{
                user,
                userType,
                login,
                register,
                logout,
                loading,
                addBooking,
                updateBookingStatus,
                addActivity,
                updateUser,
                deleteAccount,
            }}
        >
>>>>>>> Stashed changes
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