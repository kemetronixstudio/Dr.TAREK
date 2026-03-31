const backend = require('../../lib/access-accounts-backend');

function setAuthCookie(res, token) {
  if (token) res.setHeader('Set-Cookie', `kgAccessToken=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=43200`);
}

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    res.statusCode = 405;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: 'Method not allowed' }));
    return;
  }
  try {
    const auth = await backend.requireAdmin(req);
    if (!auth.ok) {
      res.statusCode = auth.status;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ ok: false, error: auth.error }));
      return;
    }
    setAuthCookie(res, auth.token);
    const logs = await backend.readLogs();
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ ok: true, logs, token: auth.token }));
  } catch (error) {
    res.statusCode = error.status || 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: error.message || 'Request failed' }));
  }
};
