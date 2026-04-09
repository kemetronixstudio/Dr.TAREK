const backend = require('../../lib/homework-backend');

module.exports = async function handler(req, res){
  res.setHeader('Content-Type', 'application/json');
  try {
    const url = new URL(req.url || '/api/homework', 'http://localhost');
    const action = String(url.searchParams.get('action') || '').trim().toLowerCase();
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});

    if (req.method === 'GET') {
      if (action === 'reports') {
        const data = await backend.listReports({
          q: url.searchParams.get('q') || '',
          className: url.searchParams.get('className') || ''
        });
        res.statusCode = 200; res.end(JSON.stringify(data)); return;
      }
      if (action === 'report-detail') {
        const data = await backend.reportDetail(url.searchParams.get('id') || '');
        res.statusCode = 200; res.end(JSON.stringify(data)); return;
      }
      const data = await backend.list();
      res.statusCode = 200; res.end(JSON.stringify(data)); return;
    }

    if (req.method === 'POST') {
      if (action === 'available') {
        const data = await backend.listForStudent(body.identity || body);
        res.statusCode = 200; res.end(JSON.stringify(data)); return;
      }
      if (action === 'start') {
        const data = await backend.start(body);
        res.statusCode = 200; res.end(JSON.stringify(data)); return;
      }
      if (action === 'submit') {
        const data = await backend.submit(body);
        res.statusCode = 200; res.end(JSON.stringify(data)); return;
      }
      const data = await backend.save(body);
      res.statusCode = 200; res.end(JSON.stringify(data)); return;
    }

    if (req.method === 'DELETE') {
      const data = await backend.remove(body.id || url.searchParams.get('id') || '');
      res.statusCode = 200; res.end(JSON.stringify(data)); return;
    }

    res.statusCode = 405; res.end(JSON.stringify({ ok:false, error:'Method not allowed' }));
  } catch (error) {
    res.statusCode = 400; res.end(JSON.stringify({ ok:false, error:error.message || 'Request failed' }));
  }
};
