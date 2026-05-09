import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { messagesAPI } from '../../../utils/api';
import './Messaging.css';

const PRIMARY = '#E8622E';
const AVATAR_COLORS = ['#5BADA8', '#E8622E', '#7C3AED', '#059669', '#DC2626'];

const ADMIN_CONVERSATION_ID = 'dormscout-admin';
const ADMIN_BROADCASTS_KEY  = 'dormscout_admin_messages';

/** Placeholder / demo lines that should not appear in the DormScout Admin thread */
const STRIPPED_ADMIN_BROADCAST_TEXTS = new Set(['this is a test']);

function sanitizeAdminBroadcasts(raw) {
  if (!Array.isArray(raw)) return [];
  return raw.filter((item) => {
    const t = String(item?.text ?? '').trim().toLowerCase();
    return t.length > 0 && !STRIPPED_ADMIN_BROADCAST_TEXTS.has(t);
  });
}

function loadAdminBroadcastsFromStorage() {
  const raw = lsGet(ADMIN_BROADCASTS_KEY, []);
  const cleaned = sanitizeAdminBroadcasts(raw);
  if (cleaned.length !== raw.length) {
    try {
      localStorage.setItem(ADMIN_BROADCASTS_KEY, JSON.stringify(cleaned));
    } catch { /* ignore */ }
  }
  return cleaned;
}

/** Helper: build deterministic conversationId for two users */
function makeConvId(idA, idB) {
  return `conv_${Math.min(Number(idA), Number(idB))}_${Math.max(Number(idA), Number(idB))}`;
}

/** Read JSON safely from localStorage */
function lsGet(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key) || 'null') ?? fallback; }
  catch { return fallback; }
}

function fullName(user) {
  if (!user) return '';
  if (user.name) return user.name;
  const joined = `${user.firstName || ''} ${user.lastName || ''}`.trim();
  return joined || user.email || '';
}

function withLandlordBadge(name, isLandlord, isVerified) {
  if (!isLandlord) return name;
  return isVerified ? `${name} ✓` : `${name} ⚠`;
}

// ═══════════════════════════════════════════════════════════
// TIMESTAMP HELPERS
// ═══════════════════════════════════════════════════════════
function formatTimestamp(timestamp) {
  if (!timestamp) return '';
  const now = Date.now();
  const diff = now - timestamp;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return 'yesterday';
  if (days < 7) return `${days}d ago`;

  return new Date(timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatMessageTime(timestamp) {
  return new Date(timestamp).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

// ═══════════════════════════════════════════════════════════
// DESKTOP NOTIFICATIONS
// ═══════════════════════════════════════════════════════════
function requestNotificationPermission() {
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }
}

function showDesktopNotification(title, body) {
  if ('Notification' in window && Notification.permission === 'granted') {
    const notification = new Notification(title, { body, tag: `msg-${Date.now()}` });
    notification.onclick = () => { window.focus(); notification.close(); };
    setTimeout(() => notification.close(), 5000);
  }
}

// ═══════════════════════════════════════════════════════════
// STATUS HELPERS
// ═══════════════════════════════════════════════════════════
function getStatusIcon(status) {
  switch (status) {
    case 'sent':     return '✓';
    case 'delivered': return '✓✓';
    case 'read':     return '✓✓';
    default:         return '';
  }
}

function getStatusColor(status, darkMode) {
  if (status === 'read') return PRIMARY;
  if (status === 'delivered') return darkMode ? '#6b7280' : '#65676b';
  return darkMode ? '#4b5563' : '#aab1bd';
}

// ═══════════════════════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════════════════════
function Avatar({ initials, imageUrl = null, size = 42, online = false, borderColor = '#16213e' }) {
  const safeInitials = (initials || '??').slice(0, 2).toUpperCase();
  const colorIndex = (safeInitials.charCodeAt(0) + (safeInitials.charCodeAt(1) || 0)) % AVATAR_COLORS.length;

  return (
    <div className="avatar-wrapper" style={{ width: size, height: size }}>
      <div className="avatar-circle" style={{ width: size, height: size, background: AVATAR_COLORS[colorIndex], fontSize: size * 0.38, overflow: 'hidden' }}>
        {imageUrl ? (
          <img
            src={imageUrl}
            alt="Profile"
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        ) : (
          safeInitials
        )}
      </div>
      {online && <div className="avatar-online-dot" style={{ width: size * 0.35, height: size * 0.35, borderColor }} />}
    </div>
  );
}

function StatusIndicator({ status, darkMode }) {
  if (!status) return null;
  return (
    <span className="status-indicator" style={{ color: getStatusColor(status, darkMode) }}>
      {getStatusIcon(status)}
    </span>
  );
}

// ═══════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════
export default function Messaging({ darkMode = false, userType = 'tenant', contactLandlord = null, contactTenant = null }) {
  const role = userType;
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();

  // ── Backend-persisted conversations & messages ──────────
  const [apiConversations, setApiConversations] = useState([]);
  const [conversationMessages, setConversationMessages] = useState([]);
  const [userDirectory, setUserDirectory] = useState({});

  // ── Admin broadcasts stay in localStorage (system-generated) ─
  const [adminBroadcasts, setAdminBroadcasts] = useState(() => loadAdminBroadcastsFromStorage());

  // ── UI state ─────────────────────────────────────────────
  const [selectedConvId, setSelectedConvId]     = useState(null);
  const [searchQuery,    setSearchQuery]         = useState('');
  const [messageInput,   setMessageInput]        = useState('');
  const [notificationEnabled, setNotificationEnabled] = useState(user?.settings?.messageAlerts !== false);
  const [contextMenuOpen, setContextMenuOpen]    = useState(null);
  const [contextMenuPos,  setContextMenuPos]     = useState({ top: 0, left: 0 });
  const initializedConversationsRef = useRef(new Set());
  const seenIncomingMessagesRef = useRef(new Set());

  const messagesEndRef = useRef(null);

  // ── Load & poll conversation summaries ──────────────────
  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;

    const load = async () => {
      const data = await messagesAPI.getConversations(user.id);
      if (!cancelled) setApiConversations(Array.isArray(data) ? data : []);
    };
    load();
    const id = setInterval(load, 5000);
    return () => { cancelled = true; clearInterval(id); };
  }, [user?.id]);

  useEffect(() => {
    let cancelled = false;
    fetch('http://localhost:8080/api/users')
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (cancelled) return;
        const users = Array.isArray(data) ? data : [];
        const byId = users.reduce((acc, item) => {
          acc[String(item.id)] = item;
          return acc;
        }, {});
        setUserDirectory(byId);
      })
      .catch(() => {
        if (!cancelled) setUserDirectory({});
      });

    return () => { cancelled = true; };
  }, []);

  // ── Load & poll messages for the selected conversation ──
  useEffect(() => {
    if (!selectedConvId || selectedConvId === ADMIN_CONVERSATION_ID) {
      if (selectedConvId !== ADMIN_CONVERSATION_ID) setConversationMessages([]);
      return;
    }
    let cancelled = false;

    const load = async () => {
      const data = await messagesAPI.getConversationMessages(selectedConvId);
      if (!cancelled) setConversationMessages(Array.isArray(data) ? data : []);
    };
    load();
    if (user?.id) messagesAPI.markConversationRead(selectedConvId, user.id);
    const id = setInterval(load, 3000);
    return () => { cancelled = true; clearInterval(id); };
  }, [selectedConvId, user?.id]);

  // ── Handle "Contact Landlord" navigation ────────────────
  useEffect(() => {
    if (!contactLandlord || !user?.id) return;
    const partnerId = contactLandlord.id;
    if (!partnerId) return;

    const convId = makeConvId(user.id, partnerId);
    const name = (contactLandlord.name && contactLandlord.name !== 'Landlord')
      ? contactLandlord.name : 'Landlord';
    const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

    setApiConversations(prev => {
      const exists = prev.some(c => c.conversationId === convId);
      if (!exists) {
        return [...prev, {
          conversationId: convId,
          partnerId: Number(partnerId),
          partnerName: name,
          partnerInitials: initials,
          lastMessage: 'Start a conversation',
          lastMessageTime: Date.now(),
          unreadCount: 0,
        }];
      }
      return prev;
    });
    setSelectedConvId(convId);
    // Refresh from backend in case there are existing messages
    messagesAPI.getConversations(user.id).then(data => {
      if (Array.isArray(data)) setApiConversations(data.length ? data : prev => prev);
    });
  }, [contactLandlord, user?.id]);

  // ── Handle "Contact Tenant" navigation (landlord side) ──
  useEffect(() => {
    if (!contactTenant || !user?.id || role !== 'landlord') return;
    const partnerId = contactTenant.id;
    if (!partnerId) return;

    const convId = makeConvId(user.id, partnerId);
    const name = (contactTenant.name && contactTenant.name !== 'Tenant')
      ? contactTenant.name : 'Tenant';
    const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

    setApiConversations(prev => {
      const exists = prev.some(c => c.conversationId === convId);
      if (!exists) {
        return [...prev, {
          conversationId: convId,
          partnerId: Number(partnerId),
          partnerName: name,
          partnerInitials: initials,
          lastMessage: 'Start a conversation',
          lastMessageTime: Date.now(),
          unreadCount: 0,
        }];
      }
      return prev;
    });
    setSelectedConvId(convId);
    messagesAPI.getConversations(user.id).then(data => {
      if (Array.isArray(data)) setApiConversations(data.length ? data : prev => prev);
    });
  }, [contactTenant, user?.id, role]);

  // ── Watch admin broadcasts (storage events from admin page) ─
  useEffect(() => {
    const handler = (e) => {
      if (e.key === ADMIN_BROADCASTS_KEY && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue) || [];
          setAdminBroadcasts(sanitizeAdminBroadcasts(parsed));
        } catch { /* ignore */ }
      }
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  // ── Map API conversations → role-keyed object for render ─
  const roleConversations = useMemo(() => {
    const map = {};
    apiConversations.forEach(conv => {
      const partnerUser = userDirectory[String(conv.partnerId)] || null;
      const partnerRole = String(partnerUser?.userType || '').toLowerCase();
      const isLandlordPartner = partnerRole === 'landlord';
      const isVerifiedPartner = Boolean(partnerUser?.verified || partnerUser?.isVerified || partnerUser?.verificationStatus === 'approved');
      const partnerName = conv.partnerName || fullName(partnerUser) || 'Unknown';
      map[conv.conversationId] = {
        id: conv.conversationId,
        partnerId: conv.partnerId,
        name: partnerName,
        displayName: withLandlordBadge(partnerName, isLandlordPartner, isVerifiedPartner),
        partnerRole,
        partnerVerified: isVerifiedPartner,
        avatar: conv.partnerInitials || '??',
        avatarImage: conv.partnerProfileImage || null,
        online: false,
        lastMessage: conv.lastMessage || 'Start a conversation',
        timestamp: conv.lastMessageTime,
        unread: conv.unreadCount || 0,
        landlordId: role === 'tenant' ? conv.partnerId : null,
        tenantId:   role === 'landlord' ? conv.partnerId : null,
      };
    });
    return map;
  }, [apiConversations, role, userDirectory]);

  const pendingContactConversation = useMemo(() => {
    if (!user?.id) return null;

    const pendingContact = role === 'tenant' ? contactLandlord : contactTenant;
    const partnerId = pendingContact?.id;
    if (!partnerId) return null;

    const conversationId = makeConvId(user.id, partnerId);
    if (roleConversations[conversationId]) return null;

    const name = pendingContact?.name || (role === 'tenant' ? 'Landlord' : 'Tenant');
    const isLandlordPartner = role === 'tenant';
    const isVerifiedPartner = Boolean(pendingContact?.verified || pendingContact?.isVerified || pendingContact?.verificationStatus === 'approved');
    const initials = (pendingContact?.avatar
      || name.split(' ').map((part) => part[0]).join('').toUpperCase().slice(0, 2)
      || 'XX');

    return {
      id: conversationId,
      partnerId: Number(partnerId),
      name,
      displayName: withLandlordBadge(name, isLandlordPartner, isVerifiedPartner),
      partnerRole: isLandlordPartner ? 'landlord' : 'tenant',
      partnerVerified: isVerifiedPartner,
      avatar: initials,
      avatarImage: pendingContact?.profileImage || null,
      online: false,
      lastMessage: 'Start a conversation',
      timestamp: Date.now(),
      unread: 0,
    };
  }, [contactLandlord, contactTenant, role, roleConversations, user?.id]);

  // ── Admin system messages (unchanged logic) ──────────────
  const verificationSystemMessages = useMemo(() => {
    if (role !== 'landlord' || !user?.verificationStatus) return [];
    let text = null;
    if (user.verificationStatus === 'rejected' && user.rejectionReason) {
      text = user.rejectionReason;
    } else if (user.verificationStatus === 'approved') {
      text = 'Your business verification was approved.';
    } else if (user.verificationStatus === 'pending') {
      text = 'Your business verification is pending admin review.';
    }
    if (!text) return [];
    return [{ id: `${ADMIN_CONVERSATION_ID}-${user?.verificationStatus}`, sender: 'received', text, timestamp: Date.now() }];
  }, [role, user?.verificationStatus, user?.rejectionReason]);

  const broadcastSystemMessages = useMemo(() => {
    const currentUserEmail = String(user?.email || '').toLowerCase();
    return (Array.isArray(adminBroadcasts) ? adminBroadcasts : [])
      .filter(item => {
        const mode = item?.mode || 'broadcast';
        if (mode === 'direct') return String(item?.recipientEmail || '').toLowerCase() === currentUserEmail;
        return item?.forRole === 'all' || item?.forRole === role;
      })
      .map(item => ({ id: item.id, sender: 'received', text: item.text, timestamp: item.createdAt ? new Date(item.createdAt).getTime() : Date.now() }))
      .sort((a, b) => a.timestamp - b.timestamp);
  }, [adminBroadcasts, role, user?.email]);

  const adminMessages = useMemo(() =>
    [...verificationSystemMessages, ...broadcastSystemMessages].sort((a, b) => a.timestamp - b.timestamp),
    [verificationSystemMessages, broadcastSystemMessages]
  );

  const adminConversation = useMemo(() => {
    if (adminMessages.length === 0) return null;
    const latest = adminMessages[adminMessages.length - 1];
    return { id: ADMIN_CONVERSATION_ID, name: 'DormScout Admin', avatar: 'DA', online: true, lastMessage: latest.text, timestamp: latest.timestamp, unread: 0, isSystem: true };
  }, [adminMessages]);

  const mergedConversations = useMemo(() => {
    const merged = { ...roleConversations };

    if (pendingContactConversation) {
      merged[pendingContactConversation.id] = pendingContactConversation;
    }

    if (adminConversation) {
      merged[ADMIN_CONVERSATION_ID] = adminConversation;
    }

    return merged;
  }, [roleConversations, pendingContactConversation, adminConversation]);

  const isAdminConversationSelected = selectedConvId === ADMIN_CONVERSATION_ID;
  const selectedConvRoleLabel = isAdminConversationSelected ? '· System' : role === 'tenant' ? '· Landlord' : '· Tenant';

  useEffect(() => {
    setNotificationEnabled(user?.settings?.messageAlerts !== false);
  }, [user?.settings?.messageAlerts]);

  // ── Messages array for the chat window ──────────────────
  const messages = useMemo(() => {
    if (isAdminConversationSelected) return adminMessages;
    return conversationMessages.map(msg => ({
      id: msg.id,
      sender: Number(msg.senderId) === Number(user?.id) ? 'sent' : 'received',
      text: msg.content,
      timestamp: msg.createdAt ? new Date(msg.createdAt).getTime() : Date.now(),
      status: msg.read ? 'read' : 'delivered',
      senderProfileImage: msg.senderProfileImage || null,
      receiverProfileImage: msg.receiverProfileImage || null,
    }));
  }, [conversationMessages, user?.id, isAdminConversationSelected, adminMessages]);

  const selectedConv = mergedConversations[selectedConvId];
  const fallbackContactName = contactLandlord?.name || contactTenant?.name || '';
  const fallbackContactInitials = fallbackContactName
    ? fallbackContactName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'XX';
  const fallbackContactImage = contactLandlord?.profileImage || contactTenant?.profileImage || null;

  // Auto-select admin conversation on first load if it exists and nothing is selected
  useEffect(() => {
    if (adminConversation && !selectedConvId) setSelectedConvId(ADMIN_CONVERSATION_ID);
  }, [adminConversation, selectedConvId]);

  // Ensure there is always a selected conversation when normal conversations exist
  useEffect(() => {
    if (selectedConvId) return;
    const first = Object.values(mergedConversations)[0];
    if (first?.id) setSelectedConvId(first.id);
  }, [mergedConversations, selectedConvId]);

  // Auto-scroll to bottom
  const scrollToBottom = useCallback(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, []);
  useEffect(() => { scrollToBottom(); }, [messages, scrollToBottom]);

  // Notify only for newly-arrived incoming messages after a conversation is initialized.
  useEffect(() => {
    if (!selectedConvId || isAdminConversationSelected) return;

    const key = String(selectedConvId);
    if (!initializedConversationsRef.current.has(key)) {
      initializedConversationsRef.current.add(key);
      conversationMessages.forEach((msg) => {
        if (Number(msg.senderId) !== Number(user?.id)) {
          seenIncomingMessagesRef.current.add(String(msg.id));
        }
      });
      return;
    }

    conversationMessages.forEach((msg) => {
      const messageId = String(msg.id);
      const isIncoming = Number(msg.senderId) !== Number(user?.id);
      if (!isIncoming || seenIncomingMessagesRef.current.has(messageId)) return;

      seenIncomingMessagesRef.current.add(messageId);
      if (notificationEnabled && Notification.permission === 'granted' && document.visibilityState !== 'visible') {
        showDesktopNotification(selectedConv?.name || 'New message', (msg.content || '').substring(0, 80));
      }
    });
  }, [conversationMessages, selectedConvId, selectedConv?.name, user?.id, notificationEnabled, isAdminConversationSelected]);

  // ── Send message ─────────────────────────────────────────
  const sendMessage = useCallback(async () => {
    if (!messageInput.trim() || !selectedConvId || isAdminConversationSelected) return;

    const selectedConvData = mergedConversations[selectedConvId]
      || apiConversations.find(c => c.conversationId === selectedConvId);
    const partnerId = selectedConvData?.partnerId;
    if (!partnerId || !user?.id) return;

    const text = messageInput.trim();
    setMessageInput('');

    // Optimistic: add bubble immediately
    const optimistic = {
      id: `opt_${Date.now()}`,
      senderId: user.id,
      content: text,
      conversationId: selectedConvId,
      createdAt: new Date().toISOString(),
      read: false,
      senderProfileImage: user?.profileImage || null,
    };
    setConversationMessages(prev => [...prev, optimistic]);

    // Persist to backend
    await messagesAPI.sendMessage(user.id, partnerId, text, selectedConvId);

    // Replace optimistic with real backend data
    const [msgs, convs] = await Promise.all([
      messagesAPI.getConversationMessages(selectedConvId),
      messagesAPI.getConversations(user.id),
    ]);
    setConversationMessages(Array.isArray(msgs)  ? msgs  : []);
    setApiConversations(Array.isArray(convs) ? convs : []);

  }, [messageInput, selectedConvId, mergedConversations, apiConversations, user?.id, user?.profileImage, isAdminConversationSelected]);

  // ── Delete a single message ──────────────────────────────
  const handleDeleteMessage = useCallback(async (msgId) => {
    // Remove optimistic bubbles locally
    if (String(msgId).startsWith('opt_')) {
      setConversationMessages(prev => prev.filter(m => m.id !== msgId));
      return;
    }
    const msg = conversationMessages.find(m => String(m.id) === String(msgId));
    if (!msg) return;
    if (Number(msg.senderId) !== Number(user?.id)) {
      console.warn('Attempted to delete a message you did not send.');
      return;
    }
    await messagesAPI.deleteMessage(msgId);
    setConversationMessages(prev => prev.filter(m => m.id !== msgId));
  }, [conversationMessages, user?.id]);

  // ── Delete a conversation ────────────────────────────────
  const handleDeleteConversation = useCallback(async (convId) => {
    if (user?.id) await messagesAPI.deleteConversation(String(convId), user.id);
    setApiConversations(prev => prev.filter(c => c.conversationId !== String(convId)));
    if (String(selectedConvId) === String(convId)) {
      setSelectedConvId(null);
      setConversationMessages([]);
    }
  }, [selectedConvId, user?.id]);

  // ── Notification toggle ──────────────────────────────────
  const toggleNotifications = async () => {
    const currentValue = user?.settings?.messageAlerts !== false;
    const nextValue = !currentValue;

    let effectiveValue = nextValue;
    if (nextValue && Notification.permission !== 'granted') {
      if (Notification.permission === 'default') {
        await Notification.requestPermission();
      }
      effectiveValue = Notification.permission === 'granted';
    }

    setNotificationEnabled(effectiveValue);
    if (user?.id) {
      await updateUser({
        settings: {
          ...(user.settings || {}),
          messageAlerts: effectiveValue,
        },
      });
    }
  };
  const c = {
    mainBg:          darkMode ? '#1a1a2e' : '#ffffff',
    sidebarBg:       darkMode ? '#16213e' : '#ffffff',
    chatBg:          darkMode ? '#16213e' : '#f5f5f5',
    inputBg:         darkMode ? '#0f3460' : '#f0f2f5',
    text:            darkMode ? '#ffffff' : '#1a1a1a',
    secondaryText:   darkMode ? '#a0a0b0' : '#65676b',
    receivedBubble:  darkMode ? '#1e3a5f' : '#e4e6eb',
    receivedText:    darkMode ? '#ffffff' : '#1a1a1a',
    sentBubble:       PRIMARY,
    sentText:        '#ffffff',
    activeConv:      PRIMARY,
    activeConvText:  '#ffffff',
    border:          darkMode ? '#2a2a4a' : '#e4e6eb',
    hoverBg:         darkMode ? '#1e2849' : '#f2f2f2',
  };

  const filteredConversations = Object.values(mergedConversations).filter((conv) =>
    conv.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // ═══════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════
  return (
    <div className="messaging-wrapper" style={{ background: c.mainBg }} onClick={() => setContextMenuOpen(null)}>

      {/* ── Sidebar ── */}
      <div className="messaging-sidebar" style={{ background: c.sidebarBg, borderRight: `1px solid ${c.border}` }}>

        <div className="messaging-sidebar__header" style={{ borderBottom: `1px solid ${c.border}` }}>
          <div className="messaging-sidebar__title-row">
            <h2 className="messaging-sidebar__title" style={{ color: c.text }}>Messages</h2>
            <button
              className="notification-toggle"
              onClick={toggleNotifications}
              title={notificationEnabled ? 'Disable notifications' : 'Enable notifications'}
              style={{ color: notificationEnabled ? PRIMARY : c.secondaryText }}
            >
              {notificationEnabled ? '🔔' : '🔕'}
            </button>
          </div>

          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="messaging-sidebar__search"
            style={{ border: `1px solid ${c.border}`, background: c.inputBg, color: c.text }}
          />
        </div>

        <div className="messaging-sidebar__list">
          {filteredConversations.length === 0 ? (
            <div className="no-conversations" style={{ color: c.secondaryText }}>
              No conversations found
            </div>
          ) : (
            filteredConversations.map((conv) => {
              const isActive = selectedConvId === conv.id;
              return (
                <div
                  key={conv.id}
                  className="conv-item"
                  onClick={() => setSelectedConvId(conv.id)}
                  style={{
                    background: isActive ? c.activeConv : 'transparent',
                    borderBottom: `1px solid ${c.border}`,
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                  onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = c.hoverBg; }}
                  onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
                >
                  <Avatar
                    initials={conv.avatar}
                    imageUrl={conv.avatarImage}
                    size={48}
                    online={conv.online}
                    borderColor={c.sidebarBg}
                  />

                  <div className="conv-item__body">
                    <div className="conv-item__top">
                      <span className="conv-item__name" style={{ fontWeight: conv.unread > 0 ? '700' : '600', color: isActive ? c.activeConvText : c.text }}>
                        {conv.displayName || conv.name}
                      </span>
                      <span className="conv-item__time" style={{ color: isActive ? 'rgba(255,255,255,0.8)' : c.secondaryText }}>
                        {formatTimestamp(conv.timestamp)}
                      </span>
                    </div>

                    <div className="conv-item__bottom">
                      <p className="conv-item__preview" style={{ color: isActive ? 'rgba(255,255,255,0.8)' : c.secondaryText, fontWeight: conv.unread > 0 ? '600' : '400' }}>
                        {conv.lastMessage}
                      </p>
                      {conv.unread > 0 && (
                        <span className="conv-item__unread-badge" style={{ background: c.unreadDot || PRIMARY }}>
                          {conv.unread}
                        </span>
                      )}
                    </div>
                  </div>

                  {!conv.isSystem && (
                    <div style={{ marginLeft: 'auto', paddingRight: '8px' }}>
                      <button
                        className="conv-menu-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (contextMenuOpen === conv.id) {
                            setContextMenuOpen(null);
                          } else {
                            const rect = e.currentTarget.getBoundingClientRect();
                            setContextMenuPos({ top: rect.bottom + 4, left: rect.right - 220 });
                            setContextMenuOpen(conv.id);
                          }
                        }}
                        title="More options"
                        style={{
                          background: contextMenuOpen === conv.id ? c.hoverBg : 'transparent',
                          border: 'none', cursor: 'pointer',
                          color: contextMenuOpen === conv.id ? PRIMARY : c.secondaryText,
                          fontSize: '20px', padding: '4px 8px',
                          borderRadius: '4px', transition: 'all 0.2s ease',
                          opacity: isActive || contextMenuOpen === conv.id ? 1 : 0.6,
                        }}
                      >
                        ⋯
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ── Chat Window ── */}
      <div className="messaging-chat" style={{ background: c.chatBg }}>

        <div className="messaging-chat__header" style={{ borderBottom: `1px solid ${c.border}` }}>
          <Avatar
            initials={selectedConv?.avatar || fallbackContactInitials}
            imageUrl={selectedConv?.avatarImage || fallbackContactImage}
            size={40}
            online={selectedConv?.online}
          />
          <div className="messaging-chat__header-info">
            <h3 style={{ color: c.text }}>
              {selectedConv?.displayName || selectedConv?.name || fallbackContactName || 'Conversation'}
              <span className="messaging-chat__header-role" style={{ color: c.secondaryText }}>
                {selectedConvRoleLabel}
              </span>
            </h3>
            <p className="messaging-chat__header-status" style={{ color: c.secondaryText }}>
              {selectedConv?.online ? 'Active now' : `Active ${formatTimestamp(selectedConv?.timestamp)}`}
            </p>
          </div>
        </div>

        {/* Messages */}
        <div className="messaging-chat__messages">
          {messages.map((msg, index) => {
            const isReceived = msg.sender === 'received';
            const showTimestamp = index === 0 ||
              (messages[index - 1]?.timestamp && msg.timestamp - messages[index - 1].timestamp > 300000);

            return (
              <div key={msg.id}>
                {showTimestamp && msg.timestamp && (
                  <div className="msg-timestamp" style={{ color: c.secondaryText }}>
                    {formatMessageTime(msg.timestamp)}
                  </div>
                )}
                <div className={`msg-row msg-row--${isReceived ? 'received' : 'sent'}`}>
                  {isReceived && (
                    <Avatar
                      initials={selectedConv?.avatar || 'XX'}
                      imageUrl={msg.senderProfileImage || selectedConv?.avatarImage || fallbackContactImage}
                      size={32}
                    />
                  )}
                  <div
                    className={`msg-bubble ${isReceived ? '' : 'msg-bubble--sent'}`}
                    style={{
                      ...(isReceived
                        ? { background: c.receivedBubble, color: c.receivedText }
                        : { background: c.sentBubble, color: c.sentText }),
                      position: 'relative',
                    }}
                  >
                    {msg.text}
                    {!isReceived && msg.status && (
                      <StatusIndicator status={msg.status} darkMode={darkMode} />
                    )}
                    {!isReceived && (
                    <button
                      className="msg-delete-btn"
                      title="Delete message"
                      onClick={() => handleDeleteMessage(msg.id)}
                      style={{
                        position: 'absolute', top: '-10px', right: '-10px',
                        width: '24px', height: '24px', borderRadius: '50%',
                        background: '#ef4444',
                        border: 'none', cursor: 'pointer', fontSize: '13px',
                        color: '#fff', fontWeight: 'bold',
                        lineHeight: '1', padding: 0,
                        display: 'none', zIndex: 10,
                      }}
                    >
                      ✕
                    </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <div className="messaging-chat__input-area" style={{ borderTop: `1px solid ${c.border}` }}>
          <button className="input-icon-btn" disabled={isAdminConversationSelected} style={{ background: c.inputBg, opacity: isAdminConversationSelected ? 0.5 : 1 }}>😊</button>

          <input
            type="text"
            placeholder={isAdminConversationSelected ? 'Replies are disabled for DormScout Admin' : 'Aa'}
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            className="messaging-chat__text-input"
            disabled={isAdminConversationSelected}
            style={{ border: `1px solid ${c.border}`, background: c.inputBg, color: c.text }}
          />

          <button className="input-icon-btn" disabled={isAdminConversationSelected} style={{ background: c.inputBg, fontSize: '18px', opacity: isAdminConversationSelected ? 0.5 : 1 }}>📎</button>

          <button
            className="send-btn"
            onClick={sendMessage}
            disabled={!messageInput.trim() || isAdminConversationSelected}
            style={{ opacity: messageInput.trim() && !isAdminConversationSelected ? 1 : 0.5 }}
          >
            ➤
          </button>
        </div>
      </div>

      {/* ── Fixed Context Menu ── */}
      {contextMenuOpen !== null && (
        <div
          className="conv-context-menu"
          style={{
            position: 'fixed',
            top: contextMenuPos.top,
            left: contextMenuPos.left,
            zIndex: 9999,
            background: darkMode ? '#1e2849' : '#ffffff',
            border: `1px solid ${c.border}`,
            borderRadius: '10px',
            minWidth: '200px',
            boxShadow: '0 8px 30px rgba(0,0,0,0.25)',
            overflow: 'hidden',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {contextMenuOpen !== ADMIN_CONVERSATION_ID && (
            <>
              <button
                onClick={() => {
                  const convId = contextMenuOpen;
                  setContextMenuOpen(null);
                  const convData = apiConversations.find(c => c.conversationId === String(convId));
                  navigate(`/profile/${convData?.partnerId || convId}`);
                }}
                style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  width: '100%', padding: '12px 16px', border: 'none',
                  background: 'transparent', color: c.text, cursor: 'pointer',
                  textAlign: 'left', fontSize: '14px', fontWeight: '500',
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = c.hoverBg}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <span style={{ fontSize: '16px' }}>👤</span> View profile
              </button>
              <button
                onClick={() => {
                  const conv = mergedConversations[contextMenuOpen];
                  setContextMenuOpen(null);
                  navigate('/report', {
                    state: {
                      reportedUser: conv?.name,
                      subject: conv?.name,
                      conversationId: contextMenuOpen,
                      userType: role,
                    }
                  });
                }}
                style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  width: '100%', padding: '12px 16px', border: 'none',
                  background: 'transparent', color: c.text, cursor: 'pointer',
                  textAlign: 'left', fontSize: '14px', fontWeight: '500',
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = c.hoverBg}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <span style={{ fontSize: '16px' }}>🚩</span> Report
              </button>
              <button
                onClick={() => {
                  const convId = contextMenuOpen;
                  setContextMenuOpen(null);
                  handleDeleteConversation(convId);
                }}
                style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  width: '100%', padding: '12px 16px', border: 'none',
                  background: 'transparent', color: '#ef4444', cursor: 'pointer',
                  textAlign: 'left', fontSize: '14px', fontWeight: '500',
                  borderTop: `1px solid ${c.border}`,
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = c.hoverBg}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <span style={{ fontSize: '16px' }}>🗑️</span> Delete chat
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
