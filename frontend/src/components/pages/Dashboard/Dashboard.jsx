import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Map from '../Map/Map';
import ListingPage from '../Listing/ListingPage';
import BookingPage from '../Booking/BookingPage';
import Reviews from '../Reviews/Reviews';
import Messaging from '../Messaging/Messaging';
import Settings from '../Settings/Settings';
import Notifications from '../Notifications/Notifications';
import { useBooking } from '../../../context/BookingContext';
import { useAuth } from '../../../context/AuthContext';
import './Dashboard.css';

import {
  LayoutDashboard,
  MapPin,
  ClipboardList,
  CalendarDays,
  Bell,
  MessageCircle,
  Settings as SettingsIcon,
  Star,
  User,
  LogOut,
  Moon,
  Sun,
  HelpCircle,
  Info,
  Search,
  Home,
  ChevronRight,
  TrendingUp,
  Clock,
  Plus,
} from 'lucide-react';

const NAV_ITEMS = {
  landlord: [
    { id: 'overview',      label: 'Overview'       },
    { id: 'map',           label: 'Map View'        },
    { id: 'listing',       label: 'Listing'         },
    { id: 'notifications', label: 'Notifications'   },
    { id: 'messages',      label: 'Messages'        },
    { id: 'settings',      label: 'Settings'        },
    { id: 'reviews',       label: 'Reviews'         },
  ],
  tenant: [
    { id: 'overview',      label: 'Overview'       },
    { id: 'map',           label: 'Map View'        },
    { id: 'booking',       label: 'Booking'         },
    { id: 'notifications', label: 'Notifications'   },
    { id: 'messages',      label: 'Messages'        },
    { id: 'settings',      label: 'Settings'        },
    { id: 'reviews',       label: 'Reviews'         },
  ],
};

const NAV_ICON = {
  overview:      (c) => <LayoutDashboard size={18} color={c} />,
  map:           (c) => <MapPin          size={18} color={c} />,
  listing:       (c) => <ClipboardList   size={18} color={c} />,
  booking:       (c) => <CalendarDays    size={18} color={c} />,
  notifications: (c) => <Bell            size={18} color={c} />,
  messages:      (c) => <MessageCircle   size={18} color={c} />,
  settings:      (c) => <SettingsIcon    size={18} color={c} />,
  reviews:       (c) => <Star            size={18} color={c} />,
};

const ACTIVITY_ICON = {
  message:      <MessageCircle size={15} color="#5BADA8" />,
  notification: <Bell          size={15} color="#E8622E" />,
  review:       <Star          size={15} color="#F59E0B" />,
  booking:      <CalendarDays  size={15} color="#5BADA8" />,
  listing:      <Home          size={15} color="#E8622E" />,
};

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

const SECTION_LABELS = {
  map:           <><span style={{ color: '#E8622E' }}>Map </span><span style={{ color: '#5BADA8' }}>View</span></>,
  settings:      <><span style={{ color: '#E8622E' }}>Settings </span><span style={{ color: '#5BADA8' }}>View</span></>,
  reviews:       <><span style={{ color: '#E8622E' }}>Reviews </span><span style={{ color: '#5BADA8' }}>View</span></>,
  booking:       <><span style={{ color: '#E8622E' }}>Booking </span><span style={{ color: '#5BADA8' }}>View</span></>,
  notifications: <><span style={{ color: '#E8622E' }}>Notifications </span><span style={{ color: '#5BADA8' }}>View</span></>,
  listing:       <><span style={{ color: '#E8622E' }}>Listing </span><span style={{ color: '#5BADA8' }}>View</span></>,
  messages:      <><span style={{ color: '#E8622E' }}>Messages </span><span style={{ color: '#5BADA8' }}>View</span></>,
};

const SECTION_DESCRIPTIONS = {
  map:           'Search for dorms around Cebu City and find the perfect dorm near campus',
  settings:      'Manage your profile, security, and application preferences.',
  reviews:       'Real feedback from students who have lived there',
  booking:       'Manage and track all your boarding house booking requests.',
  notifications: 'Stay updated with booking requests, approvals, and messages.',
  messages:      'Chat with landlords and property managers about bookings.',
  listing:       'Create and manage your property listings.',
};

// ─── Shared UI ────────────────────────────────────────────────────────────────

function StatusBadge({ status }) {
  const map = {
    Active:   { bg: 'rgba(91,173,168,0.15)',  color: '#5BADA8' },
    Pending:  { bg: 'rgba(245,158,11,0.15)',  color: '#B45309' },
    Rejected: { bg: 'rgba(220,53,69,0.15)',   color: '#dc3545' },
    None:     { bg: 'rgba(156,163,175,0.15)', color: '#6B7280' },
  };
  const s = map[status] || map.None;
  return (
    <span style={{
      fontSize: 11, fontWeight: 700, padding: '3px 10px',
      borderRadius: 99, background: s.bg, color: s.color,
    }}>
      {status}
    </span>
  );
}

// ─── Tenant Overview ──────────────────────────────────────────────────────────

function TenantOverview({ darkMode, onNavigate, user }) {
  const cardBg  = darkMode ? '#16213e' : '#fff';
  const text    = darkMode ? '#eaeaea' : '#333';
  const subText = darkMode ? '#a0a0b0' : '#666';
  const rowBg   = darkMode ? '#0f3460' : '#f9f9f9';

  const displayName    = user?.name?.split(' ')[0] || 'User';
  const bookings       = user?.bookings || [];
  const activeBooking  = bookings.find(b => b.status === 'accepted');
  const pendingBookings= bookings.filter(b => b.status === 'pending');
  const activities     = user?.activities || [];
  const totalBookings  = bookings.length;
  const activeCount    = activeBooking ? 1 : 0;
  const pendingCount   = pendingBookings.length;

  return (
    <div className="overview-new">
      <div className="overview-greeting">
        <div>
          <h2 className="overview-greeting-title">
            {getGreeting()}, {displayName}! 👋
          </h2>
          <p className="overview-greeting-sub" style={{ color: subText }}>
            Here's your housing update for today.
          </p>
        </div>
        <span style={{ fontSize: 12, color: subText, whiteSpace: 'nowrap' }}>
          {new Date().toLocaleDateString('en-PH', { weekday: 'long', month: 'long', day: 'numeric' })}
        </span>
      </div>

      <div className="overview-row-2col">
        <div className="overview-card-new" style={{ background: cardBg }}>
          <div className="overview-card-header">
            <Home size={16} color="#E8622E" />
            <span style={{ color: text, fontWeight: 700, fontSize: 14 }}>Current Booking</span>
          </div>

          {totalBookings === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <p style={{ color: subText, fontSize: 13, marginBottom: 12 }}>
                You don't have any bookings yet.
              </p>
              <button className="ov-action-btn-primary" onClick={() => onNavigate('map')}>
                <Search size={14} /> Find a Dorm
              </button>
            </div>
          ) : activeBooking ? (
            <>
              <div style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontWeight: 800, fontSize: 16, color: text }}>{activeBooking.dormName}</span>
                  <StatusBadge status="Active" />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  {[
                    ['Room',     activeBooking.room     || 'N/A'],
                    ['Landlord', activeBooking.landlord || 'N/A'],
                    ['Price',    activeBooking.price ? `₱${activeBooking.price}` : 'N/A'],
                  ].map(([label, val]) => (
                    <div key={label} style={{ display: 'flex', gap: 8, fontSize: 13 }}>
                      <span style={{ color: subText, width: 60, flexShrink: 0 }}>{label}</span>
                      <span style={{ color: text, fontWeight: 600 }}>{val}</span>
                    </div>
                  ))}
                </div>
              </div>
              <button className="ov-link-btn" onClick={() => onNavigate('booking')} style={{ color: '#E8622E' }}>
                View booking details <ChevronRight size={13} />
              </button>
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <p style={{ color: subText, fontSize: 13, marginBottom: 12 }}>
                No active booking.{' '}
                {pendingCount > 0
                  ? `${pendingCount} pending request(s) waiting for approval.`
                  : 'Find a dorm to get started!'}
              </p>
              <button className="ov-action-btn-primary" onClick={() => onNavigate('map')}>
                <Search size={14} /> Find a Dorm
              </button>
            </div>
          )}
        </div>

        <div className="overview-card-new" style={{ background: cardBg }}>
          <div className="overview-card-header">
            <TrendingUp size={16} color="#E8622E" />
            <span style={{ color: text, fontWeight: 700, fontSize: 14 }}>Quick Actions</span>
          </div>
          <div className="quick-actions-grid">
            {[
              { label: 'Find a Dorm', icon: <Search       size={18} color="#E8622E" />, nav: 'map'      },
              { label: 'Messages',    icon: <MessageCircle size={18} color="#5BADA8" />, nav: 'messages' },
              { label: 'My Booking',  icon: <CalendarDays  size={18} color="#E8622E" />, nav: 'booking'  },
              { label: 'Reviews',     icon: <Star          size={18} color="#F59E0B" />, nav: 'reviews'  },
            ].map(({ label, icon, nav }) => (
              <button
                key={label}
                className="quick-action-tile"
                style={{ background: rowBg, color: text }}
                onClick={() => onNavigate(nav)}
              >
                {icon}
                <span style={{ fontSize: 12, fontWeight: 600 }}>{label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {totalBookings > 0 && (
        <div className="overview-card-new" style={{ background: cardBg }}>
          <div className="overview-card-header">
            <ClipboardList size={16} color="#E8622E" />
            <span style={{ color: text, fontWeight: 700, fontSize: 14 }}>My Bookings</span>
          </div>
          <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
            {[
              { label: 'Total',   value: totalBookings, color: '#333'    },
              { label: 'Active',  value: activeCount,   color: '#5BADA8' },
              { label: 'Pending', value: pendingCount,  color: '#F59E0B' },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ flex: 1, textAlign: 'center', padding: '12px 8px', borderRadius: 12, background: rowBg }}>
                <p style={{ margin: 0, fontSize: 28, fontWeight: 800, color }}>{value}</p>
                <p style={{ margin: 0, fontSize: 11, color: subText, marginTop: 2 }}>{label}</p>
              </div>
            ))}
          </div>
          <button className="ov-link-btn" onClick={() => onNavigate('booking')} style={{ color: '#E8622E' }}>
            View all bookings <ChevronRight size={13} />
          </button>
        </div>
      )}

      <div className="overview-row-2col">
        <div className="overview-card-new" style={{ background: cardBg }}>
          <div className="overview-card-header">
            <Clock size={16} color="#E8622E" />
            <span style={{ color: text, fontWeight: 700, fontSize: 14 }}>Recent Activity</span>
          </div>
          {activities.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px 0', color: subText, fontSize: 13 }}>
              No recent activity yet. Start by exploring dorms!
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {activities.slice(0, 5).map((item) => (
                <div key={item.id} className="activity-item" style={{ background: rowBg }}
                  onClick={() => item.nav && onNavigate(item.nav)}>
                  <span className="activity-icon">{ACTIVITY_ICON[item.type] || <Bell size={15} color="#666" />}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: 13, color: text, fontWeight: 500 }}>{item.text}</p>
                    <p style={{ margin: 0, fontSize: 11, color: subText }}>{item.time}</p>
                  </div>
                  {item.nav && <ChevronRight size={14} color={subText} />}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="overview-card-new" style={{ background: cardBg }}>
          <div className="overview-card-header">
            <MapPin size={16} color="#E8622E" />
            <span style={{ color: text, fontWeight: 700, fontSize: 14 }}>Browse Dorms</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <button
              className="quick-action-tile"
              style={{ background: rowBg, color: text, justifyContent: 'flex-start', padding: '12px 16px', gap: 12 }}
              onClick={() => onNavigate('map')}
            >
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(91,173,168,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Search size={16} color="#5BADA8" />
              </div>
              <div>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: text }}>Explore Dormitories</p>
                <p style={{ margin: 0, fontSize: 11, color: subText }}>Find your perfect place near campus</p>
              </div>
            </button>

            {pendingCount > 0 && (
              <div style={{ padding: '12px 16px', background: '#F59E0B20', borderRadius: 10, border: '1px solid #F59E0B' }}>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#B45309' }}>
                  ⏳ {pendingCount} pending booking{pendingCount > 1 ? 's' : ''}
                </p>
                <p style={{ margin: '4px 0 0 0', fontSize: 11, color: subText }}>
                  Waiting for landlord approval
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Landlord Overview ────────────────────────────────────────────────────────

function LandlordOverview({ darkMode, onNavigate, user }) {
  const [requests, setRequests] = useState([]);
  const { updateBookingStatus, addActivity } = useAuth();
  const { bookings: contextBookings, acceptBooking, rejectBooking, subscribeToBookings } = useBooking();

  const cardBg  = darkMode ? '#16213e' : '#fff';
  const text    = darkMode ? '#eaeaea' : '#333';
  const subText = darkMode ? '#a0a0b0' : '#666';
  const rowBg   = darkMode ? '#0f3460' : '#f9f9f9';

  const displayName = user?.name?.split(' ')[0] || 'Landlord';
  const listings    = useMemo(() => user?.listings || [], [user?.listings]);
  const activities  = user?.activities || [];

  const activeListings  = listings.filter(l => l.status === 'Active');
  const vacantListings  = listings.filter(l => l.status === 'Active' && l.availableRooms > 0);
  const pendingListings = listings.filter(l => l.status === 'Pending');

  useEffect(() => {
    function updatePendingRequests() {
      try {
        const myListingIds = listings.map(l => l.id);
        const myRequests   = contextBookings.filter(
          b => myListingIds.includes(b.listingId) && b.status === 'pending'
        );
        setRequests(myRequests);
      } catch (_) {
        setRequests([]);
      }
    }

    updatePendingRequests();
    const unsubscribe = subscribeToBookings(updatePendingRequests);
    window.addEventListener('storage', updatePendingRequests);

    return () => {
      unsubscribe();
      window.removeEventListener('storage', updatePendingRequests);
    };
  }, [listings, contextBookings, subscribeToBookings]);

  const handleAccept = (request) => {
    acceptBooking(request.id);
    updateBookingStatus(request.id, 'accepted');
    addActivity('booking', `You accepted ${request.tenantName}'s booking request for "${request.listingTitle}"`, 'listing');
  };

  const handleReject = (request) => {
    rejectBooking(request.id);
    updateBookingStatus(request.id, 'rejected');
    addActivity('booking', `You rejected ${request.tenantName}'s booking request for "${request.listingTitle}"`, 'listing');
  };

  return (
    <div className="overview-new">
      <div className="overview-greeting">
        <div>
          <h2 className="overview-greeting-title">
            {getGreeting()}, {displayName}! 🏠
          </h2>
          <p className="overview-greeting-sub" style={{ color: subText }}>
            Here's your property update for today.
          </p>
        </div>
        <span style={{ fontSize: 12, color: subText, whiteSpace: 'nowrap' }}>
          {new Date().toLocaleDateString('en-PH', { weekday: 'long', month: 'long', day: 'numeric' })}
        </span>
      </div>

      {requests.length > 0 && (
        <div className="overview-card-new" style={{ background: cardBg }}>
          <div className="overview-card-header">
            <Bell size={16} color="#E8622E" />
            <span style={{ color: text, fontWeight: 700, fontSize: 14 }}>Pending Booking Requests</span>
            <span style={{ marginLeft: 8, background: '#dc3545', color: '#fff', fontSize: 11, fontWeight: 700, padding: '2px 7px', borderRadius: 99 }}>
              {requests.length}
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {requests.map((req) => (
              <div key={req.id} className="request-item" style={{ background: rowBg, padding: '12px', borderRadius: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(232,98,46,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 18 }}>
                    👤
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: text }}>{req.tenantName || 'Tenant'}</p>
                    <p style={{ margin: '2px 0 0 0', fontSize: 12, color: subText }}>📍 {req.listingTitle || 'Property'}</p>
                    <p style={{ margin: '2px 0 0 0', fontSize: 12, color: subText }}>📅 Move-in: {req.moveInDate || 'Not specified'}</p>
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                    <button onClick={() => handleAccept(req)}
                      style={{ padding: '8px 12px', background: '#28a745', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                      onMouseEnter={(e) => e.target.style.background = '#20c997'}
                      onMouseLeave={(e) => e.target.style.background = '#28a745'}
                    >✔ Accept</button>
                    <button onClick={() => handleReject(req)}
                      style={{ padding: '8px 12px', background: '#dc3545', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                      onMouseEnter={(e) => e.target.style.background = '#c82333'}
                      onMouseLeave={(e) => e.target.style.background = '#dc3545'}
                    >✖ Reject</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="overview-row-2col">
        <div className="overview-card-new" style={{ background: cardBg }}>
          <div className="overview-card-header">
            <ClipboardList size={16} color="#E8622E" />
            <span style={{ color: text, fontWeight: 700, fontSize: 14 }}>My Listings</span>
            <button onClick={() => onNavigate('listing')}
              style={{ marginLeft: 'auto', background: '#E8622E', color: '#fff', border: 'none', borderRadius: 6, padding: '4px 10px', fontSize: 11, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Plus size={12} /> Add New
            </button>
          </div>

          {listings.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <p style={{ color: subText, fontSize: 13, marginBottom: 12 }}>You haven't added any listings yet.</p>
              <button className="ov-action-btn-primary" onClick={() => onNavigate('listing')}>
                <Plus size={14} /> Add Your First Listing
              </button>
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
                {[
                  { label: 'Active',  value: activeListings.length,  color: '#5BADA8' },
                  { label: 'Vacant',  value: vacantListings.length,   color: '#E8622E' },
                  { label: 'Pending', value: pendingListings.length,  color: '#F59E0B' },
                ].map(({ label, value, color }) => (
                  <div key={label} style={{ flex: 1, textAlign: 'center', padding: '12px 8px', borderRadius: 12, background: rowBg }}>
                    <p style={{ margin: 0, fontSize: 28, fontWeight: 800, color }}>{value}</p>
                    <p style={{ margin: 0, fontSize: 11, color: subText, marginTop: 2 }}>{label}</p>
                  </div>
                ))}
              </div>
              <button className="ov-link-btn" onClick={() => onNavigate('listing')} style={{ color: '#E8622E' }}>
                Manage listings <ChevronRight size={13} />
              </button>
            </>
          )}
        </div>

        <div className="overview-card-new" style={{ background: cardBg }}>
          <div className="overview-card-header">
            <TrendingUp size={16} color="#E8622E" />
            <span style={{ color: text, fontWeight: 700, fontSize: 14 }}>Quick Actions</span>
          </div>
          <div className="quick-actions-grid">
            {[
              { label: 'New Listing', icon: <ClipboardList size={18} color="#E8622E" />, nav: 'listing'  },
              { label: 'Messages',    icon: <MessageCircle size={18} color="#5BADA8" />, nav: 'messages' },
              { label: 'Reviews',     icon: <Star          size={18} color="#F59E0B" />, nav: 'reviews'  },
              { label: 'Map View',    icon: <MapPin        size={18} color="#E8622E" />, nav: 'map'      },
            ].map(({ label, icon, nav }) => (
              <button key={label} className="quick-action-tile" style={{ background: rowBg, color: text }} onClick={() => onNavigate(nav)}>
                {icon}
                <span style={{ fontSize: 12, fontWeight: 600 }}>{label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="overview-card-new" style={{ background: cardBg }}>
        <div className="overview-card-header">
          <Clock size={16} color="#E8622E" />
          <span style={{ color: text, fontWeight: 700, fontSize: 14 }}>Recent Activity</span>
        </div>
        {activities.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '20px 0', color: subText, fontSize: 13 }}>
            No recent activity yet.{' '}
            {requests.length > 0 ? 'Approve or reject pending requests!' : 'Add listings to get started!'}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {activities.slice(0, 5).map((item) => (
              <div key={item.id} className="activity-item" style={{ background: rowBg }}
                onClick={() => item.nav && onNavigate(item.nav)}>
                <span className="activity-icon">{ACTIVITY_ICON[item.type] || <Bell size={15} color="#666" />}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: 13, color: text, fontWeight: 500 }}>{item.text}</p>
                  <p style={{ margin: 0, fontSize: 11, color: subText }}>{item.time}</p>
                </div>
                {item.nav && <ChevronRight size={14} color={subText} />}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export default function Dashboard({ userType: propUserType, darkMode = false, setDarkMode }) {
  const [editListingData, setEditListingData] = useState(null);
  const [showDropdown,    setShowDropdown]    = useState(false);
  const dropdownRef = useRef(null);
  const navigate    = useNavigate();
  const location    = useLocation();
  const { getUnreadCount } = useBooking();
  const { user, logout }   = useAuth();

  const userType   = propUserType || user?.userType || localStorage.getItem('userType') || 'tenant';
  const isLandlord = userType === 'landlord';
  const theme      = darkMode ? 'dark' : 'light';

  // Derive active section directly from the URL pathname — no useEffect needed
  const getActiveSectionFromPath = () => {
    const path = location.pathname.replace('/', '');
    const validSections = ['overview', 'map', 'listing', 'booking', 'notifications', 'messages', 'settings', 'reviews'];
    return validSections.includes(path) ? path : 'overview';
  };

  const activeNav = getActiveSectionFromPath();

  // ✅ FIX: removed the useEffect that called navigate(activeNav) — it caused an
  //         infinite redirect loop because every navigation triggered the effect again.

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target))
        setShowDropdown(false);
    };
    if (showDropdown) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showDropdown]);

  const isOverview  = activeNav === 'overview';
  const subLabel    = SECTION_LABELS[activeNav] || 'Dashboard';
  const subDesc     = activeNav === 'messages'
    ? SECTION_DESCRIPTIONS.messages
    : activeNav === 'listing'
      ? ''
      : SECTION_DESCRIPTIONS[activeNav] || (isLandlord
          ? 'See an overview of your current listings, messages, and recent activity.'
          : 'See an overview of your current bookings, messages, and recent activity.'
        );

  const handleLogout = () => {
    logout();
    localStorage.removeItem('dormScoutUser');
    localStorage.removeItem('userType');
    localStorage.removeItem('loginUserType');
    window.location.href = '/';
  };

  return (
    <div className={`dashboard-wrapper ${theme}`}>

      {/* Navbar */}
      <nav className="dashboard-nav">
        <button
          className="dashboard-nav-title-btn"
          style={{ background: 'none', border: 'none', padding: 0, margin: 0, cursor: 'pointer', fontSize: 24, fontWeight: 700, color: darkMode ? '#eaeaea' : '#333', fontFamily: 'inherit' }}
          aria-label="Go to Overview"
          onClick={() => navigate('/overview')}
        >
          DormScout
        </button>

        <div ref={dropdownRef} className="dashboard-dropdown-wrap">
          <div className="dashboard-avatar" onClick={() => setShowDropdown(!showDropdown)}>
            <User size={20} color="#fff" />
          </div>
          {showDropdown && (
            <div className="dashboard-dropdown">
              <div className="dropdown-item dropdown-item-profile" onClick={() => { navigate('/profile'); setShowDropdown(false); }}>
                <User size={15} /> My Profile
              </div>
              <div className="dropdown-item dropdown-item-default" onClick={() => { navigate('/support'); setShowDropdown(false); }}>
                <HelpCircle size={15} /> Help and Support
              </div>
              <div className="dropdown-item dropdown-item-default" onClick={() => { navigate('/about'); setShowDropdown(false); }}>
                <Info size={15} /> About Us
              </div>
              <div className="dropdown-item dropdown-item-default dropdown-item-dark-toggle"
                onClick={() => { setDarkMode && setDarkMode(!darkMode); setShowDropdown(false); }}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', cursor: 'pointer', padding: '10px 12px' }}>
                {darkMode ? <Sun size={15} /> : <Moon size={15} />}
                <span style={{ marginLeft: 8 }}>{darkMode ? 'Light Mode' : 'Dark Mode'}</span>
              </div>
              <div className="dropdown-item dropdown-item-logout" onClick={() => { setShowDropdown(false); handleLogout(); }}>
                <LogOut size={15} /> Logout
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Layout */}
      <div className="dashboard-layout">

        {/* Sidebar */}
        <div className="dashboard-sidebar">
          {NAV_ITEMS[userType]?.map((item) => {
            const isActive  = activeNav === item.id;
            const iconColor = isActive ? '#ffffff' : '#E8622E';
            return (
              <button
                key={item.id}
                className={`sidebar-nav-btn ${isActive ? 'active' : ''}`}
                onClick={() => navigate(`/${item.id}`)}
              >
                <span className="sidebar-nav-icon">
                  {NAV_ICON[item.id] ? NAV_ICON[item.id](iconColor) : <LayoutDashboard size={18} color={iconColor} />}
                </span>
                {item.label}
                {item.id === 'notifications' && getUnreadCount(userType) > 0 && (
                  <span className="sidebar-badge">{getUnreadCount(userType)}</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="dashboard-content">
          {/* Only render the subheader (small heading) for main sections except overview */}
          {!isOverview && (
            <div className="dashboard-subheader">
              <h4>{subLabel}</h4>
              <p>{subDesc}</p>
            </div>
          )}

          <div className="dashboard-main">
            {activeNav === 'map' ? (
              <Map darkMode={darkMode} userType={userType}
                onEditListing={(listing) => { setEditListingData(listing); navigate('/listing'); }} />
            ) : activeNav === 'listing' && isLandlord ? (
              <ListingPage darkMode={darkMode} editListingData={editListingData} onEditHandled={() => setEditListingData(null)} />
            ) : activeNav === 'booking' && !isLandlord ? (
              <BookingPage darkMode={darkMode} />
            ) : activeNav === 'notifications' ? (
              <Notifications darkMode={darkMode} userType={userType} />
            ) : activeNav === 'reviews' ? (
              <Reviews userType={userType} darkMode={darkMode} setDarkMode={setDarkMode} />
            ) : activeNav === 'messages' ? (
              <Messaging darkMode={darkMode} userType={userType} contactLandlord={location.state?.contactLandlord} contactTenant={location.state?.contactTenant} />
            ) : activeNav === 'settings' ? (
              <Settings darkMode={darkMode} setDarkMode={setDarkMode} userType={userType} />
            ) : (
              isLandlord
                ? <LandlordOverview darkMode={darkMode} onNavigate={(s) => navigate(`/${s}`)} user={user} />
                : <TenantOverview   darkMode={darkMode} onNavigate={(s) => navigate(`/${s}`)} user={user} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}