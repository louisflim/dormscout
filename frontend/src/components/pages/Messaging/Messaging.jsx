import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import './Messaging.css';

const PRIMARY = '#E8622E';
const AVATAR_COLORS = ['#5BADA8', '#E8622E', '#7C3AED', '#059669', '#DC2626'];

// ═══════════════════════════════════════════════════════════
// STORAGE CONSTANTS & HELPERS
// ═══════════════════════════════════════════════════════════
const STORAGE_KEYS = {
  conversations: 'messaging_conversations',
  messages: 'messaging_messages',
};

const Storage = {
  get(key, defaultValue = null) {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch {
      return defaultValue;
    }
  },

  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch {
      return false;
    }
  },
};

// ═══════════════════════════════════════════════════════════
// INITIAL SHARED DATA
// ═══════════════════════════════════════════════════════════
const INITIAL_SHARED_CONVERSATIONS = {
  tenant: {},
  landlord: {},
};

const INITIAL_SHARED_MESSAGES = {
  tenant: {},
  landlord: {},
};

// ═══════════════════════════════════════════════════════════
// INITIALIZE STORAGE
// ═══════════════════════════════════════════════════════════
function initializeStorage() {
  if (!Storage.get(STORAGE_KEYS.conversations)) {
    Storage.set(STORAGE_KEYS.conversations, INITIAL_SHARED_CONVERSATIONS);
  }
  if (!Storage.get(STORAGE_KEYS.messages)) {
    Storage.set(STORAGE_KEYS.messages, INITIAL_SHARED_MESSAGES);
  }
}

// Clear placeholder conversations and deduplicate by landlordId
function clearPlaceholderConversations() {
  const convs = Storage.get(STORAGE_KEYS.conversations) || INITIAL_SHARED_CONVERSATIONS;
  const PLACEHOLDER_NAMES = ['Maria Santos', 'Juan dela Cruz', 'Rosa Macaraeg', 'Pedro Lim', 'Carlos Reyes'];
  
  const cleaned = { ...convs };
  ['tenant', 'landlord'].forEach(role => {
    if (!cleaned[role]) return;

    // If there are way too many conversations (junk from old bug), wipe the role entirely
    if (Object.keys(cleaned[role]).length > 100) {
      cleaned[role] = {};
      return;
    }

    // Remove placeholders
    Object.keys(cleaned[role]).forEach(convId => {
      if (PLACEHOLDER_NAMES.includes(cleaned[role][convId].name)) {
        delete cleaned[role][convId];
      }
    });

    // Deduplicate: group by landlordId first, then by name as fallback
    const seen = {}; // groupKey -> {convId, timestamp}
    Object.keys(cleaned[role]).forEach(convId => {
      const conv = cleaned[role][convId];
      // Use landlordId if valid, otherwise fall back to name
      const lid = (conv.landlordId != null) ? String(conv.landlordId) : (conv.name || convId);
      if (!seen[lid] || (conv.timestamp || 0) > seen[lid].timestamp) {
        seen[lid] = { convId, timestamp: conv.timestamp || 0 };
      }
    });
    const keepIds = new Set(Object.values(seen).map(s => s.convId));
    Object.keys(cleaned[role]).forEach(convId => {
      if (!keepIds.has(convId)) delete cleaned[role][convId];
    });
  });
  
  Storage.set(STORAGE_KEYS.conversations, cleaned);
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
function Avatar({ initials, size = 42, online = false, borderColor = '#16213e' }) {
  const colorIndex = (initials.charCodeAt(0) + (initials.charCodeAt(1) || 0)) % AVATAR_COLORS.length;

  return (
    <div className="avatar-wrapper" style={{ width: size, height: size }}>
      <div className="avatar-circle" style={{ width: size, height: size, background: AVATAR_COLORS[colorIndex], fontSize: size * 0.38 }}>
        {initials}
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
  const otherRole = role === 'tenant' ? 'landlord' : 'tenant';
  const contactHandledRef = useRef(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    requestNotificationPermission();
  }, []);

  // State from localStorage — run cleanup synchronously in lazy initializer
  const [conversations, setConversations] = useState(() => {
    initializeStorage();
    clearPlaceholderConversations();
    return Storage.get(STORAGE_KEYS.conversations) || INITIAL_SHARED_CONVERSATIONS;
  });
  const [allMessages, setAllMessages] = useState(() =>
    Storage.get(STORAGE_KEYS.messages) || INITIAL_SHARED_MESSAGES
  );

  // UI State
  const [selectedConvId, setSelectedConvId] = useState(null);

  // Handle contact landlord navigation — runs once per new contactLandlord prop
  useEffect(() => {
    contactHandledRef.current = false; // reset first so same landlord can be re-contacted
    if (!contactLandlord) return;
    contactHandledRef.current = true;

    const landlord = { ...contactLandlord };
    
    // If name is still "Landlord", try to fetch the actual name from users database using landlordId
    if ((landlord.name === 'Landlord' || !landlord.name) && landlord.id) {
      try {
        const users = JSON.parse(localStorage.getItem('dormScoutUsers') || '[]');
        const landlordUser = users.find(u => u.id === landlord.id);
        if (landlordUser && landlordUser.name) {
          landlord.name = landlordUser.name;
          landlord.avatar = landlordUser.name.split(' ').map(n => n[0]).join('');
        }
      } catch (e) {
        // ignore
      }
    }
    
    let currentConvs = Storage.get(STORAGE_KEYS.conversations) || INITIAL_SHARED_CONVERSATIONS;
    const roleConvs = currentConvs[role] || {};

    // Strategy: Try to find existing conversation using:
    // 1. landlord.id as exact key (most reliable)
    // 2. landlordId field in conversation objects
    // 3. Name matching (for backwards compatibility)
    let convId = null;

    // Step 1: Direct ID match
    if (landlord.id && roleConvs[landlord.id]) {
      convId = String(landlord.id);
    }
    
    // Step 2: Search by landlordId field
    if (!convId && landlord.id) {
      convId = Object.keys(roleConvs).find(id => roleConvs[id].landlordId === landlord.id);
    }
    
    // Step 3: Search by name (backwards compatibility)
    if (!convId && landlord.name && landlord.name !== 'Landlord') {
      convId = Object.keys(roleConvs).find(id => roleConvs[id].name === landlord.name);
    }

    if (!convId) {
      // Create new conversation using landlord's ID as key
      convId = landlord.id || (Math.max(...Object.keys(roleConvs).map(Number).filter(n => !isNaN(n)), 0) + 1);
      const newConversations = { ...currentConvs };
      newConversations[role] = {
        ...roleConvs,
        [convId]: {
          id: convId,
          landlordId: landlord.id || null,
          name: landlord.name || 'Landlord',
          avatar: landlord.avatar || (landlord.name || 'L').split(' ').map(n => n[0]).join(''),
          online: true,
          lastMessage: 'Start a conversation',
          timestamp: Date.now(),
          unread: 0,
        }
      };
      setConversations(newConversations);
      Storage.set(STORAGE_KEYS.conversations, newConversations);
    } else {
      // Update conversation name if it changed (e.g., from "Landlord" to actual name)
      const existingConv = roleConvs[convId];
      if (existingConv && landlord.name && existingConv.name !== landlord.name) {
        const updatedConversations = { ...currentConvs };
        updatedConversations[role] = {
          ...roleConvs,
          [convId]: {
            ...existingConv,
            name: landlord.name,
            avatar: landlord.avatar || (landlord.name || 'L').split(' ').map(n => n[0]).join(''),
            landlordId: landlord.id || existingConv.landlordId,
          }
        };
        setConversations(updatedConversations);
        Storage.set(STORAGE_KEYS.conversations, updatedConversations);
      }
    }
    setSelectedConvId(convId);
  }, [contactLandlord, role]);

  // Handle contact TENANT navigation (landlord side)
  useEffect(() => {
    if (!contactTenant || role !== 'landlord') return;

    const tenant = { ...contactTenant };
    if ((tenant.name === 'Tenant' || !tenant.name) && tenant.id) {
      try {
        const users = JSON.parse(localStorage.getItem('dormScoutUsers') || '[]');
        const tenantUser = users.find(u => u.id === tenant.id);
        if (tenantUser?.name) {
          tenant.name = tenantUser.name;
          tenant.avatar = tenantUser.name.split(' ').map(n => n[0]).join('');
        }
      } catch (e) { /* ignore */ }
    }

    let currentConvs = Storage.get(STORAGE_KEYS.conversations) || INITIAL_SHARED_CONVERSATIONS;
    const roleConvs = currentConvs['landlord'] || {};

    let convId = null;
    if (tenant.id && roleConvs[tenant.id]) convId = String(tenant.id);
    if (!convId && tenant.id) convId = Object.keys(roleConvs).find(id => roleConvs[id].tenantId === tenant.id);
    if (!convId && tenant.name && tenant.name !== 'Tenant') convId = Object.keys(roleConvs).find(id => roleConvs[id].name === tenant.name);

    if (!convId) {
      convId = tenant.id || (Math.max(...Object.keys(roleConvs).map(Number).filter(n => !isNaN(n)), 0) + 1);
      const newConversations = { ...currentConvs };
      newConversations['landlord'] = {
        ...roleConvs,
        [convId]: {
          id: convId,
          tenantId: tenant.id || null,
          name: tenant.name || 'Tenant',
          avatar: tenant.avatar || (tenant.name || 'T').split(' ').map(n => n[0]).join(''),
          online: true,
          lastMessage: 'Start a conversation',
          timestamp: Date.now(),
          unread: 0,
        }
      };
      setConversations(newConversations);
      Storage.set(STORAGE_KEYS.conversations, newConversations);
    }
    setSelectedConvId(convId);
  }, [contactTenant, role]);

  // Seed landlord's conversation list from bookings
  useEffect(() => {
    if (role !== 'landlord' || !user) return;
    try {
      const allBookings = JSON.parse(localStorage.getItem('dormscout_bookings') || '[]');
      const myListingIds = new Set((user.listings || []).map(l => String(l.id)));
      const myBookings = allBookings.filter(b => myListingIds.has(String(b.listingId)));
      if (myBookings.length === 0) return;

      let currentConvs = Storage.get(STORAGE_KEYS.conversations) || INITIAL_SHARED_CONVERSATIONS;
      const landlordConvs = { ...(currentConvs['landlord'] || {}) };
      let hasChanges = false;

      myBookings.forEach(booking => {
        const key = String(booking.tenantId);
        if (!landlordConvs[key]) {
          landlordConvs[key] = {
            id: key,
            tenantId: booking.tenantId,
            name: booking.tenantName,
            avatar: booking.tenantAvatar || (booking.tenantName || 'T').charAt(0),
            online: false,
            lastMessage: `Booking for ${booking.listingTitle}`,
            timestamp: new Date(booking.createdAt).getTime() || Date.now(),
            unread: 0,
          };
          hasChanges = true;
        }
      });

      if (hasChanges) {
        currentConvs = { ...currentConvs, landlord: landlordConvs };
        setConversations(currentConvs);
        Storage.set(STORAGE_KEYS.conversations, currentConvs);
      }
    } catch (e) { /* ignore */ }
  }, [role, user]);


  const [searchQuery, setSearchQuery] = useState('');
  const [messageInput, setMessageInput] = useState('');
  const [notificationEnabled, setNotificationEnabled] = useState(
    Notification.permission === 'granted'
  );
  const [contextMenuOpen, setContextMenuOpen] = useState(null);
  const [contextMenuPos, setContextMenuPos] = useState({ top: 0, left: 0 });

  // Refs
  const messagesEndRef = useRef(null);

  // Get role-specific data
  const roleConversations = conversations[role] || {};
  const roleMessages = useMemo(() => allMessages[role] || {}, [allMessages, role]);
  const messages = useMemo(() => roleMessages[selectedConvId] || [], [roleMessages, selectedConvId]);
  const selectedConv = roleConversations[selectedConvId];

  // Auto-scroll to bottom
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // ═══════════════════════════════════════════════════════════
  // CROSS-TAB SYNC via storage event
  // ═══════════════════════════════════════════════════════════
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (!e.newValue) return;

      if (e.key === STORAGE_KEYS.conversations) {
        const newConversations = JSON.parse(e.newValue);
        setConversations(newConversations);

        // Show notification for new messages from other tab
        if (notificationEnabled) {
          const newUnread = newConversations[role]?.[selectedConvId]?.unread || 0;
          const oldUnread = conversations[role]?.[selectedConvId]?.unread || 0;

          if (newUnread > oldUnread) {
            const convName = newConversations[role]?.[selectedConvId]?.name;
            const lastMsg = newConversations[role]?.[selectedConvId]?.lastMessage;
            if (convName && lastMsg) {
              showDesktopNotification(`💬 New Message from ${convName}`, lastMsg);
            }
          }
        }
      }

      if (e.key === STORAGE_KEYS.messages) {
        setAllMessages(JSON.parse(e.newValue));
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [role, selectedConvId, notificationEnabled, conversations]);

  // ═══════════════════════════════════════════════════════════
  // SEND MESSAGE
  // ═══════════════════════════════════════════════════════════
  const sendMessage = useCallback(() => {
    if (!messageInput.trim() || !selectedConv) return;

    const now = Date.now();

    // Create new message
    const newMessage = {
      id: now,
      sender: 'sent',
      text: messageInput,
      timestamp: now,
      status: 'sent',
    };

    // Update messages for current role
    const updatedMessages = [...messages, newMessage];
    const newAllMessages = { ...allMessages };
    newAllMessages[role] = { ...roleMessages, [selectedConvId]: updatedMessages };

    // Also deliver message to the OTHER role's side
    const senderName = user?.name || user?.firstName || (role === 'tenant' ? 'Tenant' : 'Landlord');
    const senderAvatar = senderName.split(' ').map(n => n[0]).join('') || 'U';
    const senderId = user?.id;
    const otherConvs = conversations[otherRole] || {};
    const updatedOtherConversations = { ...conversations };

    // Find or create the mirrored conversation on the other side using sender's ID
    let mirrorConvId = senderId 
      ? (otherConvs[senderId] ? senderId : Object.keys(otherConvs).find(id => otherConvs[id].senderId === senderId || otherConvs[id].name === senderName))
      : Object.keys(otherConvs).find(id => otherConvs[id].name === senderName);
    
    if (!mirrorConvId) {
      // Use sender's ID if available, otherwise generate numeric ID
      mirrorConvId = senderId || (Math.max(...Object.keys(otherConvs).map(id => {
        const n = Number(id);
        return isNaN(n) ? 0 : n;
      }), 0) + 1);
      
      updatedOtherConversations[otherRole] = {
        ...otherConvs,
        [mirrorConvId]: {
          id: mirrorConvId,
          senderId: senderId || null,
          name: senderName,
          avatar: senderAvatar,
          online: true,
          lastMessage: messageInput,
          timestamp: now,
          unread: 1,
        }
      };
    } else {
      const prev = otherConvs[mirrorConvId];
      updatedOtherConversations[otherRole] = {
        ...otherConvs,
        [mirrorConvId]: {
          ...prev,
          lastMessage: messageInput,
          timestamp: now,
          unread: (prev.unread || 0) + 1,
        }
      };
    }

    // Add as 'received' on the other side
    const otherMessages = newAllMessages[otherRole] || {};
    const otherConvMessages = otherMessages[mirrorConvId] || [];
    newAllMessages[otherRole] = {
      ...otherMessages,
      [mirrorConvId]: [...otherConvMessages, { id: now + 1, sender: 'received', text: messageInput, timestamp: now }]
    };

    setAllMessages(newAllMessages);
    Storage.set(STORAGE_KEYS.messages, newAllMessages);

    // Update last message in conversation for current role
    updatedOtherConversations[role] = {
      ...(updatedOtherConversations[role] || {}),
      [selectedConvId]: {
        ...selectedConv,
        lastMessage: messageInput,
        timestamp: now,
      }
    };
    setConversations(updatedOtherConversations);
    Storage.set(STORAGE_KEYS.conversations, updatedOtherConversations);

    // Clear input
    setMessageInput('');

    // Show notification if enabled
    if (notificationEnabled) {
      showDesktopNotification('Message sent', messageInput.substring(0, 50));
    }

    // Mark as delivered after 1 second
    setTimeout(() => {
      const latest = Storage.get(STORAGE_KEYS.messages) || newAllMessages;
      const msgs = [...(latest[role]?.[selectedConvId] || [])];
      const lastMsg = msgs.find(m => m.id === now);
      if (lastMsg) {
        lastMsg.status = 'delivered';
        latest[role] = { ...latest[role], [selectedConvId]: msgs };
        setAllMessages({ ...latest });
        Storage.set(STORAGE_KEYS.messages, latest);
      }
    }, 1000);

    // Mark as read after 2 seconds
    setTimeout(() => {
      const latest = Storage.get(STORAGE_KEYS.messages) || newAllMessages;
      const msgs = [...(latest[role]?.[selectedConvId] || [])];
      const lastMsg = msgs.find(m => m.id === now);
      if (lastMsg) {
        lastMsg.status = 'read';
        latest[role] = { ...latest[role], [selectedConvId]: msgs };
        setAllMessages({ ...latest });
        Storage.set(STORAGE_KEYS.messages, latest);
      }
    }, 2000);
  }, [messageInput, selectedConv, selectedConvId, role, otherRole, messages, allMessages, roleMessages, conversations, notificationEnabled, user]);

  // ═══════════════════════════════════════════════════════════
  // DELETE MESSAGE
  // ═══════════════════════════════════════════════════════════
  const handleDeleteMessage = useCallback((msgId) => {
    const updatedMessages = messages.filter(m => m.id !== msgId);
    const newAllMessages = { ...allMessages };
    newAllMessages[role] = { ...roleMessages, [selectedConvId]: updatedMessages };
    setAllMessages(newAllMessages);
    Storage.set(STORAGE_KEYS.messages, newAllMessages);

    // Update last message in conversation
    const lastMsg = updatedMessages[updatedMessages.length - 1];
    const updatedConversations = { ...conversations };
    if (updatedConversations[role]?.[selectedConvId]) {
      updatedConversations[role][selectedConvId] = {
        ...updatedConversations[role][selectedConvId],
        lastMessage: lastMsg ? lastMsg.text : 'No messages',
        timestamp: lastMsg ? lastMsg.timestamp : Date.now(),
      };
      setConversations(updatedConversations);
      Storage.set(STORAGE_KEYS.conversations, updatedConversations);
    }
  }, [messages, allMessages, roleMessages, selectedConvId, role, conversations]);

  // ═══════════════════════════════════════════════════════════
  // MARK AS READ when switching conversations
  // ═══════════════════════════════════════════════════════════
  useEffect(() => {
    if (selectedConv?.unread > 0) {
      setConversations((prev) => {
        const updated = {
          ...prev,
          [role]: {
            ...prev[role],
            [selectedConvId]: { ...prev[role][selectedConvId], unread: 0 },
          },
        };
        Storage.set(STORAGE_KEYS.conversations, updated);
        return updated;
      });
    }
  }, [selectedConvId, selectedConv?.unread, role]);

  // ═══════════════════════════════════════════════════════════
  // DELETE CONVERSATION
  // ═══════════════════════════════════════════════════════════
  const handleDeleteConversation = useCallback((convId) => {
    const key = String(convId);
    const updatedConversations = { ...conversations };
    const roleConvs = updatedConversations[role] || {};
    const { [key]: deleted, ...remaining } = roleConvs;
    updatedConversations[role] = remaining;
    setConversations(updatedConversations);
    Storage.set(STORAGE_KEYS.conversations, updatedConversations);

    // Also delete associated messages
    const updatedMessages = { ...allMessages };
    const roleMsgs = updatedMessages[role] || {};
    const { [key]: deletedMsgs, ...remainingMsgs } = roleMsgs;
    updatedMessages[role] = remainingMsgs;
    setAllMessages(updatedMessages);
    Storage.set(STORAGE_KEYS.messages, updatedMessages);

    // If the deleted conversation was selected, clear selection
    if (String(selectedConvId) === key) {
      setSelectedConvId(null);
    }
  }, [conversations, allMessages, selectedConvId, role]);

  // ═══════════════════════════════════════════════════════════
  // THEME TOKENS
  // ═══════════════════════════════════════════════════════════
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

  const filteredConversations = Object.values(roleConversations).filter((conv) =>
    conv.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleNotifications = () => {
    if (Notification.permission === 'granted') {
      setNotificationEnabled((prev) => !prev);
    } else {
      requestNotificationPermission();
    }
  };

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
                  <Avatar initials={conv.avatar} size={48} online={conv.online} borderColor={c.sidebarBg} />

                  <div className="conv-item__body">
                    <div className="conv-item__top">
                      <span className="conv-item__name" style={{ fontWeight: conv.unread > 0 ? '700' : '600', color: isActive ? c.activeConvText : c.text }}>
                        {conv.name}
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
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ── Chat Window ── */}
      <div className="messaging-chat" style={{ background: c.chatBg }}>

        <div className="messaging-chat__header" style={{ borderBottom: `1px solid ${c.border}` }}>
          <Avatar initials={selectedConv?.avatar || 'XX'} size={40} online={selectedConv?.online} />
          <div className="messaging-chat__header-info">
            <h3 style={{ color: c.text }}>
              {selectedConv?.name}
              <span className="messaging-chat__header-role" style={{ color: c.secondaryText }}>
                {role === 'tenant' ? '· Landlord' : '· Tenant'}
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
                  {isReceived && <Avatar initials={selectedConv?.avatar || 'XX'} size={32} />}
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
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <div className="messaging-chat__input-area" style={{ borderTop: `1px solid ${c.border}` }}>
          <button className="input-icon-btn" style={{ background: c.inputBg }}>😊</button>

          <input
            type="text"
            placeholder="Aa"
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            className="messaging-chat__text-input"
            style={{ border: `1px solid ${c.border}`, background: c.inputBg, color: c.text }}
          />

          <button className="input-icon-btn" style={{ background: c.inputBg, fontSize: '18px' }}>📎</button>

          <button
            className="send-btn"
            onClick={sendMessage}
            disabled={!messageInput.trim()}
            style={{ opacity: messageInput.trim() ? 1 : 0.5 }}
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
          <button
            onClick={() => {
              const convId = contextMenuOpen;
              setContextMenuOpen(null);
              navigate(`/profile/${convId}`);
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
              const conv = roleConversations[contextMenuOpen];
              setContextMenuOpen(null);
              navigate('/report', { state: { reportedUser: conv?.name, conversationId: contextMenuOpen } });
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
              const conv = roleConversations[convId];
              setContextMenuOpen(null);
              if (window.confirm(`Delete chat with ${conv?.name}?`)) {
                handleDeleteConversation(convId);
              }
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
        </div>
      )}
    </div>
  );
}
