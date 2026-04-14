import React from 'react';
import { useBooking } from '../../../context/BookingContext';
import './Notifications.css';

const PRIMARY = '#E8622E';

const NOTIF_ICONS = {
  new_booking:      '📦',
  booking_accepted: '✅',
  booking_rejected: '❌',
  new_message:      '💬',
};

export default function Notifications({ darkMode = false, userType = 'tenant' }) {
  const { getNotifications, markNotificationRead, deleteNotification, clearAllNotifications } = useBooking();
  const dk = darkMode;

  const c = {
    text:          dk ? '#eaeaea'           : '#333',
    secondaryText: dk ? '#a0a0b0'           : '#666',
    cardBg:        dk ? '#16213e'           : '#fff',
    border:        dk ? '#2a2a4a'           : 'rgba(0,0,0,0.06)',
    unreadBg:      dk ? '#0f3460'           : '#fff8f0',
  };

  const notifications = getNotifications(userType);

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
            onClick={() => clearAllNotifications(userType)}
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
                onClick={() => { if (!notif.read) markNotificationRead(notif.id); }}
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
                onClick={(e) => { e.stopPropagation(); deleteNotification(notif.id); }}
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