const backend = require('../../lib/access-accounts-backend');
const apiSecurity = require('../../lib/api-security');


module.exports = async function handler(req, res) {
  if (apiSecurity.handlePreflight(req, res)) return;
  apiSecurity.applyApiHeaders(req, res);
  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: 'Method not allowed' }));
    return;
  }
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const limit = apiSecurity.consumeLoginRateLimit(req, body.user);
    if (limit.blocked) {
      res.statusCode = 429;
      res.setHeader('Retry-After', String(limit.retryAfter));
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ ok: false, error: 'Too many login attempts. Please try again later.' }));
      return;
    }
    const account = await backend.authenticate(body.user, body.pass);
    if (!account) {
      res.statusCode = 401;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ ok: false, error: 'Wrong admin name or password.' }));
      return;
    }
    apiSecurity.clearLoginRateLimit(req, body.user);
    const token = backend.createTokenForAccount(account);
    await backend.appendLog({ action: 'login', actor: account.user, target: account.user, role: account.role, detail: `Logged in as ${account.role || 'admin'}`, createdAt: new Date().toISOString() });
    apiSecurity.setAuthCookie(req, res, token);
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ ok: true, token, account }));
  } catch (error) {
    res.statusCode = error.status || 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: error.message || 'Login failed' }));
  }
};
