import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Megaphone, Send } from 'lucide-react';
import { messagesAPI } from '../../../utils/api';
import {
  isBroadcastMessage,
  isSupportMessage,
  parseSupportContent,
  sendAdminBroadcast,
  sendAdminDirectMessage,
} from '../../../utils/adminMessaging';
import './AdminMessaging.css';

const PRIMARY = '#E8622E';

function initialsFromName(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .map((p) => p[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || '??';
}

function formatTime(value) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  if (Date.now() - d.getTime() < 86400000) {
    return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  }
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

export default function AdminMessaging({
  darkMode = false,
  adminUser,
  users = [],
  conversations = [],
  selectedConversationId,
  onSelectConversation,
  onConversationRead,
  onNotice,
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [threadMessages, setThreadMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [sending, setSending] = useState(false);
  const [showBroadcast, setShowBroadcast] = useState(false);
  const [broadcastRole, setBroadcastRole] = useState('tenant');
  const [broadcastSubject, setBroadcastSubject] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');

  const adminId = adminUser?.id;

  const filteredConversations = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return conversations.filter((conv) => {
      const preview = conv.message || conv.lastMessage || '';
      if (isBroadcastMessage(preview)) return false;
      if (!q) return true;
      const parsed = isSupportMessage(preview) ? parseSupportContent(preview) : null;
      const searchPreview = parsed
        ? `${parsed.subject} ${parsed.body}`
        : preview;
      return `${conv.name || ''} ${conv.email || ''} ${searchPreview}`.toLowerCase().includes(q);
    });
  }, [conversations, searchQuery]);

  const selectedConv = useMemo(() => {
    if (selectedConversationId) {
      const match =
        conversations.find((c) => c.id === selectedConversationId) ||
        conversations.find((c) => c.conversationId === selectedConversationId);
      if (match) return match;
    }
    if (!selectedConversationId) {
      return filteredConversations[0] || null;
    }
    return null;
  }, [conversations, filteredConversations, selectedConversationId]);

  const activeConvId = selectedConv?.conversationId || selectedConv?.id;

  useEffect(() => {
    if (selectedConversationId) return;
    if (!selectedConv && filteredConversations[0]?.id) {
      onSelectConversation?.(filteredConversations[0].id);
    }
  }, [selectedConv, filteredConversations, onSelectConversation, selectedConversationId]);

  const loadThread = useCallback(async () => {
    if (!activeConvId || !adminId) {
      setThreadMessages([]);
      return;
    }
    const data = await messagesAPI.getConversationMessages(activeConvId);
    setThreadMessages(Array.isArray(data) ? data : []);
  }, [activeConvId, adminId]);

  useEffect(() => {
    loadThread();
    const timer = setInterval(loadThread, 4000);
    return () => clearInterval(timer);
  }, [loadThread]);

  useEffect(() => {
    if (!activeConvId || !adminId) return undefined;

    let cancelled = false;
    const markRead = async () => {
      await messagesAPI.markConversationRead(activeConvId, adminId);
      if (cancelled) return;
      onConversationRead?.(activeConvId);
      window.dispatchEvent(new Event('dormscout:messagesUpdated'));
    };

    markRead();
    const timer = setInterval(markRead, 3000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [activeConvId, adminId, onConversationRead]);

  const handleSend = async () => {
    if (!messageInput.trim() || !selectedConv || !adminId) return;
    const recipientId = selectedConv.otherUserId ?? selectedConv.userId;
    if (!recipientId) {
      onNotice?.('Invalid recipient.', 'is-bad');
      return;
    }
    setSending(true);
    const ok = await sendAdminDirectMessage(adminId, recipientId, messageInput.trim());
    setSending(false);
    if (!ok) {
      onNotice?.('Failed to send message.', 'is-bad');
      return;
    }
    setMessageInput('');
    await loadThread();
    onNotice?.(`Message sent to ${selectedConv.name || 'user'}.`, 'is-good');
  };

  const handleBroadcast = async () => {
    if (!broadcastSubject.trim() || !broadcastMessage.trim()) {
      onNotice?.('Please provide both subject and message.', 'is-pending');
      return;
    }
    if (!adminId) {
      onNotice?.('Admin session missing.', 'is-bad');
      return;
    }
    setSending(true);
    try {
      await sendAdminBroadcast(
        adminId,
        users.filter((u) => String(u.userType || '').toLowerCase() !== 'admin'),
        broadcastRole,
        broadcastSubject,
        broadcastMessage
      );
      setBroadcastSubject('');
      setBroadcastMessage('');
      setShowBroadcast(false);
      onNotice?.('Broadcast sent to selected users.', 'is-good');
    } catch {
      onNotice?.('Failed to send broadcast.', 'is-bad');
    } finally {
      setSending(false);
    }
  };

  const theme = darkMode
    ? { panel: '#1a1a2e', chat: '#0f172a', text: '#fff', muted: '#a0a0b0', border: '#2a2a4a', input: '#0f3460' }
    : { panel: '#fff', chat: '#f5f5f5', text: '#1a1a1a', muted: '#65676b', border: '#e4e6eb', input: '#f0f2f5' };

  const displayMessages = threadMessages.filter((m) => !isBroadcastMessage(m.content));

  return (
    <div className={`admin-messaging ${darkMode ? 'dark' : 'light'}`}>
      <div className="admin-messaging-layout" style={{ borderColor: theme.border }}>
        <aside className="admin-messaging-sidebar" style={{ background: theme.panel, borderColor: theme.border }}>
          <div className="admin-messaging-sidebar-head">
            <h3 style={{ color: theme.text }}>Messages</h3>
            <button type="button" className="admin-messaging-broadcast-btn" onClick={() => setShowBroadcast((v) => !v)}>
              <Megaphone size={16} />
              Broadcast
            </button>
          </div>

          {showBroadcast ? (
            <div className="admin-messaging-broadcast-panel" style={{ borderColor: theme.border, background: theme.input }}>
              <select value={broadcastRole} onChange={(e) => setBroadcastRole(e.target.value)}>
                <option value="landlord">All Landlords</option>
                <option value="tenant">All Tenants</option>
                <option value="all">Everyone</option>
              </select>
              <input type="text" placeholder="Subject" value={broadcastSubject} onChange={(e) => setBroadcastSubject(e.target.value)} />
              <textarea placeholder="Message" rows={3} value={broadcastMessage} onChange={(e) => setBroadcastMessage(e.target.value)} />
              <button type="button" className="admin-messaging-send" onClick={handleBroadcast} disabled={sending}>
                Send Broadcast
              </button>
            </div>
          ) : null}

          <input
            type="search"
            className="admin-messaging-search"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ background: theme.input, borderColor: theme.border, color: theme.text }}
          />

          <div className="admin-messaging-list">
            {filteredConversations.length === 0 ? (
              <p className="admin-messaging-empty" style={{ color: theme.muted }}>
                No direct conversations yet. Message a user from the Users table.
              </p>
            ) : (
              filteredConversations.map((conv) => {
                const active = selectedConv?.id === conv.id;
                const rawPreview = conv.lastMessage || conv.message || '';
                const listPreview = isSupportMessage(rawPreview)
                  ? (parseSupportContent(rawPreview).body || parseSupportContent(rawPreview).subject)
                  : (rawPreview || 'Start a conversation');
                return (
                  <button
                    key={conv.conversationId || conv.id}
                    type="button"
                    className={`admin-messaging-conv ${active ? 'active' : ''}`}
                    style={{ background: active ? PRIMARY : 'transparent', color: active ? '#fff' : theme.text }}
                    onClick={() => onSelectConversation?.(conv.id)}
                  >
                    <span className="admin-messaging-avatar">{initialsFromName(conv.name)}</span>
                    <span className="admin-messaging-conv-body">
                      <span className="admin-messaging-conv-top">
                        <strong>{conv.name || 'User'}</strong>
                        <small>{formatTime(conv.createdAt || conv.lastMessageTime)}</small>
                      </span>
                      <span className="admin-messaging-preview" style={{ opacity: active ? 0.9 : 0.72 }}>
                        {listPreview}
                      </span>
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        <section className="admin-messaging-chat" style={{ background: theme.chat }}>
          {selectedConv ? (
            <>
              <header className="admin-messaging-chat-head" style={{ borderColor: theme.border, background: theme.panel }}>
                <span className="admin-messaging-avatar">{initialsFromName(selectedConv.name)}</span>
                <div>
                  <h4 style={{ color: theme.text }}>{selectedConv.name || 'User'}</h4>
                  <p style={{ color: theme.muted }}>
                    {selectedConv.email || ''}
                    {isSupportMessage(selectedConv.lastMessage || selectedConv.message || '')
                      ? ` · ${parseSupportContent(selectedConv.lastMessage || selectedConv.message).subject || 'Support'}`
                      : ' · Direct message'}
                  </p>
                </div>
              </header>

              <div className="admin-messaging-messages">
                {displayMessages.length === 0 ? (
                  <p className="admin-messaging-empty" style={{ color: theme.muted }}>
                    No messages yet. Send the first reply below.
                  </p>
                ) : (
                  displayMessages.map((msg) => {
                    const isAdmin = Number(msg.senderId) === Number(adminId);
                    return (
                      <div
                        key={msg.id}
                        className={`admin-messaging-bubble ${isAdmin ? 'sent' : 'received'}`}
                        style={{
                          background: isAdmin ? PRIMARY : theme.panel,
                          color: isAdmin ? '#fff' : theme.text,
                          borderColor: theme.border,
                        }}
                      >
                        {msg.content}
                      </div>
                    );
                  })
                )}
              </div>

              <footer className="admin-messaging-compose" style={{ borderColor: theme.border, background: theme.panel }}>
                <textarea
                  placeholder="Type a message..."
                  rows={2}
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  style={{ background: theme.input, borderColor: theme.border, color: theme.text }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                />
                <button type="button" className="admin-messaging-send" onClick={handleSend} disabled={sending || !messageInput.trim()}>
                  <Send size={16} />
                  Send
                </button>
              </footer>
            </>
          ) : (
            <div className="admin-messaging-empty-state" style={{ color: theme.muted }}>
              Select a conversation or message a user from the Users section.
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
