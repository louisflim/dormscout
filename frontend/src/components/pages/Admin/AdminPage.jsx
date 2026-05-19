import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { activitiesAPI, messagesAPI, reportsAPI } from '../../../utils/api';
import {
  buildConversationId,
  isBroadcastMessage,
  isSupportMessage,
  notifyReporterAboutReport,
  parseSupportContent,
  readLocalSupportSubmissions,
  mergeSupportInboxLists,
} from '../../../utils/adminMessaging';
import {
  adminFetch,
  clearAdminSession,
  readAdminSession,
  saveAdminSession,
} from '../../../utils/adminAuth';
import { countUnreadActivities } from '../../../utils/activities';
import AdminMessaging from './AdminMessaging';
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
  X,
  Filter,
  MessageSquare,
} from 'lucide-react';

const ADMIN_DARKMODE_KEY = 'admin_darkMode';

const parseApiData = (json, fallback = []) => {
  if (Array.isArray(json)) return json;
  if (json && Array.isArray(json.data)) return json.data;
  return fallback;
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

const ADMIN_SECTION_IDS = SIDEBAR_ITEMS.map((item) => item.id);

const getActiveSectionFromPath = (pathname) => {
  const segment = pathname.replace(/^\/admin\/?/, '').split('/')[0] || 'overview';
  if (segment === 'support') return 'messages';
  return ADMIN_SECTION_IDS.includes(segment) ? segment : 'overview';
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

const toFullName = (person) => {
  if (!person) return 'N/A';
  if (person.name) return person.name;
  const joined = `${person.firstName || ''} ${person.lastName || ''}`.trim();
  return joined || person.email || 'N/A';
};

const formatPesoPrice = (value) => {
  if (value == null || value === '') return 'N/A';
  const amount = Number(value);
  if (!Number.isFinite(amount)) return 'N/A';
  return `\u20B1${amount.toLocaleString()}`;
};

const formatStarRating = (rating) => {
  const stars = Math.max(0, Math.min(5, Math.round(Number(rating) || 0)));
  return '\u2605'.repeat(stars) + '\u2606'.repeat(5 - stars);
};

const displayOrDash = (value) => {
  const text = String(value ?? '').trim();
  return text || '—';
};

/** Admin inbox: activities are written in second person for the recipient — relabel for the admin table. */
const formatNotificationMessageForAdmin = (message, recipientName) => {
  const text = String(message || '').trim();
  const name = String(recipientName || '').trim();
  if (!text) return 'N/A';
  if (!name) return text;
  return text
    .replace(/^You created\b/i, `${name} created`)
    .replace(/^You were\b/i, `${name} was`)
    .replace(/^You have\b/i, `${name} has`)
    .replace(/^You\b/i, name)
    .replace(/\bYour\b/g, `${name}'s`);
};

const recipientLabel = (notification, usersList) => {
  const uid = notification?.recipientId ?? notification?.userId;
  const fromUsers = usersList?.find((u) => String(u.id) === String(uid));
  const name = notification?.recipientName || toFullName(fromUsers);
  const role = notification?.recipientRole || getRole(fromUsers);
  if (!name || name === 'N/A') return 'Unknown user';
  return role ? `${name} (${role})` : name;
};

const renderLandlordBusinessCell = (u, field, businessUpdatePending, verificationPending) => {
  const isLandlord = getRole(u) === 'landlord';
  if (!isLandlord) return '—';

  const current = field === 'name' ? u.businessName : u.businessPermit;
  const pending = field === 'name' ? u.pendingBusinessName : u.pendingBusinessPermit;

  if (businessUpdatePending) {
    return (
      <div className="admin-business-compare">
        <div className="admin-business-requested">
          <span className="admin-business-label">Requested</span>
          {displayOrDash(pending)}
        </div>
        <div className="admin-business-current">
          <span className="admin-business-label">Current</span>
          {displayOrDash(current)}
        </div>
      </div>
    );
  }

  if (verificationPending) {
    return displayOrDash(current);
  }

  return displayOrDash(current);
};

export default function AdminPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [adminUser, setAdminUser] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  const [darkMode, setDarkMode] = useState(() => localStorage.getItem(ADMIN_DARKMODE_KEY) === 'true');
  const [showDropdown, setShowDropdown] = useState(false);

  const activeSection = useMemo(
    () => getActiveSectionFromPath(location.pathname),
    [location.pathname]
  );

  const [users, setUsers] = useState([]);
  const [listings, setListings] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [bookmarks, setBookmarks] = useState([]);
  const [reports, setReports] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [directConversations, setDirectConversations] = useState([]);
  const [selectedMessageId, setSelectedMessageId] = useState(null);
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

  // Rejection modal state (verification or business update)
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [rejectionMode, setRejectionMode] = useState('verification');
  const [selectedLandlord, setSelectedLandlord] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejectionModalError, setRejectionModalError] = useState('');
  const [evidencePreview, setEvidencePreview] = useState(null);

  // Admin delete modal (listing or booking — reason required)
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteReason, setDeleteReason] = useState('');
  const [deleteModalError, setDeleteModalError] = useState('');

  const pendingOpenMessageUserRef = useRef(null);
  const selectedMessageIdRef = useRef(null);

  const applyOpenMessageUser = useCallback((userRecord) => {
    const numericId = userRecord?.id != null ? Number(userRecord.id) : NaN;
    if (!Number.isFinite(numericId)) return;

    const displayName =
      userRecord?.name ||
      (userRecord?.firstName && userRecord?.lastName
        ? `${userRecord.firstName} ${userRecord.lastName}`
        : userRecord?.firstName || userRecord?.lastName || 'User');

    const adminId = adminUser?.id;
    const convId = adminId ? buildConversationId(adminId, numericId) : `direct-user-${numericId}`;
    let selectedId = convId;

    setDirectConversations((prev) => {
      const existing = prev.find(
        (c) => Number(c.otherUserId ?? c.userId) === numericId
      );
      if (existing) {
        selectedId = existing.id;
        return prev;
      }

      const directTarget = {
        id: convId,
        conversationId: convId,
        otherUserId: numericId,
        userId: numericId,
        name: displayName,
        email: userRecord?.email || '',
        subject: 'Direct message from admin',
        message: 'Start a conversation',
        lastMessage: 'Start a conversation',
        forRole: getRole(userRecord),
        replied: false,
        createdAt: new Date().toISOString(),
        isDirectUser: true,
      };

      if (prev.some((c) => Number(c.otherUserId ?? c.userId) === numericId)) return prev;
      return [directTarget, ...prev];
    });

    selectedMessageIdRef.current = selectedId;
    setSelectedMessageId(selectedId);
  }, [adminUser]);

  const loadAdminDerivedData = useCallback(async (usersData, adminAccount) => {
    // Load bookmarks from all tenants
    const tenants = (usersData || users).filter(u => getRole(u) === 'tenant');
    try {
      const bmResults = await Promise.all(
        tenants.map(t =>
          fetch(`http://localhost:8080/api/bookmarks/tenant/${t.id}`)
            .then(r => r.ok ? r.json() : [])
            .then(j => parseApiData(j, []))
            .catch(() => [])
        )
      );
      setBookmarks(bmResults.flat());
    } catch { setBookmarks([]); }

    // Load activities as notifications (all users)
    try {
      const allUsers = usersData || users;
      const actResults = await Promise.all(
        allUsers.map((u) =>
          fetch(`http://localhost:8080/api/activities/user/${u.id}`)
            .then((r) => (r.ok ? r.json() : []))
            .then((j) =>
              parseApiData(j, []).map((item) => ({
                ...item,
                recipientId: item?.userId ?? u.id,
                recipientName: toFullName(u),
                recipientRole: getRole(u),
              }))
            )
            .catch(() => [])
        )
      );
      setNotifications(
        actResults
          .flat()
          .map((item) => ({
            ...item,
            title: item?.title || item?.type || 'Notification',
            message: item?.message || item?.text || '',
            read: Boolean(item?.read ?? item?.isRead),
          }))
          .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
      );
    } catch { setNotifications([]); }

    // Load admin message conversations (direct + support, excluding broadcasts)
    const adminId = adminAccount?.id || adminUser?.id;
    if (adminId) {
      try {
        const convData = await messagesAPI.getConversations(adminId);
        const convList = parseApiData(convData, []).map((conv) => {
          const partnerId = Number(conv?.partnerId);
          const partnerUser = (usersData || users).find((u) => Number(u.id) === partnerId);
          const partnerName = conv?.partnerName || partnerUser?.name || `${partnerUser?.firstName || ''} ${partnerUser?.lastName || ''}`.trim() || 'User';
          const partnerEmail = partnerUser?.email || conv?.partnerEmail || '';
          const lastMessage = String(conv?.lastMessage || '');
          const { subject: extractedSubject } = parseSupportContent(lastMessage);

          return {
            id: conv?.conversationId || `conv_${adminId}_${partnerId}`,
            conversationId: conv?.conversationId,
            otherUserId: partnerId,
            name: partnerName,
            email: partnerEmail,
            subject: extractedSubject,
            message: lastMessage,
            lastMessage,
            unreadCount: Number(conv?.unreadCount) || 0,
            replied: false,
            createdAt: conv?.lastMessageTime ? new Date(conv.lastMessageTime).toISOString() : new Date().toISOString(),
          };
        });
        const nonBroadcast = convList.filter((item) => {
          const preview = item.message || item.lastMessage || '';
          return !isBroadcastMessage(preview);
        });
        const supportFromApi = nonBroadcast.filter((item) =>
          isSupportMessage(item.message || item.lastMessage || '')
        );
        const localSupport = readLocalSupportSubmissions();
        const localSupportOnly = mergeSupportInboxLists(supportFromApi, localSupport);

        setDirectConversations((prev) => {
          const placeholders = (prev || []).filter((c) => c.isDirectUser);
          const byPartner = new Map();
          nonBroadcast.forEach((conv) => {
            const partnerId = Number(conv.otherUserId ?? conv.userId);
            if (Number.isFinite(partnerId)) byPartner.set(partnerId, conv);
          });
          localSupportOnly.forEach((conv) => {
            const partnerId = Number(conv.otherUserId ?? conv.userId);
            if (!Number.isFinite(partnerId)) return;
            if (!byPartner.has(partnerId)) byPartner.set(partnerId, conv);
          });
          placeholders.forEach((conv) => {
            const partnerId = Number(conv.otherUserId ?? conv.userId);
            if (!Number.isFinite(partnerId)) return;
            if (!byPartner.has(partnerId)) byPartner.set(partnerId, conv);
          });
          return Array.from(byPartner.values());
        });

        const pendingMessageUser = pendingOpenMessageUserRef.current;
        if (pendingMessageUser) {
          applyOpenMessageUser(pendingMessageUser);
          pendingOpenMessageUserRef.current = null;
        } else if (
          nonBroadcast.length > 0 &&
          !selectedMessageIdRef.current &&
          !pendingOpenMessageUserRef.current
        ) {
          selectedMessageIdRef.current = nonBroadcast[0].id;
          setSelectedMessageId(nonBroadcast[0].id);
        }
      } catch {
        setDirectConversations([]);
      }
    }
  }, [users, adminUser, applyOpenMessageUser]);

  const loadAdminData = useCallback(async () => {
    setDataLoading(true);
    try {
      const [usersRes, listingsRes, bookingsRes, reportsRes, reviewsRes] =
        await Promise.all([
          adminFetch('http://localhost:8080/api/users/admin/users').then((r) => r.json()),
          fetch('http://localhost:8080/api/listings').then(r => r.json()),
          fetch('http://localhost:8080/api/bookings').then(r => r.json()),
          fetch('http://localhost:8080/api/reports').then(r => r.json()),
          fetch('http://localhost:8080/api/reviews').then(r => r.json()),
        ]);

      const usersData = Array.isArray(usersRes?.data) ? usersRes.data : parseApiData(usersRes, []);
      setUsers(usersData);
      setListings(Array.isArray(listingsRes) ? listingsRes : []);
      setBookings(Array.isArray(bookingsRes) ? bookingsRes : []);
      setReports(Array.isArray(reportsRes) ? reportsRes : []);
      setReviews(Array.isArray(reviewsRes) ? reviewsRes : []);
      await loadAdminDerivedData(usersData, null);
    } catch (err) {
      console.error('Failed to load admin data:', err);
      if (String(err?.message || '').includes('session')) {
        clearAdminSession();
        setIsLoggedIn(false);
        setAdminUser(null);
        setInlineNotice('Session expired. Please sign in again.');
        setInlineNoticeTone('is-bad');
      }
    } finally {
      setDataLoading(false);
    }
  }, [loadAdminDerivedData]);

  const reloadReports = useCallback(async () => {
    try {
      const list = await reportsAPI.getAll();
      setReports(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error('Failed to reload reports:', err);
    }
  }, []);

  useEffect(() => {
    const session = readAdminSession();
    if (session?.user && session?.token) {
      setAdminUser(session.user);
      setIsLoggedIn(true);
    }
  }, []);

  useEffect(() => {
    if (isLoggedIn) loadAdminData();
  }, [isLoggedIn, loadAdminData]);

  useEffect(() => {
    if (!isLoggedIn) return;
    if (location.pathname === '/admin' || location.pathname === '/admin/') {
      navigate('/admin/overview', { replace: true });
      return;
    }
    const segment = location.pathname.replace(/^\/admin\/?/, '').split('/')[0] || '';
    if (segment === 'support') {
      navigate('/admin/messages', { replace: true });
      return;
    }
    if (segment && !ADMIN_SECTION_IDS.includes(segment)) {
      navigate('/admin/overview', { replace: true });
    }
  }, [isLoggedIn, location.pathname, navigate]);

  useEffect(() => {
    const target = location.state?.openMessageUser;
    if (!target?.id || activeSection !== 'messages') return;
    pendingOpenMessageUserRef.current = target;
    applyOpenMessageUser(target);
    pendingOpenMessageUserRef.current = null;
    navigate(location.pathname, { replace: true, state: null });
  }, [activeSection, location.state, location.pathname, navigate, applyOpenMessageUser]);

  useEffect(() => {
    if (isLoggedIn && activeSection === 'reports') reloadReports();
  }, [isLoggedIn, activeSection, reloadReports]);

  useEffect(() => {
    if (!isLoggedIn) return undefined;
    const refresh = () => loadAdminDerivedData(users, adminUser);
    refresh();
    const interval = setInterval(refresh, 10000);
    window.addEventListener('dormscout:notificationsUpdated', refresh);
    window.addEventListener('dormscout:messagesUpdated', refresh);
    return () => {
      clearInterval(interval);
      window.removeEventListener('dormscout:notificationsUpdated', refresh);
      window.removeEventListener('dormscout:messagesUpdated', refresh);
    };
  }, [isLoggedIn, users, adminUser, loadAdminDerivedData]);

  useEffect(() => {
    if (!isLoggedIn || activeSection !== 'notifications') return undefined;

    const unread = notifications.filter((n) => n?.id && !(n.read ?? n.isRead));
    if (unread.length === 0) return undefined;

    let cancelled = false;
    (async () => {
      await Promise.all(
        unread.map((n) => activitiesAPI.markAsRead(n.id).catch(() => null))
      );
      if (cancelled) return;
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      window.dispatchEvent(new Event('dormscout:notificationsUpdated'));
    })();

    return () => {
      cancelled = true;
    };
  }, [isLoggedIn, activeSection, notifications]);

  useEffect(() => {
    localStorage.setItem(ADMIN_DARKMODE_KEY, darkMode ? 'true' : 'false');
  }, [darkMode]);

  useEffect(() => {
    if (!evidencePreview) return undefined;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setEvidencePreview(null);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [evidencePreview]);

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
      const tenantName = b.tenantName || toFullName(b.tenant);
      const listingTitle = b.listingTitle || b.listing?.title;
      const fields = [
        tenantName,
        listingTitle,
        b.status,
        b.moveInDate || b.checkInDate,
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

      if (data.success && data.user && data.token) {
        saveAdminSession(data.user, data.token, data.expiresIn);
        setAdminUser(data.user);
        setIsLoggedIn(true);
        const segment = location.pathname.replace(/^\/admin\/?/, '').split('/')[0] || '';
        if (location.pathname === '/admin' || location.pathname === '/admin/' || !ADMIN_SECTION_IDS.includes(segment)) {
          navigate('/admin/overview', { replace: true });
        }
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
    clearAdminSession();
    setIsLoggedIn(false);
    setAdminUser(null);
    setShowDropdown(false);
    navigate('/admin/overview', { replace: true });
  };

  const showInlineNotice = (message, tone = 'is-good') => {
    setInlineNotice(message);
    setInlineNoticeTone(tone);
  };

const handleDeleteUser = async (userId) => {
    const targetUser = users.find((u) => Number(u.id) === Number(userId));
    if (String(targetUser?.userType || '').toLowerCase() === 'admin') {
      showInlineNotice('Admin accounts cannot be deleted from this panel.', 'is-bad');
      return;
    }
    try {
      const response = await adminFetch(`http://localhost:8080/api/users/admin/users/${userId}`, {
        method: 'DELETE',
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

  const openDeleteModal = (type, item) => {
    setDeleteTarget({ type, item });
    setDeleteReason('');
    setDeleteModalError('');
    setShowDeleteModal(true);
  };

  const handleSubmitAdminDelete = async () => {
    const reason = deleteReason.trim();
    if (!reason) {
      setDeleteModalError('A reason is required before this can be deleted.');
      return;
    }
    if (!deleteTarget?.item?.id) return;

    setDeleteModalError('');
    const { type, item } = deleteTarget;
    const url = type === 'booking'
      ? `http://localhost:8080/api/users/admin/bookings/${item.id}/delete`
      : `http://localhost:8080/api/users/admin/listings/${item.id}/delete`;

    try {
      const response = await adminFetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });
      const data = await response.json();
      if (!response.ok || data.success === false) {
        setDeleteModalError(data.message || 'Failed to delete. Please try again.');
        return;
      }

      if (type === 'booking') {
        setBookings((prev) => prev.filter((b) => String(b.id) !== String(item.id)));
        showInlineNotice('Booking deleted and tenant notified.', 'is-good');
      } else {
        setListings((prev) => prev.filter((l) => String(l.id) !== String(item.id)));
        setBookings((prev) => prev.filter((b) => String(b.listingId || b.listing?.id) !== String(item.id)));
        setBookmarks((prev) => prev.filter((bm) => String(bm.listingId) !== String(item.id)));
        showInlineNotice('Listing deleted. Landlord and affected tenants were notified.', 'is-good');
      }

      setShowDeleteModal(false);
      setDeleteTarget(null);
      setDeleteReason('');
      window.dispatchEvent(new Event('dormscout:notificationsUpdated'));
      window.dispatchEvent(new Event('dormscout:listingUpdated'));
    } catch (err) {
      console.error('Failed to delete:', err);
      setDeleteModalError('Failed to delete. Please try again.');
    }
  };

  const handleApproveLandlord = async (userId) => {
    try {
      const response = await adminFetch(`http://localhost:8080/api/users/admin/verify-landlord/${userId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await response.json();
      if (data.success) {
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, verified: true, verificationStatus: 'approved' } : u));
        window.dispatchEvent(new Event('dormscout:verificationUpdated'));
        window.dispatchEvent(new Event('dormscout:notificationsUpdated'));
        showInlineNotice('Landlord verification approved.', 'is-good');
      }
    } catch (err) {
      console.error('Failed to approve landlord:', err);
      showInlineNotice('Failed to approve landlord.', 'is-bad');
    }
  };

  const handleRejectLandlord = (landlord) => {
    setRejectionMode('verification');
    setSelectedLandlord(landlord);
    setRejectionReason('');
    setRejectionModalError('');
    setShowRejectionModal(true);
  };

  const handleRejectBusinessUpdate = (landlord) => {
    setRejectionMode('businessUpdate');
    setSelectedLandlord(landlord);
    setRejectionReason('');
    setRejectionModalError('');
    setShowRejectionModal(true);
  };

  const handleApproveBusinessUpdate = async (userId) => {
    try {
      const response = await adminFetch(
        `http://localhost:8080/api/users/admin/business-update/${userId}/approve`,
        { method: 'POST' }
      );
      const data = await response.json();
      if (data.success) {
        const updated = data.data || {};
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, ...updated, businessUpdateStatus: null } : u))
        );
        window.dispatchEvent(new Event('dormscout:profileUpdated'));
        window.dispatchEvent(new Event('dormscout:notificationsUpdated'));
        showInlineNotice('Business update approved.', 'is-good');
      } else {
        showInlineNotice(data.message || 'Failed to approve business update.', 'is-bad');
      }
    } catch (err) {
      console.error('Failed to approve business update:', err);
      showInlineNotice('Failed to approve business update.', 'is-bad');
    }
  };

  const handleSubmitRejection = async () => {
    const reason = rejectionReason.trim();
    if (!reason) {
      setRejectionModalError(
        rejectionMode === 'businessUpdate'
          ? 'An explanation is required before you can reject this business update.'
          : 'An explanation is required before you can reject this verification.'
      );
      return;
    }
    setRejectionModalError('');
    try {
      const isBusinessUpdate = rejectionMode === 'businessUpdate';
      const url = isBusinessUpdate
        ? `http://localhost:8080/api/users/admin/business-update/${selectedLandlord.id}/reject`
        : `http://localhost:8080/api/users/admin/verify-landlord/${selectedLandlord.id}/reject`;

      const response = await adminFetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });
      const data = await response.json();
      if (!response.ok || data.success === false) {
        setRejectionModalError(data.message || 'Failed to submit rejection. Please try again.');
        return;
      }
      if (data.success) {
        const updated = data.data || {};
        setUsers((prev) =>
          prev.map((u) => {
            if (u.id !== selectedLandlord.id) return u;
            if (isBusinessUpdate) {
              return {
                ...u,
                ...updated,
                businessUpdateStatus: 'rejected',
                businessUpdateRejectionReason: reason,
                pendingBusinessName: null,
                pendingBusinessPermit: null,
              };
            }
            return { ...u, verified: false, verificationStatus: 'rejected', rejectionReason };
          })
        );
        setShowRejectionModal(false);
        setSelectedLandlord(null);
        setRejectionReason('');
        window.dispatchEvent(new Event('dormscout:verificationUpdated'));
        window.dispatchEvent(new Event('dormscout:profileUpdated'));
        window.dispatchEvent(new Event('dormscout:notificationsUpdated'));
        showInlineNotice(
          isBusinessUpdate
            ? 'Business update rejected and landlord notified.'
            : 'Landlord verification rejected and reason sent.',
          'is-good'
        );
      }
    } catch (err) {
      console.error('Failed to submit rejection:', err);
      showInlineNotice('Failed to submit rejection.', 'is-bad');
    }
  };

  const deleteReview = async (target) => {
    if (!target?.id) return;
    try {
      await fetch(`http://localhost:8080/api/reviews/${target.id}`, { method: 'DELETE' });
      setReviews(prev => prev.filter(r => String(r.id) !== String(target.id)));
      showInlineNotice('Review deleted.', 'is-good');
    } catch (err) {
      console.error('Failed to delete review:', err);
      showInlineNotice('Failed to delete review.', 'is-bad');
    }
  };

  const deleteNotification = async (target) => {
    if (!target?.id) return;
    try {
      await fetch(`http://localhost:8080/api/activities/${target.id}`, { method: 'DELETE' });
      setNotifications(prev => prev.filter(n => String(n.id) !== String(target.id)));
      showInlineNotice('Notification deleted.', 'is-good');
    } catch (err) {
      console.error('Failed to delete notification:', err);
      showInlineNotice('Failed to delete notification.', 'is-bad');
    }
  };

  const clearNotifications = async () => {
    try {
      await Promise.all(notifications.map(n =>
        fetch(`http://localhost:8080/api/activities/${n.id}`, { method: 'DELETE' }).catch(() => {})
      ));
      setNotifications([]);
      showInlineNotice('Notifications cleared.', 'is-good');
    } catch (err) {
      console.error('Failed to clear notifications:', err);
      showInlineNotice('Failed to clear notifications.', 'is-bad');
    }
  };

  const messageConversations = useMemo(() => {
    const byPartner = new Map();
    const isPlaceholderConv = (conv) =>
      conv?.isDirectUser || String(conv?.id || '').startsWith('direct-user-');

    directConversations.forEach((conv) => {
      const partnerId = Number(conv.otherUserId ?? conv.userId);
      if (!Number.isFinite(partnerId)) {
        byPartner.set(String(conv.id), conv);
        return;
      }
      const current = byPartner.get(partnerId);
      if (!current) {
        byPartner.set(partnerId, conv);
        return;
      }
      const keepCurrent =
        !isPlaceholderConv(current) && isPlaceholderConv(conv);
      const keepIncoming =
        isPlaceholderConv(current) && !isPlaceholderConv(conv);
      if (keepIncoming) {
        byPartner.set(partnerId, conv);
        return;
      }
      if (keepCurrent) return;
      const currentTime = new Date(current.createdAt || current.lastMessageTime || 0).getTime();
      const convTime = new Date(conv.createdAt || conv.lastMessageTime || 0).getTime();
      if (convTime >= currentTime) byPartner.set(partnerId, conv);
    });

    return Array.from(byPartner.values()).sort(
      (a, b) =>
        new Date(b.createdAt || b.lastMessageTime || 0).getTime() -
        new Date(a.createdAt || a.lastMessageTime || 0).getTime()
    );
  }, [directConversations]);

  const adminNotificationUnreadCount = useMemo(
    () => countUnreadActivities(notifications),
    [notifications]
  );

  const adminMessageUnreadCount = useMemo(
    () => messageConversations.reduce((sum, c) => sum + (Number(c.unreadCount) || 0), 0),
    [messageConversations]
  );

  const handleConversationRead = useCallback((convId) => {
    setDirectConversations((prev) =>
      prev.map((c) => {
        const key = c.conversationId || c.id;
        return key === convId ? { ...c, unreadCount: 0 } : c;
      })
    );
  }, []);

  const handleMessageUser = (userRecord) => {
    const numericId = userRecord?.id != null ? Number(userRecord.id) : NaN;
    if (!Number.isFinite(numericId)) return;

    const openMessageUser = {
      id: numericId,
      name: userRecord?.name,
      firstName: userRecord?.firstName,
      lastName: userRecord?.lastName,
      email: userRecord?.email,
      userType: userRecord?.userType,
    };

    pendingOpenMessageUserRef.current = openMessageUser;
    applyOpenMessageUser(userRecord);
    navigate('/admin/messages', { state: { openMessageUser } });
  };

  const handleResolveReport = async (reportId) => {
    const report = reports.find((r) => r.id === reportId);
    try {
      const response = await fetch(`http://localhost:8080/api/reports/${reportId}/status?status=resolved`, {
        method: 'PUT',
      });
      const data = await response.json();
      if (data.success) {
        setReports((prev) => prev.map((r) => (r.id === reportId ? { ...r, status: 'resolved' } : r)));
        if (report && adminUser?.id) {
          await notifyReporterAboutReport({
            adminId: adminUser.id,
            report,
            outcome: 'resolved',
          });
        }
        showInlineNotice('Report resolved and reporter notified.', 'is-good');
      } else {
        showInlineNotice('Failed to resolve report.', 'is-bad');
      }
    } catch (err) {
      console.error('Failed to resolve report:', err);
      showInlineNotice('Failed to resolve report.', 'is-bad');
    }
  };

  const handleDismissReport = async (reportId) => {
    const report = reports.find((r) => r.id === reportId);
    try {
      const response = await fetch(`http://localhost:8080/api/reports/${reportId}/status?status=dismissed`, {
        method: 'PUT',
      });
      const data = await response.json();
      if (data.success) {
        setReports((prev) => prev.map((r) => (r.id === reportId ? { ...r, status: 'dismissed' } : r)));
        if (report && adminUser?.id) {
          await notifyReporterAboutReport({
            adminId: adminUser.id,
            report,
            outcome: 'dismissed',
          });
        }
        showInlineNotice('Report dismissed and reporter notified.', 'is-good');
      } else {
        showInlineNotice('Failed to dismiss report.', 'is-bad');
      }
    } catch (err) {
      console.error('Failed to dismiss report:', err);
      showInlineNotice('Failed to dismiss report.', 'is-bad');
    }
  };

  const clearAllReports = async () => {
    try {
      await Promise.all(reports.map(r =>
        fetch(`http://localhost:8080/api/reports/${r.id}`, { method: 'DELETE' }).catch(() => {})
      ));
      setReports([]);
      showInlineNotice('All reports cleared.', 'is-good');
    } catch (err) {
      console.error('Failed to clear reports:', err);
      showInlineNotice('Failed to clear reports.', 'is-bad');
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
        <div className="admin-nav-brand" onClick={() => navigate('/admin/overview')} role="button" tabIndex={0}>
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
                onClick={() => navigate(`/admin/${item.id}`)}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon size={18} />
                <span className="admin-side-label">{item.label}</span>
                {item.id === 'notifications' && adminNotificationUnreadCount > 0 ? (
                  <span className="admin-side-badge">{adminNotificationUnreadCount}</span>
                ) : null}
                {item.id === 'messages' && adminMessageUnreadCount > 0 ? (
                  <span className="admin-side-badge">
                    {adminMessageUnreadCount > 99 ? '99+' : adminMessageUnreadCount}
                  </span>
                ) : null}
              </button>
            );
          })}
        </aside>

        <main className="admin-main">
          {inlineNotice ? (
            <div className={`admin-inline-notice ${inlineNoticeTone}`} role="status">
              <span className="admin-inline-notice-text">{inlineNotice}</span>
              <button
                type="button"
                className="admin-inline-notice-close"
                onClick={() => setInlineNotice('')}
                aria-label="Dismiss notice"
              >
                <X size={18} />
              </button>
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
                      <th>Business Name</th>
                      <th>Permit #</th>
                      <th>Verification</th>
                      <th>Created At</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.length === 0 ? (
                      <tr><td colSpan={8} className="admin-empty">No users found.</td></tr>
                    ) : filteredUsers.map((u, idx) => {
                      const role = getRole(u);
                      const verStatus = String(u.verificationStatus || 'none').toLowerCase();
                      const isLandlordApproved =
                        u.verified === true || u.isVerified === true || verStatus === 'approved';
                      const isLandlord = role === 'landlord';
                      const businessUpdatePending =
                        String(u.businessUpdateStatus || '').toLowerCase() === 'pending';
                      const verificationPending =
                        isLandlord && verStatus === 'pending' && !isLandlordApproved;
                      return (
                        <tr key={u.id || u.email || `user-${idx}`}>
                          <td>{u.name || (u.firstName && u.lastName ? `${u.firstName} ${u.lastName}` : u.firstName || u.lastName || 'N/A')}</td>
                          <td>{u.email || 'N/A'}</td>
                          <td>
                            <span className={`admin-badge ${role === 'landlord' ? 'role-landlord' : 'role-tenant'}`}>
                              {role}
                            </span>
                          </td>
                          <td className="admin-business-cell">
                            {renderLandlordBusinessCell(u, 'name', businessUpdatePending, verificationPending)}
                          </td>
                          <td className="admin-business-cell">
                            {renderLandlordBusinessCell(u, 'permit', businessUpdatePending, verificationPending)}
                          </td>
                          <td>
                            {isLandlord && verStatus === 'pending' && !isLandlordApproved ? (
                              <span className="admin-badge is-pending">Pending</span>
                            ) : isLandlord && isLandlordApproved && businessUpdatePending ? (
                              <span className="admin-badge is-pending">Update Pending</span>
                            ) : isLandlord && isLandlordApproved ? (
                              <span className="admin-badge is-good">Verified</span>
                            ) : isLandlord && verStatus === 'rejected' ? (
                              <span className="admin-badge is-bad">Rejected</span>
                            ) : (
                              <span className="admin-badge">N/A</span>
                            )}
                          </td>
                          <td>{toDisplayDate(u.createdAt)}</td>
                          <td>
                            {isLandlord && verStatus === 'pending' && !isLandlordApproved ? (
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
                            ) : isLandlord && isLandlordApproved && businessUpdatePending ? (
                              <div className="admin-action-group">
                                <button className="admin-icon-btn success" onClick={() => handleApproveBusinessUpdate(u.id)}>
                                  <CheckCircle2 size={15} /> Approve
                                </button>
                                <button className="admin-icon-btn danger" onClick={() => handleRejectBusinessUpdate(u)}>
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
                    <p><strong>Price:</strong> {formatPesoPrice(l.price)}</p>
                    <p><strong>Landlord Name:</strong> {l.landlordName || l.landlord || 'N/A'}</p>
                    <p><strong>University:</strong> {l.university || l.school || 'N/A'}</p>
                    <p><strong>Gender Policy:</strong> {l.genderPolicy || 'N/A'}</p>
                    <p>
                      <strong>Status:</strong>{' '}
                      <span className={`admin-badge ${getStatusClass(l.status || 'active')}`}>
                        {l.status || 'active'}
                      </span>
                    </p>
                    <button className="admin-icon-btn danger" onClick={() => openDeleteModal('listing', l)}>
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
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBookings.length === 0 ? (
                      <tr><td colSpan={6} className="admin-empty">No bookings found.</td></tr>
                    ) : filteredBookings.map((b) => (
                      <tr key={b.id || `${b.tenantName}-${b.listingTitle}-${b.createdAt}`}>
                        <td>{b.tenantName || toFullName(b.tenant)}</td>
                        <td>{b.listingTitle || b.listing?.title || 'N/A'}</td>
                        <td>{toDisplayDate(b.moveInDate || b.checkInDate)}</td>
                        <td>
                          <span className={`admin-badge ${getStatusClass(b.status)}`}>
                            {b.status || 'pending'}
                          </span>
                        </td>
                        <td>{toDisplayDate(b.bookedOn || b.createdAt)}</td>
                        <td>
                          <button className="admin-icon-btn danger" onClick={() => openDeleteModal('booking', b)}>
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

          {activeSection === 'bookmarks' ? (
            <section>
              <div className="admin-section-head">
                <h2 className="admin-section-title">Bookmarks</h2>
                <p className="admin-section-hint">View only — bookmarks cannot be deleted by admins.</p>
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
                    </tr>
                  </thead>
                  <tbody>
                    {bookmarks.length === 0 ? (
                      <tr><td colSpan={5} className="admin-empty">No bookmarks found.</td></tr>
                    ) : bookmarks.map((bm, idx) => (
                      <tr key={bm.id || `bm-${idx}`}>
                        <td>{bm.tenantId || 'N/A'}</td>
                        <td>{bm.listingTitle || 'N/A'}</td>
                        <td>{bm.listingAddress || 'N/A'}</td>
                        <td>{formatPesoPrice(bm.listingPrice)}</td>
                        <td>{toDisplayDate(bm.savedAt)}</td>
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
                  {['all', 'pending', 'resolved', 'dismissed'].map((tab) => (
                    <button
                      key={tab}
                      className={`admin-tab ${reportFilter === tab ? 'active' : ''}`}
                      onClick={() => setReportFilter(tab)}
                    >
                      {tab[0].toUpperCase() + tab.slice(1)}
                    </button>
                  ))}
                  <button type="button" className="admin-tab" onClick={reloadReports}>
                    Refresh
                  </button>
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
                      <p><strong>Reporter:</strong> {r.reporterName || 'N/A'}</p>
                      <p><strong>Subject:</strong> {r.subject || 'N/A'}</p>
                      <p><strong>Reason:</strong> {r.reason || 'N/A'}</p>
                      <p><strong>Description:</strong> {r.description || 'N/A'}</p>
                      {evidence ? (
                        <div className="admin-evidence-wrap">
                          <button
                            type="button"
                            className="admin-evidence-thumb-btn"
                            onClick={() => setEvidencePreview(evidence)}
                            aria-label="View evidence full size"
                          >
                            <img src={evidence} alt="Evidence" className="admin-evidence-thumb" />
                          </button>
                        </div>
                      ) : null}
                      <p><strong>Submitted At:</strong> {toDisplayDate(r.submittedAt || r.createdAt)}</p>
                      <div className="admin-report-actions">
                        {status === 'pending' ? (
                          <button className="admin-icon-btn success" onClick={() => handleResolveReport(r.id)}>
                            <CheckCircle2 size={15} /> Resolve
                          </button>
                        ) : null}
                        {status === 'pending' ? (
                          <button className="admin-icon-btn danger" onClick={() => handleDismissReport(r.id)}>
                            <XCircle size={15} /> Dismiss
                          </button>
                        ) : null}
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
                    ) : reviews.map((rv, idx) => (
                        <tr key={rv.id || `${rv.author}-${rv.createdAt}-${idx}`}>
                          <td>{rv.author || rv.name || 'N/A'}</td>
                          <td>{rv.dorm || rv.listingTitle || rv.property || 'N/A'}</td>
                          <td className="admin-rating-stars" aria-label={`${rv.rating || 0} out of 5 stars`}>
                            {formatStarRating(rv.rating)}
                          </td>
                          <td>{Array.isArray(rv.tags) ? rv.tags.join(', ') : (rv.tags || 'N/A')}</td>
                          <td>{truncate(rv.body || rv.comment || rv.review, 90)}</td>
                          <td>{toDisplayDate(rv.date || rv.createdAt)}</td>
                          <td>
                            <button className="admin-icon-btn danger" onClick={() => deleteReview(rv)}>
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
                      <th>Recipient</th>
                      <th>Type</th>
                      <th>Message</th>
                      <th>Created At</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {notifications.length === 0 ? (
                      <tr><td colSpan={5} className="admin-empty">No notifications available.</td></tr>
                    ) : notifications.map((n, idx) => (
                      <tr key={n.id || `${n.title}-${n.createdAt}-${idx}`}>
                        <td>{recipientLabel(n, users)}</td>
                        <td>{n.type || n.nav || 'general'}</td>
                        <td>{formatNotificationMessageForAdmin(n.message || n.text, n.recipientName || recipientLabel(n, users))}</td>
                        <td>{toDisplayDate(n.createdAt)}</td>
                        <td>
                          <button className="admin-icon-btn danger" onClick={() => deleteNotification(n)}>
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

              <p style={{ marginTop: 0, opacity: 0.8 }}>Direct messages, support requests, and broadcasts with users.</p>
              <AdminMessaging
                darkMode={darkMode}
                adminUser={adminUser}
                users={users}
                conversations={messageConversations}
                selectedConversationId={selectedMessageId}
                onSelectConversation={(id) => {
                  selectedMessageIdRef.current = id;
                  setSelectedMessageId(id);
                }}
                onConversationRead={handleConversationRead}
                onNotice={showInlineNotice}
              />
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
                  <p><strong>Email:</strong> {adminUser?.email || 'admin@dormscout.com'}</p>
                  <p><strong>Name:</strong> {adminUser?.firstName && adminUser?.lastName ? `${adminUser.firstName} ${adminUser.lastName}` : 'Admin DormScout'}</p>
                  <p><strong>Role:</strong> Administrator</p>
                  <p><strong>User Type:</strong> {adminUser?.userType || 'admin'}</p>
                </article>

                <article className="admin-card admin-danger-card">
                  <h3>Danger Zone</h3>
                  <p>These actions are irreversible.</p>
                  <div className="admin-danger-actions">
                    <button className="admin-icon-btn danger" onClick={clearAllReports}>Clear all reports</button>
                  </div>
                  <p className="admin-section-hint">Listings and bookings must be deleted individually with a required reason so users are notified.</p>
                </article>
              </div>
            </section>
          ) : null}
        </main>
      </div>

      {/* Rejection Modal */}
      {evidencePreview ? (
        <div
          className="admin-evidence-lightbox"
          role="dialog"
          aria-modal="true"
          aria-label="Evidence preview"
          onClick={() => setEvidencePreview(null)}
        >
          <button
            type="button"
            className="admin-evidence-lightbox-close"
            onClick={() => setEvidencePreview(null)}
            aria-label="Close preview"
          >
            <X size={22} />
          </button>
          <img
            src={evidencePreview}
            alt="Evidence full size"
            className="admin-evidence-lightbox-img"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      ) : null}

      {showDeleteModal && deleteTarget ? (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>{deleteTarget.type === 'booking' ? 'Delete Booking' : 'Delete Listing'}</h2>
              <button type="button" className="modal-close" onClick={() => setShowDeleteModal(false)} aria-label="Close">
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              {deleteTarget.type === 'booking' ? (
                <p>
                  Tenant: <strong>{deleteTarget.item.tenantName || toFullName(deleteTarget.item.tenant)}</strong>
                  <br />
                  Listing: <strong>{deleteTarget.item.listingTitle || deleteTarget.item.listing?.title || 'N/A'}</strong>
                </p>
              ) : (
                <p>Listing: <strong>{deleteTarget.item.title || 'N/A'}</strong></p>
              )}
              <label htmlFor="delete-reason">
                Reason for deletion <span className="admin-required">(required)</span>
              </label>
              <textarea
                id="delete-reason"
                className={`rejection-textarea ${deleteModalError ? 'has-error' : ''}`}
                placeholder="Explain why this is being removed (required). The affected user(s) will be notified."
                value={deleteReason}
                onChange={(e) => {
                  setDeleteReason(e.target.value);
                  if (deleteModalError && e.target.value.trim()) {
                    setDeleteModalError('');
                  }
                }}
                rows={6}
                required
                aria-invalid={deleteModalError ? 'true' : 'false'}
                aria-describedby={deleteModalError ? 'delete-reason-error' : undefined}
              />
              {deleteModalError ? (
                <p id="delete-reason-error" className="rejection-error" role="alert">
                  {deleteModalError}
                </p>
              ) : null}
              {deleteTarget.type === 'listing' ? (
                <p className="admin-section-hint">Tenants with bookings on this listing and the landlord will receive this reason. Saved bookmarks for this listing are removed automatically.</p>
              ) : null}
            </div>
            <div className="modal-footer">
              <button type="button" className="admin-btn" onClick={() => setShowDeleteModal(false)}>Cancel</button>
              <button
                type="button"
                className="admin-btn danger"
                onClick={handleSubmitAdminDelete}
                disabled={!deleteReason.trim()}
              >
                Delete & Notify
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {showRejectionModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>{rejectionMode === 'businessUpdate' ? 'Reject Business Update' : 'Reject Landlord Verification'}</h2>
              <button type="button" className="modal-close" onClick={() => setShowRejectionModal(false)} aria-label="Close">
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <p>Landlord: <strong>{selectedLandlord?.name || selectedLandlord?.email}</strong></p>
              <label htmlFor="rejection-reason">
                Reason for rejection <span className="admin-required">(required)</span>
              </label>
              <textarea
                id="rejection-reason"
                className={`rejection-textarea ${rejectionModalError ? 'has-error' : ''}`}
                placeholder={rejectionMode === 'businessUpdate'
                  ? 'Explain why this business update is being denied (required)...'
                  : 'Explain why this verification is being denied (required)...'}
                value={rejectionReason}
                onChange={(e) => {
                  setRejectionReason(e.target.value);
                  if (rejectionModalError && e.target.value.trim()) {
                    setRejectionModalError('');
                  }
                }}
                rows={6}
                required
                aria-invalid={rejectionModalError ? 'true' : 'false'}
                aria-describedby={rejectionModalError ? 'rejection-reason-error' : undefined}
              />
              {rejectionModalError ? (
                <p id="rejection-reason-error" className="rejection-error" role="alert">
                  {rejectionModalError}
                </p>
              ) : null}
            </div>
            <div className="modal-footer">
              <button type="button" className="admin-btn" onClick={() => setShowRejectionModal(false)}>Cancel</button>
              <button
                type="button"
                className="admin-btn danger"
                onClick={handleSubmitRejection}
                disabled={!rejectionReason.trim()}
              >
                Reject & Send
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
