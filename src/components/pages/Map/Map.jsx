import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useBooking } from '../../../context/BookingContext';

const PRIMARY = '#E8622E';
const SECONDARY = '#5BADA8';
const CENTER = [10.3157, 123.8854];
const STORAGE_KEY = 'dormscout_listings';
const BOOKING_KEY = 'dormscout_my_bookings';

// --- Icons ---

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

const BLUE = '#2563EB';

function makeBlueLabel(abbr) {
  const parts = abbr.split(/[-\s]+/);
  const isMultiLine = parts.length > 1 && abbr.length > 5;
  const fontSize = abbr.length > 6 ? 7 : abbr.length > 4 ? 8 : 9;

  let textHtml;
  if (isMultiLine) {
    const line1 = parts[0];
    const line2 = parts.slice(1).join(' ');
    textHtml = `<text x="22" y="18" text-anchor="middle" fill="#fff" font-size="${fontSize}" font-weight="700" font-family="sans-serif">${line1}</text>
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

const UNIVERSITIES = [
  { name: 'Cebu Institute of Technology - University', abbr: 'CIT', coords: [10.29457049495325, 123.8810696234642] },
  { name: 'University of San Carlos - Downtown', abbr: 'USC-DC', coords: [10.299533411273078, 123.89894228028311] },
  { name: 'University of the Visayas', abbr: 'UV', coords: [10.298701521575332, 123.90136409833146] },
  { name: 'University of Cebu - Main', abbr: 'UC Main', coords: [10.29859134168097, 123.89769041976133] },
  { name: 'University of San Carlos - Talamban', abbr: 'USC-TC', coords: [10.352530648303398, 123.91257785415208] },
  { name: 'University of Cebu - Banilad', abbr: 'UC Banilad', coords: [10.338903100091237, 123.91192294436264] },
  { name: 'University of Cebu - METC', abbr: 'UC METC', coords: [10.287151042846553, 123.87788175785442] },
  { name: 'University of San Jose-Recoletos - Main', abbr: 'USJR Main', coords: [10.294176444197102, 123.89750739647967] },
  { name: 'University of San Jose-Recoletos - Basak', abbr: 'USJR Basak', coords: [10.290123577674795, 123.8624596247838] },
  { name: 'Cebu Normal University', abbr: 'CNU', coords: [10.301911563323149, 123.8962597988632] },
  { name: 'University of the Philippines Cebu', abbr: 'UP', coords: [10.32250556542723, 123.89824335176846] },
  { name: 'Southwestern University PHINMA', abbr: 'SWU', coords: [10.303344727301218, 123.89140215600317] },
  { name: 'Cebu Technological University', abbr: 'CTU', coords: [10.297444457685753, 123.90659062522744] },
  { name: 'Saint Theresa\'s College', abbr: 'STC', coords: [10.3127944559912, 123.89601129648001] },
  { name: 'Asian College of Technology', abbr: 'ACT', coords: [10.298830349299022, 123.89590624741045] },


];

// Helper function to calculate distance between two coordinates (in km)
function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return distance;
}

// Helper function to find nearest university
function getNearestUniversity(lat, lng) {
  if (!lat || !lng) return null;
  
  let nearest = null;
  let minDistance = Infinity;
  
  UNIVERSITIES.forEach((uni) => {
    const distance = getDistanceFromLatLonInKm(lat, lng, uni.coords[0], uni.coords[1]);
    if (distance < minDistance) {
      minDistance = distance;
      nearest = { ...uni, distance };
    }
  });
  
  return nearest;
}

export default function Map({ darkMode = false, userType = 'tenant', onEditListing }) {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markersRef = useRef([]);
  const uniMarkersRef = useRef([]);

  const [listings, setListings] = useState([]);
  const [selectedListing, setSelectedListing] = useState(null);
  const [search, setSearch] = useState('');

  // Booking flow states
  const [bookingStep, setBookingStep] = useState('info'); // 'info' | 'booking' | 'confirming' | 'success'
  const [moveInDate, setMoveInDate] = useState('');

  const { createBooking } = useBooking();

  // Theme colors
  const dk = darkMode;
  const c = {
    text: dk ? '#eaeaea' : '#333',
    secondaryText: dk ? '#a0a0b0' : '#666',
    cardBg: dk ? '#16213e' : '#fff',
    border: dk ? '#2a2a4a' : 'rgba(0,0,0,0.06)',
    overlay: dk ? 'rgba(0,0,0,0.8)' : 'rgba(0,0,0,0.5)',
  };

  // Load Listings from Storage
  useEffect(() => {
    function loadListings() {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        setListings(parsed || []);
      } else {
        setListings([]);
      }
    }

    loadListings();
    window.addEventListener('storage', loadListings);
    return () => window.removeEventListener('storage', loadListings);
  }, []);

  // Initialize Map
  useEffect(() => {
    if (!mapRef.current) return;

    mapInstance.current = L.map(mapRef.current, {
      center: CENTER,
      zoom: 13,
      scrollWheelZoom: false,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(mapInstance.current);

    // Add University Markers
    uniMarkersRef.current = UNIVERSITIES.map((uni) => {
      const marker = L.marker(uni.coords, { icon: makeBlueLabel(uni.abbr) }).addTo(mapInstance.current);
      marker.bindPopup(`<b>${uni.name}</b>`);
      marker.on('click', () => handleUniversityClick(uni));
      return marker;
    });

    return () => {
      mapInstance.current.remove();
      mapInstance.current = null;
      uniMarkersRef.current = [];
    };
  }, []);

  // Update Dorm Markers when listings change
  useEffect(() => {
    if (!mapInstance.current) return;

    // Clear old markers
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    // Filter listings based on search
    const filtered = listings.filter((l) => {
      if (!search.trim()) return true;
      const s = search.toLowerCase();
      return (
        (l.title && l.title.toLowerCase().includes(s)) ||
        (l.address && l.address.toLowerCase().includes(s)) ||
        (l.university && l.university.toLowerCase().includes(s))
      );
    });

    // Also check if search matches a university
    const searchMatchesUniversity = search.trim() && UNIVERSITIES.some(u => 
      (u.name && u.name.toLowerCase().includes(search.toLowerCase())) || 
      (u.abbr && u.abbr.toLowerCase().includes(search.toLowerCase()))
    );

    // If searching for a university, show all dorms near that university
    const finalFiltered = searchMatchesUniversity 
      ? listings.filter(l => {
          const s = search.toLowerCase();
          return l.university && l.university.toLowerCase().includes(s);
        })
      : filtered;

    // Add new markers
    markersRef.current = finalFiltered.map((listing) => {
      if (!listing.lat || !listing.lng) return null;

      const marker = L.marker([listing.lat, listing.lng], { icon: orangePinIcon })
        .addTo(mapInstance.current);

      // On click, open the modal instead of a popup
      marker.on('click', () => {
        setSelectedListing(listing);
      });

      return marker;
    }).filter(Boolean);

  }, [listings, search]);

  const handleBook = (listing) => {
    setBookingStep('booking');
  };

  const handleConfirmBooking = (listing) => {
    if (!moveInDate) {
      alert('Please select a move-in date.');
      return;
    }
    setBookingStep('confirming');
    // Simulate loading
    setTimeout(() => {
      createBooking(listing, moveInDate);
      // Also store in legacy format for BookingPage compatibility
      const rawBookings = localStorage.getItem(BOOKING_KEY);
      const currentBookings = rawBookings ? JSON.parse(rawBookings) : [];
      if (!currentBookings.find(b => b.id === listing.id)) {
        localStorage.setItem(BOOKING_KEY, JSON.stringify([...currentBookings, { id: listing.id, bookedAt: new Date().toISOString(), moveInDate, status: 'pending' }]));
      }
      setBookingStep('success');
    }, 1500);
  };

  const closeModal = () => {
    setSelectedListing(null);
    setBookingStep('info');
    setMoveInDate('');
  };

  const handleUniversityClick = (university) => {
    if (mapInstance.current && university.coords) {
      mapInstance.current.setView(university.coords, 15);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* Search Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', flexWrap: 'wrap' }}>
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, address, or university..."
          style={{
            minWidth: '300px',
            padding: '12px 16px',
            borderRadius: '14px',
            border: `1px solid ${SECONDARY}`,
            fontSize: '14px',
            outline: 'none',
            background: darkMode ? '#16213e' : '#fff',
            color: c.text
          }}
        />
      </div>

      {/* Map Container */}
      <div style={{ position: 'relative' }}>
        <div style={{
          height: '520px',
          borderRadius: '28px',
          overflow: 'hidden',
          border: `1px solid ${SECONDARY}`,
          background: darkMode ? '#0f3460' : '#fff',
          position: 'relative',
        }}>
          <div ref={mapRef} style={{ width: '100%', height: '100%' }} />

          {/* Legend */}
          <div style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: darkMode ? 'rgba(22,33,62,0.9)' : 'rgba(255,255,255,0.95)',
            borderRadius: '12px',
            padding: '12px 16px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            zIndex: 1000,
            fontSize: '13px',
            color: c.text,
          }}>
            <div style={{ fontWeight: 700, marginBottom: '8px', fontSize: '14px' }}>Legend</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <svg width="16" height="22" viewBox="0 0 30 42"><path d="M15 0C6.716 0 0 6.716 0 15c0 10.5 15 27 15 27s15-16.5 15-27C30 6.716 23.284 0 15 0z" fill={PRIMARY}/><circle cx="15" cy="14" r="6" fill="#fff"/></svg>
              <span>Dorms</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <svg width="16" height="22" viewBox="0 0 30 42"><path d="M15 0C6.716 0 0 6.716 0 15c0 10.5 15 27 15 27s15-16.5 15-27C30 6.716 23.284 0 15 0z" fill={BLUE}/><circle cx="15" cy="14" r="6" fill="#fff"/></svg>
              <span>Universities</span>
            </div>
          </div>
        </div>
      </div>

      {/* Listing Cards below Map */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
        {/* Universities matching search */}
        {search.trim() && UNIVERSITIES.filter(u => {
          const s = search.toLowerCase();
          return (u.name && u.name.toLowerCase().includes(s)) || (u.abbr && u.abbr.toLowerCase().includes(s));
        }).map((university) => (
          <button
            key={`uni-${university.abbr}`}
            type="button"
            onClick={() => handleUniversityClick(university)}
            style={{
              padding: '18px',
              borderRadius: '22px',
              border: `2px solid ${BLUE}`,
              background: c.cardBg,
              color: c.text,
              textAlign: 'left',
              cursor: 'pointer',
              transition: 'transform 0.2s'
            }}
          >
            <div style={{ fontSize: '16px', fontWeight: 700, marginBottom: '6px', color: BLUE }}>📍 {university.name}</div>
            <div style={{ color: c.secondaryText, fontSize: '13px' }}>Click to zoom to campus</div>
          </button>
        ))}
        
        {/* Listings matching search */}
        {listings.filter(l => !search.trim() || (l.title && l.title.toLowerCase().includes(search.toLowerCase())) || (l.address && l.address.toLowerCase().includes(search.toLowerCase())) || (l.university && l.university.toLowerCase().includes(search.toLowerCase()))).length === 0 && (!search.trim() || UNIVERSITIES.filter(u => (u.name && u.name.toLowerCase().includes(search.toLowerCase())) || (u.abbr && u.abbr.toLowerCase().includes(search.toLowerCase()))).length === 0) ? (
          <div style={{ padding: '24px', borderRadius: '20px', background: c.cardBg, border: `1px solid ${SECONDARY}`, color: c.text }}>
            No listings or universities found. Try another search term.
          </div>
        ) : (
          listings.filter(l => !search.trim() || (l.title && l.title.toLowerCase().includes(search.toLowerCase())) || (l.address && l.address.toLowerCase().includes(search.toLowerCase())) || (l.university && l.university.toLowerCase().includes(search.toLowerCase()))).map((listing) => (
            <button
              key={listing.id}
              type="button"
              onClick={() => {
                if (listing.lat && listing.lng && mapInstance.current) {
                  mapInstance.current.setView([listing.lat, listing.lng], 15);
                }
              }}
              style={{
                padding: '18px',
                borderRadius: '22px',
                border: `1px solid ${SECONDARY}`,
                background: c.cardBg,
                color: c.text,
                textAlign: 'left',
                cursor: 'pointer',
                transition: 'transform 0.2s'
              }}
            >
              <div style={{ fontSize: '16px', fontWeight: 700, marginBottom: '6px' }}>{listing.title}</div>
              <div style={{ color: c.secondaryText, fontSize: '13px' }}>{listing.address}</div>
            </button>
          ))
        )}
      </div>

      {/* --- MODAL for Selected Listing --- */}
      {selectedListing && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: c.overlay,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 2000, // Higher than map
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
              onClick={closeModal}
              style={{
                position: 'absolute', top: 10, right: 15,
                background: 'transparent', border: 'none',
                fontSize: '24px', cursor: 'pointer', color: c.secondaryText
              }}
            >
              &times;
            </button>

            <div style={{ padding: '24px' }}>
              {/* Image Preview */}
              {selectedListing.images && selectedListing.images.length > 0 && (
                <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', marginBottom: '16px', paddingBottom: '8px' }}>
                  {selectedListing.images.slice(0, 4).map((img, i) => (
                    <img key={i} src={img} alt={`Dorm ${i + 1}`} style={{
                      width: '120px', height: '80px', objectFit: 'cover', borderRadius: '8px', flexShrink: 0,
                      border: `1px solid ${c.border}`
                    }} />
                  ))}
                </div>
              )}

              <h2 style={{ margin: '0 0 5px 0', color: c.text }}>{selectedListing.title}</h2>
              <p style={{ margin: '0 0 20px 0', color: c.secondaryText }}>{selectedListing.address}</p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
                <div>
                  <p style={{ margin: 0, fontSize: '12px', color: c.secondaryText }}>Price</p>
                  <p style={{ margin: '4px 0 0 0', fontSize: '18px', fontWeight: '700', color: PRIMARY }}>₱{selectedListing.price}</p>
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: '12px', color: c.secondaryText }}>Rooms</p>
                  <p style={{ margin: '4px 0 0 0', fontSize: '16px', fontWeight: '600', color: c.text }}>{selectedListing.availableRooms || 'N/A'}</p>
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <p style={{ margin: 0, fontSize: '12px', color: c.secondaryText }}>Nearby University</p>
                  <p style={{ margin: '4px 0 0 0', fontSize: '16px', fontWeight: '600', color: c.text }}>
                    {getNearestUniversity(selectedListing.lat, selectedListing.lng) 
                      ? `${getNearestUniversity(selectedListing.lat, selectedListing.lng).name} (${getNearestUniversity(selectedListing.lat, selectedListing.lng).distance.toFixed(2)} km)`
                      : 'Location not set'}
                  </p>
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <p style={{ margin: '0 0 8px 0', fontSize: '12px', color: c.secondaryText }}>Description</p>
                <p style={{ margin: 0, color: c.text, fontSize: '14px', lineHeight: '1.5' }}>
                  {selectedListing.description || 'No description provided.'}
                </p>
              </div>

              {userType === 'tenant' ? (
                <>
                  {bookingStep === 'info' && (
                    <>
                      <button
                        onClick={() => handleBook(selectedListing)}
                        style={{
                          width: '100%',
                          padding: '14px',
                          background: PRIMARY,
                          color: '#fff',
                          border: 'none',
                          borderRadius: '12px',
                          fontSize: '16px',
                          fontWeight: '600',
                          cursor: 'pointer',
                          marginBottom: '10px'
                        }}
                      >
                        📅 Book This Property
                      </button>
                      <button
                        onClick={() => alert('Contact landlord functionality coming soon!')}
                        style={{
                          width: '100%',
                          padding: '12px',
                          background: SECONDARY,
                          color: '#fff',
                          border: 'none',
                          borderRadius: '12px',
                          fontSize: '15px',
                          fontWeight: '600',
                          cursor: 'pointer',
                          marginBottom: '12px'
                        }}
                      >
                        💬 Contact Landlord
                      </button>
                      <button
                        onClick={() => alert('Report functionality coming soon!')}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#ef4444',
                          fontSize: '14px',
                          fontWeight: '600',
                          cursor: 'pointer',
                          padding: '10px 0',
                          width: '100%',
                          textAlign: 'center'
                        }}
                      >
                        Report Listing
                      </button>
                    </>
                  )}

                  {bookingStep === 'booking' && (
                    <div style={{ background: darkMode ? '#0f3460' : '#f7f7f7', padding: '20px', borderRadius: '12px' }}>
                      <h4 style={{ margin: '0 0 16px 0', color: c.text, fontSize: '16px' }}>📅 Select Move-in Date</h4>
                      <input
                        type="date"
                        value={moveInDate}
                        onChange={(e) => setMoveInDate(e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                        style={{
                          width: '100%',
                          padding: '12px',
                          borderRadius: '8px',
                          border: `1px solid ${c.border}`,
                          background: darkMode ? '#16213e' : '#fff',
                          color: c.text,
                          fontSize: '15px',
                          marginBottom: '16px',
                          boxSizing: 'border-box',
                        }}
                      />
                      <button
                        onClick={() => handleConfirmBooking(selectedListing)}
                        style={{
                          width: '100%',
                          padding: '14px',
                          background: PRIMARY,
                          color: '#fff',
                          border: 'none',
                          borderRadius: '12px',
                          fontSize: '16px',
                          fontWeight: '600',
                          cursor: 'pointer',
                          marginBottom: '10px'
                        }}
                      >
                        ✔ Confirm Booking
                      </button>
                      <button
                        onClick={() => setBookingStep('info')}
                        style={{
                          width: '100%',
                          padding: '12px',
                          background: 'transparent',
                          color: c.secondaryText,
                          border: `1px solid ${c.border}`,
                          borderRadius: '12px',
                          fontSize: '14px',
                          cursor: 'pointer',
                        }}
                      >
                        ← Back
                      </button>
                    </div>
                  )}

                  {bookingStep === 'confirming' && (
                    <div style={{ textAlign: 'center', padding: '30px 0' }}>
                      <div style={{ fontSize: '40px', marginBottom: '12px' }}>⏳</div>
                      <p style={{ color: c.text, fontSize: '16px', fontWeight: '600' }}>Confirming booking...</p>
                      <p style={{ color: c.secondaryText, fontSize: '14px' }}>Please wait</p>
                    </div>
                  )}

                  {bookingStep === 'success' && (
                    <div style={{ textAlign: 'center', padding: '20px 0' }}>
                      <div style={{ fontSize: '48px', marginBottom: '12px' }}>✅</div>
                      <h4 style={{ margin: '0 0 8px 0', color: '#28a745', fontSize: '18px' }}>Booking Request Sent!</h4>
                      <p style={{ color: c.secondaryText, fontSize: '14px', margin: '0 0 8px 0' }}>
                        Your booking request has been sent to the landlord.
                      </p>
                      <p style={{ color: c.text, fontSize: '13px', margin: '0 0 20px 0' }}>
                        Move-in date: <strong>{moveInDate}</strong> · Status: <span style={{ color: '#ffc107', fontWeight: 600 }}>Pending</span>
                      </p>
                      <button
                        onClick={closeModal}
                        style={{
                          padding: '12px 32px',
                          background: PRIMARY,
                          color: '#fff',
                          border: 'none',
                          borderRadius: '12px',
                          fontSize: '15px',
                          fontWeight: '600',
                          cursor: 'pointer',
                        }}
                      >
                        Done
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <button
                    onClick={() => {
                      if (onEditListing) onEditListing(selectedListing);
                      setSelectedListing(null);
                    }}
                    style={{
                      width: '100%',
                      padding: '14px',
                      background: PRIMARY,
                      color: '#fff',
                      border: 'none',
                      borderRadius: '12px',
                      fontSize: '16px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      marginBottom: '10px'
                    }}
                  >
                    ✏️ Edit Listing
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm('Delete this listing?')) {
                        const newListings = listings.filter((l) => l.id !== selectedListing.id);
                        localStorage.setItem('dormscout_listings', JSON.stringify(newListings));
                        setListings(newListings);
                        setSelectedListing(null);
                      }
                    }}
                    style={{
                      width: '100%',
                      padding: '14px',
                      background: '#dc3545',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '12px',
                      fontSize: '16px',
                      fontWeight: '600',
                      cursor: 'pointer'
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