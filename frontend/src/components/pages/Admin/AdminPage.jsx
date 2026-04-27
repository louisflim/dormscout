import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  userAPI,
  listingsAPI,
  bookingsAPI,
  reportsAPI,
  reviewsAPI,
  bookmarksAPI,
  supportMessagesAPI,
} from '../../../utils/api';
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
} from 'lucide-react';

const ADMIN_LOGIN_KEY = 'dormscout_admin_logged_in';
const ADMIN_DARKMODE_KEY = 'admin_darkMode';

const SIDEBAR_ITEMS = [
  { id: 'overview',   label: 'Overview',    icon: LayoutDashboard },
  { id: 'users',      label: 'Users',       icon: Users           },
  { id: 'listings',   label: 'Listings',    icon: ClipboardList   },
  { id: 'bookings',   label: 'Bookings',    icon: CalendarDays    },
  { id: 'verifications', label: 'Verifications', icon: CheckCircle2 },
  { id: 'bookmarks',  label: 'Bookmarks',   icon: Star            },
  { id: 'reports',    label: 'Reports',     icon: FileWarning     },
  { id: 'reviews',    label: 'Reviews',     icon: Star            },
  { id: 'support',    label: 'Support',     icon: Bell            },
  { id: 'notifications', label: 'Notifications', icon: Bell      },
  { id: 'settings',   label: 'Settings',    icon: SettingsIcon    },
];

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

const toDisplayValue = (value, fallback = 'N/A') => {
  if (value === null || value === undefined || value === '') return fallback;
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  if (Array.isArray(value)) {
    const joined = value.map((v) => toDisplayValue(v, '')).filter(Boolean).join(', ');
    return joined || fallback;
  }
  if (typeof value === 'object') {
    const fullName = [value.firstName, value.lastName].filter(Boolean).join(' ').trim();
    if (fullName) return fullName;
    if (value.name) return String(value.name);
    if (value.title) return String(value.title);
    if (value.email) return String(value.email);
    if (value.id !== undefined && value.id !== null) return `#${value.id}`;
    return fallback;
  }
  return fallback;
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
  const [supportMessages, setSupportMessages] = useState([]);
  const [notifications, setNotifications] = useState([]);

  const [userQuery, setUserQuery] = useState('');
  const [listingQuery, setListingQuery] = useState('');
  const [listingUniversity, setListingUniversity] = useState('all');
  const [bookingQuery, setBookingQuery] = useState('');
  const [reportFilter, setReportFilter] = useState('all');

  const loadAdminData = async () => {
    try {
      const [usersRes, listingsRes, bookingsRes, reportsRes, reviewsRes, bookmarksRes, supportRes] =
        await Promise.all([
          userAPI.getAll(),
          listingsAPI.getAll(),
          bookingsAPI.getAll(),
          reportsAPI.getAll(),
          reviewsAPI.getAll(),
          bookmarksAPI.getAll(),
          supportMessagesAPI.getAll(),
        ]);

      const usersData = Array.isArray(usersRes.data) ? usersRes.data : [];
      const listingsData = Array.isArray(listingsRes.data) ? listingsRes.data : [];
      const bookingsDataRaw = Array.isArray(bookingsRes.data) ? bookingsRes.data : [];
      const reportsData = Array.isArray(reportsRes.data) ? reportsRes.data : [];
      const reviewsData = Array.isArray(reviewsRes.data) ? reviewsRes.data : [];
      const bookmarksDataRaw = Array.isArray(bookmarksRes.data) ? bookmarksRes.data : [];
      const supportData = Array.isArray(supportRes.data) ? supportRes.data : [];

      const bookingsData = bookingsDataRaw.map((b) => ({
        ...b,
        tenantName: b.tenantName || [b.tenant?.firstName, b.tenant?.lastName].filter(Boolean).join(' ') || 'N/A',
        listingTitle: b.listingTitle || b.listing?.title || 'N/A',
      }));

      const bookmarksData = bookmarksDataRaw.map((bm) => ({
        ...bm,
        tenantId: bm.tenantId || bm.tenant?.id,
        listingId: bm.listingId || bm.listing?.id,
        listingTitle: bm.listingTitle || bm.listing?.title || 'N/A',
        listingAddress: bm.listingAddress || bm.listing?.address || 'N/A',
        listingPrice: bm.listingPrice || bm.listing?.price || null,
        savedAt: bm.savedAt || bm.createdAt,
      }));

      const backendNotifications = [
        ...bookingsData
          .filter((b) => ['pending', 'cancelled'].includes(String(b.status || '').toLowerCase()))
          .map((b) => ({
            id: `booking-${b.id}-${String(b.status || '').toLowerCase()}`,
            title: String(b.status || '').toLowerCase() === 'cancelled' ? 'Booking Cancelled' : 'Booking Pending',
            message: `${b.tenantName || 'Tenant'} - ${b.listingTitle || 'Listing'}`,
            type: 'booking',
            forRole: 'admin',
            createdAt: b.updatedAt || b.createdAt,
            read: false,
          })),
        ...reportsData
          .filter((r) => String(r.status || 'pending').toLowerCase() === 'pending')
          .map((r) => ({
            id: `report-${r.id}`,
            title: 'Pending Report',
            message: `${r.subject || r.reportType || 'Report'} needs review`,
            type: 'report',
            forRole: 'admin',
            createdAt: r.submittedAt || r.createdAt,
            read: false,
          })),
        ...supportData
          .filter((s) => String(s.status || 'pending').toLowerCase() === 'pending')
          .map((s) => ({
            id: `support-${s.id}`,
            title: 'New Support Message',
            message: `${s.subject || 'Support request'} from ${s.name || s.email || 'user'}`,
            type: 'support',
            forRole: 'admin',
            createdAt: s.createdAt,
            read: false,
          })),
        ...usersData
          .filter((u) => String(u.verificationStatus || '').toLowerCase() === 'pending')
          .map((u) => ({
            id: `verification-${u.id}`,
            title: 'Business Verification Request',
            message: `${[u.firstName, u.lastName].filter(Boolean).join(' ') || u.email || 'Landlord'} submitted verification request.`,
            type: 'verification',
            forRole: 'admin',
            createdAt: u.updatedAt || u.createdAt,
            read: false,
          })),
      ].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

      setUsers(usersData);
      setListings(listingsData);
      setBookings(bookingsData);
      setReports(reportsData);
      setReviews(reviewsData);
      setBookmarks(bookmarksData);
      setSupportMessages(supportData);
      setNotifications(backendNotifications);
    } catch (err) {
      console.error('Failed to load admin data', err);
    }
  };

  useEffect(() => {
    if (!isLoggedIn) return;
    loadAdminData();
  }, [isLoggedIn, activeSection]);

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
      const name = String(u.firstName || u.name || '').toLowerCase() + ' ' + String(u.lastName || '').toLowerCase();
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

  const verificationRequests = useMemo(() => {
    return users.filter((u) => {
      const role = getRole(u);
      const status = String(u.verificationStatus || '').toLowerCase();
      return role === 'landlord' && ['pending', 'approved', 'rejected'].includes(status);
    });
  }, [users]);

  const handleLogin = (e) => {
    e.preventDefault();
    if (email.trim() === 'admin' && password === 'admin') {
      localStorage.setItem(ADMIN_LOGIN_KEY, 'true');
      setIsLoggedIn(true);
      setLoginError('');
      setEmail('');
      setPassword('');
      return;
    }
    setLoginError('Invalid credentials. Use admin / admin.');
  };

  const handleLogout = () => {
    localStorage.removeItem(ADMIN_LOGIN_KEY);
    setIsLoggedIn(false);
    setShowDropdown(false);
    setActiveSection('overview');
  };

  const removeByMatcher = (items, matcher) => items.filter((item, idx) => !matcher(item, idx));

  const deleteUser = async (target, index) => {
    const id = target?.id ?? users[index]?.id;
    if (id === undefined || id === null) return;
    try {
      await userAPI.delete(id);
      await loadAdminData();
    } catch (err) {
      console.error('Failed to delete user', err);
    }
  };

  const reviewUserVerification = async (target, index, status) => {
    const id = target?.id ?? users[index]?.id;
    if (id === undefined || id === null) return;
    try {
      await userAPI.reviewVerification(id, status);
      await loadAdminData();
    } catch (err) {
      console.error(`Failed to ${status} verification`, err);
    }
  };

  const deleteListing = async (target, index) => {
    const id = target?.id ?? listings[index]?.id;
    if (id === undefined || id === null) return;
    try {
      await listingsAPI.delete(id);
      await loadAdminData();
    } catch (err) {
      console.error('Failed to delete listing', err);
    }
  };

  const deleteReview = async (target, index) => {
    const id = target?.id ?? reviews[index]?.id;
    if (id === undefined || id === null) return;
    try {
      await reviewsAPI.delete(id);
      await loadAdminData();
    } catch (err) {
      console.error('Failed to delete review', err);
    }
  };

  const deleteNotification = (target, index) => {
    const next = removeByMatcher(notifications, (item, idx) => {
      if (target?.id !== undefined && item?.id !== undefined) {
        return String(item.id) === String(target.id);
      }
      return idx === index;
    });
    setNotifications(next);
  };

  const clearNotifications = () => {
    if (!window.confirm('Clear all notifications?')) return;
    setNotifications([]);
  };

  const dismissReport = async (target, index) => {
    const id = target?.id ?? reports[index]?.id;
    if (id === undefined || id === null) return;
    try {
      await reportsAPI.delete(id);
      await loadAdminData();
    } catch (err) {
      console.error('Failed to dismiss report', err);
    }
  };

  const resolveReport = async (target, index) => {
    const id = target?.id ?? reports[index]?.id;
    if (id === undefined || id === null) return;
    try {
      await reportsAPI.updateStatus(id, 'resolved');
      await loadAdminData();
    } catch (err) {
      console.error('Failed to resolve report', err);
    }
  };

  const clearAllReports = () => {
    if (!window.confirm('This will remove all reports. Continue?')) return;
    Promise.all(reports.map((r) => reportsAPI.delete(r.id)))
      .then(() => loadAdminData())
      .catch((err) => console.error('Failed to clear reports', err));
  };

  const clearAllBookings = () => {
    if (!window.confirm('This will remove all bookings. Continue?')) return;
    Promise.all(bookings.map((b) => bookingsAPI.delete(b.id)))
      .then(() => loadAdminData())
      .catch((err) => console.error('Failed to clear bookings', err));
  };

  const deleteBookmark = async (target, index) => {
    const bookmark = target || bookmarks[index];
    if (!bookmark) return;
    try {
      if (bookmark.id !== undefined && bookmark.id !== null) {
        await bookmarksAPI.deleteById(bookmark.id);
      } else if (bookmark.tenantId !== undefined && bookmark.listingId !== undefined) {
        await bookmarksAPI.delete(bookmark.tenantId, bookmark.listingId);
      }
      await loadAdminData();
    } catch (err) {
      console.error('Failed to delete bookmark', err);
    }
  };

  const clearAllBookmarks = () => {
    if (!window.confirm('This will remove all bookmarks. Continue?')) return;
    Promise.all(bookmarks.map((bm) => bookmarksAPI.deleteById(bm.id)))
      .then(() => loadAdminData())
      .catch((err) => console.error('Failed to clear bookmarks', err));
  };

  const clearAllListings = () => {
    if (!window.confirm('This will remove all listings. Continue?')) return;
    Promise.all(listings.map((l) => listingsAPI.delete(l.id)))
      .then(() => loadAdminData())
      .catch((err) => console.error('Failed to clear listings', err));
  };

  const resolveSupport = async (target, index) => {
    const id = target?.id ?? supportMessages[index]?.id;
    if (id === undefined || id === null) return;
    try {
      await supportMessagesAPI.updateStatus(id, 'resolved');
      await loadAdminData();
    } catch (err) {
      console.error('Failed to resolve support message', err);
    }
  };

  const dismissSupport = async (target, index) => {
    const id = target?.id ?? supportMessages[index]?.id;
    if (id === undefined || id === null) return;
    try {
      await supportMessagesAPI.delete(id);
      await loadAdminData();
    } catch (err) {
      console.error('Failed to delete support message', err);
    }
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

          <form onSubmit={handleLogin} className="admin-login-form">
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

            <button type="submit" className="admin-login-btn">Login</button>
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
                      <th>School</th>
                      <th>Verification</th>
                      <th>Created At</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.length === 0 ? (
                      <tr><td colSpan={7} className="admin-empty">No users found.</td></tr>
                    ) : filteredUsers.map((u, idx) => {
                      const role = getRole(u);
                      const verificationStatus = String(u.verificationStatus || 'none').toLowerCase();
                      const isVerified = Boolean(u.isVerified);
                      return (
                        <tr key={u.id || u.email || `user-${idx}`}>
                          <td>
                            {u.firstName ? `${u.firstName} ${u.lastName || ''}`.trim() : (u.name || 'N/A')}
                            {isVerified ? <span title="Verified" style={{ marginLeft: '6px', color: '#16a34a' }}>✔</span> : null}
                          </td>
                          <td>{u.email || 'N/A'}</td>
                          <td>
                            <span className={`admin-badge ${role === 'landlord' ? 'role-landlord' : 'role-tenant'}`}>
                              {role}
                            </span>
                          </td>
                          <td>{role === 'tenant' ? (u.school || u.university || 'N/A') : 'N/A'}</td>
                          <td>
                            {role === 'landlord' ? (
                              <span className={`admin-badge ${verificationStatus === 'approved' ? 'is-good' : verificationStatus === 'pending' ? 'is-pending' : 'is-bad'}`}>
                                {verificationStatus}
                              </span>
                            ) : 'N/A'}
                          </td>
                          <td>{toDisplayDate(u.createdAt)}</td>
                          <td>
                            <button className="admin-icon-btn danger" onClick={() => deleteUser(u, idx)}>
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

          {activeSection === 'support' ? (
            <section>
              <h2 className="admin-section-title">Support Messages</h2>
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Subject</th>
                      <th>Message</th>
                      <th>Status</th>
                      <th>Created At</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {supportMessages.length === 0 ? (
                      <tr><td colSpan={7} className="admin-empty">No support messages found.</td></tr>
                    ) : supportMessages.map((s, idx) => {
                      const status = String(s.status || 'pending').toLowerCase();
                      return (
                        <tr key={s.id || `support-${idx}`}>
                          <td>{toDisplayValue(s.name)}</td>
                          <td>{toDisplayValue(s.email)}</td>
                          <td>{toDisplayValue(s.subject)}</td>
                          <td>{truncate(s.message, 100)}</td>
                          <td>
                            <span className={`admin-badge ${getStatusClass(status)}`}>{status}</span>
                          </td>
                          <td>{toDisplayDate(s.createdAt)}</td>
                          <td>
                            {status === 'pending' ? (
                              <button className="admin-icon-btn success" onClick={() => resolveSupport(s, idx)}>
                                <CheckCircle2 size={15} /> Resolve
                              </button>
                            ) : null}
                            <button className="admin-icon-btn danger" onClick={() => dismissSupport(s, idx)}>
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
                    <h4>{toDisplayValue(l.title, 'Untitled Listing')}</h4>
                    <p><strong>Address:</strong> {toDisplayValue(l.address)}</p>
                    <p><strong>Price:</strong> {l.price ? `PHP ${l.price}` : 'N/A'}</p>
                    <p><strong>Landlord Name:</strong> {toDisplayValue(l.landlordName || l.landlord)}</p>
                    <p><strong>University:</strong> {toDisplayValue(l.university || l.school)}</p>
                    <p><strong>Gender Policy:</strong> {toDisplayValue(l.genderPolicy)}</p>
                    <p>
                      <strong>Status:</strong>{' '}
                      <span className={`admin-badge ${getStatusClass(l.status || 'active')}`}>
                        {l.status || 'active'}
                      </span>
                    </p>
                    <button className="admin-icon-btn danger" onClick={() => deleteListing(l, idx)}>
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
                        <td>{toDisplayValue(b.tenantName || b.tenant)}</td>
                        <td>{toDisplayValue(b.listingTitle || b.listing?.title || b.listing)}</td>
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

          {activeSection === 'verifications' ? (
            <section>
              <div className="admin-section-head">
                <h2 className="admin-section-title">Landlord Verification Requests</h2>
              </div>

              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Landlord Name</th>
                      <th>Email</th>
                      <th>Business Name</th>
                      <th>Permit Number</th>
                      <th>Status</th>
                      <th>Requested At</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {verificationRequests.length === 0 ? (
                      <tr><td colSpan={7} className="admin-empty">No verification requests yet.</td></tr>
                    ) : verificationRequests.map((u, idx) => {
                      const status = String(u.verificationStatus || 'pending').toLowerCase();
                      const isApproved = status === 'approved' || Boolean(u.isVerified);
                      return (
                      <tr key={u.id || `verify-${idx}`}>
                        <td>
                          {toDisplayValue(u.firstName ? `${u.firstName} ${u.lastName || ''}`.trim() : u.name)}
                          {isApproved ? <span title="Verified" style={{ marginLeft: '6px', color: '#16a34a' }}>✔</span> : null}
                        </td>
                        <td>{toDisplayValue(u.email)}</td>
                        <td>{toDisplayValue(u.businessName)}</td>
                        <td>{toDisplayValue(u.businessPermit)}</td>
                        <td>
                          <span className={`admin-badge ${status === 'approved' ? 'is-good' : status === 'pending' ? 'is-pending' : 'is-bad'}`}>{status}</span>
                        </td>
                        <td>{toDisplayDate(u.updatedAt || u.createdAt)}</td>
                        <td>
                          {status === 'pending' ? (
                            <>
                              <button className="admin-icon-btn success" onClick={() => reviewUserVerification(u, idx, 'approved')}>
                                <CheckCircle2 size={15} /> Approve
                              </button>
                              <button className="admin-icon-btn" style={{ marginLeft: 8 }} onClick={() => reviewUserVerification(u, idx, 'rejected')}>
                                <XCircle size={15} /> Reject
                              </button>
                            </>
                          ) : (
                            <span style={{ color: '#6b7280' }}>Reviewed</span>
                          )}
                        </td>
                      </tr>
                    );})}
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
                          <button className="admin-icon-btn success" onClick={() => resolveReport(r, idx)}>
                            <CheckCircle2 size={15} /> Resolve
                          </button>
                        ) : null}
                        <button className="admin-icon-btn danger" onClick={() => dismissReport(r, idx)}>
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
                          <td>{toDisplayValue(rv.author || rv.name || rv.tenant)}</td>
                          <td>{toDisplayValue(rv.dorm || rv.listingTitle || rv.property || rv.listing)}</td>
                          <td>{'★'.repeat(Math.max(0, Math.min(5, rating)))}{'☆'.repeat(5 - Math.max(0, Math.min(5, rating)))}</td>
                          <td>{toDisplayValue(rv.tags)}</td>
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
                  <p><strong>Email:</strong> admin</p>
                  <p><strong>Role:</strong> Administrator</p>
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
    </div>
  );
}
