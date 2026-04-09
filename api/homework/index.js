const backend = require('../../lib/homework-backend');
module.exports = async function handler(req, res){
  res.setHeader('Content-Type', 'application/json');
  try {
    if (req.method === 'GET') {
      const data = await backend.list();
      res.statusCode = 200; res.end(JSON.stringify(data)); return;
    }
    if (req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
      const data = await backend.save(body);
      res.statusCode = 200; res.end(JSON.stringify(data)); return;
    }
    if (req.method === 'DELETE') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
      const data = await backend.remove(body.id || req.query.id);
      res.statusCode = 200; res.end(JSON.stringify(data)); return;
    }
    res.statusCode = 405; res.end(JSON.stringify({ ok:false, error:'Method not allowed' }));
  } catch (error) {
    res.statusCode = 400; res.end(JSON.stringify({ ok:false, error:error.message || 'Request failed' }));
  }
};
