import React, { useState, useEffect, useRef } from 'react';
// We use standard 'leaflet', NOT 'react-leaflet' since you don't have it installed
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// --- Constants ---
const PRIMARY = '#E8622E';
const STORAGE_KEY = 'dormscout_listings';

// Fix for default marker icon missing in some setups
const defaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

// --- Helper Components ---

// A small map component for the Listing Cards (Board View)
function SmallMap({ lat, lng }) {
  const mapRef = useRef(null);

  useEffect(() => {
    const node = mapRef.current;
    if (!node) return;

    // Initialize map if not already initialized
    if (!node._leaflet_id) {
      const map = L.map(node, {
        center: [lat || 0, lng || 0],
        zoom: 14,
        zoomControl: false, // Hide zoom buttons for cleaner look
        dragging: false,    // Static display
        scrollWheelZoom: false
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
      L.marker([lat, lng], { icon: defaultIcon }).addTo(map);
    }

    // Cleanup
    return () => {
      if (node && node._leaflet_id) {
        node.remove(); // Destroy map instance on unmount
      }
    };
  }, [lat, lng]);

  return <div ref={mapRef} style={{ width: '100%', height: '100%' }} />;
}

// --- Helper Functions ---

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
export default function Listings({ mode = 'manage', darkMode = false }) {
  // --- State ---
  const [listings, setListings] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    title: '', address: '', price: '', rooms: '', availableRooms: '', description: '', tags: '', images: [],
    lat: null, lng: null
  });
  const [imageFiles, setImageFiles] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [errors, setErrors] = useState({});
  const [viewMode, setViewMode] = useState(mode);
  const [selectedId, setSelectedId] = useState(null);

  // Refs for the Edit/Create Map
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);

  const mountedRef = useRef(true);

  // --- Effects ---

  useEffect(() => {
    setViewMode(mode);
  }, [mode]);

  // Load data
  useEffect(() => {
    mountedRef.current = true;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw).map((l) => ({
          ...l,
          tags: l.tags || [],
          availableRooms: l.availableRooms || '',
          lat: l.lat || null,
          lng: l.lng || null
        }));
        if (mountedRef.current) setListings(parsed);
      } else {
        const seed = [
          {
            id: Date.now(),
            title: 'Sunshine Boarding House',
            address: '123 Campus Rd',
            price: '3500',
            rooms: 'Single/Double',
            availableRooms: '5',
            description: 'Cozy place near campus',
            tags: ['Wifi', 'Single'],
            images: [],
            lat: 10.3157,
            lng: 123.8854
          }
        ];
        if (mountedRef.current) setListings(seed);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
      }
    } catch (e) {
      console.error('Failed to load listings', e);
    }

    return () => {
      mountedRef.current = false;
      previewUrls.forEach((u) => URL.revokeObjectURL(u));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Save data
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(listings));
      window.dispatchEvent(new CustomEvent('dormscout:listingsUpdated', { detail: listings }));
    } catch (e) {
      console.error('Failed to save listings', e);
    }
  }, [listings]);

  // Clear selection
  useEffect(() => {
    if (selectedId && !listings.find((l) => l.id === selectedId)) {
      setSelectedId(null);
    }
  }, [listings, selectedId]);

  // Initialize Map for the Form
  useEffect(() => {
    // Only initialize if we are in 'manage' mode
    if (viewMode !== 'manage') return;
    if (!mapContainerRef.current) return;

    // If map already exists, just update view
    if (mapInstanceRef.current) {
       if (form.lat && form.lng) {
         mapInstanceRef.current.setView([form.lat, form.lng], 15);
         if (markerRef.current) {
           markerRef.current.setLatLng([form.lat, form.lng]);
         } else {
           markerRef.current = L.marker([form.lat, form.lng], { icon: defaultIcon }).addTo(mapInstanceRef.current);
         }
       }
       return;
    }

    // Create map
    const centerLat = form.lat || 10.3157;
    const centerLng = form.lng || 123.8854;

    const map = L.map(mapContainerRef.current, {
      center: [centerLat, centerLng],
      zoom: 13
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap'
    }).addTo(map);

    // Add marker if editing
    if (form.lat && form.lng) {
       markerRef.current = L.marker([form.lat, form.lng], { icon: defaultIcon }).addTo(map);
    }

    // Handle clicks
    map.on('click', (e) => {
      const { lat, lng } = e.latlng;

      // Update form state
      setForm(f => ({ ...f, lat, lng }));

      // Add/Move marker on map
      if (markerRef.current) {
        markerRef.current.setLatLng(e.latlng);
      } else {
        markerRef.current = L.marker(e.latlng, { icon: defaultIcon }).addTo(map);
      }
    });

    mapInstanceRef.current = map;

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markerRef.current = null;
      }
    };
  }, [viewMode, form.lat, form.lng]); // Re-run if viewMode changes to re-initialize map

  // --- Handlers ---

  function resetForm() {
    setForm({
      title: '', address: '', price: '', rooms: '', availableRooms: '', description: '', tags: '', images: [],
      lat: null, lng: null
    });
    previewUrls.forEach((u) => URL.revokeObjectURL(u));
    setPreviewUrls([]);
    setImageFiles([]);
    setErrors({});
    setEditingId(null);

    // Clear map marker
    if (markerRef.current && mapInstanceRef.current) {
      mapInstanceRef.current.removeLayer(markerRef.current);
      markerRef.current = null;
    }
  }

  function validateForm() {
    const next = {};
    if (!form.title || !form.title.trim()) next.title = 'Title is required';
    if (!form.price || isNaN(Number(form.price))) next.price = 'Enter a numeric price';
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function handleFileChange(e) {
    const files = e.target.files;
    if (!files) return;
    previewUrls.forEach((u) => URL.revokeObjectURL(u));
    const allowed = Array.from(files).slice(0, 3);
    const urls = allowed.map((f) => URL.createObjectURL(f));
    setImageFiles(allowed);
    setPreviewUrls(urls);
  }

  function removeSelectedFile(index) {
    const newFiles = [...imageFiles];
    newFiles.splice(index, 1);
    previewUrls.forEach((u) => URL.revokeObjectURL(u));
    const newUrls = newFiles.map((f) => URL.createObjectURL(f));
    setImageFiles(newFiles);
    setPreviewUrls(newUrls);
  }

  function removeExistingImage(index) {
    const imgs = [...(form.images || [])];
    imgs.splice(index, 1);
    setForm((f) => ({ ...f, images: imgs }));
  }

  function handleManualCoordChange(field, value) {
    const num = parseFloat(value);
    setForm(f => ({ ...f, [field]: isNaN(num) ? '' : num }));
  }

  async function handleAdd(e) {
    e.preventDefault();
    if (!validateForm()) return;

    let finalImages = form.images || [];
    if (imageFiles.length > 0) {
      try {
        const dataUrls = await filesToDataUrls(imageFiles);
        finalImages = [...finalImages, ...dataUrls].slice(0, 3);
      } catch (err) {
        console.error('Failed to read images', err);
      }
    }

    if (!mountedRef.current) return;

    const tagsArray = form.tags ? form.tags.split(',').map((t) => t.trim()).filter(Boolean) : [];
    const newListing = {
      id: Date.now(),
      ...form,
      tags: tagsArray,
      images: finalImages
    };

    setListings((s) => [newListing, ...s]);
    resetForm();
    setViewMode('board');
  }

  async function handleUpdate(e) {
    e.preventDefault();
    if (!validateForm()) return;

    let finalImages = form.images || [];
    if (imageFiles.length > 0) {
      try {
        const dataUrls = await filesToDataUrls(imageFiles);
        finalImages = [...finalImages, ...dataUrls].slice(0, 3);
      } catch (err) {
        console.error('Failed to read images', err);
      }
    }

    if (!mountedRef.current) return;

    const tagsArray = form.tags ? form.tags.split(',').map((t) => t.trim()).filter(Boolean) : [];

    setListings((s) => s.map((l) => (
      l.id === editingId ? {
        ...l,
        ...form,
        tags: tagsArray,
        images: finalImages
      } : l
    )));
    resetForm();
    setViewMode('board');
  }

  function startEdit(listing) {
    setEditingId(listing.id);
    setForm({
      title: listing.title || '',
      address: listing.address || '',
      price: listing.price || '',
      rooms: listing.rooms || '',
      description: listing.description || '',
      tags: (listing.tags || []).join(', '),
      images: listing.images || [],
      lat: listing.lat || null,
      lng: listing.lng || null
    });

    // Clean up previous map instance so it can re-initialize with new coords
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
      markerRef.current = null;
    }

    setViewMode('manage');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function removeListing(id) {
    if (!window.confirm('Delete this listing?')) return;
    setListings((s) => s.filter((l) => l.id !== id));
    if (selectedId === id) setSelectedId(null);
  }

  function createNewListing() {
    resetForm();
    setViewMode('manage');
    setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 50);
  }

  // --- Render ---

  const dk = darkMode;
  const c = {
    text: dk ? '#eaeaea' : '#333',
    secondaryText: dk ? '#a0a0b0' : '#666',
    cardBg: dk ? '#16213e' : '#fff',
    border: dk ? '#2a2a4a' : 'rgba(0,0,0,0.06)',
    inputBg: dk ? '#0f3460' : '#fff',
    inputBorder: dk ? '#2a2a4a' : '#ccc',
    tagBg: dk ? '#0f3460' : '#f1f1f1',
    tagText: dk ? '#eaeaea' : '#333',
    emptyBg: dk ? '#16213e' : '#fff',
    hoverBg: dk ? '#1a1a4a' : '#f3f3f3',
  };

  return (
    <div style={styles.container}>
      <div style={styles.mainContent}>
        {viewMode === 'board' ? (
          <>
            <h3 style={{ ...styles.header, color: c.text }}>Listings</h3>
            <p style={{ ...styles.subText, color: c.secondaryText }}>Browse properties. Click a card to select.</p>

            {listings.length === 0 ? (
              <div style={{ ...styles.emptyState, background: c.emptyBg, color: c.text }}>No listings yet.</div>
            ) : (
              <div style={styles.grid}>
                {listings.map((l) => {
                  const selected = selectedId === l.id;
                  return (
                    <div
                      key={l.id}
                      onClick={() => setSelectedId(l.id)}
                      style={{
                        ...styles.card,
                        background: c.cardBg,
                        border: selected ? `2px solid ${PRIMARY}` : `1px solid ${c.border}`,
                      }}
                    >
                      {/* Map Preview */}
                      {l.lat && l.lng ? (
                        <div style={{ height: 140, width: '100%' }}>
                           <SmallMap lat={l.lat} lng={l.lng} />
                        </div>
                      ) : (
                         <div style={{ height: 140, width: '100%', background: c.hoverBg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: c.secondaryText }}>
                           No Location Set
                         </div>
                      )}

                      <div style={styles.cardBody}>
                        <div style={{ ...styles.cardTitle, color: c.text }}>{l.title}</div>
                        <div style={{ ...styles.cardAddress, color: c.secondaryText }}>{l.address}</div>
                        <div style={styles.cardPrice}>₱{l.price}</div>
                        {l.availableRooms && (
                          <div style={{ fontSize: 13, color: c.secondaryText, fontWeight: 500 }}>
                            📍 {l.availableRooms} {l.availableRooms === '10' ? 'Rooms' : 'Room(s)'} Available
                          </div>
                        )}
                        <div style={styles.tagContainer}>
                          {(l.tags || []).map((tag, i) => (
                            <span key={i} style={{ ...styles.tag, background: c.tagBg, color: c.tagText }}>{tag}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div style={styles.actionsBar}>
              <button
                onClick={() => selectedId && removeListing(selectedId)}
                disabled={!selectedId}
                style={{
                  ...styles.btn,
                  ...styles.btnDelete,
                  opacity: selectedId ? 1 : 0.5,
                  cursor: selectedId ? 'pointer' : 'not-allowed'
                }}
              >
                Delete Selected
              </button>
              <button onClick={createNewListing} style={{ ...styles.btn, ...styles.btnPrimary }}>
                Create New Listing
              </button>
            </div>
          </>
        ) : (
          <>
            <h3 style={{ ...styles.header, color: c.text }}>Manage Listings</h3>
            <p style={{ ...styles.subText, color: c.secondaryText }}>Click the map to set the exact location.</p>

            <form onSubmit={editingId ? handleUpdate : handleAdd} style={styles.form}>
              <div style={styles.formGrid}>
                <div>
                  <input
                    value={form.title}
                    onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                    placeholder="Listing title"
                    style={{ ...styles.input, background: c.inputBg, color: c.text, borderColor: c.inputBorder }}
                  />
                  {errors.title && <div style={styles.error}>{errors.title}</div>}
                </div>

                <div>
                  <input
                    value={form.price}
                    onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                    placeholder="Price (e.g., 3500)"
                    style={{ ...styles.input, background: c.inputBg, color: c.text, borderColor: c.inputBorder }}
                  />
                  {errors.price && <div style={styles.error}>{errors.price}</div>}
                </div>
              </div>

              {/* Address & Coordinates */}
              <div style={{ marginTop: 12 }}>
                <input
                  value={form.address}
                  onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                  placeholder="Address / Location Name"
                  style={{ ...styles.input, background: c.inputBg, color: c.text, borderColor: c.inputBorder }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
                <input
                  type="number"
                  step="any"
                  value={form.lat || ''}
                  onChange={(e) => handleManualCoordChange('lat', e.target.value)}
                  placeholder="Latitude"
                  style={{ ...styles.input, background: c.inputBg, color: c.text, borderColor: c.inputBorder }}
                />
                <input
                  type="number"
                  step="any"
                  value={form.lng || ''}
                  onChange={(e) => handleManualCoordChange('lng', e.target.value)}
                  placeholder="Longitude"
                  style={{ ...styles.input, background: c.inputBg, color: c.text, borderColor: c.inputBorder }}
                />
              </div>

              {/* The Map Picker */}
              <div style={{ marginTop: 12, height: 300, width: '100%', borderRadius: 12, overflow: 'hidden', border: '1px solid #ccc' }}>
                <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />
              </div>
              <p style={{ fontSize: 12, color: c.secondaryText, marginTop: 4 }}>Click on the map to pin the location.</p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
                <div>
                  <input
                    value={form.rooms}
                    onChange={(e) => setForm((f) => ({ ...f, rooms: e.target.value }))}
                    placeholder="Room types (e.g., Single, Double)"
                    style={{ ...styles.input, background: c.inputBg, color: c.text, borderColor: c.inputBorder }}
                  />
                </div>
                <div>
                  <select
                    value={form.availableRooms}
                    onChange={(e) => setForm((f) => ({ ...f, availableRooms: e.target.value }))}
                    style={{ ...styles.input, background: c.inputBg, color: c.text, borderColor: c.inputBorder }}
                  >
                    <option value="">Rooms Available</option>
                    <option value="1">1 Room Available</option>
                    <option value="2">2 Rooms Available</option>
                    <option value="3">3 Rooms Available</option>
                    <option value="4">4 Rooms Available</option>
                    <option value="5">5 Rooms Available</option>
                    <option value="6">6 Rooms Available</option>
                    <option value="7">7 Rooms Available</option>
                    <option value="8">8 Rooms Available</option>
                    <option value="9">9 Rooms Available</option>
                    <option value="10">10+ Rooms Available</option>
                  </select>
                </div>
              </div>

              <textarea
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Short description"
                style={{...styles.textarea, marginTop: 12, background: c.inputBg, color: c.text, borderColor: c.inputBorder}}
              />

              <div style={styles.imageSection}>
                <label style={{ ...styles.label, color: c.secondaryText }}>Upload images (max 3)</label>
                <input
                  value={form.tags}
                  onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))}
                  placeholder="Tags (comma separated) e.g. Wifi,Pool"
                  style={{ ...styles.input, marginBottom: 12, background: c.inputBg, color: c.text, borderColor: c.inputBorder }}
                />
                <input type="file" accept="image/*" multiple onChange={handleFileChange} />

                <div style={styles.previewContainer}>
                  {previewUrls.map((url, idx) => (
                    <div key={`preview-${idx}`} style={styles.thumb}>
                      <img src={url} alt={`preview-${idx}`} style={styles.imgFit} />
                      <button type="button" onClick={() => removeSelectedFile(idx)} style={styles.thumbRemove}>x</button>
                    </div>
                  ))}
                  {form.images && form.images.map((src, idx) => (
                    <div key={`existing-${idx}`} style={styles.thumb}>
                      <img src={src} alt={`img-${idx}`} style={styles.imgFit} />
                      <button type="button" onClick={() => removeExistingImage(idx)} style={styles.thumbRemove}>x</button>
                    </div>
                  ))}
                </div>
              </div>

              <div style={styles.formActions}>
                <button type="submit" style={{ ...styles.btn, ...styles.btnPrimary }}>
                  {editingId ? 'Update Listing' : 'Add Listing'}
                </button>
                {editingId && (
                  <button type="button" onClick={resetForm} style={styles.btnCancel}>
                    Cancel
                  </button>
                )}
              </div>
            </form>

            <div style={styles.listContainer}>
              {listings.length === 0 ? (
                <div style={{ ...styles.emptyState, background: c.emptyBg, color: c.text }}>No listings yet.</div>
              ) : (
                listings.map((l) => (
                  <div key={l.id} style={{ ...styles.listItem, background: c.cardBg, border: `1px solid ${c.border}` }}>
                    <div style={styles.listItemContent}>
                      {l.images && l.images[0] && (
                        <div style={styles.listThumb}>
                          <img src={l.images[0]} alt={l.title} style={styles.imgFit} />
                        </div>
                      )}
                      <div>
                        <div style={{ ...styles.cardTitle, color: c.text }}>{l.title}</div>
                        <div style={{ ...styles.cardAddress, color: c.secondaryText }}>
                          {l.address} • ₱{l.price}
                          {l.availableRooms && ` • ${l.availableRooms} Room(s) Available`}
                        </div>
                      </div>
                    </div>
                    <div style={styles.listItemActions}>
                      <button onClick={() => startEdit(l)} style={styles.btnEdit}>Edit</button>
                      <button onClick={() => removeListing(l.id)} style={{ ...styles.btn, ...styles.btnDelete }}>Delete</button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>

      <aside style={styles.sidebar}>
        <div style={{ ...styles.sidebarContent, background: c.cardBg, border: `1px solid ${c.border}` }}>
          <h4 style={{ ...styles.sidebarTitle, color: c.text }}>Listing Tips</h4>
          <ul style={{ ...styles.sidebarList, color: c.secondaryText }}>
            <li>Use a clear title.</li>
            <li>Include price/rooms.</li>
            <li>Pin location on map.</li>
            <li>Add photos.</li>
          </ul>
        </div>
      </aside>
    </div>
  );
}

// --- Styles Object ---
const styles = {
  container: { display: 'flex', gap: 24 },
  mainContent: { flex: 1, position: 'relative' },
  header: { marginTop: 0 },
  subText: { color: '#666', marginTop: 4 },
  emptyState: { padding: 20, background: '#fff', borderRadius: 12 },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 },
  card: { background: '#fff', borderRadius: 12, overflow: 'hidden', cursor: 'pointer', display: 'flex', flexDirection: 'column' },
  cardBody: { padding: 12, display: 'flex', flexDirection: 'column', gap: 8 },
  cardTitle: { fontWeight: 700, fontSize: 16 },
  cardAddress: { fontSize: 13, color: '#666' },
  cardPrice: { fontSize: 14, fontWeight: 700, color: PRIMARY },
  tagContainer: { display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 6 },
  tag: { background: '#f1f1f1', padding: '4px 8px', borderRadius: 12, fontSize: 12 },
  imgFit: { width: '100%', height: '100%', objectFit: 'cover' },
  actionsBar: { marginTop: 24, display: 'flex', gap: 12, justifyContent: 'flex-end' },
  form: { marginTop: 16, marginBottom: 24 },
  formGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 },
  input: { height: 44, padding: '8px 12px', borderRadius: 8, width: '100%', border: '1px solid #ccc' },
  textarea: { width: '100%', marginTop: 12, height: 100, padding: 12, borderRadius: 8, border: '1px solid #ccc' },
  error: { color: 'crimson', fontSize: 13, marginTop: 6 },
  imageSection: { marginTop: 12 },
  label: { display: 'block', marginBottom: 8, fontSize: 13 },
  previewContainer: { display: 'flex', gap: 8, marginTop: 8 },
  thumb: { width: 80, height: 60, borderRadius: 8, overflow: 'hidden', border: '1px solid #eee', position: 'relative' },
  thumbRemove: { position: 'absolute', top: 4, right: 4, background: 'rgba(0,0,0,0.6)', color: '#fff', border: 'none', borderRadius: 4, padding: '2px 6px', cursor: 'pointer' },
  formActions: { marginTop: 12, display: 'flex', gap: 12 },
  btn: { padding: '10px 16px', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 },
  btnPrimary: { background: PRIMARY, color: '#fff' },
  btnDelete: { background: '#dc3545', color: '#fff' },
  btnCancel: { padding: '10px 16px', background: 'transparent', color: PRIMARY, border: `1px solid ${PRIMARY}`, borderRadius: 8, cursor: 'pointer' },
  btnEdit: { padding: '8px 12px', borderRadius: 8, border: '1px solid #ccc', background: 'transparent', color: PRIMARY, cursor: 'pointer' },
  listContainer: { display: 'grid', gap: 12 },
  listItem: { background: '#fff', padding: 16, borderRadius: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid rgba(0,0,0,0.06)' },
  listItemContent: { display: 'flex', gap: 12, alignItems: 'center' },
  listThumb: { width: 80, height: 60, borderRadius: 8, overflow: 'hidden', border: '1px solid #eee' },
  listItemActions: { display: 'flex', gap: 8 },
  sidebar: { width: 320 },
  sidebarContent: { background: '#fff', padding: 16, borderRadius: 12, border: '1px solid rgba(0,0,0,0.06)' },
  sidebarTitle: { marginTop: 0 },
  sidebarList: { marginTop: 8, paddingLeft: 18 }
};