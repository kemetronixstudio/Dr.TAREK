const backend = require('../../lib/access-accounts-backend');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
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
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const result = await backend.changePassword(body, auth.account);
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(result));
  } catch (error) {
    res.statusCode = error.status || 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: error.message || 'Request failed' }));
  }
};
