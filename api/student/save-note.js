const backend = require('../../lib/student-cloud-backend');
const access = require('../../lib/access-accounts-backend');
const apiSecurity = require('../../lib/api-security');


module.exports = async function handler(req, res) {
  if (apiSecurity.handlePreflight(req, res)) return;
  apiSecurity.applyApiHeaders(req, res);
  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: 'Method not allowed' }));
    return;
  }
  try {
    const auth = await access.requireAuthorized(req, 'dashboard');
    if (!auth.ok) {
      res.statusCode = auth.status;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ ok: false, error: auth.error }));
      return;
    }
    apiSecurity.setAuthCookie(req, res, auth.token);
    const result = await backend.saveTeacherNote({ ...(req.body || {}), author: auth.account && auth.account.username ? auth.account.username : '' });
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ ...result, token: auth.token, account: auth.account }));
  } catch (error) {
    res.statusCode = error.status || 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: error.message || 'Request failed' }));
  }
};
