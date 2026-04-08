function isProductionLike() {
  return process.env.VERCEL === '1' || process.env.NODE_ENV === 'production';
}

function securityHeaders(res) {
  if (!res || typeof res.setHeader !== 'function') return;
  res.setHeader('Cache-Control', 'no-store, no-cache, max-age=0, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'same-origin');
}

function sendJson(res, statusCode, payload, extraHeaders) {
  if (!res) return;
  securityHeaders(res);
  if (extraHeaders && typeof extraHeaders === 'object') {
    Object.keys(extraHeaders).forEach((key) => {
      if (typeof extraHeaders[key] !== 'undefined') res.setHeader(key, extraHeaders[key]);
    });
  }
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(payload));
}

function parseJsonBody(req) {
  const raw = req && typeof req.body !== 'undefined' ? req.body : undefined;
  if (typeof raw === 'string') {
    const text = raw.trim();
    return text ? JSON.parse(text) : {};
  }
  if (raw && typeof raw === 'object') return raw;
  return {};
}

function authCookie(token, maxAgeSeconds) {
  if (!token) return '';
  const parts = [
    `kgAccessToken=${encodeURIComponent(token)}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${Math.max(0, Number(maxAgeSeconds || 43200) || 43200)}`
  ];
  if (isProductionLike()) parts.push('Secure');
  return parts.join('; ');
}

function setAuthCookie(res, token, maxAgeSeconds) {
  const value = authCookie(token, maxAgeSeconds);
  if (value && res && typeof res.setHeader === 'function') res.setHeader('Set-Cookie', value);
}

module.exports = {
  authCookie,
  isProductionLike,
  parseJsonBody,
  securityHeaders,
  sendJson,
  setAuthCookie
};
