(function(){
  if (typeof document === 'undefined' || !document.body || document.body.dataset.page !== 'admin') return;
  const API_BASE = '/api/student';
  const TOKEN_KEYS = ['kgAccessApiTokenV1', 'admin_token'];
  let lastRows = [];
  let selectedIdentity = null;

  function token(){
    for (const key of TOKEN_KEYS) {
      try {
        const value = sessionStorage.getItem(key) || localStorage.getItem(key);
        if (value) return value;
      } catch (error) {}
    }
    return '';
  }
  async function request(path, options){
    const headers = Object.assign({ 'Cache-Control':'no-store' }, options && options.headers ? options.headers : {});
    const tk = token();
    if (tk) headers.Authorization = 'Bearer ' + tk;
    const res = await fetch(API_BASE + path, Object.assign({ credentials:'same-origin', cache:'no-store', headers }, options || {}));
    const data = await res.json().catch(()=>({ ok:false, error:'Request failed' }));
    if (!res.ok || !data.ok) throw new Error(data.error || ('Request failed: ' + res.status));
    return data;
  }
  async function api(path){ return request(path); }
  async function post(path, payload){
    return request(path, { method:'POST', headers:{ 'Content-Type':'application/json' }, body: JSON.stringify(payload || {}) });
  }
  function status(msg){ const el = document.getElementById('studentCloudStatus'); if (el) el.textContent = msg || ''; }
  function analyticsStatus(msg){ const el = document.getElementById('studentAnalyticsStatus'); if (el) el.textContent = msg || ''; }
  function escapeHtml(value){ return String(value || '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch])); }
  function getFilters(){
    return {
      q: document.getElementById('studentCloudSearch')?.value || '',
      className: document.getElementById('studentCloudClassFilter')?.value || '',
      status: document.getElementById('studentCloudStatusFilter')?.value || ''
    };
  }
  async function render(){
    const body = document.getElementById('studentCloudTableBody');
    if (!body) return;
    status('Loading cloud records...');
    const filters = getFilters();
    const q = encodeURIComponent(filters.q);
    const className = encodeURIComponent(filters.className);
    const statusValue = encodeURIComponent(filters.status);
    try {
      const data = await api(`/list?q=${q}&className=${className}&status=${statusValue}`);
      const rows = Array.isArray(data.rows) ? data.rows : [];
      lastRows = rows.slice();
      body.innerHTML = rows.map(row => `\n<tr data-key="${escapeHtml(row.key)}" class="student-cloud-row">\n<td>${escapeHtml(row.studentName)}</td>\n<td>${escapeHtml(row.studentId || '-')}</td>\n<td>${escapeHtml(row.className || '-')}</td>\n<td>${escapeHtml(row.grade || '-')}</td>\n<td>${escapeHtml(row.quizLevel || row.quizKey || '-')}</td>\n<td>${row.status === 'completed' ? `${escapeHtml(String(row.percent || 0))}%` : 'In Progress'}</td>\n<td>${escapeHtml((row.teacherNote || '').slice(0, 36) || '-')}</td>\n<td>${escapeHtml(row.updatedAt ? new Date(row.updatedAt).toLocaleString() : '-')}</td>\n<td><button type="button" class="ghost-btn small-btn student-cloud-view-btn" data-key="${escapeHtml(row.key)}">View</button></td>\n</tr>`).join('') || '<tr><td colspan="9">No cloud student records found.</td></tr>';
      status(`${rows.length} cloud record(s) loaded.`);
      if (typeof window.__kgClearUnauthorized === 'function') window.__kgClearUnauthorized();
      await renderAnalytics();
    } catch (error) {
      body.innerHTML = '<tr><td colspan="9">Could not load cloud records.</td></tr>';
      status(error.message || 'Could not load cloud records.');
    }
  }
  async function renderAnalytics(){
    const filters = getFilters();
    analyticsStatus('Loading analytics...');
    try {
      const data = await api(`/analytics?q=${encodeURIComponent(filters.q)}&className=${encodeURIComponent(filters.className)}`);
      const totals = data.totals || {};
      const classRows = Array.isArray(data.classAnalytics) ? data.classAnalytics : [];
      const leaderboard = Array.isArray(data.leaderboard) ? data.leaderboard : [];
      const setText = (id, value) => { const el = document.getElementById(id); if (el) el.textContent = value; };
      setText('studentAnalyticsAttempts', String(totals.totalCompletedAttempts || 0));
      setText('studentAnalyticsStudents', String(totals.totalStudents || 0));
      setText('studentAnalyticsClasses', String(totals.totalClasses || 0));
      setText('studentAnalyticsAverage', `${Number(totals.averagePercent || 0)}%`);

      const classBody = document.getElementById('classAnalyticsTableBody');
      if (classBody) {
        classBody.innerHTML = classRows.map(row => `<tr><td>${escapeHtml(row.className)}</td><td>${escapeHtml(row.grade)}</td><td>${escapeHtml(String(row.studentCount))}</td><td>${escapeHtml(String(row.attempts))}</td><td>${escapeHtml(String(row.averagePercent))}%</td><td>${escapeHtml(String(row.topScore))}%</td></tr>`).join('') || '<tr><td colspan="6">No completed cloud records yet.</td></tr>';
      }
      const leaderboardBody = document.getElementById('studentLeaderboardTableBody');
      if (leaderboardBody) {
        leaderboardBody.innerHTML = leaderboard.slice(0, 20).map((row, index) => `<tr><td>${index + 1}</td><td>${escapeHtml(row.studentName)}</td><td>${escapeHtml(row.studentId || '-')}</td><td>${escapeHtml(row.className || '-')}</td><td>${escapeHtml(String(row.bestPercent || 0))}%</td><td>${escapeHtml(String(row.averagePercent || 0))}%</td><td>${escapeHtml(String(row.attempts || 0))}</td></tr>`).join('') || '<tr><td colspan="7">No leaderboard data yet.</td></tr>';
      }
      analyticsStatus(`Analytics ready. Top weakness: ${totals.mostCommonWeakness || '-'}`);
    } catch (error) {
      analyticsStatus(error.message || 'Could not load analytics.');
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
      const identity = record.identity || {};
      selectedIdentity = identity && identity.name ? identity : null;
      const noteObj = data.note || null;
      const answers = Array.isArray(record.answers) ? record.answers : [];
      panel.innerHTML = `\n<div class="stored-question">\n  <h4>${escapeHtml(record.studentName || identity.name || 'Student')}</h4>\n  <p><strong>Student ID:</strong> ${escapeHtml(record.studentId || identity.studentId || '-')}</p>\n  <p><strong>Class:</strong> ${escapeHtml(record.className || identity.className || '-')}</p>\n  <p><strong>Status:</strong> ${result ? 'Completed' : 'In Progress'}</p>\n  <p><strong>Quiz:</strong> ${escapeHtml(record.quizLevel || record.selectedLevelLabel || record.quizKey || '-')}</p>\n  <p><strong>Score:</strong> ${result ? escapeHtml(String(record.percent || 0) + '%') : escapeHtml(String((record.currentIndex || 0) + 1) + ' / ' + String((record.questions || []).length || record.selectedCount || 0))}</p>\n  <div class="teacher-note-box">\n    <label for="teacherStudentNote"><strong>Teacher Notes</strong></label>\n    <textarea id="teacherStudentNote" rows="4" placeholder="Add private teacher notes for this student...">${escapeHtml(noteObj && noteObj.note || '')}</textarea>\n    <div class="teacher-note-actions">\n      <button type="button" class="main-btn" id="saveTeacherStudentNoteBtn">Save Note</button>\n      <span class="muted-note" id="teacherStudentNoteStatus">${noteObj ? `Last updated ${escapeHtml(new Date(noteObj.updatedAt).toLocaleString())}${noteObj.author ? ' by ' + escapeHtml(noteObj.author) : ''}` : 'No note saved yet.'}</span>\n    </div>\n  </div>\n  <div class="student-cloud-answer-list">${answers.length ? answers.map(item => `<div class="student-cloud-answer-item"><strong>Q${Number(item.index || 0) + 1}.</strong> ${escapeHtml(item.questionText || '')}<br><span>Chosen: ${escapeHtml(item.chosen || (item.timedOut ? 'Timed out' : '-'))}</span> · <span>Correct: ${escapeHtml(item.expected || '-')}</span></div>`).join('') : '<div class="student-cloud-answer-item">No saved answers yet.</div>'}</div>\n</div>`;
    } catch (error) {
      panel.innerHTML = '<div class="stored-question"><h4>Could not load record details.</h4></div>';
      selectedIdentity = null;
    }
  }
  async function saveTeacherNote(){
    if (!selectedIdentity) return;
    const statusEl = document.getElementById('teacherStudentNoteStatus');
    const noteValue = document.getElementById('teacherStudentNote')?.value || '';
    if (statusEl) statusEl.textContent = 'Saving note...';
    try {
      const data = await post('/save-note', { identity: selectedIdentity, note: noteValue });
      if (statusEl) statusEl.textContent = `Saved ${new Date(data.note.updatedAt).toLocaleString()}${data.note.author ? ' by ' + data.note.author : ''}`;
      lastRows = lastRows.map(row => row.identityKey === selectedIdentity.identityKey ? Object.assign({}, row, { teacherNote: noteValue }) : row);
      await render();
    } catch (error) {
      if (statusEl) statusEl.textContent = error.message || 'Could not save note.';
    }
  }
  async function exportExcel(){
    status('Preparing Excel export...');
    try {
      const filters = getFilters();
      const data = await api(`/export?q=${encodeURIComponent(filters.q)}&className=${encodeURIComponent(filters.className)}&status=${encodeURIComponent(filters.status)}`);
      const rows = Array.isArray(data.rows) ? data.rows : [];
      const analytics = data.analytics || {};
      const wb = XLSX.utils.book_new();
      const recordsSheet = XLSX.utils.json_to_sheet(rows.length ? rows : [{ Info: 'No student rows found' }]);
      XLSX.utils.book_append_sheet(wb, recordsSheet, 'Student Records');
      const classSheet = XLSX.utils.json_to_sheet((analytics.classAnalytics || []).length ? analytics.classAnalytics : [{ Info: 'No class analytics yet' }]);
      XLSX.utils.book_append_sheet(wb, classSheet, 'Class Analytics');
      const leaderSheet = XLSX.utils.json_to_sheet((analytics.leaderboard || []).length ? analytics.leaderboard : [{ Info: 'No leaderboard yet' }]);
      XLSX.utils.book_append_sheet(wb, leaderSheet, 'Leaderboard');
      const summarySheet = XLSX.utils.json_to_sheet([analytics.totals || {}]);
      XLSX.utils.book_append_sheet(wb, summarySheet, 'Summary');
      const stamp = new Date().toISOString().slice(0,19).replace(/[T:]/g,'-');
      XLSX.writeFile(wb, `student-cloud-records-${stamp}.xlsx`);
      status('Excel export downloaded.');
    } catch (error) {
      status(error.message || 'Could not export Excel.');
    }
  }
  function wire(){
    document.getElementById('refreshStudentCloudBtn')?.addEventListener('click', render);
    document.getElementById('refreshStudentAnalyticsBtn')?.addEventListener('click', renderAnalytics);
    document.getElementById('exportStudentCloudExcelBtn')?.addEventListener('click', exportExcel);
    document.getElementById('studentCloudSearchBtn')?.addEventListener('click', render);
    document.getElementById('studentCloudSearch')?.addEventListener('keydown', (e)=>{ if (e.key === 'Enter') render(); });
    document.getElementById('studentCloudClassFilter')?.addEventListener('keydown', (e)=>{ if (e.key === 'Enter') render(); });
    document.getElementById('studentCloudStatusFilter')?.addEventListener('change', render);
    document.addEventListener('click', (e)=>{
      const btn = e.target.closest('.student-cloud-view-btn');
      if (btn) {
        viewRecord(btn.dataset.key || '');
        return;
      }
      if (e.target && e.target.id === 'saveTeacherStudentNoteBtn') {
        saveTeacherNote();
      }
    });
  }
  wire();
  window.renderStudentCloudAdminPanel = render;
})();
