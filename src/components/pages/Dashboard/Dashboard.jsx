import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Map from '../Map/Map';
import ListingPage from '../Listing/ListingPage';
import BookingPage from '../Booking/BookingPage';
import Reviews from '../Reviews/Reviews';
import Messaging from '../Messaging/Messaging';
import Settings from '../Settings/Settings';
import Notifications from '../Notifications/Notifications';
import { useBooking } from '../../../context/BookingContext';
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
  Package,
  CheckCircle,
  XCircle,
  Search,
  Home,
  CreditCard,
  ChevronRight,
  Check,
  X,
  TrendingUp,
  Clock,
} from 'lucide-react';

const NAV_ITEMS = {
  landlord: [
    { id: 'overview',       label: 'Overview' },
    { id: 'map',            label: 'Map View' },
    { id: 'listing',        label: 'Listing' },
    { id: 'notifications',  label: 'Notifications' },
    { id: 'messages',       label: 'Messages' },
    { id: 'settings',       label: 'Settings' },
    { id: 'reviews',        label: 'Reviews' },
  ],
  tenant: [
    { id: 'overview',       label: 'Overview' },
    { id: 'map',            label: 'Map View' },
    { id: 'booking',        label: 'Booking' },
    { id: 'notifications',  label: 'Notifications' },
    { id: 'messages',       label: 'Messages' },
    { id: 'settings',       label: 'Settings' },
    { id: 'reviews',        label: 'Reviews' },
  ],
};

// ─── Placeholder Data ─────────────────────────────────────────────────────────

const TENANT_DATA = {
  name: 'Jamie',
  booking: {
    dormName: 'Sunshine Boarding House',
    landlord: 'Maria Reyes',
    status: 'Active',       
    since: 'January 2025',
    room: 'Room 4B',
  },
  rent: {
    amount: 4500,
    dueDate: 'May 1, 2025',
    lastPaid: 'April 1, 2025',
    cycleProgress: 58,      // percent through billing cycle
  },
};

const LANDLORD_DATA = {
  name: 'Mars',
  listings: {
    active: 4,
    vacant: 2,
    pending: 1,
  },
  pendingRequests: [
    { id: 1, name: 'Maria Santos',  dorm: 'Sunshine Boarding House', room: 'Room 2A', date: 'Apr 15' },
    { id: 2, name: 'Paolo Cruz',    dorm: 'Green Leaf Dormitory',    room: 'Room 1C', date: 'Apr 16' },
    { id: 3, name: 'Angela Reyes',  dorm: 'Sunshine Boarding House', room: 'Room 3B', date: 'Apr 17' },
  ],
};

const RECENT_ACTIVITY = [
  { id: 1, type: 'message',      text: 'Maria Reyes sent you a message',    time: '2 hrs ago',  nav: 'messages' },
  { id: 2, type: 'notification', text: 'Your booking was confirmed',         time: 'Yesterday',  nav: 'notifications' },
  { id: 3, type: 'review',       text: 'New review on Sunshine BH',          time: '2 days ago', nav: 'reviews' },
  { id: 4, type: 'message',      text: 'LeBron James sent you a message',    time: '3 days ago', nav: 'messages' },
];

const SUGGESTED_DORMS = [
  { id: 1, name: 'BlueSky Residences',   location: 'Lahug',       price: '₱3,800/mo', rating: 4.7 },
  { id: 2, name: 'Green Leaf Dormitory', location: 'Gorordo Ave', price: '₱3,200/mo', rating: 4.5 },
  { id: 3, name: 'CampusNest',           location: 'Banilad',     price: '₱2,900/mo', rating: 4.3 },
];

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

const NOTIF_ICON = {
  new_booking:      <Package     size={16} color="#E8622E" />,
  booking_accepted: <CheckCircle size={16} color="#5BADA8" />,
  booking_rejected: <XCircle     size={16} color="#dc3545" />,
};

const ACTIVITY_ICON = {
  message:      <MessageCircle size={15} color="#5BADA8" />,
  notification: <Bell          size={15} color="#E8622E" />,
  review:       <Star          size={15} color="#F59E0B" />,
};

const getNotifIcon = (type) => NOTIF_ICON[type] || <MessageCircle size={16} color="#888" />;

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

const getHeading = (activeNav, isLandlord) => {
  if (activeNav === 'map')                    return <><span className="heading-primary">Map </span><span className="heading-secondary">View</span></>;
  if (activeNav === 'listing' && isLandlord)  return <span className="heading-primary">Listings</span>;
  if (activeNav === 'booking' && !isLandlord) return <><span className="heading-primary">My </span><span className="heading-secondary">Bookings</span></>;
  if (activeNav === 'settings')               return <span className="heading-primary">Settings</span>;
  if (activeNav === 'reviews')                return <span className="heading-primary">Reviews</span>;
  if (activeNav === 'notifications')          return <span className="heading-primary">Notifications</span>;
  if (activeNav === 'messages')               return <span className="heading-primary">Messages</span>;
  return null; 
};

const SECTION_LABELS = {
  map:           'Map',
  settings:      'Settings',
  reviews:       'Reviews',
  booking:       'Booking',
  notifications: 'Notifications',
};

const SECTION_DESCRIPTIONS = {
  map:           'Search for dorms around Cebu City and find the perfect dorm near campus',
  settings:      'Manage your profile, security, and application preferences.',
  reviews:       'Real feedback from students who have lived there',
  booking:       'Manage and track all your boarding house booking requests.',
  notifications: 'Stay updated with booking requests, approvals, and messages.',
  messages:      'Chat with landlords and property managers about bookings.',
};

// Shared UI Pieces 

function StatusBadge({ status }) {
  const map = {
    Active:  { bg: 'rgba(91,173,168,0.15)',  color: '#5BADA8' },
    Pending: { bg: 'rgba(245,158,11,0.15)',  color: '#B45309' },
    None:    { bg: 'rgba(156,163,175,0.15)', color: '#6B7280' },
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

function TenantOverview({ darkMode, onNavigate }) {
  const cardBg  = darkMode ? '#16213e' : '#fff';
  const text    = darkMode ? '#eaeaea' : '#333';
  const subText = darkMode ? '#a0a0b0' : '#666';
  const rowBg   = darkMode ? '#0f3460' : '#f9f9f9';

  return (
    <div className="overview-new">

      {/* Greeting */}
      <div className="overview-greeting">
        <div>
          <h2 className="overview-greeting-title">
            {getGreeting()}, {TENANT_DATA.name}! 👋
          </h2>
          <p className="overview-greeting-sub" style={{ color: subText }}>
            Here's your housing update for today.
          </p>
        </div>
        <span style={{ fontSize: 12, color: subText, whiteSpace: 'nowrap' }}>
          {new Date().toLocaleDateString('en-PH', { weekday: 'long', month: 'long', day: 'numeric' })}
        </span>
      </div>

      {/* Row 1: Booking Status + Quick Actions */}
      <div className="overview-row-2col">

        <div className="overview-card-new" style={{ background: cardBg }}>
          <div className="overview-card-header">
            <Home size={16} color="#E8622E" />
            <span style={{ color: text, fontWeight: 700, fontSize: 14 }}>Current Booking</span>
          </div>
          {TENANT_DATA.booking.status === 'None' ? (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <p style={{ color: subText, fontSize: 13, marginBottom: 12 }}>
                You don't have an active booking yet.
              </p>
              <button className="ov-action-btn-primary" onClick={() => onNavigate('map')}>
                <Search size={14} /> Find a Dorm
              </button>
            </div>
          ) : (
            <>
              <div style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontWeight: 800, fontSize: 16, color: text }}>{TENANT_DATA.booking.dormName}</span>
                  <StatusBadge status={TENANT_DATA.booking.status} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  {[
                    ['Room',     TENANT_DATA.booking.room],
                    ['Landlord', TENANT_DATA.booking.landlord],
                    ['Since',    TENANT_DATA.booking.since],
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
          )}
        </div>

        <div className="overview-card-new" style={{ background: cardBg }}>
          <div className="overview-card-header">
            <TrendingUp size={16} color="#E8622E" />
            <span style={{ color: text, fontWeight: 700, fontSize: 14 }}>Quick Actions</span>
          </div>
          <div className="quick-actions-grid">
            {[
              { label: 'Find a Dorm', icon: <Search        size={18} color="#E8622E" />, nav: 'map' },
              { label: 'Messages',    icon: <MessageCircle  size={18} color="#5BADA8" />, nav: 'messages' },
              { label: 'My Booking',  icon: <CalendarDays   size={18} color="#E8622E" />, nav: 'booking' },
              { label: 'Reviews',     icon: <Star           size={18} color="#F59E0B" />, nav: 'reviews' },
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

      {/* Rent Tracker */}
      <div className="overview-card-new" style={{ background: cardBg }}>
        <div className="overview-card-header">
          <CreditCard size={16} color="#E8622E" />
          <span style={{ color: text, fontWeight: 700, fontSize: 14 }}>Rent Tracker</span>
          <span style={{ marginLeft: 'auto', fontSize: 11, color: subText }}>Placeholder · backend pending</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div>
            <p style={{ margin: 0, fontSize: 26, fontWeight: 800, color: '#E8622E' }}>
              ₱{TENANT_DATA.rent.amount.toLocaleString()}
            </p>
            <p style={{ margin: 0, fontSize: 12, color: subText }}>Monthly rent</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: text }}>
              Due {TENANT_DATA.rent.dueDate}
            </p>
            <p style={{ margin: 0, fontSize: 11, color: subText }}>
              Last paid: {TENANT_DATA.rent.lastPaid}
            </p>
          </div>
        </div>
        <div style={{ height: 8, borderRadius: 99, background: darkMode ? '#2a2a4a' : '#eee', overflow: 'hidden', marginBottom: 4 }}>
          <div style={{
            height: '100%',
            width: `${TENANT_DATA.rent.cycleProgress}%`,
            background: 'linear-gradient(90deg, #5BADA8, #E8622E)',
            borderRadius: 99,
            transition: 'width 0.6s ease',
          }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: subText }}>
          <span>Billing cycle</span>
          <span>{TENANT_DATA.rent.cycleProgress}% through</span>
        </div>
      </div>

      {/* Row 2: Activity + Suggested Dorms */}
      <div className="overview-row-2col">

        <div className="overview-card-new" style={{ background: cardBg }}>
          <div className="overview-card-header">
            <Clock size={16} color="#E8622E" />
            <span style={{ color: text, fontWeight: 700, fontSize: 14 }}>Recent Activity</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {RECENT_ACTIVITY.map((item) => (
              <div key={item.id} className="activity-item" style={{ background: rowBg }}
                onClick={() => onNavigate(item.nav)}>
                <span className="activity-icon">{ACTIVITY_ICON[item.type]}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: 13, color: text, fontWeight: 500 }}>{item.text}</p>
                  <p style={{ margin: 0, fontSize: 11, color: subText }}>{item.time}</p>
                </div>
                <ChevronRight size={14} color={subText} />
              </div>
            ))}
          </div>
        </div>

        <div className="overview-card-new" style={{ background: cardBg }}>
          <div className="overview-card-header">
            <MapPin size={16} color="#E8622E" />
            <span style={{ color: text, fontWeight: 700, fontSize: 14 }}>Suggested Dorms</span>
            <span style={{ marginLeft: 'auto', fontSize: 11, color: subText }}>Placeholder</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {SUGGESTED_DORMS.map((dorm) => (
              <div key={dorm.id} className="activity-item" style={{ background: rowBg, cursor: 'pointer' }}
                onClick={() => onNavigate('map')}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: 'rgba(91,173,168,0.15)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <Home size={16} color="#5BADA8" />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: text }}>{dorm.name}</p>
                  <p style={{ margin: 0, fontSize: 11, color: subText }}>{dorm.location} · {dorm.price}</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 3, flexShrink: 0 }}>
                  <Star size={12} color="#F59E0B" fill="#F59E0B" />
                  <span style={{ fontSize: 12, fontWeight: 700, color: text }}>{dorm.rating}</span>
                </div>
              </div>
            ))}
          </div>
          <button className="ov-link-btn" onClick={() => onNavigate('map')}
            style={{ color: '#E8622E', marginTop: 8 }}>
            Browse all dorms <ChevronRight size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Landlord Overview ────────────────────────────────────────────────────────

function LandlordOverview({ darkMode, onNavigate }) {
  const [requests, setRequests] = useState(LANDLORD_DATA.pendingRequests);

  const cardBg  = darkMode ? '#16213e' : '#fff';
  const text    = darkMode ? '#eaeaea' : '#333';
  const subText = darkMode ? '#a0a0b0' : '#666';
  const rowBg   = darkMode ? '#0f3460' : '#f9f9f9';

  const handleAccept = (id) => setRequests((prev) => prev.filter((r) => r.id !== id));
  const handleReject = (id) => setRequests((prev) => prev.filter((r) => r.id !== id));

  return (
    <div className="overview-new">

      {/* Greeting */}
      <div className="overview-greeting">
        <div>
          <h2 className="overview-greeting-title">
            {getGreeting()}, {LANDLORD_DATA.name}! 🏠
          </h2>
          <p className="overview-greeting-sub" style={{ color: subText }}>
            Here's your property update for today.
          </p>
        </div>
        <span style={{ fontSize: 12, color: subText, whiteSpace: 'nowrap' }}>
          {new Date().toLocaleDateString('en-PH', { weekday: 'long', month: 'long', day: 'numeric' })}
        </span>
      </div>

      {/* Row 1: Listings Summary + Quick Actions */}
      <div className="overview-row-2col">

        <div className="overview-card-new" style={{ background: cardBg }}>
          <div className="overview-card-header">
            <ClipboardList size={16} color="#E8622E" />
            <span style={{ color: text, fontWeight: 700, fontSize: 14 }}>My Listings</span>
          </div>
          <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
            {[
              { label: 'Active',  value: LANDLORD_DATA.listings.active,  color: '#5BADA8' },
              { label: 'Vacant',  value: LANDLORD_DATA.listings.vacant,  color: '#E8622E' },
              { label: 'Pending', value: LANDLORD_DATA.listings.pending, color: '#F59E0B' },
            ].map(({ label, value, color }) => (
              <div key={label} style={{
                flex: 1, textAlign: 'center', padding: '12px 8px',
                borderRadius: 12, background: rowBg,
              }}>
                <p style={{ margin: 0, fontSize: 28, fontWeight: 800, color }}>{value}</p>
                <p style={{ margin: 0, fontSize: 11, color: subText, marginTop: 2 }}>{label}</p>
              </div>
            ))}
          </div>
          <button className="ov-link-btn" onClick={() => onNavigate('listing')} style={{ color: '#E8622E' }}>
            Manage listings <ChevronRight size={13} />
          </button>
        </div>

        <div className="overview-card-new" style={{ background: cardBg }}>
          <div className="overview-card-header">
            <TrendingUp size={16} color="#E8622E" />
            <span style={{ color: text, fontWeight: 700, fontSize: 14 }}>Quick Actions</span>
          </div>
          <div className="quick-actions-grid">
            {[
              { label: 'New Listing', icon: <ClipboardList  size={18} color="#E8622E" />, nav: 'listing' },
              { label: 'Messages',    icon: <MessageCircle  size={18} color="#5BADA8" />, nav: 'messages' },
              { label: 'Reviews',     icon: <Star           size={18} color="#F59E0B" />, nav: 'reviews' },
              { label: 'Map View',    icon: <MapPin         size={18} color="#E8622E" />, nav: 'map' },
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

      {/* Pending Booking Requests */}
      <div className="overview-card-new" style={{ background: cardBg }}>
        <div className="overview-card-header">
          <Bell size={16} color="#E8622E" />
          <span style={{ color: text, fontWeight: 700, fontSize: 14 }}>Pending Booking Requests</span>
          {requests.length > 0 && (
            <span style={{
              marginLeft: 8, background: '#dc3545', color: '#fff',
              fontSize: 11, fontWeight: 700, padding: '2px 7px', borderRadius: 99,
            }}>
              {requests.length}
            </span>
          )}
        </div>
        {requests.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '20px 0', color: subText, fontSize: 13 }}>
            ✅ All caught up — no pending requests!
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {requests.map((req) => (
              <div key={req.id} className="request-item" style={{ background: rowBg }}>
                <div style={{
                  width: 36, height: 36, borderRadius: '50%',
                  background: 'rgba(232,98,46,0.12)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <User size={16} color="#E8622E" />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: text }}>{req.name}</p>
                  <p style={{ margin: 0, fontSize: 11, color: subText }}>{req.dorm} · {req.room} · {req.date}</p>
                </div>
                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                  <button className="req-btn req-btn-accept" onClick={() => handleAccept(req.id)} title="Accept">
                    <Check size={14} />
                  </button>
                  <button className="req-btn req-btn-reject" onClick={() => handleReject(req.id)} title="Reject">
                    <X size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Activity */}
      <div className="overview-card-new" style={{ background: cardBg }}>
        <div className="overview-card-header">
          <Clock size={16} color="#E8622E" />
          <span style={{ color: text, fontWeight: 700, fontSize: 14 }}>Recent Activity</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {RECENT_ACTIVITY.map((item) => (
            <div key={item.id} className="activity-item" style={{ background: rowBg }}
              onClick={() => onNavigate(item.nav)}>
              <span className="activity-icon">{ACTIVITY_ICON[item.type]}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, fontSize: 13, color: text, fontWeight: 500 }}>{item.text}</p>
                <p style={{ margin: 0, fontSize: 11, color: subText }}>{item.time}</p>
              </div>
              <ChevronRight size={14} color={subText} />
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export default function Dashboard({ userType = 'tenant', darkMode = false, setDarkMode }) {
  const [searchParams]    = useSearchParams();
  const sectionFromUrl    = searchParams.get('section') || 'overview';
  const [activeNav, setActiveNav]             = useState(sectionFromUrl);
  const [editListingData, setEditListingData] = useState(null);
  const [showDropdown, setShowDropdown]       = useState(false);
  const navItems   = NAV_ITEMS[userType] || NAV_ITEMS.tenant;
  const isLandlord = userType === 'landlord';
  const dropdownRef = useRef(null);
  const navigate    = useNavigate();
  const { getUnreadCount, getNotifications, markNotificationRead } = useBooking();
  const theme = darkMode ? 'dark' : 'light';

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target))
        setShowDropdown(false);
    };
    if (showDropdown) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showDropdown]);

  const isOverview  = activeNav === 'overview';
  const hideHeading = ['messages', 'reviews', 'notifications', 'overview'].includes(activeNav);

  const subLabel = activeNav === 'messages'
    ? 'Messages'
    : SECTION_LABELS[activeNav] || 'Dashboard';

  const subDesc = activeNav === 'messages'
    ? SECTION_DESCRIPTIONS.messages
    : (activeNav === 'listing'
        ? ''
        : SECTION_DESCRIPTIONS[activeNav] || (isLandlord
            ? 'See an overview of your current listings, messages, and recent activity.'
            : 'See an overview of your current bookings, messages, and recent activity.'
          )
      );

  return (
    <div className={`dashboard-wrapper ${theme}`}>

      {/* ── Navbar ── */}
      <nav className="dashboard-nav">
        <button
          className="dashboard-nav-title-btn"
          style={{
            background: 'none', border: 'none', padding: 0, margin: 0,
            cursor: 'pointer', fontSize: 24, fontWeight: 700,
            color: darkMode ? '#eaeaea' : '#333', fontFamily: 'inherit',
          }}
          aria-label="Go to Overview"
          onClick={() => { setActiveNav('overview'); navigate('?section=overview'); }}
        >
          DormScout
        </button>

        <div ref={dropdownRef} className="dashboard-dropdown-wrap">
          <div className="dashboard-avatar" onClick={() => setShowDropdown(!showDropdown)}>
            <User size={20} color="#fff" />
          </div>
          {showDropdown && (
            <div className="dashboard-dropdown">
              <div className="dropdown-item dropdown-item-profile"
                onClick={() => { navigate('/profile'); setShowDropdown(false); }}>
                <User size={15} /> My Profile
              </div>
              <div className="dropdown-item dropdown-item-default"
                onClick={() => { setActiveNav('settings'); setShowDropdown(false); }}>
                <SettingsIcon size={15} /> Profile Settings
              </div>
              <div className="dropdown-item dropdown-item-default"
                onClick={() => { navigate('/support'); setShowDropdown(false); }}>
                <HelpCircle size={15} /> Help and Support
              </div>
              <div className="dropdown-item dropdown-item-default"
                onClick={() => { navigate('/about'); setShowDropdown(false); }}>
                <Info size={15} /> About Us
              </div>
              <div className="dropdown-item dropdown-item-default dropdown-item-dark-toggle"
                onClick={() => setDarkMode(!darkMode)}>
                {darkMode ? <><Sun size={15} /> Light Mode</> : <><Moon size={15} /> Dark Mode</>}
              </div>
              <div className="dropdown-item dropdown-item-logout"
                onClick={() => { setShowDropdown(false); navigate('/'); }}>
                <LogOut size={15} /> Logout
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* ── Layout ── */}
      <div className="dashboard-layout">

        {/* Sidebar */}
        <div className="dashboard-sidebar">
          {navItems.map((item) => {
            const isActive  = activeNav === item.id;
            const iconColor = isActive ? '#ffffff' : '#E8622E';
            return (
              <button
                key={item.id}
                className={`sidebar-nav-btn ${isActive ? 'active' : ''}`}
                onClick={() => setActiveNav(item.id)}
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

          {/* Heading — overview handles its own */}
          {!hideHeading && (
            <h2 className={`dashboard-heading ${activeNav === 'listing' ? 'has-bottom-margin-sm' : 'has-bottom-margin-lg'}`}>
              {getHeading(activeNav, isLandlord)}
            </h2>
          )}

          {/* Sub-header */}
          {!isOverview && activeNav !== 'listing' && (
            <div className="dashboard-subheader">
              <h4>{subLabel}</h4>
              <p>{subDesc}</p>
            </div>
          )}

          {/* Main Panel */}
          <div className="dashboard-main">
            {activeNav === 'map' ? (
              <Map darkMode={darkMode} userType={userType}
                onEditListing={(listing) => { setEditListingData(listing); setActiveNav('listing'); }} />
            ) : activeNav === 'listing' && isLandlord ? (
              <ListingPage darkMode={darkMode} editListingData={editListingData} onEditHandled={() => setEditListingData(null)} />
            ) : activeNav === 'booking' && !isLandlord ? (
              <BookingPage darkMode={darkMode} />
            ) : activeNav === 'notifications' ? (
              <Notifications darkMode={darkMode} userType={userType} />
            ) : activeNav === 'reviews' ? (
              <Reviews userType={userType} darkMode={darkMode} setDarkMode={setDarkMode} />
            ) : activeNav === 'messages' ? (
              <Messaging darkMode={darkMode} userType={userType} />
            ) : activeNav === 'settings' ? (
              <Settings darkMode={darkMode} setDarkMode={setDarkMode} userType={userType} />
            ) : (
              isLandlord
                ? <LandlordOverview darkMode={darkMode} onNavigate={setActiveNav} />
                : <TenantOverview   darkMode={darkMode} onNavigate={setActiveNav} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}