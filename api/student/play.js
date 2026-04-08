const backend = require('../../lib/student-cloud-backend');
const access = require('../../lib/access-accounts-backend');
const { parseJsonBody, sendJson, setAuthCookie } = require('../../lib/http-utils');

function playIdentityFrom(body) {
  return Object.assign({}, body.identity || body, {
    isGuest: true,
    className: (body.identity && body.identity.className) || body.className || 'Play & Test'
  });
}

module.exports = async function handler(req, res) {
  const url = new URL(req.url, 'http://localhost');
  const action = String(url.searchParams.get('action') || '').trim().toLowerCase();
  try {
    if (req.method === 'GET') {
      if (!action || action === 'leaderboard') {
        const result = await backend.getPlayLeaderboard();
        return sendJson(res, 200, result);
      }
      return sendJson(res, 400, { ok: false, error: 'Unknown action' });
    }

    if (req.method !== 'POST') return sendJson(res, 405, { ok: false, error: 'Method not allowed' });

    const body = parseJsonBody(req);

    if (action === 'reset') {
      const auth = await access.requireAdmin(req);
      if (!auth.ok) return sendJson(res, auth.status, { ok: false, error: auth.error });
      setAuthCookie(res, auth.token);
      const result = await backend.resetPlayLeaderboard();
      return sendJson(res, 200, { ...result, token: auth.token, account: auth.account });
    }

    if (action === 'start') {
      const result = await backend.startPlaySession(Object.assign({}, body, { identity: playIdentityFrom(body) }));
      const leaderboard = await backend.getPlayLeaderboard();
      return sendJson(res, 200, { ...result, leaderboard });
    }

    if (action === 'answer') {
      const result = await backend.answerSessionQuestion({
        identity: playIdentityFrom(body),
        quizKey: body.sessionId || body.quizKey || body.quizId,
        questionId: body.questionId,
        chosen: body.chosen,
        timedOut: !!body.timedOut
      });
      const leaderboard = result.finished ? await backend.getPlayLeaderboard() : null;
      return sendJson(res, 200, leaderboard ? { ...result, leaderboard } : result);
    }

    if (action === 'save-progress') {
      const result = await backend.saveProgress({
        identity: playIdentityFrom(body),
        quizKey: body.sessionId || body.quizKey || body.quizId,
        state: body.state || body.progress || body
      });
      return sendJson(res, 200, result);
    }

    if (action === 'submit') {
      const result = await backend.submitResult({
        identity: playIdentityFrom(body),
        quizKey: body.sessionId || body.quizKey || body.quizId
      });
      const leaderboard = await backend.getPlayLeaderboard();
      return sendJson(res, 200, { ...result, leaderboard });
    }

    return sendJson(res, 400, { ok: false, error: 'Unknown action' });
  } catch (error) {
    return sendJson(res, error.status || 500, { ok: false, error: error.message || 'Request failed' });
  }
};
