const access = require('../../lib/access-accounts-backend');
const questionBank = require('../../lib/question-bank-backend');
const { sendJson, setAuthCookie } = require('../../lib/http-utils');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') return sendJson(res, 405, { ok: false, error: 'Method not allowed' });
  try {
    let auth = await access.requireAuthorized(req, 'questionBank');
    if (!auth.ok) auth = await access.requireAuthorized(req, 'bulkQuestions');
    if (!auth.ok) return sendJson(res, auth.status, { ok: false, error: auth.error });
    setAuthCookie(res, auth.token);
    const result = await questionBank.adminQuestionBankSummary();
    return sendJson(res, 200, { ...result, token: auth.token, account: auth.account });
  } catch (error) {
    return sendJson(res, error.status || 500, { ok: false, error: error.message || 'Request failed' });
  }
};
