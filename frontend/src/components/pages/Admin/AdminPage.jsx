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
} from 'lucide-react';

const ADMIN_LOGIN_KEY = 'dormscout_admin_logged_in';
const ADMIN_DARKMODE_KEY = 'admin_darkMode';

const STORAGE_KEYS = {
  users: 'dormScoutUsers',
  listings: 'dormscout_listings',
  bookings: 'dormscout_bookings',
  reports: 'dormscout_reports',
  reviews: 'dormscout_reviews',
  notifications: 'dormscout_notifications',
};

const SIDEBAR_ITEMS = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'users', label: 'Users', icon: Users },
  { id: 'listings', label: 'Listings', icon: ClipboardList },
  { id: 'bookings', label: 'Bookings', icon: CalendarDays },
  { id: 'reports', label: 'Reports', icon: FileWarning },
  { id: 'reviews', label: 'Reviews', icon: Star },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'settings', label: 'Settings', icon: SettingsIcon },
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
  const [reports, setReports] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [notifications, setNotifications] = useState([]);

  const [userQuery, setUserQuery] = useState('');
  const [listingQuery, setListingQuery] = useState('');
  const [listingUniversity, setListingUniversity] = useState('all');
  const [bookingQuery, setBookingQuery] = useState('');
  const [reportFilter, setReportFilter] = useState('all');

  const loadData = () => {
    setUsers(safeParse(localStorage.getItem(STORAGE_KEYS.users), []));
    setListings(safeParse(localStorage.getItem(STORAGE_KEYS.listings), []));
    setBookings(safeParse(localStorage.getItem(STORAGE_KEYS.bookings), []));
    setReports(safeParse(localStorage.getItem(STORAGE_KEYS.reports), []));
    setReviews(safeParse(localStorage.getItem(STORAGE_KEYS.reviews), []));
    setNotifications(safeParse(localStorage.getItem(STORAGE_KEYS.notifications), []));
  };

  useEffect(() => {
    if (!isLoggedIn) return;
    loadData();
  }, [isLoggedIn, activeSection]);

  useEffect(() => {
    const onStorage = () => {
      if (isLoggedIn) loadData();
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
      totalReports: reports.length,
      pendingReports,
      activeListings,
    };
  }, [users, listings, bookings, reports]);

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
      const name = String(u.name || '').toLowerCase();
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

  const updateStorage = (key, nextValue) => {
    localStorage.setItem(key, JSON.stringify(nextValue));
    loadData();
  };

  const removeByMatcher = (items, matcher) => items.filter((item, idx) => !matcher(item, idx));

  const deleteUser = (target, index) => {
    const next = removeByMatcher(users, (item, idx) => {
      if (target?.id !== undefined && item?.id !== undefined) {
        return String(item.id) === String(target.id);
      }
      return idx === index;
    });
    updateStorage(STORAGE_KEYS.users, next);
  };

  const deleteListing = (target, index) => {
    const next = removeByMatcher(listings, (item, idx) => {
      if (target?.id !== undefined && item?.id !== undefined) {
        return String(item.id) === String(target.id);
      }
      return idx === index;
    });
    updateStorage(STORAGE_KEYS.listings, next);
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
    if (!window.confirm('Clear all notifications?')) return;
    updateStorage(STORAGE_KEYS.notifications, []);
  };

  const dismissReport = (target, index) => {
    const next = removeByMatcher(reports, (item, idx) => {
      if (target?.id !== undefined && item?.id !== undefined) {
        return String(item.id) === String(target.id);
      }
      return idx === index;
    });
    updateStorage(STORAGE_KEYS.reports, next);
  };

  const resolveReport = (target, index) => {
    const next = reports.map((r, idx) => {
      const isTarget =
        target?.id !== undefined && r?.id !== undefined
          ? String(r.id) === String(target.id)
          : idx === index;
      if (!isTarget) return r;
      return {
        ...r,
        status: 'resolved',
        resolvedAt: new Date().toISOString(),
      };
    });
    updateStorage(STORAGE_KEYS.reports, next);
  };

  const clearAllReports = () => {
    if (!window.confirm('This will remove all reports. Continue?')) return;
    updateStorage(STORAGE_KEYS.reports, []);
  };

  const clearAllBookings = () => {
    if (!window.confirm('This will remove all bookings. Continue?')) return;
    updateStorage(STORAGE_KEYS.bookings, []);
  };

  const clearAllListings = () => {
    if (!window.confirm('This will remove all listings. Continue?')) return;
    updateStorage(STORAGE_KEYS.listings, []);
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
                      <th>Created At</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.length === 0 ? (
                      <tr><td colSpan={6} className="admin-empty">No users found.</td></tr>
                    ) : filteredUsers.map((u, idx) => {
                      const role = getRole(u);
                      return (
                        <tr key={u.id || u.email || `user-${idx}`}>
                          <td>{u.name || 'N/A'}</td>
                          <td>{u.email || 'N/A'}</td>
                          <td>
                            <span className={`admin-badge ${role === 'landlord' ? 'role-landlord' : 'role-tenant'}`}>
                              {role}
                            </span>
                          </td>
                          <td>{role === 'tenant' ? (u.school || u.university || 'N/A') : 'N/A'}</td>
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
