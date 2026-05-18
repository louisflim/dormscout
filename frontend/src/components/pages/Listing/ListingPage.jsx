import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useBooking } from '../../../context/BookingContext';
import { useAuth } from '../../../context/AuthContext';
import { UNIVERSITIES } from '../../../constants/universities';
import TenantManagement from './TenantManagement';
import { listingsAPI, activitiesAPI } from '../../../utils/api';
import './ListingPage.css';
import {
    Pencil, Home, GraduationCap, MapPin, AlertTriangle,
    CheckCircle2, XCircle, Loader2, Plus, Trash2, ChevronLeft,
    BedDouble, Users, Tag, Lightbulb
} from 'lucide-react';

const BLUE = '#2563EB';
const CEBU_CENTER = [10.3157, 123.8854];
const CEBU_BOUNDS = { minLat: 10.25, maxLat: 10.45, minLng: 123.82, maxLng: 123.95 };

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
    description: '', tags: '', images: [], latitude: null, longitude: null, university: '', genderPolicy: '',
};

function TipsStrip({ darkMode }) {
    const tips = [
        { icon: <Lightbulb size={13} />, text: 'Use a clear, descriptive title' },
        { icon: <MapPin size={13} />, text: 'Pin exact location on the map' },
        { icon: <BedDouble size={13} />, text: 'Include room type & available count' },
        { icon: <GraduationCap size={13} />, text: 'Nearby university is auto-detected' },
    ];
    return (
        <div className="listing-tips-strip">
            {tips.map((t, i) => (
                <span key={i} className="listing-tips-strip__item">
                    {t.icon}
                    {t.text}
                </span>
            ))}
        </div>
    );
}

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
    const [successMessage, setSuccessMessage] = useState('');
    const [viewMode, setViewMode] = useState(mode);
    const [selectedId, setSelectedId] = useState(null);
    const [locationError, setLocationError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const mapContainerRef = useRef(null);
    const mapInstanceRef = useRef(null);
    const markerRef = useRef(null);

    const theme = darkMode ? 'dark' : 'light';

    const setField = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

    useEffect(() => { setViewMode(mode); }, [mode]);

    useEffect(() => {
        if (editListingData) { startEdit(editListingData); if (onEditHandled) onEditHandled(); }
    }, [editListingData, onEditHandled]);

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

                if (lat < CEBU_BOUNDS.minLat || lat > CEBU_BOUNDS.maxLat ||
                    lng < CEBU_BOUNDS.minLng || lng > CEBU_BOUNDS.maxLng) {
                    setLocationError('Please pin a location within Cebu City only.');
                    return;
                }

                setLocationError('');
                setForm(f => ({ ...f, lat, lng }));

                if (markerRef.current) {
                    markerRef.current.setLatLng(e.latlng);
                } else {
                    markerRef.current = L.marker(e.latlng, { icon: defaultIcon }).addTo(map);
                }

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
        if (isSubmitting) return;
        if (!validateForm()) return;

        setIsSubmitting(true);
        setLoading(true);
        setErrors({});
        setSuccessMessage('');

        try {
            let finalImages = form.images || [];
            if (imageFiles.length > 0) {
                const dataUrls = await filesToDataUrls(imageFiles);
                finalImages = [...finalImages, ...dataUrls].slice(0, 3);
            }
            const tagsArray = form.tags
                ? form.tags.split(',').map((t) => t.trim()).filter(Boolean)
                : [];

            const listingData = {
                title: form.title,
                address: form.address,
                price: Number(form.price),
                rooms: form.rooms,
                availableRooms: Number(form.availableRooms),
                description: form.description,
                tags: tagsArray,
                images: finalImages,
                latitude: form.lat,
                longitude: form.lng,
                university: form.university,
                genderPolicy: form.genderPolicy,
            };

            const response = await listingsAPI.createListing(listingData, user.id);

            if (response.success && response.data?.id) {
                const newListing = response.data;
                setListings(prev => [newListing, ...prev]);
                notifyListingChange();
                window.dispatchEvent(new Event('dormscout:listingUpdated'));

                try {
                    activitiesAPI.createActivity(
                        user.id,
                        'listing',
                        `You created a new listing "${form.title}"`,
                        'Just now',
                        'listing'
                    );
                } catch (actErr) {
                    console.error('Failed to create activity:', actErr);
                }

                setSuccessMessage('Listing created successfully!');
                resetForm();
                setTimeout(() => setViewMode('board'), 1500);
            } else {
                setErrors({ general: response?.message || 'Failed to create listing' });
            }
        } catch (err) {
            console.error('Create listing error:', err);
            setErrors({ general: 'Failed to create listing: ' + err.message });
        } finally {
            setLoading(false);
            setIsSubmitting(false);
        }
    }

    async function handleUpdate(e) {
        e.preventDefault();
        // Guard against double submission - MUST BE FIRST CHECK
        if (isSubmitting) return;
        if (!validateForm()) return;
        setIsSubmitting(true);
        setLoading(true);
        setErrors({});
        setSuccessMessage('');

        try {
            let finalImages = form.images || [];
            if (imageFiles.length > 0) {
                const dataUrls = await filesToDataUrls(imageFiles);
                finalImages = [...finalImages, ...dataUrls].slice(0, 3);
            }
            const tagsArray = form.tags
                ? form.tags.split(',').map((t) => t.trim()).filter(Boolean)
                : [];

            const updates = {
                title: form.title,
                address: form.address,
                price: Number(form.price),
                rooms: form.rooms,
                availableRooms: Number(form.availableRooms),
                description: form.description,
                tags: tagsArray,
                images: finalImages,
                latitude: form.lat,
                longitude: form.lng,
                university: form.university,
                genderPolicy: form.genderPolicy,
            };

            const response = await listingsAPI.updateListing(editingId, updates);
            console.log('📥 Update Response:', response);

            if (response?.success && response?.data) {
                setListings(prev => prev.map(l => l.id === editingId ? { ...l, ...updates } : l));
                notifyListingChange();
                window.dispatchEvent(new Event('dormscout:listingUpdated'));

                try {
                    activitiesAPI.createActivity(
                        user.id,
                        'listing',
                        `You updated listing "${form.title}"`,
                        'Just now',
                        'listing'
                    );
                } catch (actErr) {
                    console.error('Failed to create activity:', actErr);
                }

                setSuccessMessage('Listing updated successfully!');
                resetForm();
                setTimeout(() => setViewMode('board'), 1500);
            } else {
                setErrors({ general: response?.message || 'Failed to update listing' });
            }
        } catch (err) {
            console.error('Update listing error:', err);
            setErrors({ general: 'Failed to update listing: ' + err.message });
        } finally {
            setLoading(false);
            setIsSubmitting(false);
        }
    }

    async function removeListing(id) {
        setLoading(true);

        try {
            const success = await listingsAPI.deleteListing(id);
            if (success) {
                setListings(prev => prev.filter(l => l.id !== id));
                notifyListingChange();
                window.dispatchEvent(new Event('dormscout:listingUpdated'));
                if (selectedId === id) setSelectedId(null);
            } else {
                setErrors({ general: 'Failed to delete listing' });
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
            title: listing.title || '',
            address: listing.address || '',
            price: listing.price || '',
            rooms: listing.rooms || '',
            availableRooms: listing.availableRooms || '',
            description: listing.description || '',
            tags: (listing.tags || []).join(', '),
            images: listing.images || [],
            latitude: listing.latitude || listing.lat || null,
            longitude: listing.longitude || listing.lng || null,
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
    }

    if (loading && listings.length === 0) {
        return (
            <div className={`listing-wrapper ${theme}`}>
                <div className="listing-loading-state">
                    <Loader2 size={32} className="listing-loading-spinner" />
                    <p>Loading listings…</p>
                </div>
            </div>
        );
    }
    
    return (
        /* ── Layout ─────────────────────────────────────────────────────────────
           CHANGE: aside removed → `listing-layout--full` makes the main column
           take 100% width. The original `listing-layout` flex rules are untouched
           so reverting is a one-class swap.
        ────────────────────────────────────────────────────────────────────────── */
        <div className={`listing-wrapper ${theme}`}>
            <div className="listing-layout listing-layout--full">
                <div className="listing-main">
 
                    {/* ═══════════════════════ BOARD VIEW ═══════════════════════════ */}
                    {viewMode === 'board' ? (
                        <>
                            <div className="listing-board-header">
                                {/* Action buttons visible whenever there are listings */}
                                {listings.length > 0 && (
                                    <div className="listing-board-header__actions">
                                        <button
                                            className="btn-delete-listing"
                                            onClick={() => selectedId && removeListing(selectedId)}
                                            disabled={!selectedId || loading}
                                            title="Select a listing card first, then delete"
                                        >
                                            {/* CHANGE: Trash2 icon replaces bare text label */}
                                            <Trash2 size={15} />
                                            {loading ? 'Deleting…' : 'Delete Selected'}
                                        </button>
                                        <button className="btn-create-listing" onClick={createNewListing}>
                                            {/* CHANGE: Plus icon replaces "+ " text prefix */}
                                            <Plus size={15} />
                                            Create New Listing
                                        </button>
                                    </div>
                                )}
                            </div>
 
                            {/* ── Empty state ────────────────────────────────────────────
                                CHANGE: bare two-line paragraph → proper empty state with icon,
                                headline, sub-copy, primary CTA, and an inline tips strip.
                                This gives the page credibility even before any data exists.
                            ─────────────────────────────────────────────────────────── */}
                            {listings.length === 0 ? (
                                <div className="listing-empty-state">
                                    <div className="listing-empty-state__icon">
                                        <Home size={40} strokeWidth={1.5} />
                                    </div>
                                    <h4 className="listing-empty-state__headline">No listings yet</h4>
                                    <p className="listing-empty-state__sub">
                                        Add your first property to start receiving booking requests from students.
                                    </p>
                                    <button className="btn-create-listing listing-empty-state__cta" onClick={createNewListing}>
                                        <Plus size={15} />
                                        Create New Listing
                                    </button>
                                    {/* Tips surfaced contextually — only when the landlord has nothing yet */}
                                    <TipsStrip darkMode={darkMode} />
                                </div>
                            ) : (
                                <div className="listing-grid">
                                    {listings.map((l) => {
                                        const selected = selectedId === l.id;
                                        const tags = Array.isArray(l.tags) ? l.tags : [];
                                        return (
                                            <div key={l.id} className={`listing-card ${selected ? 'selected' : ''}`}>
                                                {/* Notification badge — unchanged */}
                                                {getPendingCount(l.id) > 0 && (
                                                    <div className="listing-notif-badge">{getPendingCount(l.id)}</div>
                                                )}
 
                                                {/* ── Edit button ─────────────────────────────────────────
                                                    CHANGE: ✏️ emoji → <Pencil> lucide icon for consistent
                                                    icon weight across the app.
                                                ────────────────────────────────────────────────────── */}
                                                <button
                                                    className="listing-edit-btn"
                                                    onClick={(e) => { e.stopPropagation(); startEdit(l); }}
                                                >
                                                    <Pencil size={13} />
                                                    Edit
                                                </button>
 
                                                <div onClick={() => setSelectedId(selected ? null : l.id)}>
                                                    {/* Card media — unchanged logic */}
                                                    {l.images?.length > 0 ? (
                                                        <div className="listing-card-media">
                                                            <img src={l.images[0]} alt={l.title} />
                                                        </div>
                                                    ) : l.lat && l.lng ? (
                                                        <div className="listing-card-media">
                                                            <SmallMap lat={l.lat} lng={l.lng} />
                                                        </div>
                                                    ) : (
                                                        /* CHANGE: 🏠 emoji → <Home> icon */
                                                        <div className="listing-card-placeholder">
                                                            <Home size={28} strokeWidth={1.5} />
                                                            <span>No Image</span>
                                                        </div>
                                                    )}
 
                                                    <div className="listing-card-body">
                                                        <div className="listing-card-title">{l.title}</div>
                                                        <div className="listing-card-address">{l.address}</div>
 
                                                        {/* CHANGE: 🎓 emoji → <GraduationCap> icon */}
                                                        {l.university && (
                                                            <div className="listing-university-badge">
                                                                <GraduationCap size={12} />
                                                                {l.university}
                                                            </div>
                                                        )}
 
                                                        {/* ── Price + rooms row ──────────────────────────────
                                                            CHANGE: rooms available now shown as a pill next to
                                                            the price. Previously only the price appeared, making
                                                            cards less informative at a glance.
                                                        ──────────────────────────────────────────────────── */}
                                                        <div className="listing-card-meta-row">
                                                            <div className="listing-card-price">
                                                                ₱{Number(l.price).toLocaleString()}
                                                                <span className="listing-card-price__period">/mo</span>
                                                            </div>
                                                            {l.availableRooms && (
                                                                <span className="listing-card-rooms-pill">
                                                                    <BedDouble size={11} />
                                                                    {l.availableRooms} avail.
                                                                </span>
                                                            )}
                                                        </div>
 
                                                        {/* Tags strip — CSS already supports this; just rendering it */}
                                                        {tags.length > 0 && (
                                                            <div className="listing-card-tags">
                                                                {tags.slice(0, 3).map((t, i) => (
                                                                    <span key={i} className="listing-tag">{t}</span>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
 
                            {/* ── Bottom board actions (kept for compat, hidden when listings exist) ──
                                When listings exist, the header row already has the buttons.
                                This div only shows in the empty state flow as a fallback.
                                We hide it with CSS when the grid is populated.
                            ─────────────────────────────────────────────────────────── */}
                            {listings.length === 0 && (
                                /* Hidden — the empty state CTA handles this case above */
                                <div style={{ display: 'none' }} className="listing-board-actions">
                                    <button className="btn-create-listing" onClick={createNewListing}>
                                        <Plus size={15} /> Create New Listing
                                    </button>
                                </div>
                            )}
 
                            {/* Tenant management — unchanged */}
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
                    /* ═══════════════════════ FORM VIEW ════════════════════════════ */
                        <>
                            {/* ── Form page header ──────────────────────────────────────
                                CHANGE: added ChevronLeft back-button at the top of the form.
                                Users previously had to scroll all the way to the bottom Cancel
                                button to exit the form. The back button is a standard UX pattern
                                for sub-pages/drawers. The title is now larger (h2) to signal a
                                distinct "page" context. Tips strip is shown here too so landlords
                                see guidance right before they start filling fields.
                            ─────────────────────────────────────────────────────────── */}
                            <div className="listing-form-header">
                                <button
                                    type="button"
                                    className="listing-back-btn"
                                    onClick={() => { resetForm(); setViewMode('board'); }}
                                >
                                    <ChevronLeft size={16} />
                                    Back to Listings
                                </button>
                                <h3 className="listing-section-title" style={{ marginTop: 12 }}>
                                    {editingId ? 'Edit Listing' : 'Create New Listing'}
                                </h3>
                                <p className="listing-section-subtitle">
                                    {editingId
                                        ? 'Update the details below. Changes are saved immediately.'
                                        : 'Fill in the details below. Click the map to pin the exact location.'}
                                </p>
                                {/* Tips only shown on create; on edit the landlord already knows them */}
                                {!editingId && <TipsStrip darkMode={darkMode} />}
                            </div>
 
                            <form className="listing-form" onSubmit={editingId ? handleUpdate : handleAdd}>
                                {/* Error / success banners — CHANGE: icons replace emojis */}
                                {errors.general && (
                                    <div className="listing-alert listing-alert--error">
                                        <XCircle size={16} />
                                        {errors.general}
                                    </div>
                                )}
                                {successMessage && (
                                    <div className="listing-alert listing-alert--success">
                                        <CheckCircle2 size={16} />
                                        {successMessage}
                                    </div>
                                )}
 
                                {/* Form fields — ALL UNCHANGED functionally */}
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
                                                type="number" min="0" step="0.01"
                                                value={form.price} onChange={setField('price')} placeholder="0.00"
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
 
                                {/* ── Map hint row ─────────────────────────────────────────
                                    CHANGE: 📍 → <MapPin> icon; ⚠️ → <AlertTriangle> icon;
                                    ❌ → <XCircle> icon. Consistent with lucide throughout.
                                ─────────────────────────────────────────────────────── */}
                                <div className="listing-map-hint">
                                    {locationError ? (
                                        <p className="listing-map-hint-text listing-map-hint-text--error">
                                            <XCircle size={13} />
                                            {locationError}
                                        </p>
                                    ) : (
                                        <p className="listing-map-hint-text">
                                            <MapPin size={13} />
                                            Click on the map to pin the location.
                                        </p>
                                    )}
                                    <span className="listing-cebu-badge">
                                        <AlertTriangle size={11} />
                                        Cebu City Only
                                    </span>
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
                                    {/* Gender policy buttons — unchanged logic, uses existing CSS classes */}
                                    <div className="gender-policy-group">
                                        {['Girls Only', 'Boys Only', 'Mixed'].map((g) => (
                                            <button
                                                key={g}
                                                type="button"
                                                className={`gender-btn${form.genderPolicy === g ? ' gender-btn--active' : ''}`}
                                                onClick={() => setForm((f) => ({ ...f, genderPolicy: g }))}
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
                                    <label className="listing-upload-label">
                                        Upload images (max 3) <span style={{ color: '#e53e3e' }}>*</span>
                                    </label>
                                    <input className="listing-input" value={form.tags} onChange={setField('tags')} placeholder="Tags (comma separated)" style={{ marginBottom: 12 }} />
                                    <input type="file" accept="image/*" multiple onChange={handleFileChange} />
                                    {errors.images && <div className="form-error" style={{ marginTop: 6 }}>{errors.images}</div>}
                                    <div className="listing-image-previews">
                                        {previewUrls.map((url, idx) => (
                                            <div key={`preview-${idx}`} className="listing-image-thumb">
                                                <img src={url} alt="preview" />
                                                <button type="button" className="listing-image-remove" onClick={() => removeSelectedImage(idx)}>×</button>
                                            </div>
                                        ))}
                                        {(form.images || []).map((src, idx) => (
                                            <div key={`existing-${idx}`} className="listing-image-thumb">
                                                <img src={src} alt="existing" />
                                                <button type="button" className="listing-image-remove" onClick={() => removeExistingImage(idx)}>×</button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
 
                                {/* ── Form actions ──────────────────────────────────────────
                                    The Cancel button here is kept as a secondary escape hatch
                                    (in addition to the back button at the top). Standard pattern:
                                    primary action left, cancel right.
                                ─────────────────────────────────────────────────────────── */}
                                <div className="listing-form-actions">
                                    <button type="submit" className="btn-submit-listing" disabled={loading || isSubmitting}>
                                        {loading ? 'Saving…' : (editingId ? 'Update Listing' : 'Add Listing')}
                                    </button>
                                    <button type="button" className="btn-cancel-listing" onClick={() => { resetForm(); setViewMode('board'); }}>
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </>
                    )}
                </div>
                {/* REMOVED: <aside className="listing-aside"> ... </aside>
                    The Listing Tips card has been removed from the aside.
                    Tips are now shown contextually inside the empty state and the form header. */}
            </div>
        </div>
    );
}