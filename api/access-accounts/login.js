const backend = require('../../lib/access-accounts-backend');
const { parseJsonBody, sendJson, setAuthCookie } = require('../../lib/http-utils');

const LIMIT_WINDOW_MS = 10 * 60 * 1000;
const LIMIT_MAX_FAILURES = 8;

function bucket() {
  globalThis.__KG_LOGIN_RATE_LIMIT__ = globalThis.__KG_LOGIN_RATE_LIMIT__ || new Map();
  return globalThis.__KG_LOGIN_RATE_LIMIT__;
}

function clientKey(req, user) {
  const forwarded = String((req.headers && (req.headers['x-forwarded-for'] || req.headers['x-real-ip'])) || '').split(',')[0].trim();
  return `${forwarded || 'unknown'}::${String(user || '').trim().toLowerCase()}`;
}

function consumeFailure(key) {
  const store = bucket();
  const now = Date.now();
  const row = store.get(key) || { count: 0, firstAt: now };
  if (now - row.firstAt > LIMIT_WINDOW_MS) {
    row.count = 0;
    row.firstAt = now;
  }
  row.count += 1;
  store.set(key, row);
  return row;
}

function clearFailures(key) {
  bucket().delete(key);
}

function isRateLimited(key) {
  const row = bucket().get(key);
  if (!row) return false;
  if (Date.now() - row.firstAt > LIMIT_WINDOW_MS) {
    bucket().delete(key);
    return false;
  }
  return row.count >= LIMIT_MAX_FAILURES;
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return sendJson(res, 405, { ok: false, error: 'Method not allowed' });
  try {
    const body = parseJsonBody(req);
    const user = String(body.user || '').trim();
    const key = clientKey(req, user);
    if (isRateLimited(key)) {
      return sendJson(res, 429, { ok: false, error: 'Too many failed login attempts. Please wait a few minutes and try again.' });
    }
    const password = typeof body.pass !== 'undefined' ? body.pass : body.password;
    const account = await backend.authenticate(user, password);
    if (!account) {
      consumeFailure(key);
      return sendJson(res, 401, { ok: false, error: 'Wrong admin name or password.' });
    }
    clearFailures(key);
    const token = backend.createTokenForAccount(account);
    await backend.appendLog({ action: 'login', actor: account.user, target: account.user, role: account.role, detail: `Logged in as ${account.role || 'admin'}`, createdAt: new Date().toISOString() });
    setAuthCookie(res, token);
    return sendJson(res, 200, { ok: true, token, account });
  } catch (error) {
    return sendJson(res, error.status || 500, { ok: false, error: error.message || 'Login failed' });
  }
};
