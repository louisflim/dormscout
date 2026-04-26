import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useAuth } from '../../../context/AuthContext';
import { useBooking } from '../../../context/BookingContext';
import './BookingPage.css';

const STORAGE_KEY_SHARED = 'bookings'; // written by BookingContext.acceptBooking

const defaultIcon = L.icon({
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize:  [25, 41],
  iconAnchor:[12, 41],
});

function SmallMap({ lat, lng }) {
  const mapRef = useRef(null);
  useEffect(() => {
    const node = mapRef.current;
    if (!node) return;
    if (!node._leaflet_id) {
      const map = L.map(node, { center: [lat || 0, lng || 0], zoom: 14, zoomControl: false, dragging: false, scrollWheelZoom: false });
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
      L.marker([lat, lng], { icon: defaultIcon }).addTo(map);
    }
    return () => { if (node && node._leaflet_id) node.remove(); };
  }, [lat, lng]);
  return <div ref={mapRef} style={{ width: '100%', height: '100%' }} />;
}

function statusStyle(status) {
  const s = (status || '').toLowerCase();
  if (s === 'confirmed' || s === 'accepted' || s === 'active') {
    return { label: 'Confirmed', bg: '#d1fae5', color: '#065f46' };
  }
  if (s === 'rejected') {
    return { label: 'Rejected', bg: '#fee2e2', color: '#991b1b' };
  }
  return { label: 'Pending', bg: '#fef9c3', color: '#92400e' };
}

export default function BookingPage({ darkMode = false }) {
  const navigate = useNavigate();
  const { user, cancelBooking: authCancelBooking } = useAuth();
  const { cancelBooking: contextCancelBooking } = useBooking();
  const [bookings, setBookings] = useState([]);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [cancelModal, setCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelMoveOutDate, setCancelMoveOutDate] = useState('');

  const dk = darkMode;
  const theme      = dk ? 'dark' : 'light';
  const cardBg     = dk ? '#16213e' : '#fff';
  const text       = dk ? '#eaeaea' : '#1a1a1a';
  const subText    = dk ? '#a0a0b0' : '#65676b';
  const borderColor= dk ? '#2a2a4a' : '#e4e6eb';
  const inputBg    = dk ? '#0f3460' : '#f7f7f7';

  // ── Merge confirmed/rejected from 'bookings' key + pending from user.bookings ──
  const loadMerged = useCallback(() => {
    let sharedRaw = [];
    try { sharedRaw = JSON.parse(localStorage.getItem(STORAGE_KEY_SHARED) || '[]'); } catch (_) {}

    const myId    = user?.id;
    const myEmail = user?.email;

    const shared = sharedRaw.filter(b =>
      (myId    && (String(b.tenantId)    === String(myId))) ||
      (myEmail && (b.tenantEmail === myEmail))
    );
    const sharedIds = new Set(shared.map(b => String(b.id)));

    const fromUser = (user?.bookings || [])
    .filter(b => !sharedIds.has(String(b.id)))
    .map(b => ({
      id:             b.id,
      tenantId:       myId,
      listingName:    b.dormName || b.title,
      listingAddress: b.address || '',
      price:          b.price,
      status:         b.status === 'accepted' ? 'Confirmed' : b.status,  // ✅ Normalize
      bookedOn:       b.bookedAt || b.createdAt,
      moveInDate:     b.moveInDate,
      landlordId:     b.landlordId || null,
      landlordName:   b.landlordName || b.landlord || 'Landlord',
      lat:            b.lat,
      lng:            b.lng,
      university:     b.university,
      tags:           b.tags || [],
      description:    b.description || '',
      listingImages:  b.images || b.listingImages || [],
    }));

    const merged = [
      ...shared.map(b => ({ ...b, listingName: b.listingName || b.dormName || b.title })),
      ...fromUser,
    ].sort((a, b) => new Date(b.bookedOn || 0) - new Date(a.bookedOn || 0));

    setBookings(merged);
  }, [user]);

  useEffect(() => { loadMerged(); }, [loadMerged]);

  useEffect(() => {
    const handler = (e) => {
      if (e.key === STORAGE_KEY_SHARED || e.key === 'dormScoutUser' || e.key === 'dormscout_bookings') {
        loadMerged();
      }
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, [loadMerged]);

  // ── Cancel ─────────────────────────────────────────────────────────────────
  const handleCancelBooking = () => {
    if (!selectedBooking) return;

    try {
      const shared = JSON.parse(localStorage.getItem(STORAGE_KEY_SHARED) || '[]');
      localStorage.setItem(STORAGE_KEY_SHARED, JSON.stringify(
        shared.filter(b => String(b.id) !== String(selectedBooking.id))
      ));
    } catch (_) {}

    authCancelBooking(selectedBooking.id);
    contextCancelBooking(selectedBooking.id, cancelReason, cancelMoveOutDate);

    try {
      const raw = localStorage.getItem('dormscout_my_bookings');
      if (raw) {
        const arr = JSON.parse(raw).filter(b => String(b.id) !== String(selectedBooking.id));
        localStorage.setItem('dormscout_my_bookings', JSON.stringify(arr));
      }
    } catch (_) {}

    setCancelModal(false);
    setCancelReason('');
    setCancelMoveOutDate('');
    setSelectedBooking(null);
    setBookings(prev => prev.filter(b => String(b.id) !== String(selectedBooking.id)));
  };

  const formatDate = (iso) => {
    if (!iso) return 'N/A';
    return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  // ── RENDER ─────────────────────────────────────────────────────────────────
  return (
    <div className={`booking-wrapper ${theme}`}>

      {bookings.length === 0 ? (
        <div className="booking-empty">
          <p>You have no active bookings.</p>
          <p>Go to Map View or Listing to book a property!</p>
        </div>
      ) : (
        <div className="bookings-grid">
          {bookings.map((b) => {
            const st = statusStyle(b.status);
            return (
              <div
                key={b.id}
                className="booking-card"
                style={{ background: cardBg, border: `1px solid ${borderColor}`, cursor: 'pointer', position: 'relative' }}
                onClick={() => setSelectedBooking(b)}
              >
                {b.listingImages && b.listingImages.length > 0 ? (
                  <div className="booking-map-preview" style={{ background: inputBg, overflow: 'hidden', height: '180px' }}>
                    <img src={b.listingImages[0]} alt={b.listingName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                ) : b.lat && b.lng ? (
                  <div className="booking-map-preview">
                    <SmallMap lat={b.lat} lng={b.lng} />
                  </div>
                ) : (
                  <div className="booking-map-placeholder" style={{ background: inputBg, color: subText }}>
                    No Image or Location
                  </div>
                )}

                <div className="booking-card-body">
                  <span style={{
                    display: 'inline-block', padding: '3px 12px', borderRadius: '20px',
                    fontSize: '11px', fontWeight: '700', marginBottom: '8px',
                    background: st.bg, color: st.color,
                  }}>
                    {st.label}
                  </span>

                  <h4 className="booking-card-title" style={{ color: text }}>
                    {b.listingName || '(No listing name)'}
                  </h4>
                  <p className="booking-card-address" style={{ color: subText }}>
                    {b.listingAddress}
                  </p>
                  {b.university && (
                    <div className="booking-university-badge">🎓 {b.university}</div>
                  )}
                  <p style={{ margin: '6px 0 2px 0', fontSize: '13px', color: subText }}>
                    <strong style={{ color: text }}>Landlord:</strong> {b.landlordName || 'N/A'}
                  </p>
                  <div className="booking-card-price" style={{ color: '#E8622E' }}>
                    ₱{b.price}
                  </div>
                  {b.moveInDate && (
                    <p style={{ margin: '4px 0', fontSize: '12px', color: subText }}>
                      📅 Move-in: <strong style={{ color: text }}>{b.moveInDate}</strong>
                    </p>
                  )}
                  <p style={{ margin: '4px 0 10px 0', fontSize: '12px', color: subText }}>
                    Booked: {formatDate(b.bookedOn)}
                  </p>
                  {b.tags && b.tags.length > 0 && (
                    <div className="booking-tags" style={{ marginBottom: '10px' }}>
                      {b.tags.map((tag, i) => (
                        <span key={i} className="booking-tag">{tag}</span>
                      ))}
                    </div>
                  )}
                  <button
                    onClick={(e) => { e.stopPropagation(); setSelectedBooking(b); setCancelModal(true); }}
                    style={{
                      width: '100%', padding: '8px', marginTop: '4px',
                      background: 'transparent', border: '1px solid #dc3545',
                      color: '#dc3545', borderRadius: '8px',
                      fontSize: '13px', fontWeight: '600', cursor: 'pointer',
                    }}
                  >
                    Cancel Booking
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Detail Modal */}
      {selectedBooking && !cancelModal && (
        <div className="booking-overlay">
          <div className="booking-modal detail-modal">
            <button className="booking-modal-close" onClick={() => setSelectedBooking(null)}>&times;</button>
            <div className="detail-modal-body">
              <h2 className="detail-modal-title" style={{ color: text }}>{selectedBooking.listingName}</h2>
              <p className="detail-modal-address" style={{ color: subText }}>{selectedBooking.listingAddress}</p>

              <div className="booking-details-box" style={{ background: inputBg }}>
                <h4 style={{ color: text }}>Booking Details</h4>
                {(() => {
                  const st = statusStyle(selectedBooking.status);
                  return (
                    <>
                      <p className="booking-details-row" style={{ color: text }}>
                        <strong>Status:</strong>{' '}
                        <span style={{ padding: '2px 10px', borderRadius: '20px', background: st.bg, color: st.color, fontSize: '12px', fontWeight: '600' }}>
                          {st.label}
                        </span>
                      </p>
                      {(selectedBooking.status || '').toLowerCase() === 'rejected' && (
                        <p className="booking-rejected-notice">❌ Your booking has been rejected by the landlord.</p>
                      )}
                      {selectedBooking.moveInDate && (
                        <p className="booking-details-row" style={{ color: text }}>
                          <strong>Move-in Date:</strong> {selectedBooking.moveInDate}
                        </p>
                      )}
                      <p className="booking-details-row" style={{ color: text }}>
                        <strong>Landlord:</strong> {selectedBooking.landlordName || 'N/A'}
                      </p>
                      <p className="booking-details-row" style={{ color: text }}>
                        <strong>Price:</strong> ₱{selectedBooking.price}
                      </p>
                      <p className="booking-details-row" style={{ color: text }}>
                        <strong>Booked On:</strong> {formatDate(selectedBooking.bookedOn)}
                      </p>
                    </>
                  );
                })()}
              </div>

              {selectedBooking.description && (
                <>
                  <p className="detail-description-label" style={{ color: subText }}>Description</p>
                  <p className="detail-description-text" style={{ color: text }}>{selectedBooking.description}</p>
                </>
              )}

              {selectedBooking.lat && selectedBooking.lng && (
                <div className="detail-modal-map">
                  <SmallMap lat={selectedBooking.lat} lng={selectedBooking.lng} />
                </div>
              )}

              <div className="modal-actions">
                <button className="btn-cancel-booking" onClick={() => setCancelModal(true)}>
                  Cancel Booking
                </button>
                {selectedBooking.landlordId && (
                  <button className="btn-contact-landlord" onClick={() => {
                    navigate('/messages', {
                      state: {
                        contactLandlord: {
                          id:     selectedBooking.landlordId,
                          name:   selectedBooking.landlordName || 'Landlord',
                          avatar: (selectedBooking.landlordName || 'L').split(' ').map(n => n[0]).join(''),
                        },
                      },
                    });
                  }}>
                    Contact Landlord
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Modal */}
      {cancelModal && selectedBooking && (
        <div className="booking-overlay" style={{ zIndex: 2000 }}>
          <div className="booking-modal cancel-modal">
            <button className="booking-modal-close" onClick={() => setCancelModal(false)}>&times;</button>
            <h3 className="cancel-modal-title">Cancel Booking</h3>
            <p className="cancel-modal-subtitle">
              You are cancelling your booking for{' '}
              <strong style={{ color: text }}>{selectedBooking.listingName}</strong>.
            </p>

            <div className="cancel-field">
              <label className="cancel-label">Move-out Date</label>
              <input type="date" className="cancel-input" value={cancelMoveOutDate}
                onChange={e => setCancelMoveOutDate(e.target.value)} />
            </div>
            <div className="cancel-field">
              <label className="cancel-label">Reason for Cancellation</label>
              <textarea rows={3} placeholder="Enter reason..." className="cancel-textarea"
                value={cancelReason} onChange={e => setCancelReason(e.target.value)} />
            </div>

            <div className="cancel-actions">
              <button className="btn-keep-booking" onClick={() => setCancelModal(false)}>Keep Booking</button>
              <button className="btn-confirm-cancel" onClick={handleCancelBooking}>Confirm Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
