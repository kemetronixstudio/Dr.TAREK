(function(){
  if (typeof document === 'undefined' || !document.body || document.body.dataset.page !== 'homework') return;
  const API = '/api/homework';
  const $ = (id) => document.getElementById(id);
  const studentCloud = window.studentCloud || null;
  let state = null;
  let timer = null;
  let availableRows = [];
  const esc = (v) => String(v || '').replace(/[&<>"']/g, (ch) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));

  async function api(action, options){
    const suffix = action ? `?action=${encodeURIComponent(action)}` : '';
    const res = await fetch(API + suffix, Object.assign({ headers:{ 'Content-Type':'application/json' }, cache:'no-store' }, options || {}));
    const data = await res.json().catch(()=>({ ok:false, error:'Could not complete request.' }));
    if (!res.ok || !data.ok) throw new Error(data.error || 'Could not complete request.');
    return data;
  }

  function setStatus(msg){
    $('homeworkStatus').textContent = msg || '';
  }

  function studentIdentity(){
    const studentId = String($('homeworkStudentId')?.value || '').trim();
    const pin = String($('homeworkStudentPin')?.value || '').trim();
    if (!studentId) throw new Error('Please enter student ID.');
    if (!pin) throw new Error('Please enter PIN.');
    const verified = state && state.identity ? state.identity : null;
    if (verified && verified.studentId === studentId && verified.pin === pin) return verified;
    return { studentId, pin };
  }

  async function verifyStudent(showStatus){
    const studentId = String($('homeworkStudentId')?.value || '').trim();
    const pin = String($('homeworkStudentPin')?.value || '').trim();
    const data = await api('identify-student', { method:'POST', body: JSON.stringify({ studentId, pin }) });
    state = state || {};
    state.identity = Object.assign({}, data.student || {}, { pin });
    const box = $('homeworkVerifiedBox');
    if (box) box.textContent = `Verified: ${data.student.name} - ${data.student.grade} / ${data.student.className}`;
    if (showStatus) setStatus('Student verified.');
    return state.identity;
  }

  async function renderAssignments(){
    try {
      const identity = await verifyStudent(false);
      const data = await api('available', { method:'POST', body: JSON.stringify({ identity }) });
      availableRows = Array.isArray(data.rows) ? data.rows : [];
      $('homeworkAvailableList').innerHTML = availableRows.map((hw) => {
        const used = Number(hw.triesUsed || 0) || 0;
        const limit = Number(hw.tryLimit || 0) || 0;
        const blocked = !!hw.blocked;
        const tryText = limit > 0 ? `${used} / ${limit}` : `${used}`;
        return `<div class="stored-question homework-card-item"><h4>${esc(hw.title)}</h4><p><strong>Date:</strong> ${esc(hw.date || '-')}</p><p><strong>Classes:</strong> ${esc((hw.classes || []).join(', ') || 'All')}</p><p><strong>Questions:</strong> ${esc(String((hw.questions || []).length))}</p><p><strong>Timer:</strong> ${hw.useTimer ? esc(String(hw.timerMinutes) + ' min') : 'No'}</p><p><strong>Password:</strong> ${hw.usePassword ? 'Required' : 'No'}</p>${hw.usePassword ? `<label class="homework-password-row"><span>Homework password</span><input type="password" class="homework-password-input" data-homework-password-for="${esc(hw.id)}" placeholder="Enter homework password"></label>` : ''}<p><strong>Tries used:</strong> ${esc(tryText)}${limit === 0 ? ' <span class="muted-note">(no limit)</span>' : ''}</p><div class="action-row"><button class="main-btn homework-open-btn" data-id="${esc(hw.id)}" ${blocked ? 'disabled' : ''}>${blocked ? 'No tries left' : 'Start homework'}</button></div></div>`;
      }).join('') || '<div class="muted-note">No homework available for this grade and class.</div>';
      setStatus(availableRows.length ? `${availableRows.length} homework item(s) found.` : 'No homework found.');
    } catch (error) {
      availableRows = [];
      $('homeworkAvailableList').innerHTML = '';
      setStatus(error.message || 'Could not load homework.');
    }
  }

  function updateQuizHead(){
    $('homeworkStudentPreview').textContent = `${state.identity.name} (${state.identity.studentId})`;
    $('homeworkTitlePreview').textContent = state.assignment.title;
    $('homeworkQuestionProgress').textContent = `${state.index + 1} / ${state.assignment.questions.length}`;
    $('homeworkAnsweredValue').textContent = String(state.answers.filter((a) => a && a.chosen).length);
    $('homeworkClassBadge').textContent = state.identity.className;
    $('homeworkDateBadge').textContent = state.assignment.date || '-';
    $('homeworkTimerValue').textContent = state.timeLeft == null ? 'Off' : String(state.timeLeft);
  }

  function resolveQuestionImage(image){
  if (typeof normalizeQuestionImage === 'function') return normalizeQuestionImage(image);
  const value = String(image || '').trim();
  if (!value) return '';
  if (/^(https?:)?\/\//i.test(value) || value.startsWith('data:') || value.startsWith('/')) return value;

  const clean = value.replace(/^\.\//, '').replace(/^\/+/, '');
  if (/^assets\//i.test(clean)) return '/' + clean;
  if (/^(quiz-bulk|svg|img|icons)\//i.test(clean)) return '/assets/' + clean;

  if (/^[^\/]+\.[a-z0-9]+$/i.test(clean)) {
    return '/assets/quiz-bulk/' + clean;
  }

  return '/assets/' + clean;
})();
