const backend = require('../../lib/student-cloud-backend');
const access = require('../../lib/access-accounts-backend');
const { parseJsonBody, sendJson, setAuthCookie } = require('../../lib/http-utils');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return sendJson(res, 405, { ok: false, error: 'Method not allowed' });
  try {
    const auth = await access.requireAuthorized(req, 'dashboard');
    if (!auth.ok) return sendJson(res, auth.status, { ok: false, error: auth.error });
    setAuthCookie(res, auth.token);
    const body = parseJsonBody(req);
    const result = await backend.saveTeacherNote({ ...body, author: auth.account && auth.account.user ? auth.account.user : '' });
    return sendJson(res, 200, { ...result, token: auth.token, account: auth.account });
  } catch (error) {
    return sendJson(res, error.status || 500, { ok: false, error: error.message || 'Request failed' });
  }
};
