import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('dormScoutUser')) || null; } catch { return null; }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('dormScoutUser');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  // Broadcast user updates to other parts of the app
  useEffect(() => {
    if (user) {
      try {
        localStorage.setItem('dormScoutUser', JSON.stringify(user));
      } catch (_) {}
      // Emit custom event so BookingContext and other components react
      window.dispatchEvent(new CustomEvent('dormscout:user-updated', { detail: user }));
    }
  }, [user]);

  // Register a new user
  const register = (userData) => {
    const users = JSON.parse(localStorage.getItem('dormScoutUsers')) || [];

    const existingUser = users.find(
      u => u.email === userData.email || u.name === userData.name
    );

    if (existingUser) {
      return { success: false, message: 'Email or name already exists' };
    }

    const newUser = {
      id: Date.now(),
      ...userData,
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

    // Also save userType separately for easy access
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
      localStorage.setItem('dormScoutUser', JSON.stringify(foundUser));

      // Also save userType separately for easy access
      localStorage.setItem('userType', foundUser.userType);

      setUser(foundUser);
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

  // Update user data - smartly merges nested arrays like listings, bookings, messages
  const updateUser = (updates) => {
    setUser(prev => {
      if (!prev) return prev;

      // If updates is a function, call it with prev
      const nextUpdates = typeof updates === 'function' ? updates(prev) : updates;

      // Smart merge for nested arrays
      const merged = { ...prev };
      Object.keys(nextUpdates).forEach(key => {
        const nextVal = nextUpdates[key];
        const prevVal = merged[key];

        // If it's an array, merge intelligently
        if (Array.isArray(nextVal) && Array.isArray(prevVal)) {
          // For listings, bookings, activities - replace but preserve new items
          merged[key] = nextVal;
        } else {
          merged[key] = nextVal;
        }
      });

      return merged;
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
      id: Date.now(),
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
      id: Date.now(),
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