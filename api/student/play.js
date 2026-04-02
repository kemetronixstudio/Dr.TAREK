const backend = require('../../lib/student-cloud-backend');
const access = require('../../lib/access-accounts-backend');

function setAuthCookie(res, token) {
  if (token) res.setHeader('Set-Cookie', `kgAccessToken=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=43200`);
}

module.exports = async function handler(req, res) {
  const url = new URL(req.url, 'http://localhost');
  const action = String(url.searchParams.get('action') || '').trim().toLowerCase();
  try {
    if (req.method === 'GET') {
      if (action === 'leaderboard' || !action) {
        const result = await backend.getPlayLeaderboard();
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(result));
        return;
      }
      res.statusCode = 400;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ ok: false, error: 'Unknown action' }));
      return;
    }
    if (req.method !== 'POST') {
      res.statusCode = 405;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ ok: false, error: 'Method not allowed' }));
      return;
    }
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    if (action === 'start') {
      const result = await backend.getPlaySession(Object.assign({}, body.identity || body, { className: (body.identity && body.identity.className) || 'Play & Test', isGuest: true }), body.sessionId || body.quizKey || '');
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(result));
      return;
    }
    if (action === 'save-progress') {
      const result = await backend.saveProgress({
        identity: Object.assign({}, body.identity || body, { isGuest: true, className: (body.identity && body.identity.className) || 'Play & Test' }),
        quizKey: body.sessionId || body.quizKey || body.quizId,
        state: body.state || body.progress || body
      });
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(result));
      return;
    }
    if (action === 'submit') {
      const result = await backend.submitResult({
        identity: Object.assign({}, body.identity || body, { isGuest: true, className: (body.identity && body.identity.className) || 'Play & Test' }),
        quizKey: body.sessionId || body.quizKey || body.quizId,
        result: body.result || body,
        progress: body.progress || body.state || {}
      });
      const leaderboard = await backend.getPlayLeaderboard();
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(Object.assign({}, result, { leaderboard })));
      return;
    }
    if (action === 'reset') {
      const auth = await access.requireAuthorized(req, 'dashboard');
      if (!auth.ok || !auth.account || auth.account.role !== 'admin') {
        res.statusCode = auth.status || 403;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ ok: false, error: auth.error || 'Admin access required' }));
        return;
      }
      setAuthCookie(res, auth.token);
      const result = await backend.resetPlayLeaderboard();
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(Object.assign({}, result, { token: auth.token, account: auth.account })));
      return;
    }
    res.statusCode = 400;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: 'Unknown action' }));
  } catch (error) {
    res.statusCode = error.status || 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: error.message || 'Request failed' }));
  }
};
