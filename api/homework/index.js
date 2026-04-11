
function withCors(handler){
  return async function(req, res){
    applyCors(req, res);
    return handler(req, res);
  };
}

const backend = require('../../lib/homework-backend');
const access = require('../../lib/access-accounts-backend');
const { applyCors, setAuthCookie } = require('../../lib/api-security');


module.exports = withCors(async function handler(req, res) {
  if (applyCors(req, res)) return;
  res.setHeader('Content-Type', 'application/json');
  try {
    const url = new URL(req.url || '/api/homework', 'http://localhost');
    const action = String(url.searchParams.get('action') || '').trim().toLowerCase();
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const isStudentAction = action === 'available' || action === 'start' || action === 'submit' || action === 'identify-student' || action === 'parent-summary';
    if (!isStudentAction) {
      const auth = await access.requireAuthorized(req, 'teacherTest');
      if (!auth.ok) {
        res.statusCode = auth.status;
        res.end(JSON.stringify({ ok:false, error:auth.error }));
        return;
      }
      setAuthCookie(req, res, auth.token);
    }

    if (req.method === 'GET') {
      if (action === 'reports') {
        const data = await backend.listReports({
          q: url.searchParams.get('q') || '',
          className: url.searchParams.get('className') || '',
          grade: url.searchParams.get('grade') || '',
          fromDate: url.searchParams.get('fromDate') || '',
          toDate: url.searchParams.get('toDate') || '',
          homeworkId: url.searchParams.get('homeworkId') || ''
        });
        res.statusCode = 200; res.end(JSON.stringify(data)); return;
      }
      if (action === 'report-detail') {
        const data = await backend.reportDetail(url.searchParams.get('id') || '');
        res.statusCode = 200; res.end(JSON.stringify(data)); return;
      }
      if (action === 'list-students') {
        const data = await backend.listStudents({ q: url.searchParams.get('q') || '' });
        res.statusCode = 200; res.end(JSON.stringify(data)); return;
      }
      if (action === 'analytics') {
        const data = await backend.analytics({
          className: url.searchParams.get('className') || '',
          grade: url.searchParams.get('grade') || '',
          fromDate: url.searchParams.get('fromDate') || '',
          toDate: url.searchParams.get('toDate') || ''
        });
        res.statusCode = 200; res.end(JSON.stringify(data)); return;
      }
      const data = await backend.list();
      res.statusCode = 200; res.end(JSON.stringify(data)); return;
    }

    if (req.method === 'POST') {
      if (action === 'identify-student') {
        const data = await backend.identifyStudent(body);
        res.statusCode = 200; res.end(JSON.stringify(data)); return;
      }
      if (action === 'parent-summary') {
        const data = await backend.parentSummary(body);
        res.statusCode = 200; res.end(JSON.stringify(data)); return;
      }
      if (action === 'save-student') {
        const auth = await access.requireAuthorized(req, 'teacherTest');
        if (!auth.ok) { res.statusCode = auth.status; res.end(JSON.stringify({ ok:false, error:auth.error })); return; }
        setAuthCookie(req, res, auth.token);
        const data = await backend.saveStudent(body);
        res.statusCode = 200; res.end(JSON.stringify(data)); return;
      }
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
      if (action === 'delete-student') {
        const auth = await access.requireAuthorized(req, 'teacherTest');
        if (!auth.ok) { res.statusCode = auth.status; res.end(JSON.stringify({ ok:false, error:auth.error })); return; }
        setAuthCookie(req, res, auth.token);
        const data = await backend.deleteStudent({ id: body.id || body.studentId || url.searchParams.get('id') || '' });
        res.statusCode = 200; res.end(JSON.stringify(data)); return;
      }
      const data = await backend.remove(body.id || url.searchParams.get('id') || '');
      res.statusCode = 200; res.end(JSON.stringify(data)); return;
    }

    res.statusCode = 405; res.end(JSON.stringify({ ok:false, error:'Method not allowed' }));
  } catch (error) {
    res.statusCode = error.status || 400; res.end(JSON.stringify({ ok:false, error:error.message || 'Request failed' }));
  }
};
