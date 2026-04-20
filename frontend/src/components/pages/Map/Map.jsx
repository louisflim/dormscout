import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useBooking } from '../../../context/BookingContext';
import { useAuth } from '../../../context/AuthContext';
import './Map.css';

const PRIMARY     = '#E8622E';
const BLUE        = '#2563EB';
const CENTER      = [10.3157, 123.8854];
const STORAGE_KEY = 'dormscout_listings';
const BOOKING_KEY = 'dormscout_my_bookings';

const orangePinIcon = L.divIcon({
  className: '',
  html: `<svg xmlns="http://www.w3.org/2000/svg" width="30" height="42" viewBox="0 0 30 42">
    <path d="M15 0C6.716 0 0 6.716 0 15c0 10.5 15 27 15 27s15-16.5 15-27C30 6.716 23.284 0 15 0z" fill="${PRIMARY}"/>
    <circle cx="15" cy="14" r="6" fill="#fff"/>
  </svg>`,
  iconSize:    [30, 42],
  iconAnchor:  [15, 42],
  popupAnchor: [0, -42],
});

function makeBlueLabel(abbr) {
  const parts = abbr.split(/[-\s]+/);
  const isMultiLine = parts.length > 1 && abbr.length > 5;
  const fontSize = abbr.length > 6 ? 7 : abbr.length > 4 ? 8 : 9;
  let textHtml;
  if (isMultiLine) {
    const line1 = parts[0];
    const line2 = parts.slice(1).join(' ');
    textHtml = `
      <text x="22" y="18" text-anchor="middle" fill="#fff" font-size="${fontSize}" font-weight="700" font-family="sans-serif">${line1}</text>
      <text x="22" y="${18 + fontSize + 1}" text-anchor="middle" fill="#fff" font-size="${fontSize}" font-weight="700" font-family="sans-serif">${line2}</text>`;
  } else {
    textHtml = `<text x="22" y="24" text-anchor="middle" fill="#fff" font-size="${fontSize}" font-weight="700" font-family="sans-serif">${abbr}</text>`;
  }
  return L.divIcon({
    className: '',
    html: `<svg xmlns="http://www.w3.org/2000/svg" width="44" height="56" viewBox="0 0 44 56">
      <path d="M22 0C9.85 0 0 9.85 0 22c0 15.4 22 34 22 34s22-18.6 22-34C44 9.85 34.15 0 22 0z" fill="${BLUE}"/>
      ${textHtml}
    </svg>`,
    iconSize:    [44, 56],
    iconAnchor:  [22, 56],
    popupAnchor: [0, -56],
  });
}

const UNIVERSITIES = [
  { name: 'Cebu Institute of Technology - University',    abbr: 'CIT',        coords: [10.29457049495325,  123.8810696234642]  },
  { name: 'University of San Carlos - Downtown',          abbr: 'USC-DC',     coords: [10.299533411273078, 123.89894228028311] },
  { name: 'University of the Visayas',                    abbr: 'UV',         coords: [10.298701521575332, 123.90136409833146] },
  { name: 'University of Cebu - Main',                    abbr: 'UC Main',    coords: [10.29859134168097,  123.89769041976133] },
  { name: 'University of San Carlos - Talamban',          abbr: 'USC-TC',     coords: [10.352530648303398, 123.91257785415208] },
  { name: 'University of Cebu - Banilad',                 abbr: 'UC Banilad', coords: [10.338903100091237, 123.91192294436264] },
  { name: 'University of Cebu - METC',                    abbr: 'UC METC',    coords: [10.287151042846553, 123.87788175785442] },
  { name: 'University of San Jose-Recoletos - Main',      abbr: 'USJR Main',  coords: [10.294176444197102, 123.89750739647967] },
  { name: 'University of San Jose-Recoletos - Basak',     abbr: 'USJR Basak', coords: [10.290123577674795, 123.8624596247838]  },
  { name: 'Cebu Normal University',                       abbr: 'CNU',        coords: [10.301911563323149, 123.8962597988632]  },
  { name: 'University of the Philippines Cebu',           abbr: 'UP',         coords: [10.32250556542723,  123.89824335176846] },
  { name: 'Southwestern University PHINMA',               abbr: 'SWU',        coords: [10.303344727301218, 123.89140215600317] },
  { name: 'Cebu Technological University',                abbr: 'CTU',        coords: [10.297444457685753, 123.90659062522744] },
  { name: "Saint Theresa's College",                      abbr: 'STC',        coords: [10.3127944559912,   123.89601129648001] },
  { name: 'Asian College of Technology',                  abbr: 'ACT',        coords: [10.298830349299022, 123.89590624741045] },
];

function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
  const R    = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a    =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function getNearestUniversity(lat, lng) {
  if (!lat || !lng) return null;
  let nearest = null, minDistance = Infinity;
  UNIVERSITIES.forEach((uni) => {
    const distance = getDistanceFromLatLonInKm(lat, lng, uni.coords[0], uni.coords[1]);
    if (distance < minDistance) { minDistance = distance; nearest = { ...uni, distance }; }
  });
  return nearest;
}

const matchesSearch = (l, s) =>
  (l.title    && l.title.toLowerCase().includes(s))    ||
  (l.address  && l.address.toLowerCase().includes(s))  ||
  (l.university && l.university.toLowerCase().includes(s));

const matchesUni = (u, s) =>
  (u.name && u.name.toLowerCase().includes(s)) ||
  (u.abbr && u.abbr.toLowerCase().includes(s));

function getReviewStats(listingId) {
  try {
    const all = JSON.parse(localStorage.getItem('dormscout_listing_reviews') || '{}');
    const reviews = all[listingId] || [];
    if (!reviews.length) return { avg: 0, count: 0 };
    const avg = reviews.reduce((s, r) => s + (r.rating || 0), 0) / reviews.length;
    return { avg, count: reviews.length };
  } catch (_) { return { avg: 0, count: 0 }; }
}

function StarDisplay({ rating, count }) {
  const full  = Math.floor(rating);
  const half  = rating - full >= 0.5;
  const empty = 5 - full - (half ? 1 : 0);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
      <span style={{ color: '#f59e0b', fontSize: '1rem', letterSpacing: '1px' }}>
        {'★'.repeat(full)}
        {half ? '½' : ''}
        {'☆'.repeat(empty < 0 ? 0 : empty)}
      </span>
      <span style={{ fontSize: '0.82rem', color: '#888' }}>
        {count > 0 ? `${rating.toFixed(1)} (${count} review${count !== 1 ? 's' : ''})` : 'No reviews yet'}
      </span>
    </div>
  );
}

export default function Map({ darkMode = false, userType = 'tenant', onEditListing }) {
  const mapRef        = useRef(null);
  const mapInstance   = useRef(null);
  const markersRef    = useRef([]);
  const uniMarkersRef = useRef([]);

  const [listings, setListings]           = useState([]);
  const [selectedListing, setSelectedListing] = useState(null);
  const [search, setSearch]               = useState('');
  const [bookingStep, setBookingStep]     = useState('info');
  const [moveInDate, setMoveInDate]       = useState('');
  const [pendingCounts, setPendingCounts] = useState({});
  const [landlordProfile, setLandlordProfile] = useState(() => {
    try { return JSON.parse(localStorage.getItem('dormscout_landlord_profile') || '{}'); } catch (_) { return {}; }
  });

  const { createBooking, getPendingCount, subscribeToBookings } = useBooking();
  const { user, addBooking, addActivity } = useAuth();
  const navigate = useNavigate();
  const theme = darkMode ? 'dark' : 'light';

  // Real-time pending booking counts
  useEffect(() => {
    function updatePendingCounts() {
      const counts = {};
      listings.forEach(listing => {
        counts[listing.id] = getPendingCount(listing.id);
      });
      setPendingCounts(counts);
    }

    updatePendingCounts();
    const unsubscribe = subscribeToBookings(updatePendingCounts);

    return () => unsubscribe();
  }, [listings, getPendingCount, subscribeToBookings]);

  // Reload landlord profile when it updates
  useEffect(() => {
    function onProfileUpdate() {
      try { setLandlordProfile(JSON.parse(localStorage.getItem('dormscout_landlord_profile') || '{}')); } catch (_) {}
    }
    window.addEventListener('dormscout:profileUpdated', onProfileUpdate);
    return () => window.removeEventListener('dormscout:profileUpdated', onProfileUpdate);
  }, []);

  useEffect(() => {
    function loadListings() {
      const raw = localStorage.getItem(STORAGE_KEY);
      setListings(raw ? JSON.parse(raw) || [] : []);
    }
    loadListings();
    window.addEventListener('storage', loadListings);
    return () => window.removeEventListener('storage', loadListings);
  }, []);

  useEffect(() => {
    if (!mapRef.current) return;
    mapInstance.current = L.map(mapRef.current, { center: CENTER, zoom: 13, scrollWheelZoom: false });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; OpenStreetMap contributors' }).addTo(mapInstance.current);
    uniMarkersRef.current = UNIVERSITIES.map((uni) => {
      const marker = L.marker(uni.coords, { icon: makeBlueLabel(uni.abbr) }).addTo(mapInstance.current);
      marker.bindPopup(`<b>${uni.name}</b>`);
      marker.on('click', () => handleUniversityClick(uni));
      return marker;
    });
    return () => { mapInstance.current.remove(); mapInstance.current = null; uniMarkersRef.current = []; };
  }, []);

  useEffect(() => {
    if (!mapInstance.current) return;
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];
    const s = search.toLowerCase();
    const searchMatchesUniversity = search.trim() && UNIVERSITIES.some(u => matchesUni(u, s));
    const finalFiltered = searchMatchesUniversity
      ? listings.filter(l => l.university && l.university.toLowerCase().includes(s))
      : listings.filter(l => !search.trim() || matchesSearch(l, s));
    markersRef.current = finalFiltered
      .filter(l => l.lat && l.lng)
      .map((listing) => {
        const marker = L.marker([listing.lat, listing.lng], { icon: orangePinIcon }).addTo(mapInstance.current);
        marker.on('click', () => setSelectedListing(listing));
        return marker;
      });
  }, [listings, search]);

  const handleUniversityClick = (uni) => {
    if (mapInstance.current && uni.coords) mapInstance.current.setView(uni.coords, 15);
  };

  const closeModal = () => {
    setSelectedListing(null);
    setBookingStep('info');
    setMoveInDate('');
  };

  const handleConfirmBooking = (listing) => {
    if (!moveInDate) { alert('Please select a move-in date.'); return; }
    setBookingStep('confirming');

    setTimeout(() => {
      // 1. Save to old storage (for backwards compatibility)
      createBooking(listing, moveInDate);
      const raw = localStorage.getItem(BOOKING_KEY);
      const current = raw ? JSON.parse(raw) : [];
      if (!current.find(b => b.id === listing.id)) {
        localStorage.setItem(BOOKING_KEY, JSON.stringify([
          ...current,
          { id: listing.id, bookedAt: new Date().toISOString(), moveInDate, status: 'pending' }
        ]));
      }

      // 2. ✅ Save to AuthContext (for Overview dashboard)
      if (user) {
        addBooking({
          dormName: listing.title,
          address: listing.address,
          price: listing.price,
          room: listing.rooms,
          landlord: landlordProfile.businessName || landlordProfile.firstName || 'Landlord',
          moveInDate,
          lat: listing.lat,
          lng: listing.lng,
          university: listing.university,
          tags: listing.tags,
          availableRooms: listing.availableRooms,
          images: listing.images,
          description: listing.description,
          status: 'pending',
        });
      }

      setBookingStep('success');
    }, 1500);
  };

  const s = search.toLowerCase();
  const filteredListings  = listings.filter(l => !search.trim() || matchesSearch(l, s));
  const filteredUnis      = search.trim() ? UNIVERSITIES.filter(u => matchesUni(u, s)) : [];
  const noResults         = filteredListings.length === 0 && filteredUnis.length === 0;

  const nearest = selectedListing
    ? getNearestUniversity(selectedListing.lat, selectedListing.lng)
    : null;

  return (
    <div className={`map-wrapper ${theme}`}>

      {/* Search */}
      <div className="map-search-wrap">
        <input
          type="search"
          className="map-search-input"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, address, or university..."
        />
      </div>

      {/* Map */}
      <div className="map-container-wrap">
        <div className="map-box">
          <div ref={mapRef} className="map-inner" />

          <div className="map-legend">
            <div className="map-legend-title">Legend</div>
            <div className="map-legend-row">
              <svg width="16" height="22" viewBox="0 0 30 42">
                <path d="M15 0C6.716 0 0 6.716 0 15c0 10.5 15 27 15 27s15-16.5 15-27C30 6.716 23.284 0 15 0z" fill="#E8622E"/>
                <circle cx="15" cy="14" r="6" fill="#fff"/>
              </svg>
              <span>Dorms</span>
            </div>
            <div className="map-legend-row">
              <svg width="16" height="22" viewBox="0 0 30 42">
                <path d="M15 0C6.716 0 0 6.716 0 15c0 10.5 15 27 15 27s15-16.5 15-27C30 6.716 23.284 0 15 0z" fill="#2563EB"/>
                <circle cx="15" cy="14" r="6" fill="#fff"/>
              </svg>
              <span>Universities</span>
            </div>
          </div>
        </div>
      </div>

      {/* Cards */}
      <div className="map-cards-grid">
        {filteredUnis.map((uni) => (
          <button
            key={`uni-${uni.abbr}`}
            type="button"
            className="map-card-btn map-uni-card"
            onClick={() => handleUniversityClick(uni)}
          >
            <div className="map-uni-card-name">📍 {uni.name}</div>
            <div className="map-uni-card-hint">Click to zoom to campus</div>
          </button>
        ))}

        {noResults ? (
          <div className="map-empty-state">
            No listings or universities found. Try another search term.
          </div>
        ) : (
          filteredListings.map((listing) => (
            <button
              key={listing.id}
              type="button"
              className="map-card-btn map-listing-card"
              onClick={() => {
                if (listing.lat && listing.lng && mapInstance.current)
                  mapInstance.current.setView([listing.lat, listing.lng], 15);
              }}
            >
              <div className="map-listing-card-title">
                {listing.title}
                {landlordProfile.isVerified && (
                  <span title="Verified Landlord" style={{ marginLeft: '6px', color: '#16a34a', fontSize: '0.85rem' }}>✅</span>
                )}
              </div>
              {landlordProfile.businessName && (
                <div style={{ fontSize: '0.78rem', color: '#E8622E', fontWeight: 600, marginBottom: '2px' }}>
                  🏢 {landlordProfile.businessName}
                </div>
              )}
              <div className="map-listing-card-address">{listing.address}</div>
              {(() => {
                const { avg, count } = getReviewStats(listing.id);
                if (!count) return null;
                return (
                  <div style={{ fontSize: '0.8rem', color: '#f59e0b', marginTop: '2px' }}>
                    {'★'.repeat(Math.floor(avg))}{'☆'.repeat(5 - Math.floor(avg))}{' '}
                    <span style={{ color: '#888' }}>({count})</span>
                  </div>
                );
              })()}
              <div className="map-listing-card-pending">
                {pendingCounts[listing.id] > 0 && (
                  <span className="map-listing-card-pending-count">
                    {pendingCounts[listing.id]} pending booking{pendingCounts[listing.id] !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
            </button>
          ))
        )}
      </div>

      {/* Modal */}
      {selectedListing && (
        <div className="map-overlay">
          <div className="map-modal">
            <button className="map-modal-close" onClick={closeModal}>&times;</button>

            <div className="map-modal-body">
              {selectedListing.images?.length > 0 && (
                <div className="map-modal-images">
                  {selectedListing.images.slice(0, 4).map((img, i) => (
                    <img key={i} src={img} alt={`Dorm ${i + 1}`} className="map-modal-img" />
                  ))}
                </div>
              )}

              <h2 className="map-modal-title">{selectedListing.title}</h2>
              <p className="map-modal-address">{selectedListing.address}</p>

              {/* Owner / Business Info */}
              {(() => {
                const ownerName = [landlordProfile.firstName, landlordProfile.lastName].filter(Boolean).join(' ');
                const biz       = landlordProfile.businessName;
                const verified  = landlordProfile.isVerified;
                if (!ownerName && !biz) return null;
                return (
                  <div style={{ margin: '4px 0 10px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                    {ownerName && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem', fontWeight: 600 }}>
                        <span>👤 {ownerName}</span>
                        {verified && <span title="Verified Landlord" style={{ color: '#16a34a', fontSize: '1rem' }}>✅</span>}
                      </div>
                    )}
                    {biz && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: '#666' }}>
                        <span>🏢 {biz}</span>
                        {verified && !ownerName && <span title="Verified Business" style={{ color: '#16a34a' }}>✅</span>}
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Stars & Reviews */}
              {(() => {
                const { avg, count } = getReviewStats(selectedListing.id);
                return <div style={{ marginBottom: '12px' }}><StarDisplay rating={avg} count={count} /></div>;
              })()}

              <div className="map-modal-details-grid">
                <div>
                  <p className="map-modal-detail-label">Price</p>
                  <p className="map-modal-detail-value price">₱{Number(selectedListing.price).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                </div>
                <div>
                  <p className="map-modal-detail-label">Rooms</p>
                  <p className="map-modal-detail-value">{selectedListing.availableRooms || 'N/A'}</p>
                </div>
                <div className="map-modal-detail-full">
                  <p className="map-modal-detail-label">Nearby University</p>
                  <p className="map-modal-detail-value">
                    {nearest
                      ? `${nearest.name} (${nearest.distance.toFixed(2)} km)`
                      : 'Location not set'}
                  </p>
                </div>
              </div>

              <p className="map-modal-desc-label">Description</p>
              <p className="map-modal-desc-text">
                {selectedListing.description || 'No description provided.'}
              </p>

              {userType === 'tenant' ? (
                <>
                  {bookingStep === 'info' && (
                    <>
                      <button className="map-btn-book" onClick={() => setBookingStep('booking')}>
                        📅 Book This Property
                      </button>
                      <button className="map-btn-contact" onClick={() => alert('Contact landlord functionality coming soon!')}>
                        💬 Contact Landlord
                      </button>
                      <button className="map-btn-report" onClick={() => navigate('/report')}>
                        🚩 Report Listing
                      </button>
                    </>
                  )}

                  {bookingStep === 'booking' && (
                    <div className="map-booking-box">
                      <h4>📅 Select Move-in Date</h4>
                      <input
                        type="date"
                        className="map-date-input"
                        value={moveInDate}
                        onChange={(e) => setMoveInDate(e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                      />
                      <button className="map-btn-confirm" onClick={() => handleConfirmBooking(selectedListing)}>
                        ✔ Confirm Booking
                      </button>
                      <button className="map-btn-back" onClick={() => setBookingStep('info')}>
                        ← Back
                      </button>
                    </div>
                  )}

                  {bookingStep === 'confirming' && (
                    <div className="map-confirming">
                      <div className="map-confirming-icon">⏳</div>
                      <p className="map-confirming-title">Confirming booking...</p>
                      <p className="map-confirming-subtitle">Please wait</p>
                    </div>
                  )}

                  {bookingStep === 'success' && (
                    <div className="map-success">
                      <div className="map-success-icon">✅</div>
                      <h4 className="map-success-title">Booking Request Sent!</h4>
                      <p className="map-success-subtitle">
                        Your booking request has been sent to the landlord.
                      </p>
                      <p className="map-success-meta">
                        Move-in date: <strong>{moveInDate}</strong> · Status:{' '}
                        <span className="map-success-status">Pending</span>
                      </p>
                      <button className="map-btn-done" onClick={closeModal}>Done</button>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <button
                    className="map-btn-edit"
                    onClick={() => { if (onEditListing) onEditListing(selectedListing); setSelectedListing(null); }}
                  >
                    ✏️ Edit Listing
                  </button>
                  <button
                    className="map-btn-delete"
                    onClick={() => {
                      if (window.confirm('Delete this listing?')) {
                        const newListings = listings.filter((l) => l.id !== selectedListing.id);
                        localStorage.setItem('dormscout_listings', JSON.stringify(newListings));
                        setListings(newListings);
                        setSelectedListing(null);
                      }
                    }}
                  >
                    🗑️ Delete Listing
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}