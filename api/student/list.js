const backend = require('../../lib/student-cloud-backend');
const access = require('../../lib/access-accounts-backend');
const { sendJson, setAuthCookie } = require('../../lib/http-utils');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') return sendJson(res, 405, { ok: false, error: 'Method not allowed' });
  try {
    const auth = await access.requireAuthorized(req, 'dashboard');
    if (!auth.ok) return sendJson(res, auth.status, { ok: false, error: auth.error });
    setAuthCookie(res, auth.token);
    const url = new URL(req.url, 'http://localhost');
    const result = await backend.listRecords({
      q: url.searchParams.get('q') || '',
      className: url.searchParams.get('className') || '',
      status: url.searchParams.get('status') || ''
    });
    return sendJson(res, 200, { ...result, token: auth.token, account: auth.account });
  } catch (error) {
    return sendJson(res, error.status || 500, { ok: false, error: error.message || 'Request failed' });
  }
};
