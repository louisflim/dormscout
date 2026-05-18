export const ADMIN_BROADCASTS_KEY = 'dormscout_admin_messages';
export const SUPPORT_MESSAGES_KEY = 'dormscout_support_messages';

export const buildConversationId = (idA, idB) => {
  const [a, b] = [Number(idA), Number(idB)].sort((x, y) => x - y);
  return `conv_${a}_${b}`;
};

export const isBroadcastMessage = (text = '') =>
  String(text).trim().startsWith('[BROADCAST]');

export const isSupportMessage = (text = '') => {
  const value = String(text).trim();
  if (!value || isBroadcastMessage(value)) return false;
  if (value.startsWith('[SUPPORT]')) return true;
  return /^\[[^\]]+\]/.test(value);
};

/** Verification outcomes belong in Notifications, not the admin message thread. */
export function isVerificationNoticeMessage(text = '') {
  const raw = String(text || '').trim();
  if (!raw) return false;
  if (isBroadcastMessage(raw)) {
    const lower = raw.toLowerCase();
    return (
      lower.includes('verification') &&
      (lower.includes('approved') ||
        lower.includes('rejected') ||
        lower.includes('pending') ||
        lower.includes('verified landlord'))
    );
  }
  const lower = raw.toLowerCase();
  return (
    lower.includes('your business verification was approved') ||
    lower.includes('your business verification was rejected') ||
    lower.includes('business verification is pending') ||
    lower.includes('business verification request was submitted') ||
    lower.includes('you are now a verified landlord')
  );
}

export function formatSupportContent(subject, message) {
  return `[SUPPORT][${String(subject || 'Support').trim()}] ${String(message || '').trim()}`;
}

/** Display text for a message in the DormScout Admin system thread. */
export function formatAdminThreadText(content = '', isReceived = true) {
  const raw = String(content || '').trim();
  if (!raw) return '';
  if (isBroadcastMessage(raw)) {
    return parseBroadcastContent(raw).body || raw;
  }
  if (isSupportMessage(raw)) {
    const { subject, body } = parseSupportContent(raw);
    return isReceived ? body || subject : `Support request: ${subject}${body ? ` — ${body}` : ''}`;
  }
  return raw;
}

/** Map a persisted API message into a DormScout Admin thread bubble. */
export function mapAdminThreadMessage(msg, currentUserId) {
  if (isVerificationNoticeMessage(msg?.content)) return null;
  const isReceived = Number(msg?.senderId) !== Number(currentUserId);
  return {
    id: `api-admin-${msg.id}`,
    sender: isReceived ? 'received' : 'sent',
    text: formatAdminThreadText(msg.content, isReceived),
    timestamp: msg.createdAt ? new Date(msg.createdAt).getTime() : Date.now(),
  };
}

export function partnerIdFromConversationId(conversationId, currentUserId) {
  if (!conversationId || !String(conversationId).startsWith('conv_')) return null;
  const parts = String(conversationId).replace('conv_', '').split('_').map(Number);
  const selfId = Number(currentUserId);
  return parts.find((id) => Number.isFinite(id) && id !== selfId) ?? null;
}

export const parseBroadcastContent = (text = '') => {
  const raw = String(text).trim();
  if (!raw.startsWith('[BROADCAST]')) return { subject: 'Admin', body: raw };
  const rest = raw.slice('[BROADCAST]'.length).trim();
  const subjectMatch = rest.match(/^\[([^\]]+)\]\s*(.*)$/s);
  if (subjectMatch) {
    return { subject: subjectMatch[1], body: subjectMatch[2] || '' };
  }
  return { subject: 'DormScout Admin', body: rest };
};

export const parseSupportContent = (text = '') => {
  let raw = String(text).trim();
  if (raw.startsWith('[SUPPORT]')) {
    raw = raw.slice('[SUPPORT]'.length).trim();
  }
  const match = raw.match(/^\[([^\]]+)\]\s*(.*)$/s);
  if (match) return { subject: match[1], body: match[2] || '' };
  return { subject: 'Support concern', body: raw };
};

/** Submissions saved locally when the user is offline or the API call fails. */
export function readLocalSupportSubmissions() {
  try {
    const raw = JSON.parse(localStorage.getItem(SUPPORT_MESSAGES_KEY) || '[]');
    return (Array.isArray(raw) ? raw : []).map((item) => {
      const formatted =
        item.message && isSupportMessage(item.message)
          ? item.message
          : formatSupportContent(item.subject, item.message);
      const { subject } = parseSupportContent(formatted);
      return {
        id: item.id || `local-support-${item.createdAt || Date.now()}`,
        conversationId: item.id,
        otherUserId: item.userId,
        userId: item.userId,
        name: item.name || 'Guest',
        email: item.email || '',
        subject,
        message: formatted,
        lastMessage: formatted,
        replied: Boolean(item.replied),
        createdAt: item.createdAt || new Date().toISOString(),
        isLocalSupport: true,
      };
    });
  } catch {
    return [];
  }
}

export function mergeSupportInboxLists(apiItems = [], localItems = []) {
  const merged = [...apiItems];
  const partnerIds = new Set(
    apiItems.map((item) => Number(item.otherUserId)).filter(Number.isFinite)
  );
  localItems.forEach((item) => {
    const pid = Number(item.otherUserId);
    if (Number.isFinite(pid) && partnerIds.has(pid)) return;
    if (merged.some((m) => m.id === item.id)) return;
    merged.push(item);
  });
  return merged.sort(
    (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
  );
}

export async function fetchAdminUser() {
  try {
    const res = await fetch('http://localhost:8080/api/users/type/admin');
    if (!res.ok) return null;
    const json = await res.json();
    const list = Array.isArray(json) ? json : json?.data || [];
    return list[0] || null;
  } catch {
    return null;
  }
}

export async function sendSupportToAdmin({ senderId, adminId, subject, message }) {
  if (!senderId || !adminId) return false;
  return sendAdminDirectMessage(senderId, adminId, formatSupportContent(subject, message));
}

export async function sendAdminDirectMessage(adminId, recipientId, content) {
  const convId = buildConversationId(adminId, recipientId);
  const res = await fetch(
    `http://localhost:8080/api/messages?senderId=${adminId}&receiverId=${recipientId}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content, conversationId: convId }),
    }
  );
  return res.ok;
}

export async function createUserActivity(userId, type, text, nav = 'messages') {
  try {
    await fetch(
      `http://localhost:8080/api/activities?userId=${userId}&type=${encodeURIComponent(type)}&text=${encodeURIComponent(text)}&time=just%20now&nav=${encodeURIComponent(nav)}`,
      { method: 'POST' }
    );
  } catch {
    /* non-blocking */
  }
}

/** Notify a report reporter via DormScout Admin broadcast + activity. */
export async function notifyReporterAboutReport({ adminId, report, outcome }) {
  const reporterId = report?.reporterId;
  if (!adminId || !reporterId) return false;

  const subjectLine = report?.subject || report?.reason || 'your report';
  const label = outcome === 'resolved' ? 'resolved' : 'dismissed';
  const body =
    outcome === 'resolved'
      ? `Your report about "${subjectLine}" has been resolved. Thank you for helping keep DormScout safe.`
      : `Your report about "${subjectLine}" was reviewed and dismissed. Contact support if you have questions.`;

  const content = `[BROADCAST][Report ${label}] ${body}`;
  const sent = await sendAdminDirectMessage(adminId, reporterId, content);
  await createUserActivity(
    reporterId,
    'report_update',
    `DormScout Admin: Your report was ${label}.`,
    'messages'
  );
  return sent;
}

export async function sendAdminBroadcast(adminId, users, role, subject, message) {
  const recipients =
    role === 'all' ? users : users.filter((u) => String(u.userType || u.role || '').toLowerCase() === role);

  const content = `[BROADCAST][${subject.trim()}] ${message.trim()}`;
  await Promise.all(
    recipients.map((u) =>
      sendAdminDirectMessage(adminId, u.id, content).catch(() => false)
    )
  );
}
