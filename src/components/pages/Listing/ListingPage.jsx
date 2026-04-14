import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useBooking } from '../../../context/BookingContext';
import TenantManagement from './TenantManagement';
import './ListingPage.css';

// eslint-disable-next-line no-unused-vars
const PRIMARY    = '#E8622E'; // still needed for Leaflet map click handler (not JSX)
const BLUE       = '#2563EB';
const STORAGE_KEY = 'dormscout_listings';
const CEBU_BOUNDS = { minLat: 10.25, maxLat: 10.45, minLng: 123.82, maxLng: 123.95 };

const defaultIcon = L.icon({
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize:  [25, 41],
  iconAnchor:[12, 41],
});

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
    iconSize:     [44, 56],
    iconAnchor:   [22, 56],
    popupAnchor:  [0, -56],
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

function SmallMap({ lat, lng }) {
  const mapRef         = useRef(null);
  const mapInstanceRef = useRef(null);
  useEffect(() => {
    const node = mapRef.current;
    if (!node) return;
    if (!mapInstanceRef.current) {
      const map = L.map(node, { center: [lat || 0, lng || 0], zoom: 14, zoomControl: false, dragging: false, scrollWheelZoom: false });
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
      L.marker([lat, lng], { icon: defaultIcon }).addTo(map);
      mapInstanceRef.current = map;
    }
    return () => { if (mapInstanceRef.current) { mapInstanceRef.current.remove(); mapInstanceRef.current = null; } };
  }, [lat, lng]);
  return <div ref={mapRef} style={{ width: '100%', height: '100%' }} />;
}

const filesToDataUrls = (files) =>
  Promise.all(Array.from(files).map((file) =>
    new Promise((res, rej) => {
      const fr = new FileReader();
      fr.onload = () => res(fr.result);
      fr.onerror = rej;
      fr.readAsDataURL(file);
    })
  ));

const EMPTY_FORM = {
  title: '', address: '', price: '', rooms: '', availableRooms: '',
  description: '', tags: '', images: [], lat: null, lng: null, university: '',
};

export default function ListingPage({ mode = 'board', darkMode = false, editListingData, onEditHandled }) {
  const [listings, setListings]           = useState([]);
  const [editingId, setEditingId]         = useState(null);
  const { getPendingCount }               = useBooking();
  const [form, setForm]                   = useState(EMPTY_FORM);
  const [imageFiles, setImageFiles]       = useState([]);
  const [previewUrls, setPreviewUrls]     = useState([]);
  const [errors, setErrors]               = useState({});
  const [viewMode, setViewMode]           = useState(mode);
  const [selectedId, setSelectedId]       = useState(null);

  const mapContainerRef = useRef(null);
  const mapInstanceRef  = useRef(null);
  const markerRef       = useRef(null);
  const mountedRef      = useRef(true);

  const theme = darkMode ? 'dark' : 'light';

  const setField = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  useEffect(() => { setViewMode(mode); }, [mode]);

  useEffect(() => {
    if (editListingData) { startEdit(editListingData); if (onEditHandled) onEditHandled(); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editListingData]);

  useEffect(() => {
    mountedRef.current = true;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (mountedRef.current) setListings(parsed);
      } else {
        const seed = [{ id: Date.now(), title: 'Sunshine Boarding House', address: '123 Campus Rd', price: '3500', rooms: 'Single', availableRooms: '5', description: 'Near campus', tags: ['Wifi'], images: [], lat: 10.3157, lng: 123.8854, university: 'USC' }];
        if (mountedRef.current) setListings(seed);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
      }
    } catch (e) { console.error('Failed to load listings', e); }
    return () => { mountedRef.current = false; previewUrls.forEach((u) => URL.revokeObjectURL(u)); };
  }, [previewUrls]);

  useEffect(() => {
    if (selectedId && !listings.find((l) => l.id === selectedId)) setSelectedId(null);
  }, [listings, selectedId]);

  useEffect(() => {
    if (viewMode !== 'manage' || !mapContainerRef.current || mapInstanceRef.current) return;
    const centerLat = form.lat || 10.3157;
    const centerLng = form.lng || 123.8854;
    const map = L.map(mapContainerRef.current, { center: [centerLat, centerLng], zoom: 13 });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap' }).addTo(map);
    if (form.lat && form.lng) markerRef.current = L.marker([form.lat, form.lng], { icon: defaultIcon }).addTo(map);
    UNIVERSITIES.forEach((uni) => {
      const marker = L.marker(uni.coords, { icon: makeBlueLabel(uni.abbr) }).addTo(map);
      marker.bindPopup(`<b>${uni.name}</b>`);
    });
    map.on('click', (e) => {
      const { lat, lng } = e.latlng;
      if (lat < CEBU_BOUNDS.minLat || lat > CEBU_BOUNDS.maxLat || lng < CEBU_BOUNDS.minLng || lng > CEBU_BOUNDS.maxLng) {
        alert('Please pin a location within Cebu City only.'); return;
      }
      setForm(f => ({ ...f, lat, lng }));
      if (markerRef.current) markerRef.current.setLatLng(e.latlng);
      else markerRef.current = L.marker(e.latlng, { icon: defaultIcon }).addTo(map);
      fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`)
        .then(res => res.json())
        .then(data => { if (data?.display_name) setForm(f => ({ ...f, address: data.display_name })); })
        .catch(() => {});
    });
    mapInstanceRef.current = map;
    return () => { if (mapInstanceRef.current) { mapInstanceRef.current.remove(); mapInstanceRef.current = null; markerRef.current = null; } };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewMode]);

  function resetForm() {
    setForm(EMPTY_FORM);
    previewUrls.forEach((u) => URL.revokeObjectURL(u));
    setPreviewUrls([]); setImageFiles([]); setErrors({}); setEditingId(null);
    if (markerRef.current && mapInstanceRef.current) { mapInstanceRef.current.removeLayer(markerRef.current); markerRef.current = null; }
  }

  function validateForm() {
    const next = {};
    if (!form.title?.trim()) next.title = 'Title is required';
    if (!form.price || isNaN(Number(form.price))) next.price = 'Enter a numeric price';
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function handleFileChange(e) {
    const files = e.target.files; if (!files) return;
    previewUrls.forEach((u) => URL.revokeObjectURL(u));
    const allowed = Array.from(files).slice(0, 3);
    setImageFiles(allowed); setPreviewUrls(allowed.map((f) => URL.createObjectURL(f)));
  }

  function removeSelectedImage(index) {
    const newFiles = [...imageFiles]; newFiles.splice(index, 1);
    previewUrls.forEach((u) => URL.revokeObjectURL(u));
    setImageFiles(newFiles); setPreviewUrls(newFiles.map((f) => URL.createObjectURL(f)));
  }

  function removeExistingImage(index) {
    const imgs = [...(form.images || [])]; imgs.splice(index, 1);
    setForm((f) => ({ ...f, images: imgs }));
  }

  const saveToStorage = (newListings) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newListings));
      window.dispatchEvent(new CustomEvent('dormscout:listingsUpdated', { detail: newListings }));
    } catch (e) { console.error('Failed to save', e); }
  };

  async function handleAdd(e) {
    e.preventDefault(); if (!validateForm()) return;
    let finalImages = form.images || [];
    if (imageFiles.length > 0) {
      try { const dataUrls = await filesToDataUrls(imageFiles); finalImages = [...finalImages, ...dataUrls].slice(0, 3); } catch (err) { console.error('Failed to read images', err); }
    }
    const tagsArray = form.tags ? form.tags.split(',').map((t) => t.trim()).filter(Boolean) : [];
    const newListing = { id: Date.now(), ...form, tags: tagsArray, images: finalImages };
    const newListings = [newListing, ...listings];
    setListings(newListings); saveToStorage(newListings);
    resetForm(); setViewMode('board');
  }

  async function handleUpdate(e) {
    e.preventDefault(); if (!validateForm()) return;
    let finalImages = form.images || [];
    if (imageFiles.length > 0) {
      try { const dataUrls = await filesToDataUrls(imageFiles); finalImages = [...finalImages, ...dataUrls].slice(0, 3); } catch (err) { console.error('Failed to read images', err); }
    }
    const tagsArray = form.tags ? form.tags.split(',').map((t) => t.trim()).filter(Boolean) : [];
    const newListings = listings.map((l) => l.id === editingId ? { ...l, ...form, tags: tagsArray, images: finalImages } : l);
    setListings(newListings); saveToStorage(newListings);
    resetForm(); setViewMode('board');
  }

  function removeListing(id) {
    if (!window.confirm('Delete this listing?')) return;
    const newListings = listings.filter((l) => l.id !== id);
    setListings(newListings); saveToStorage(newListings);
    if (selectedId === id) setSelectedId(null);
  }

  function startEdit(listing) {
    setEditingId(listing.id);
    setForm({
      title: listing.title || '', address: listing.address || '', price: listing.price || '',
      rooms: listing.rooms || '', availableRooms: listing.availableRooms || '',
      description: listing.description || '', tags: (listing.tags || []).join(', '),
      images: listing.images || [], lat: listing.lat || null, lng: listing.lng || null,
      university: listing.university || '',
    });
    if (mapInstanceRef.current) { mapInstanceRef.current.remove(); mapInstanceRef.current = null; markerRef.current = null; }
    setViewMode('manage'); window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function createNewListing() {
    resetForm(); setViewMode('manage');
    setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 50);
  }

  return (
    <div className={`listing-wrapper ${theme}`}>
      <div className="listing-layout">
        <div className="listing-main">
          {viewMode === 'board' ? (
            <>
              <h3 className="listing-section-title">Listings</h3>
              <p className="listing-section-subtitle">Browse properties. Click a card to select.</p>

              {listings.length === 0 ? (
                <div className="listing-empty">No listings yet.</div>
              ) : (
                <div className="listing-grid">
                  {listings.map((l) => {
                    const selected = selectedId === l.id;
                    return (
                      <div key={l.id} className={`listing-card ${selected ? 'selected' : ''}`}>
                        {getPendingCount(l.id) > 0 && (
                          <div className="listing-notif-badge">{getPendingCount(l.id)}</div>
                        )}
                        <button
                          className="listing-edit-btn"
                          onClick={(e) => { e.stopPropagation(); startEdit(l); }}
                        >
                          ✏️ Edit
                        </button>

                        <div onClick={() => setSelectedId(l.id)}>
                          {l.images?.length > 0 ? (
                            <div className="listing-card-media">
                              <img src={l.images[0]} alt={l.title} />
                            </div>
                          ) : l.lat && l.lng ? (
                            <div className="listing-card-media">
                              <SmallMap lat={l.lat} lng={l.lng} />
                            </div>
                          ) : (
                            <div className="listing-card-placeholder">🏠 No Image</div>
                          )}

                          <div className="listing-card-body">
                            <div className="listing-card-title">{l.title}</div>
                            <div className="listing-card-address">{l.address}</div>
                            {l.university && (
                              <div className="listing-university-badge">🎓 {l.university}</div>
                            )}
                            <div className="listing-card-price">₱{l.price}</div>
                            <div className="listing-card-tags">
                              {(l.tags || []).map((tag, i) => (
                                <span key={i} className="listing-tag">{tag}</span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="listing-board-actions">
                <button
                  className="btn-delete-listing"
                  onClick={() => selectedId && removeListing(selectedId)}
                  disabled={!selectedId}
                >
                  Delete Selected
                </button>
                <button className="btn-create-listing" onClick={createNewListing}>
                  Create New Listing
                </button>
              </div>

              {selectedId && (
                <div className="listing-tenant-box">
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
              <h3 className="listing-section-title">Manage Listings</h3>
              <p className="listing-section-subtitle">Click the map to set the exact location.</p>

              <form className="listing-form" onSubmit={editingId ? handleUpdate : handleAdd}>
                <div className="form-row-2">
                  <div className="form-field">
                    <input className="listing-input" value={form.title} onChange={setField('title')} placeholder="Listing title" />
                    {errors.title && <div className="form-error">{errors.title}</div>}
                  </div>
                  <div className="form-field">
                    <input className="listing-input" value={form.price} onChange={setField('price')} placeholder="Price (e.g., 3500)" />
                    {errors.price && <div className="form-error">{errors.price}</div>}
                  </div>
                </div>

                <div className="form-mt">
                  <input className="listing-input" value={form.address} onChange={setField('address')} placeholder="Address / Location Name" />
                </div>

                <div className="listing-map-container">
                  <div ref={mapContainerRef} className="listing-map-inner" />
                </div>

                <div className="listing-map-hint">
                  <p className="listing-map-hint-text">Click on the map to pin the location.</p>
                  <span className="listing-cebu-badge">⚠️ Cebu City Only</span>
                </div>

                <div className="form-row-2 form-mt">
                  <div>
                    <input className="listing-input" value={form.rooms} onChange={setField('rooms')} placeholder="Room types" />
                  </div>
                  <div>
                    <select className="listing-select" value={form.availableRooms} onChange={setField('availableRooms')}>
                      <option value="">Rooms Available</option>
                      <option value="1">1 Room</option>
                      <option value="2">2 Rooms</option>
                      <option value="3">3 Rooms</option>
                      <option value="4">4 Rooms</option>
                      <option value="5">5 Rooms</option>
                    </select>
                  </div>
                </div>

                <textarea className="listing-textarea form-mt" value={form.description} onChange={setField('description')} placeholder="Short description" />

                <div className="form-mt">
                  <label className="listing-upload-label">Upload images (max 3)</label>
                  <input className="listing-input" value={form.tags} onChange={setField('tags')} placeholder="Tags (comma separated)" style={{ marginBottom: 12 }} />
                  <input type="file" accept="image/*" multiple onChange={handleFileChange} />
                  <div className="listing-image-previews">
                    {previewUrls.map((url, idx) => (
                      <div key={`preview-${idx}`} className="listing-image-thumb">
                        <img src={url} alt="preview" />
                        <button type="button" className="listing-image-remove" onClick={() => removeSelectedImage(idx)}>x</button>
                      </div>
                    ))}
                    {(form.images || []).map((src, idx) => (
                      <div key={`existing-${idx}`} className="listing-image-thumb">
                        <img src={src} alt="existing" />
                        <button type="button" className="listing-image-remove" onClick={() => removeExistingImage(idx)}>x</button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="listing-form-actions">
                  <button type="submit" className="btn-submit-listing">
                    {editingId ? 'Update Listing' : 'Add Listing'}
                  </button>
                  <button type="button" className="btn-cancel-listing" onClick={() => { resetForm(); setViewMode('board'); }}>
                    Cancel
                  </button>
                </div>
              </form>
            </>
          )}
        </div>

        {/* Aside */}
        <aside className="listing-aside">
          <div className="listing-tips-card">
            <h4 className="listing-tips-title">Listing Tips</h4>
            <ul className="listing-tips-list">
              <li>Use a clear title.</li>
              <li>Include price/rooms.</li>
              <li>Nearby university auto-detected.</li>
              <li>Pin location on map.</li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}