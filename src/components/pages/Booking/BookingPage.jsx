import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useBooking } from '../../../context/BookingContext';

// --- Constants ---
const PRIMARY = '#E8622E';
const STORAGE_KEY_LISTINGS = 'dormscout_listings';
const STORAGE_KEY_BOOKINGS = 'dormscout_my_bookings';

// Fix for default marker icon
const defaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

// Small Map Component
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

export default function BookingPage({ darkMode = false }) {
  const [bookings, setBookings] = useState([]);
  const [selectedBooking, setSelectedBooking] = useState(null); // For the Modal
  const { bookings: contextBookings, cancelBooking } = useBooking();
  const [cancelModal, setCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelMoveOutDate, setCancelMoveOutDate] = useState('');

  // Theme colors
  const dk = darkMode;
  const c = {
    text: dk ? '#eaeaea' : '#333',
    secondaryText: dk ? '#a0a0b0' : '#666',
    cardBg: dk ? '#16213e' : '#fff',
    border: dk ? '#2a2a4a' : 'rgba(0,0,0,0.06)',
    inputBg: dk ? '#0f3460' : '#fff',
    overlay: dk ? 'rgba(0,0,0,0.8)' : 'rgba(0,0,0,0.5)',
  };

  useEffect(() => {
    loadBookings();
    window.addEventListener('storage', loadBookings);
    return () => window.removeEventListener('storage', loadBookings);
  }, []);

  function loadBookings() {
    const rawBookingData = localStorage.getItem(STORAGE_KEY_BOOKINGS);
    const bookingData = rawBookingData ? JSON.parse(rawBookingData) : []; // Array of { id, bookedAt }

    const rawListings = localStorage.getItem(STORAGE_KEY_LISTINGS);
    const allListings = rawListings ? JSON.parse(rawListings) : [];

    // Merge booking time with listing details
    const myBookings = bookingData.map(booking => {
      const listingDetails = allListings.find(l => l.id === booking.id);
      return {
        ...listingDetails,
        bookedAt: booking.bookedAt // Add the timestamp
      };
    }).filter(b => b.title); // Filter out undefined if listing was deleted

    setBookings(myBookings);
  }

  const handleCancelBooking = () => {
    if (!selectedBooking) return;
    const id = selectedBooking.id;

    // Remove from localStorage my_bookings
    const rawBookingData = localStorage.getItem(STORAGE_KEY_BOOKINGS);
    let bookingData = rawBookingData ? JSON.parse(rawBookingData) : [];
    bookingData = bookingData.filter(b => b.id !== id);
    localStorage.setItem(STORAGE_KEY_BOOKINGS, JSON.stringify(bookingData));

    // Cancel in context (removes tenant record + notifies both)
    const ctxBooking = contextBookings.find(cb => cb.listingId === id);
    if (ctxBooking) {
      cancelBooking(ctxBooking.id, cancelReason, cancelMoveOutDate);
    }

    setCancelModal(false);
    setCancelReason('');
    setCancelMoveOutDate('');
    setSelectedBooking(null);
    loadBookings();
  };

  const formatDate = (isoString) => {
    if (!isoString) return 'N/A';
    return new Date(isoString).toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  return (
    <div style={{ padding: '0 10px' }}>
      <h3 style={{ color: c.text, marginBottom: '20px' }}>My Bookings</h3>

      {bookings.length === 0 ? (
        <div style={{ background: c.cardBg, padding: '40px', borderRadius: '12px', textAlign: 'center', color: c.secondaryText }}>
          <p style={{ fontSize: '16px', margin: 0 }}>You have no active bookings.</p>
          <p style={{ fontSize: '14px', marginTop: '10px' }}>Go to Map View or Listing to book a property!</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
          {bookings.map((b) => (
            <div
              key={b.id}
              onClick={() => setSelectedBooking(b)}
              style={{
                background: c.cardBg,
                border: `1px solid ${c.border}`,
                borderRadius: '12px',
                overflow: 'hidden',
                cursor: 'pointer',
                transition: 'transform 0.2s',
              }}
            >
              {/* Map Preview */}
              {b.lat && b.lng ? (
                <div style={{ height: 150, width: '100%' }}>
                  <SmallMap lat={b.lat} lng={b.lng} />
                </div>
              ) : (
                <div style={{ height: 150, background: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666' }}>
                  No Location
                </div>
              )}

              <div style={{ padding: '16px' }}>
                <h4 style={{ margin: '0 0 5px 0', color: c.text }}>{b.title}</h4>
                <p style={{ margin: '0 0 8px 0', fontSize: '13px', color: c.secondaryText }}>{b.address}</p>

                {b.university && (
                  <div style={{ fontSize: '12px', color: PRIMARY, fontWeight: '600', marginBottom: '8px', background: `${PRIMARY}15`, display: 'inline-block', padding: '4px 8px', borderRadius: '4px' }}>
                    🎓 {b.university}
                  </div>
                )}

                <div style={{ fontSize: '18px', fontWeight: '700', color: PRIMARY, marginBottom: '10px' }}>
                  ₱{b.price}
                </div>

                {/* Tags */}
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '6px' }}>
                    {(b.tags || []).map((tag, i) => (
                        <span key={i} style={{ background: c.inputBg, color: c.text, padding: '4px 8px', borderRadius: '12px', fontSize: '12px' }}>
                            {tag}
                        </span>
                    ))}
                </div>

                {/* Click to view hint */}
                <div style={{ marginTop: '15px', textAlign: 'center', fontSize: '12px', color: PRIMARY }}>
                  Click to view booking details
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* --- MODAL / OVERLAY --- */}
      {selectedBooking && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: c.overlay,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            background: c.cardBg,
            borderRadius: '16px',
            width: '100%',
            maxWidth: '500px',
            maxHeight: '90vh',
            overflowY: 'auto',
            position: 'relative',
            boxShadow: '0 10px 25px rgba(0,0,0,0.3)'
          }}>
            {/* Close Button */}
            <button
              onClick={() => setSelectedBooking(null)}
              style={{
                position: 'absolute', top: 10, right: 15,
                background: 'transparent', border: 'none',
                fontSize: '24px', cursor: 'pointer', color: c.secondaryText
              }}
            >
              &times;
            </button>

            {/* Modal Content */}
            <div style={{ padding: '24px' }}>
              <h2 style={{ margin: '0 0 5px 0', color: c.text }}>{selectedBooking.title}</h2>
              <p style={{ margin: '0 0 20px 0', color: c.secondaryText }}>{selectedBooking.address}</p>

              {/* Booking Details Box */}
              <div style={{ background: c.inputBg, padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
                <h4 style={{ margin: '0 0 10px 0', color: PRIMARY }}>Booking Details</h4>
                <p style={{ margin: 0, color: c.text, fontSize: '14px' }}>
                  <strong>Status:</strong> {(() => {
                    const ctxBooking = contextBookings.find(cb => cb.listingId === selectedBooking.id);
                    const status = ctxBooking ? ctxBooking.status : 'pending';
                    const statusColor = status === 'accepted' ? '#28a745' : status === 'rejected' ? '#dc3545' : '#ffc107';
                    return <span style={{ color: statusColor, textTransform: 'capitalize', fontWeight: 600 }}>{status}</span>;
                  })()}
                </p>
                {(() => {
                  const ctxBooking = contextBookings.find(cb => cb.listingId === selectedBooking.id);
                  if (ctxBooking && ctxBooking.status === 'rejected') {
                    return <p style={{ margin: '8px 0 0 0', color: '#dc3545', fontSize: '14px', fontWeight: '600', background: 'rgba(220,53,69,0.1)', padding: '8px 12px', borderRadius: '8px' }}>
                      ❌ Your booking has been rejected by the landlord.
                    </p>;
                  }
                  if (ctxBooking && ctxBooking.moveInDate) {
                    return <p style={{ margin: '5px 0 0 0', color: c.text, fontSize: '14px' }}>
                      <strong>Move-in Date:</strong> {ctxBooking.moveInDate}
                    </p>;
                  }
                  return null;
                })()}
                <p style={{ margin: '5px 0 0 0', color: c.text, fontSize: '14px' }}>
                  <strong>Booked On:</strong> {formatDate(selectedBooking.bookedAt)}
                </p>
              </div>

              {/* Listing Details Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
                <div>
                  <p style={{ margin: 0, fontSize: '12px', color: c.secondaryText }}>Price</p>
                  <p style={{ margin: '4px 0 0 0', fontSize: '18px', fontWeight: '700', color: PRIMARY }}>₱{selectedBooking.price}</p>
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: '12px', color: c.secondaryText }}>Rooms Available</p>
                  <p style={{ margin: '4px 0 0 0', fontSize: '16px', fontWeight: '600', color: c.text }}>{selectedBooking.availableRooms || 'N/A'}</p>
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <p style={{ margin: 0, fontSize: '12px', color: c.secondaryText }}>Nearby University</p>
                  <p style={{ margin: '4px 0 0 0', fontSize: '16px', fontWeight: '600', color: c.text }}>
                    {selectedBooking.university || 'Not specified'}
                  </p>
                </div>
              </div>

              {/* Tags */}
              <div style={{ marginBottom: '20px' }}>
                <p style={{ margin: '0 0 8px 0', fontSize: '12px', color: c.secondaryText }}>Amenities/Tags</p>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {(selectedBooking.tags || []).map((tag, i) => (
                    <span key={i} style={{ background: PRIMARY, color: '#fff', padding: '4px 10px', borderRadius: '20px', fontSize: '13px' }}>
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Map */}
              {selectedBooking.lat && selectedBooking.lng && (
                <div style={{ height: 200, width: '100%', borderRadius: '8px', overflow: 'hidden', marginBottom: '20px' }}>
                  <SmallMap lat={selectedBooking.lat} lng={selectedBooking.lng} />
                </div>
              )}

              {/* Description */}
              <div style={{ marginBottom: '20px' }}>
                <p style={{ margin: '0 0 5px 0', fontSize: '12px', color: c.secondaryText }}>Description</p>
                <p style={{ margin: 0, color: c.text, fontSize: '14px', lineHeight: '1.5' }}>
                  {selectedBooking.description || 'No description provided.'}
                </p>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={() => setCancelModal(true)}
                  style={{
                    flex: 1,
                    padding: '12px',
                    background: '#fff',
                    border: '1px solid #dc3545',
                    color: '#dc3545',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: '600',
                    fontSize: '14px'
                  }}
                >
                  Cancel Booking
                </button>
                <button
                  onClick={() => alert('Contact landlord functionality coming soon!')}
                  style={{
                    flex: 1,
                    padding: '12px',
                    background: '#5BADA8',
                    border: 'none',
                    color: '#fff',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: '600',
                    fontSize: '14px'
                  }}
                >
                  Contact Landlord
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Booking Modal */}
      {cancelModal && selectedBooking && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: c.overlay, display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 2000, padding: '20px',
        }}>
          <div style={{
            background: c.cardBg, borderRadius: '16px', width: '100%', maxWidth: '440px',
            padding: '28px', position: 'relative', boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
          }}>
            <button onClick={() => setCancelModal(false)} style={{
              position: 'absolute', top: 10, right: 15, background: 'transparent',
              border: 'none', fontSize: '24px', cursor: 'pointer', color: c.secondaryText,
            }}>&times;</button>
            <h3 style={{ margin: '0 0 6px 0', color: c.text }}>Cancel Booking</h3>
            <p style={{ margin: '0 0 20px 0', color: c.secondaryText, fontSize: '14px' }}>
              You are cancelling your booking for <strong style={{ color: c.text }}>{selectedBooking.title}</strong>.
            </p>
            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: c.secondaryText }}>
                Move-out Date
              </label>
              <input
                type="date"
                value={cancelMoveOutDate}
                onChange={e => setCancelMoveOutDate(e.target.value)}
                style={{
                  width: '100%', padding: '10px 12px', borderRadius: '8px', fontSize: '14px',
                  border: `1px solid ${c.border}`, background: c.inputBg, color: c.text,
                  boxSizing: 'border-box',
                }}
              />
            </div>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: c.secondaryText }}>
                Reason for Cancellation
              </label>
              <textarea
                rows={3}
                placeholder="Enter reason..."
                value={cancelReason}
                onChange={e => setCancelReason(e.target.value)}
                style={{
                  width: '100%', padding: '10px 12px', borderRadius: '8px', fontSize: '14px',
                  border: `1px solid ${c.border}`, background: c.inputBg, color: c.text,
                  resize: 'vertical', boxSizing: 'border-box',
                }}
              />
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => setCancelModal(false)}
                style={{
                  flex: 1, padding: '12px', background: 'transparent', border: `1px solid ${c.border}`,
                  color: c.text, borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer',
                }}
              >
                Keep Booking
              </button>
              <button
                onClick={handleCancelBooking}
                style={{
                  flex: 1, padding: '12px', background: '#dc3545', border: 'none',
                  color: '#fff', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer',
                }}
              >
                Confirm Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}