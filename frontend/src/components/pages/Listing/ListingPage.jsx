import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useBooking } from '../../../context/BookingContext';
import { useAuth } from '../../../context/AuthContext';
import { UNIVERSITIES } from '../../../constants/universities';
import TenantManagement from './TenantManagement';
import { listingsAPI } from '../../../utils/api';
import './ListingPage.css';

const BLUE = '#2563EB';
const CEBU_CENTER = [10.3157, 123.8854];
const CEBU_BOUNDS = { minLat: 10.25, maxLat: 10.45, minLng: 123.82, maxLng: 123.95 };
const MAX_IMAGE_SIZE_BYTES = 2 * 1024 * 1024;

const defaultIcon = L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
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
        iconSize: [44, 56],
        iconAnchor: [22, 56],
        popupAnchor: [0, -56],
    });
}

function SmallMap({ lat, lng }) {
    const mapRef = useRef(null);
    const mapInstanceRef = useRef(null);

    useEffect(() => {
        const node = mapRef.current;
        if (!node || !lat || !lng) return;

        if (mapInstanceRef.current) {
            mapInstanceRef.current.remove();
        }

        const map = L.map(node, {
            center: [lat, lng],
            zoom: 15,
            zoomControl: false,
            dragging: false,
            scrollWheelZoom: false,
            doubleClickZoom: false,
            attributionControl: false
        });
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '' }).addTo(map);
        L.marker([lat, lng], { icon: defaultIcon }).addTo(map);
        mapInstanceRef.current = map;

        return () => {
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove();
                mapInstanceRef.current = null;
            }
        };
    }, [lat, lng]);

    return <div ref={mapRef} style={{ width: '100%', height: '100%', borderRadius: '8px' }} />;
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
    description: '', tags: '', images: [], lat: null, lng: null, university: '', genderPolicy: '',
};

export default function ListingPage({ mode = 'board', darkMode = false, editListingData, onEditHandled }) {
    const [listings, setListings] = useState([]);
    const [editingId, setEditingId] = useState(null);
    const [loading, setLoading] = useState(false);

    const { getPendingCount, notifyListingChange } = useBooking();
    const { user } = useAuth();

    const [form, setForm] = useState(EMPTY_FORM);
    const [imageFiles, setImageFiles] = useState([]);
    const [previewUrls, setPreviewUrls] = useState([]);
    const [errors, setErrors] = useState({});
    const [viewMode, setViewMode] = useState(mode);
    const [selectedId, setSelectedId] = useState(null);
    const [locationError, setLocationError] = useState('');

<<<<<<< Updated upstream
    const mapContainerRef = useRef(null);
    const mapInstanceRef = useRef(null);
    const markerRef = useRef(null);
=======
  const mapContainerRef = useRef(null);
  const mapInstanceRef  = useRef(null);
  const markerRef       = useRef(null);
>>>>>>> Stashed changes

    const theme = darkMode ? 'dark' : 'light';

    const setField = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

    useEffect(() => { setViewMode(mode); }, [mode]);

    useEffect(() => {
        if (editListingData) { startEdit(editListingData); if (onEditHandled) onEditHandled(); }
    }, [editListingData, onEditHandled]);

<<<<<<< Updated upstream
    // Load listings from backend API
    useEffect(() => {
        if (!user?.id) return;
        setLoading(true);

        listingsAPI.getListingsByLandlord(user.id)
            .then(response => {
                const data = Array.isArray(response) ? response : (response.data || []);
                setListings(data);
            })
            .catch(err => {
                console.error('Failed to load listings:', err);
                setListings([]);
            })
            .finally(() => {
                setLoading(false);
            });
    }, [user?.id]);

    // Cleanup preview URLs on unmount
    useEffect(() => {
        return () => {
            previewUrls.forEach((u) => URL.revokeObjectURL(u));
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (selectedId && !listings.find((l) => l.id === selectedId)) setSelectedId(null);
    }, [listings, selectedId]);

    // Map initialization
    useEffect(() => {
        if (viewMode !== 'manage') {
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove();
                mapInstanceRef.current = null;
                markerRef.current = null;
            }
            return;
        }

        const container = mapContainerRef.current;
        if (!container || mapInstanceRef.current) return;
=======
  useEffect(() => {
    const loadListings = async () => {
      try {
        const result = await listingsAPI.getByLandlord(user?.id);
        if (result.ok) {
          setListings(result.data);
        }
      } catch (err) {
        setListings([]);
      }
    };

    if (user?.id) loadListings();

    return () => {
      previewUrls.forEach((u) => URL.revokeObjectURL(u));
    };
  }, [user, previewUrls]);
>>>>>>> Stashed changes

        try {
            const centerLat = form.lat || CEBU_CENTER[0];
            const centerLng = form.lng || CEBU_CENTER[1];

            const map = L.map(container, {
                center: [centerLat, centerLng],
                zoom: 13,
                zoomControl: true,
                dragging: true,
                scrollWheelZoom: true
            });

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors'
            }).addTo(map);

            if (form.lat && form.lng) {
                markerRef.current = L.marker([form.lat, form.lng], { icon: defaultIcon }).addTo(map);
            }

            UNIVERSITIES.forEach((uni) => {
                const marker = L.marker(uni.coords, { icon: makeBlueLabel(uni.abbr) }).addTo(map);
                marker.bindPopup(`<b>${uni.name}</b>`);
            });

            map.on('click', (e) => {
                const { lat, lng } = e.latlng;

<<<<<<< Updated upstream
                if (lat < CEBU_BOUNDS.minLat || lat > CEBU_BOUNDS.maxLat ||
                    lng < CEBU_BOUNDS.minLng || lng > CEBU_BOUNDS.maxLng) {
                    setLocationError('Please pin a location within Cebu City only.');
                    return;
                }
=======
  function handleFileChange(e) {
    const files = e.target.files; if (!files) return;
    previewUrls.forEach((u) => URL.revokeObjectURL(u));
    const selected = Array.from(files).slice(0, 3);
    const oversized = selected.find((f) => f.size > MAX_IMAGE_SIZE_BYTES);
    if (oversized) {
      setErrors((prev) => ({ ...prev, images: 'Each image must be 2MB or less.' }));
      setImageFiles([]);
      setPreviewUrls([]);
      return;
    }
    const allowed = selected;
    setImageFiles(allowed); setPreviewUrls(allowed.map((f) => URL.createObjectURL(f)));
    setErrors((prev) => ({ ...prev, images: undefined }));
  }
>>>>>>> Stashed changes

                setLocationError('');
                setForm(f => ({ ...f, lat, lng }));

                if (markerRef.current) {
                    markerRef.current.setLatLng(e.latlng);
                } else {
                    markerRef.current = L.marker(e.latlng, { icon: defaultIcon }).addTo(map);
                }

<<<<<<< Updated upstream
                fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`)
                    .then(res => res.json())
                    .then(data => { if (data?.display_name) setForm(f => ({ ...f, address: data.display_name })); })
                    .catch(() => {});
            });

            mapInstanceRef.current = map;
        } catch (error) {
            console.error('Error initializing map:', error);
        }

        return () => {
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove();
                mapInstanceRef.current = null;
                markerRef.current = null;
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [viewMode]);

    // Update marker position when coordinates change
    useEffect(() => {
        if (mapInstanceRef.current && form.lat && form.lng) {
            mapInstanceRef.current.setView([form.lat, form.lng], 13);
            if (markerRef.current) {
                markerRef.current.setLatLng([form.lat, form.lng]);
            } else {
                markerRef.current = L.marker([form.lat, form.lng], { icon: defaultIcon }).addTo(mapInstanceRef.current);
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [form.lat, form.lng]);

    function resetForm() {
        setForm(EMPTY_FORM);
        previewUrls.forEach((u) => URL.revokeObjectURL(u));
        setPreviewUrls([]);
        setImageFiles([]);
        setErrors({});
        setEditingId(null);
        setLocationError('');
    }

    function validateForm() {
        const next = {};
        if (!form.title?.trim()) next.title = 'Title is required.';
        if (!form.address?.trim()) next.address = 'Address is required.';
        if (!form.lat || !form.lng) next.location = 'Please pin a location on the map.';
        if (!form.price || isNaN(Number(form.price)) || Number(form.price) <= 0)
            next.price = 'Enter a valid price.';
        if (!form.rooms) next.rooms = 'Select a room type.';
        if (!form.availableRooms) next.availableRooms = 'Select available rooms.';
        if (!form.genderPolicy) next.genderPolicy = 'Select a gender policy.';
        if (!form.description?.trim()) next.description = 'Description is required.';
        const totalImages = (form.images?.length || 0) + imageFiles.length;
        if (totalImages === 0) next.images = 'At least one photo is required.';
        setErrors(next);
        return Object.keys(next).length === 0;
    }

    function handleFileChange(e) {
        const files = e.target.files; if (!files) return;
        previewUrls.forEach((u) => URL.revokeObjectURL(u));
        const allowed = Array.from(files).slice(0, 3);
        setImageFiles(allowed);
        setPreviewUrls(allowed.map((f) => URL.createObjectURL(f)));
    }

    function removeSelectedImage(index) {
        const newFiles = [...imageFiles];
        newFiles.splice(index, 1);
        previewUrls.forEach((u) => URL.revokeObjectURL(u));
        setImageFiles(newFiles);
        setPreviewUrls(newFiles.map((f) => URL.createObjectURL(f)));
    }

    function removeExistingImage(index) {
        const imgs = [...(form.images || [])];
        imgs.splice(index, 1);
        setForm((f) => ({ ...f, images: imgs }));
    }

    async function handleAdd(e) {
        e.preventDefault();
        if (!validateForm()) return;
        setLoading(true);

        try {
            let finalImages = form.images || [];
            if (imageFiles.length > 0) {
                const dataUrls = await filesToDataUrls(imageFiles);
                finalImages = [...finalImages, ...dataUrls].slice(0, 3);
            }
            const tagsArray = form.tags ? form.tags.split(',').map((t) => t.trim()).filter(Boolean) : [];

            const listingData = {
                title: form.title,
                address: form.address,
                price: Number(form.price),
                rooms: form.rooms,
                availableRooms: Number(form.availableRooms),
                description: form.description,
                tags: tagsArray,
                images: finalImages,
                lat: form.lat,
                lng: form.lng,
                university: form.university,
                genderPolicy: form.genderPolicy,
            };

            const response = await listingsAPI.create(listingData, user.id);

            if (response.success) {
                const newListing = response.listing || response.data?.listing;
                setListings(prev => [newListing, ...prev]);
                notifyListingChange();
                window.dispatchEvent(new Event('dormscout:listingUpdated'));
                resetForm();
                setViewMode('board');
            } else {
                setErrors({ general: response.message || 'Failed to create listing' });
            }
        } catch (err) {
            console.error('Create listing error:', err);
            setErrors({ general: 'Failed to create listing' });
        } finally {
            setLoading(false);
        }
    }

    async function handleUpdate(e) {
        e.preventDefault();
        if (!validateForm()) return;
        setLoading(true);

        try {
            let finalImages = form.images || [];
            if (imageFiles.length > 0) {
                const dataUrls = await filesToDataUrls(imageFiles);
                finalImages = [...finalImages, ...dataUrls].slice(0, 3);
            }
            const tagsArray = form.tags ? form.tags.split(',').map((t) => t.trim()).filter(Boolean) : [];

            const updates = {
                title: form.title,
                address: form.address,
                price: Number(form.price),
                rooms: form.rooms,
                availableRooms: Number(form.availableRooms),
                description: form.description,
                tags: tagsArray,
                images: finalImages,
                lat: form.lat,
                lng: form.lng,
                university: form.university,
                genderPolicy: form.genderPolicy,
            };

            const response = await listingsAPI.update(editingId, updates);

            if (response.success) {
                setListings(prev => prev.map(l => l.id === editingId ? { ...l, ...updates } : l));
                notifyListingChange();
                window.dispatchEvent(new Event('dormscout:listingUpdated'));
                resetForm();
                setViewMode('board');
            } else {
                setErrors({ general: response.message || 'Failed to update listing' });
            }
        } catch (err) {
            console.error('Update listing error:', err);
            setErrors({ general: 'Failed to update listing' });
        } finally {
            setLoading(false);
        }
    }

    async function removeListing(id) {
        if (!window.confirm('Delete this listing?')) return;
        setLoading(true);

        try {
            const response = await listingsAPI.delete(id);
            if (response.success) {
                setListings(prev => prev.filter(l => l.id !== id));
                notifyListingChange();
                window.dispatchEvent(new Event('dormscout:listingUpdated'));
                if (selectedId === id) setSelectedId(null);
            } else {
                alert(response.message || 'Failed to delete listing');
            }
        } catch (err) {
            console.error('Delete listing error:', err);
            alert('Failed to delete listing');
        } finally {
            setLoading(false);
        }
    }

    function startEdit(listing) {
        setEditingId(listing.id);
        setForm({
            title: listing.title || '',
            address: listing.address || '',
            price: listing.price || '',
            rooms: listing.rooms || '',
            availableRooms: listing.availableRooms || '',
            description: listing.description || '',
            tags: (listing.tags || []).join(', '),
            images: listing.images || [],
            lat: listing.lat || null,
            lng: listing.lng || null,
            university: listing.university || '',
            genderPolicy: listing.genderPolicy || '',
        });

        if (mapInstanceRef.current) {
            mapInstanceRef.current.remove();
            mapInstanceRef.current = null;
            markerRef.current = null;
        }

        setViewMode('manage');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function createNewListing() {
        resetForm();
        setViewMode('manage');
        setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 50);
=======
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

    const tagsArray = form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [];

    try {
      const listingData = {
        title: form.title,
        address: form.address,
        price: parseFloat(form.price),
        latitude: form.lat,
        longitude: form.lng,
        description: form.description,
        totalRooms: parseInt(form.rooms, 10) || 1,
        availableRooms: parseInt(form.availableRooms, 10) || 1,
        university: form.university,
        genderPolicy: form.genderPolicy,
        tags: tagsArray.join(','),
        images: JSON.stringify(finalImages),
        status: 'Active',
      };

      const result = await listingsAPI.create(listingData, user.id);

      if (result.ok) {
        const created = (result.data && result.data.listing) || result.listing || result.data;
        const newListing = {
          ...created,
          id: created.id,
          lat: form.lat,
          lng: form.lng,
          images: finalImages,
          tags: tagsArray,
          landlordId: user?.id,
          landlordName: user?.name,
        };
        const newListings = [newListing, ...listings];
        setListings(newListings);
        notifyListingChange();
        resetForm();
        setViewMode('board');
      }
    } catch (err) {
      console.error('Failed to create listing', err);
      setErrors({ general: 'Failed to create listing. Make sure backend is running.' });
>>>>>>> Stashed changes
    }

<<<<<<< Updated upstream
    if (loading && listings.length === 0) {
        return (
            <div className={`listing-wrapper ${theme}`}>
                <div style={{ padding: 40, textAlign: 'center' }}>
                    <div style={{ fontSize: '2rem' }}>⏳</div>
                    <p>Loading listings...</p>
=======
  async function handleUpdate(e) {
    e.preventDefault(); if (!validateForm()) return;
    setLoading(true);

    try {
      let finalImages = form.images || [];
      if (imageFiles.length > 0) {
        const dataUrls = await filesToDataUrls(imageFiles);
        finalImages = [...finalImages, ...dataUrls].slice(0, 3);
      }
      const tagsArray = form.tags ? form.tags.split(',').map((t) => t.trim()).filter(Boolean) : [];
      const originalListing = listings.find((l) => l.id === editingId);
      const originalImages = Array.isArray(originalListing?.images) ? originalListing.images : [];
      const imagesChanged = imageFiles.length > 0 || JSON.stringify(form.images || []) !== JSON.stringify(originalImages);

      const updates = {
        title: form.title,
        address: form.address,
        price: parseFloat(form.price) || 0,
        totalRooms: parseInt(form.rooms, 10) || 1,
        availableRooms: parseInt(form.availableRooms, 10) || 1,
        description: form.description,
        tags: tagsArray.join(','),
        latitude: form.lat,
        longitude: form.lng,
        university: form.university,
        genderPolicy: form.genderPolicy,
      };

      if (imagesChanged) {
        updates.images = JSON.stringify(finalImages);
      }

      const response = await listingsAPI.update(editingId, updates);

      if (response.success) {
        const updatedListing = response.listing || response.data?.listing;
        setListings(prev => prev.map(l => l.id === editingId ? {
          ...l,
          ...updates,
          ...updatedListing,
          rooms: updates.totalRooms,
          lat: updates.latitude,
          lng: updates.longitude,
          tags: tagsArray,
          images: finalImages,
        } : l));
        notifyListingChange();
        resetForm();
        setViewMode('board');
      } else {
        setErrors({ general: response.message || 'Failed to update listing' });
      }
    } catch (err) {
      console.error('Update listing error:', err);
      setErrors({ general: 'Failed to update listing' });
    } finally {
      setLoading(false);
    }
  }

  async function removeListing(id) {
    if (!window.confirm('Delete this listing?')) return;
    setLoading(true);

    try {
      const response = await listingsAPI.delete(id);
      if (response.success) {
        setListings(prev => prev.filter(l => l.id !== id));
        notifyListingChange();
        if (selectedId === id) setSelectedId(null);
      } else {
        setErrors({ general: response.message || 'Failed to delete listing' });
      }
    } catch (err) {
      console.error('Delete listing error:', err);
      setErrors({ general: 'Failed to delete listing' });
    } finally {
      setLoading(false);
    }
  }

  function startEdit(listing) {
    setEditingId(listing.id);
    setForm({
      title: listing.title || '', address: listing.address || '', price: listing.price || '',
      rooms: listing.rooms || '', availableRooms: listing.availableRooms || '',
      description: listing.description || '', tags: (listing.tags || []).join(', '),
      images: listing.images || [], lat: listing.lat || null, lng: listing.lng || null,
      university: listing.university || '', genderPolicy: listing.genderPolicy || '',
    });
    if (mapInstanceRef.current) { mapInstanceRef.current.remove(); mapInstanceRef.current = null; markerRef.current = null; }
    setViewMode('manage'); window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function createNewListing() {
    resetForm(); setViewMode('manage');
    setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 50);
  }

  if (loading && listings.length === 0) {
    return <div style={{ padding: 40, textAlign: 'center' }}>Loading listings...</div>;
  }

  return (
    <div className={`listing-wrapper ${theme}`}>
      <div className="listing-layout">
        <div className="listing-main">
          {viewMode === 'board' ? (
            <>
              <h3 className="listing-section-title">My Listings</h3>
              <p className="listing-section-subtitle">Manage your properties. Click a card to select.</p>

              {listings.length === 0 ? (
                <div className="listing-empty">
                  <p>No listings yet.</p>
                  <p>Create your first listing to get started!</p>
>>>>>>> Stashed changes
                </div>
            </div>
        );
    }

    return (
        <div className={`listing-wrapper ${theme}`}>
            <div className="listing-layout">
                <div className="listing-main">
                    {viewMode === 'board' ? (
                        <>
                            <h3 className="listing-section-title">My Listings</h3>
                            <p className="listing-section-subtitle">Manage your properties.</p>

                            {listings.length === 0 ? (
                                <div className="listing-empty">
                                    <p>No listings yet.</p>
                                    <p>Create your first listing to get started!</p>
                                </div>
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
                                                        <div className="listing-card-price">₱{Number(l.price).toLocaleString()}</div>
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
                                    disabled={!selectedId || loading}
                                >
                                    {loading ? 'Deleting...' : 'Delete Selected'}
                                </button>
                                <button className="btn-create-listing" onClick={createNewListing}>
                                    + Create New Listing
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
                            <h3 className="listing-section-title">
                                {editingId ? 'Edit Listing' : 'Create New Listing'}
                            </h3>
                            <p className="listing-section-subtitle">Click the map to set the exact location.</p>

                            <form className="listing-form" onSubmit={editingId ? handleUpdate : handleAdd}>
                                {errors.general && (
                                    <div style={{ padding: '10px', backgroundColor: '#fee', color: '#c00', borderRadius: '6px', marginBottom: '12px' }}>
                                        {errors.general}
                                    </div>
                                )}

                                <div className="form-row-2">
                                    <div className="form-field">
                                        <input className="listing-input" value={form.title} onChange={setField('title')} placeholder="Listing title" />
                                        {errors.title && <div className="form-error">{errors.title}</div>}
                                    </div>
                                    <div className="form-field">
                                        <div className="listing-price-wrap">
                                            <span className="listing-price-symbol">₱</span>
                                            <input
                                                className="listing-input listing-price-input"
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                value={form.price}
                                                onChange={setField('price')}
                                                placeholder="0.00"
                                            />
                                        </div>
                                        {errors.price && <div className="form-error">{errors.price}</div>}
                                    </div>
                                </div>

                                <div className="form-mt">
                                    <input className="listing-input" value={form.address} onChange={setField('address')} placeholder="Address / Location Name" />
                                    {errors.address && <div className="form-error">{errors.address}</div>}
                                </div>

                                <div
                                    ref={mapContainerRef}
                                    className="listing-map-inner"
                                    style={{ height: '300px', borderRadius: '12px', marginTop: '12px', border: '2px solid #5BADA8' }}
                                />

                                <div className="listing-map-hint">
                                    {locationError && (
                                        <p style={{ color: '#dc3545', fontSize: '0.8rem', marginTop: '4px', fontWeight: 600 }}>
                                            ❌ {locationError}
                                        </p>
                                    )}
                                    <p className="listing-map-hint-text">📍 Click on the map to pin the location.</p>
                                    <span className="listing-cebu-badge">⚠️ Cebu City Only</span>
                                </div>
                                {errors.location && <div className="form-error">{errors.location}</div>}

                                <div className="form-row-2 form-mt">
                                    <div>
                                        <select className="listing-select" value={form.rooms} onChange={setField('rooms')}>
                                            <option value="">Room Type</option>
                                            <option value="Single Room">Single Room</option>
                                            <option value="Double Room">Double Room</option>
                                            <option value="Triple Room">Triple Room</option>
                                            <option value="Quad Room">Quad Room</option>
                                            <option value="Studio Room">Studio Room</option>
                                            <option value="Loft Room">Loft Room</option>
                                        </select>
                                        {errors.rooms && <div className="form-error">{errors.rooms}</div>}
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
                                        {errors.availableRooms && <div className="form-error">{errors.availableRooms}</div>}
                                    </div>
                                </div>

                                <div className="form-mt">
                                    <label className="listing-upload-label">Gender Policy</label>
                                    <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                                        {['Girls Only', 'Boys Only', 'Mixed'].map((g) => (
                                            <button
                                                key={g}
                                                type="button"
                                                onClick={() => setForm((f) => ({ ...f, genderPolicy: g }))}
                                                style={{
                                                    flex: 1, padding: '10px', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '13px',
                                                    border: form.genderPolicy === g ? '2px solid #E8622E' : '1px solid #ddd',
                                                    background: form.genderPolicy === g ? '#E8622E15' : '#fff',
                                                    color: form.genderPolicy === g ? '#E8622E' : '#333',
                                                }}
                                            >
                                                {g}
                                            </button>
                                        ))}
                                    </div>
                                    {errors.genderPolicy && <div className="form-error">{errors.genderPolicy}</div>}
                                </div>

                                <textarea className="listing-textarea form-mt" value={form.description} onChange={setField('description')} placeholder="Short description" />
                                {errors.description && <div className="form-error">{errors.description}</div>}

                                <div className="form-mt">
                                    <label className="listing-upload-label">Upload images (max 3) <span style={{ color: '#e53e3e' }}>*</span></label>
                                    <input className="listing-input" value={form.tags} onChange={setField('tags')} placeholder="Tags (comma separated)" style={{ marginBottom: 12 }} />
                                    <input type="file" accept="image/*" multiple onChange={handleFileChange} />
                                    {errors.images && <div className="form-error" style={{ marginTop: 6 }}>{errors.images}</div>}
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
                                    <button type="submit" className="btn-submit-listing" disabled={loading}>
                                        {loading ? 'Saving...' : (editingId ? 'Update Listing' : 'Add Listing')}
                                    </button>
                                    <button type="button" className="btn-cancel-listing" onClick={() => { resetForm(); setViewMode('board'); }}>
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </>
                    )}
                </div>

                <aside className="listing-aside">
                    <div className="listing-tips-card">
                        <h4 className="listing-tips-card-title">Listing Tips</h4>
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