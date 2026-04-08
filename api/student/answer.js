const backend = require('../../lib/student-cloud-backend');
const { parseJsonBody, sendJson } = require('../../lib/http-utils');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return sendJson(res, 405, { ok: false, error: 'Method not allowed' });
  try {
    const body = parseJsonBody(req);
    const result = await backend.answerSessionQuestion(body);
    return sendJson(res, 200, result);
  } catch (error) {
    return sendJson(res, error.status || 500, { ok: false, error: error.message || 'Request failed' });
  }
};
