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

const STATS = {
  landlord: [
    { title: 'All Listings',    value: '4', align: 'center' },
    { title: 'Notifications',   value: '3', align: 'center' },
    { title: 'Messages',        value: '3', align: 'center' },
  ],
  tenant: [
    { title: 'Your Current Booking', value: 'Sunshine Boarding House', align: 'left' },
    { title: 'Notifications',        value: '1', align: 'center' },
    { title: 'Messages',             value: '1', align: 'center' },
  ],
};

const MESSAGES = [
  { name: 'LeBron James',    property: 'Sunshine Boarding House' },
  { name: 'Steph Curry',     property: 'Sunshine Boarding House' },
  { name: 'Michael Jordan',  property: 'Sunshine Boarding House' },
];

const ICONS = {
  overview:      '📊',
  map:           '🗺️',
  listing:       '📋',
  booking:       '📅',
  notifications: '🔔',
  messages:      '💬',
  settings:      '⚙️',
  reviews:       '⭐',
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

const NOTIF_ICONS = {
  new_booking:      '📦',
  booking_accepted: '✅',
  booking_rejected: '❌',
};

const getNotifIcon = (type) => NOTIF_ICONS[type] || '💬';

const getHeading = (activeNav, isLandlord) => {
  if (activeNav === 'map')           return <><span className="heading-primary">Map </span><span className="heading-secondary">View</span></>;
  if (activeNav === 'listing' && isLandlord) return <span className="heading-primary">Listings</span>;
  if (activeNav === 'booking' && !isLandlord) return <><span className="heading-primary">My </span><span className="heading-secondary">Bookings</span></>;
  if (activeNav === 'settings')      return <span className="heading-primary">Settings</span>;
  if (activeNav === 'reviews')       return <span className="heading-primary">Reviews</span>;
  if (activeNav === 'notifications') return <span className="heading-primary">Notifications</span>;
  if (activeNav === 'messages')      return <span className="heading-primary">Messages</span>;
  return <><span className="heading-primary">Welcome</span><span className="heading-secondary">Back</span></>;
};

export default function Dashboard({ userType = 'tenant', darkMode = false, setDarkMode }) {
  const [searchParams]    = useSearchParams();
  const sectionFromUrl    = searchParams.get('section') || 'overview';
  const [activeNav, setActiveNav]           = useState(sectionFromUrl);
  const [editListingData, setEditListingData] = useState(null);
  const [showDropdown, setShowDropdown]     = useState(false);
  const navItems   = NAV_ITEMS[userType]  || NAV_ITEMS.tenant;
  const stats      = STATS[userType]      || STATS.tenant;
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

  const hideHeading = ['messages', 'reviews', 'notifications'].includes(activeNav);

  return (
    <div className={`dashboard-wrapper ${theme}`}>

      {/* ===== Navbar ===== */}
      <nav className="dashboard-nav">
        <button
          className="dashboard-nav-title-btn"
          style={{
            background: 'none',
            border: 'none',
            padding: 0,
            margin: 0,
            cursor: 'pointer',
            fontSize: 24,
            fontWeight: 700,
            color: darkMode ? '#eaeaea' : '#333',
            fontFamily: 'inherit',
          }}
          aria-label="Go to Overview"
          onClick={() => { setActiveNav('overview'); navigate('?section=overview'); }}
        >
          DormScout
        </button>

        <div ref={dropdownRef} className="dashboard-dropdown-wrap">
          <div className="dashboard-avatar" onClick={() => setShowDropdown(!showDropdown)}>
            👤
          </div>

          {showDropdown && (
            <div className="dashboard-dropdown">
              <div
                className="dropdown-item dropdown-item-profile"
                onClick={() => { navigate('/profile'); setShowDropdown(false); }}
              >
                👤 My Profile
              </div>
              <div
                className="dropdown-item dropdown-item-default"
                onClick={() => { setActiveNav('settings'); setShowDropdown(false); }}
              >
                ⚙️ Profile Settings
              </div>
              <div
                className="dropdown-item dropdown-item-default"
                onClick={() => { navigate('/support'); setShowDropdown(false); }}
              >
                ❓ Help and Support
              </div>
              <div
                className="dropdown-item dropdown-item-default"
                onClick={() => { navigate('/about'); setShowDropdown(false); }}
              >
                ℹ️ About Us
              </div>
              <div
                className="dropdown-item dropdown-item-default dropdown-item-dark-toggle"
                onClick={() => setDarkMode(!darkMode)}
              >
                <span>{darkMode ? '☀️' : '🌙'} {darkMode ? 'Light Mode' : 'Dark Mode'}</span>
              </div>
              <div
                className="dropdown-item dropdown-item-logout"
                onClick={() => { setShowDropdown(false); navigate('/'); }}
              >
                🚪 Logout
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* ===== Layout: Sidebar + Content ===== */}
      <div className="dashboard-layout">

        {/* Sidebar */}
        <div className="dashboard-sidebar">
          {navItems.map((item) => (
            <button
              key={item.id}
              className={`sidebar-nav-btn ${activeNav === item.id ? 'active' : ''}`}
              onClick={() => setActiveNav(item.id)}
            >
              <span className="sidebar-nav-icon">{ICONS[item.id] || '•'}</span>
              {item.label}
              {item.id === 'notifications' && getUnreadCount(userType) > 0 && (
                <span className="sidebar-badge">{getUnreadCount(userType)}</span>
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="dashboard-content">

          {/* Page Heading */}
          {activeNav === 'notifications' && (
            <h2 className="dashboard-heading has-bottom-margin-lg"><span className="heading-primary">Notifications</span></h2>
          )}
          {!hideHeading && activeNav !== 'notifications' && (
            <h2 className={`dashboard-heading ${activeNav === 'listing' ? 'has-bottom-margin-sm' : 'has-bottom-margin-lg'}`}>
              {getHeading(activeNav, isLandlord)}
            </h2>
          )}
          {hideHeading && activeNav !== 'notifications' && (
            <h2 className="dashboard-heading has-bottom-margin-lg">
              {getHeading(activeNav, isLandlord)}
            </h2>
          )}

          {/* Sub-header */}
          {activeNav !== 'listing' && (
            <div className="dashboard-subheader">
              <h4>{subLabel}</h4>
              <p>{subDesc}</p>
            </div>
          )}

          {/* Main Panel */}
          <div className="dashboard-main">
            {activeNav === 'map' ? (
              <Map
                darkMode={darkMode}
                userType={userType}
                onEditListing={(listing) => { setEditListingData(listing); setActiveNav('listing'); }}
              />
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

              /* ===== Overview ===== */
              <>
                <div className="stats-grid">
                  {stats.map((stat) => (
                    <div key={stat.title} className={`stat-card ${stat.align === 'center' ? 'stat-card-center' : 'stat-card-left'}`}>
                      <h5 className="stat-label">{stat.title}</h5>
                      {stat.align === 'center'
                        ? <p className="stat-value-large">{stat.value}</p>
                        : <p className="stat-value-small">{stat.value}</p>
                      }
                    </div>
                  ))}
                </div>

                <div className="overview-grid">
                  {/* Recent Messages */}
                  <div className="overview-card">
                    <h5 className="overview-card-title">💬 Recent Messages</h5>
                    <div className="messages-list">
                      {MESSAGES.map((msg, idx) => (
                        <div key={idx} className="message-item">
                          <div className="message-item-name">{msg.name}</div>
                          <div className="message-item-property">{msg.property}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Recent Notifications */}
                  <div className="overview-card">
                    <h5 className="overview-card-title">
                      🔔 Recent Notifications
                      {getUnreadCount(userType) > 0 && (
                        <span className="notif-badge">{getUnreadCount(userType)} new</span>
                      )}
                    </h5>
                    <div className="notifications-list">
                      {getNotifications(userType).slice(0, 3).length === 0 ? (
                        <div className="notif-empty">No notifications yet</div>
                      ) : (
                        getNotifications(userType).slice(0, 3).map((notif) => (
                          <div
                            key={notif.id}
                            className={`notif-item ${notif.read ? 'read' : 'unread'}`}
                            onClick={() => { markNotificationRead(notif.id); setActiveNav('notifications'); }}
                          >
                            <span className="notif-icon">{getNotifIcon(notif.type)}</span>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div className="notif-title">{notif.title}</div>
                              <div className="notif-message">{notif.message}</div>
                            </div>
                          </div>
                        ))
                      )}
                      {getNotifications(userType).length > 3 && (
                        <button className="notif-view-all-btn" onClick={() => setActiveNav('notifications')}>
                          View all {getNotifications(userType).length} notifications →
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}