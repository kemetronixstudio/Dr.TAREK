
function withCors(handler){
  return async function(req, res){
    applyCors(req, res);
    return handler(req, res);
  };
}

const backend = require('../../lib/access-accounts-backend');
const { applyCors, setAuthCookie, checkRateLimit } = require('../../lib/api-security');

function setJson(res, status, payload) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(payload));
}

function clearAuthCookie(req, res) {
  const secure = (process.env.NODE_ENV === 'production') || String(req.headers['x-forwarded-proto'] || '').includes('https');
  res.setHeader('Set-Cookie', `kgAccessToken=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure ? '; Secure' : ''}`);
}

function getAction(req) {
  try {
    const url = new URL(req.url || '/api/access-accounts', 'http://localhost');
    return String(url.searchParams.get('action') || '').trim().toLowerCase();
  } catch {
    return String((req.query && req.query.action) || '').trim().toLowerCase();
  }
}

function readBody(req) {
  try {
    return typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
  } catch (e) {
    return {};
  }
}

module.exports = withCors(async function handler(req, res) {
  if (applyCors(req, res)) return;
  try {
    const action = getAction(req);

    if (req.method === 'GET') {
      const auth = await backend.requireAdmin(req);
      if (!auth.ok) return setJson(res, auth.status, { ok: false, error: auth.error });
      setAuthCookie(req, res, auth.token);

      if (action === 'me') return setJson(res, 200, { ok: true, account: auth.account, token: auth.token });
      if (action === 'logs') {
        const logs = await backend.readLogs();
        return setJson(res, 200, { ok: true, logs, token: auth.token });
      }
      const accounts = await backend.mergedAccounts();
      return setJson(res, 200, { ok: true, accounts: accounts.map(backend.publicAccount), token: auth.token });
    }

    if (req.method === 'POST') {
      const body = readBody(req);

      if (action === 'login') {
        const limited = checkRateLimit(req, String(body.user || '').trim().toLowerCase());
        if (!limited.ok) return setJson(res, 429, { ok: false, error: `Too many attempts. Try again in ${limited.retryAfter} seconds.` });
        const account = await backend.authenticate(body.user, body.pass, req);
        if (!account) return setJson(res, 401, { ok: false, error: 'Wrong admin name or password.' });
        const token = backend.createTokenForAccount(account);
        await backend.appendLog({ action:'login', actor:account.user, target:account.user, role:account.role, detail:`Logged in as ${account.role || 'admin'}`, createdAt:new Date().toISOString() });
        setAuthCookie(req, res, token);
        return setJson(res, 200, { ok: true, account, token });
      }

      if (action === 'logout') {
        clearAuthCookie(req, res);
        return setJson(res, 200, { ok: true });
      }

      const auth = await backend.requireAdmin(req);
      if (!auth.ok) return setJson(res, auth.status, { ok: false, error: auth.error });
      setAuthCookie(req, res, auth.token);

      if (action === 'change-password') {
        const result = body.currentPass ? await backend.changeOwnPassword(body, auth.account) : await backend.changePassword(body, auth.account);
        return setJson(res, 200, { ...result, token: result.token || auth.token });
      }

      const result = await backend.saveAccount(body, auth.account);
      return setJson(res, 200, { ...result, token: auth.token });
    }

    if (req.method === 'DELETE') {
      const auth = await backend.requireAdmin(req);
      if (!auth.ok) return setJson(res, auth.status, { ok: false, error: auth.error });
      setAuthCookie(req, res, auth.token);
      const body = readBody(req);
      const result = await backend.deleteAccount(body, auth.account);
      return setJson(res, 200, { ...result, token: auth.token });
    }

    return setJson(res, 405, { ok: false, error: 'Method not allowed' });
  } catch (error) {
    return setJson(res, error.status || 500, { ok: false, error: error.message || 'Request failed' });
  }
};
