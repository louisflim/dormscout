import React, { useState } from 'react';
import './Messaging.css';

const PRIMARY = '#E8622E';

const AVATAR_COLORS = ['#5BADA8', '#E8622E', '#7C3AED', '#059669', '#DC2626'];

// Role-based conversation data
const CONVERSATIONS_BY_ROLE = {
  tenant: [
    { id: 1, name: 'Rosa Macaraeg', avatar: 'RM', online: true,  lastMessage: 'Thank you for your inquiry!',       timestamp: '1 day ago',  unread: false },
    { id: 2, name: 'Pedro Lim',     avatar: 'PL', online: false, lastMessage: 'December 1st should work.',         timestamp: '2 days ago', unread: true  },
    { id: 3, name: 'Carlo Reyes',   avatar: 'CR', online: true,  lastMessage: 'The deposit is 1 month advance',   timestamp: '3 days ago', unread: false },
    { id: 4, name: 'Diana Santos',  avatar: 'DS', online: false, lastMessage: 'WiFi is included in the rent',     timestamp: '4 days ago', unread: false },
    { id: 5, name: 'Marco Tan',     avatar: 'MT', online: true,  lastMessage: 'You can visit anytime this week',  timestamp: '5 days ago', unread: false },
  ],
  landlord: [
    { id: 1, name: 'Maria Santos',   avatar: 'MS', online: true,  lastMessage: 'Is the room still available?',    timestamp: '2 hours ago', unread: true  },
    { id: 2, name: 'Juan Dela Cruz', avatar: 'JD', online: false, lastMessage: 'I will visit this Saturday',      timestamp: '5 hours ago', unread: false },
    { id: 3, name: 'Ana Reyes',      avatar: 'AR', online: true,  lastMessage: 'How much is the deposit?',        timestamp: '3 days ago',  unread: false },
    { id: 4, name: 'Bea Lim',        avatar: 'BL', online: false, lastMessage: 'Can I move in on December 1?',   timestamp: '4 days ago',  unread: true  },
    { id: 5, name: 'Chris Gomez',    avatar: 'CG', online: true,  lastMessage: 'Is WiFi included?',              timestamp: '5 days ago',  unread: false },
  ],
};

const CHAT_MESSAGES_BY_ROLE = {
  tenant: {
    1: [
      { id: 1, sender: 'sent',     text: 'Hi, I saw your listing for the boarding house near USC. Is the room still available?', timestamp: '10:30 AM' },
      { id: 2, sender: 'received', text: 'Hi! Yes, the room is still available. Would you like to schedule a viewing?' },
      { id: 3, sender: 'sent',     text: 'Yes please! Can I visit this Saturday?' },
      { id: 4, sender: 'received', text: "Saturday works! Come at 2 PM. I'll be at the property." },
      { id: 5, sender: 'sent',     text: 'Thank you! See you then.' },
      { id: 6, sender: 'received', text: 'Thank you for your inquiry!' },
    ],
    2: [
      { id: 1, sender: 'sent',     text: "Hello! I'm interested in the room near CIT-U.", timestamp: '9:15 AM' },
      { id: 2, sender: 'received', text: "Hi there! Great choice. It's a quiet neighborhood." },
      { id: 3, sender: 'sent',     text: 'Can I move in on December 1?' },
      { id: 4, sender: 'received', text: 'December 1st should work. Let me confirm and get back to you.' },
    ],
    3: [
      { id: 1, sender: 'sent',     text: 'Hi, how much is the monthly rent?', timestamp: '3:45 PM' },
      { id: 2, sender: 'received', text: "It's ₱4,500 per month including water." },
      { id: 3, sender: 'sent',     text: 'How much is the deposit?' },
      { id: 4, sender: 'received', text: 'The deposit is 1 month advance and 1 month deposit.' },
    ],
    4: [
      { id: 1, sender: 'sent',     text: 'Good day! Is WiFi included in the rent?', timestamp: '11:20 AM' },
      { id: 2, sender: 'received', text: 'Yes! WiFi is included. 50mbps fiber connection.' },
      { id: 3, sender: 'sent',     text: "That's great! Are utilities separate?" },
      { id: 4, sender: 'received', text: 'WiFi is included in the rent. Only electricity is separate.' },
    ],
    5: [
      { id: 1, sender: 'sent',     text: 'Hi, is there still a room available near UP Cebu?', timestamp: '8:30 AM' },
      { id: 2, sender: 'received', text: "Yes! I have one room left. It's a single occupancy." },
      { id: 3, sender: 'sent',     text: 'Can I come visit this week?' },
      { id: 4, sender: 'received', text: 'You can visit anytime this week. Just message me before coming.' },
    ],
  },
  landlord: {
    1: [
      { id: 1, sender: 'received', text: "Hi, I'm interested in your boarding house listing near USC", timestamp: '10:30 AM' },
      { id: 2, sender: 'received', text: 'Is the room still available?' },
      { id: 3, sender: 'sent',     text: 'Hi Maria! Yes, the room is available. Would you like to schedule a viewing?' },
      { id: 4, sender: 'received', text: 'Sure! Can we schedule it for this weekend?' },
      { id: 5, sender: 'sent',     text: 'Of course! Saturday at 2 PM works for me. Does that suit you?' },
    ],
    2: [
      { id: 1, sender: 'received', text: 'Hello! I saw your listing for the dorm', timestamp: '9:15 AM' },
      { id: 2, sender: 'sent',     text: 'Hi Juan! Thanks for reaching out. How can I help?' },
      { id: 3, sender: 'received', text: 'I will visit this Saturday' },
      { id: 4, sender: 'sent',     text: 'Great! Looking forward to seeing you. Come by at 10 AM.' },
    ],
    3: [
      { id: 1, sender: 'received', text: 'How much is the deposit?', timestamp: '3:45 PM' },
      { id: 2, sender: 'sent',     text: 'The deposit is 1 month advance and 1 month deposit.' },
      { id: 3, sender: 'received', text: 'That sounds reasonable. Can I reserve a room?' },
      { id: 4, sender: 'sent',     text: "Sure! I'll hold the room for you. Just need a copy of your ID." },
    ],
    4: [
      { id: 1, sender: 'received', text: "Hello, I'm looking for a place to rent near campus", timestamp: '11:20 AM' },
      { id: 2, sender: 'sent',     text: 'Hi Bea! I have a great room available. ₱4,500/month.' },
      { id: 3, sender: 'received', text: 'Can I move in on December 1?' },
      { id: 4, sender: 'sent',     text: 'December 1st should work. Let me prepare the contract.' },
    ],
    5: [
      { id: 1, sender: 'received', text: 'Good day! Is WiFi included in the rent?', timestamp: '8:30 AM' },
      { id: 2, sender: 'sent',     text: 'Yes! WiFi is included. We have 50mbps fiber.' },
      { id: 3, sender: 'received', text: 'Is WiFi included?' },
      { id: 4, sender: 'sent',     text: "You're welcome to visit anytime. Just let me know ahead." },
    ],
  },
};

/* ─────────────────────────── Avatar ─────────────────────────── */
function Avatar({ initials, size = 42, online = false, borderColor = '#16213e' }) {
  const colorIndex = (initials.charCodeAt(0) + (initials.charCodeAt(1) || 0)) % AVATAR_COLORS.length;

  return (
    <div className="avatar-wrapper" style={{ width: size, height: size }}>
      <div
        className="avatar-circle"
        style={{
          width: size,
          height: size,
          background: AVATAR_COLORS[colorIndex],
          fontSize: size * 0.38,
        }}
      >
        {initials}
      </div>

      {online && (
        <div
          className="avatar-online-dot"
          style={{
            width: size * 0.35,
            height: size * 0.35,
            borderColor,
          }}
        />
      )}
    </div>
  );
}

/* ─────────────────────────── Messaging ─────────────────────────── */
export default function Messaging({ darkMode = false, userType = 'tenant' }) {
  const role = userType;
  const conversations = CONVERSATIONS_BY_ROLE[role] || CONVERSATIONS_BY_ROLE.tenant;
  const chatData     = CHAT_MESSAGES_BY_ROLE[role] || CHAT_MESSAGES_BY_ROLE.tenant;

  const [selectedConvId, setSelectedConvId] = useState(conversations[0]?.id || 1);
  const [searchQuery,    setSearchQuery]    = useState('');
  const [messageInput,   setMessageInput]   = useState('');
  const [messages,       setMessages]       = useState(chatData);

  // ── Theme tokens ──────────────────────────────────────────────
  const dk = darkMode;
  const c = {
    mainBg:          dk ? '#1a1a2e'              : '#ffffff',
    sidebarBg:       dk ? '#16213e'              : '#ffffff',
    chatBg:          dk ? '#16213e'              : '#f5f5f5',
    inputBg:         dk ? '#0f3460'              : '#f0f2f5',
    text:            dk ? '#ffffff'              : '#1a1a1a',
    secondaryText:   dk ? '#a0a0b0'              : '#65676b',
    receivedBubble:  dk ? '#1e3a5f'              : '#e4e6eb',
    receivedText:    dk ? '#ffffff'              : '#1a1a1a',
    activeConv:      PRIMARY,
    activeConvText:  '#ffffff',
    unreadDot:       PRIMARY,
    border:          dk ? '#2a2a4a'              : '#e4e6eb',
    hoverBg:         dk ? '#1e2849'              : '#f2f2f2',
  };

  const selectedConv         = conversations.find((cv) => cv.id === selectedConvId);
  const filteredConversations = conversations.filter((conv) =>
    conv.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSendMessage = () => {
    if (!messageInput.trim()) return;
    setMessages((prev) => ({
      ...prev,
      [selectedConvId]: [
        ...(prev[selectedConvId] || []),
        { id: Date.now(), sender: 'sent', text: messageInput },
      ],
    }));
    setMessageInput('');
  };

  /* ── Render ── */
  return (
    <div className="messaging-wrapper" style={{ background: c.mainBg }}>

      {/* ── Sidebar ── */}
      <div
        className="messaging-sidebar"
        style={{ background: c.sidebarBg, borderRight: `1px solid ${c.border}` }}
      >
        {/* Header */}
        <div className="messaging-sidebar__header" style={{ borderBottom: `1px solid ${c.border}` }}>
          <h2 className="messaging-sidebar__title" style={{ color: c.text }}>Messages</h2>
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="messaging-sidebar__search"
            style={{
              border: `1px solid ${c.border}`,
              background: c.inputBg,
              color: c.text,
            }}
          />
        </div>

        {/* Conversation list */}
        <div className="messaging-sidebar__list">
          {filteredConversations.map((conv) => {
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
                <Avatar
                  initials={conv.avatar}
                  size={48}
                  online={conv.online}
                  borderColor={c.sidebarBg}
                />

                <div className="conv-item__body">
                  <div className="conv-item__top">
                    <span
                      className="conv-item__name"
                      style={{
                        fontWeight: conv.unread ? '700' : '600',
                        color: isActive ? c.activeConvText : c.text,
                      }}
                    >
                      {conv.name}
                    </span>
                    {conv.unread && (
                      <div
                        className="conv-item__unread-dot"
                        style={{ background: c.unreadDot }}
                      />
                    )}
                  </div>

                  <p
                    className="conv-item__preview"
                    style={{
                      color: isActive ? 'rgba(255,255,255,0.8)' : c.secondaryText,
                      fontWeight: conv.unread ? '600' : '400',
                    }}
                  >
                    {conv.lastMessage}
                  </p>
                </div>

                <span
                  className="conv-item__time"
                  style={{ color: isActive ? 'rgba(255,255,255,0.8)' : c.secondaryText }}
                >
                  {conv.timestamp}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Chat Window ── */}
      <div className="messaging-chat" style={{ background: c.chatBg }}>

        {/* Header */}
        <div
          className="messaging-chat__header"
          style={{ borderBottom: `1px solid ${c.border}` }}
        >
          <Avatar initials={selectedConv?.avatar || 'XX'} size={40} online={selectedConv?.online} />
          <div className="messaging-chat__header-info">
            <h3 style={{ color: c.text }}>
              {selectedConv?.name}
              <span className="messaging-chat__header-role" style={{ color: c.secondaryText }}>
                {role === 'tenant' ? '(Landlord)' : '(Tenant)'}
              </span>
            </h3>
            <p className="messaging-chat__header-status" style={{ color: c.secondaryText }}>
              {selectedConv?.online ? 'Active now' : 'Active 2h ago'}
            </p>
          </div>
        </div>

        {/* Messages */}
        <div className="messaging-chat__messages">
          {(messages[selectedConvId] || []).map((msg) => {
            const isReceived = msg.sender === 'received';
            return (
              <div key={msg.id}>
                {msg.timestamp && (
                  <div className="msg-timestamp" style={{ color: c.secondaryText }}>
                    {msg.timestamp}
                  </div>
                )}
                <div className={`msg-row msg-row--${isReceived ? 'received' : 'sent'}`}>
                  {isReceived && (
                    <Avatar initials={selectedConv?.avatar || 'XX'} size={32} />
                  )}
                  <div
                    className={`msg-bubble ${isReceived ? '' : 'msg-bubble--sent'}`}
                    style={
                      isReceived
                        ? { background: c.receivedBubble, color: c.receivedText }
                        : undefined /* .msg-bubble--sent handles sent colors */
                    }
                  >
                    {msg.text}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Input area */}
        <div
          className="messaging-chat__input-area"
          style={{ borderTop: `1px solid ${c.border}` }}
        >
          <button className="input-icon-btn" style={{ background: c.inputBg }}>😊</button>

          <input
            type="text"
            placeholder="Aa"
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            className="messaging-chat__text-input"
            style={{
              border: `1px solid ${c.border}`,
              background: c.inputBg,
              color: c.text,
            }}
          />

          <button className="input-icon-btn" style={{ background: c.inputBg, fontSize: '18px' }}>📎</button>

          <button className="send-btn" onClick={handleSendMessage}>➤</button>
        </div>
      </div>
    </div>
  );
}