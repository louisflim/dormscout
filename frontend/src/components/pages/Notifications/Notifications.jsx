import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { activitiesAPI } from '../../../utils/api';
import { normalizeActivitiesResponse } from '../../../utils/activities';
import './Notifications.css';

import{
  BellOff,
  Package,
  CheckCircle,
  XCircle,
  MessageCircle,
  UserX,
} from 'lucide-react';
const PRIMARY = '#E8622E';

const NOTIF_ICONS = {
  new_booking:       <Package size={20} className="icon-primary" />,
  booking_accepted:  <CheckCircle size={20} className="icon-success" />,
  booking_rejected:  <XCircle size={20} className="icon-danger" />,
  booking_cancelled: <XCircle size={20} className="icon-muted" />,
  new_message:       <MessageCircle size={20} className="icon-info" />,
  tenant_removed:    <UserX size={20} className="icon-warning" />,
};

const TYPE_TITLES = {
  new_booking:       'New Booking',
  booking_accepted:  'Booking Accepted',
  booking_rejected:  'Booking Rejected',
  booking_cancelled: 'Booking Cancelled',
  new_message:       'New Message',
  tenant_removed:    'Tenant Removed',
};

export default function Notifications({ darkMode = false, userType = 'tenant' }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const dk = darkMode;
  const inAppNotificationsEnabled = user?.settings?.inAppNotifications !== false;

  const c = {
    text:          dk ? '#eaeaea'           : '#333',
    secondaryText: dk ? '#a0a0b0'           : '#666',
    cardBg:        dk ? '#16213e'           : '#fff',
    border:        dk ? '#2a2a4a'           : 'rgba(0,0,0,0.06)',
    unreadBg:      dk ? '#0f3460'           : '#fff8f0',
  };

  const loadNotifications = useCallback(() => {
    if (!user?.id || !inAppNotificationsEnabled) {
      setNotifications([]);
      return;
    }
    activitiesAPI.getActivitiesByUser(user.id)
      .then(response => {
        const acts = normalizeActivitiesResponse(response);

        setNotifications(acts.map((a) => ({
          id: a.id,
          type: a.type || 'general',
          title: TYPE_TITLES[a.type] || a.title || 'Notification',
          message: a.text || a.message || '',
          read: Boolean(a.read ?? a.isRead),
          createdAt: a.createdAt,
        })));
      })
      .catch(() => {
        // Avoid stale cards when request fails.
        setNotifications([]);
      });
  }, [user?.id, inAppNotificationsEnabled]);

  useEffect(() => {
    if (!inAppNotificationsEnabled) {
      setNotifications([]);
      return undefined;
    }

    loadNotifications();
    const interval = setInterval(loadNotifications, 10000);
    return () => clearInterval(interval);
  }, [loadNotifications, inAppNotificationsEnabled]);

  const markAsRead = async (id) => {
    await activitiesAPI.markAsRead(id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    window.dispatchEvent(new Event('dormscout:notificationsUpdated'));
  };

  const deleteNotif = async (id) => {
    await activitiesAPI.deleteActivity(id);
    setNotifications(prev => prev.filter(n => n.id !== id));
    window.dispatchEvent(new Event('dormscout:notificationsUpdated'));
  };

  const clearAll = async () => {
    await Promise.all(notifications.map(n => activitiesAPI.deleteActivity(n.id)));
    setNotifications([]);
    window.dispatchEvent(new Event('dormscout:notificationsUpdated'));
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

  return (
    <div>
      {!inAppNotificationsEnabled ? (
        <div 
          className="notif-empty" 
          style={{ background: c.cardBg, color: c.secondaryText }}
        >
          <div className="notif-empty__icon">
            <BellOff size={36} strokeWidth={1.5} />
          </div>
          <p className="notif-empty__text">
            In-app notifications are turned off in Settings.
          </p>
        </div>
      ) : (
        <>
      {/* ── Header ── */}
      <div className="notif-header">

        {notifications.length > 0 && (
          <button
            className="notif-header__clear-btn"
            onClick={clearAll}
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
        <div 
          className="notif-empty" 
          style={{ background: c.cardBg, color: c.secondaryText }}
        >
          <div className="notif-empty__icon">
            <BellOff size={36} strokeWidth={1.5} />
          </div>
          <p className="notif-empty__text">
            No notifications yet.
          </p>
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
                onClick={() => { if (!notif.read) markAsRead(notif.id); }}
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
                onClick={(e) => { e.stopPropagation(); deleteNotif(notif.id); }}
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
        </>
      )}
    </div>
  );
}
