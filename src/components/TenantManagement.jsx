import React, { useState } from 'react';
import { useBooking } from '../context/BookingContext';

const SECONDARY = '#5BADA8';

// --- Tenant Detail View (Modal) ---
function TenantDetailView({ booking, onClose, onAccept, onReject, onMessage, darkMode }) {
  const dk = darkMode;
  const c = {
    text: dk ? '#eaeaea' : '#333',
    secondaryText: dk ? '#a0a0b0' : '#666',
    cardBg: dk ? '#16213e' : '#fff',
    border: dk ? '#2a2a4a' : 'rgba(0,0,0,0.06)',
    inputBg: dk ? '#0f3460' : '#f7f7f7',
    overlay: dk ? 'rgba(0,0,0,0.8)' : 'rgba(0,0,0,0.5)',
  };

  const statusColors = {
    pending: '#ffc107',
    accepted: '#28a745',
    rejected: '#dc3545',
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: c.overlay,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 3000, padding: '20px'
    }}>
      <div style={{
        background: c.cardBg, borderRadius: '16px', width: '100%', maxWidth: '480px',
        maxHeight: '90vh', overflowY: 'auto', position: 'relative',
        boxShadow: '0 10px 25px rgba(0,0,0,0.3)'
      }}>
        <button onClick={onClose} style={{
          position: 'absolute', top: 10, right: 15, background: 'transparent',
          border: 'none', fontSize: '24px', cursor: 'pointer', color: c.secondaryText
        }}>&times;</button>

        <div style={{ padding: '28px' }}>
          {/* Avatar */}
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <div style={{
              width: '64px', height: '64px', borderRadius: '50%', background: SECONDARY,
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontSize: '24px', fontWeight: '700',
            }}>
              {booking.tenantAvatar || booking.tenantName?.charAt(0) || '?'}
            </div>
            <h3 style={{ margin: '12px 0 4px 0', color: c.text }}>{booking.tenantName}</h3>
            <span style={{
              display: 'inline-block',
              padding: '3px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '600',
              color: '#fff', background: statusColors[booking.status] || '#999',
              textTransform: 'capitalize',
            }}>
              {booking.status}
            </span>
          </div>

          {/* Details */}
          <div style={{ background: c.inputBg, borderRadius: '10px', padding: '16px', marginBottom: '16px' }}>
            <div style={{ display: 'grid', gap: '12px' }}>
              <div>
                <span style={{ fontSize: '12px', color: c.secondaryText }}>Email</span>
                <p style={{ margin: '2px 0 0 0', color: c.text, fontSize: '14px' }}>{booking.tenantEmail}</p>
              </div>
              <div>
                <span style={{ fontSize: '12px', color: c.secondaryText }}>Phone</span>
                <p style={{ margin: '2px 0 0 0', color: c.text, fontSize: '14px' }}>{booking.tenantPhone}</p>
              </div>
              <div>
                <span style={{ fontSize: '12px', color: c.secondaryText }}>Requested Move-in Date</span>
                <p style={{ margin: '2px 0 0 0', color: c.text, fontSize: '14px', fontWeight: '600' }}>{booking.moveInDate}</p>
              </div>
              <div>
                <span style={{ fontSize: '12px', color: c.secondaryText }}>Dorm Applied For</span>
                <p style={{ margin: '2px 0 0 0', color: c.text, fontSize: '14px' }}>{booking.listingTitle}</p>
              </div>
              <div>
                <span style={{ fontSize: '12px', color: c.secondaryText }}>Booking Date</span>
                <p style={{ margin: '2px 0 0 0', color: c.text, fontSize: '14px' }}>
                  {new Date(booking.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button onClick={() => onMessage(booking)} style={{
              width: '100%', padding: '12px', background: SECONDARY, color: '#fff',
              border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: '600', cursor: 'pointer',
            }}>
              💬 Message Tenant
            </button>
            {booking.status === 'pending' && (
              <>
                <button onClick={() => onAccept(booking.id)} style={{
                  width: '100%', padding: '12px', background: '#28a745', color: '#fff',
                  border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: '600', cursor: 'pointer',
                }}>
                  ✔ Accept Tenant
                </button>
                <button onClick={() => onReject(booking.id)} style={{
                  width: '100%', padding: '12px', background: '#dc3545', color: '#fff',
                  border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: '600', cursor: 'pointer',
                }}>
                  ✖ Reject Tenant
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Main TenantManagement component ---
export default function TenantManagement({ listingId, listingTitle, darkMode = false, onMessageTenant }) {
  const { getBookingsForListing, getTenantsForListing, acceptBooking, rejectBooking, removeTenant, deleteRejectedBooking } = useBooking();
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [removeModal, setRemoveModal] = useState(null);
  const [removeReason, setRemoveReason] = useState('');
  const [removeMoveOutDate, setRemoveMoveOutDate] = useState('');

  const dk = darkMode;
  const c = {
    text: dk ? '#eaeaea' : '#333',
    secondaryText: dk ? '#a0a0b0' : '#666',
    cardBg: dk ? '#16213e' : '#fff',
    border: dk ? '#2a2a4a' : 'rgba(0,0,0,0.06)',
    inputBg: dk ? '#0f3460' : '#f7f7f7',
    overlay: dk ? 'rgba(0,0,0,0.8)' : 'rgba(0,0,0,0.5)',
  };

  const bookings = getBookingsForListing(listingId);
  const activeTenants = getTenantsForListing(listingId);
  const pendingBookings = bookings.filter(b => b.status === 'pending');
  const rejectedBookings = bookings.filter(b => b.status === 'rejected');

  const statusColors = { pending: '#ffc107', accepted: '#28a745', rejected: '#dc3545', active: '#28a745' };

  const handleAccept = (bookingId) => { acceptBooking(bookingId); setSelectedBooking(null); };
  const handleReject = (bookingId) => { rejectBooking(bookingId); setSelectedBooking(null); };

  const handleConfirmRemove = () => {
    if (!removeModal) return;
    removeTenant(removeModal.id, removeReason, removeMoveOutDate);
    setRemoveModal(null);
    setRemoveReason('');
    setRemoveMoveOutDate('');
  };

  return (
    <div>
      {/* Current Tenants */}
      <div style={{ marginBottom: '28px' }}>
        <h4 style={{ color: c.text, margin: '0 0 14px 0', fontSize: '16px' }}>
          👥 Current Tenants{activeTenants.length > 0 && <span style={{ marginLeft: '8px', fontSize: '13px', color: c.secondaryText }}>({activeTenants.length})</span>}
        </h4>
        {activeTenants.length === 0 ? (
          <div style={{ background: c.inputBg, padding: '20px', borderRadius: '10px', textAlign: 'center', color: c.secondaryText, fontSize: '14px' }}>
            No current tenants for this listing.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {activeTenants.map((t) => (
              <div key={t.id} style={{ background: c.inputBg, borderRadius: '10px', padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontWeight: '600', color: c.text, fontSize: '14px' }}>{t.tenantName}</p>
                  <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: c.secondaryText }}>{t.roomNumber} · Move-in: {t.moveInDate}</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600', color: '#fff', background: statusColors[t.status] || '#999', textTransform: 'capitalize' }}>
                    {t.status}
                  </span>
                  <button onClick={() => setRemoveModal(t)} style={{ padding: '5px 12px', background: 'transparent', border: '1px solid #dc3545', color: '#dc3545', borderRadius: '8px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pending Requests */}
      <div style={{ marginBottom: '28px' }}>
        <h4 style={{ color: c.text, margin: '0 0 14px 0', fontSize: '16px' }}>
          ⏳ Pending Requests
          {pendingBookings.length > 0 && (
            <span style={{ marginLeft: '8px', background: '#ffc107', color: '#333', fontSize: '12px', padding: '2px 8px', borderRadius: '20px', fontWeight: '600' }}>
              {pendingBookings.length}
            </span>
          )}
        </h4>
        {pendingBookings.length === 0 ? (
          <div style={{ background: c.inputBg, padding: '20px', borderRadius: '10px', textAlign: 'center', color: c.secondaryText, fontSize: '14px' }}>
            No pending booking requests.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {pendingBookings.map((b) => (
              <div key={b.id} style={{ background: c.inputBg, borderRadius: '10px', padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
                <div style={{ flex: 1, cursor: 'pointer' }} onClick={() => setSelectedBooking(b)}>
                  <p style={{ margin: 0, fontWeight: '600', color: c.text, fontSize: '14px' }}>{b.tenantName}</p>
                  <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: c.secondaryText }}>Move-in: {b.moveInDate}</p>
                </div>
                <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                  <button onClick={() => handleAccept(b.id)} style={{ padding: '8px 14px', background: '#28a745', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>✔</button>
                  <button onClick={() => handleReject(b.id)} style={{ padding: '8px 14px', background: '#dc3545', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>✖</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Rejected */}
      {rejectedBookings.length > 0 && (
        <div>
          <h4 style={{ color: c.text, margin: '0 0 14px 0', fontSize: '16px' }}>❌ Rejected ({rejectedBookings.length})</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {rejectedBookings.map((b) => (
              <div key={b.id} style={{ background: c.inputBg, borderRadius: '10px', padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', opacity: 0.7 }}>
                <div>
                  <p style={{ margin: 0, fontWeight: '600', color: c.text, fontSize: '14px' }}>{b.tenantName}</p>
                  <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: c.secondaryText }}>Move-in: {b.moveInDate}</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600', color: '#fff', background: '#dc3545' }}>
                    Rejected
                  </span>
                  <button onClick={() => deleteRejectedBooking(b.id)} title="Dismiss" style={{ background: 'transparent', border: 'none', color: c.secondaryText, fontSize: '18px', cursor: 'pointer', lineHeight: 1, padding: '0 2px' }}>
                    &times;
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tenant Detail Modal */}
      {selectedBooking && (
        <TenantDetailView
          booking={selectedBooking}
          darkMode={darkMode}
          onClose={() => setSelectedBooking(null)}
          onAccept={handleAccept}
          onReject={handleReject}
          onMessage={(b) => { if (onMessageTenant) onMessageTenant(b); setSelectedBooking(null); }}
        />
      )}

      {/* Remove Tenant Modal */}
      {removeModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: c.overlay, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3000, padding: '20px' }}>
          <div style={{ background: c.cardBg, borderRadius: '16px', width: '100%', maxWidth: '440px', padding: '28px', position: 'relative', boxShadow: '0 10px 25px rgba(0,0,0,0.3)' }}>
            <button onClick={() => setRemoveModal(null)} style={{ position: 'absolute', top: 10, right: 15, background: 'transparent', border: 'none', fontSize: '24px', cursor: 'pointer', color: c.secondaryText }}>&times;</button>
            <h3 style={{ margin: '0 0 6px 0', color: c.text }}>Remove Tenant</h3>
            <p style={{ margin: '0 0 20px 0', color: c.secondaryText, fontSize: '14px' }}>
              You are removing <strong style={{ color: c.text }}>{removeModal.tenantName}</strong> from this listing.
            </p>
            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: c.secondaryText }}>Move-out Date</label>
              <input
                type="date"
                value={removeMoveOutDate}
                onChange={e => setRemoveMoveOutDate(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', fontSize: '14px', border: `1px solid ${c.border}`, background: c.inputBg, color: c.text, boxSizing: 'border-box' }}
              />
            </div>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: c.secondaryText }}>Reason for Removal</label>
              <textarea
                rows={3}
                placeholder="Enter reason..."
                value={removeReason}
                onChange={e => setRemoveReason(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', fontSize: '14px', border: `1px solid ${c.border}`, background: c.inputBg, color: c.text, resize: 'vertical', boxSizing: 'border-box' }}
              />
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setRemoveModal(null)} style={{ flex: 1, padding: '12px', background: 'transparent', border: `1px solid ${c.border}`, color: c.text, borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>
                Cancel
              </button>
              <button onClick={handleConfirmRemove} style={{ flex: 1, padding: '12px', background: '#dc3545', border: 'none', color: '#fff', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>
                Confirm Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
