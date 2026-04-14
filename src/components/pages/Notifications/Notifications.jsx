import React from 'react';
import { useBooking } from '../../../context/BookingContext';

const PRIMARY = '#E8622E';

// Notification icon by type
const NOTIF_ICONS = {
  new_booking: '📦',
  booking_accepted: '✅',
  booking_rejected: '❌',
  new_message: '💬',
};

export default function Notifications({ darkMode = false, userType = 'tenant' }) {
  const { getNotifications, markNotificationRead, deleteNotification, clearAllNotifications } = useBooking();
  const dk = darkMode;

  const c = {
    text: dk ? '#eaeaea' : '#333',
    secondaryText: dk ? '#a0a0b0' : '#666',
    cardBg: dk ? '#16213e' : '#fff',
    border: dk ? '#2a2a4a' : 'rgba(0,0,0,0.06)',
    unreadBg: dk ? '#0f3460' : '#fff8f0',
  };

  const notifications = getNotifications(userType);

  const formatTime = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    const now = new Date();
    const diff = now - d;
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h3 style={{ color: c.text, margin: 0 }}>
          🔔 Notifications
          {notifications.filter(n => !n.read).length > 0 && (
            <span style={{
              marginLeft: '10px',
              background: PRIMARY,
              color: '#fff',
              fontSize: '13px',
              padding: '2px 10px',
              borderRadius: '20px',
              fontWeight: '600',
            }}>
              {notifications.filter(n => !n.read).length} new
            </span>
          )}
        </h3>
        {notifications.length > 0 && (
          <button
            onClick={() => clearAllNotifications(userType)}
            style={{
              background: 'transparent',
              border: `1px solid ${c.border}`,
              color: c.secondaryText,
              fontSize: '12px',
              fontWeight: '600',
              padding: '6px 14px',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#dc3545'; e.currentTarget.style.color = '#dc3545'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = c.border; e.currentTarget.style.color = c.secondaryText; }}
          >
            🗑 Clear All
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div style={{
          background: c.cardBg,
          padding: '40px',
          borderRadius: '12px',
          textAlign: 'center',
          color: c.secondaryText,
        }}>
          <div style={{ fontSize: '40px', marginBottom: '12px' }}>🔕</div>
          <p style={{ margin: 0, fontSize: '15px' }}>No notifications yet.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {notifications.map((notif) => (
            <div
              key={notif.id}
              style={{
                background: notif.read ? c.cardBg : c.unreadBg,
                border: `1px solid ${notif.read ? c.border : PRIMARY}`,
                borderRadius: '12px',
                padding: '16px 20px',
                transition: 'all 0.2s ease',
                display: 'flex',
                gap: '14px',
                alignItems: 'flex-start',
              }}
            >
              <div style={{ fontSize: '24px', flexShrink: 0, marginTop: '2px' }}>
                {NOTIF_ICONS[notif.type] || '🔔'}
              </div>
              <div
                style={{ flex: 1, cursor: notif.read ? 'default' : 'pointer' }}
                onClick={() => { if (!notif.read) markNotificationRead(notif.id); }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <h4 style={{ margin: 0, fontSize: '14px', fontWeight: '700', color: c.text }}>
                    {notif.title}
                  </h4>
                  <span style={{ fontSize: '12px', color: c.secondaryText, flexShrink: 0 }}>
                    {formatTime(notif.createdAt)}
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: '13px', color: c.secondaryText, lineHeight: '1.5' }}>
                  {notif.message}
                </p>
                {!notif.read && (
                  <span style={{
                    display: 'inline-block',
                    marginTop: '6px',
                    fontSize: '11px',
                    color: PRIMARY,
                    fontWeight: '600',
                  }}>
                    Click to mark as read
                  </span>
                )}
              </div>
              {/* Delete button */}
              <button
                onClick={(e) => { e.stopPropagation(); deleteNotification(notif.id); }}
                title="Delete notification"
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: c.secondaryText,
                  fontSize: '16px',
                  cursor: 'pointer',
                  padding: '2px 6px',
                  borderRadius: '6px',
                  flexShrink: 0,
                  lineHeight: 1,
                  transition: 'color 0.2s ease',
                }}
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
