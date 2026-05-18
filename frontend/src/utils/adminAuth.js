const ADMIN_SESSION_KEY = 'dormscout_admin_session';
const SESSION_TTL_MS = 8 * 60 * 60 * 1000;

export function readAdminSession() {
  try {
    const raw = sessionStorage.getItem(ADMIN_SESSION_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw);
    if (!session?.token || !session?.user) return null;
    if (session.expiresAt && Date.now() > session.expiresAt) {
      clearAdminSession();
      return null;
    }
    if (String(session.user.userType || '').toLowerCase() !== 'admin') {
      clearAdminSession();
      return null;
    }
    return session;
  } catch {
    clearAdminSession();
    return null;
  }
}

export function saveAdminSession(user, token, expiresInSeconds) {
  const ttlMs = expiresInSeconds ? expiresInSeconds * 1000 : SESSION_TTL_MS;
  const session = {
    user,
    token,
    expiresAt: Date.now() + ttlMs,
  };
  sessionStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(session));
  return session;
}

export function clearAdminSession() {
  sessionStorage.removeItem(ADMIN_SESSION_KEY);
}

export function isAdminSessionValid() {
  return Boolean(readAdminSession());
}

export function getAdminAuthHeaders(extra = {}) {
  const session = readAdminSession();
  if (!session?.token) return { ...extra };
  return {
    ...extra,
    Authorization: `Bearer ${session.token}`,
  };
}

/** Authenticated fetch for admin-only API routes. */
export async function adminFetch(url, options = {}) {
  const session = readAdminSession();
  if (!session?.token) {
    throw new Error('Admin session expired. Please sign in again.');
  }

  const headers = getAdminAuthHeaders({
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  });

  const response = await fetch(url, { ...options, headers });

  if (response.status === 401 || response.status === 403) {
    clearAdminSession();
    throw new Error('Admin session expired or access denied.');
  }

  return response;
}
