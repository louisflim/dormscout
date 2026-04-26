import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

// --- LocalStorage Keys ---
const BOOKINGS_KEY      = 'dormscout_bookings';
const NOTIFICATIONS_KEY = 'dormscout_notifications';
const MESSAGES_KEY      = 'dormscout_chat_messages';
const TENANTS_KEY       = 'dormscout_tenants';

// --- Fallback mock data (only used when NO real user is available) ---
const MOCK_TENANT = {
  id:     'tenant-1',
  name:   'Unknown Tenant',
  email:  '',
  phone:  '',
  avatar: 'T',
  type:   'tenant',
};

const MOCK_LANDLORD = {
  id:     'landlord-1',
  name:   'Unknown Landlord',
  email:  '',
  phone:  '',
  avatar: 'L',
  type:   'landlord',
};

// --- Helpers ---
function loadJSON(key, fallback = []) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function saveJSON(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

function getRealUser() {
  try {
    return JSON.parse(localStorage.getItem('dormScoutUser') || 'null');
  } catch {
    return null;
  }
}

// --- Context ---
const BookingContext = createContext();

// Module-level listener arrays for "real-time" cross-component updates
let bookingListeners      = [];
let notificationListeners = [];
let listingListeners      = [];
let settingsListeners     = [];
let messagingListeners    = [];

function notifyBookingChange()      { bookingListeners.forEach(l => l());      }
function notifyNotificationChange() { notificationListeners.forEach(l => l()); }
function notifyListingChange()      { listingListeners.forEach(l => l());      }
function notifySettingsChange()     { settingsListeners.forEach(l => l());     }
function notifyMessagingChange()    { messagingListeners.forEach(l => l());    }

function _updateListingAvailableRooms(listingId, delta) {
  try {
    const listings = JSON.parse(localStorage.getItem('dormscout_listings') || '[]');
    const updated = listings.map(l => {
      if (String(l.id) === String(listingId)) {
        const currentRooms = parseInt(l.availableRooms) || 0;
        const newRooms = Math.max(0, currentRooms + delta);
        return { ...l, availableRooms: newRooms };
      }
      return l;
    });
    localStorage.setItem('dormscout_listings', JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('dormscout:listingsUpdated', { detail: updated }));
    notifyListingChange();
  } catch (_) { /* ignore */ }
}

export function BookingProvider({ children }) {
  const [bookings,      setBookings]      = useState(() => loadJSON(BOOKINGS_KEY));
  const [notifications, setNotifications] = useState(() => loadJSON(NOTIFICATIONS_KEY));
  const [chatMessages,  setChatMessages]  = useState(() => loadJSON(MESSAGES_KEY, {}));
  const [tenants,       setTenants]       = useState(() => loadJSON(TENANTS_KEY));
  const [currentUser,   setCurrentUser]   = useState(() => getRealUser());

  // Keep currentUser in sync with AuthContext writes
  useEffect(() => {
    function handleStorage(e) {
      if (e.key === 'dormScoutUser' || !e.key) {
        setCurrentUser(getRealUser());
      }
    }
    function handleCustomEvent(e) {
      setCurrentUser(e.detail || getRealUser());
    }

    window.addEventListener('storage', handleStorage);
    window.addEventListener('dormscout:user-updated', handleCustomEvent);
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('dormscout:user-updated', handleCustomEvent);
    };
  }, []);

  // Persist on change + notify listeners
  useEffect(() => { saveJSON(BOOKINGS_KEY,      bookings);      notifyBookingChange();      }, [bookings]);
  useEffect(() => { saveJSON(NOTIFICATIONS_KEY, notifications); notifyNotificationChange(); }, [notifications]);
  useEffect(() => { saveJSON(MESSAGES_KEY,      chatMessages);                              }, [chatMessages]);
  useEffect(() => { saveJSON(TENANTS_KEY,       tenants);                                   }, [tenants]);

  // --- Sync booking status back into the tenant's dormScoutUsers record ---
  function _syncStatusToDormScoutUsers(booking, status) {
    try {
      const users = JSON.parse(localStorage.getItem('dormScoutUsers') || '[]');
      let changed = false;

      const updatedUsers = users.map(u => {
        // Match by id or email
        if (u.id !== booking.tenantId && u.email !== booking.tenantEmail) return u;

        const updatedBookings = (u.bookings || []).map(b => {
          const sameById    = booking.id && String(b.id) === String(booking.id);
          const sameByTitle = booking.listingTitle && (b.dormName || b.title) === booking.listingTitle;
          if (sameById || sameByTitle) {
            changed = true;
            return { ...b, status };
          }
          return b;
        });
        return { ...u, bookings: updatedBookings };
      });

      if (changed) {
        localStorage.setItem('dormScoutUsers', JSON.stringify(updatedUsers));

        // Update the currently-logged-in tenant's session too
        const sessionUser = JSON.parse(localStorage.getItem('dormScoutUser') || 'null');
        if (sessionUser) {
          const updated = updatedUsers.find(u => u.id === sessionUser.id);
          if (updated) {
            localStorage.setItem('dormScoutUser', JSON.stringify(updated));
            window.dispatchEvent(new StorageEvent('storage', {
              key:        'dormScoutUser',
              newValue:   JSON.stringify(updated),
              storageArea: localStorage,
            }));
          }
        }
      }
    } catch (_) { /* ignore */ }
  }

  function _removeBookingFromDormScoutUsers(booking) {
    if (!booking) return;
    try {
      const users = JSON.parse(localStorage.getItem('dormScoutUsers') || '[]');
      let changed = false;

      const updatedUsers = users.map(u => {
        const sameUser =
          (booking.tenantId && String(u.id) === String(booking.tenantId)) ||
          (booking.tenantEmail && u.email === booking.tenantEmail);
        if (!sameUser) return u;

        const nextBookings = (u.bookings || []).filter(b => {
          const sameById = booking.id && String(b.id) === String(booking.id);
          const sameByListingId = booking.listingId && String(b.listingId) === String(booking.listingId);
          const sameByTitle = booking.listingTitle && (b.dormName || b.title) === booking.listingTitle;
          return !(sameById || sameByListingId || sameByTitle);
        });

        if (nextBookings.length !== (u.bookings || []).length) changed = true;
        return { ...u, bookings: nextBookings };
      });

      if (changed) {
        localStorage.setItem('dormScoutUsers', JSON.stringify(updatedUsers));

        const sessionUser = JSON.parse(localStorage.getItem('dormScoutUser') || 'null');
        if (sessionUser) {
          const updated = updatedUsers.find(u => u.id === sessionUser.id);
          if (updated) {
            localStorage.setItem('dormScoutUser', JSON.stringify(updated));
            window.dispatchEvent(new StorageEvent('storage', {
              key: 'dormScoutUser',
              newValue: JSON.stringify(updated),
              storageArea: localStorage,
            }));
          }
        }
      }
    } catch (_) { /* ignore */ }
  }

  function _removeFromSharedBookings(booking) {
    if (!booking) return;
    try {
      const sharedBookings = JSON.parse(localStorage.getItem('bookings') || '[]');
      const filtered = sharedBookings.filter(b => {
        const sameById = booking.id && String(b.id) === String(booking.id);
        const sameByTenant =
          (booking.tenantId && String(b.tenantId) === String(booking.tenantId)) ||
          (booking.tenantEmail && b.tenantEmail === booking.tenantEmail);
        const sameByListing =
          (booking.listingId && String(b.listingId) === String(booking.listingId)) ||
          (booking.listingTitle && (b.listingName || b.listingTitle) === booking.listingTitle);

        return !(sameById || (sameByTenant && sameByListing));
      });
      localStorage.setItem('bookings', JSON.stringify(filtered));
    } catch (_) { /* ignore */ }
  }

  // --- ADD NOTIFICATION ---
  function addNotification(notif) {
    setNotifications(prev => [{
      id:        `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      ...notif,
      read:      false,
      createdAt: new Date().toISOString(),
    }, ...prev]);
  }

  // --- CREATE BOOKING (tenant action) ---
  function createBooking(listing, moveInDate, tenantUser = null) {
    const realSessionUser = getRealUser();
    const tenantInfo = tenantUser || realSessionUser || MOCK_TENANT;

    const tenantName   = tenantInfo.name  || 'Unknown Tenant';
    const tenantEmail  = tenantInfo.email || '';
    const tenantPhone  = tenantInfo.phone || '';
    const tenantAvatar = tenantInfo.avatar || (tenantName.charAt(0).toUpperCase());

    const newBooking = {
      id:                  `booking-${Date.now()}`,
      listingId:           listing.id,
      listingTitle:        listing.title,
      listingAddress:      listing.address,
      listingPrice:        listing.price,
      listingDescription:  listing.description,
      listingImages:       listing.images || [],
      listingLat:          listing.lat,
      listingLng:          listing.lng,
      listingUniversity:   listing.university,
      listingRooms:        listing.availableRooms,
      listingTags:         listing.tags || [],
      landlordId:          listing.landlordId || null,
      tenantId:            tenantInfo.id,
      tenantName,
      tenantEmail,
      tenantPhone,
      tenantAvatar,
      moveInDate,
      status:    'pending',
      createdAt: new Date().toISOString(),
    };

    setBookings(prev => [...prev, newBooking]);

    // notification message uses the real tenant name
    addNotification({
      type:      'new_booking',
      title:     'New Booking Request',
      message:   `${tenantName} requested to book "${listing.title}" with move-in date ${moveInDate}`,
      bookingId: newBooking.id,
      listingId: listing.id,
      forRole:   'landlord',
    });

    return newBooking;
  }

  // --- ACCEPT BOOKING (landlord action) ---
  function acceptBooking(bookingId) {
    setBookings(prev => prev.map(b =>
      b.id === bookingId
        ? { ...b, status: 'accepted', acceptedAt: new Date().toISOString() }
        : b
    ));

    const booking = bookings.find(b => b.id === bookingId);
    if (booking) {
      setTenants(prev => [
        ...prev,
        {
          id:          `tenant-record-${Date.now()}`,
          bookingId,
          listingId:   booking.listingId,
          tenantId:    booking.tenantId,
          tenantName:  booking.tenantName,
          tenantEmail: booking.tenantEmail,
          tenantPhone: booking.tenantPhone,
          tenantAvatar: booking.tenantAvatar,
          roomNumber:  `Room ${Math.floor(Math.random() * 20) + 1}`,
          moveInDate:  booking.moveInDate,
          status:      'active',
        },
      ]);

      addNotification({
        type:      'booking_accepted',
        title:     'Booking Accepted!',
        message:   `Your booking for "${booking.listingTitle}" has been accepted by the landlord.`,
        bookingId,
        listingId: booking.listingId,
        forRole:   'tenant',
      });

      _syncStatusToDormScoutUsers(booking, 'accepted');

      // Write to shared 'bookings' key so BookingPage always sees the latest
      try {
        const landlordUser    = getRealUser();
        const sharedBookings  = JSON.parse(localStorage.getItem('bookings') || '[]');
        const filtered        = sharedBookings.filter(b => b.id !== bookingId);
        filtered.push({
          id:            bookingId,
          tenantId:      booking.tenantId,
          tenantName:    booking.tenantName,
          listingName:   booking.listingTitle,
          listingAddress: booking.listingAddress,
          price:         booking.listingPrice,
          status:        'Confirmed',
          bookedOn:      booking.createdAt || new Date().toISOString(),
          moveInDate:    booking.moveInDate,
          landlordId:    booking.landlordId || (landlordUser?.id || null),
          landlordName:  landlordUser?.name || 'Landlord',
          lat:           booking.listingLat,
          lng:           booking.listingLng,
          university:    booking.listingUniversity,
          tags:          booking.listingTags || [],
          description:   booking.listingDescription || '',
          listingImages: booking.listingImages || [],
        });
        localStorage.setItem('bookings', JSON.stringify(filtered));
      } catch (_) { /* ignore */ }

      _updateListingAvailableRooms(booking.listingId, -1);
    }
  }

  // --- REJECT BOOKING (landlord action) ---
  function rejectBooking(bookingId) {
    setBookings(prev => prev.map(b =>
      b.id === bookingId ? { ...b, status: 'rejected' } : b
    ));

    const booking = bookings.find(b => b.id === bookingId);
    if (booking) {
      addNotification({
        type:      'booking_rejected',
        title:     'Booking Rejected',
        message:   `Your booking for "${booking.listingTitle}" has been rejected.`,
        bookingId,
        listingId: booking.listingId,
        forRole:   'tenant',
      });

      _syncStatusToDormScoutUsers(booking, 'rejected');

      try {
        const sharedBookings = JSON.parse(localStorage.getItem('bookings') || '[]');
        const idx = sharedBookings.findIndex(b => b.id === bookingId);
        if (idx !== -1) {
          sharedBookings[idx] = { ...sharedBookings[idx], status: 'Rejected' };
          localStorage.setItem('bookings', JSON.stringify(sharedBookings));
        }
      } catch (_) { /* ignore */ }
    }
  }

  // --- CANCEL BOOKING (tenant action) ---
  function cancelBooking(bookingId, reason, moveOutDate) {
    const booking = bookings.find(b => b.id === bookingId);
    setBookings(prev => prev.filter(b => b.id !== bookingId));
    setTenants(prev => prev.filter(t => t.bookingId !== bookingId));

    if (booking) {
      const reasonSuffix   = reason    ? ` Reason: ${reason}`          : '';
      const moveOutSuffix  = moveOutDate ? ` Move-out: ${moveOutDate}` : '';

      addNotification({
        type:      'booking_cancelled',
        title:     'Booking Cancelled',
        message:   `${booking.tenantName} cancelled their booking for "${booking.listingTitle}".${reasonSuffix}${moveOutSuffix}`,
        bookingId,
        listingId: booking.listingId,
        forRole:   'landlord',
      });
      addNotification({
        type:      'booking_cancelled',
        title:     'Booking Cancelled',
        message:   `You cancelled your booking for "${booking.listingTitle}".${reasonSuffix}`,
        bookingId,
        listingId: booking.listingId,
        forRole:   'tenant',
      });

      _updateListingAvailableRooms(booking.listingId, +1);
      _removeFromSharedBookings(booking);
      _removeBookingFromDormScoutUsers(booking);
    }
  }

  // --- REMOVE TENANT (landlord action) ---
  function removeTenant(tenantRecordId, reason, moveOutDate) {
    const tenantRecord = tenants.find(t => t.id === tenantRecordId);
    setTenants(prev => prev.filter(t => t.id !== tenantRecordId));

    if (tenantRecord) {
      const booking = bookings.find(b => b.id === tenantRecord.bookingId);
      setBookings(prev => prev.filter(b => b.id !== tenantRecord.bookingId));

      const reasonSuffix  = reason     ? ` Reason: ${reason}`               : '';
      const moveOutSuffix = moveOutDate ? ` Move-out date: ${moveOutDate}`   : '';

      addNotification({
        type:    'tenant_removed',
        title:   'Tenant Removed',
        message: `You have been removed from the listing.${reasonSuffix}${moveOutSuffix}`,
        forRole: 'tenant',
      });
      addNotification({
        type:    'tenant_removed',
        title:   'Tenant Removed',
        message: `You removed ${tenantRecord.tenantName} from the listing.${reasonSuffix}${moveOutSuffix}`,
        forRole: 'landlord',
      });

      _updateListingAvailableRooms(tenantRecord.listingId, +1);
      _removeFromSharedBookings(booking);
      _removeBookingFromDormScoutUsers(booking);
    }
  }

  // --- DELETE REJECTED BOOKING ---
  function deleteRejectedBooking(bookingId) {
    setBookings(prev => prev.filter(b => b.id !== bookingId));
  }

  // --- MARK NOTIFICATION READ ---
  function markNotificationRead(notifId) {
    setNotifications(prev =>
      prev.map(n => (n.id === notifId ? { ...n, read: true } : n))
    );
  }

  // --- DELETE NOTIFICATION ---
  function deleteNotification(notifId) {
    setNotifications(prev => prev.filter(n => n.id !== notifId));
  }

  // --- CLEAR ALL NOTIFICATIONS ---
  function clearAllNotifications(role) {
    setNotifications(prev => prev.filter(n => n.forRole !== role));
  }

  // --- SEND CHAT MESSAGE ---
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
      message:        `New message: "${text.substring(0, 50)}${text.length > 50 ? '...' : ''}"`,
      conversationId,
      forRole:        otherRole,
    });
  }

  // --- SUBSCRIBE FUNCTIONS ---
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

  const subscribeToSettings = useCallback((listener) => {
    settingsListeners.push(listener);
    return () => { settingsListeners = settingsListeners.filter(l => l !== listener); };
  }, []);

  const subscribeToMessaging = useCallback((listener) => {
    messagingListeners.push(listener);
    return () => { messagingListeners = messagingListeners.filter(l => l !== listener); };
  }, []);

  // --- HELPERS ---
  function getBookingsForListing(listingId) {
    return bookings.filter(b => String(b.listingId) === String(listingId));
  }
  function getPendingCount(listingId) {
    return bookings.filter(b => b.listingId === listingId && b.status === 'pending').length;
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
      currentUser,
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
      subscribeToSettings,
      subscribeToMessaging,
      notifyListingChange,
      notifySettingsChange,
      notifyMessagingChange,
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