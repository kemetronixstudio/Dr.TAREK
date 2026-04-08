const LOGIN_WINDOW_MS = Number(process.env.ACCESS_LOGIN_WINDOW_MS || 15 * 60 * 1000);
const LOGIN_MAX_ATTEMPTS = Number(process.env.ACCESS_LOGIN_MAX_ATTEMPTS || 8);

function allowedOrigins(req) {
  const configured = String(process.env.ALLOWED_ORIGINS || process.env.APP_ORIGIN || '').split(',').map((item) => item.trim()).filter(Boolean);
  const host = String(req && req.headers && (req.headers['x-forwarded-host'] || req.headers.host) || '').trim();
  const proto = String(req && req.headers && (req.headers['x-forwarded-proto'] || '') || '').trim() || (process.env.NODE_ENV === 'production' ? 'https' : 'http');
  if (host) configured.push(`${proto}://${host}`);
  return Array.from(new Set(configured));
}

function applyApiHeaders(req, res) {
  const origin = String(req && req.headers && req.headers.origin || '').trim();
  const allowed = allowedOrigins(req);
  res.setHeader('Vary', 'Origin');
  if (origin && allowed.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Access-User, X-Access-Pass');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  }
}

function handlePreflight(req, res) {
  applyApiHeaders(req, res);
  if (req && req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return true;
  }
  return false;
}

function isSecureRequest(req) {
  const forwarded = String(req && req.headers && req.headers['x-forwarded-proto'] || '').trim().toLowerCase();
  return forwarded === 'https' || process.env.NODE_ENV === 'production';
}

function setAuthCookie(req, res, token) {
  if (!token) return;
  const parts = [
    `kgAccessToken=${encodeURIComponent(token)}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    'Max-Age=43200'
  ];
  if (isSecureRequest(req)) parts.push('Secure');
  res.setHeader('Set-Cookie', parts.join('; '));
}

function loginLimiterStore() {
  globalThis.__KG_LOGIN_LIMITER__ = globalThis.__KG_LOGIN_LIMITER__ || new Map();
  return globalThis.__KG_LOGIN_LIMITER__;
}

function clientIp(req) {
  const forwarded = String(req && req.headers && req.headers['x-forwarded-for'] || '').split(',')[0].trim();
  return forwarded || String(req && req.socket && req.socket.remoteAddress || 'unknown').trim() || 'unknown';
}

function consumeLoginRateLimit(req, user) {
  const now = Date.now();
  const store = loginLimiterStore();
  const key = `${clientIp(req)}::${String(user || '').trim().toLowerCase()}`;
  const entry = store.get(key) || { count: 0, resetAt: now + LOGIN_WINDOW_MS };
  if (now > entry.resetAt) {
    entry.count = 0;
    entry.resetAt = now + LOGIN_WINDOW_MS;
  }
  entry.count += 1;
  store.set(key, entry);
  if (entry.count > LOGIN_MAX_ATTEMPTS) {
    const retryAfter = Math.max(1, Math.ceil((entry.resetAt - now) / 1000));
    return { blocked: true, retryAfter };
  }
  return { blocked: false, retryAfter: 0 };
}

function clearLoginRateLimit(req, user) {
  const store = loginLimiterStore();
  const key = `${clientIp(req)}::${String(user || '').trim().toLowerCase()}`;
  store.delete(key);
}

module.exports = {
  applyApiHeaders,
  handlePreflight,
  setAuthCookie,
  consumeLoginRateLimit,
  clearLoginRateLimit
};
