import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './AdminPage.css';
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  CalendarDays,
  FileWarning,
  Star,
  Bell,
  Settings as SettingsIcon,
  Search,
  User,
  LogOut,
  Moon,
  Sun,
  Trash2,
  CheckCircle2,
  XCircle,
  Filter,
  MessageSquare,
} from 'lucide-react';

const ADMIN_LOGIN_KEY = 'dormscout_admin_logged_in';
const ADMIN_DARKMODE_KEY = 'admin_darkMode';

const STORAGE_KEYS = {
  users: 'dormScoutUsers',
  listings: 'dormscout_listings',
  bookings: 'dormscout_bookings',
  bookmarks: 'dormscout_bookmarks',
  reports: 'dormscout_reports',
  reviews: 'dormscout_reviews',
  notifications: 'dormscout_notifications',
  adminMessages: 'dormscout_admin_messages',
  supportMessages: 'dormscout_support_messages',
};

const SIDEBAR_ITEMS = [
  { id: 'overview',   label: 'Overview',    icon: LayoutDashboard },
  { id: 'users',      label: 'Users',       icon: Users           },
  { id: 'listings',   label: 'Listings',    icon: ClipboardList   },
  { id: 'bookings',   label: 'Bookings',    icon: CalendarDays    },
  { id: 'bookmarks',  label: 'Bookmarks',   icon: Star            },
  { id: 'reports',    label: 'Reports',     icon: FileWarning     },
  { id: 'reviews',    label: 'Reviews',     icon: Star            },
  { id: 'messages',   label: 'Messages',    icon: MessageSquare   },
  { id: 'notifications', label: 'Notifications', icon: Bell      },
  { id: 'settings',   label: 'Settings',    icon: SettingsIcon    },
];

const safeParse = (value, fallback = []) => {
  if (!value) return fallback;
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
};

const toDisplayDate = (value) => {
  if (!value) return 'N/A';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString();
};

const getRole = (item = {}) => {
  const role = item.userType || item.role || item.type || 'tenant';
  return String(role).toLowerCase();
};

const getStatusClass = (status = '') => {
  const s = String(status).toLowerCase();
  if (s === 'accepted' || s === 'confirmed' || s === 'resolved' || s === 'active' || s === 'read') {
    return 'is-good';
  }
  if (s === 'pending') {
    return 'is-pending';
  }
  return 'is-bad';
};

const truncate = (text, max = 80) => {
  const value = String(text || '');
  if (value.length <= max) return value;
  return `${value.slice(0, max)}...`;
};

export default function AdminPage() {
  const navigate = useNavigate();

  const [isLoggedIn, setIsLoggedIn] = useState(() => localStorage.getItem(ADMIN_LOGIN_KEY) === 'true');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  const [darkMode, setDarkMode] = useState(() => localStorage.getItem(ADMIN_DARKMODE_KEY) === 'true');
  const [showDropdown, setShowDropdown] = useState(false);
  const [activeSection, setActiveSection] = useState('overview');

  const [users, setUsers] = useState([]);
  const [listings, setListings] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [bookmarks, setBookmarks] = useState([]);
  const [reports, setReports] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [supportMessages, setSupportMessages] = useState([]);
  const [broadcastRole, setBroadcastRole] = useState('landlord');
  const [broadcastSubject, setBroadcastSubject] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [selectedSupportId, setSelectedSupportId] = useState(null);
  const [directReply, setDirectReply] = useState('');
  const [selectedDirectUser, setSelectedDirectUser] = useState(null);
  const [inlineNotice, setInlineNotice] = useState('');
  const [inlineNoticeTone, setInlineNoticeTone] = useState('is-good');

  // eslint-disable-next-line no-unused-vars
  const [dataLoading, setDataLoading] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);

  const [userQuery, setUserQuery] = useState('');
  const [listingQuery, setListingQuery] = useState('');
  const [listingUniversity, setListingUniversity] = useState('all');
  const [bookingQuery, setBookingQuery] = useState('');
  const [reportFilter, setReportFilter] = useState('all');

  // Rejection modal state
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [selectedLandlord, setSelectedLandlord] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const loadLocalData = () => {
    setBookmarks(safeParse(localStorage.getItem(STORAGE_KEYS.bookmarks), []));
    setNotifications(safeParse(localStorage.getItem(STORAGE_KEYS.notifications), []));
    const localSupportMessages = safeParse(localStorage.getItem(STORAGE_KEYS.supportMessages), []);
    setSupportMessages(localSupportMessages);

    if (localSupportMessages.length > 0 && !selectedSupportId && !selectedDirectUser) {
      setSelectedSupportId(localSupportMessages[0].id);
    }
  };

  const loadAdminData = async () => {
    setDataLoading(true);
    try {
      const [usersRes, listingsRes, bookingsRes, reportsRes, reviewsRes] =
        await Promise.all([
          fetch('http://localhost:8080/api/users').then(r => r.json()),
          fetch('http://localhost:8080/api/listings').then(r => r.json()),
          fetch('http://localhost:8080/api/bookings').then(r => r.json()),
          fetch('http://localhost:8080/api/reports').then(r => r.json()),
          fetch('http://localhost:8080/api/reviews').then(r => r.json()),
        ]);

      setUsers(Array.isArray(usersRes) ? usersRes : []);
      setListings(Array.isArray(listingsRes) ? listingsRes : []);
      setBookings(Array.isArray(bookingsRes) ? bookingsRes : []);
      setReports(Array.isArray(reportsRes) ? reportsRes : []);
      setReviews(Array.isArray(reviewsRes) ? reviewsRes : []);
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setDataLoading(false);
    }
    loadLocalData();
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (isLoggedIn) loadAdminData();
  }, [isLoggedIn, activeSection]);

  useEffect(() => {
    const onStorage = () => {
      if (isLoggedIn) loadLocalData();
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [isLoggedIn]);

  useEffect(() => {
    localStorage.setItem(ADMIN_DARKMODE_KEY, darkMode ? 'true' : 'false');
  }, [darkMode]);

  const summary = useMemo(() => {
    const pendingReports = reports.filter((r) => String(r.status || '').toLowerCase() === 'pending').length;
    const activeListings = listings.filter((l) => {
      const status = String(l.status || '').toLowerCase();
      return !status || status === 'active' || status === 'available';
    }).length;

    return {
      totalUsers: users.length,
      totalListings: listings.length,
      totalBookings: bookings.length,
      totalBookmarks: bookmarks.length,
      totalReports: reports.length,
      pendingReports,
      activeListings,
    };
  }, [users, listings, bookings, bookmarks, reports]);

  const universities = useMemo(() => {
    const values = listings
      .map((l) => l.university || l.school || '')
      .filter(Boolean);
    return ['all', ...Array.from(new Set(values))];
  }, [listings]);

  const filteredUsers = useMemo(() => {
    const q = userQuery.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) => {
      const name = String(u.name || `${u.firstName || ''} ${u.lastName || ''}`.trim() || '').toLowerCase();
      const em = String(u.email || '').toLowerCase();
      return name.includes(q) || em.includes(q);
    });
  }, [users, userQuery]);

  const filteredListings = useMemo(() => {
    const q = listingQuery.trim().toLowerCase();
    return listings.filter((l) => {
      const matchesQ = !q || [l.title, l.address, l.landlordName, l.university, l.school]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(q));
      const uni = l.university || l.school || '';
      const matchesUni = listingUniversity === 'all' || uni === listingUniversity;
      return matchesQ && matchesUni;
    });
  }, [listings, listingQuery, listingUniversity]);

  const filteredBookings = useMemo(() => {
    const q = bookingQuery.trim().toLowerCase();
    if (!q) return bookings;
    return bookings.filter((b) => {
      const fields = [
        b.tenantName,
        b.listingTitle,
        b.status,
        b.moveInDate,
        b.bookedOn,
        b.createdAt,
      ].filter(Boolean);
      return fields.some((v) => String(v).toLowerCase().includes(q));
    });
  }, [bookings, bookingQuery]);

  const filteredReports = useMemo(() => {
    if (reportFilter === 'all') return reports;
    return reports.filter((r) => String(r.status || 'pending').toLowerCase() === reportFilter);
  }, [reports, reportFilter]);

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);

    try {
      const response = await fetch('http://localhost:8080/api/users/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (data.success) {
        localStorage.setItem(ADMIN_LOGIN_KEY, 'true');
        localStorage.setItem('dormscout_admin_user', JSON.stringify(data.user));
        setIsLoggedIn(true);
      } else {
        setLoginError(data.message || 'Invalid credentials');
      }
    } catch (err) {
      setLoginError('Cannot connect to server. Make sure backend is running on port 8080.');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem(ADMIN_LOGIN_KEY);
    setIsLoggedIn(false);
    setShowDropdown(false);
    setActiveSection('overview');
  };

  const updateStorage = (key, nextValue) => {
    localStorage.setItem(key, JSON.stringify(nextValue));
    loadLocalData();
  };

  const showInlineNotice = (message, tone = 'is-good') => {
    setInlineNotice(message);
    setInlineNoticeTone(tone);
  };

  const removeByMatcher = (items, matcher) => items.filter((item, idx) => !matcher(item, idx));

  const handleDeleteUser = async (userId) => {
    try {
      const response = await fetch(`http://localhost:8080/api/users/admin/users/${userId}`, {
        method: 'DELETE'
      });
      const data = await response.json();
      if (data.success) {
        setUsers(prev => prev.filter(u => u.id !== userId));
        showInlineNotice('User deleted.', 'is-good');
      } else {
        showInlineNotice('Failed to delete user.', 'is-bad');
      }
    } catch (err) {
      console.error('Failed to delete user:', err);
      showInlineNotice('Failed to delete user.', 'is-bad');
    }
  };

  const handleDeleteListing = async (listingId) => {
    try {
      const response = await fetch(`http://localhost:8080/api/listings/${listingId}`, {
        method: 'DELETE'
      });
      const data = await response.json();
      if (data.success) {
        setListings(prev => prev.filter(l => l.id !== listingId));
        showInlineNotice('Listing deleted.', 'is-good');
      } else {
        showInlineNotice('Failed to delete listing.', 'is-bad');
      }
    } catch (err) {
      console.error('Failed to delete listing:', err);
      showInlineNotice('Failed to delete listing.', 'is-bad');
    }
  };

  const handleApproveLandlord = async (userId) => {
    try {
      const response = await fetch(`http://localhost:8080/api/users/admin/verify-landlord/${userId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await response.json();
      if (data.success) {
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, verified: true, verificationStatus: 'approved' } : u));
        showInlineNotice('Landlord verification approved.', 'is-good');
      }
    } catch (err) {
      console.error('Failed to approve landlord:', err);
      showInlineNotice('Failed to approve landlord.', 'is-bad');
    }
  };

  const handleRejectLandlord = (landlord) => {
    setSelectedLandlord(landlord);
    setRejectionReason('');
    setShowRejectionModal(true);
  };

  const handleSubmitRejection = async () => {
    if (!rejectionReason.trim()) {
      showInlineNotice('Please provide a reason for rejection.', 'is-pending');
      return;
    }
    try {
      const response = await fetch(`http://localhost:8080/api/users/admin/verify-landlord/${selectedLandlord.id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: rejectionReason })
      });
      const data = await response.json();
      if (data.success) {
        setUsers(prev => prev.map(u => u.id === selectedLandlord.id ? { ...u, verified: false, verificationStatus: 'rejected', rejectionReason } : u));
        setShowRejectionModal(false);
        setSelectedLandlord(null);
        setRejectionReason('');
        showInlineNotice('Landlord verification rejected and reason sent.', 'is-good');
      }
    } catch (err) {
      console.error('Failed to reject landlord:', err);
      showInlineNotice('Failed to reject landlord.', 'is-bad');
    }
  };

  const deleteReview = (target, index) => {
    const next = removeByMatcher(reviews, (item, idx) => {
      if (target?.id !== undefined && item?.id !== undefined) {
        return String(item.id) === String(target.id);
      }
      return idx === index;
    });
    updateStorage(STORAGE_KEYS.reviews, next);
  };

  const deleteNotification = (target, index) => {
    const next = removeByMatcher(notifications, (item, idx) => {
      if (target?.id !== undefined && item?.id !== undefined) {
        return String(item.id) === String(target.id);
      }
      return idx === index;
    });
    updateStorage(STORAGE_KEYS.notifications, next);
  };

  const clearNotifications = () => {
    updateStorage(STORAGE_KEYS.notifications, []);
    showInlineNotice('Notifications cleared.', 'is-good');
  };

  const selectedSupportMessage = useMemo(() => {
    if (!selectedSupportId) return selectedDirectUser;
    return supportMessages.find((msg) => msg.id === selectedSupportId) || selectedDirectUser;
  }, [supportMessages, selectedSupportId, selectedDirectUser]);

  const handleMessageUser = (userRecord) => {
    const directTarget = {
      id: `direct-user-${userRecord?.id || Date.now()}`,
      name:
        userRecord?.name ||
        (userRecord?.firstName && userRecord?.lastName
          ? `${userRecord.firstName} ${userRecord.lastName}`
          : userRecord?.firstName || userRecord?.lastName || 'User'),
      email: userRecord?.email || '',
      subject: 'Direct message from admin',
      message: '',
      forRole: getRole(userRecord),
      replied: false,
      createdAt: new Date().toISOString(),
      isDirectUser: true,
    };

    setSelectedSupportId(null);
    setSelectedDirectUser(directTarget);
    setActiveSection('messages');
  };

  const handleSendAdminMessage = () => {
    if (!broadcastSubject.trim() || !broadcastMessage.trim()) {
      showInlineNotice('Please provide both a subject and a message.', 'is-pending');
      return;
    }

    const timestamp = new Date().toISOString();
    const adminMessage = {
      id: `admin-msg-${Date.now()}`,
      title: broadcastSubject.trim(),
      text: broadcastMessage.trim(),
      forRole: broadcastRole,
      createdAt: timestamp,
    };

    const existingMessages = safeParse(localStorage.getItem(STORAGE_KEYS.adminMessages), []);
    localStorage.setItem(STORAGE_KEYS.adminMessages, JSON.stringify([{ ...adminMessage, mode: 'broadcast' }, ...existingMessages]));
    setBroadcastSubject('');
    setBroadcastMessage('');
    showInlineNotice('Broadcast message sent.', 'is-good');
  };

  const handleSendDirectReply = () => {
    if (!selectedSupportMessage) {
      showInlineNotice('Select a concern first.', 'is-pending');
      return;
    }

    if (!directReply.trim()) {
      showInlineNotice('Please type your reply.', 'is-pending');
      return;
    }

    const timestamp = new Date().toISOString();
    const existingMessages = safeParse(localStorage.getItem(STORAGE_KEYS.adminMessages), []);
    const directMessage = {
      id: `admin-direct-${Date.now()}`,
      mode: 'direct',
      title: `Re: ${selectedSupportMessage.subject || 'Support Concern'}`,
      text: directReply.trim(),
      forRole: selectedSupportMessage.forRole || 'all',
      recipientEmail: String(selectedSupportMessage.email || '').toLowerCase(),
      recipientName: selectedSupportMessage.name || 'User',
      createdAt: timestamp,
    };

    localStorage.setItem(STORAGE_KEYS.adminMessages, JSON.stringify([directMessage, ...existingMessages]));

    const isSupportConcern = supportMessages.some((item) => item.id === selectedSupportMessage.id);
    if (isSupportConcern) {
      const nextSupportMessages = supportMessages.map((item) =>
        item.id === selectedSupportMessage.id
          ? {
              ...item,
              replied: true,
              repliedAt: timestamp,
              latestReply: directReply.trim(),
            }
          : item
      );

      setSupportMessages(nextSupportMessages);
      localStorage.setItem(STORAGE_KEYS.supportMessages, JSON.stringify(nextSupportMessages));
    }

    setDirectReply('');
    showInlineNotice(`Reply sent to ${selectedSupportMessage.name || selectedSupportMessage.email}.`, 'is-good');
  };

  const handleDeleteSupportMessage = (targetId) => {
    const nextMessages = supportMessages.filter((item) => item.id !== targetId);
    setSupportMessages(nextMessages);
    localStorage.setItem(STORAGE_KEYS.supportMessages, JSON.stringify(nextMessages));
    if (targetId === selectedSupportId) {
      setSelectedSupportId(nextMessages[0]?.id || null);
    }
  };

  const handleDeleteReport = async (reportId) => {
    try {
      const response = await fetch(`http://localhost:8080/api/reports/${reportId}`, {
        method: 'DELETE'
      });
      const data = await response.json();
      if (data.success) {
        setReports(prev => prev.filter(r => r.id !== reportId));
        showInlineNotice('Report deleted.', 'is-good');
      } else {
        showInlineNotice('Failed to delete report.', 'is-bad');
      }
    } catch (err) {
      console.error('Failed to delete report:', err);
      showInlineNotice('Failed to delete report.', 'is-bad');
    }
  };

  const handleResolveReport = async (reportId) => {
    try {
      const response = await fetch(`http://localhost:8080/api/reports/${reportId}/status?status=resolved`, {
        method: 'PUT'
      });
      const data = await response.json();
      if (data.success) {
        setReports(prev => prev.map(r =>
          r.id === reportId ? { ...r, status: 'resolved' } : r
        ));
      }
    } catch (err) {
      console.error('Failed to resolve report:', err);
    }
  };

  const clearAllReports = () => {
    updateStorage(STORAGE_KEYS.reports, []);
    showInlineNotice('All reports cleared.', 'is-good');
  };

  const clearAllBookings = () => {
    updateStorage(STORAGE_KEYS.bookings, []);
    showInlineNotice('All bookings cleared.', 'is-good');
  };

  const deleteBookmark = (target, index) => {
    const next = removeByMatcher(bookmarks, (item, idx) => {
      if (target?.id !== undefined && item?.id !== undefined) {
        return String(item.id) === String(target.id);
      }
      return idx === index;
    });
    updateStorage(STORAGE_KEYS.bookmarks, next);
  };

  const clearAllBookmarks = () => {
    updateStorage(STORAGE_KEYS.bookmarks, []);
    showInlineNotice('All bookmarks cleared.', 'is-good');
  };

  const clearAllListings = () => {
    updateStorage(STORAGE_KEYS.listings, []);
    showInlineNotice('All listings cleared.', 'is-good');
  };

  if (!isLoggedIn) {
    return (
      <div className={`admin-login-page ${darkMode ? 'dark' : 'light'}`}>
        <div className="admin-login-card">
          <div className="admin-text-logo admin-text-logo-login" aria-label="DormScout logo">
            <span className="admin-text-logo-primary">Dorm</span>
            <span className="admin-text-logo-secondary">Scout</span>
          </div>
          <h1>Admin Portal</h1>
          <p>Sign in to manage DormScout data.</p>

          <form onSubmit={handleAdminLogin} className="admin-login-form">
            <label htmlFor="adminEmail">Email</label>
            <input
              id="adminEmail"
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin"
            />

            <label htmlFor="adminPassword">Password</label>
            <input
              id="adminPassword"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="admin"
            />

            {loginError ? <div className="admin-error">{loginError}</div> : null}

            <button type="submit" className="admin-login-btn" disabled={loginLoading}>
              {loginLoading ? 'Signing in...' : 'Login'}
            </button>
          </form>

          <button className="admin-back-btn" onClick={() => navigate('/')}>Back to Home</button>
        </div>
      </div>
    );
  }

  return (
    <div className={`admin-wrapper ${darkMode ? 'dark' : 'light'}`}>
      <nav className="admin-nav">
        <div className="admin-nav-brand" onClick={() => setActiveSection('overview')} role="button" tabIndex={0}>
          <div className="admin-text-logo" aria-label="DormScout logo">
            <span className="admin-text-logo-primary">Dorm</span>
            <span className="admin-text-logo-secondary">Scout</span>
          </div>
          <span>Admin</span>
        </div>

        <div className="admin-dropdown-wrap">
          <button className="admin-avatar" onClick={() => setShowDropdown((v) => !v)} aria-label="Admin menu">
            <User size={18} />
          </button>

          {showDropdown ? (
            <div className="admin-dropdown">
              <button className="admin-dropdown-item">
                <User size={15} /> admin
              </button>
              <button className="admin-dropdown-item" onClick={() => setDarkMode((v) => !v)}>
                {darkMode ? <Sun size={15} /> : <Moon size={15} />}
                {darkMode ? 'Light Mode' : 'Dark Mode'}
              </button>
              <button className="admin-dropdown-item admin-danger" onClick={handleLogout}>
                <LogOut size={15} /> Logout
              </button>
            </div>
          ) : null}
        </div>
      </nav>

      <div className="admin-layout">
        <aside className="admin-sidebar">
          {SIDEBAR_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                className={`admin-side-btn ${isActive ? 'active' : ''}`}
                onClick={() => setActiveSection(item.id)}
              >
                <Icon size={18} />
                <span className="admin-side-label">{item.label}</span>
              </button>
            );
          })}
        </aside>

        <main className="admin-main">
          {inlineNotice ? (
            <div className={`admin-inline-notice ${inlineNoticeTone}`}>
              {inlineNotice}
            </div>
          ) : null}

          {activeSection === 'overview' ? (
            <section>
              <h2 className="admin-section-title">Overview</h2>
              <div className="admin-stats-grid">
                <article className="admin-stat-card"><p>Total Users</p><h3>{summary.totalUsers}</h3></article>
                <article className="admin-stat-card"><p>Total Listings</p><h3>{summary.totalListings}</h3></article>
                <article className="admin-stat-card"><p>Total Bookings</p><h3>{summary.totalBookings}</h3></article>
                <article className="admin-stat-card"><p>Total Bookmarks</p><h3>{summary.totalBookmarks}</h3></article>
                <article className="admin-stat-card"><p>Total Reports</p><h3>{summary.totalReports}</h3></article>
                <article className="admin-stat-card"><p>Pending Reports</p><h3>{summary.pendingReports}</h3></article>
                <article className="admin-stat-card"><p>Active Listings</p><h3>{summary.activeListings}</h3></article>
              </div>
            </section>
          ) : null}

          {activeSection === 'users' ? (
            <section>
              <div className="admin-section-head">
                <h2 className="admin-section-title">Users</h2>
                <div className="admin-search-wrap">
                  <Search size={16} />
                  <input
                    value={userQuery}
                    onChange={(e) => setUserQuery(e.target.value)}
                    placeholder="Search by name or email"
                  />
                </div>
              </div>

              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Verification</th>
                      <th>Created At</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.length === 0 ? (
                      <tr><td colSpan={6} className="admin-empty">No users found.</td></tr>
                    ) : filteredUsers.map((u, idx) => {
                      const role = getRole(u);
                      const verStatus = u.verificationStatus || 'none';
                      const isLandlord = role === 'landlord';
                      return (
                        <tr key={u.id || u.email || `user-${idx}`}>
                          <td>{u.name || (u.firstName && u.lastName ? `${u.firstName} ${u.lastName}` : u.firstName || u.lastName || 'N/A')}</td>
                          <td>{u.email || 'N/A'}</td>
                          <td>
                            <span className={`admin-badge ${role === 'landlord' ? 'role-landlord' : 'role-tenant'}`}>
                              {role}
                            </span>
                          </td>
                          <td>
                            {isLandlord && verStatus === 'pending' ? (
                              <span className="admin-badge is-pending">Pending</span>
                            ) : isLandlord && verStatus === 'approved' ? (
                              <span className="admin-badge is-good">✓ Verified</span>
                            ) : isLandlord && verStatus === 'rejected' ? (
                              <span className="admin-badge is-bad">✗ Rejected</span>
                            ) : (
                              <span className="admin-badge">N/A</span>
                            )}
                          </td>
                          <td>{toDisplayDate(u.createdAt)}</td>
                          <td>
                            {isLandlord && verStatus === 'pending' ? (
                              <div className="admin-action-group">
                                <button className="admin-icon-btn success" onClick={() => handleApproveLandlord(u.id)}>
                                  <CheckCircle2 size={15} /> Approve
                                </button>
                                <button className="admin-icon-btn danger" onClick={() => handleRejectLandlord(u)}>
                                  <XCircle size={15} /> Reject
                                </button>
                                <button className="admin-icon-btn" onClick={() => handleMessageUser(u)}>
                                  <MessageSquare size={15} /> Message
                                </button>
                              </div>
                            ) : (
                              <div className="admin-action-group">
                                <button className="admin-icon-btn danger" onClick={() => handleDeleteUser(u.id)}>
                                  <Trash2 size={15} /> Delete
                                </button>
                                <button className="admin-icon-btn" onClick={() => handleMessageUser(u)}>
                                  <MessageSquare size={15} /> Message
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          ) : null}

          {activeSection === 'listings' ? (
            <section>
              <div className="admin-section-head listing-head">
                <h2 className="admin-section-title">Listings</h2>
                <div className="admin-controls-row">
                  <div className="admin-search-wrap">
                    <Search size={16} />
                    <input
                      value={listingQuery}
                      onChange={(e) => setListingQuery(e.target.value)}
                      placeholder="Search listings"
                    />
                  </div>
                  <div className="admin-select-wrap">
                    <Filter size={15} />
                    <select value={listingUniversity} onChange={(e) => setListingUniversity(e.target.value)}>
                      {universities.map((u) => (
                        <option key={u} value={u}>{u === 'all' ? 'All Universities' : u}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="admin-listing-grid">
                {filteredListings.length === 0 ? <p className="admin-empty">No listings available.</p> : filteredListings.map((l, idx) => (
                  <article className="admin-listing-card" key={l.id || `${l.title}-${l.address}-${idx}`}>
                    <h4>{l.title || 'Untitled Listing'}</h4>
                    <p><strong>Address:</strong> {l.address || 'N/A'}</p>
                    <p><strong>Price:</strong> {l.price ? `PHP ${l.price}` : 'N/A'}</p>
                    <p><strong>Landlord Name:</strong> {l.landlordName || l.landlord || 'N/A'}</p>
                    <p><strong>University:</strong> {l.university || l.school || 'N/A'}</p>
                    <p><strong>Gender Policy:</strong> {l.genderPolicy || 'N/A'}</p>
                    <p>
                      <strong>Status:</strong>{' '}
                      <span className={`admin-badge ${getStatusClass(l.status || 'active')}`}>
                        {l.status || 'active'}
                      </span>
                    </p>
                    <button className="admin-icon-btn danger" onClick={() => handleDeleteListing(l.id)}>
                      <Trash2 size={15} /> Delete listing
                    </button>
                  </article>
                ))}
              </div>
            </section>
          ) : null}

          {activeSection === 'bookings' ? (
            <section>
              <div className="admin-section-head">
                <h2 className="admin-section-title">Bookings</h2>
                <div className="admin-search-wrap">
                  <Search size={16} />
                  <input
                    value={bookingQuery}
                    onChange={(e) => setBookingQuery(e.target.value)}
                    placeholder="Search bookings"
                  />
                </div>
              </div>

              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Tenant Name</th>
                      <th>Listing Title</th>
                      <th>Move-in Date</th>
                      <th>Status</th>
                      <th>Booked On</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBookings.length === 0 ? (
                      <tr><td colSpan={5} className="admin-empty">No bookings found.</td></tr>
                    ) : filteredBookings.map((b) => (
                      <tr key={b.id || `${b.tenantName}-${b.listingTitle}-${b.createdAt}`}>
                        <td>{b.tenantName || 'N/A'}</td>
                        <td>{b.listingTitle || 'N/A'}</td>
                        <td>{toDisplayDate(b.moveInDate)}</td>
                        <td>
                          <span className={`admin-badge ${getStatusClass(b.status)}`}>
                            {b.status || 'pending'}
                          </span>
                        </td>
                        <td>{toDisplayDate(b.bookedOn || b.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ) : null}

          {activeSection === 'bookmarks' ? (
            <section>
              <div className="admin-section-head">
                <h2 className="admin-section-title">Bookmarks</h2>
                <button className="admin-icon-btn" onClick={clearAllBookmarks}>Clear All</button>
              </div>

              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Tenant ID</th>
                      <th>Listing Title</th>
                      <th>Listing Address</th>
                      <th>Price</th>
                      <th>Saved At</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bookmarks.length === 0 ? (
                      <tr><td colSpan={6} className="admin-empty">No bookmarks found.</td></tr>
                    ) : bookmarks.map((bm, idx) => (
                      <tr key={bm.id || `bm-${idx}`}>
                        <td>{bm.tenantId || 'N/A'}</td>
                        <td>{bm.listingTitle || 'N/A'}</td>
                        <td>{bm.listingAddress || 'N/A'}</td>
                        <td>{bm.listingPrice ? `₱${Number(bm.listingPrice).toLocaleString()}` : 'N/A'}</td>
                        <td>{toDisplayDate(bm.savedAt)}</td>
                        <td>
                          <button className="admin-icon-btn danger" onClick={() => deleteBookmark(bm, idx)}>
                            <Trash2 size={15} /> Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ) : null}

          {activeSection === 'reports' ? (
            <section>
              <div className="admin-section-head">
                <h2 className="admin-section-title">Reports</h2>
                <div className="admin-tabs">
                  {['all', 'pending', 'resolved'].map((tab) => (
                    <button
                      key={tab}
                      className={`admin-tab ${reportFilter === tab ? 'active' : ''}`}
                      onClick={() => setReportFilter(tab)}
                    >
                      {tab[0].toUpperCase() + tab.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="admin-report-grid">
                {filteredReports.length === 0 ? <p className="admin-empty">No reports found.</p> : filteredReports.map((r, idx) => {
                  const status = String(r.status || 'pending').toLowerCase();
                  const evidence = r.evidence || r.evidencePhoto || r.image || r.photo;
                  return (
                    <article className="admin-report-card" key={r.id || `${r.subject}-${r.createdAt}-${idx}`}>
                      <div className="admin-report-top">
                        <h4>{r.reportType || r.type || 'Report'}</h4>
                        <span className={`admin-badge ${getStatusClass(status)}`}>{status}</span>
                      </div>
                      <p><strong>Subject:</strong> {r.subject || 'N/A'}</p>
                      <p><strong>Reason:</strong> {r.reason || 'N/A'}</p>
                      <p><strong>Description:</strong> {r.description || 'N/A'}</p>
                      {evidence ? (
                        <div className="admin-evidence-wrap">
                          <img src={evidence} alt="Evidence" className="admin-evidence-thumb" />
                        </div>
                      ) : null}
                      <p><strong>Submitted At:</strong> {toDisplayDate(r.submittedAt || r.createdAt)}</p>
                      <div className="admin-report-actions">
                        {status === 'pending' ? (
                          <button className="admin-icon-btn success" onClick={() => handleResolveReport(r.id)}>
                            <CheckCircle2 size={15} /> Resolve
                          </button>
                        ) : null}
                        <button className="admin-icon-btn danger" onClick={() => handleDeleteReport(r.id)}>
                          <XCircle size={15} /> Dismiss
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          ) : null}

          {activeSection === 'reviews' ? (
            <section>
              <h2 className="admin-section-title">Reviews</h2>
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Author</th>
                      <th>Dorm</th>
                      <th>Rating</th>
                      <th>Tags</th>
                      <th>Body</th>
                      <th>Date</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reviews.length === 0 ? (
                      <tr><td colSpan={7} className="admin-empty">No reviews found.</td></tr>
                    ) : reviews.map((rv, idx) => {
                      const rating = Number(rv.rating || 0);
                      return (
                        <tr key={rv.id || `${rv.author}-${rv.createdAt}-${idx}`}>
                          <td>{rv.author || rv.name || 'N/A'}</td>
                          <td>{rv.dorm || rv.listingTitle || rv.property || 'N/A'}</td>
                          <td>{'★'.repeat(Math.max(0, Math.min(5, rating)))}{'☆'.repeat(5 - Math.max(0, Math.min(5, rating)))}</td>
                          <td>{Array.isArray(rv.tags) ? rv.tags.join(', ') : (rv.tags || 'N/A')}</td>
                          <td>{truncate(rv.body || rv.comment || rv.review, 90)}</td>
                          <td>{toDisplayDate(rv.date || rv.createdAt)}</td>
                          <td>
                            <button className="admin-icon-btn danger" onClick={() => deleteReview(rv, idx)}>
                              <Trash2 size={15} /> Delete
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          ) : null}

          {activeSection === 'notifications' ? (
            <section>
              <div className="admin-section-head">
                <h2 className="admin-section-title">Notifications</h2>
                <button className="admin-icon-btn" onClick={clearNotifications}>Clear All</button>
              </div>

              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Message</th>
                      <th>Type</th>
                      <th>For Role</th>
                      <th>Created At</th>
                      <th>Read</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {notifications.length === 0 ? (
                      <tr><td colSpan={7} className="admin-empty">No notifications available.</td></tr>
                    ) : notifications.map((n, idx) => (
                      <tr key={n.id || `${n.title}-${n.createdAt}-${idx}`}>
                        <td>{n.title || 'N/A'}</td>
                        <td>{n.message || 'N/A'}</td>
                        <td>{n.type || 'general'}</td>
                        <td>{n.forRole || n.role || 'all'}</td>
                        <td>{toDisplayDate(n.createdAt)}</td>
                        <td>
                          <span className={`admin-badge ${n.read ? 'is-good' : 'is-pending'}`}>
                            {n.read ? 'Read' : 'Unread'}
                          </span>
                        </td>
                        <td>
                          <button className="admin-icon-btn danger" onClick={() => deleteNotification(n, idx)}>
                            <Trash2 size={15} /> Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ) : null}

          {activeSection === 'messages' ? (
            <section>
              <div className="admin-section-head">
                <h2 className="admin-section-title">Messages</h2>
              </div>

              <div className="admin-messages-grid">
                <article className="admin-card admin-support-inbox-card">
                  <h3>Support Inbox</h3>
                  <p>Pick a concern to reply directly to the sender.</p>
                  <div className="admin-support-list">
                    {supportMessages.length === 0 ? (
                      <p className="admin-empty">No support concerns yet.</p>
                    ) : supportMessages.map((item) => {
                      const isActive = selectedSupportId === item.id;
                      return (
                        <div
                          key={item.id}
                          className={`admin-support-item ${isActive ? 'active' : ''}`}
                          onClick={() => {
                            setSelectedDirectUser(null);
                            setSelectedSupportId(item.id);
                          }}
                          role="button"
                          tabIndex={0}
                        >
                          <div className="admin-support-item-top">
                            <strong>{item.name || 'Unknown User'}</strong>
                            <span className={`admin-badge ${item.replied ? 'is-good' : 'is-pending'}`}>
                              {item.replied ? 'Replied' : 'Open'}
                            </span>
                          </div>
                          <p>{item.subject || 'No subject'}</p>
                          <small>{item.email || 'No email'} · {toDisplayDate(item.createdAt)}</small>
                          <div className="admin-support-actions">
                            <button
                              className="admin-icon-btn danger"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteSupportMessage(item.id);
                              }}
                            >
                              <Trash2 size={15} /> Delete
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </article>

                <article className="admin-card admin-broadcast-card">
                  <h3>Message Selected User</h3>
                  {selectedSupportMessage ? (
                    <>
                      <p>
                        <strong>To:</strong> {selectedSupportMessage.name} ({selectedSupportMessage.email})
                      </p>
                      <p>
                        <strong>Concern:</strong> {selectedSupportMessage.subject}
                      </p>
                      <p className="admin-support-preview">{selectedSupportMessage.message}</p>
                    </>
                  ) : (
                    <p>Select a support concern from the inbox.</p>
                  )}

                  <textarea
                    className="admin-broadcast-textarea"
                    placeholder="Type your direct reply"
                    value={directReply}
                    onChange={(e) => setDirectReply(e.target.value)}
                    rows={4}
                    disabled={!selectedSupportMessage}
                  />
                  <button className="admin-icon-btn" onClick={handleSendDirectReply} disabled={!selectedSupportMessage}>
                    Send Direct Reply
                  </button>
                </article>

                <article className="admin-card admin-broadcast-card">
                  <h3>Broadcast Message</h3>
                  <p>Send a one-way message to all landlords, all tenants, or everyone.</p>
                  <div className="admin-broadcast-grid">
                    <div className="admin-select-wrap">
                      <select value={broadcastRole} onChange={(e) => setBroadcastRole(e.target.value)}>
                        <option value="landlord">All Landlords</option>
                        <option value="tenant">All Tenants</option>
                        <option value="all">Everyone</option>
                      </select>
                    </div>
                    <input
                      className="admin-broadcast-input"
                      type="text"
                      placeholder="Subject"
                      value={broadcastSubject}
                      onChange={(e) => setBroadcastSubject(e.target.value)}
                    />
                  </div>
                  <textarea
                    className="admin-broadcast-textarea"
                    placeholder="Type your message here"
                    value={broadcastMessage}
                    onChange={(e) => setBroadcastMessage(e.target.value)}
                    rows={4}
                  />
                  <button className="admin-icon-btn" onClick={handleSendAdminMessage}>Send Broadcast</button>
                </article>
              </div>
            </section>
          ) : null}

          {activeSection === 'settings' ? (
            <section>
              <h2 className="admin-section-title">Settings</h2>

              <div className="admin-settings-grid">
                <article className="admin-card">
                  <h3>Theme</h3>
                  <p>Toggle admin dark mode.</p>
                  <button className="admin-toggle" onClick={() => setDarkMode((v) => !v)}>
                    {darkMode ? <Sun size={16} /> : <Moon size={16} />}
                    {darkMode ? 'Switch to Light' : 'Switch to Dark'}
                  </button>
                </article>

                <article className="admin-card">
                  <h3>Admin Account</h3>
                  {(() => {
                    const adminUser = JSON.parse(localStorage.getItem('dormscout_admin_user') || '{}');
                    return (
                      <>
                        <p><strong>Email:</strong> {adminUser.email || 'admin@dormscout.com'}</p>
                        <p><strong>Name:</strong> {adminUser.firstName && adminUser.lastName ? `${adminUser.firstName} ${adminUser.lastName}` : 'Admin DormScout'}</p>
                        <p><strong>Role:</strong> Administrator</p>
                        <p><strong>User Type:</strong> {adminUser.userType || 'admin'}</p>
                      </>
                    );
                  })()}
                </article>

                <article className="admin-card admin-danger-card">
                  <h3>Danger Zone</h3>
                  <p>These actions are irreversible.</p>
                  <div className="admin-danger-actions">
                    <button className="admin-icon-btn danger" onClick={clearAllReports}>Clear all reports</button>
                    <button className="admin-icon-btn danger" onClick={clearAllBookings}>Clear all bookings</button>
                    <button className="admin-icon-btn danger" onClick={clearAllListings}>Clear all listings</button>
                  </div>
                </article>
              </div>
            </section>
          ) : null}
        </main>
      </div>

      {/* Rejection Modal */}
      {showRejectionModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Reject Landlord Verification</h2>
              <button className="modal-close" onClick={() => setShowRejectionModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <p>Landlord: <strong>{selectedLandlord?.name || selectedLandlord?.email}</strong></p>
              <label htmlFor="rejection-reason">Reason for Rejection</label>
              <textarea
                id="rejection-reason"
                className="rejection-textarea"
                placeholder="Please provide a detailed reason for rejecting this landlord's verification..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={6}
              />
            </div>
            <div className="modal-footer">
              <button className="admin-btn" onClick={() => setShowRejectionModal(false)}>Cancel</button>
              <button className="admin-btn danger" onClick={handleSubmitRejection}>Reject & Send</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
