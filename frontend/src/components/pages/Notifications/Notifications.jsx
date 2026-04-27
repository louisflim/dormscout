import React, { useState, useEffect } from 'react';
import { useBooking } from '../../../context/BookingContext';
import { useAuth } from '../../../context/AuthContext';
import { bookingsAPI, userAPI } from '../../../utils/api';
import './Notifications.css';

const PRIMARY = '#E8622E';

const NOTIF_ICONS = {
  new_booking:      '📦',
  booking_accepted: '✅',
  booking_rejected: '❌',
  booking_cancelled: '❌',
  new_message:      '💬',
  tenant_removed:   '🚫',
  verification_approved: '✔',
  verification_rejected: '⚠',
};

export default function Notifications({ darkMode = false, userType = 'tenant' }) {
  const { getNotifications, markNotificationRead, deleteNotification, clearAllNotifications, subscribeToNotifications } = useBooking();
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [dismissedIds, setDismissedIds] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(`dormscout_notif_dismissed_${userType}_${user?.id || 'anon'}`) || '[]');
    } catch (_) {
      return [];
    }
  });
  const dk = darkMode;

  const c = {
    text:          dk ? '#eaeaea'           : '#333',
    secondaryText: dk ? '#a0a0b0'           : '#666',
    cardBg:        dk ? '#16213e'           : '#fff',
    border:        dk ? '#2a2a4a'           : 'rgba(0,0,0,0.06)',
    unreadBg:      dk ? '#0f3460'           : '#fff8f0',
  };

  useEffect(() => {
    try {
      localStorage.setItem(`dormscout_notif_dismissed_${userType}_${user?.id || 'anon'}`, JSON.stringify(dismissedIds));
    } catch (_) {}
  }, [dismissedIds, userType, user?.id]);

  // Real-time notification updates
  useEffect(() => {
    const updateNotifications = async () => {
      const localNotifs = getNotifications(userType) || [];

      let bookingNotifs = [];
      let verificationNotifs = [];
      try {
        if (userType === 'landlord' && user?.id) {
          const all = await bookingsAPI.getAll();
          if (all.ok && Array.isArray(all.data)) {
            bookingNotifs = all.data
              .filter((b) => String(b.listing?.landlord?.id) === String(user.id))
              .flatMap((b) => {
                const status = String(b.status || '').toLowerCase();
                if (status === 'pending') {
                  return [{
                    id: `booking-pending-${b.id}`,
                    type: 'new_booking',
                    title: 'New Booking Request',
                    message: `${b.tenant?.firstName || 'A tenant'} requested booking for ${b.listing?.title || 'your listing'}.`,
                    createdAt: b.createdAt,
                    read: false,
                  }];
                }
                if (status === 'cancelled') {
                  return [{
                    id: `booking-cancelled-${b.id}`,
                    type: 'booking_cancelled',
                    title: 'Booking Cancelled by Tenant',
                    message: `${b.tenant?.firstName || 'A tenant'} cancelled booking for ${b.listing?.title || 'your listing'}.`,
                    createdAt: b.updatedAt || b.createdAt,
                    read: false,
                  }];
                }
                return [];
              });
          }

          const userRes = await userAPI.getById(user.id);
          const currentUser = userRes?.data || userRes;
          const vStatus = String(currentUser?.verificationStatus || '').toLowerCase();
          if (vStatus === 'approved' || vStatus === 'rejected') {
            verificationNotifs = [{
              id: `verification-status-${user.id}-${vStatus}-${currentUser?.verificationReviewedAt || currentUser?.updatedAt || ''}`,
              type: vStatus === 'approved' ? 'verification_approved' : 'verification_rejected',
              title: vStatus === 'approved' ? 'Business Verification Approved' : 'Business Verification Rejected',
              message: vStatus === 'approved'
                ? 'Your business verification request has been approved. You now have a verified badge.'
                : `Your business verification request was denied${currentUser?.verificationDecision ? `: ${currentUser.verificationDecision}` : '.'}`,
              createdAt: currentUser?.verificationReviewedAt || currentUser?.updatedAt || new Date().toISOString(),
              read: false,
            }];
          }
        }

        if (userType === 'tenant' && user?.id) {
          const mine = await bookingsAPI.getByTenant(user.id);
          if (mine.ok && Array.isArray(mine.data)) {
            bookingNotifs = mine.data
              .filter((b) => ['accepted', 'rejected', 'pending'].includes(String(b.status || '').toLowerCase()))
              .map((b) => {
                const s = String(b.status || '').toLowerCase();
                const type = s === 'accepted' ? 'booking_accepted' : s === 'rejected' ? 'booking_rejected' : 'new_booking';
                const title = s === 'accepted' ? 'Booking Accepted' : s === 'rejected' ? 'Booking Rejected' : 'Booking Pending';
                const message = s === 'accepted'
                  ? `Your booking for ${b.listing?.title || 'a listing'} was accepted.`
                  : s === 'rejected'
                    ? `Your booking for ${b.listing?.title || 'a listing'} was rejected.`
                    : `Your booking for ${b.listing?.title || 'a listing'} is pending.`;
                return {
                  id: `booking-status-${b.id}-${s}`,
                  type,
                  title,
                  message,
                  createdAt: b.updatedAt || b.createdAt,
                  read: false,
                };
              });
          }
        }
      } catch (_) {}

      const merged = [...bookingNotifs, ...verificationNotifs, ...localNotifs];
      const deduped = [];
      const seen = new Set();
      merged.forEach((n) => {
        const key = String(n.id || `${n.type}-${n.title}-${n.createdAt || ''}`);
        if (!seen.has(key) && !dismissedIds.includes(key)) {
          seen.add(key);
          deduped.push(n);
        }
      });
      setNotifications(deduped);
    };

    updateNotifications();
    const unsubscribe = subscribeToNotifications(updateNotifications);

    return () => unsubscribe();
  }, [userType, user?.id, getNotifications, subscribeToNotifications, dismissedIds]);

  const dismissNotification = (notifId) => {
    const id = String(notifId);
    setDismissedIds((prev) => (prev.includes(id) ? prev : [id, ...prev]));
  };

  const formatTime = (iso) => {
    if (!iso) return '';
    const d    = new Date(iso);
    const diff = Date.now() - d;
    if (diff < 60_000)   return 'Just now';
    if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
    if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div>
      {/* ── Header ── */}
      <div className="notif-header">
        <h3 className="notif-header__title" style={{ color: c.text }}>
          {unreadCount > 0 && (
            <span className="notif-header__badge">{unreadCount} new</span>
          )}
        </h3>

        {notifications.length > 0 && (
          <button
            className="notif-header__clear-btn"
            onClick={() => {
              clearAllNotifications(userType);
              setDismissedIds((prev) => {
                const ids = notifications.map((n) => String(n.id));
                return Array.from(new Set([...ids, ...prev]));
              });
              setNotifications([]);
            }}
            style={{ border: `1px solid ${c.border}`, color: c.secondaryText }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#dc3545';
              e.currentTarget.style.color       = '#dc3545';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = c.border;
              e.currentTarget.style.color       = c.secondaryText;
            }}
          >
            🗑 Clear All
          </button>
        )}
      </div>

      {/* ── Empty State ── */}
      {notifications.length === 0 ? (
        <div className="notif-empty" style={{ background: c.cardBg, color: c.secondaryText }}>
          <div className="notif-empty__icon">🔕</div>
          <p className="notif-empty__text">No notifications yet.</p>
        </div>
      ) : (
        /* ── Notification List ── */
        <div className="notif-list">
          {notifications.map((notif) => (
            <div
              key={notif.id}
              className="notif-card"
              style={{
                background: notif.read ? c.cardBg : c.unreadBg,
                border: `1px solid ${notif.read ? c.border : PRIMARY}`,
              }}
            >
              {/* Icon */}
              <div className="notif-card__icon">
                {NOTIF_ICONS[notif.type] || '🔔'}
              </div>

              {/* Body */}
              <div
                className={`notif-card__body ${notif.read ? 'notif-card__body--static' : 'notif-card__body--clickable'}`}
                onClick={() => {
                  if (!notif.read) {
                    markNotificationRead(notif.id);
                    dismissNotification(notif.id);
                    setNotifications(prev => prev.map(n => n.id === notif.id ? {...n, read: true} : n));
                  }
                }}
              >
                <div className="notif-card__top">
                  <h4 className="notif-card__title" style={{ color: c.text }}>
                    {notif.title}
                  </h4>
                  <span className="notif-card__time" style={{ color: c.secondaryText }}>
                    {formatTime(notif.createdAt)}
                  </span>
                </div>

                <p className="notif-card__message" style={{ color: c.secondaryText }}>
                  {notif.message}
                </p>

                {!notif.read && (
                  <span className="notif-card__read-hint">Click to mark as read</span>
                )}
              </div>

              {/* Delete */}
              <button
                className="notif-card__delete-btn"
                title="Delete notification"
                onClick={(e) => {
                  e.stopPropagation();
                  deleteNotification(notif.id);
                  dismissNotification(notif.id);
                  setNotifications(prev => prev.filter(n => n.id !== notif.id));
                }}
                style={{ color: c.secondaryText }}
                onMouseEnter={(e) => { e.currentTarget.style.color = '#dc3545'; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = c.secondaryText; }}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
