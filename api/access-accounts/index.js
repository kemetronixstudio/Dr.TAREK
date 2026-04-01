const backend = require('../../lib/access-accounts-backend');

function setAuthCookie(res, token) {
  if (token) res.setHeader('Set-Cookie', `kgAccessToken=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=43200`);
}

module.exports = async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const auth = await backend.requireAdmin(req);
      if (!auth.ok) {
        res.statusCode = auth.status;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ ok: false, error: auth.error }));
        return;
      }
      setAuthCookie(res, auth.token);
      const action = String((req.query && (req.query.action || req.query.mode)) || '').trim().toLowerCase();
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      if (action === 'me') {
        res.end(JSON.stringify({ ok: true, account: auth.account, token: auth.token }));
        return;
      }
      if (action === 'logs') {
        const logs = await backend.readLogs();
        res.end(JSON.stringify({ ok: true, logs, token: auth.token }));
        return;
      }
      const accounts = await backend.mergedAccounts();
      res.end(JSON.stringify({ ok: true, accounts: accounts.map(backend.publicAccount), token: auth.token }));
      return;
    }

    if (req.method === 'POST') {
      const auth = await backend.requireAdmin(req);
      if (!auth.ok) {
        res.statusCode = auth.status;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ ok: false, error: auth.error }));
        return;
      }
      setAuthCookie(res, auth.token);
      const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
      const result = await backend.saveAccount(body, auth.account);
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ ...result, token: result.token || auth.token }));
      return;
    }

    if (req.method === 'DELETE') {
      const auth = await backend.requireAdmin(req);
      if (!auth.ok) {
        res.statusCode = auth.status;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ ok: false, error: auth.error }));
        return;
      }
      setAuthCookie(res, auth.token);
      const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
      const result = await backend.deleteAccount(body, auth.account);
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ ...result, token: auth.token }));
      return;
    }

    res.statusCode = 405;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: 'Method not allowed' }));
  } catch (error) {
    res.statusCode = error.status || 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: error.message || 'Request failed' }));
  }
};
