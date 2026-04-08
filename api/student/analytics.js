const backend = require('../../lib/student-cloud-backend');
const access = require('../../lib/access-accounts-backend');
const { sendJson, setAuthCookie } = require('../../lib/http-utils');

module.exports = async function handler(req, res) {
  try {
    const url = new URL(req.url, 'http://localhost');
    const action = String(url.searchParams.get('action') || '').trim().toLowerCase();

    if (req.method === 'POST' && action === 'reset-all') {
      const auth = await access.requireAdmin(req);
      if (!auth.ok) return sendJson(res, auth.status, { ok: false, error: auth.error });
      setAuthCookie(res, auth.token);
      const result = await backend.resetAllStudentData();
      return sendJson(res, 200, { ...result, token: auth.token, account: auth.account });
    }

    if (req.method !== 'GET') return sendJson(res, 405, { ok: false, error: 'Method not allowed' });

    const auth = await access.requireAuthorized(req, 'dashboard');
    if (!auth.ok) return sendJson(res, auth.status, { ok: false, error: auth.error });
    setAuthCookie(res, auth.token);
    const result = await backend.analytics({
      q: url.searchParams.get('q') || '',
      className: url.searchParams.get('className') || '',
      status: 'completed'
    });
    return sendJson(res, 200, { ...result, token: auth.token, account: auth.account });
  } catch (error) {
    return sendJson(res, error.status || 500, { ok: false, error: error.message || 'Request failed' });
  }
};
