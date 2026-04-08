const configBackend = require('../lib/app-config-backend');
const { sendJson } = require('../lib/http-utils');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') return sendJson(res, 405, { ok: false, error: 'Method not allowed' });
  try {
    const result = await configBackend.getPublicConfig();
    return sendJson(res, 200, result);
  } catch (error) {
    return sendJson(res, error.status || 500, { ok: false, error: error.message || 'Request failed' });
  }
};
