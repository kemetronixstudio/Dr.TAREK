
function normalizeAdminImagePath(value){
  const raw = String(value || '').trim();
  if (!raw) return '';
  if (/^(https?:)?\/\//i.test(raw) || raw.startsWith('data:') || raw.startsWith('/')) return raw;
  const clean = raw.replace(/^\.\//, '').replace(/^\/+/, '');
  if (/^assets\//i.test(clean)) return clean;
  if (/^(quiz-bulk|svg|img|icons)\//i.test(clean)) return 'assets/' + clean;
  return 'assets/quiz-bulk/' + clean;
}
(function(){
  if (typeof document === 'undefined' || !document.body || document.body.dataset.page !== 'admin') return;
  const API = '/api/homework';
  const $ = (id) => document.getElementById(id);
  const esc = (v) => String(v || '').replace(/[&<>"']/g, (ch) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  let cachedPickerRows = [];
  let cachedAssignments = [];
  const selectedQuestionIds = new Set();

  function authHeaders(){
    try {
      const token = sessionStorage.getItem('kgAccessApiTokenV1') || localStorage.getItem('kgAccessApiTokenV1') || localStorage.getItem('admin_token') || '';
      return token ? { Authorization:'Bearer ' + token } : {};
    } catch (error) { return {}; }
  }

  async function api(path = '', options){
    const res = await fetch(API + path, Object.assign({ headers:Object.assign({ 'Content-Type':'application/json' }, authHeaders(), options && options.headers ? options.headers : {}), credentials:'same-origin', cache:'no-store' }, options || {}));
    const data = await res.json().catch(()=>({ ok:false, error:'Request failed' }));
    if (!res.ok || !data.ok) throw new Error(data.error || 'Request failed');
    return data;
  }

  function allQuestionsForGrade(grade){
    try {
      if (typeof allQuestionsFor === 'function') return allQuestionsFor(String(grade || '').toLowerCase()) || [];
      return [];
    } catch {
      return [];
    }
  }

  function questionSearchValue(){
    return String($('homeworkQuestionSearch')?.value || '').trim().toLowerCase();
  }

  function filteredPickerRows(){
    const q = questionSearchValue();
    if (!q) return cachedPickerRows;
    return cachedPickerRows.filter((row) => {
      return [row.skill, row.text, row.answer, ...(row.options || [])].some((v) => String(v || '').toLowerCase().includes(q));
    });
  }

  function updatePickerStatus(rows){
    const status = $('homeworkQuestionPickerStatus');
    if (!status) return;
    if (!cachedPickerRows.length) {
      status.textContent = 'No questions found for this grade.';
      return;
    }
    const q = questionSearchValue();
    status.textContent = q ? `${rows.length} question(s) match "${q}".` : `${rows.length} question(s) available.`;
  }

  function syncSelectedQuestionState(){
    document.querySelectorAll('.homework-question-check').forEach((el) => {
      const key = String(el.value || '');
      el.checked = selectedQuestionIds.has(key);
    });
  }

  function renderPicker(){
    const list = $('homeworkQuestionPickerList');
    if (!list) return;
    const grade = $('homeworkGrade')?.value || 'KG1';
    cachedPickerRows = allQuestionsForGrade(grade).slice(0, 500).map((q, i) => Object.assign({ __index:i }, q || {}));
    const validIds = new Set(cachedPickerRows.map((row) => String(row.__index)));
    [...selectedQuestionIds].forEach((id) => { if (!validIds.has(id)) selectedQuestionIds.delete(id); });
    const rows = filteredPickerRows();
    list.innerHTML = rows.map((q) => `<label class="teacher-picker-item"><input type="checkbox" class="homework-question-check" value="${q.__index}"><span><strong>${esc(q.skill || 'Question')}</strong><br>${esc(q.text || '')}</span></label>`).join('') || '<div class="muted-note">No questions found for this grade.</div>';
    syncSelectedQuestionState();
    updatePickerStatus(rows);
  }

  function selectedQuestions(){
    const source = cachedPickerRows.length ? cachedPickerRows : allQuestionsForGrade($('homeworkGrade')?.value || 'KG1').map((q, i) => Object.assign({ __index:i }, q || {}));
    const mapByIndex = new Map(source.map((row) => [String(row.__index), row]));
    return [...selectedQuestionIds]
      .map((id) => mapByIndex.get(String(id)))
      .filter(Boolean)
      .map((q) => ({ text:q.text, options:[...(q.options || [])], answer:q.answer, skill:q.skill || '', type:q.type || 'Question', image:q.image || null }));
  }

  function parseManualQuestions(){
    return String($('homeworkQuestionList')?.value || '')
      .split(/\n+/)
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const parts = line.split('|').map((p) => p.trim()).filter(Boolean);
        if (parts.length < 6) return null;
        return { text:parts[0], options:parts.slice(1, 5), answer:parts[5], skill:'Homework', type:'Question', image:null };
      })
      .filter(Boolean);
  }

  function formData(){
    const classes = String($('homeworkClasses')?.value || '').split(',').map((v) => v.trim()).filter(Boolean);
    const useTimer = !!$('homeworkTimerToggle')?.checked;
    const usePassword = !!$('homeworkPasswordToggle')?.checked;
    const mode = $('homeworkMode')?.value || 'select';
    const manualQuestions = parseManualQuestions();
    const pickedQuestions = selectedQuestions();
    const questions = mode === 'manual' ? (manualQuestions.length ? manualQuestions : pickedQuestions) : pickedQuestions;
    return {
      id: String($('reuseHomeworkSelect')?.dataset.loadedHomeworkId || '') || ('HW-' + Date.now()),
      title: String($('homeworkTitle')?.value || '').trim(),
      grade: String($('homeworkGrade')?.value || 'KG1').trim(),
      classes,
      date: String($('homeworkDate')?.value || '').trim(),
      mode,
      questions,
      useTimer,
      timerMinutes: useTimer ? Math.max(1, Number($('homeworkTimerMinutes')?.value || 0) || 0) : 0,
      usePassword,
      password: usePassword ? String($('homeworkPassword')?.value || '').trim() : '',
      tryLimit: Math.max(0, Math.min(5, Number($('homeworkTryLimit')?.value || 0) || 0)),
      createdAt: new Date().toISOString()
    };
  }

  async function renderList(){
    const wrap = $('homeworkAdminList');
    if (!wrap) return;
    try {
      cachedAssignments = ((await api()).rows || []).sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')));
      wrap.innerHTML = cachedAssignments.map((row) => `<div class="stored-question"><h4>${esc(row.title || 'Homework')}</h4><p><strong>Grade:</strong> ${esc(row.grade)}</p><p><strong>Classes:</strong> ${esc((row.classes || []).join(', ') || 'All')}</p><p><strong>Date:</strong> ${esc(row.date || '-')}</p><p><strong>Questions:</strong> ${esc(String((row.questions || []).length))}</p><p><strong>Timer:</strong> ${row.useTimer ? esc(String(row.timerMinutes) + ' min') : 'No'}</p><p><strong>Password:</strong> ${row.usePassword ? 'Yes' : 'No'}</p><p><strong>Tries:</strong> ${Number(row.tryLimit || 0) > 0 ? esc(String(row.tryLimit)) : 'No limit'}</p><div class="action-row wrap-row"><button class="ghost-btn small-btn homework-load-btn" data-id="${esc(row.id)}" type="button">Load</button><button class="ghost-btn small-btn homework-delete-btn" data-id="${esc(row.id)}" type="button">Delete</button></div></div>`).join('') || '<div class="muted-note">No homework saved yet.</div>';
      renderReuseOptions();
    } catch (error) {
      wrap.innerHTML = `<div class="muted-note">${esc(error.message || 'Could not load homework.')}</div>`;
    }
  }

  function renderReuseOptions(){
    const select = $('reuseHomeworkSelect');
    if (!select) return;
    const current = select.value;
    const options = ['<option value="">Reuse saved homework</option>'].concat(cachedAssignments.map((row) => `<option value="${esc(row.id)}">${esc((row.date || '-') + ' • ' + (row.grade || '-') + ' • ' + (row.title || 'Homework'))}</option>`));
    select.innerHTML = options.join('');
    select.value = current;
  }

  function loadHomeworkIntoForm(id){
    const row = cachedAssignments.find((item) => String(item.id) === String(id));
    if (!row) return;
    $('homeworkTitle') && ($('homeworkTitle').value = row.title || '');
    $('homeworkGrade') && ($('homeworkGrade').value = row.grade || 'KG1');
    $('homeworkClasses') && ($('homeworkClasses').value = Array.isArray(row.classes) ? row.classes.join(', ') : '');
    $('homeworkDate') && ($('homeworkDate').value = row.date || '');
    $('homeworkMode') && ($('homeworkMode').value = 'select');
    $('homeworkTimerToggle') && ($('homeworkTimerToggle').checked = !!row.useTimer);
    $('homeworkTimerMinutes') && ($('homeworkTimerMinutes').value = row.useTimer ? (row.timerMinutes || '') : '');
    $('homeworkPasswordToggle') && ($('homeworkPasswordToggle').checked = !!row.usePassword);
    $('homeworkPassword') && ($('homeworkPassword').value = row.usePassword ? (row.password || '') : '');
    $('homeworkTryLimit') && ($('homeworkTryLimit').value = String(row.tryLimit || 0));
    $('homeworkQuestionList') && ($('homeworkQuestionList').value = (row.questions || []).map((q) => [q.text].concat(q.options || []).concat([q.answer]).join(' | ')).join('\n'));
    $('reuseHomeworkSelect') && ($('reuseHomeworkSelect').value = row.id);
    $('reuseHomeworkSelect') && ($('reuseHomeworkSelect').dataset.loadedHomeworkId = row.id);
    renderPicker();
    selectedQuestionIds.clear();
    const normalized = new Set((row.questions || []).map((q) => String(q.text || '').trim().toLowerCase()));
    cachedPickerRows.forEach((item) => {
      if (normalized.has(String(item.text || '').trim().toLowerCase())) selectedQuestionIds.add(String(item.__index));
    });
    syncSelectedQuestionState();
    updateModeVisibility();
    const status = $('homeworkAdminStatus');
    if (status) status.textContent = 'Saved homework loaded into the form. You can change date, classes, or questions and save again.';
  }

  function reportFilters(){
    return {
      q: String($('homeworkReportSearch')?.value || '').trim(),
      className: String($('homeworkReportClassFilter')?.value || '').trim(),
      grade: String($('homeworkAnalyticsGradeFilter')?.value || '').trim(),
      fromDate: String($('homeworkAnalyticsFromDate')?.value || '').trim(),
      toDate: String($('homeworkAnalyticsToDate')?.value || '').trim(),
      homeworkId: ''
    };
  }

  async function renderReports(){
    const body = $('homeworkReportTableBody');
    const status = $('homeworkReportStatus');
    if (!body) return;
    try {
      const filters = reportFilters();
      const query = `?action=reports&q=${encodeURIComponent(filters.q)}&className=${encodeURIComponent(filters.className)}&grade=${encodeURIComponent(filters.grade)}&fromDate=${encodeURIComponent(filters.fromDate)}&toDate=${encodeURIComponent(filters.toDate)}`;
      const data = await api(query);
      const rows = Array.isArray(data.rows) ? data.rows : [];
      body.innerHTML = rows.map((row) => `<tr><td>${esc(row.studentName)}</td><td>${esc(row.studentId || '-')}</td><td>${esc(row.className || '-')}</td><td>${esc(row.grade || '-')}</td><td>${esc(row.homeworkTitle || '-')}</td><td>${esc(String(row.score || 0))} / ${esc(String(row.questionCount || 0))}</td><td>${esc(String(row.percent || 0))}%</td><td>${esc(String(row.wrongAnswersCount || 0))}</td><td>${esc(String(row.triesUsed || 0))}</td><td>${esc(row.submittedAt ? new Date(row.submittedAt).toLocaleString() : '-')}</td><td><button class="ghost-btn small-btn homework-report-open-btn" data-id="${esc(row.id)}" type="button">Open</button></td></tr>`).join('') || '<tr><td colspan="11">No homework reports yet.</td></tr>';
      if (status) status.textContent = rows.length ? `${rows.length} homework report(s) loaded.` : 'No homework reports found.';
    } catch (error) {
      body.innerHTML = '<tr><td colspan="11">Could not load homework reports.</td></tr>';
      if (status) status.textContent = error.message || 'Could not load homework reports.';
    }
  }

  async function openReport(id){
    const detail = $('homeworkReportDetail');
    if (!detail) return;
    detail.innerHTML = '<div class="stored-question"><h4>Loading...</h4></div>';
    try {
      const data = await api(`?action=report-detail&id=${encodeURIComponent(id)}`);
      const row = data.row || {};
      const answers = Array.isArray(row.answers) ? row.answers : [];
      const wrongAnswers = Array.isArray(row.wrongAnswers) ? row.wrongAnswers : [];
      detail.innerHTML = `<div class="stored-question"><h4>${esc(row.studentName || 'Student')}</h4><p><strong>Student ID:</strong> ${esc(row.studentId || '-')}</p><p><strong>Class:</strong> ${esc(row.className || '-')}</p><p><strong>Grade:</strong> ${esc(row.grade || '-')}</p><p><strong>Homework:</strong> ${esc(row.homeworkTitle || '-')}</p><p><strong>Submitted:</strong> ${esc(row.submittedAt ? new Date(row.submittedAt).toLocaleString() : '-')}</p><p><strong>Score:</strong> ${esc(String(row.score || 0))} / ${esc(String(row.questionCount || 0))} (${esc(String(row.percent || 0))}%)</p><p><strong>Wrong answers:</strong> ${esc(String(row.wrongAnswersCount || 0))}</p><div class="student-cloud-answer-list">${answers.length ? answers.map((item) => `<div class="student-cloud-answer-item"><strong>Q${Number(item.index || 0) + 1}.</strong> ${esc(item.questionText || '')}<br><span>Chosen: ${esc(item.chosen || (item.timedOut ? 'Timed out' : '-'))}</span> · <span>Correct answer: ${esc(item.expected || '-')}</span> · <span>${item.correct ? 'Right' : 'Wrong'}</span></div>`).join('') : '<div class="student-cloud-answer-item">No saved answers.</div>'}</div>${wrongAnswers.length ? `<div class="stored-question"><h4>Wrong Answers Only</h4>${wrongAnswers.map((item) => `<p><strong>Q${Number(item.index || 0) + 1}:</strong> ${esc(item.questionText || '')}<br><span>Student answer: ${esc(item.chosen || (item.timedOut ? 'Timed out' : '-'))}</span> · <span>Correct answer: ${esc(item.expected || '-')}</span></p>`).join('')}</div>` : ''}</div>`;
    } catch {
      detail.innerHTML = '<div class="stored-question"><h4>Could not load homework report details.</h4></div>';
    }
  }


  async function renderHomeworkAnalytics(){
    const status = $('homeworkAnalyticsStatus');
    const filters = reportFilters();
    try {
      const query = `?action=analytics&className=${encodeURIComponent(filters.className)}&grade=${encodeURIComponent(filters.grade)}&fromDate=${encodeURIComponent(filters.fromDate)}&toDate=${encodeURIComponent(filters.toDate)}`;
      const data = await api(query);
      const summary = data.summary || {};
      const setText = (id, value) => { const el = $(id); if (el) el.textContent = value; };
      setText('hwMetricAssignments', String(summary.totalAssignments || 0));
      setText('hwMetricSubmissions', String(summary.totalSubmissions || 0));
      setText('hwMetricStudents', String(summary.uniqueStudents || 0));
      setText('hwMetricOnTime', `${Number(summary.onTimeRate || 0)}%`);
      const trend = Array.isArray(data.dailyTrend) ? data.dailyTrend : [];
      const maxSubs = Math.max(1, ...trend.map((item) => Number(item.submissions || 0) || 0));
      const trendBox = $('homeworkTrendBars');
      if (trendBox) trendBox.innerHTML = trend.map((item) => `<div class="simple-bar-row"><span class="bar-label">${esc(item.date || '')}</span><div class="bar-track"><div class="bar-fill" style="width:${Math.max(8, Math.round(((Number(item.submissions || 0) || 0) / maxSubs) * 100))}%"></div></div><span class="bar-value">${esc(String(item.submissions || 0))} / ${esc(String(item.averagePercent || 0))}%</span></div>`).join('') || '<div class="muted-note">No homework trend yet.</div>';
      const topBody = $('homeworkTopTableBody');
      if (topBody) topBody.innerHTML = (data.topHomework || []).map((row) => `<tr><td>${esc(row.homeworkTitle || '-')}</td><td>${esc(String(row.submissions || 0))}</td><td>${esc(String(row.averagePercent || 0))}%</td><td>${esc(String(row.averageWrong || 0))}</td></tr>`).join('') || '<tr><td colspan="4">No homework submissions yet.</td></tr>';
      const classBody = $('homeworkClassBreakdownBody');
      if (classBody) classBody.innerHTML = (data.classBreakdown || []).map((row) => `<tr><td>${esc(row.className || '-')}</td><td>${esc(row.grade || '-')}</td><td>${esc(String(row.students || 0))}</td><td>${esc(String(row.submissions || 0))}</td><td>${esc(String(row.averagePercent || 0))}%</td></tr>`).join('') || '<tr><td colspan="5">No class homework analytics yet.</td></tr>';
      if (status) status.textContent = 'Homework analytics ready.';
    } catch (error) {
      if (status) status.textContent = error.message || 'Could not load homework analytics.';
    }
  }

  async function exportHomeworkExcel(){
    const status = $('homeworkReportStatus') || $('homeworkAnalyticsStatus');
    try {
      const filters = reportFilters();
      const query = `?action=reports&q=${encodeURIComponent(filters.q)}&className=${encodeURIComponent(filters.className)}&grade=${encodeURIComponent(filters.grade)}&fromDate=${encodeURIComponent(filters.fromDate)}&toDate=${encodeURIComponent(filters.toDate)}`;
      const [reportsData, analyticsData] = await Promise.all([api(query), api(`?action=analytics&className=${encodeURIComponent(filters.className)}&grade=${encodeURIComponent(filters.grade)}&fromDate=${encodeURIComponent(filters.fromDate)}&toDate=${encodeURIComponent(filters.toDate)}`)]);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet((reportsData.rows || []).length ? reportsData.rows : [{ Info:'No homework reports found' }]), 'Homework Reports');
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet((analyticsData.classBreakdown || []).length ? analyticsData.classBreakdown : [{ Info:'No class analytics' }]), 'Class Breakdown');
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet((analyticsData.topHomework || []).length ? analyticsData.topHomework : [{ Info:'No top homework data' }]), 'Top Homework');
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet((analyticsData.dailyTrend || []).length ? analyticsData.dailyTrend : [{ Info:'No daily trend' }]), 'Daily Trend');
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet([analyticsData.summary || {}]), 'Summary');
      XLSX.writeFile(wb, `homework-reports-${new Date().toISOString().slice(0,19).replace(/[T:]/g,'-')}.xlsx`);
      if (status) status.textContent = 'Homework Excel exported.';
    } catch (error) {
      if (status) status.textContent = error.message || 'Could not export homework Excel.';
    }
  }


  async function renderStudents(){
    const body = $('studentsTableBody');
    const search = String($('studentSearchInput')?.value || '').trim();
    if (!body) return;
    try {
      const data = await api(`?action=list-students&q=${encodeURIComponent(search)}`);
      const rows = Array.isArray(data.rows) ? data.rows : [];
      body.innerHTML = rows.map((row) => `<tr><td>${esc(row.studentId)}</td><td>${esc(row.pin)}</td><td>${esc(row.name)}</td><td>${esc(row.grade)}</td><td>${esc(row.className)}</td><td><button class="ghost-btn small-btn delete-student-btn" data-id="${esc(row.id)}" type="button">Delete</button></td></tr>`).join('') || '<tr><td colspan="6">No students yet.</td></tr>';
      const st = $('studentsStatus'); if (st) st.textContent = `${rows.length} student(s).`;
    } catch (error) {
      if (body) body.innerHTML = '<tr><td colspan="6">Could not load students.</td></tr>';
      const st = $('studentsStatus'); if (st) st.textContent = error.message || 'Could not load students.';
    }
  }

  async function saveStudentFromAdmin(){
    const name = String($('studentNameInput')?.value || '').trim();
    const grade = String($('studentGradeInput')?.value || 'KG1').trim();
    const className = String($('studentClassInput')?.value || '').trim();
    if (!name || !className) { const st = $('studentsStatus'); if (st) st.textContent = 'Enter student name and class.'; return; }
    try {
      await api('?action=save-student', { method:'POST', body: JSON.stringify({ name, grade, className }) });
      $('studentNameInput').value = '';
      $('studentClassInput').value = '';
      await renderStudents();
    } catch (error) {
      const st = $('studentsStatus'); if (st) st.textContent = error.message || 'Could not save student.';
    }
  }

  function saveHomework(){
    const data = formData();
    const status = $('homeworkAdminStatus');
    if (!data.title) return status && (status.textContent = 'Please enter homework title.');
    if (!data.date) return status && (status.textContent = 'Please choose the date.');
    if (!data.questions.length) return status && (status.textContent = 'Please add questions first.');
    api('', { method:'POST', body: JSON.stringify(data) }).then(() => {
      if (status) status.textContent = 'Homework saved.';
      $('reuseHomeworkSelect') && delete $('reuseHomeworkSelect').dataset.loadedHomeworkId;
      renderList();
    }).catch((error) => {
      if (status) status.textContent = error.message || 'Could not save homework.';
    });
  }

  function clearForm(){
    ['homeworkTitle','homeworkClasses','homeworkDate','homeworkQuestionList','homeworkTimerMinutes','homeworkPassword','homeworkQuestionSearch'].forEach((id) => { if ($(id)) $(id).value = ''; });
    ['homeworkTimerToggle','homeworkPasswordToggle'].forEach((id) => { if ($(id)) $(id).checked = false; });
    if ($('homeworkTryLimit')) $('homeworkTryLimit').value = '0';
    if ($('homeworkMode')) $('homeworkMode').value = 'select';
    if ($('reuseHomeworkSelect')) { $('reuseHomeworkSelect').value = ''; delete $('reuseHomeworkSelect').dataset.loadedHomeworkId; }
    selectedQuestionIds.clear();
    document.querySelectorAll('.homework-question-check').forEach((el) => { el.checked = false; });
    if ($('homeworkAdminStatus')) $('homeworkAdminStatus').textContent = '';
    renderPicker();
    updateModeVisibility();
  }

  function updateModeVisibility(){
    const manual = ($('homeworkMode')?.value || 'select') === 'manual';
    $('homeworkQuestionList')?.classList.toggle('hidden', !manual);
    $('homeworkQuestionPickerWrap')?.classList.toggle('hidden', manual);
  }

  function wire(){
    $('homeworkGrade')?.addEventListener('change', () => { selectedQuestionIds.clear(); renderPicker(); updateModeVisibility(); });
    $('homeworkMode')?.addEventListener('change', updateModeVisibility);
    $('homeworkQuestionSearch')?.addEventListener('input', renderPicker);
    $('searchHomeworkQuestionsBtn')?.addEventListener('click', renderPicker);
    $('selectAllHomeworkQuestionsBtn')?.addEventListener('click', () => { filteredPickerRows().forEach((row) => selectedQuestionIds.add(String(row.__index))); syncSelectedQuestionState(); });
    $('clearHomeworkQuestionsBtn')?.addEventListener('click', () => { filteredPickerRows().forEach((row) => selectedQuestionIds.delete(String(row.__index))); syncSelectedQuestionState(); });
    $('saveHomeworkBtn')?.addEventListener('click', saveHomework);
    $('clearHomeworkBtn')?.addEventListener('click', clearForm);
    $('refreshHomeworkReportsBtn')?.addEventListener('click', () => { renderReports(); renderHomeworkAnalytics(); });
    $('homeworkReportSearchBtn')?.addEventListener('click', () => { renderReports(); renderHomeworkAnalytics(); });
    $('homeworkReportSearch')?.addEventListener('keydown', (e) => { if (e.key === 'Enter') renderReports(); });
    $('homeworkReportClassFilter')?.addEventListener('keydown', (e) => { if (e.key === 'Enter') { renderReports(); renderHomeworkAnalytics(); } });
    $('refreshHomeworkAnalyticsBtn')?.addEventListener('click', renderHomeworkAnalytics);
    $('exportHomeworkReportsExcelBtn')?.addEventListener('click', exportHomeworkExcel);
    ['homeworkAnalyticsGradeFilter','homeworkAnalyticsClassFilter','homeworkAnalyticsFromDate','homeworkAnalyticsToDate'].forEach((id) => $(id)?.addEventListener('change', () => { renderReports(); renderHomeworkAnalytics(); }));
    $('loadReuseHomeworkBtn')?.addEventListener('click', () => loadHomeworkIntoForm($('reuseHomeworkSelect')?.value || ''));
  $('saveStudentBtn')?.addEventListener('click', saveStudentFromAdmin);
  $('studentSearchBtn')?.addEventListener('click', renderStudents);
  $('studentSearchInput')?.addEventListener('keydown', (e) => { if (e.key === 'Enter') renderStudents(); });
    document.addEventListener('click', async (e) => {
const delStudent = e.target.closest('.delete-student-btn');
if (delStudent) { try { await api('?action=delete-student', { method:'DELETE', body: JSON.stringify({ id: delStudent.dataset.id || '' }) }); await renderStudents(); } catch (error) { const st = $('studentsStatus'); if (st) st.textContent = error.message || 'Could not delete student.'; } return; }

      const questionCheck = e.target.closest('.homework-question-check');
      if (questionCheck) {
        const key = String(questionCheck.value || '');
        if (questionCheck.checked) selectedQuestionIds.add(key);
        else selectedQuestionIds.delete(key);
      }
      const deleteBtn = e.target.closest('.homework-delete-btn');
      if (deleteBtn) {
        api('', { method:'DELETE', body: JSON.stringify({ id: deleteBtn.dataset.id }) }).then(() => renderList()).catch((error) => { $('homeworkAdminStatus').textContent = error.message || 'Could not delete homework.'; });
        return;
      }
      const loadBtn = e.target.closest('.homework-load-btn');
      if (loadBtn) {
        loadHomeworkIntoForm(loadBtn.dataset.id || '');
        return;
      }
      const reportBtn = e.target.closest('.homework-report-open-btn');
      if (reportBtn) openReport(reportBtn.dataset.id || '');
    });
  }

  renderPicker();
  renderList();
  renderReports();
  renderHomeworkAnalytics();
  wire();
  updateModeVisibility();
})();
