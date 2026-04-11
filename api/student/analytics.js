
function withCors(handler){
  return async function(req, res){
    applyCors(req, res);
    return handler(req, res);
  };
}

const backend = require('../../lib/student-cloud-backend');
const access = require('../../lib/access-accounts-backend');
const { applyCors, setAuthCookie } = require('../../lib/api-security');


module.exports = withCors(async function handler(req, res) {
  if (applyCors(req, res)) return;
  try {
    const auth = await access.requireAuthorized(req, 'dashboard');
    if (!auth.ok) {
      res.statusCode = auth.status;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ ok: false, error: auth.error }));
      return;
    }
    setAuthCookie(req, res, auth.token);
    const url = new URL(req.url, 'http://localhost');
    const action = String(url.searchParams.get('action') || '').trim().toLowerCase();

    if (req.method === 'POST' && action === 'reset-all') {
      const result = await backend.resetAllStudentData();
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ ...result, token: auth.token, account: auth.account }));
      return;
    }

    if (req.method !== 'GET') {
      res.statusCode = 405;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ ok: false, error: 'Method not allowed' }));
      return;
    }

    const result = await backend.analytics({
      q: url.searchParams.get('q') || '',
      className: url.searchParams.get('className') || '',
      status: 'completed'
    });
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ ...result, token: auth.token, account: auth.account }));
  } catch (error) {
    res.statusCode = error.status || 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: error.message || 'Request failed' }));
  }
};
