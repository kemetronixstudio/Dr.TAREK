const backend = require('../../lib/access-accounts-backend');
const security = require('../../lib/api-security');

module.exports = async function handler(req, res) {
  if (security.applyCors(req, res)) return;
  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: 'Method not allowed' }));
    return;
  }
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const limit = security.checkRateLimit(req, body.user || 'login');
    if (!limit.ok) {
      res.statusCode = 429;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ ok:false, error:'Too many login attempts. Please try again later.' }));
      return;
    }
    const account = await backend.authenticate(body.user, body.pass);
    if (!account) {
      res.statusCode = 401;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ ok: false, error: 'Wrong admin name or password.' }));
      return;
    }
    const token = backend.createTokenForAccount(account);
    await backend.appendLog({ action: 'login', actor: account.user, target: account.user, role: account.role, detail: `Logged in as ${account.role || 'admin'}`, createdAt: new Date().toISOString() });
security.setAuthCookie(req, res, token);
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ ok: true, account }));
  } catch (error) {
    res.statusCode = error.status || 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: error.message || 'Login failed' }));
  }
};
