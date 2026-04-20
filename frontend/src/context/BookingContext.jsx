import React, { createContext, useContext, useState, useEffect } from 'react';

// --- LocalStorage Keys ---
const BOOKINGS_KEY = 'dormscout_bookings';
const NOTIFICATIONS_KEY = 'dormscout_notifications';
const MESSAGES_KEY = 'dormscout_chat_messages';
const TENANTS_KEY = 'dormscout_tenants';

// --- Mock current user data ---
const MOCK_TENANT = {
  id: 'tenant-1',
  name: 'Juan Dela Cruz',
  email: 'juan@email.com',
  phone: '0917-123-4567',
  avatar: 'JD',
  type: 'tenant',
};

const MOCK_LANDLORD = {
  id: 'landlord-1',
  name: 'Rosa Macaraeg',
  email: 'rosa@email.com',
  phone: '0918-987-6543',
  avatar: 'RM',
  type: 'landlord',
};

// --- Helper to load/save from localStorage ---
function loadJSON(key, fallback = []) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch { return fallback; }
}
function saveJSON(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

// --- Context ---
const BookingContext = createContext();

export function BookingProvider({ children }) {
  const [bookings, setBookings] = useState(() => loadJSON(BOOKINGS_KEY));
  const [notifications, setNotifications] = useState(() => loadJSON(NOTIFICATIONS_KEY));
  const [chatMessages, setChatMessages] = useState(() => loadJSON(MESSAGES_KEY, {}));
  const [tenants, setTenants] = useState(() => loadJSON(TENANTS_KEY));

  // Persist to localStorage on change
  useEffect(() => { saveJSON(BOOKINGS_KEY, bookings); }, [bookings]);
  useEffect(() => { saveJSON(NOTIFICATIONS_KEY, notifications); }, [notifications]);
  useEffect(() => { saveJSON(MESSAGES_KEY, chatMessages); }, [chatMessages]);
  useEffect(() => { saveJSON(TENANTS_KEY, tenants); }, [tenants]);

  // --- CREATE BOOKING (tenant action) ---
  function createBooking(listing, moveInDate) {
    const newBooking = {
      id: `booking-${Date.now()}`,
      listingId: listing.id,
      listingTitle: listing.title,
      listingAddress: listing.address,
      listingPrice: listing.price,
      listingDescription: listing.description,
      listingImages: listing.images || [],
      listingLat: listing.lat,
      listingLng: listing.lng,
      listingUniversity: listing.university,
      listingRooms: listing.availableRooms,
      listingTags: listing.tags || [],
      tenantId: MOCK_TENANT.id,
      tenantName: MOCK_TENANT.name,
      tenantEmail: MOCK_TENANT.email,
      tenantPhone: MOCK_TENANT.phone,
      tenantAvatar: MOCK_TENANT.avatar,
      moveInDate,
      status: 'pending', // pending | accepted | rejected
      createdAt: new Date().toISOString(),
    };
    setBookings(prev => [...prev, newBooking]);

    // Add notification for landlord
    addNotification({
      type: 'new_booking',
      title: 'New Booking Request',
      message: `${MOCK_TENANT.name} requested to book "${listing.title}" with move-in date ${moveInDate}`,
      bookingId: newBooking.id,
      listingId: listing.id,
      forRole: 'landlord',
    });

    return newBooking;
  }

  // --- ACCEPT BOOKING (landlord action) ---
  function acceptBooking(bookingId) {
    setBookings(prev => prev.map(b =>
      b.id === bookingId ? { ...b, status: 'accepted' } : b
    ));

    const booking = bookings.find(b => b.id === bookingId);
    if (booking) {
      // Add tenant to the listing's tenant list
      setTenants(prev => [...prev, {
        id: `tenant-record-${Date.now()}`,
        bookingId,
        listingId: booking.listingId,
        tenantId: booking.tenantId,
        tenantName: booking.tenantName,
        tenantEmail: booking.tenantEmail,
        tenantPhone: booking.tenantPhone,
        tenantAvatar: booking.tenantAvatar,
        roomNumber: `Room ${Math.floor(Math.random() * 20) + 1}`,
        moveInDate: booking.moveInDate,
        status: 'active',
      }]);

      // Notify tenant
      addNotification({
        type: 'booking_accepted',
        title: 'Booking Accepted!',
        message: `Your booking for "${booking.listingTitle}" has been accepted by the landlord.`,
        bookingId,
        listingId: booking.listingId,
        forRole: 'tenant',
      });
    }
  }

  // --- CANCEL BOOKING (tenant action) — removes tenant record + notifies both ---
  function cancelBooking(bookingId, reason, moveOutDate) {
    const booking = bookings.find(b => b.id === bookingId);
    setBookings(prev => prev.filter(b => b.id !== bookingId));
    setTenants(prev => prev.filter(t => t.bookingId !== bookingId));

    if (booking) {
      addNotification({
        type: 'booking_cancelled',
        title: 'Booking Cancelled',
        message: `${booking.tenantName} cancelled their booking for "${booking.listingTitle}".${reason ? ` Reason: ${reason}` : ''}${moveOutDate ? ` Move-out: ${moveOutDate}` : ''}`,
        bookingId,
        listingId: booking.listingId,
        forRole: 'landlord',
      });
      addNotification({
        type: 'booking_cancelled',
        title: 'Booking Cancelled',
        message: `You cancelled your booking for "${booking.listingTitle}".${reason ? ` Reason: ${reason}` : ''}`,
        bookingId,
        listingId: booking.listingId,
        forRole: 'tenant',
      });
    }
  }

  // --- REMOVE TENANT (landlord action) ---
  function removeTenant(tenantRecordId, reason, moveOutDate) {
    const tenantRecord = tenants.find(t => t.id === tenantRecordId);
    setTenants(prev => prev.filter(t => t.id !== tenantRecordId));

    if (tenantRecord) {
      // Remove the booking from context entirely
      setBookings(prev => prev.filter(b => b.id !== tenantRecord.bookingId));

      // Also remove the listing from tenant's dormscout_my_bookings localStorage
      try {
        const raw = localStorage.getItem('dormscout_my_bookings');
        const myBookings = raw ? JSON.parse(raw) : [];
        localStorage.setItem('dormscout_my_bookings', JSON.stringify(
          myBookings.filter(b => b.id !== tenantRecord.listingId)
        ));
      } catch (e) { /* ignore */ }
      addNotification({
        type: 'tenant_removed',
        title: 'Tenant Removed',
        message: `You have been removed from "${tenantRecord.listingId}".${reason ? ` Reason: ${reason}` : ''}${moveOutDate ? ` Move-out date: ${moveOutDate}` : ''}`,
        forRole: 'tenant',
      });
      addNotification({
        type: 'tenant_removed',
        title: 'Tenant Removed',
        message: `You removed ${tenantRecord.tenantName} from the listing.${reason ? ` Reason: ${reason}` : ''}${moveOutDate ? ` Move-out date: ${moveOutDate}` : ''}`,
        forRole: 'landlord',
      });
    }
  }

  // --- DELETE REJECTED BOOKING (landlord action — dismiss from list) ---
  function deleteRejectedBooking(bookingId) {
    setBookings(prev => prev.filter(b => b.id !== bookingId));
  }

  // --- REJECT BOOKING (landlord action) ---
  function rejectBooking(bookingId) {
    setBookings(prev => prev.map(b =>
      b.id === bookingId ? { ...b, status: 'rejected' } : b
    ));

    const booking = bookings.find(b => b.id === bookingId);
    if (booking) {
      addNotification({
        type: 'booking_rejected',
        title: 'Booking Rejected',
        message: `Your booking for "${booking.listingTitle}" has been rejected.`,
        bookingId,
        listingId: booking.listingId,
        forRole: 'tenant',
      });
    }
  }

  // --- ADD NOTIFICATION ---
  function addNotification(notif) {
    setNotifications(prev => [{
      id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      ...notif,
      read: false,
      createdAt: new Date().toISOString(),
    }, ...prev]);
  }

  // --- MARK NOTIFICATION READ ---
  function markNotificationRead(notifId) {
    setNotifications(prev => prev.map(n =>
      n.id === notifId ? { ...n, read: true } : n
    ));
  }

  // --- DELETE NOTIFICATION ---
  function deleteNotification(notifId) {
    setNotifications(prev => prev.filter(n => n.id !== notifId));
  }

  // --- CLEAR ALL NOTIFICATIONS (for a role) ---
  function clearAllNotifications(role) {
    setNotifications(prev => prev.filter(n => n.forRole !== role));
  }

  // --- SEND CHAT MESSAGE ---
  function sendMessage(conversationId, senderRole, text) {
    const msg = {
      id: `msg-${Date.now()}`,
      sender: senderRole, // 'tenant' or 'landlord'
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      createdAt: new Date().toISOString(),
    };
    setChatMessages(prev => ({
      ...prev,
      [conversationId]: [...(prev[conversationId] || []), msg],
    }));

    // Notify the other party
    const otherRole = senderRole === 'tenant' ? 'landlord' : 'tenant';
    addNotification({
      type: 'new_message',
      title: 'New Message',
      message: `New message: "${text.substring(0, 50)}${text.length > 50 ? '...' : ''}"`,
      conversationId,
      forRole: otherRole,
    });
  }

  // --- HELPER: get bookings for a listing ---
  function getBookingsForListing(listingId) {
    return bookings.filter(b => b.listingId === listingId);
  }

  // --- HELPER: get pending count for a listing ---
  function getPendingCount(listingId) {
    return bookings.filter(b => b.listingId === listingId && b.status === 'pending').length;
  }

  // --- HELPER: get notifications for a role ---
  function getNotifications(role) {
    return notifications.filter(n => n.forRole === role);
  }

  function getUnreadCount(role) {
    return notifications.filter(n => n.forRole === role && !n.read).length;
  }

  // --- HELPER: get tenants for a listing ---
  function getTenantsForListing(listingId) {
    return tenants.filter(t => t.listingId === listingId);
  }

  return (
    <BookingContext.Provider value={{
      bookings,
      notifications,
      chatMessages,
      tenants,
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
      MOCK_TENANT,
      MOCK_LANDLORD,
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
