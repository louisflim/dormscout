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

function getDistanceFromUserUniversity(lat, lng, userUniversity) {
  if (!lat || !lng || !userUniversity) return null;
  const userUni = UNIVERSITIES.find(uni => uni.name === userUniversity || uni.abbr === userUniversity);
  if (!userUni) return null;
  const distance = getDistanceFromLatLonInKm(lat, lng, userUni.coords[0], userUni.coords[1]);
  return { ...userUni, distance };
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
  const [maxDistance, setMaxDistance]       = useState(100);
  const [maxPrice, setMaxPrice]             = useState(50000);
  const [schoolFilter, setSchoolFilter]     = useState('all');
  const [genderPolicyFilter, setGenderPolicyFilter] = useState('all');
  const [showFilters, setShowFilters]       = useState(false);
  const [landlordProfile, setLandlordProfile] = useState(() => {
    try { return JSON.parse(localStorage.getItem('dormscout_landlord_profile') || '{}'); } catch (_) { return {}; }
  });

  const { createBooking, getPendingCount, subscribeToBookings } = useBooking();
  const { user, addBooking } = useAuth();
  const navigate = useNavigate();
  const isLandlord = user?.userType === 'landlord';
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
    mapInstance.current = L.map(mapRef.current, { center: CENTER, zoom: 13, scrollWheelZoom: true });
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
    const baseFiltered = searchMatchesUniversity
      ? listings.filter(l => l.university && l.university.toLowerCase().includes(s))
      : listings.filter(l => !search.trim() || matchesSearch(l, s));
    const finalFiltered = baseFiltered.filter(l => {
      if (Number(l.price) > maxPrice) return false;
      if (isLandlord) {
        if (l.landlordId && user?.id && l.landlordId !== user.id) return false;
        if (genderPolicyFilter !== 'all' && l.genderPolicy !== genderPolicyFilter) return false;
      } else {
        const dist = user?.school
          ? getDistanceFromUserUniversity(l.lat, l.lng, user.school)
          : getNearestUniversity(l.lat, l.lng);
        if (dist && dist.distance > maxDistance) return false;
        if (schoolFilter === 'myschool' && user?.school) {
          const listingUni = getNearestUniversity(l.lat, l.lng);
          if (listingUni?.name !== user.school) return false;
        }
      }
      return true;
    });
    markersRef.current = finalFiltered
      .filter(l => l.lat && l.lng)
      .map((listing) => {
        const marker = L.marker([listing.lat, listing.lng], { icon: orangePinIcon }).addTo(mapInstance.current);
        marker.on('click', () => setSelectedListing(listing));
        return marker;
      });
  }, [listings, search, maxDistance, maxPrice, schoolFilter, genderPolicyFilter, user, isLandlord]);

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

    // Check if tenant already has an active/pending booking
    if (user?.userType === 'tenant') {
      const existingBookings = user?.bookings || [];
      const activeBooking = existingBookings.find(b => 
        (b.status === 'pending' || b.status === 'confirmed' || b.status === 'accepted')
      );
      if (activeBooking) {
        alert('❌ You already have an active booking. Please cancel it before booking another dorm.');
        return;
      }
      // Also check the shared 'bookings' key
      try {
        const sharedBookings = JSON.parse(localStorage.getItem('bookings') || '[]');
        const confirmedBooking = sharedBookings.find(b => b.tenantId === user.id && b.status === 'Confirmed');
        if (confirmedBooking) {
          alert('❌ You have a confirmed booking. Please cancel it before booking another dorm.');
          return;
        }
      } catch (_) {}
    }

    // Gender-based booking restriction
    const userGender = user?.gender;
    const policy = listing?.genderPolicy;
    

    
    // Strict gender check - BLOCK if policy doesn't match gender
    if (policy && policy !== 'Both') {
      if (!userGender) {
        alert('❌ Please update your profile with your gender information.');
        return;
      }
      if (policy === 'Girls Only' && userGender === 'Male') {
        alert('❌ This dorm is for GIRLS ONLY. You are a male and cannot book this property.');
        return;
      }
      if (policy === 'Boys Only' && userGender === 'Female') {
        alert('❌ This dorm is for BOYS ONLY. You are a female and cannot book this property.');
        return;
      }
    }

    setBookingStep('confirming');

    setTimeout(() => {
      // 1. Save to old storage (for backwards compatibility)
      createBooking(listing, moveInDate, user ? {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone || '',
        avatar: (user.name || 'T').split(' ').map(n => n[0]).join(''),
      } : null);
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
          listingId: listing.id,
          landlordId: listing.landlordId || null,
          landlordName: listing.landlordName || landlordProfile.businessName || landlordProfile.firstName || 'Landlord',
        });
      }

      setBookingStep('success');
    }, 1500);
  };

  const s = search.toLowerCase();
  const filteredListings = listings.filter(l => {
    if (search.trim() && !matchesSearch(l, s)) return false;
    const price = Number(l.price);
    if (price > maxPrice) return false;
    if (isLandlord) {
      // Landlord: only show their own listings
      if (l.landlordId && user?.id && l.landlordId !== user.id) return false;
      if (genderPolicyFilter !== 'all' && l.genderPolicy !== genderPolicyFilter) return false;
    } else {
      // Tenant: distance & school filters
      const dist = user?.school
        ? getDistanceFromUserUniversity(l.lat, l.lng, user.school)
        : getNearestUniversity(l.lat, l.lng);
      if (dist && dist.distance > maxDistance) return false;
      if (schoolFilter === 'myschool' && user?.school) {
        const listingUni = getNearestUniversity(l.lat, l.lng);
        if (listingUni?.name !== user.school) return false;
      }
    }
    return true;
  });
  const filteredUnis      = search.trim() ? UNIVERSITIES.filter(u => matchesUni(u, s)) : [];
  const noResults         = filteredListings.length === 0 && filteredUnis.length === 0;

  const nearest = selectedListing
    ? (user?.school ? getDistanceFromUserUniversity(selectedListing.lat, selectedListing.lng, user.school) : null) || getNearestUniversity(selectedListing.lat, selectedListing.lng)
    : null;

  return (
    <div className={`map-wrapper ${theme}`}>

      {/* Search & Filters */}
      <div className="map-search-wrap" style={{ alignItems: 'center', gap: '8px', position: 'relative' }}>
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

        {/* Filter toggle button + floating dropdown */}
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

          {/* Floating dropdown card — like the profile menu */}
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
              {/* Header */}
              <div style={{
                background: '#E8622E', color: '#fff',
                padding: '10px 14px', fontWeight: 700, fontSize: '0.85rem',
                display: 'flex', alignItems: 'center', gap: '6px',
              }}>
                ⚙️ Filters
              </div>

              {/* Filter rows */}
              <div style={{ padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: '14px' }}>

                {/* Price — both roles */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.78rem', fontWeight: 600, color: darkMode ? '#ccc' : '#555', display: 'flex', alignItems: 'center', gap: '5px' }}>💰 Max Price</span>
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, background: '#E8622E', color: '#fff', padding: '1px 7px', borderRadius: '10px' }}>₱{maxPrice.toLocaleString()}</span>
                  </div>
                  <input type="range" min="0" max="50000" step="1000" value={maxPrice}
                    onChange={(e) => setMaxPrice(Number(e.target.value))}
                    style={{ width: '100%', accentColor: '#E8622E', cursor: 'pointer' }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.62rem', opacity: 0.4 }}>
                    <span>₱0</span><span>₱50k</span>
                  </div>
                </div>

                {/* TENANT-ONLY */}
                {!isLandlord && (<>
                  <div style={{ borderTop: `1px solid ${darkMode ? '#2d3748' : '#f0f0f0'}`, paddingTop: '10px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.78rem', fontWeight: 600, color: darkMode ? '#ccc' : '#555', display: 'flex', alignItems: 'center', gap: '5px' }}>📍 Distance</span>
                      <span style={{ fontSize: '0.72rem', fontWeight: 700, background: '#E8622E', color: '#fff', padding: '1px 7px', borderRadius: '10px' }}>{maxDistance} km</span>
                    </div>
                    <input type="range" min="0" max="50" value={maxDistance}
                      onChange={(e) => setMaxDistance(Number(e.target.value))}
                      style={{ width: '100%', accentColor: '#E8622E', cursor: 'pointer' }}
                    />
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.62rem', opacity: 0.4 }}>
                      <span>0 km</span><span>50 km</span>
                    </div>
                  </div>
                  <div style={{ borderTop: `1px solid ${darkMode ? '#2d3748' : '#f0f0f0'}`, paddingTop: '10px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
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
                </>)}

                {/* LANDLORD-ONLY */}
                {isLandlord && (
                  <div style={{ borderTop: `1px solid ${darkMode ? '#2d3748' : '#f0f0f0'}`, paddingTop: '10px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
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
                const ownerName = selectedListing.landlordName || (landlordProfile.firstName ? `${landlordProfile.firstName} ${landlordProfile.lastName}`.trim() : '');
                const biz       = selectedListing.landlordBusiness || landlordProfile.businessName;
                const verified  = selectedListing.landlordVerified || landlordProfile.isVerified;
                const policy    = selectedListing.genderPolicy;
                if (!ownerName && !biz) return null;
                return (
                  <div style={{ margin: '4px 0 10px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', justifyContent: 'space-between' }}>
                      <div>
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
                      {policy && policy !== 'Both' && (
                        <span style={{ background: '#fef3c7', color: '#92400e', padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600, whiteSpace: 'nowrap', marginTop: '2px' }}>
                          ⚠️ {policy} Only
                        </span>
                      )}
                    </div>
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
                  <p className="map-modal-detail-label">{user?.school ? 'Distance From Your University' : 'Nearby University'}</p>
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
                      <button className="map-btn-contact" onClick={() => {
                        const landlord = {
                          id: selectedListing.landlordId,
                          name: selectedListing.landlordName || 'Landlord',
                          avatar: (selectedListing.landlordName || 'L').split(' ').map(n => n[0]).join(''),
                        };
                        navigate('/dashboard?section=messages', { state: { contactLandlord: landlord } });
                      }}>
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