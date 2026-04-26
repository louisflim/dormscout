import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './BookmarkPage.css';

const BOOKMARK_KEY = 'dormscout_bookmarks';

const defaultIcon = L.icon({
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize:  [25, 41],
  iconAnchor:[12, 41],
});

function SmallMap({ lat, lng }) {
  const mapRef = useRef(null);
  useEffect(() => {
    const node = mapRef.current;
    if (!node) return;
    if (!node._leaflet_id) {
      const map = L.map(node, {
        center: [lat || 0, lng || 0],
        zoom: 14,
        zoomControl: false,
        dragging: false,
        scrollWheelZoom: false,
      });
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
      L.marker([lat, lng], { icon: defaultIcon }).addTo(map);
    }
    return () => { if (node && node._leaflet_id) node.remove(); };
  }, [lat, lng]);
  return <div ref={mapRef} style={{ width: '100%', height: '100%' }} />;
}

function getBookmarks() {
  try { return JSON.parse(localStorage.getItem(BOOKMARK_KEY) || '[]'); } catch (_) { return []; }
}

export default function BookmarkPage({ darkMode = false }) {
  const navigate = useNavigate();
  const [bookmarks, setBookmarks] = useState(getBookmarks);

  useEffect(() => {
    const handler = (e) => {
      if (e.key === BOOKMARK_KEY) setBookmarks(getBookmarks());
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  const removeBookmark = (id) => {
    const next = bookmarks.filter(b => b.id !== id);
    localStorage.setItem(BOOKMARK_KEY, JSON.stringify(next));
    setBookmarks(next);
  };

  const theme      = darkMode ? 'dark' : 'light';
  const cardBg     = darkMode ? '#16213e' : '#fff';
  const text       = darkMode ? '#eaeaea' : '#1a1a1a';
  const subText    = darkMode ? '#a0a0b0' : '#65676b';
  const borderColor= darkMode ? '#2a2a4a' : '#e4e6eb';
  const inputBg    = darkMode ? '#0f3460' : '#f7f7f7';

  const formatDate = (iso) => {
    if (!iso) return 'N/A';
    return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  return (
    <div className={`bookmark-wrapper ${theme}`}>
      {bookmarks.length === 0 ? (
        <div className="bookmark-empty">
          <p>No saved listings yet. Explore the map to save dorms!</p>
          <button className="bookmark-explore-btn" onClick={() => navigate('/map')}>
            Explore Map
          </button>
        </div>
      ) : (
        <div className="bookmarks-grid">
          {bookmarks.map((b) => (
            <div
              key={b.id}
              className="bookmark-card"
              style={{ background: cardBg, border: `1px solid ${borderColor}` }}
            >
              {b.listingImages && b.listingImages.length > 0 ? (
                <div className="bookmark-map-preview" style={{ background: inputBg, overflow: 'hidden', height: '180px' }}>
                  <img
                    src={b.listingImages[0]}
                    alt={b.listingTitle}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </div>
              ) : b.lat && b.lng ? (
                <div className="bookmark-map-preview">
                  <SmallMap lat={b.lat} lng={b.lng} />
                </div>
              ) : (
                <div className="bookmark-map-placeholder" style={{ background: inputBg, color: subText }}>
                  No Image or Location
                </div>
              )}

              <div className="bookmark-card-body">
                <h4 className="bookmark-card-title" style={{ color: text }}>
                  {b.listingTitle || '(No title)'}
                </h4>
                <p className="bookmark-card-address" style={{ color: subText }}>
                  {b.listingAddress}
                </p>

                {b.university && (
                  <div className="bookmark-university-badge">🎓 {b.university}</div>
                )}

                <div className="bookmark-card-price" style={{ color: '#E8622E' }}>
                  ₱{Number(b.listingPrice || 0).toLocaleString()}
                </div>

                {b.genderPolicy && b.genderPolicy !== 'Both' && (
                  <span className="bookmark-gender-badge">
                    {b.genderPolicy === 'Girls Only' ? '♀️' : '♂️'} {b.genderPolicy}
                  </span>
                )}

                {b.landlordName && (
                  <p style={{ margin: '6px 0 4px', fontSize: '13px', color: subText }}>
                    <strong style={{ color: text }}>Landlord:</strong> {b.landlordName}
                  </p>
                )}

                {b.tags && b.tags.length > 0 && (
                  <div className="bookmark-tags" style={{ marginBottom: '8px' }}>
                    {b.tags.map((tag, i) => (
                      <span key={i} className="bookmark-tag">{tag}</span>
                    ))}
                  </div>
                )}

                <p style={{ margin: '4px 0 12px', fontSize: '12px', color: subText }}>
                  🔖 Saved on {formatDate(b.savedAt)}
                </p>

                <div className="bookmark-card-actions">
                  <button
                    className="bookmark-btn-map"
                    onClick={() => navigate('/map')}
                  >
                    🗺️ View on Map
                  </button>
                  <button
                    className="bookmark-btn-remove"
                    onClick={() => removeBookmark(b.id)}
                  >
                    🗑️ Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
