import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { bookingsAPI, listingsAPI } from '../utils/api';

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
  const [listings,      setListings]      = useState([]);
  const [loading,       setLoading]       = useState(false);

  const normalizeBooking = useCallback((booking) => {
    if (!booking) return booking;
    const tenantFirst = booking.tenant?.firstName || '';
    const tenantLast = booking.tenant?.lastName || '';
    const tenantName = `${tenantFirst} ${tenantLast}`.trim();
    return {
      ...booking,
      listingId: booking.listingId ?? booking.listing?.id ?? null,
      listingTitle: booking.listingTitle ?? booking.listing?.title ?? booking.dormName ?? '',
      tenantId: booking.tenantId ?? booking.tenant?.id ?? null,
      tenantName: booking.tenantName ?? tenantName ?? booking.tenant?.name ?? 'Tenant',
      tenantEmail: booking.tenantEmail ?? booking.tenant?.email ?? '',
      tenantPhone: booking.tenantPhone ?? booking.tenant?.phone ?? '',
      moveInDate: booking.moveInDate ?? booking.checkInDate ?? null,
    };
  }, []);

  useEffect(() => {
    localStorage.removeItem('dormscout_bookings');
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const result = await bookingsAPI.getAll();
        if (!mounted || !result.ok) return;
        const rows = Array.isArray(result.data) ? result.data : [];
        setBookings(rows.map(normalizeBooking));
      } catch (_) {
        // keep empty state if backend is unavailable
      }
    })();
    return () => { mounted = false; };
  }, [normalizeBooking]);

  // ── Persist notifications ─────────────────────────────────
  useEffect(() => {
    notifyNotificationChange();
  }, [notifications]);

  useEffect(() => {
    notifyBookingChange();
  }, [bookings]);

  // ── Helper: Update listing available rooms ──────────────
  const _updateListingAvailableRooms = useCallback(async (listingId, delta) => {
    try {
      const listing = listings.find(l => l.id === listingId) ||
                      (await listingsAPI.getById(listingId)).data;

      if (listing) {
        const currentRooms = parseInt(listing.availableRooms) || 0;
        const newRooms = Math.max(0, currentRooms + delta);

        await listingsAPI.update(listingId, { availableRooms: newRooms });
        setListings(prev => prev.map(l =>
          l.id === listingId ? { ...l, availableRooms: newRooms } : l
        ));
        notifyListingChange();
      }
    } catch (_) { /* ignore */ }
  }, [listings]);

  // ── Create Booking (Tenant) ─────────────────────────────
  const createBooking = useCallback(async (listing, moveInDate, tenantInfo) => {
    setLoading(true);
    try {
      const bookingData = {
        checkInDate: moveInDate,
        status: 'pending',
      };

      const response = await bookingsAPI.create(bookingData, tenantInfo.id, listing.id);

      const created = response.data?.booking || response.data;
      if (response.ok && created) {
        const newBooking = normalizeBooking(created);

        setBookings(prev => [newBooking, ...prev]);

        addNotification({
          type:      'new_booking',
          title:     'New Booking Request',
          message:   `A tenant requested a booking for "${listing.title}".`,
          bookingId: newBooking.id,
          listingId: listing.id,
          forRole:   'landlord',
        });

        addNotification({
          type:      'new_booking',
          title:     'Booking Submitted',
          message:   `Your booking request for "${listing.title}" has been sent.`,
          bookingId: newBooking.id,
          listingId: listing.id,
          forRole:   'tenant',
        });

        await _updateListingAvailableRooms(listing.id, -1);

        return { success: true, booking: newBooking };
      } else {
        return { success: false, message: response.data?.message || response.message || 'Booking failed' };
      }
    } catch (error) {
      console.error('Create booking error:', error);
      return { success: false, message: 'Failed to create booking' };
    } finally {
      setLoading(false);
    }
  }, [_updateListingAvailableRooms, normalizeBooking]);

  // ── Accept Booking (Landlord) ────────────────────────────
  const acceptBooking = useCallback(async (bookingId) => {
    setLoading(true);
    try {
      const response = await bookingsAPI.updateStatus(bookingId, 'accepted');

      if (response.ok && response.data.success) {
        const updatedBooking = response.data.booking;

        setBookings(prev => prev.map(b =>
          b.id === bookingId ? normalizeBooking({ ...b, ...updatedBooking, status: 'accepted' }) : b
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
  }, [normalizeBooking]);

  // ── Reject Booking (Landlord) ────────────────────────────
  const rejectBooking = useCallback(async (bookingId) => {
    setLoading(true);
    try {
      const response = await bookingsAPI.updateStatus(bookingId, 'rejected');

      if (response.ok && response.data.success) {
        const updatedBooking = response.data.booking;
        setBookings(prev => prev.map(b =>
          b.id === bookingId ? normalizeBooking({ ...b, ...updatedBooking, status: 'rejected' }) : b
        ));

        // Restore available rooms
        const booking = bookings.find(b => b.id === bookingId);
        if (booking?.listing?.id) {
          await _updateListingAvailableRooms(booking.listing.id, +1);
        }

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
  }, [bookings, _updateListingAvailableRooms, normalizeBooking]);

  // ── Cancel Booking (Tenant) ─────────────────────────────
  const cancelBooking = useCallback(async (bookingId) => {
    setLoading(true);
    try {
      const response = await bookingsAPI.updateStatus(bookingId, 'cancelled');

      if (response.ok && response.data.success) {
        const booking = bookings.find(b => b.id === bookingId);
        const updatedBooking = response.data.booking;

        setBookings(prev => prev.map(b =>
          b.id === bookingId ? normalizeBooking({ ...b, ...updatedBooking, status: 'cancelled' }) : b
        ));
        setTenants(prev => prev.filter(t => t.bookingId !== bookingId));

        if (booking?.listing?.id) {
          await _updateListingAvailableRooms(booking.listing.id, +1);
        }

        addNotification({
          type:    'booking_cancelled',
          title:   'Booking Cancelled by Tenant',
          message: `${booking?.tenantName || 'A tenant'} cancelled booking for ${booking?.listingTitle || booking?.listing?.title || 'your listing'}.`,
          forRole: 'landlord',
          bookingId,
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
  }, [bookings, _updateListingAvailableRooms, normalizeBooking]);

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

      if (tenant.listingId) {
        await _updateListingAvailableRooms(tenant.listingId, +1);
      }

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
  }, [tenants, _updateListingAvailableRooms]);

  function deleteRejectedBooking(bookingId) {
    setBookings(prev => prev.filter(b => !(String(b.id) === String(bookingId) && String(b.status || '').toLowerCase() === 'rejected')));
  }

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
    return bookings.filter(b => String(b.listing?.id ?? b.listingId) === String(listingId));
  }
  function getPendingCount(listingId) {
    return bookings.filter(b =>
      String(b.listing?.id ?? b.listingId) === String(listingId) &&
      String(b.status || '').toLowerCase() === 'pending'
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
      deleteRejectedBooking,
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