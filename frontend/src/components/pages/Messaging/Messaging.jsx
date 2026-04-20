import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  tenant: {
    1: { id: 1, name: 'Rosa Macaraeg', avatar: 'RM', online: true,  lastMessage: 'Thank you for your inquiry!',       timestamp: Date.now() - 86400000, unread: 0 },
    2: { id: 2, name: 'Pedro Lim',     avatar: 'PL', online: false, lastMessage: 'December 1st should work.',         timestamp: Date.now() - 172800000, unread: 1 },
    3: { id: 3, name: 'Carlo Reyes',   avatar: 'CR', online: true,  lastMessage: 'The deposit is 1 month advance',   timestamp: Date.now() - 259200000, unread: 0 },
    4: { id: 4, name: 'Diana Santos',  avatar: 'DS', online: false, lastMessage: 'WiFi is included in the rent',     timestamp: Date.now() - 345600000, unread: 0 },
    5: { id: 5, name: 'Marco Tan',     avatar: 'MT', online: true,  lastMessage: 'You can visit anytime this week',  timestamp: Date.now() - 432000000, unread: 0 },
  },
  landlord: {
    1: { id: 1, name: 'Maria Santos',   avatar: 'MS', online: true,  lastMessage: 'Is the room still available?',    timestamp: Date.now() - 7200000, unread: 1 },
    2: { id: 2, name: 'Juan Dela Cruz', avatar: 'JD', online: false, lastMessage: 'I will visit this Saturday',      timestamp: Date.now() - 18000000, unread: 0 },
    3: { id: 3, name: 'Ana Reyes',      avatar: 'AR', online: true,  lastMessage: 'How much is the deposit?',        timestamp: Date.now() - 259200000, unread: 0 },
    4: { id: 4, name: 'Bea Lim',        avatar: 'BL', online: false, lastMessage: 'Can I move in on December 1?',     timestamp: Date.now() - 345600000, unread: 1 },
    5: { id: 5, name: 'Chris Gomez',    avatar: 'CG', online: true,  lastMessage: 'Is WiFi included?',              timestamp: Date.now() - 432000000, unread: 0 },
  },
};

const INITIAL_SHARED_MESSAGES = {
  tenant: {
    1: [
      { id: 1, sender: 'sent',     text: 'Hi, I saw your listing for the boarding house near USC. Is the room still available?', timestamp: Date.now() - 3600000, status: 'read' },
      { id: 2, sender: 'received', text: 'Hi! Yes, the room is still available. Would you like to schedule a viewing?' },
      { id: 3, sender: 'sent',     text: 'Yes please! Can I visit this Saturday?' },
      { id: 4, sender: 'received', text: "Saturday works! Come at 2 PM. I'll be at the property." },
      { id: 5, sender: 'sent',     text: 'Thank you! See you then.' },
      { id: 6, sender: 'received', text: 'Thank you for your inquiry!', timestamp: Date.now() - 86400000, status: 'read' },
    ],
    2: [
      { id: 1, sender: 'sent',     text: "Hello! I'm interested in the room near CIT-U.", timestamp: Date.now() - 172800000 },
      { id: 2, sender: 'received', text: "Hi there! Great choice. It's a quiet neighborhood." },
      { id: 3, sender: 'sent',     text: 'Can I move in on December 1?' },
      { id: 4, sender: 'received', text: 'December 1st should work. Let me confirm and get back to you.', timestamp: Date.now() - 172800000, status: 'delivered' },
    ],
    3: [
      { id: 1, sender: 'sent',     text: 'Hi, how much is the monthly rent?', timestamp: Date.now() - 259200000 },
      { id: 2, sender: 'received', text: "It's ₱4,500 per month including water." },
      { id: 3, sender: 'sent',     text: 'How much is the deposit?' },
      { id: 4, sender: 'received', text: 'The deposit is 1 month advance and 1 month deposit.', timestamp: Date.now() - 259200000, status: 'read' },
    ],
    4: [
      { id: 1, sender: 'sent',     text: 'Good day! Is WiFi included in the rent?', timestamp: Date.now() - 345600000 },
      { id: 2, sender: 'received', text: 'Yes! WiFi is included. 50mbps fiber connection.' },
      { id: 3, sender: 'sent',     text: "That's great! Are utilities separate?" },
      { id: 4, sender: 'received', text: 'WiFi is included in the rent. Only electricity is separate.', timestamp: Date.now() - 345600000, status: 'read' },
    ],
    5: [
      { id: 1, sender: 'sent',     text: 'Hi, is there still a room available near UP Cebu?', timestamp: Date.now() - 432000000 },
      { id: 2, sender: 'received', text: "Yes! I have one room left. It's a single occupancy." },
      { id: 3, sender: 'sent',     text: 'Can I come visit this week?' },
      { id: 4, sender: 'received', text: 'You can visit anytime this week. Just message me before coming.', timestamp: Date.now() - 432000000, status: 'read' },
    ],
  },
  landlord: {
    1: [
      { id: 1, sender: 'received', text: "Hi, I'm interested in your boarding house listing near USC", timestamp: Date.now() - 7200000 },
      { id: 2, sender: 'received', text: 'Is the room still available?' },
      { id: 3, sender: 'sent',     text: 'Hi Maria! Yes, the room is available. Would you like to schedule a viewing?' },
      { id: 4, sender: 'received', text: 'Sure! Can we schedule it for this weekend?' },
      { id: 5, sender: 'sent',     text: 'Of course! Saturday at 2 PM works for me. Does that suit you?', status: 'read' },
    ],
    2: [
      { id: 1, sender: 'received', text: 'Hello! I saw your listing for the dorm', timestamp: Date.now() - 18000000 },
      { id: 2, sender: 'sent',     text: 'Hi Juan! Thanks for reaching out. How can I help?' },
      { id: 3, sender: 'received', text: 'I will visit this Saturday' },
      { id: 4, sender: 'sent',     text: 'Great! Looking forward to seeing you. Come by at 10 AM.', status: 'read' },
    ],
    3: [
      { id: 1, sender: 'received', text: 'How much is the deposit?', timestamp: Date.now() - 259200000 },
      { id: 2, sender: 'sent',     text: 'The deposit is 1 month advance and 1 month deposit.', status: 'read' },
      { id: 3, sender: 'received', text: 'That sounds reasonable. Can I reserve a room?' },
      { id: 4, sender: 'sent',     text: "Sure! I'll hold the room for you. Just need a copy of your ID.", status: 'read' },
    ],
    4: [
      { id: 1, sender: 'received', text: "Hello, I'm looking for a place to rent near campus", timestamp: Date.now() - 345600000 },
      { id: 2, sender: 'sent',     text: 'Hi Bea! I have a great room available. ₱4,500/month.', status: 'read' },
      { id: 3, sender: 'received', text: 'Can I move in on December 1?' },
      { id: 4, sender: 'sent',     text: "December 1st should work. Let me prepare the contract.", status: 'read' },
    ],
    5: [
      { id: 1, sender: 'received', text: 'Good day! Is WiFi included in the rent?', timestamp: Date.now() - 432000000 },
      { id: 2, sender: 'sent',     text: 'Yes! WiFi is included. We have 50mbps fiber.', status: 'read' },
      { id: 3, sender: 'received', text: 'Is WiFi included?' },
      { id: 4, sender: 'sent',     text: "You're welcome to visit anytime. Just let me know ahead.", status: 'read' },
    ],
  },
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
export default function Messaging({ darkMode = false, userType = 'tenant' }) {
  const role = userType;

  useEffect(() => {
    initializeStorage();
    requestNotificationPermission();
  }, []);

  // State from localStorage
  const [conversations, setConversations] = useState(() =>
    Storage.get(STORAGE_KEYS.conversations) || INITIAL_SHARED_CONVERSATIONS
  );
  const [allMessages, setAllMessages] = useState(() =>
    Storage.get(STORAGE_KEYS.messages) || INITIAL_SHARED_MESSAGES
  );

  // UI State
  const [selectedConvId, setSelectedConvId] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [messageInput, setMessageInput] = useState('');
  const [notificationEnabled, setNotificationEnabled] = useState(
    Notification.permission === 'granted'
  );

  // Refs
  const messagesEndRef = useRef(null);
  const lastMessageIdRef = useRef(null);

  // Get role-specific data
  const roleConversations = conversations[role] || {};
  const roleMessages = allMessages[role] || {};
  const messages = roleMessages[selectedConvId] || [];
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
          const otherRole = role === 'tenant' ? 'landlord' : 'tenant';
          const newUnread = newConversations[role]?.[selectedConvId]?.unread || 0;
          const oldUnread = conversations[role]?.[selectedConvId]?.unread || 0;

          if (newUnread > oldUnread) {
            const convName = newConversations[role]?.[selectedConvId]?.name;
            const lastMsg = newConversations[role]?.[selectedConvId]?.lastMessage;
            if (convName && lastMsg) {
              showDesktopNotification(convName, lastMsg);
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

    // Create new message
    const newMessage = {
      id: Date.now(),
      sender: 'sent',
      text: messageInput,
      timestamp: Date.now(),
      status: 'sent',
    };

    // Update messages
    const updatedMessages = [...messages, newMessage];
    const newAllMessages = { ...allMessages };
    newAllMessages[role] = { ...roleMessages, [selectedConvId]: updatedMessages };
    setAllMessages(newAllMessages);
    Storage.set(STORAGE_KEYS.messages, newAllMessages);

    // Update last message in conversation
    const updatedConversations = { ...conversations };
    updatedConversations[role][selectedConvId] = {
      ...selectedConv,
      lastMessage: messageInput,
      timestamp: Date.now(),
    };
    setConversations(updatedConversations);
    Storage.set(STORAGE_KEYS.conversations, updatedConversations);

    // Clear input
    setMessageInput('');

    // Show notification if enabled
    if (notificationEnabled) {
      showDesktopNotification('Message sent', messageInput.substring(0, 50));
    }

    // Mark as delivered after 1 second
    setTimeout(() => {
      const deliveredMessages = [...updatedMessages];
      const lastMsg = deliveredMessages[deliveredMessages.length - 1];
      if (lastMsg) {
        lastMsg.status = 'delivered';
        const finalAllMessages = { ...newAllMessages };
        finalAllMessages[role] = { ...roleMessages, [selectedConvId]: deliveredMessages };
        setAllMessages(finalAllMessages);
        Storage.set(STORAGE_KEYS.messages, finalAllMessages);
      }
    }, 1000);

    // Mark as read after 2 seconds
    setTimeout(() => {
      const readMessages = [...updatedMessages];
      const lastMsg = readMessages[readMessages.length - 1];
      if (lastMsg) {
        lastMsg.status = 'read';
        const finalAllMessages = { ...newAllMessages };
        finalAllMessages[role] = { ...roleMessages, [selectedConvId]: readMessages };
        setAllMessages(finalAllMessages);
        Storage.set(STORAGE_KEYS.messages, finalAllMessages);
      }
    }, 2000);
  }, [messageInput, selectedConv, selectedConvId, role, messages, allMessages, roleMessages, notificationEnabled]);

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
    <div className="messaging-wrapper" style={{ background: c.mainBg }}>

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
                {role === 'tenant' ? '(Landlord)' : '(Tenant)'}
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
                  <div className={`msg-bubble ${isReceived ? '' : 'msg-bubble--sent'}`} style={
                    isReceived
                      ? { background: c.receivedBubble, color: c.receivedText }
                      : { background: c.sentBubble, color: c.sentText }
                  }>
                    {msg.text}
                    {!isReceived && msg.status && (
                      <StatusIndicator status={msg.status} darkMode={darkMode} />
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
    </div>
  );
}
