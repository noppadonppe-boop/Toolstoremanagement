const SESSION_KEY = 'cmg_session_expires';
const SESSION_DURATION_MS = 60 * 60 * 1000; // 1 hour

export function setSessionExpiry() {
  const expiry = Date.now() + SESSION_DURATION_MS;
  localStorage.setItem(SESSION_KEY, String(expiry));
}

export function isSessionExpired() {
  const expiry = localStorage.getItem(SESSION_KEY);
  if (!expiry) return true;
  return Date.now() > parseInt(expiry, 10);
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

export function getRemainingMinutes() {
  const expiry = localStorage.getItem(SESSION_KEY);
  if (!expiry) return 0;
  const remaining = parseInt(expiry, 10) - Date.now();
  return Math.max(0, Math.ceil(remaining / 60000));
}
