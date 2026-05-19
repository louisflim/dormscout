import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useAuth } from '../../../context/AuthContext';
import { UNIVERSITIES, findNearestUniversity, getDistanceFromUniversity } from '../../../constants/universities';
import { listingsAPI, bookingsAPI, activitiesAPI, bookmarksAPI, userAPI } from '../../../utils/api';
import { getMinSchedulableDateYmd, isAtLeastDaysFromToday } from '../../../utils/bookingPolicy';
import { isLandlordVerified } from '../../../utils/landlordVerification';
import ImageCarousel from '../Listing/ImageCarousel';
import './Map.css';

const PRIMARY = '#E8622E';
const BLUE = '#2563EB';
const CENTER = [10.3157, 123.8854];
const NEAR_SCHOOL_RADIUS_KM = 2;

/** Tenant map filters: "myschool" = within 2 km of profile school; "all" = distance slider. */
const passesTenantDistanceFilter = (coords, user, schoolFilter, maxDistance) => {
  if (schoolFilter === 'myschool' && user?.school) {
    const dist = getDistanceFromUniversity(coords.lat, coords.lng, user.school);
    return Boolean(dist && dist.distance <= NEAR_SCHOOL_RADIUS_KM);
  }
  const dist = user?.school
    ? getDistanceFromUniversity(coords.lat, coords.lng, user.school)
    : findNearestUniversity(coords.lat, coords.lng);
  return !dist || dist.distance <= maxDistance;
};

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


const matchesSearch = (l, s) => {
  const searchTerm = s.toLowerCase();
  return (
    (l.title?.toLowerCase().includes(searchTerm)) ||
    (l.address?.toLowerCase().includes(searchTerm)) ||
    (l.university?.toLowerCase().includes(searchTerm)) ||
    (l.description?.toLowerCase().includes(searchTerm)) || 
    (l.rooms?.toLowerCase().includes(searchTerm)) ||       
    (l.tags?.some(tag => tag.toLowerCase().includes(searchTerm))) 
  );
};

const matchesUni = (u, s) =>
  (u.name && u.name.toLowerCase().includes(s)) ||
  (u.abbr && u.abbr.toLowerCase().includes(s));

const getListingCoords = (listing) => {
  const latRaw = listing?.latitude ?? listing?.lat;
  const lngRaw = listing?.longitude ?? listing?.lng;
  const lat = Number(latRaw);
  const lng = Number(lngRaw);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { lat, lng };
};

// ── Availability Badge ───────────────────────────────────────────────────────
function AvailabilityBadge({ availableRooms, totalRooms }) {
  const available = Number(availableRooms) || 0;
  const total = Number(totalRooms) || 0;
  const pct = total > 0 ? (available / total) * 100 : 0;
  const color = available === 0 ? '#dc3545' : available <= 2 ? '#f59e0b' : '#22c55e';
  const label = available === 0 ? 'Full' : available === 1 ? '1 room left' : `${available} rooms available`;
  return (
    <div className="map-availability">
      <div className="map-availability-bar">
        <div className="map-availability-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="map-availability-label" style={{ color }}>{label}</span>
    </div>
  );
}

// ── Gender Policy Badge ──────────────────────────────────────────────────────
function GenderBadge({ policy }) {
  if (!policy) return null;
  const p = policy.toLowerCase();
  const config = p.includes('girl') || p.includes('female')
    ? { icon: '♀', label: 'Girls Only', color: '#ec4899', bg: 'rgba(236,72,153,0.1)' }
    : p.includes('boy') || p.includes('male')
    ? { icon: '♂', label: 'Boys Only', color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' }
    : { icon: '⚧', label: 'Mixed', color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)' };
  return (
    <span className="map-gender-badge" style={{ color: config.color, background: config.bg }}>
      {config.icon} {config.label}
    </span>
  );
}

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
  const [isMounted, setIsMounted] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const [bookmarkedIds, setBookmarkedIds] = useState(new Set());
  const [bookmarkLoading, setBookmarkLoading] = useState(false);
  const [landlordMetaById, setLandlordMetaById] = useState({});
  const [activeTab, setActiveTab] = useState('details'); // 'details' | 'location'
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const { user } = useAuth();
  const isLandlordUser = user?.userType === 'landlord';

  useEffect(() => {
    if (user?.id && !isLandlordUser) {
      bookmarksAPI.getBookmarks(user.id).then(bms => {
        setBookmarkedIds(new Set(bms.map(b => b.listingId)));
      });
    }
  }, [user?.id, isLandlordUser]);

  useEffect(() => {
    if (mapInstance.current) {
      setTimeout(() => {
        mapInstance.current.invalidateSize();
      }, 400); 
    }
  }, [isSidebarOpen]);

  const navigate = useNavigate();
  const normalizedUserType = userType?.toLowerCase() || 'tenant';
  const isLandlord = normalizedUserType === 'landlord';
  const theme = darkMode ? 'dark' : 'light';

  useEffect(() => { setIsMounted(true); }, []);

  useEffect(() => {
    async function loadListings() {
      try {
        const data = await listingsAPI.getAllListings();
        setListings(Array.isArray(data) ? data : []);
      } catch {
        setListings([]);
      } finally {
        setLoading(false);
      }
    }
    loadListings();
  }, []);

  const loadLandlordMeta = React.useCallback(async () => {
    const data = await userAPI.getAllUsers();
    const byId = data.reduce((acc, item) => {
      const name = item?.name || `${item?.firstName || ''} ${item?.lastName || ''}`.trim() || item?.email || 'Landlord';
      acc[String(item.id)] = { name, verified: isLandlordVerified(item) };
      return acc;
    }, {});
    setLandlordMetaById(byId);
  }, []);

  useEffect(() => { loadLandlordMeta(); }, [loadLandlordMeta]);

  useEffect(() => {
    const onFocus = () => loadLandlordMeta();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [loadLandlordMeta]);

  useEffect(() => {
    const handleUpdate = () => {
      listingsAPI.getAllListings().then(data => setListings(Array.isArray(data) ? data : []));
      loadLandlordMeta();
    };
    window.addEventListener('dormscout:listingUpdated', handleUpdate);
    window.addEventListener('dormscout:verificationUpdated', handleUpdate);
    return () => {
      window.removeEventListener('dormscout:listingUpdated', handleUpdate);
      window.removeEventListener('dormscout:verificationUpdated', handleUpdate);
    };
  }, [loadLandlordMeta]);

  const openModal = useCallback(async (listing) => {
    setSelectedListing(listing);
    setBookingStep('info');
    setMoveInDate('');
    setBookingError('');
    setActiveTab('details');
    loadLandlordMeta();
    if (listing?.id) {
      try {
        const fresh = await listingsAPI.getListingById(listing.id);
        if (fresh) setSelectedListing(fresh);
      } catch { /* keep listing from map */ }
    }
  }, [loadLandlordMeta]);

  useEffect(() => {
    if (!isMounted) return;
    const timer = setTimeout(() => {
      if (!mapRef.current || mapInstance.current) return;
      const map = L.map(mapRef.current, {
        center: CENTER, zoom: 13, scrollWheelZoom: true,
        preferCanvas: true, attributionControl: false,
      });
      mapInstance.current = map;
      L.control.attribution({ position: 'bottomleft' }).addTo(map);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors', maxZoom: 19,
      }).addTo(map);
      UNIVERSITIES.forEach((uni) => {
        if (uni.coords) {
          const marker = L.marker(uni.coords, { icon: makeBlueLabel(uni.abbr) }).addTo(map);
          marker.bindPopup(`<b>${uni.name}</b>`);
        }
      });
      setTimeout(() => map.invalidateSize(), 50);
      setMapReady(true);
    }, 100);
    return () => {
      clearTimeout(timer);
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
        setMapReady(false);
      }
    };
  }, [isMounted]);

  useEffect(() => {
    if (!mapInstance.current || !mapReady) return;
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
        const ownerId = l.landlord?.id ?? l.landlordId;
        if (ownerId && user?.id && String(ownerId) !== String(user.id)) return false;
        if (genderPolicyFilter !== 'all' && l.genderPolicy !== genderPolicyFilter) return false;
      } else {
        const coords = getListingCoords(l);
        if (!coords) return false;
        if (!passesTenantDistanceFilter(coords, user, schoolFilter, maxDistance)) return false;
      }
      return true;
    });
    const withCoords = finalFiltered
      .map((l) => ({ listing: l, coords: getListingCoords(l) }))
      .filter((item) => Boolean(item.coords));
    markersRef.current = withCoords.map(({ listing, coords }) => {
      const marker = L.marker([coords.lat, coords.lng], { icon: orangePinIcon }).addTo(mapInstance.current);
      marker.on('click', () => openModal(listing));
      return marker;
    });
    mapInstance.current.invalidateSize();
  }, [listings, user, isLandlord, maxDistance, maxPrice, schoolFilter, genderPolicyFilter, search, mapReady, openModal]);

  const handleUniversityClick = (uni) => {
    if (mapInstance.current && uni.coords) mapInstance.current.setView(uni.coords, 15);
  };

  const closeModal = () => {
    setSelectedListing(null);
    setBookingStep('info');
    setMoveInDate('');
    setBookingError('');
  };

  const handleConfirmBooking = async (listing) => {
    const availableRooms = Number(listing?.availableRooms) || 0;
    if (availableRooms <= 0) { setBookingError('No room available'); setBookingStep('info'); return; }
    if (!moveInDate) { setBookingError('Please select a move-in date.'); return; }
    if (!isAtLeastDaysFromToday(moveInDate)) { setBookingError('Move-in must be at least 3 days from today.'); return; }
    try {
      setBookingStep('confirming');
      const bookingData = {
        listingId: listing.id, tenantId: user?.id, moveInDate,
        tenantEmail: user?.email,
        tenantName: `${user?.firstName || ''} ${user?.lastName || ''}`.trim(),
        tenantPhone: user?.phone, status: 'pending'
      };
      const response = await bookingsAPI.createBooking(bookingData);
      if (!response?.success || !response?.booking) throw new Error(response?.message || 'Booking creation failed');
      try {
        await activitiesAPI.createActivity(user?.id, 'booking', `You sent a booking request for "${listing.title}"`, 'Just now', 'booking');
      } catch { /* ignore activity errors */ }
      window.dispatchEvent(new Event('dormscout:bookingUpdated'));
      setBookingStep('success');
    } catch (error) {
      setBookingError(error?.message || 'Failed to create booking. Please try again.');
      setBookingStep('info');
    }
  };

  const s = search.toLowerCase();
  const filteredListings = listings.filter(l => {
    if (search.trim() && !matchesSearch(l, s)) return false;
    if (Number(l.price) > maxPrice) return false;
    if (isLandlord) {
      const ownerId = l.landlord?.id ?? l.landlordId;
      if (ownerId && user?.id && String(ownerId) !== String(user.id)) return false;
      if (genderPolicyFilter !== 'all' && l.genderPolicy !== genderPolicyFilter) return false;
    } else {
      const coords = getListingCoords(l);
      if (!coords) return false;
      if (!passesTenantDistanceFilter(coords, user, schoolFilter, maxDistance)) return false;
    }
    return true;
  });

  const filteredUnis = search.trim() ? UNIVERSITIES.filter(u => matchesUni(u, s)) : [];
  const noResults = filteredListings.length === 0 && filteredUnis.length === 0;

  const nearest = selectedListing
    ? (() => {
        const coords = getListingCoords(selectedListing);
        if (!coords) return null;
        return (user?.school ? getDistanceFromUniversity(coords.lat, coords.lng, user.school) : null) || findNearestUniversity(coords.lat, coords.lng);
      })()
    : null;

  const getLandlordMeta = (listing) => {
    const fromUserList = landlordMetaById[String(listing?.landlordId)];
    const fallbackName = listing?.landlordName || 'Landlord';
    let verified = false;
    if (listing?.landlordVerified === true) verified = true;
    else if (listing?.landlordVerified === false) verified = false;
    else if (fromUserList) verified = fromUserList.verified;
    return { name: fromUserList?.name || fallbackName, verified };
  };

  return (
    <div className={`map-wrapper ${theme}`} style={{ height: 'calc(100vh - 70px)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {loading && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.7)' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2rem' }}>⏳</div>
            <p style={{ marginTop: '12px', color: darkMode ? '#a0a0b0' : '#666' }}>Loading listings...</p>
          </div>
        </div>
      )}

      {/* 1. TOP BAR: Search & Filters */}
      <div className="map-header-section">
        <div className="map-search-pill-container">
          <span className="search-icon">🔍</span>
          <input
            type="search"
            className="map-search-input-new"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, university, or tags..."
          />
        </div>
        
        <div style={{ position: 'relative' }}>
          <button 
            className={`filter-toggle-btn ${showFilters ? 'active' : ''}`}
            onClick={() => setShowFilters(!showFilters)}
          >
            ⚙️ Filters {showFilters ? '▲' : '▼'}
          </button>

          {showFilters && (
            <div className="filter-dropdown-overlay">
               <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  <div className="filter-group">
                    <div className="filter-label-row">
                      <span>💰 Max Price</span>
                      <span className="badge-orange">₱{maxPrice.toLocaleString()}</span>
                    </div>
                    <input type="range" min="0" max="50000" step="1000" value={maxPrice} onChange={(e) => setMaxPrice(Number(e.target.value))} />
                  </div>
                  {!isLandlord && (
                    <>
                      <div className="filter-group">
                        <div className="filter-label-row">
                          <span>📍 Distance</span>
                          <span className="badge-orange">{maxDistance}km</span>
                        </div>
                        <input type="range" min="0" max="50" value={maxDistance} onChange={(e) => setMaxDistance(Number(e.target.value))} />
                      </div>
                      <div className="filter-group">
                        <span>🎓 School</span>
                        <select className="filter-select" value={schoolFilter} onChange={(e) => setSchoolFilter(e.target.value)}>
                          <option value="all">All Schools</option>
                          {user?.school && <option value="myschool">Near "{user.school}"</option>}
                        </select>
                      </div>
                    </>
                  )}
               </div>
            </div>
          )}
        </div>
      </div>

      {/* 2. MAIN CONTENT: Sidebar + Map */}
        <div className="map-split-container" style={{ position: 'relative' }}>
            {/* Sleek Arrow Toggle Button */}
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className={`sidebar-toggle-tab ${isSidebarOpen ? 'is-open' : 'is-closed'}`}
              title={isSidebarOpen ? "Collapse List" : "Expand List"}
            >
              {isSidebarOpen ? '«' : '»'}
            </button>
  
            {/* LEFT SIDE: Sidebar (Now with dynamic className) */}
            <div className={`map-sidebar-results ${isSidebarOpen ? 'open' : 'closed'}`}>
              <div className="results-meta">
                Found <strong>{filteredListings.length}</strong> available dorms
              </div>
    
          {noResults ? (
            <div className="map-empty-state">
              <p>No listings found for "{search}"</p>
              <button className="clear-btn" onClick={() => {setSearch(''); setMaxPrice(50000);}}>Clear Filters</button>
            </div>
          ) : (
            <div className="sidebar-cards-list">
              {filteredUnis.map((uni) => (
                <button key={`uni-${uni.abbr}`} className="map-uni-card-compact" onClick={() => handleUniversityClick(uni)}>
                  📍 {uni.name}
                </button>
              ))}
              
              {filteredListings.map((listing) => {
                const landlord = getLandlordMeta(listing);
                const coords = getListingCoords(listing);
                const available = Number(listing.availableRooms) || 0;
                const images = Array.isArray(listing.images) ? listing.images : [];
                
                return (
                  <div 
                    key={listing.id} 
                    className="map-listing-card-sidebar"
                    onClick={() => {
                      if (coords && mapInstance.current) mapInstance.current.setView([coords.lat, coords.lng], 16);
                      openModal(listing);
                    }}
                  >
                    <div className="sidebar-card-img">
                      {images.length > 0 ? <img src={images[0]} alt="" /> : <div className="img-placeholder">🏠</div>}
                      <div className="sidebar-price-tag">₱{Number(listing.price).toLocaleString()}</div>
                    </div>
                    <div className="sidebar-card-content">
                      <div className="card-top">
                        <h4 className="card-title">{listing.title}</h4>
                      </div>
                      <p className="card-addr">📍 {listing.address}</p>
                      <div className="card-footer">
                        <GenderBadge policy={listing.genderPolicy} />
                        <span className={`avail-indicator ${available === 0 ? 'full' : 'ok'}`}>
                          ● {available === 0 ? 'Full' : `${available} left`}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* RIGHT SIDE: Map */}
        <div className="map-main-view">
          <div ref={mapRef} className="map-inner" style={{ width: '100%', height: '100%' }} />
          <div className="map-legend">
             <div className="map-legend-row">
                <div style={{width: 12, height: 12, borderRadius: '50%', background: '#E8622E'}} />
                <span>Dorms</span>
             </div>
             <div className="map-legend-row">
                <div style={{width: 12, height: 12, borderRadius: '50%', background: '#2563EB'}} />
                <span>Universities</span>
             </div>
          </div>
        </div>
      </div>

      {selectedListing && (() => {
        const landlord = getLandlordMeta(selectedListing);
        const images = Array.isArray(selectedListing.images) ? selectedListing.images : [];
        const tags = Array.isArray(selectedListing.tags) ? selectedListing.tags : [];
        const coords = getListingCoords(selectedListing);
        const available = Number(selectedListing.availableRooms) || 0;
        const total = Number(selectedListing.totalRooms) || 0;

        return (
          <div className="map-overlay">
            <div className="map-modal map-modal--rich">
              <button className="map-modal-close" onClick={closeModal}>&times;</button>
              <ImageCarousel images={images} title={selectedListing.title} />
              <div className="map-modal-body">
                <div className="map-modal-header">
                  <div className="map-modal-header-left">
                    <h2 className="map-modal-title">{selectedListing.title}</h2>
                    <p className="map-modal-address">📍 {selectedListing.address}</p>
                  </div>
                  <div className="map-modal-price-block">
                    <span className="map-modal-price">₱{Number(selectedListing.price).toLocaleString()}</span>
                    <span className="map-modal-price-label">/month</span>
                  </div>
                </div>

                <div className="map-modal-badges">
                  <GenderBadge policy={selectedListing.genderPolicy} />
                  {landlord.verified ? <span className="map-verified-badge">✓ Verified</span> : <span className="map-unverified-badge">⚠ Unverified</span>}
                </div>

                <AvailabilityBadge availableRooms={available} totalRooms={total} />

                <div className="map-modal-tabs">
                  {['details', 'location'].map(tab => (
                    <button key={tab} className={`map-modal-tab ${activeTab === tab ? 'active' : ''}`} onClick={() => setActiveTab(tab)}>
                      {tab === 'details' ? '📋 Details' : '🗺️ Location'}
                    </button>
                  ))}
                </div>

                {activeTab === 'details' && (
                  <div className="map-modal-tab-content">
                    <div className="map-modal-stats">
                      <div className="map-modal-stat"><span>🛏️</span><strong>{selectedListing.rooms || 'N/A'}</strong><small>Type</small></div>
                      <div className="map-modal-stat"><span>🚪</span><strong>{available}</strong><small>Avail</small></div>
                      <div className="map-modal-stat"><span>🏠</span><strong>{total}</strong><small>Total</small></div>
                      <div className="map-modal-stat"><span>📏</span><strong>{nearest ? `${nearest.distance.toFixed(1)}km` : 'N/A'}</strong><small>Dist</small></div>
                    </div>
                    {selectedListing.description && <p className="map-modal-desc-text">{selectedListing.description}</p>}
                    <div className="map-modal-tags">
                      {tags.map((tag, i) => <span key={i} className="map-modal-tag">{tag}</span>)}
                    </div>
                  </div>
                )}

                {activeTab === 'location' && (
                  <div className="map-modal-tab-content">
                    <div className="map-modal-minimap"><MiniMap lat={coords?.lat} lng={coords?.lng} /></div>
                  </div>
                )}

                <div className="map-modal-actions">
                  {!isLandlord ? (
                    bookingStep === 'info' ? (
                      <div className="map-modal-secondary-actions">
                        <button className="map-btn-book" onClick={() => setBookingStep('booking')}>📅 Book Now</button>
                        <button className="map-btn-contact" onClick={() => navigate('/messages', { state: { contactLandlord: { id: selectedListing.landlordId, name: landlord.name } } })}>💬 Message</button>
                      </div>
                    ) : bookingStep === 'booking' ? (
                      <div className="map-booking-box">
                        <input type="date" className="map-date-input" value={moveInDate} onChange={(e) => setMoveInDate(e.target.value)} min={getMinSchedulableDateYmd()} />
                        <button className="map-btn-confirm" onClick={() => handleConfirmBooking(selectedListing)}>✔ Confirm</button>
                        <button className="map-btn-back" onClick={() => setBookingStep('info')}>Back</button>
                      </div>
                    ) : bookingStep === 'success' ? (
                      <div className="map-success"><h4>✅ Request Sent!</h4><button className="map-btn-done" onClick={closeModal}>Done</button></div>
                    ) : <p>Processing...</p>
                  ) : (
                    <div className="map-modal-actions">
                      <button className="map-btn-edit" onClick={() => { if (onEditListing) onEditListing(selectedListing); closeModal(); }}>✏️ Edit</button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

// ── Mini map inside modal ──
function MiniMap({ lat, lng }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!ref.current || !lat || !lng) return;
    const map = L.map(ref.current, { center: [lat, lng], zoom: 15, zoomControl: false, attributionControl: false });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
    L.marker([lat, lng], { icon: orangePinIcon }).addTo(map);
    return () => map.remove();
  }, [lat, lng]);
  return <div ref={ref} style={{ width: '100%', height: '180px', borderRadius: '12px' }} />;
}