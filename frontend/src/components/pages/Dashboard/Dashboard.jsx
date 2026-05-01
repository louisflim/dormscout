import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Map from '../Map/Map';
import ListingPage from '../Listing/ListingPage';
import BookingPage from '../Booking/BookingPage';
import BookmarkPage from '../Booking/BookmarkPage';
import Reviews from '../Reviews/Reviews';
import Messaging from '../Messaging/Messaging';
import Settings from '../Settings/Settings';
import Notifications from '../Notifications/Notifications';
import { useBooking } from '../../../context/BookingContext';
import { useAuth } from '../../../context/AuthContext';
import './Dashboard.css';
import { listingsAPI, bookingsAPI, activitiesAPI } from '../../../utils/api';

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
  Bookmark,
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
    { id: 'bookmarks',     label: 'Saved'           },
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
  bookmarks:     (c) => <Bookmark        size={18} color={c} />,
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

function formatTimeAgo(dateString) {
  if (!dateString) return 'Just now';
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' });
}

const SECTION_LABELS = {
  map:           <><span style={{ color: '#E8622E' }}>Map </span><span style={{ color: '#5BADA8' }}>View</span></>,
  settings:      <><span style={{ color: '#E8622E' }}>Settings </span><span style={{ color: '#5BADA8' }}>View</span></>,
  reviews:       <><span style={{ color: '#E8622E' }}>Reviews </span><span style={{ color: '#5BADA8' }}>View</span></>,
  booking:       <><span style={{ color: '#E8622E' }}>Booking </span><span style={{ color: '#5BADA8' }}>View</span></>,
  bookmarks:     <><span style={{ color: '#E8622E' }}>Saved </span><span style={{ color: '#5BADA8' }}>Listings</span></>,
  notifications: <><span style={{ color: '#E8622E' }}>Notifications </span><span style={{ color: '#5BADA8' }}>View</span></>,
  listing:       <><span style={{ color: '#E8622E' }}>Listing </span><span style={{ color: '#5BADA8' }}>View</span></>,
};

const SECTION_DESCRIPTIONS = {
  map:           'Search for dorms around Cebu City and find the perfect dorm near campus',
  settings:      'Manage your profile, security, and application preferences.',
  reviews:       'Real feedback from students who have lived there',
  booking:       'Manage and track all your boarding house booking requests.',
  bookmarks:     'Your saved listings. Come back to them anytime.',
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
    Accepted: { bg: 'rgba(91,173,168,0.15)',   color: '#5BADA8' },
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

// ─── Activity Item Component ──────────────────────────────────────────────────

function ActivityItem({ item, onNavigate }) {
  const cardBg = '#f9f9f9';
  const text = '#333';
  const subText = '#666';

  return (
    <div
      className="activity-item"
      style={{ background: cardBg }}
      onClick={() => item.nav && onNavigate(item.nav)}
    >
      <span className="activity-icon">
        {ACTIVITY_ICON[item.type] || <Bell size={15} color="#666" />}
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, fontSize: 13, color: text, fontWeight: 500 }}>{item.text}</p>
        <p style={{ margin: 0, fontSize: 11, color: subText }}>
          {item.createdAt ? formatTimeAgo(item.createdAt) : (item.time || 'Just now')}
        </p>
      </div>
      {item.nav && <ChevronRight size={14} color={subText} />}
    </div>
  );
}

// ─── Tenant Overview ──────────────────────────────────────────────────────────
function TenantOverview({ darkMode, onNavigate, user }) {
  const cardBg  = darkMode ? '#16213e' : '#fff';
  const text    = darkMode ? '#eaeaea' : '#333';
  const subText = darkMode ? '#a0a0b0' : '#666';
  const rowBg   = darkMode ? '#0f3460' : '#f9f9f9';

  const displayName    = user?.name?.split(' ')[0] || 'User';
  const [bookings, setBookings] = useState(user?.bookings || []);
  const [activities, setActivities] = useState([]);

  useEffect(() => {
    if (!user?.id) return;
    bookingsAPI.getBookingsByTenant(user.id)
      .then(response => {
        const data = Array.isArray(response) ? response : (response.data || []);
        setBookings(data);
      })
      .catch(err => {
        console.error('Failed to load bookings:', err);
        setBookings([]);
      });
  }, [user?.id]);

  useEffect(() => {
      if (!user?.id) return;
      activitiesAPI.getActivitiesByUser(user.id)
          .then(response => {
              let data = [];
              if (Array.isArray(response)) {
                  data = response;
              } else if (response?.data && Array.isArray(response.data)) {
                  data = response.data;
              } else if (response?.data?.data && Array.isArray(response.data.data)) {
                  data = response.data.data;
              }
              setActivities(data);
          })
          .catch(err => {
              console.error('Failed to load activities:', err);
              setActivities([]);
          });

      window.addEventListener('dormscout:bookingUpdated', () => {
          activitiesAPI.getActivitiesByUser(user.id)
              .then(response => {
                  let data = [];
                  if (Array.isArray(response)) {
                      data = response;
                  } else if (response?.data && Array.isArray(response.data)) {
                      data = response.data;
                  } else if (response?.data?.data && Array.isArray(response.data.data)) {
                      data = response.data.data;
                  }
                  setActivities(data);
              })
              .catch(() => {});
      });
  }, [user?.id]);

  const activeBooking   = bookings.find(b => b.status === 'accepted');
  const pendingBookings = bookings.filter(b => b.status === 'pending');
  const totalBookings   = bookings.length;
  const activeCount    = activeBooking ? 1 : 0;
  const pendingCount   = pendingBookings.length;

  return (
    <div className="overview-new">
      <div className="overview-greeting">
        <div>
          <h2 className="overview-greeting-title">
            {getGreeting()}, {displayName}! 
          </h2>
          <p className="overview-greeting-sub" style={{ color: subText }}>
            Here's your housing update for today.
          </p>
        </div>
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
                  <span style={{ fontWeight: 800, fontSize: 16, color: text }}>{activeBooking.dormName || activeBooking.listingTitle || 'Property'}</span>
                  <StatusBadge status="Active" />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  {[
                    ['Room',     activeBooking.room     || 'N/A'],
                    ['Landlord', activeBooking.landlord || 'N/A'],
                    ['Price',    activeBooking.price ? `₱${Number(activeBooking.price).toLocaleString()}` : 'N/A'],
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
              {(Array.isArray(activities) ? activities : []).slice(0, 5).map((item) => (
                <ActivityItem key={item.id || item.createdAt} item={item} onNavigate={onNavigate} />
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
  const { updateBookingStatus } = useAuth();
  const { bookings: contextBookings, acceptBooking, rejectBooking, subscribeToBookings } = useBooking();

  const cardBg  = darkMode ? '#16213e' : '#fff';
  const text    = darkMode ? '#eaeaea' : '#333';
  const subText = darkMode ? '#a0a0b0' : '#666';
  const rowBg   = darkMode ? '#0f3460' : '#f9f9f9';

  const displayName = user?.name?.split(' ')[0] || 'Landlord';

  const [listings, setListings] = useState([]);
  const [activities, setActivities] = useState([]);

  // Load listings
  useEffect(() => {
    if (!user?.id) return;

    listingsAPI.getListingsByLandlord(user.id)
      .then(response => {
        const data = Array.isArray(response) ? response : (response.data || []);
        setListings(data);
      })
      .catch(err => {
        console.error('Failed to load listings:', err);
        setListings([]);
      });

    const handleUpdate = () => {
      listingsAPI.getListingsByLandlord(user.id)
        .then(response => {
          const data = Array.isArray(response) ? response : (response.data || []);
          setListings(data);
        })
        .catch(() => {});
    };

    window.addEventListener('dormscout:listingUpdated', handleUpdate);

    return () => window.removeEventListener('dormscout:listingUpdated', handleUpdate);
  }, [user?.id]);

  useEffect(() => {
      if (!user?.id) return;

      activitiesAPI.getActivitiesByUser(user.id)
          .then(response => {
              let data = [];
              if (Array.isArray(response)) {
                  data = response;
              } else if (response?.data && Array.isArray(response.data)) {
                  data = response.data;
              } else if (response?.data?.data && Array.isArray(response.data.data)) {
                  data = response.data.data;
              }
              setActivities(data);
          })
          .catch(err => {
              console.error('Failed to load activities:', err);
              setActivities([]);
          });



      const handleBookingUpdate = () => {
        activitiesAPI.getActivitiesByUser(user.id)
          .then(response => {
            let data = [];
            if (Array.isArray(response)) {
              data = response;
            } else if (response?.data && Array.isArray(response.data)) {
              data = response.data;
            } else if (response?.data?.data && Array.isArray(response.data.data)) {
              data = response.data.data;
            }
            setActivities(data);
          })
          .catch(() => {});
      };

      window.addEventListener('dormscout:bookingUpdated', handleBookingUpdate);
      window.addEventListener('dormscout:listingUpdated', handleBookingUpdate);

      return () => {
        window.removeEventListener('dormscout:bookingUpdated', handleBookingUpdate);
        window.removeEventListener('dormscout:listingUpdated', handleBookingUpdate);
      };
  }, [user?.id]);

  const totalRoomsAvailable = listings.reduce((sum, l) => sum + (parseInt(l.availableRooms) || 0), 0);

  const roomTypeStats = listings.reduce((acc, l) => {
    const roomType = l.rooms || 'Unknown';
    if (!acc[roomType]) {
      acc[roomType] = { count: 0, available: 0 };
    }
    acc[roomType].count++;
    acc[roomType].available += parseInt(l.availableRooms) || 0;
    return acc;
  }, {});

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

  const refreshActivities = () => {
    activitiesAPI.getActivitiesByUser(user.id)
      .then(response => {
        const data = Array.isArray(response) ? response : (response?.data || []);
        setActivities(data);
      })
      .catch(() => {});
  };

  const handleAccept = (request) => {
    acceptBooking(request.id);
    updateBookingStatus(request.id, 'accepted');

    const text = `You accepted ${request.tenantName || 'a tenant'}'s booking for "${request.listingTitle || 'property'}"`;

    // Save to backend
    activitiesAPI.createActivity(user.id, 'booking', text, 'Just now', 'listing')
      .then(() => refreshActivities())
      .catch(err => console.error('Failed to create activity:', err));

    window.dispatchEvent(new CustomEvent('dormscout:bookingUpdated'));
  };

  const handleReject = (request) => {
    rejectBooking(request.id);
    updateBookingStatus(request.id, 'rejected');

    const text = `You rejected ${request.tenantName || 'a tenant'}'s booking for "${request.listingTitle || 'property'}"`;

    // Save to backend
    activitiesAPI.createActivity(user.id, 'booking', text, 'Just now', 'listing')
      .then(() => refreshActivities())
      .catch(err => console.error('Failed to create activity:', err));

    window.dispatchEvent(new CustomEvent('dormscout:bookingUpdated'));
  };

  return (
    <div className="overview-new">
      <div className="overview-greeting">
        <div>
          <h2 className="overview-greeting-title">
            {getGreeting()}, {displayName}! 
          </h2>
          <p className="overview-greeting-sub" style={{ color: subText }}>
            Here's your property update for today.
          </p>
        </div>
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
              <div style={{ flex: 1, textAlign: 'center', padding: '12px 8px', borderRadius: 12, background: rowBg }}>
                <p style={{ margin: 0, fontSize: 28, fontWeight: 800, color: '#5BADA8' }}>{listings.length}</p>
                <p style={{ margin: 0, fontSize: 11, color: subText, marginTop: 2 }}>Total Listings</p>
              </div>
              <div style={{ flex: 1, textAlign: 'center', padding: '12px 8px', borderRadius: 12, background: rowBg }}>
                <p style={{ margin: 0, fontSize: 28, fontWeight: 800, color: '#E8622E' }}>{totalRoomsAvailable}</p>
                <p style={{ margin: 0, fontSize: 11, color: subText, marginTop: 2 }}>Vacant Rooms</p>
              </div>
              <div style={{ flex: 1, textAlign: 'center', padding: '12px 8px', borderRadius: 12, background: rowBg }}>
                <p style={{ margin: 0, fontSize: 28, fontWeight: 800, color: '#F59E0B' }}>{requests.length}</p>
                <p style={{ margin: 0, fontSize: 11, color: subText, marginTop: 2 }}>Pending Bookings</p>
              </div>
            </div>

            {Object.keys(roomTypeStats).length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <p style={{ margin: '0 0 8px 0', fontSize: 12, fontWeight: 600, color: text }}>Room Types</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {Object.entries(roomTypeStats).map(([roomType, stats]) => (
                    <div key={roomType} style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '6px 12px',
                      background: rowBg,
                      borderRadius: 8,
                      fontSize: 12,
                    }}>
                      <span style={{ color: text, fontWeight: 600 }}>{roomType}</span>
                      <span style={{ color: subText }}>•</span>
                      <span style={{ color: '#5BADA8', fontWeight: 600 }}>{stats.available} vacant</span>
                      <span style={{ color: subText }}>({stats.count} {stats.count === 1 ? 'listing' : 'listings'})</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {listings.slice(0, 3).map((listing) => (
                <div
                  key={listing.id}
                  style={{
                    display: 'flex',
                    gap: 12,
                    padding: 12,
                    background: rowBg,
                    borderRadius: 10,
                    cursor: 'pointer',
                    transition: 'transform 0.2s',
                  }}
                  onClick={() => onNavigate('listing')}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  <div style={{
                    width: 80,
                    height: 80,
                    borderRadius: 8,
                    overflow: 'hidden',
                    flexShrink: 0,
                    background: cardBg,
                  }}>
                    {listing.images && listing.images.length > 0 ? (
                      <img
                        src={listing.images[0]}
                        alt={listing.title}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <div style={{
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '2rem',
                      }}>
                        🏠
                      </div>
                    )}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 4 }}>
                      <p style={{
                        margin: 0,
                        fontSize: 14,
                        fontWeight: 700,
                        color: text,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        maxWidth: '180px',
                      }}>
                        {listing.title}
                      </p>
                      <span style={{
                        fontSize: 14,
                        fontWeight: 700,
                        color: '#E8622E',
                      }}>
                        ₱{Number(listing.price).toLocaleString()}
                      </span>
                    </div>

                    <p style={{
                      margin: 0,
                      fontSize: 12,
                      color: subText,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      marginBottom: 6,
                    }}>
                      {listing.address}
                    </p>

                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <span style={{
                        fontSize: 11,
                        padding: '3px 8px',
                        background: 'rgba(91,173,168,0.15)',
                        color: '#5BADA8',
                        borderRadius: 6,
                        fontWeight: 600,
                      }}>
                        🛏️ {listing.rooms || 'Room'}
                      </span>
                      <span style={{
                        fontSize: 11,
                        padding: '3px 8px',
                        background: parseInt(listing.availableRooms) > 0 ? 'rgba(232,98,46,0.15)' : 'rgba(220,53,69,0.15)',
                        color: parseInt(listing.availableRooms) > 0 ? '#E8622E' : '#dc3545',
                        borderRadius: 6,
                        fontWeight: 600,
                      }}>
                        {listing.availableRooms || 0} rooms vacant
                      </span>
                      {listing.genderPolicy && (
                        <span style={{
                          fontSize: 11,
                          padding: '3px 8px',
                          background: 'rgba(59,130,246,0.15)',
                          color: '#3b82f6',
                          borderRadius: 6,
                          fontWeight: 600,
                        }}>
                          {listing.genderPolicy === 'Girls Only' ? '♀️' : listing.genderPolicy === 'Boys Only' ? '♂️' : '⚥'} {listing.genderPolicy}
                        </span>
                      )}
                    </div>
                  </div>

                  <ChevronRight size={18} color={subText} style={{ alignSelf: 'center', flexShrink: 0 }} />
                </div>
              ))}
            </div>

            {listings.length > 3 && (
              <button
                className="ov-link-btn"
                onClick={() => onNavigate('listing')}
                style={{ color: '#E8622E', marginTop: 12 }}
              >
                View all {listings.length} listings <ChevronRight size={13} />
              </button>
            )}
          </>
        )}
      </div>

      <div className="overview-row-2col">
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
                <ActivityItem key={item.id || item.createdAt} item={item} onNavigate={onNavigate} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function Dashboard({ darkMode = false, setDarkMode }) {
  const [editListingData, setEditListingData] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);

  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { getUnreadCount } = useBooking();
  const { user, logout, userType: authUserType } = useAuth();

  const normalizedUserType = authUserType?.toLowerCase() || 'tenant';
  const isLandlord = normalizedUserType === 'landlord';

  const theme = darkMode ? 'dark' : 'light';

  const getActiveSectionFromPath = () => {
    const path = location.pathname.replace('/', '');
    const validSections = ['overview', 'map', 'listing', 'booking', 'bookmarks', 'notifications', 'messages', 'settings', 'reviews'];
    return validSections.includes(path) ? path : 'overview';
  };

  const activeNav = getActiveSectionFromPath();

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target))
        setShowDropdown(false);
    };
    if (showDropdown) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showDropdown]);

  const isOverview = activeNav === 'overview';
  const subLabel = SECTION_LABELS[activeNav] || 'Dashboard';
  const subDesc = activeNav === 'messages'
    ? SECTION_DESCRIPTIONS.messages
    : activeNav === 'listing'
      ? ''
      : SECTION_DESCRIPTIONS[activeNav] || (isLandlord
          ? 'See an overview of your current listings, messages, and recent activity.'
          : 'See an overview of your current bookings, messages, and recent activity.'
        );

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const navItems = normalizedUserType === 'landlord' ? NAV_ITEMS.landlord : NAV_ITEMS.tenant;
  const unreadCount = getUnreadCount ? getUnreadCount(normalizedUserType) : 0;

  const userInitials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'ME';

  return (
    <div className={`dashboard-wrapper ${theme}`}>
      {/* Navbar */}
      <div className="dashboard-layout">
        <aside className="dashboard-sidebar" role="navigation" aria-label="Main navigation">
          <button
            className="sidebar-logo-btn"
            onClick={() => navigate('/overview')}
            aria-label="Go to Overview"
          >
            <span style={{ color: '#E8622E' }}>Dorm</span>
            <span style={{ color: '#5BADA8' }}>Scout</span>
          </button>

          <nav className="sidebar-nav-items">
            {navItems.map((item) => {
              const isActive = activeNav === item.id;
              const iconColor = isActive ? '#ffffff' : '#E8622E';
              return (
                <button
                  key={item.id}
                  className={`sidebar-nav-btn ${isActive ? 'active' : ''}`}
                  onClick={() => navigate(`/${item.id}`)}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <span className="sidebar-nav-icon">
                    {NAV_ICON[item.id] ? NAV_ICON[item.id](iconColor) : <LayoutDashboard size={18} color={iconColor} />}
                  </span>
                  <span className="sidebar-nav-label">{item.label}</span>
                  {item.id === 'notifications' && unreadCount > 0 && (
                    <span className="sidebar-badge">{unreadCount}</span>
                  )}
                </button>
              );
            })}
          </nav>

          {/*USER MENU — moved from the top header to the sidebar bottom.*/}
          <div ref={dropdownRef} className="sidebar-user-menu">
            <button
              className="sidebar-user-btn"
              onClick={() => {
                          console.log('before toggle, showDropdown is:', showDropdown);
                          setShowDropdown(!showDropdown);
                        }}
              aria-label="User menu"
            >
              <div className="sidebar-avatar">
                {user?.profileImage ? (
                  <img
                    src={user.profileImage}
                    alt="Profile"
                    style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
                  />
                ) : (
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>{userInitials}</span>
                )}
              </div>
              <div className="sidebar-user-info">
                <span className="sidebar-user-name">{user?.name?.split(' ')[0] || 'Account'}</span>
                <span className="sidebar-user-role">{isLandlord ? 'Landlord' : 'Tenant'}</span>
              </div>
            </button>

            {showDropdown && (
              <div className="dashboard-dropdown sidebar-dropdown">
                <div className="dropdown-item dropdown-item-profile"
                  onClick={() => { navigate('/profile'); setShowDropdown(false); }}>
                  <User size={15} /> My Profile
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
                  onClick={() => { setDarkMode && setDarkMode(!darkMode); setShowDropdown(false); }}>
                  {darkMode ? <Sun size={15} /> : <Moon size={15} />}
                  <span style={{ marginLeft: 8 }}>{darkMode ? 'Light Mode' : 'Dark Mode'}</span>
                </div>
                <div className="dropdown-item dropdown-item-logout"
                  onClick={() => { setShowDropdown(false); handleLogout(); }}>
                  <LogOut size={15} /> Logout
                </div>
              </div>
            )}
          </div> 
        </aside>

        {/* Content */}
        <div className="dashboard-content">
          {!isOverview && (
            <div className="dashboard-subheader">
              <h4>{subLabel}</h4>
              <p>{subDesc}</p>
            </div>
          )}

          <div className="dashboard-main">
            {activeNav === 'map' ? (
              <Map darkMode={darkMode} userType={normalizedUserType}
                onEditListing={(listing) => { setEditListingData(listing); navigate('/listing'); }} />
            ) : activeNav === 'listing' && isLandlord ? (
              <ListingPage darkMode={darkMode} editListingData={editListingData} onEditHandled={() => setEditListingData(null)} />
            ) : activeNav === 'booking' && !isLandlord ? (
              <BookingPage darkMode={darkMode} />
            ) : activeNav === 'bookmarks' && !isLandlord ? (
              <BookmarkPage darkMode={darkMode} />
            ) : activeNav === 'notifications' ? (
              <Notifications darkMode={darkMode} userType={normalizedUserType} />
            ) : activeNav === 'reviews' ? (
              <Reviews userType={normalizedUserType} darkMode={darkMode} setDarkMode={setDarkMode} />
            ) : activeNav === 'messages' ? (
              <Messaging darkMode={darkMode} userType={normalizedUserType} contactLandlord={location.state?.contactLandlord} contactTenant={location.state?.contactTenant} />
            ) : activeNav === 'settings' ? (
              <Settings darkMode={darkMode} setDarkMode={setDarkMode} userType={normalizedUserType} />
            ) : (
              isLandlord
                ? <LandlordOverview darkMode={darkMode} onNavigate={(s) => navigate(`/${s}`)} user={user} />
                : <TenantOverview darkMode={darkMode} onNavigate={(s) => navigate(`/${s}`)} user={user} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}