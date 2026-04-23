import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('dormScoutUser')) || null; } catch { return null; }
  });
  const [loading, setLoading] = useState(true);

  const normalizeUser = (rawUser) => {
    if (!rawUser) return rawUser;

    const firstName = rawUser.firstName || rawUser.name?.split(' ')[0] || '';
    const lastName = rawUser.lastName || rawUser.name?.split(' ').slice(1).join(' ') || '';
    const name = rawUser.name || `${firstName} ${lastName}`.trim();

    return {
      ...rawUser,
      firstName,
      lastName,
      name,
    };
  };

  useEffect(() => {
    const storedUser = localStorage.getItem('dormScoutUser');
    if (storedUser) {
      setUser(normalizeUser(JSON.parse(storedUser)));
    }
    setLoading(false);
  }, []);

  // Broadcast user updates to other parts of the app
  useEffect(() => {
    if (user) {
      const normalizedUser = normalizeUser(user);
      try {
        localStorage.setItem('dormScoutUser', JSON.stringify(normalizedUser));

        const users = JSON.parse(localStorage.getItem('dormScoutUsers')) || [];
        const existingIndex = users.findIndex(u => u.id === normalizedUser.id || u.email === normalizedUser.email);

        if (existingIndex >= 0) {
          users[existingIndex] = { ...users[existingIndex], ...normalizedUser };
        } else {
          users.push(normalizedUser);
        }

        localStorage.setItem('dormScoutUsers', JSON.stringify(users));
      } catch (_) {}

      window.dispatchEvent(new CustomEvent('dormscout:user-updated', { detail: normalizedUser }));
    }
  }, [user]);

  // Register a new user
  const register = (userData) => {
    const users = JSON.parse(localStorage.getItem('dormScoutUsers')) || [];

    const existingUser = users.find(
      u => u.email === userData.email
    );

    if (existingUser) {
      return { success: false, message: 'Email already exists' };
    }

    const normalizedInput = normalizeUser(userData);

    const newUser = {
      id: Date.now(),
      ...normalizedInput,
      createdAt: new Date().toISOString(),
      bookings: [],
      listings: [],
      activities: [],
      settings: {
        darkMode: false,
        notifications: true,
      },
    };

    users.push(newUser);
    localStorage.setItem('dormScoutUsers', JSON.stringify(users));
    localStorage.setItem('dormScoutUser', JSON.stringify(newUser));

    localStorage.setItem('userType', userData.userType);

    setUser(newUser);

    return { success: true, message: 'Registration successful!' };
  };

  // Login user
  const login = (email, password) => {
    const users = JSON.parse(localStorage.getItem('dormScoutUsers')) || [];
    const foundUser = users.find(
      u => u.email === email && u.password === password
    );

    if (foundUser) {
      const normalizedFoundUser = normalizeUser(foundUser);
      localStorage.setItem('dormScoutUser', JSON.stringify(normalizedFoundUser));

      localStorage.setItem('userType', normalizedFoundUser.userType);

      setUser(normalizedFoundUser);
      return { success: true, message: 'Login successful!' };
    }

    return { success: false, message: 'Invalid email or password' };
  };

  // Logout user
  const logout = () => {
    localStorage.removeItem('dormScoutUser');
    localStorage.removeItem('userType');
    setUser(null);
  };

  // Delete user account
  const deleteAccount = async () => {
    const currentUser = JSON.parse(localStorage.getItem('dormScoutUser') || 'null');

    if (!currentUser) {
      return { success: false, message: 'No user logged in' };
    }

    try {
      // Remove from users list
      const users = JSON.parse(localStorage.getItem('dormScoutUsers') || '[]');
      const filteredUsers = users.filter(u => u.id !== currentUser.id);
      localStorage.setItem('dormScoutUsers', JSON.stringify(filteredUsers));

      // Clear user's bookings from shared bookings
      if (currentUser.userType === 'tenant') {
        const sharedBookings = JSON.parse(localStorage.getItem('bookings') || '[]');
        const filteredBookings = sharedBookings.filter(b =>
          String(b.tenantId) !== String(currentUser.id)
        );
        localStorage.setItem('bookings', JSON.stringify(filteredBookings));
      }

      // Clear user's dormscout bookings
      const dormscoutBookings = JSON.parse(localStorage.getItem('dormscout_bookings') || '[]');
      const filteredDormscoutBookings = dormscoutBookings.filter(b =>
        String(b.tenantId) !== String(currentUser.id)
      );
      localStorage.setItem('dormscout_bookings', JSON.stringify(filteredDormscoutBookings));

      // Clear user's notifications
      const notifications = JSON.parse(localStorage.getItem('dormscout_notifications') || '[]');
      const filteredNotifications = notifications.filter(n =>
        n.tenantId !== currentUser.id && n.forRole !== currentUser.userType
      );
      localStorage.setItem('dormscout_notifications', JSON.stringify(filteredNotifications));

      // Clear profile-specific storage
      if (currentUser.userType === 'landlord') {
        localStorage.removeItem('dormscout_landlord_profile');
      }

      // Clear user session
      localStorage.removeItem('dormScoutUser');
      localStorage.removeItem('userType');
      localStorage.removeItem('dormscout_settings');

      // Clear listings if landlord
      if (currentUser.userType === 'landlord') {
        const allListings = JSON.parse(localStorage.getItem('dormscout_listings') || '[]');
        const filteredListings = allListings.filter(l =>
          String(l.landlordId) !== String(currentUser.id)
        );
        localStorage.setItem('dormscout_listings', JSON.stringify(filteredListings));
      }

      setUser(null);

      return { success: true, message: 'Account deleted successfully' };
    } catch (error) {
      console.error('Delete account error:', error);
      return { success: false, message: 'Failed to delete account' };
    }
  };

  // Update user data
  const updateUser = (updates) => {
    setUser(prev => {
      if (!prev) return prev;

      const nextUpdates = typeof updates === 'function' ? updates(prev) : updates;

      const merged = { ...prev };
      Object.keys(nextUpdates).forEach(key => {
        const nextVal = nextUpdates[key];
        const prevVal = merged[key];

        if (Array.isArray(nextVal) && Array.isArray(prevVal)) {
          merged[key] = nextVal;
        } else {
          merged[key] = nextVal;
        }
      });

      return normalizeUser(merged);
    });
  };

  // Add activity to user's activity log
  const addActivity = (type, text, nav = null) => {
    if (!user) return;

    const newActivity = {
      id: Date.now(),
      type,
      text,
      time: 'Just now',
      nav,
      createdAt: new Date().toISOString(),
    };

    const activities = [newActivity, ...(user.activities || [])];
    const trimmedActivities = activities.slice(0, 20);

    updateUser({ activities: trimmedActivities });
  };

  // Add a listing (for landlords)
  const addListing = (listing) => {
    if (!user || user.userType !== 'landlord') return;

    const newListing = {
      id: listing.id || Date.now(),
      ...listing,
      status: 'Active',
      createdAt: new Date().toISOString(),
    };

    const listings = [newListing, ...(user.listings || [])];
    updateUser({ listings });

    addActivity('listing', `New listing "${listing.title}" created`, 'listing');

    return newListing;
  };

  // Update a listing (for landlords)
  const updateListing = (listingId, updates) => {
    if (!user || user.userType !== 'landlord') return;

    const listings = (user.listings || []).map(l =>
      l.id === listingId ? { ...l, ...updates } : l
    );
    updateUser({ listings });
  };

  // Remove a listing (for landlords)
  const removeListing = (listingId) => {
    if (!user || user.userType !== 'landlord') return;

    const listings = (user.listings || []).filter(l => l.id !== listingId);
    updateUser({ listings });

    addActivity('listing', 'Listing removed', 'listing');
  };

  // Add a booking (for tenants)
  const addBooking = (booking) => {
    if (!user || user.userType !== 'tenant') return;

    const newBooking = {
      id: booking.id || Date.now(),
      ...booking,
      status: 'pending',
      bookedAt: new Date().toISOString(),
    };

    const bookings = [newBooking, ...(user.bookings || [])];
    updateUser({ bookings });

    addActivity('booking', `Booking request sent for "${booking.dormName}"`, 'booking');

    return newBooking;
  };

  // Update booking status
  const updateBookingStatus = (bookingId, status, additionalData = {}) => {
    if (!user) return;

    const bookings = (user.bookings || []).map(b => {
      if (b.id === bookingId) {
        return { ...b, status, ...additionalData };
      }
      return b;
    });
    updateUser({ bookings });

    if (user.userType === 'tenant') {
      const booking = bookings.find(b => b.id === bookingId);
      if (status === 'accepted') {
        addActivity('booking', `Your booking for "${booking?.dormName}" was accepted!`, 'booking');
      } else if (status === 'rejected') {
        addActivity('booking', `Your booking for "${booking?.dormName}" was rejected`, 'booking');
      }
    }
  };

  // Cancel a booking
  const cancelBooking = (bookingId) => {
    if (!user || user.userType !== 'tenant') return;

    const bookings = (user.bookings || []).filter(b => b.id !== bookingId);
    updateUser({ bookings });

    addActivity('booking', 'Booking cancelled', 'booking');
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      register,
      login,
      logout,
      updateUser,
      addActivity,
      addListing,
      updateListing,
      removeListing,
      addBooking,
      updateBookingStatus,
      cancelBooking,
      deleteAccount,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};