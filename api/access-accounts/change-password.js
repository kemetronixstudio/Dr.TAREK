const backend = require('../../lib/access-accounts-backend');
const { parseJsonBody, sendJson, setAuthCookie } = require('../../lib/http-utils');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return sendJson(res, 405, { ok: false, error: 'Method not allowed' });
  try {
    const auth = await backend.requireAdmin(req);
    if (!auth.ok) return sendJson(res, auth.status, { ok: false, error: auth.error });
    setAuthCookie(res, auth.token);
    const body = parseJsonBody(req);
    const result = await backend.changePassword(body, auth.account);
    if (result.token) setAuthCookie(res, result.token);
    return sendJson(res, 200, { ...result, token: result.token || auth.token, account: result.currentAccount || auth.account });
  } catch (error) {
    return sendJson(res, error.status || 500, { ok: false, error: error.message || 'Request failed' });
  }
};
