import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useBooking } from '../../../context/BookingContext';
import TenantManagement from '../../TenantManagement';

// --- Constants ---
const PRIMARY = '#E8622E';
const STORAGE_KEY = 'dormscout_listings';

// Fix for default marker icon
const defaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
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

// --- Helper Components ---
function SmallMap({ lat, lng }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);

  useEffect(() => {
    const node = mapRef.current;
    if (!node) return;

    // Initialize map only once
    if (!mapInstanceRef.current) {
      const map = L.map(node, {
        center: [lat || 0, lng || 0],
        zoom: 14,
        zoomControl: false,
        dragging: false,
        scrollWheelZoom: false
      });
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
      L.marker([lat, lng], { icon: defaultIcon }).addTo(map);
      mapInstanceRef.current = map;
    }

    // Cleanup function
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [lat, lng]);

  return <div ref={mapRef} style={{ width: '100%', height: '100%' }} />;
}

const filesToDataUrls = (files) => {
  const readers = Array.from(files).map((file) => {
    return new Promise((res, rej) => {
      const fr = new FileReader();
      fr.onload = () => res(fr.result);
      fr.onerror = rej;
      fr.readAsDataURL(file);
    });
  });
  return Promise.all(readers);
};

// --- Main Component ---
export default function ListingPage({ mode = 'board', darkMode = false, editListingData, onEditHandled }) {
  // --- State ---
  const [listings, setListings] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const { getPendingCount } = useBooking();

  const [form, setForm] = useState({
    title: '', address: '', price: '', rooms: '', availableRooms: '', description: '', tags: '', images: [],
    lat: null, lng: null, university: ''
  });

  const [imageFiles, setImageFiles] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [errors, setErrors] = useState({});
  const [viewMode, setViewMode] = useState(mode);
  const [selectedId, setSelectedId] = useState(null);

  // Refs
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const mountedRef = useRef(true);

  // --- Effects ---

  useEffect(() => { setViewMode(mode); }, [mode]);

  // Handle edit from Map view
  useEffect(() => {
    if (editListingData) {
      startEdit(editListingData);
      if (onEditHandled) onEditHandled();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editListingData]);

  // 1. LOAD DATA FROM LOCAL STORAGE (Only runs once on mount)
  useEffect(() => {
    mountedRef.current = true;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (mountedRef.current) setListings(parsed);
      } else {
        // Seed data if empty
        const seed = [{ id: Date.now(), title: 'Sunshine Boarding House', address: '123 Campus Rd', price: '3500', rooms: 'Single', availableRooms: '5', description: 'Near campus', tags: ['Wifi'], images: [], lat: 10.3157, lng: 123.8854, university: 'USC' }];
        if (mountedRef.current) setListings(seed);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(seed)); // Save seed immediately
      }
    } catch (e) { console.error('Failed to load listings', e); }

    return () => { mountedRef.current = false; previewUrls.forEach((u) => URL.revokeObjectURL(u)); };
  }, [previewUrls]);

  // REMOVED THE BUGGY SAVE EFFECT. We will save manually in handlers.

  useEffect(() => {
    if (selectedId && !listings.find((l) => l.id === selectedId)) setSelectedId(null);
  }, [listings, selectedId]);

  // Initialize Map
  useEffect(() => {
    if (viewMode !== 'manage') return;
    if (!mapContainerRef.current) return;

    if (mapInstanceRef.current) {
      return;
    }

    const centerLat = form.lat || 10.3157;
    const centerLng = form.lng || 123.8854;
    const map = L.map(mapContainerRef.current, { center: [centerLat, centerLng], zoom: 13 });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap' }).addTo(map);
    if (form.lat && form.lng) markerRef.current = L.marker([form.lat, form.lng], { icon: defaultIcon }).addTo(map);
    // Add university markers
    UNIVERSITIES.forEach((uni) => {
      const marker = L.marker(uni.coords, { icon: makeBlueLabel(uni.abbr) }).addTo(map);
      marker.bindPopup(`<b>${uni.name}</b>`);
    });

    map.on('click', (e) => {
      const { lat, lng } = e.latlng;
      if (lat < CEBU_BOUNDS.minLat || lat > CEBU_BOUNDS.maxLat || lng < CEBU_BOUNDS.minLng || lng > CEBU_BOUNDS.maxLng) {
        alert('Please pin a location within Cebu City only.');
        return;
      }
      setForm(f => ({ ...f, lat, lng }));
      if (markerRef.current) markerRef.current.setLatLng(e.latlng);
      else markerRef.current = L.marker(e.latlng, { icon: defaultIcon }).addTo(map);
      // Reverse geocode to get address
      fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`)
        .then(res => res.json())
        .then(data => {
          if (data && data.display_name) {
            setForm(f => ({ ...f, address: data.display_name }));
          }
        })
        .catch(() => {});
    });
    mapInstanceRef.current = map;
    return () => { if (mapInstanceRef.current) { mapInstanceRef.current.remove(); mapInstanceRef.current = null; markerRef.current = null; } };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewMode]);

  // --- Handlers ---

  function resetForm() {
    setForm({ title: '', address: '', price: '', rooms: '', availableRooms: '', description: '', tags: '', images: [], lat: null, lng: null, university: '' });
    previewUrls.forEach((u) => URL.revokeObjectURL(u)); setPreviewUrls([]); setImageFiles([]); setErrors({}); setEditingId(null);
    if (markerRef.current && mapInstanceRef.current) { mapInstanceRef.current.removeLayer(markerRef.current); markerRef.current = null; }
  }

  function validateForm() {
    const next = {};
    if (!form.title || !form.title.trim()) next.title = 'Title is required';
    if (!form.price || isNaN(Number(form.price))) next.price = 'Enter a numeric price';
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function handleFileChange(e) {
    const files = e.target.files; if (!files) return;
    previewUrls.forEach((u) => URL.revokeObjectURL(u));
    const allowed = Array.from(files).slice(0, 3);
    const urls = allowed.map((f) => URL.createObjectURL(f));
    setImageFiles(allowed); setPreviewUrls(urls);
  }

  function removeSelectedImage(index) {
    const newFiles = [...imageFiles]; newFiles.splice(index, 1);
    previewUrls.forEach((u) => URL.revokeObjectURL(u));
    const newUrls = newFiles.map((f) => URL.createObjectURL(f));
    setImageFiles(newFiles); setPreviewUrls(newUrls);
  }

  function removeExistingImage(index) {
    const imgs = [...(form.images || [])]; imgs.splice(index, 1);
    setForm((f) => ({ ...f, images: imgs }));
  }

  const CEBU_BOUNDS = { minLat: 10.25, maxLat: 10.45, minLng: 123.82, maxLng: 123.95 };

  // Helper to save to LocalStorage
  const saveToStorage = (newListings) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newListings));
      // Dispatch event so other components (like Map) know to update
      window.dispatchEvent(new CustomEvent('dormscout:listingsUpdated', { detail: newListings }));
    } catch (e) {
      console.error("Failed to save", e);
    }
  };

  async function handleAdd(e) {
    e.preventDefault(); if (!validateForm()) return;
    let finalImages = form.images || [];
    if (imageFiles.length > 0) {
      try { const dataUrls = await filesToDataUrls(imageFiles); finalImages = [...finalImages, ...dataUrls].slice(0, 3); } catch (err) { console.error('Failed to read images', err); }
    }
    const tagsArray = form.tags ? form.tags.split(',').map((t) => t.trim()).filter(Boolean) : [];
    const newListing = {
      id: Date.now(), ...form,
      tags: tagsArray, images: finalImages, university: form.university
    };

    const newListings = [newListing, ...listings];
    setListings(newListings);
    saveToStorage(newListings); // SAVE HERE

    resetForm(); setViewMode('board');
  }

  async function handleUpdate(e) {
    e.preventDefault(); if (!validateForm()) return;
    let finalImages = form.images || [];
    if (imageFiles.length > 0) {
      try { const dataUrls = await filesToDataUrls(imageFiles); finalImages = [...finalImages, ...dataUrls].slice(0, 3); } catch (err) { console.error('Failed to read images', err); }
    }
    const tagsArray = form.tags ? form.tags.split(',').map((t) => t.trim()).filter(Boolean) : [];

    const newListings = listings.map((l) => (l.id === editingId ? { ...l, ...form, tags: tagsArray, images: finalImages, university: form.university } : l));
    setListings(newListings);
    saveToStorage(newListings); // SAVE HERE

    resetForm(); setViewMode('board');
  }

  function removeListing(id) {
    if (!window.confirm('Delete this listing?')) return;
    const newListings = listings.filter((l) => l.id !== id);
    setListings(newListings);
    saveToStorage(newListings); // SAVE HERE
    if (selectedId === id) setSelectedId(null);
  }

  function startEdit(listing) {
    setEditingId(listing.id);
    setForm({ title: listing.title || '', address: listing.address || '', price: listing.price || '', rooms: listing.rooms || '', description: listing.description || '', tags: (listing.tags || []).join(', '), images: listing.images || [], lat: listing.lat || null, lng: listing.lng || null, university: listing.university || '' });
    if (mapInstanceRef.current) { mapInstanceRef.current.remove(); mapInstanceRef.current = null; markerRef.current = null; }
    setViewMode('manage'); window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function createNewListing() { resetForm(); setViewMode('manage'); setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 50); }

  // --- Render ---
  const dk = darkMode;
  const c = { text: dk ? '#eaeaea' : '#333', secondaryText: dk ? '#a0a0b0' : '#666', cardBg: dk ? '#16213e' : '#fff', border: dk ? '#2a2a4a' : 'rgba(0,0,0,0.06)', inputBg: dk ? '#0f3460' : '#fff', inputBorder: dk ? '#2a2a4a' : '#ccc', tagBg: dk ? '#0f3460' : '#f1f1f1', tagText: dk ? '#eaeaea' : '#333', emptyBg: dk ? '#16213e' : '#fff', hoverBg: dk ? '#1a1a4a' : '#f3f3f3' };

  return (
    <div style={{ display: 'flex', gap: 24 }}>
      <div style={{ flex: 1, position: 'relative' }}>
        {viewMode === 'board' ? (
          <>
            <h3 style={{ marginTop: 0, color: c.text }}>Listings</h3>
            <p style={{ color: c.secondaryText, marginTop: 4 }}>Browse properties. Click a card to select.</p>
            {listings.length === 0 ? (
              <div style={{ padding: 20, background: c.emptyBg, borderRadius: 12, color: c.text }}>No listings yet.</div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
                {listings.map((l) => {
                  const selected = selectedId === l.id;
                  return (
                    <div key={l.id} style={{ background: c.cardBg, border: selected ? `2px solid ${PRIMARY}` : `1px solid ${c.border}`, borderRadius: 12, overflow: 'visible', cursor: 'pointer', position: 'relative', zIndex: selected ? 20 : 1 }}>
                      {/* Notification Badge */}
                      {getPendingCount(l.id) > 0 && (
                        <div style={{
                          position: 'absolute', top: -8, right: -8, background: '#dc3545', color: '#fff',
                          borderRadius: '50%', width: 24, height: 24, display: 'flex', alignItems: 'center',
                          justifyContent: 'center', fontSize: 12, fontWeight: '700', zIndex: 200,
                          boxShadow: '0 2px 6px rgba(220,53,69,0.4)',
                        }}>
                          {getPendingCount(l.id)}
                        </div>
                      )}
                      <button 
                        onClick={(e) => { e.stopPropagation(); startEdit(l); }}
                        style={{
                          position: 'absolute',
                          top: 8,
                          left: 8,
                          background: PRIMARY,
                          color: '#fff',
                          border: 'none',
                          borderRadius: 6,
                          padding: '6px 10px',
                          cursor: 'pointer',
                          fontSize: 14,
                          fontWeight: 600,
                          zIndex: 100,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                          transition: 'transform 0.2s ease',
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                      >
                        ✏️ Edit
                      </button>
                      <div onClick={() => setSelectedId(l.id)}>
                        {l.images && l.images.length > 0 ? (
                          <div style={{ height: 140, width: '100%', position: 'relative', overflow: 'hidden', borderRadius: '12px 12px 0 0' }}>
                            <img
                              src={l.images[0]}
                              alt={l.title}
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                          </div>
                        ) : l.lat && l.lng ? (
                          <div style={{ height: 140, width: '100%', overflow: 'hidden', position: 'relative', zIndex: 0, borderRadius: '12px 12px 0 0' }}>
                            <SmallMap lat={l.lat} lng={l.lng} />
                          </div>
                        ) : (
                          <div style={{ height: 140, width: '100%', background: c.hoverBg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: c.secondaryText }}>
                            🏠 No Image
                          </div>
                        )}
                        <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                          <div style={{ fontWeight: 700, fontSize: 16, color: c.text }}>{l.title}</div>
                          <div style={{ fontSize: 13, color: c.secondaryText }}>{l.address}</div>
                          {l.university && (<div style={{ fontSize: 12, fontWeight: '600', padding: '4px 8px', borderRadius: 4, display: 'inline-block', marginTop: 4, background: `${PRIMARY}15`, color: PRIMARY }}>🎓 {l.university}</div>)}
                          <div style={{ fontSize: 14, fontWeight: 700, color: PRIMARY }}>₱{l.price}</div>
                          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 6 }}>{(l.tags || []).map((tag, i) => (<span key={i} style={{ background: c.tagBg, color: c.tagText, padding: '4px 8px', borderRadius: 12, fontSize: 12 }}>{tag}</span>))}</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            <div style={{ marginTop: 24, display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button onClick={() => selectedId && removeListing(selectedId)} disabled={!selectedId} style={{ padding: '10px 16px', border: 'none', borderRadius: 8, cursor: selectedId ? 'pointer' : 'not-allowed', fontWeight: 600, background: '#dc3545', color: '#fff', opacity: selectedId ? 1 : 0.5 }}>Delete Selected</button>
              <button onClick={createNewListing} style={{ padding: '10px 16px', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, background: PRIMARY, color: '#fff' }}>Create New Listing</button>
            </div>

            {/* Tenant Management for selected listing */}
            {selectedId && (
              <div style={{ marginTop: '32px', background: c.cardBg, borderRadius: '16px', padding: '24px', border: `1px solid ${c.border}` }}>
                <TenantManagement
                  listingId={selectedId}
                  listingTitle={listings.find(l => l.id === selectedId)?.title || ''}
                  darkMode={darkMode}
                />
              </div>
            )}
          </>
        ) : (
          <>
            <h3 style={{ marginTop: 0, color: c.text }}>Manage Listings</h3>
            <p style={{ color: c.secondaryText, marginTop: 4 }}>Click the map to set the exact location.</p>
            <form onSubmit={editingId ? handleUpdate : handleAdd} style={{ marginTop: 16, marginBottom: 24 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div><input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="Listing title" style={{ height: 44, padding: '8px 12px', borderRadius: 8, width: '100%', border: '1px solid #ccc', background: c.inputBg, color: c.text }} />{errors.title && <div style={{ color: 'crimson', fontSize: 13, marginTop: 6 }}>{errors.title}</div>}</div>
                <div><input value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} placeholder="Price (e.g., 3500)" style={{ height: 44, padding: '8px 12px', borderRadius: 8, width: '100%', border: '1px solid #ccc', background: c.inputBg, color: c.text }} />{errors.price && <div style={{ color: 'crimson', fontSize: 13, marginTop: 6 }}>{errors.price}</div>}</div>
              </div>
              <div style={{ marginTop: 12 }}><input value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} placeholder="Address / Location Name" style={{ height: 44, padding: '8px 12px', borderRadius: 8, width: '100%', border: '1px solid #ccc', background: c.inputBg, color: c.text }} /></div>
              <div style={{ marginTop: 12, height: 300, width: '100%', borderRadius: 12, overflow: 'hidden', border: '1px solid #ccc' }}><div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} /></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                <p style={{ fontSize: 12, color: c.secondaryText, margin: 0 }}>Click on the map to pin the location.</p>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#dc3545', background: '#dc354515', padding: '4px 10px', borderRadius: 6 }}>⚠️ Cebu City Only</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
                <div><input value={form.rooms} onChange={(e) => setForm((f) => ({ ...f, rooms: e.target.value }))} placeholder="Room types" style={{ height: 44, padding: '8px 12px', borderRadius: 8, width: '100%', border: '1px solid #ccc', background: c.inputBg, color: c.text }} /></div>
                <div>
                  <select value={form.availableRooms} onChange={(e) => setForm((f) => ({ ...f, availableRooms: e.target.value }))} style={{ height: 44, padding: '8px 12px', borderRadius: 8, width: '100%', border: '1px solid #ccc', background: c.inputBg, color: c.text }}>
                    <option value="">Rooms Available</option>
                    <option value="1">1 Room</option><option value="2">2 Rooms</option><option value="3">3 Rooms</option><option value="4">4 Rooms</option><option value="5">5 Rooms</option>
                  </select>
                </div>
              </div>
              <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Short description" style={{ width: '100%', marginTop: 12, height: 100, padding: 12, borderRadius: 8, border: '1px solid #ccc', background: c.inputBg, color: c.text }} />
              <div style={{ marginTop: 12 }}>
                <label style={{ display: 'block', marginBottom: 8, fontSize: 13, color: c.secondaryText }}>Upload images (max 3)</label>
                <input value={form.tags} onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))} placeholder="Tags (comma separated)" style={{ height: 44, padding: '8px 12px', borderRadius: 8, width: '100%', border: '1px solid #ccc', background: c.inputBg, color: c.text, marginBottom: 12 }} />
                <input type="file" accept="image/*" multiple onChange={handleFileChange} />
                <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                  {previewUrls.map((url, idx) => (<div key={`preview-${idx}`} style={{ width: 80, height: 60, borderRadius: 8, overflow: 'hidden', border: '1px solid #eee', position: 'relative' }}><img src={url} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /><button type="button" onClick={() => removeSelectedImage(idx)} style={{ position: 'absolute', top: 4, right: 4, background: 'rgba(0,0,0,0.6)', color: '#fff', border: 'none', borderRadius: 4, padding: '2px 6px', cursor: 'pointer' }}>x</button></div>))}
                  {form.images && form.images.map((src, idx) => (<div key={`existing-${idx}`} style={{ width: 80, height: 60, borderRadius: 8, overflow: 'hidden', border: '1px solid #eee', position: 'relative' }}><img src={src} alt="existing" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /><button type="button" onClick={() => removeExistingImage(idx)} style={{ position: 'absolute', top: 4, right: 4, background: 'rgba(0,0,0,0.6)', color: '#fff', border: 'none', borderRadius: 4, padding: '2px 6px', cursor: 'pointer' }}>x</button></div>))}
                </div>
              </div>
              <div style={{ marginTop: 12, display: 'flex', gap: 12 }}>
                <button type="submit" style={{ padding: '10px 16px', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, background: PRIMARY, color: '#fff' }}>{editingId ? 'Update Listing' : 'Add Listing'}</button>
                <button type="button" onClick={() => { resetForm(); setViewMode('board'); }} style={{ padding: '10px 16px', background: 'transparent', color: PRIMARY, border: `1px solid ${PRIMARY}`, borderRadius: 8, cursor: 'pointer' }}>Cancel</button>
              </div>
            </form>
          </>
        )}
      </div>
      <aside style={{ width: 320 }}>
        <div style={{ background: c.cardBg, padding: 16, borderRadius: 12, border: `1px solid ${c.border}` }}>
          <h4 style={{ marginTop: 0, color: c.text }}>Listing Tips</h4>
          <ul style={{ marginTop: 8, paddingLeft: 18, color: c.secondaryText }}>
            <li>Use a clear title.</li>
            <li>Include price/rooms.</li>
            <li>Nearby university auto-detected.</li>
            <li>Pin location on map.</li>
          </ul>
        </div>
      </aside>
    </div>
  );
}