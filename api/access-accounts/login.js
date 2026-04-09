const backend = require('../../lib/access-accounts-backend');

function setAuthCookie(res, token) {
  res.setHeader('Set-Cookie', `kgAccessToken=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=43200`);
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: 'Method not allowed' }));
    return;
  }
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const account = await backend.authenticate(body.user, body.pass, req);
    if (!account) {
      res.statusCode = 401;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ ok: false, error: 'Wrong admin name or password.' }));
      return;
    }
    const token = backend.createTokenForAccount(account);
    await backend.appendLog({ action: 'login', actor: account.user, target: account.user, role: account.role, detail: `Logged in as ${account.role || 'admin'}`, createdAt: new Date().toISOString() });
    setAuthCookie(res, token);
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ ok: true, token, account }));
  } catch (error) {
    res.statusCode = error.status || 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: error.message || 'Login failed' }));
  }
};
