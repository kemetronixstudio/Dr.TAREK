const backend = require('../../lib/access-accounts-backend');

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
      const accounts = await backend.mergedAccounts();
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ ok: true, accounts: accounts.map(backend.publicAccount) }));
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
      const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
      const result = await backend.saveAccount(body, auth.account);
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(result));
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
      const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
      const result = await backend.deleteAccount(body, auth.account);
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(result));
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
