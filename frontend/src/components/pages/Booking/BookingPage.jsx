import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useBooking } from '../../../context/BookingContext';
import { useAuth } from '../../../context/AuthContext';
import './BookingPage.css';

const STORAGE_KEY_LISTINGS = 'dormscout_listings';
const STORAGE_KEY_BOOKINGS  = 'dormscout_my_bookings';

const defaultIcon = L.icon({
  iconUrl:        'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl:  'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl:      'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize:   [25, 41],
  iconAnchor: [12, 41],
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

const getStatusClass = (status) => {
  if (status === 'accepted' || status === 'Active') return 'status-accepted';
  if (status === 'rejected') return 'status-rejected';
  return 'status-pending';
};

const getStatusLabel = (status) => {
  if (status === 'accepted' || status === 'Active') return 'Active';
  if (status === 'rejected') return 'Rejected';
  return 'Pending';
};

export default function BookingPage({ darkMode = false }) {
  const [bookings, setBookings]             = useState([]);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const { bookings: contextBookings, cancelBooking: contextCancel } = useBooking();
  const { user, cancelBooking: authCancelBooking, updateBookingStatus } = useAuth();
  const [cancelModal, setCancelModal]       = useState(false);
  const [cancelReason, setCancelReason]     = useState('');
  const [cancelMoveOutDate, setCancelMoveOutDate] = useState('');

  const theme = darkMode ? 'dark' : 'light';

  // Load bookings from AuthContext (real user data)
  useEffect(() => {
    if (user?.bookings) {
      setBookings(user.bookings);
    } else {
      // Fallback to old storage for backwards compatibility
      loadBookings();
    }
  }, [user]);

  function loadBookings() {
    const rawBookingData = localStorage.getItem(STORAGE_KEY_BOOKINGS);
    const bookingData    = rawBookingData ? JSON.parse(rawBookingData) : [];
    const rawListings    = localStorage.getItem(STORAGE_KEY_LISTINGS);
    const allListings    = rawListings ? JSON.parse(rawListings) : [];
    const myBookings = bookingData
      .map(booking => ({
        ...allListings.find(l => l.id === booking.id),
        bookedAt: booking.bookedAt,
      }))
      .filter(b => b.title);
    setBookings(myBookings);
  }

  const handleCancelBooking = () => {
    if (!selectedBooking) return;

    // Update AuthContext
    authCancelBooking(selectedBooking.id);

    // Also update old storage for backwards compatibility
    const rawBookingData = localStorage.getItem(STORAGE_KEY_BOOKINGS);
    let bookingData = rawBookingData ? JSON.parse(rawBookingData) : [];
    bookingData = bookingData.filter(b => b.id !== selectedBooking.id);
    localStorage.setItem(STORAGE_KEY_BOOKINGS, JSON.stringify(bookingData));

    setCancelModal(false);
    setCancelReason('');
    setCancelMoveOutDate('');
    setSelectedBooking(null);

    // Reload bookings
    if (user?.bookings) {
      setBookings(user.bookings.filter(b => b.id !== selectedBooking.id));
    }
  };

  const formatDate = (isoString) => {
    if (!isoString) return 'N/A';
    return new Date(isoString).toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  return (
    <div className={`booking-wrapper ${theme}`}>
      {bookings.length === 0 ? (
        <div className="booking-empty">
          <p>You have no active bookings.</p>
          <p>Go to Map View to book a property!</p>
        </div>
      ) : (
        <div className="bookings-grid">
          {bookings.map((b) => (
            <div key={b.id} className="booking-card" onClick={() => setSelectedBooking(b)}>
              {b.lat && b.lng ? (
                <div className="booking-map-preview">
                  <SmallMap lat={b.lat} lng={b.lng} />
                </div>
              ) : (
                <div className="booking-map-placeholder">No Location</div>
              )}

              <div className="booking-card-body">
                <h4 className="booking-card-title">{b.dormName || b.title}</h4>
                <p className="booking-card-address">{b.address}</p>
                {b.university && (
                  <div className="booking-university-badge">🎓 {b.university}</div>
                )}
                <div className="booking-card-price">₱{b.price}</div>
                <div className="booking-tags">
                  {(b.tags || []).map((tag, i) => (
                    <span key={i} className="booking-tag">{tag}</span>
                  ))}
                </div>

                {/* Status Badge - NEW */}
                <div style={{ marginTop: '8px' }}>
                  <span className={getStatusClass(b.status)} style={{
                    padding: '4px 12px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: '600',
                    textTransform: 'capitalize'
                  }}>
                    {getStatusLabel(b.status)}
                  </span>
                </div>

                <div className="booking-card-hint">Click to view booking details</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ===== Detail Modal ===== */}
      {selectedBooking && (
        <div className="booking-overlay">
          <div className="booking-modal detail-modal">
            <button className="booking-modal-close" onClick={() => setSelectedBooking(null)}>
              &times;
            </button>
            <div className="detail-modal-body">
              <h2 className="detail-modal-title">{selectedBooking.dormName || selectedBooking.title}</h2>
              <p className="detail-modal-address">{selectedBooking.address}</p>

              {/* Booking Details Box */}
              <div className="booking-details-box">
                <h4>Booking Details</h4>
                {(() => {
                  const status = selectedBooking.status || 'pending';
                  return (
                    <>
                      <p className="booking-details-row">
                        <strong>Status:</strong>{' '}
                        <span className={getStatusClass(status)}>{getStatusLabel(status)}</span>
                      </p>
                      {status === 'rejected' && (
                        <p className="booking-rejected-notice">
                          ❌ Your booking has been rejected by the landlord.
                        </p>
                      )}
                      {selectedBooking.moveInDate && (
                        <p className="booking-details-row">
                          <strong>Move-in Date:</strong> {selectedBooking.moveInDate}
                        </p>
                      )}
                    </>
                  );
                })()}
                <p className="booking-details-row">
                  <strong>Booked On:</strong> {formatDate(selectedBooking.bookedAt || selectedBooking.createdAt)}
                </p>
              </div>

              {/* Listing Details Grid */}
              <div className="listing-details-grid">
                <div>
                  <p className="listing-detail-label">Price</p>
                  <p className="listing-detail-value price">₱{selectedBooking.price}</p>
                </div>
                <div>
                  <p className="listing-detail-label">Rooms Available</p>
                  <p className="listing-detail-value">{selectedBooking.availableRooms || 'N/A'}</p>
                </div>
                <div className="listing-detail-full">
                  <p className="listing-detail-label">Nearby University</p>
                  <p className="listing-detail-value">{selectedBooking.university || 'Not specified'}</p>
                </div>
              </div>

              {/* Amenities */}
              <p className="listing-detail-label">Amenities/Tags</p>
              <div className="amenity-tags">
                {(selectedBooking.tags || []).map((tag, i) => (
                  <span key={i} className="amenity-tag">{tag}</span>
                ))}
              </div>

              {/* Map */}
              {selectedBooking.lat && selectedBooking.lng && (
                <div className="detail-modal-map">
                  <SmallMap lat={selectedBooking.lat} lng={selectedBooking.lng} />
                </div>
              )}

              {/* Description */}
              <p className="detail-description-label">Description</p>
              <p className="detail-description-text">
                {selectedBooking.description || 'No description provided.'}
              </p>

              {/* Actions - only show cancel if booking is pending/active */}
              {(selectedBooking.status === 'pending' || selectedBooking.status === 'Active') && (
                <div className="modal-actions">
                  <button className="btn-cancel-booking" onClick={() => setCancelModal(true)}>
                    Cancel Booking
                  </button>
                  <button className="btn-contact-landlord" onClick={() => alert('Contact landlord functionality coming soon!')}>
                    Contact Landlord
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ===== Cancel Modal ===== */}
      {cancelModal && selectedBooking && (
        <div className="booking-overlay" style={{ zIndex: 2000 }}>
          <div className="booking-modal cancel-modal">
            <button className="booking-modal-close" onClick={() => setCancelModal(false)}>
              &times;
            </button>
            <h3 className="cancel-modal-title">Cancel Booking</h3>
            <p className="cancel-modal-subtitle">
              You are cancelling your booking for{' '}
              <strong style={{ color: darkMode ? '#eaeaea' : '#333' }}>{selectedBooking.dormName || selectedBooking.title}</strong>.
            </p>

            <div className="cancel-field">
              <label className="cancel-label">Move-out Date</label>
              <input
                type="date"
                className="cancel-input"
                value={cancelMoveOutDate}
                onChange={e => setCancelMoveOutDate(e.target.value)}
              />
            </div>
            <div className="cancel-field">
              <label className="cancel-label">Reason for Cancellation</label>
              <textarea
                rows={3}
                placeholder="Enter reason..."
                className="cancel-textarea"
                value={cancelReason}
                onChange={e => setCancelReason(e.target.value)}
              />
            </div>

            <div className="cancel-actions">
              <button className="btn-keep-booking" onClick={() => setCancelModal(false)}>
                Keep Booking
              </button>
              <button className="btn-confirm-cancel" onClick={handleCancelBooking}>
                Confirm Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}