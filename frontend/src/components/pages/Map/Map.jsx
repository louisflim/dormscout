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
import { 
  Search, 
  SlidersHorizontal, 
  ChevronDown, 
  ChevronUp, 
  MapPin, 
  Banknote, 
  GraduationCap, Home,
  DoorOpen,
  Layers,
  Ruler,
  CalendarDays,
  MessageCircle,
  Pencil,
  CheckCircle2,
  ShieldCheck,
  ShieldAlert,
  Venus,
  Mars,
  CircleDot,
  Loader2,
  University,
  Bookmark,
  X } from 'lucide-react';

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
    ? { Icon: Venus,     label: 'Girls Only', color: '#ec4899', bg: 'rgba(236,72,153,0.1)' }
    : p.includes('boy') || p.includes('male')
    ? { Icon: Mars,      label: 'Boys Only',  color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' }
    : { Icon: CircleDot, label: 'Mixed',       color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)' };
  const { Icon } = config;
  return (
    <span className="map-gender-badge" style={{ color: config.color, background: config.bg }}>
      <Icon size={12} strokeWidth={2.5} />
      {config.label}
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
        setBookmarkedIds(new Set(bms.map(b => String(b.listingId))));
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
      if (genderPolicyFilter !== 'all' && l.genderPolicy !== genderPolicyFilter) return false;
      if (isLandlord) {
        const ownerId = l.landlord?.id ?? l.landlordId;
        if (ownerId && user?.id && String(ownerId) !== String(user.id)) return false;
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
    if (genderPolicyFilter !== 'all' && l.genderPolicy !== genderPolicyFilter) return false;
    if (isLandlord) {
      const ownerId = l.landlord?.id ?? l.landlordId;
      if (ownerId && user?.id && String(ownerId) !== String(user.id)) return false;
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

  const handleToggleBookmark = async (listingId) => {
    if (!user?.id || isLandlordUser || bookmarkLoading) return;
    const id = String(listingId);
    setBookmarkLoading(true);
    try {
      const isSaved = bookmarkedIds.has(id);
      if (isSaved) {
        const ok = await bookmarksAPI.removeBookmark(user.id, listingId);
        if (ok) {
          setBookmarkedIds((prev) => {
            const next = new Set(prev);
            next.delete(id);
            return next;
          });
        }
      } else {
        const result = await bookmarksAPI.addBookmark(user.id, listingId);
        if (result) {
          setBookmarkedIds((prev) => new Set(prev).add(id));
        }
      }
    } finally {
      setBookmarkLoading(false);
    }
  };

  return (
    <div className={`map-wrapper ${theme}`} style={{ height: 'calc(100vh - 70px)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {loading && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.7)' }}>
          <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <Loader2 size={32} color={PRIMARY} style={{ animation: 'spin 1s linear infinite' }} />
            <p style={{ margin: 0, fontSize: 14, color: darkMode ? '#a0a0b0' : '#666' }}>Loading listings...</p>
          </div>
        </div>
      )}

      {/* 1. TOP BAR: Search & Filters */}
      <div className="map-header-section">
          {/* Search Container */}
          <div className="map-search-container">
            <div className="map-search-pill">
              <Search size={18} className="icon-muted" />
              <input
                type="search"
                className="map-search-input-refined"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, university, or tags..."
              />
              {search && (
                <button className="clear-search-btn" onClick={() => setSearch('')}>
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          {/* Filter Toggle */}
          <div style={{ position: 'relative' }}>
            <button 
              className={`filter-action-btn ${showFilters ? 'active' : ''}`}
              onClick={() => setShowFilters(!showFilters)}
            >
              <SlidersHorizontal size={18} />
              <span>Filters</span>
              {showFilters ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>

            {showFilters && (
              <div className="filter-dropdown-card">
                <div className="filter-card-content">
                  
                  {/* Price Filter */}
                  <div className="filter-section">
                    <div className="filter-section-header">
                      <div className="filter-title">
                        <Banknote size={16} className="icon-primary" />
                        <span>Monthly Rent</span>
                      </div>
                      <span className="filter-value-badge">₱{maxPrice.toLocaleString()}</span>
                    </div>
                    <input 
                      type="range" 
                      min="0" 
                      max="50000" 
                      step="500" 
                      value={maxPrice} 
                      onChange={(e) => setMaxPrice(Number(e.target.value))}
                      className="custom-range-slider"
                    />
                  </div>

                  <div className="filter-section">
                    <div className="filter-title" style={{ marginBottom: '8px' }}>
                      <CircleDot size={16} className="icon-primary" />
                      <span>Gender Policy</span>
                    </div>
                    <select
                      className="filter-select-refined"
                      value={genderPolicyFilter}
                      onChange={(e) => setGenderPolicyFilter(e.target.value)}
                    >
                      <option value="all">All</option>
                      <option value="Girls Only">Girls Only</option>
                      <option value="Boys Only">Boys Only</option>
                      <option value="Mixed">Mixed</option>
                    </select>
                  </div>

                  {!isLandlord && (
                    <>
                      {/* Distance Filter */}
                      <div className="filter-section">
                        <div className="filter-section-header">
                          <div className="filter-title">
                            <MapPin size={16} className="icon-primary" />
                            <span>Max Distance</span>
                          </div>
                          <span className="filter-value-badge">{maxDistance} km</span>
                        </div>
                        <input 
                          type="range" 
                          min="0" 
                          max="50" 
                          value={maxDistance} 
                          onChange={(e) => setMaxDistance(Number(e.target.value))}
                          className="custom-range-slider"
                        />
                      </div>

                      {/* School Filter */}
                      <div className="filter-section">
                        <div className="filter-title" style={{marginBottom: '8px'}}>
                          <GraduationCap size={16} className="icon-primary" />
                          <span>Target School</span>
                        </div>
                        <select 
                          className="filter-select-refined" 
                          value={schoolFilter} 
                          onChange={(e) => setSchoolFilter(e.target.value)}
                        >
                          <option value="all">All Locations</option>
                          {user?.school && <option value="myschool">Near {user.school}</option>}
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
                  <University size={13} color={BLUE} />
                  {uni.name}
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
                      {images.length > 0
                        ? <img src={images[0]} alt="" />
                        : <div className="img-placeholder"><Home size={22} color="#ccc" /></div>
                      }
                      <div className="sidebar-price-tag">₱{Number(listing.price).toLocaleString()}</div>
                    </div>
                    <div className="sidebar-card-content">
                      <div className="card-top">
                        <h4 className="card-title">{listing.title}</h4>
                        {landlord.verified && (
                          <ShieldCheck size={14} color="#22c55e" strokeWidth={2.5} aria-label="Verified landlord" />
                        )}
                      </div>

                      <p className="card-addr">
                        <MapPin size={11} style={{ flexShrink: 0, marginRight: 3, color: '#94a3b8' }} />
                        {listing.address}
                      </p>
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
              <button className="map-modal-close" onClick={closeModal} aria-label="Close">
                <X size={18} strokeWidth={2.5} />
              </button>
 
              <ImageCarousel images={images} title={selectedListing.title} />
 
              <div className="map-modal-body">
                <div className="map-modal-header">
                  <div className="map-modal-header-left">
                    <h2 className="map-modal-title">{selectedListing.title}</h2>
                    <p className="map-modal-address">
                      <MapPin size={13} style={{ flexShrink: 0, marginRight: 4, color: '#94a3b8' }} />
                      {selectedListing.address}
                    </p>
                  </div>
                  <div className="map-modal-price-block">
                    <span className="map-modal-price">₱{Number(selectedListing.price).toLocaleString()}</span>
                    <span className="map-modal-price-label">/month</span>
                  </div>
                </div>
 
                <div className="map-modal-badges">
                  <GenderBadge policy={selectedListing.genderPolicy} />
                  {landlord.verified
                    ? <span className="map-verified-badge"><ShieldCheck size={13} strokeWidth={2.5} /> Verified</span>
                    : <span className="map-unverified-badge"><ShieldAlert size={13} strokeWidth={2.5} /> Unverified</span>
                  }
                </div>
 
                <AvailabilityBadge availableRooms={available} totalRooms={total} />
 
                <div className="map-modal-tabs">
                  {[
                    { key: 'details',  Icon: Home,   label: 'Details'  },
                    { key: 'location', Icon: MapPin,  label: 'Location' },
                  ].map(({ key, Icon, label }) => (
                    <button
                      key={key}
                      className={`map-modal-tab ${activeTab === key ? 'active' : ''}`}
                      onClick={() => setActiveTab(key)}
                    >
                      <Icon size={14} strokeWidth={2} style={{ marginRight: 5 }} />
                      {label}
                    </button>
                  ))}
                </div>
 
                {activeTab === 'details' && (
                  <div className="map-modal-tab-content">
                    <div className="map-modal-stats">
                      <div className="map-modal-stat">
                        <Home size={16} color={PRIMARY} strokeWidth={2} />
                        <strong>{selectedListing.rooms || 'N/A'}</strong>
                        <small>Type</small>
                      </div>
                      <div className="map-modal-stat">
                        <DoorOpen size={16} color={PRIMARY} strokeWidth={2} />
                        <strong>{available}</strong>
                        <small>Avail</small>
                      </div>
                      <div className="map-modal-stat">
                        <Layers size={16} color={PRIMARY} strokeWidth={2} />
                        <strong>{total}</strong>
                        <small>Total</small>
                      </div>
                      <div className="map-modal-stat">
                        <Ruler size={16} color={PRIMARY} strokeWidth={2} />
                        <strong>{nearest ? `${nearest.distance.toFixed(1)}km` : 'N/A'}</strong>
                        <small>Dist</small>
                      </div>
                    </div>
                    {selectedListing.description && <p className="map-modal-desc-text">{selectedListing.description}</p>}
                    <div className="map-modal-tags">
                      {tags.map((tag, i) => <span key={i} className="map-modal-tag">{tag}</span>)}
                    </div>
                  </div>
                )}
 
                {activeTab === 'location' && (
                  <div className="map-modal-tab-content">
                    <div className="map-modal-minimap">
                      <MiniMap lat={coords?.lat} lng={coords?.lng} />
                    </div>
                  </div>
                )}
 
                <div className="map-modal-actions">
                  {!isLandlord ? (
                    bookingStep === 'info' ? (
                      <div className="map-modal-secondary-actions">
                        <button type="button" className="map-btn-book" onClick={() => setBookingStep('booking')}>
                          <CalendarDays size={15} strokeWidth={2.5} aria-hidden />
                          Book Now
                        </button>
                        <button
                          type="button"
                          className="map-btn-contact"
                          onClick={() => navigate('/messages', { state: { contactLandlord: { id: selectedListing.landlordId, name: landlord.name } } })}
                        >
                          <MessageCircle size={15} strokeWidth={2.5} aria-hidden />
                          Message
                        </button>
                        <button
                          type="button"
                          className={`map-btn-contact${bookmarkedIds.has(String(selectedListing.id)) ? ' map-btn-save--active' : ''}`}
                          onClick={() => handleToggleBookmark(selectedListing.id)}
                          disabled={bookmarkLoading}
                          aria-label={bookmarkedIds.has(String(selectedListing.id)) ? 'Remove bookmark' : 'Save bookmark'}
                        >
                          <Bookmark
                            size={15}
                            strokeWidth={2.5}
                            aria-hidden
                            fill={bookmarkedIds.has(String(selectedListing.id)) ? '#fff' : 'none'}
                          />
                          {bookmarkedIds.has(String(selectedListing.id)) ? 'Saved' : 'Save'}
                        </button>
                      </div>
                    ) : bookingStep === 'booking' ? (
                      <div className="map-booking-box">
                        <input type="date" className="map-date-input" value={moveInDate}
                          onChange={(e) => setMoveInDate(e.target.value)} min={getMinSchedulableDateYmd()} />
                        <button className="map-btn-confirm" onClick={() => handleConfirmBooking(selectedListing)}>
                          <CheckCircle2 size={15} strokeWidth={2.5} style={{ marginRight: 6 }} />
                          Confirm
                        </button>
                        <button className="map-btn-back" onClick={() => setBookingStep('info')}>Back</button>
                      </div>
                    ) : bookingStep === 'success' ? (
                      <div className="map-success">
                        <CheckCircle2 size={36} color="#22c55e" strokeWidth={2} style={{ marginBottom: 8 }} />
                        <h4 style={{ margin: '0 0 12px', color: '#22c55e' }}>Request Sent!</h4>
                        <button className="map-btn-done" onClick={closeModal}>Done</button>
                      </div>
                    ) : <p>Processing...</p>
                  ) : (
                    <div className="map-modal-actions">
                      <button className="map-btn-edit" onClick={() => { if (onEditListing) onEditListing(selectedListing); closeModal(); }}>
                        <Pencil size={15} strokeWidth={2.5} style={{ marginRight: 6 }} />
                        Edit Listing
                      </button>
                    </div>
                  )}
                </div>
 
                {bookingError && (
                  <p className="map-modal-warn">{bookingError}</p>
                )}
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