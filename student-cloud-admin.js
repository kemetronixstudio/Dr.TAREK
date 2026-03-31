(function(){
  if (typeof document === 'undefined' || !document.body || document.body.dataset.page !== 'admin') return;
  const API_BASE = '/api/student';
  const TOKEN_KEYS = ['kgAccessApiTokenV1', 'admin_token'];

  function token(){
    for (const key of TOKEN_KEYS) {
      try {
        const value = sessionStorage.getItem(key) || localStorage.getItem(key);
        if (value) return value;
      } catch (error) {}
    }
    return '';
  }
  async function api(path){
    const headers = { 'Cache-Control':'no-store' };
    const tk = token();
    if (tk) headers.Authorization = 'Bearer ' + tk;
    const res = await fetch(API_BASE + path, { credentials:'same-origin', cache:'no-store', headers });
    const data = await res.json().catch(()=>({ ok:false, error:'Request failed' }));
    if (!res.ok || !data.ok) throw new Error(data.error || ('Request failed: ' + res.status));
    return data;
  }
  function status(msg){ const el = document.getElementById('studentCloudStatus'); if (el) el.textContent = msg || ''; }
  function escapeHtml(value){ return String(value || '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch])); }
  async function render(){
    const body = document.getElementById('studentCloudTableBody');
    if (!body) return;
    status('Loading cloud records...');
    const q = encodeURIComponent(document.getElementById('studentCloudSearch')?.value || '');
    const className = encodeURIComponent(document.getElementById('studentCloudClassFilter')?.value || '');
    const statusValue = encodeURIComponent(document.getElementById('studentCloudStatusFilter')?.value || '');
    try {
      const data = await api(`/list?q=${q}&className=${className}&status=${statusValue}`);
      const rows = Array.isArray(data.rows) ? data.rows : [];
      body.innerHTML = rows.map(row => `\n<tr data-key="${escapeHtml(row.key)}" class="student-cloud-row">\n<td>${escapeHtml(row.studentName)}</td>\n<td>${escapeHtml(row.studentId || '-')}</td>\n<td>${escapeHtml(row.className || '-')}</td>\n<td>${escapeHtml(row.grade || '-')}</td>\n<td>${escapeHtml(row.quizLevel || row.quizKey || '-')}</td>\n<td>${row.status === 'completed' ? `${escapeHtml(String(row.percent || 0))}%` : 'In Progress'}</td>\n<td>${escapeHtml(row.updatedAt ? new Date(row.updatedAt).toLocaleString() : '-')}</td>\n<td><button type="button" class="ghost-btn small-btn student-cloud-view-btn" data-key="${escapeHtml(row.key)}">View</button></td>\n</tr>`).join('') || '<tr><td colspan="8">No cloud student records found.</td></tr>';
      status(`${rows.length} cloud record(s) loaded.`);
    } catch (error) {
      body.innerHTML = '<tr><td colspan="8">Could not load cloud records.</td></tr>';
      status(error.message || 'Could not load cloud records.');
    }
  }
  async function viewRecord(key){
    const panel = document.getElementById('studentCloudDetail');
    if (!panel) return;
    panel.innerHTML = '<div class="stored-question"><h4>Loading...</h4></div>';
    try {
      const data = await api(`/detail?key=${encodeURIComponent(key)}`);
      const result = data.result;
      const progress = data.progress;
      const record = result || progress || {};
      const answers = Array.isArray(record.answers) ? record.answers : [];
      panel.innerHTML = `\n<div class="stored-question">\n  <h4>${escapeHtml(record.studentName || (record.identity && record.identity.name) || 'Student')}</h4>\n  <p><strong>Student ID:</strong> ${escapeHtml(record.studentId || (record.identity && record.identity.studentId) || '-')}</p>\n  <p><strong>Class:</strong> ${escapeHtml(record.className || (record.identity && record.identity.className) || '-')}</p>\n  <p><strong>Status:</strong> ${result ? 'Completed' : 'In Progress'}</p>\n  <p><strong>Quiz:</strong> ${escapeHtml(record.quizLevel || record.selectedLevelLabel || record.quizKey || '-')}</p>\n  <p><strong>Score:</strong> ${result ? escapeHtml(String(record.percent || 0) + '%') : escapeHtml(String((record.currentIndex || 0) + 1) + ' / ' + String((record.questions || []).length || record.selectedCount || 0))}</p>\n  <div class="student-cloud-answer-list">${answers.length ? answers.map(item => `<div class="student-cloud-answer-item"><strong>Q${Number(item.index || 0) + 1}.</strong> ${escapeHtml(item.questionText || '')}<br><span>Chosen: ${escapeHtml(item.chosen || (item.timedOut ? 'Timed out' : '-'))}</span> · <span>Correct: ${escapeHtml(item.expected || '-')}</span></div>`).join('') : '<div class="student-cloud-answer-item">No saved answers yet.</div>'}</div>\n</div>`;
    } catch (error) {
      panel.innerHTML = '<div class="stored-question"><h4>Could not load record details.</h4></div>';
    }
  }
  function wire(){
    document.getElementById('refreshStudentCloudBtn')?.addEventListener('click', render);
    document.getElementById('studentCloudSearchBtn')?.addEventListener('click', render);
    document.getElementById('studentCloudSearch')?.addEventListener('keydown', (e)=>{ if (e.key === 'Enter') render(); });
    document.getElementById('studentCloudClassFilter')?.addEventListener('keydown', (e)=>{ if (e.key === 'Enter') render(); });
    document.getElementById('studentCloudStatusFilter')?.addEventListener('change', render);
    document.addEventListener('click', (e)=>{
      const btn = e.target.closest('.student-cloud-view-btn');
      if (!btn) return;
      viewRecord(btn.dataset.key || '');
    });
  }
  wire();
  window.renderStudentCloudAdminPanel = render;
})();
