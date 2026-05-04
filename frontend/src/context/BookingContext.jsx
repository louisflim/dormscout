import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { bookingsAPI } from '../utils/api';

const BookingContext = createContext();

// Module-level listeners for cross-component updates
let bookingListeners      = [];
let notificationListeners = [];
let listingListeners      = [];
let settingsListeners    = [];
let messagingListeners   = [];

// eslint-disable-next-line no-unused-vars
function notifyBookingChange()      { bookingListeners.forEach(l => l());      }
function notifyNotificationChange() { notificationListeners.forEach(l => l()); }
function notifyListingChange()       { listingListeners.forEach(l => l());      }
function notifySettingsChange()     { settingsListeners.forEach(l => l());      }
function notifyMessagingChange()    { messagingListeners.forEach(l => l());    }

export function BookingProvider({ children }) {
  const [bookings,      setBookings]      = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [chatMessages,  setChatMessages]  = useState({});
  const [tenants,       setTenants]       = useState([]);
  const [loading,       setLoading]       = useState(false);

  // ── Keep bookings synced from backend so all sessions/roles see current data ──
  useEffect(() => {
    let cancelled = false;

    const mapAcceptedTenants = (allBookings) => {
      return (Array.isArray(allBookings) ? allBookings : [])
        .filter(b => {
          const status = String(b?.status || '').toLowerCase();
          return status === 'accepted' || status === 'approved' || status === 'confirmed' || status === 'active';
        })
        .map(b => ({
          id: `booking-${b.id}`,
          bookingId: b.id,
          listingId: b.listing?.id || b.listingId,
          tenantId: b.tenant?.id || b.tenantId,
          tenantName: `${b.tenant?.firstName || ''} ${b.tenant?.lastName || ''}`.trim() || b.tenantName || 'Tenant',
          tenantEmail: b.tenant?.email || b.tenantEmail,
          tenantAvatar: `${(b.tenant?.firstName || b.tenantName || 'T').charAt(0)}`.toUpperCase(),
          roomNumber: b.roomNumber || 'Assigned Room',
          moveInDate: b.moveInDate || b.checkInDate,
          status: 'active',
        }));
    };

    const loadBookings = async () => {
      const all = await bookingsAPI.getAll();
      if (cancelled) return;
      setBookings(Array.isArray(all) ? all : []);
      setTenants(mapAcceptedTenants(all));
      notifyBookingChange();
    };

    loadBookings();
    const intervalId = setInterval(loadBookings, 5000);
    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, []);

  // ── Notify listeners when notifications change ───────────
  useEffect(() => {
    notifyNotificationChange();
  }, [notifications]);

  // ── Create Booking (Tenant) ─────────────────────────────
  const createBooking = useCallback(async (listing, moveInDate, tenantInfo) => {
    setLoading(true);
    try {
      const bookingData = {
        moveInDate: moveInDate,
        status: 'pending',
      };

      const response = await bookingsAPI.create(bookingData, tenantInfo.id, listing.id);

      if (response.ok && response.data.success) {
        const newBooking = response.data.booking;

        setBookings(prev => [...prev, newBooking]);

        addNotification({
          type:      'new_booking',
          title:     'Booking Submitted',
          message:   `Your booking request for "${listing.title}" has been sent.`,
          bookingId: newBooking.id,
          listingId: listing.id,
          forRole:   'tenant',
        });

        return { success: true, booking: newBooking };
      } else {
        return { success: false, message: response.data.message || 'Booking failed' };
      }
    } catch (error) {
      console.error('Create booking error:', error);
      return { success: false, message: 'Failed to create booking' };
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Accept Booking (Landlord) ────────────────────────────
  const acceptBooking = useCallback(async (bookingId) => {
    setLoading(true);
    try {
      const response = await bookingsAPI.updateStatus(bookingId, 'accepted');

      if (response.ok && response.data.success) {
        const updatedBooking = response.data.booking;

        setBookings(prev => prev.map(b =>
          b.id === bookingId ? { ...b, status: 'accepted' } : b
        ));

        setTenants(prev => [...prev, {
          id:          `tenant-record-${Date.now()}`,
          bookingId,
          listingId:   updatedBooking.listing?.id,
          tenantId:    updatedBooking.tenant?.id,
          tenantName:  `${updatedBooking.tenant?.firstName} ${updatedBooking.tenant?.lastName}`.trim(),
          tenantEmail: updatedBooking.tenant?.email,
          roomNumber:  `Room ${Math.floor(Math.random() * 20) + 1}`,
          moveInDate:  updatedBooking.moveInDate,
          status:      'active',
        }]);

        addNotification({
          type:      'booking_accepted',
          title:     'Booking Accepted!',
          message:   `Your booking has been accepted by the landlord.`,
          bookingId,
          forRole:   'tenant',
        });

        return { success: true };
      } else {
        return { success: false, message: 'Failed to accept booking' };
      }
    } catch (error) {
      console.error('Accept booking error:', error);
      return { success: false, message: 'Failed to accept booking' };
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Reject Booking (Landlord) ────────────────────────────
  const rejectBooking = useCallback(async (bookingId) => {
    setLoading(true);
    try {
      const response = await bookingsAPI.updateStatus(bookingId, 'rejected');

      if (response.ok && response.data.success) {
        setBookings(prev => prev.map(b =>
          b.id === bookingId ? { ...b, status: 'rejected' } : b
        ));

        addNotification({
          type:      'booking_rejected',
          title:     'Booking Rejected',
          message:   `Your booking has been rejected by the landlord.`,
          bookingId,
          forRole:   'tenant',
        });

        return { success: true };
      } else {
        return { success: false, message: 'Failed to reject booking' };
      }
    } catch (error) {
      console.error('Reject booking error:', error);
      return { success: false, message: 'Failed to reject booking' };
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Cancel Booking (Tenant) ─────────────────────────────
  const cancelBooking = useCallback(async (bookingId) => {
    setLoading(true);
    try {
      const response = await bookingsAPI.delete(bookingId);

      if (response.ok && response.data.success) {
        setBookings(prev => prev.filter(b => b.id !== bookingId));
        setTenants(prev => prev.filter(t => t.bookingId !== bookingId));

        addNotification({
          type:    'booking_cancelled',
          title:   'Booking Cancelled',
          message: `You cancelled your booking.`,
          forRole: 'landlord',
        });

        return { success: true };
      } else {
        return { success: false, message: 'Failed to cancel booking' };
      }
    } catch (error) {
      console.error('Cancel booking error:', error);
      return { success: false, message: 'Failed to cancel booking' };
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Remove Tenant (Landlord) ────────────────────────────
  const removeTenant = useCallback(async (tenantRecordId) => {
    setLoading(true);
    try {
      const tenant = tenants.find(t => t.id === tenantRecordId);
      if (!tenant) return { success: false, message: 'Tenant not found' };

      if (tenant.bookingId) {
        await bookingsAPI.delete(tenant.bookingId);
      }

      setTenants(prev => prev.filter(t => t.id !== tenantRecordId));
      setBookings(prev => prev.filter(b => b.id !== tenant.bookingId));

      addNotification({
        type:    'tenant_removed',
        title:   'Tenant Removed',
        message: `You have been removed from the listing.`,
        forRole: 'tenant',
      });

      return { success: true };
    } catch (error) {
      console.error('Remove tenant error:', error);
      return { success: false, message: 'Failed to remove tenant' };
    } finally {
      setLoading(false);
    }
  }, [tenants]);

  // ── Add Notification ────────────────────────────────────
  function addNotification(notif) {
    setNotifications(prev => [{
      id:        `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      ...notif,
      read:      false,
      createdAt: new Date().toISOString(),
    }, ...prev]);
  }

  // ── Mark Read / Delete Notifications ─────────────────────
  function markNotificationRead(notifId) {
    setNotifications(prev => prev.map(n => n.id === notifId ? { ...n, read: true } : n));
  }

  function deleteNotification(notifId) {
    setNotifications(prev => prev.filter(n => n.id !== notifId));
  }

  function clearAllNotifications(role) {
    setNotifications(prev => prev.filter(n => n.forRole !== role));
  }

  // ── Send Message ─────────────────────────────────────────
  function sendMessage(conversationId, senderRole, text) {
    const msg = {
      id:        `msg-${Date.now()}`,
      sender:    senderRole,
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      createdAt: new Date().toISOString(),
    };
    setChatMessages(prev => ({
      ...prev,
      [conversationId]: [...(prev[conversationId] || []), msg],
    }));

    const otherRole = senderRole === 'tenant' ? 'landlord' : 'tenant';
    addNotification({
      type:           'new_message',
      title:          'New Message',
      message:        `"${text.substring(0, 50)}${text.length > 50 ? '...' : ''}"`,
      conversationId,
      forRole:        otherRole,
    });
  }

  // ── Subscribe Functions ──────────────────────────────────
  const subscribeToBookings = useCallback((listener) => {
    bookingListeners.push(listener);
    return () => { bookingListeners = bookingListeners.filter(l => l !== listener); };
  }, []);

  const subscribeToNotifications = useCallback((listener) => {
    notificationListeners.push(listener);
    return () => { notificationListeners = notificationListeners.filter(l => l !== listener); };
  }, []);

  const subscribeToListings = useCallback((listener) => {
    listingListeners.push(listener);
    return () => { listingListeners = listingListeners.filter(l => l !== listener); };
  }, []);

  // ── Getters ───────────────────────────────────────────────
  function getBookingsForListing(listingId) {
    return bookings.filter(b => Number(b.listing?.id || b.listingId) === Number(listingId));
  }
  function getPendingCount(listingId) {
    return bookings.filter(b =>
      Number(b.listing?.id || b.listingId) === Number(listingId) &&
      b.status === 'pending'
    ).length;
  }
  function getNotifications(role) {
    return notifications.filter(n => n.forRole === role);
  }
  function getUnreadCount(role) {
    return notifications.filter(n => n.forRole === role && !n.read).length;
  }
  function getTenantsForListing(listingId) {
    return tenants.filter(t => t.listingId === listingId);
  }

  return (
    <BookingContext.Provider value={{
      bookings,
      notifications,
      chatMessages,
      tenants,
      loading,
      createBooking,
      acceptBooking,
      rejectBooking,
      cancelBooking,
      removeTenant,
      addNotification,
      markNotificationRead,
      deleteNotification,
      clearAllNotifications,
      sendMessage,
      getBookingsForListing,
      getPendingCount,
      getNotifications,
      getUnreadCount,
      getTenantsForListing,
      subscribeToBookings,
      subscribeToNotifications,
      subscribeToListings,
      notifyListingChange,
      notifySettingsChange,
      notifyMessagingChange,
    }}>
      {children}
    </BookingContext.Provider>
  );
}

export function useBooking() {
  const ctx = useContext(BookingContext);
  if (!ctx) throw new Error('useBooking must be used within BookingProvider');
  return ctx;
}