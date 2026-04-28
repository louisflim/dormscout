import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useAuth } from '../../../context/AuthContext';
import { UNIVERSITIES, findNearestUniversity, getDistanceFromUniversity } from '../../../constants/universities';
import { listingsAPI, bookingsAPI } from '../../../utils/api';
import './Map.css';

const PRIMARY = '#E8622E';
const BLUE = '#2563EB';
const CENTER = [10.3157, 123.8854];

const orangePinIcon = L.divIcon({
  className: '',
  html: `<svg xmlns="http://www.w3.org/2000/svg" width="30" height="42" viewBox="0 0 30 42">
    <path d="M15 0C6.716 0 0 6.716 0 15c0 10.5 15 27 15 27s15-16.5 15-27C30 6.716 23.284 0 15 0z" fill="${PRIMARY}"/>
    <circle cx="15" cy="14" r="6" fill="#fff"/>
  </svg>`,
  iconSize: [30, 42],
  iconAnchor: [15, 42],
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
    iconSize: [44, 56],
    iconAnchor: [22, 56],
    popupAnchor: [0, -56],
  });
}

const matchesSearch = (l, s) =>
  (l.title && l.title.toLowerCase().includes(s)) ||
  (l.address && l.address.toLowerCase().includes(s)) ||
  (l.university && l.university.toLowerCase().includes(s));

const matchesUni = (u, s) =>
  (u.name && u.name.toLowerCase().includes(s)) ||
  (u.abbr && u.abbr.toLowerCase().includes(s));

export default function Map({ darkMode = false, userType = 'tenant', onEditListing }) {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markersRef = useRef([]);

  const [listings, setListings] = useState([]);
  const [selectedListing, setSelectedListing] = useState(null);
  const [search, setSearch] = useState('');
  const [bookingStep, setBookingStep] = useState('info');
  const [moveInDate, setMoveInDate] = useState('');
  const [maxDistance, setMaxDistance] = useState(100);
  const [maxPrice, setMaxPrice] = useState(50000);
  const [schoolFilter, setSchoolFilter] = useState('all');
  const [genderPolicyFilter, setGenderPolicyFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(true);
  const [bookingError, setBookingError] = useState('');
  const [isMounted, setIsMounted] = useState(false); // ⬅️ ADD THIS

  const { user } = useAuth();
  const navigate = useNavigate();

  const normalizedUserType = userType?.toLowerCase() || 'tenant';
  const isLandlord = normalizedUserType === 'landlord';
  const theme = darkMode ? 'dark' : 'light';

  // ⬅️ SET MOUNTED STATE AFTER RENDER
  useEffect(() => {
    setIsMounted(true);
    console.log('✅ Component mounted');
  }, []);

  // Load listings (unchanged)
  useEffect(() => {
    async function loadListings() {
      try {
        console.log('🔄 Map: Loading listings from API...');
        const data = await listingsAPI.getAllListings();
        console.log('📦 Map: Listings loaded:', data);
        setListings(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('❌ Map: Failed to load listings:', error);
        setListings([]);
      } finally {
        setLoading(false);
      }
    }
    loadListings();
  }, []);

  useEffect(() => {
    const handleUpdate = () => {
      listingsAPI.getAllListings().then(data => {
        setListings(Array.isArray(data) ? data : []);
      });
    };
    window.addEventListener('dormscout:listingUpdated', handleUpdate);
    return () => window.removeEventListener('dormscout:listingUpdated', handleUpdate);
  }, []);

  // ⬅️ FIXED: Map initialization - wait for mount
  useEffect(() => {
    // Wait for component to mount and ref to be available
    if (!isMounted) return;

    // Small delay to ensure DOM is ready
    const timer = setTimeout(() => {
      console.log('🎯 Checking mapRef after mount:', mapRef.current);

      if (!mapRef.current || mapInstance.current) {
        console.log('❌ mapRef.current is still null!');
        return;
      }

      console.log('🗺️ Creating map...');

      const map = L.map(mapRef.current, {
        center: CENTER,
        zoom: 13,
        scrollWheelZoom: true,
        preferCanvas: true,
      });

      mapInstance.current = map;

      // Add tile layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      console.log('✅ Tile layer added');

      // Add university markers
      UNIVERSITIES.forEach((uni) => {
        if (uni.coords) {
          const marker = L.marker(uni.coords, { icon: makeBlueLabel(uni.abbr) }).addTo(map);
          marker.bindPopup(`<b>${uni.name}</b>`);
        }
      });

      console.log('🗺️ Map created successfully!');
    }, 100);

    return () => clearTimeout(timer);
  }, [isMounted]);

  // Add markers for listings
  useEffect(() => {
    if (!mapInstance.current) return;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    const s = search.toLowerCase();
    const searchMatchesUniversity = search.trim() && UNIVERSITIES.some(u => matchesUni(u, s));
    const baseFiltered = searchMatchesUniversity
      ? listings.filter(l => l.university && l.university.toLowerCase().includes(s))
      : listings.filter(l => !search.trim() || matchesSearch(l, s));

    const finalFiltered = baseFiltered.filter(l => {
      if (Number(l.price) > maxPrice) return false;
      if (isLandlord) {
        if (l.landlordId && user?.id && String(l.landlordId) !== String(user.id)) return false;
        if (genderPolicyFilter !== 'all' && l.genderPolicy !== genderPolicyFilter) return false;
      } else {
        const dist = user?.school
          ? getDistanceFromUniversity(l.lat, l.lng, user.school)
          : findNearestUniversity(l.lat, l.lng);
        if (dist && dist.distance > maxDistance) return false;
        if (schoolFilter === 'myschool' && user?.school) {
          const listingUni = findNearestUniversity(l.lat, l.lng);
          if (listingUni?.name !== user.school) return false;
        }
      }
      return true;
    });

    markersRef.current = finalFiltered
      .filter(l => l.lat && l.lng)
      .map((listing) => {
        const marker = L.marker([listing.lat, listing.lng], { icon: orangePinIcon }).addTo(mapInstance.current);
        marker.on('click', () => openModal(listing));
        return marker;
      });
  }, [listings, search, maxDistance, maxPrice, schoolFilter, genderPolicyFilter, user, isLandlord]);

  const handleUniversityClick = (uni) => {
    if (mapInstance.current && uni.coords) mapInstance.current.setView(uni.coords, 15);
  };

  const openModal = (listing) => {
    setSelectedListing(listing);
    setBookingStep('info');
    setMoveInDate('');
    setBookingError('');
  };

  const closeModal = () => {
    setSelectedListing(null);
    setBookingStep('info');
    setMoveInDate('');
    setBookingError('');
  };

  const handleConfirmBooking = async (listing) => {
    if (!moveInDate) {
      setBookingError('Please select a move-in date.');
      return;
    }

    try {
      setBookingStep('confirming');

      const bookingData = {
        listingId: listing.id,
        tenantId: user?.id,
        moveInDate: moveInDate,
        tenantEmail: user?.email,
        tenantName: `${user?.firstName || ''} ${user?.lastName || ''}`.trim(),
        tenantPhone: user?.phone,
        status: 'pending'
      };

      await bookingsAPI.createBooking(bookingData);

      setBookingStep('success');
    } catch (error) {
      console.error('Booking error:', error);
      setBookingError('Failed to create booking. Please try again.');
      setBookingStep('info');
    }
  };

  const s = search.toLowerCase();
  const filteredListings = listings.filter(l => {
    if (search.trim() && !matchesSearch(l, s)) return false;
    if (Number(l.price) > maxPrice) return false;
    if (isLandlord) {
      if (l.landlordId && user?.id && String(l.landlordId) !== String(user.id)) return false;
      if (genderPolicyFilter !== 'all' && l.genderPolicy !== genderPolicyFilter) return false;
    } else {
      const dist = user?.school
        ? getDistanceFromUniversity(l.lat, l.lng, user.school)
        : findNearestUniversity(l.lat, l.lng);
      if (dist && dist.distance > maxDistance) return false;
      if (schoolFilter === 'myschool' && user?.school) {
        const listingUni = findNearestUniversity(l.lat, l.lng);
        if (listingUni?.name !== user.school) return false;
      }
    }
    return true;
  });

  const filteredUnis = search.trim() ? UNIVERSITIES.filter(u => matchesUni(u, s)) : [];
  const noResults = filteredListings.length === 0 && filteredUnis.length === 0;

  const nearest = selectedListing
    ? (user?.school ? getDistanceFromUniversity(selectedListing.lat, selectedListing.lng, user.school) : null) || findNearestUniversity(selectedListing.lat, selectedListing.lng)
    : null;

  // Remove the debug useEffect from the top - it's not needed anymore

  if (loading) {
    return (
      <div className={`map-wrapper ${theme}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2rem' }}>⏳</div>
          <p style={{ marginTop: '12px', color: darkMode ? '#a0a0b0' : '#666' }}>Loading listings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`map-wrapper ${theme}`}>
      <div className="map-search-wrap" style={{ alignItems: 'center', gap: '8px', position: 'relative' }}>
        {/* ... search input and filters ... same as before */}
        <div style={{
          flex: 1, display: 'flex', alignItems: 'center',
          background: darkMode ? '#16213e' : '#fff',
          border: `1.5px solid #5BADA8`,
          borderRadius: '10px', padding: '0 12px', gap: '6px',
        }}>
          <span style={{ opacity: 0.45, fontSize: '0.85rem' }}>🔍</span>
          <input
            type="search"
            className="map-search-input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, address, or university..."
            style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', padding: '9px 0', fontSize: '13px', color: darkMode ? '#eaeaea' : '#333' }}
          />
        </div>

        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowFilters(!showFilters)}
            style={{
              padding: '9px 14px',
              background: showFilters ? '#E8622E' : (darkMode ? '#2d3748' : '#f0f4f8'),
              color: showFilters ? '#fff' : (darkMode ? '#ccc' : '#555'),
              border: `1.5px solid ${showFilters ? '#E8622E' : (darkMode ? '#3d4a5c' : '#dde3ec')}`,
              borderRadius: '10px', cursor: 'pointer',
              fontSize: '0.82rem', fontWeight: 700,
              transition: 'all 0.2s', whiteSpace: 'nowrap',
            }}
          >
            ⚙️ Filters {showFilters ? '▲' : '▼'}
          </button>

          {showFilters && (
            <div style={{
              position: 'absolute',
              top: 'calc(100% + 8px)',
              right: 0,
              zIndex: 9999,
              width: '230px',
              background: darkMode ? '#16213e' : '#fff',
              border: `1px solid ${darkMode ? '#2d3748' : '#e2e8f0'}`,
              borderRadius: '12px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
              overflow: 'hidden',
            }}>
              <div style={{
                background: '#E8622E', color: '#fff',
                padding: '10px 14px', fontWeight: 700, fontSize: '0.85rem',
                display: 'flex', alignItems: 'center', gap: '6px',
              }}>
                ⚙️ Filters
              </div>

              <div style={{ padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.78rem', fontWeight: 600, color: darkMode ? '#ccc' : '#555' }}>💰 Max Price</span>
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, background: '#E8622E', color: '#fff', padding: '1px 7px', borderRadius: '10px' }}>₱{maxPrice.toLocaleString()}</span>
                  </div>
                  <input type="range" min="0" max="50000" step="1000" value={maxPrice}
                    onChange={(e) => setMaxPrice(Number(e.target.value))}
                    style={{ width: '100%', accentColor: '#E8622E', cursor: 'pointer' }}
                  />
                </div>

                {!isLandlord && (
                  <>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.78rem', fontWeight: 600, color: darkMode ? '#ccc' : '#555' }}>📍 Distance</span>
                        <span style={{ fontSize: '0.72rem', fontWeight: 700, background: '#E8622E', color: '#fff', padding: '1px 7px', borderRadius: '10px' }}>{maxDistance} km</span>
                      </div>
                      <input type="range" min="0" max="50" value={maxDistance}
                        onChange={(e) => setMaxDistance(Number(e.target.value))}
                        style={{ width: '100%', accentColor: '#E8622E', cursor: 'pointer' }}
                      />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <span style={{ fontSize: '0.78rem', fontWeight: 600, color: darkMode ? '#ccc' : '#555' }}>🎓 School</span>
                      <select value={schoolFilter} onChange={(e) => setSchoolFilter(e.target.value)}
                        style={{
                          padding: '6px 8px', borderRadius: '7px',
                          border: `1.5px solid ${schoolFilter !== 'all' ? '#E8622E' : (darkMode ? '#3d4a5c' : '#dde3ec')}`,
                          background: darkMode ? '#0f3460' : '#f8fafc',
                          color: darkMode ? '#fff' : '#333',
                          fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', outline: 'none', width: '100%',
                        }}>
                        <option value="all">All Schools</option>
                        {user?.school && <option value="myschool">Near {user.school}</option>}
                      </select>
                    </div>
                  </>
                )}

                {isLandlord && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span style={{ fontSize: '0.78rem', fontWeight: 600, color: darkMode ? '#ccc' : '#555' }}>⚧ Gender Policy</span>
                    <select value={genderPolicyFilter} onChange={(e) => setGenderPolicyFilter(e.target.value)}
                      style={{
                        padding: '6px 8px', borderRadius: '7px',
                        border: `1.5px solid ${genderPolicyFilter !== 'all' ? '#E8622E' : (darkMode ? '#3d4a5c' : '#dde3ec')}`,
                        background: darkMode ? '#0f3460' : '#f8fafc',
                        color: darkMode ? '#fff' : '#333',
                        fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', outline: 'none', width: '100%',
                      }}>
                      <option value="all">All Policies</option>
                      <option value="Both">Both Genders</option>
                      <option value="Female">Female Only</option>
                      <option value="Male">Male Only</option>
                    </select>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="map-container-wrap">
        <div className="map-box">
          <div ref={mapRef} className="map-inner" style={{ width: '100%', height: '520px' }} />

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
            No listings found. {isLandlord ? 'Create your first listing!' : 'Try adjusting your filters.'}
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
                openModal(listing);
              }}
            >
              <div className="map-listing-card-title">{listing.title}</div>
              <div className="map-listing-card-address">{listing.address}</div>
            </button>
          ))
        )}
      </div>

      {selectedListing && (
        <div className="map-overlay">
          <div className="map-modal">
            <button className="map-modal-close" onClick={closeModal}>&times;</button>

            <div className="map-modal-body">
              <h2 className="map-modal-title">{selectedListing.title}</h2>
              <p className="map-modal-address">{selectedListing.address}</p>

              <div className="map-modal-details-grid">
                <div>
                  <p className="map-modal-detail-label">Price</p>
                  <p className="map-modal-detail-value price">₱{Number(selectedListing.price).toLocaleString()}</p>
                </div>
                <div>
                  <p className="map-modal-detail-label">Rooms</p>
                  <p className="map-modal-detail-value">{selectedListing.availableRooms || 'N/A'}</p>
                </div>
                <div className="map-modal-detail-full">
                  <p className="map-modal-detail-label">Nearby University</p>
                  <p className="map-modal-detail-value">
                    {nearest ? `${nearest.name} (${nearest.distance.toFixed(2)} km)` : 'Location not set'}
                  </p>
                </div>
              </div>

              <p className="map-modal-desc-label">Description</p>
              <p className="map-modal-desc-text">
                {selectedListing.description || 'No description provided.'}
              </p>

              {!isLandlord ? (
                <>
                  {bookingStep === 'info' && (
                    <>
                      <button className="map-btn-book" onClick={() => setBookingStep('booking')}>
                        📅 Book This Property
                      </button>
                      <button className="map-btn-contact" onClick={() => {
                        const landlord = {
                          id: selectedListing.landlordId,
                          name: selectedListing.landlordName || 'Landlord',
                        };
                        navigate('/messages', { state: { contactLandlord: landlord } });
                      }}>
                        💬 Contact Landlord
                      </button>
                    </>
                  )}

                  {bookingStep === 'booking' && (
                    <div className="map-booking-box">
                      {bookingError && (
                        <p style={{ color: '#dc3545', fontSize: '0.85rem', marginBottom: '8px', fontWeight: 600 }}>
                          ❌ {bookingError}
                        </p>
                      )}
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
                    </div>
                  )}

                  {bookingStep === 'success' && (
                    <div className="map-success">
                      <div className="map-success-icon">✅</div>
                      <h4 className="map-success-title">Booking Request Sent!</h4>
                      <button className="map-btn-done" onClick={closeModal}>Done</button>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <button
                    className="map-btn-edit"
                    onClick={() => {
                      if (onEditListing) onEditListing(selectedListing);
                      setSelectedListing(null);
                    }}
                  >
                    ✏️ Edit Listing
                  </button>
                  <button
                    className="map-btn-delete"
                    onClick={async () => {
                      if (window.confirm('Delete this listing?')) {
                        await listingsAPI.deleteListing(selectedListing.id);
                        setListings(listings.filter(l => l.id !== selectedListing.id));
                        setSelectedListing(null);
                        window.dispatchEvent(new Event('dormscout:listingUpdated'));
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