const backend = require('../../lib/access-accounts-backend');
const { parseJsonBody, sendJson, setAuthCookie } = require('../../lib/http-utils');

module.exports = async function handler(req, res) {
  try {
    const query = req.query || {};
    const action = String((query.action || query.mode) || '').trim().toLowerCase();

    if (req.method === 'GET' && action === 'me') {
      const auth = await backend.requireAuthorized(req, null);
      if (!auth.ok) return sendJson(res, auth.status, { ok: false, error: auth.error });
      setAuthCookie(res, auth.token);
      return sendJson(res, 200, { ok: true, account: auth.account, token: auth.token });
    }

    if (req.method === 'GET') {
      const auth = await backend.requireAdmin(req);
      if (!auth.ok) return sendJson(res, auth.status, { ok: false, error: auth.error });
      setAuthCookie(res, auth.token);
      if (action === 'logs') {
        const logs = await backend.readLogs();
        return sendJson(res, 200, { ok: true, logs, token: auth.token, account: auth.account });
      }
      const accounts = await backend.mergedAccounts();
      return sendJson(res, 200, { ok: true, accounts: accounts.map(backend.publicAccount), token: auth.token, account: auth.account });
    }

    if (req.method === 'POST') {
      const auth = await backend.requireAdmin(req);
      if (!auth.ok) return sendJson(res, auth.status, { ok: false, error: auth.error });
      setAuthCookie(res, auth.token);
      const body = parseJsonBody(req);
      const result = await backend.saveAccount(body, auth.account);
      if (result.token) setAuthCookie(res, result.token);
      return sendJson(res, 200, { ...result, token: result.token || auth.token });
    }

    if (req.method === 'DELETE') {
      const auth = await backend.requireAdmin(req);
      if (!auth.ok) return sendJson(res, auth.status, { ok: false, error: auth.error });
      setAuthCookie(res, auth.token);
      const body = parseJsonBody(req);
      const result = await backend.deleteAccount(body, auth.account);
      return sendJson(res, 200, { ...result, token: auth.token, account: auth.account });
    }

    return sendJson(res, 405, { ok: false, error: 'Method not allowed' });
  } catch (error) {
    return sendJson(res, error.status || 500, { ok: false, error: error.message || 'Request failed' });
  }
};
