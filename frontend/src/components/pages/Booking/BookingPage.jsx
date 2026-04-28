import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useAuth } from '../../../context/AuthContext';
import { useBooking } from '../../../context/BookingContext';
import { bookingsAPI, listingsAPI } from '../../../utils/api';
import './BookingPage.css';

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
  const { user } = useAuth();
  const { cancelBooking: contextCancelBooking, subscribeToBookings } = useBooking();
  const [bookings, setBookings] = useState([]);
  const [listings, setListings] = useState([]);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [cancelModal, setCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelMoveOutDate, setCancelMoveOutDate] = useState('');
  const [loading, setLoading] = useState(false);

  const dk = darkMode;
  const theme      = dk ? 'dark' : 'light';
  const cardBg     = dk ? '#16213e' : '#fff';
  const text       = dk ? '#eaeaea' : '#1a1a1a';
  const subText    = dk ? '#a0a0b0' : '#65676b';
  const borderColor= dk ? '#2a2a4a' : '#e4e6eb';
  const inputBg    = dk ? '#0f3460' : '#f7f7f7';

  // Load bookings from backend
  const loadBookings = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);

    try {
      // Get user's bookings from backend
      const response = await bookingsAPI.getBookingsByTenant(user.id);
      console.log('📋 Bookings API response:', response);

      // Handle different response formats
      let userBookings = [];
      if (Array.isArray(response)) {
        userBookings = response;
      } else if (response?.data && Array.isArray(response.data)) {
        userBookings = response.data;
      } else if (response?.data?.data && Array.isArray(response.data.data)) {
        userBookings = response.data.data;
      }

      console.log('📋 Parsed bookings:', userBookings);

      // Get all listings for listing details
      const listingsResponse = await listingsAPI.getAllListings();
      const allListings = Array.isArray(listingsResponse) ? listingsResponse : (listingsResponse?.data || []);

      // Merge booking data with listing data
      const mergedBookings = userBookings.map(booking => {
        // Handle nested listing object
        const listingRef = booking.listing || {};
        const listing = allListings.find(l =>
          l.id === booking.listingId ||
          l.id === listingRef.id
        ) || listingRef;

        return {
          ...booking,
          listingName: booking.listingName || listing?.title || 'Property',
          listingAddress: booking.listingAddress || listing?.address || '',
          price: booking.price || listing?.price || 0,
          landlordId: booking.landlordId || listing?.landlordId || listing?.landlord?.id || null,
          landlordName: booking.landlordName || listing?.landlordName || 'Landlord',
          lat: booking.lat || listing?.lat || listing?.latitude,
          lng: booking.lng || listing?.lng || listing?.longitude,
          university: listing?.university,
          tags: booking.tags || listing?.tags || [],
          description: booking.description || listing?.description,
          listingImages: booking.listingImages || listing?.images || [],
          // Ensure status is always present
          status: booking.status || 'pending',
          // Move-in date from checkInDate or moveInDate
          moveInDate: booking.moveInDate || booking.checkInDate,
        };
      });

      console.log('📋 Merged bookings:', mergedBookings);
      setBookings(mergedBookings);
      setListings(allListings);
    } catch (error) {
      console.error('Failed to load bookings:', error);
      // Fallback to localStorage
      try {
        const stored = JSON.parse(localStorage.getItem('bookings') || '[]');
        const myBookings = stored.filter(b => String(b.tenantId) === String(user.id));
        setBookings(myBookings);
      } catch (_) {
        setBookings([]);
      }
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  // Subscribe to booking changes
  useEffect(() => {
    const unsubscribe = subscribeToBookings(() => {
      loadBookings();
    });
    return unsubscribe;
  }, [subscribeToBookings, loadBookings]);

  // ── Cancel ─────────────────────────────────────────────────────────────────
  const handleCancelBooking = async () => {
    if (!selectedBooking) return;
    setLoading(true);

    try {
      const response = await bookingsAPI.delete(selectedBooking.id);

      if (response.success || response.ok) {
        // Update available rooms on listing
        if (selectedBooking.listingId) {
          const listing = listings.find(l => l.id === selectedBooking.listingId);
          if (listing) {
            const newAvailable = (parseInt(listing.availableRooms) || 0) + 1;
            await listingsAPI.update(selectedBooking.listingId, { availableRooms: newAvailable });
          }
        }

        // Call context cancel
        contextCancelBooking(selectedBooking.id);

        setBookings(prev => prev.filter(b => String(b.id) !== String(selectedBooking.id)));
      } else {
        alert(response.message || 'Failed to cancel booking');
      }
    } catch (error) {
      console.error('Cancel booking error:', error);
      alert('Failed to cancel booking');
    } finally {
      setCancelModal(false);
      setCancelReason('');
      setCancelMoveOutDate('');
      setSelectedBooking(null);
      setLoading(false);
    }
  };

  const formatDate = (iso) => {
    if (!iso) return 'N/A';
    return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  // ── RENDER ─────────────────────────────────────────────────────────────────
  return (
    <div className={`booking-wrapper ${theme}`}>
      {loading && bookings.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40 }}>Loading bookings...</div>
      ) : bookings.length === 0 ? (
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
                    ₱{Number(b.price).toLocaleString()}
                  </div>
                  {b.moveInDate && (
                    <p style={{ margin: '4px 0', fontSize: '12px', color: subText }}>
                      📅 Move-in: <strong style={{ color: text }}>{b.moveInDate}</strong>
                    </p>
                  )}
                  <p style={{ margin: '4px 0 10px 0', fontSize: '12px', color: subText }}>
                    Booked: {formatDate(b.bookedOn || b.createdAt)}
                  </p>
                  {b.tags && b.tags.length > 0 && (
                    <div className="booking-tags" style={{ marginBottom: '10px' }}>
                      {b.tags.map((tag, i) => (
                        <span key={i} className="booking-tag">{tag}</span>
                      ))}
                    </div>
                  )}
                  {(b.status === 'pending' || b.status === 'accepted') && (
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
                  )}
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
                        <strong>Booked On:</strong> {formatDate(selectedBooking.bookedOn || selectedBooking.createdAt)}
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
                {(selectedBooking.status === 'pending' || selectedBooking.status === 'accepted') && (
                  <button className="btn-cancel-booking" onClick={() => setCancelModal(true)}>
                    Cancel Booking
                  </button>
                )}
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
              <button className="btn-confirm-cancel" onClick={handleCancelBooking} disabled={loading}>
                {loading ? 'Cancelling...' : 'Confirm Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}