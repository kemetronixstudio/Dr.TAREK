
const CLEANUP_EVERY = 100;
function isHttps(req) {
  return String(req.headers['x-forwarded-proto'] || '').includes('https') || !!(req.connection && req.connection.encrypted);
}
function cookieOptions(req) {
  return 'Path=/; HttpOnly; SameSite=Lax; Max-Age=43200' + ((process.env.NODE_ENV === 'production' || isHttps(req)) ? '; Secure' : '');
}
function setAuthCookie(req, res, token) {
  if (!token) return;
  res.setHeader('Set-Cookie', `kgAccessToken=${encodeURIComponent(token)}; ${cookieOptions(req)}`);
}
function allowedOrigins(req) {
  const configured = String(process.env.ALLOWED_ORIGINS || '').split(',').map(v => v.trim()).filter(Boolean);
  const origin = String(req.headers.origin || '').trim();
  if (origin && configured.includes(origin)) return origin;
  return configured[0] || '';
}
function applyCors(req, res) {
  const origin = allowedOrigins(req);
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,DELETE,OPTIONS');
  }
  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return true;
  }
  return false;
}
function clientIp(req) {
  return String((req.socket && req.socket.remoteAddress) || (req.connection && req.connection.remoteAddress) || '').trim() || 'unknown';
}
function limiterStore() {
  if (!globalThis.__KG_LOGIN_LIMITER__) globalThis.__KG_LOGIN_LIMITER__ = new Map();
  return globalThis.__KG_LOGIN_LIMITER__;
}
function checkRateLimit(req, key) {
  const store = limiterStore();
  const now = Date.now();
  const bucketKey = `${clientIp(req)}:${String(key || '').toLowerCase()}`;
  const max = Number(process.env.LOGIN_RATE_LIMIT_MAX || 10);
  const windowMs = Number(process.env.LOGIN_RATE_LIMIT_WINDOW_MS || 10 * 60 * 1000);
  if (!globalThis.__KG_LOGIN_LIMITER_COUNT__) globalThis.__KG_LOGIN_LIMITER_COUNT__ = 0;
  globalThis.__KG_LOGIN_LIMITER_COUNT__ += 1;
  if (globalThis.__KG_LOGIN_LIMITER_COUNT__ % CLEANUP_EVERY === 0) {
    for (const [k, v] of store.entries()) {
      if (!v || v.resetAt <= now) store.delete(k);
    }
  }
  const rec = store.get(bucketKey);
  if (!rec || rec.resetAt <= now) {
    store.set(bucketKey, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: max - 1 };
  }
  if (rec.count >= max) return { ok: false, retryAfter: Math.max(1, Math.ceil((rec.resetAt - now)/1000)) };
  rec.count += 1;
  store.set(bucketKey, rec);
  return { ok: true, remaining: max - rec.count };
}
module.exports = { applyCors, setAuthCookie, checkRateLimit };
