import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Send, Trash2 } from 'lucide-react';
import { messagesAPI } from '../../../utils/api';
import { isBroadcastMessage, isSupportMessage, parseSupportContent, sendAdminDirectMessage } from '../../../utils/adminMessaging';
import './AdminMessaging.css';

const PRIMARY = '#E8622E';

function initialsFromName(name = '') {
  return name.split(' ').filter(Boolean).map((p) => p[0]).join('').toUpperCase().slice(0, 2) || '??';
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

export default function AdminSupportInbox({
  darkMode = false,
  adminUser,
  supportMessages = [],
  selectedSupportId,
  onSelectSupport,
  onDeleteSupport,
  onNotice,
}) {
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const [threadMessages, setThreadMessages] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  const adminId = adminUser?.id;

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return supportMessages.filter((item) => {
      const preview = item.message || item.lastMessage || '';
      if (item.isLocalSupport) return true;
      if (!isSupportMessage(preview) && !item.isDirectUser) return false;
      if (isBroadcastMessage(preview)) return false;
      if (!q) return true;
      return `${item.name || ''} ${item.subject || ''} ${preview}`.toLowerCase().includes(q);
    });
  }, [supportMessages, searchQuery]);

  const selected = useMemo(
    () => filtered.find((m) => m.id === selectedSupportId) || filtered[0] || null,
    [filtered, selectedSupportId]
  );

  const activeConvId = selected?.conversationId || selected?.id;

  useEffect(() => {
    if (!selected && filtered[0]?.id) onSelectSupport?.(filtered[0].id);
  }, [selected, filtered, onSelectSupport]);

  const loadThread = useCallback(async () => {
    if (!selected) {
      setThreadMessages([]);
      return;
    }
    if (selected.isLocalSupport) {
      setThreadMessages([
        {
          id: selected.id,
          senderId: selected.otherUserId || selected.userId,
          content: selected.message || selected.lastMessage,
          createdAt: selected.createdAt,
        },
      ]);
      return;
    }
    if (!activeConvId || !adminId || selected?.isDirectUser) {
      setThreadMessages([]);
      return;
    }
    const data = await messagesAPI.getConversationMessages(activeConvId);
    setThreadMessages(Array.isArray(data) ? data : []);
  }, [activeConvId, adminId, selected]);

  useEffect(() => {
    loadThread();
    const timer = setInterval(loadThread, 4000);
    return () => clearInterval(timer);
  }, [loadThread]);

  const handleReply = async () => {
    if (!selected || !reply.trim() || !adminId) return;
    const recipientId = selected.otherUserId ?? selected.userId;
    if (!recipientId) {
      onNotice?.('Invalid recipient.', 'is-bad');
      return;
    }
    setSending(true);
    const ok = await sendAdminDirectMessage(adminId, recipientId, reply.trim());
    setSending(false);
    if (!ok) {
      onNotice?.('Failed to send reply.', 'is-bad');
      return;
    }
    setReply('');
    await loadThread();
    onNotice?.(`Reply sent to ${selected.name || 'user'}.`, 'is-good');
  };

  const theme = darkMode
    ? { panel: '#1a1a2e', chat: '#0f172a', text: '#fff', muted: '#a0a0b0', border: '#2a2a4a', input: '#0f3460' }
    : { panel: '#fff', chat: '#f5f5f5', text: '#1a1a1a', muted: '#65676b', border: '#e4e6eb', input: '#f0f2f5' };

  const concernPreview = selected
    ? parseSupportContent(selected.message || selected.lastMessage || `[${selected.subject || 'Support'}]`)
    : null;

  const displayMessages = threadMessages.filter((m) => isSupportMessage(m.content) || !isBroadcastMessage(m.content));

  return (
    <div className={`admin-messaging ${darkMode ? 'dark' : 'light'}`}>
      <div className="admin-messaging-layout" style={{ borderColor: theme.border }}>
        <aside className="admin-messaging-sidebar" style={{ background: theme.panel, borderColor: theme.border }}>
          <div className="admin-messaging-sidebar-head">
            <h3 style={{ color: theme.text }}>Support Inbox</h3>
          </div>
          <input
            type="search"
            className="admin-messaging-search"
            placeholder="Search support concerns..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ background: theme.input, borderColor: theme.border, color: theme.text }}
          />
          <div className="admin-messaging-list">
            {filtered.length === 0 ? (
              <p className="admin-messaging-empty" style={{ color: theme.muted }}>No support concerns yet.</p>
            ) : (
              filtered.map((item) => {
                const active = selected?.id === item.id;
                const parsed = parseSupportContent(item.message || item.lastMessage || `[${item.subject}]`);
                return (
                  <button
                    key={item.id}
                    type="button"
                    className={`admin-messaging-conv ${active ? 'active' : ''}`}
                    style={{ background: active ? PRIMARY : 'transparent', color: active ? '#fff' : theme.text }}
                    onClick={() => onSelectSupport?.(item.id)}
                  >
                    <span className="admin-messaging-avatar">{initialsFromName(item.name)}</span>
                    <span className="admin-messaging-conv-body">
                      <span className="admin-messaging-conv-top">
                        <strong>{item.name || 'User'}</strong>
                        <small>{formatTime(item.createdAt)}</small>
                      </span>
                      <span className="admin-messaging-preview">{parsed.subject}</span>
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        <section className="admin-messaging-chat" style={{ background: theme.chat }}>
          {selected ? (
            <>
              <header className="admin-messaging-chat-head" style={{ borderColor: theme.border, background: theme.panel }}>
                <span className="admin-messaging-avatar">{initialsFromName(selected.name)}</span>
                <div style={{ flex: 1 }}>
                  <h4 style={{ color: theme.text }}>{selected.name || 'User'}</h4>
                  <p style={{ color: theme.muted }}>{selected.email || ''} · {concernPreview?.subject || 'Support'}</p>
                </div>
                <button type="button" className="admin-messaging-broadcast-btn" style={{ background: '#fee2e2', color: '#991b1b' }} onClick={() => onDeleteSupport?.(selected.id)}>
                  <Trash2 size={14} />
                </button>
              </header>

              {concernPreview?.body ? (
                <div style={{ margin: '12px 16px', padding: 12, borderRadius: 10, background: 'rgba(91,173,168,0.14)', color: theme.text }}>
                  <strong>Original concern:</strong> {concernPreview.body}
                </div>
              ) : null}

              <div className="admin-messaging-messages">
                {displayMessages.map((msg) => {
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
                })}
              </div>

              <footer className="admin-messaging-compose" style={{ borderColor: theme.border, background: theme.panel }}>
                <textarea
                  placeholder="Type your support reply..."
                  rows={2}
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  style={{ background: theme.input, borderColor: theme.border, color: theme.text }}
                />
                <button type="button" className="admin-messaging-send" onClick={handleReply} disabled={sending || !reply.trim()}>
                  <Send size={16} />
                  Reply
                </button>
              </footer>
            </>
          ) : (
            <div className="admin-messaging-empty-state" style={{ color: theme.muted }}>
              Select a support concern to reply.
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
