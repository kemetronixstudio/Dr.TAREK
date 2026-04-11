
function withCors(handler){
  return async function(req, res){
    applyCors(req, res);
    return handler(req, res);
  };
}

const { applyCors } = require('../../lib/api-security');
const backend = require('../../lib/student-cloud-backend');

module.exports = withCors(async function handler(req, res) {
  if (applyCors(req, res)) return;
  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: 'Method not allowed' }));
    return;
  }
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const result = await backend.getStudentQuiz(body.identity || body, body.quizKey || body.quizId || body.quiz);
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ ok: true, progress: result.progress, result: result.result, quizKey: result.quizKey, identity: result.identity }));
  } catch (error) {
    res.statusCode = error.status || 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: error.message || 'Request failed' }));
  }
};
