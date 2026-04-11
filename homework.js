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
    if (/^[^\/]+\.[a-z0-9]+$/i.test(clean)) return '/assets/quiz-bulk/' + clean;

    return '/assets/' + clean;
  }

  function renderQuestion(){
    const q = state.assignment.questions[state.index];
    if (!q) return finishHomework(false);
    updateQuizHead();
    $('homeworkQuestionText').textContent = q.text || 'Question';
    const imageWrap = $('homeworkQuestionMediaWrap');
    const imageEl = $('homeworkQuestionImage');
    const imageSrc = resolveQuestionImage(q.image);
    if (imageWrap && imageEl) {
      if (imageSrc) {
        imageEl.onerror = function(){ this.removeAttribute('src'); if (imageWrap) imageWrap.classList.add('hidden'); };
        imageEl.src = imageSrc;
        imageEl.alt = q.text || 'Question image';
        imageWrap.classList.remove('hidden');
      } else {
        imageEl.removeAttribute('src');
        imageWrap.classList.add('hidden');
      }
    }
    $('homeworkOptionsWrap').innerHTML = (q.options || []).map((opt, idx) => `<button type="button" class="option-btn" data-option="${idx}">${esc(opt)}</button>`).join('');
    document.querySelectorAll('#homeworkOptionsWrap .option-btn').forEach((btn) => {
      btn.addEventListener('click', function(){
        if (state.answers[state.index]) return;
        chooseAnswer(this.textContent || '');
      });
    });
  }

  function chooseAnswer(choice){
    const q = state.assignment.questions[state.index];
    state.answers[state.index] = {
      index: state.index,
      questionText: q.text,
      chosen: String(choice || '').trim(),
      answeredAt: new Date().toISOString()
    };
    document.querySelectorAll('#homeworkOptionsWrap .option-btn').forEach((btn) => {
      btn.disabled = true;
      btn.classList.add(String(btn.textContent || '').trim() === String(choice || '').trim() ? 'selected' : 'disabled');
    });
    updateQuizHead();
    window.clearTimeout(state.autoNextTimer);
    state.autoNextTimer = window.setTimeout(() => {
      if (!state || state.submitting) return;
      if (state.index >= state.assignment.questions.length - 1) finishHomework(false);
      else nextQuestion(true);
    }, 650);
  }

  function nextQuestion(skipPrompt){
    if (!state.answers[state.index]) {
      if (!skipPrompt) alert('Please choose an answer first.');
      return;
    }
    window.clearTimeout(state.autoNextTimer);
    state.index += 1;
    if (state.index >= state.assignment.questions.length) return finishHomework(false);
    renderQuestion();
  }

  function stopTimer(){
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
    if (state && state.autoNextTimer) {
      clearTimeout(state.autoNextTimer);
      state.autoNextTimer = null;
    }
  }

  function startTimer(){
    stopTimer();
    if (!state.assignment.useTimer || !state.timeLeft) {
      state.timeLeft = null;
      updateQuizHead();
      return;
    }
    updateQuizHead();
    timer = setInterval(() => {
      state.timeLeft -= 1;
      updateQuizHead();
      if (state.timeLeft <= 0) finishHomework(true);
    }, 1000);
  }

  async function finishHomework(timeUp){
    if (!state || state.submitting) return;
    state.submitting = true;
    stopTimer();
    try {
      const submitData = await api('submit', {
        method:'POST',
        body: JSON.stringify({
          identity: state.identity,
          homeworkId: state.assignment.id,
          token: state.token,
          answers: state.answers,
          timeUp: !!timeUp
        })
      });

      if (studentCloud && typeof studentCloud.submitResult === 'function') {
        try {
          await studentCloud.submitResult({
            identity: state.identity,
            quizKey: `HOMEWORK|${state.assignment.id}|${submitData.submission.id}`,
            result: submitData.result,
            state: {
              completed: true,
              currentIndex: state.index,
              selectedCount: state.assignment.questions.length,
              selectedLevelLabel: state.assignment.title,
              questions: state.assignment.questions,
              answers: submitData.result.answers
            }
          });
        } catch (error) {}
      }

      $('homeworkQuizSection').classList.add('hidden');
      $('homeworkDoneSection').classList.remove('hidden');
      $('homeworkDoneText').textContent = timeUp
        ? `Homework submitted automatically when time ended. Try ${submitData.submission.triesUsed} saved in reports.`
        : `Homework submitted successfully. Try ${submitData.submission.triesUsed} saved in reports.`;
      await renderAssignments();
    } catch (error) {
      setStatus(error.message || 'Could not submit homework.');
    } finally {
      state.submitting = false;
    }
  }

  async function startHomework(id){
    try {
      const identity = state && state.identity ? state.identity : await verifyStudent(false);
      const assignment = availableRows.find((row) => row.id === id);
      const passwordField = document.querySelector(`[data-homework-password-for="${CSS.escape(String(id || ''))}"]`);
      const password = assignment && assignment.usePassword ? String(passwordField?.value || '').trim() : '';
      if (assignment && assignment.usePassword && !password) throw new Error('Please enter the homework password.');
      const data = await api('start', {
        method:'POST',
        body: JSON.stringify({
          identity,
          homeworkId: id,
          password: password || ''
        })
      });
      state = {
        identity,
        assignment: data.assignment,
        token: data.token,
        index: 0,
        answers: [],
        timeLeft: data.assignment.useTimer ? Number(data.assignment.timerMinutes || 0) * 60 : null,
        submitting: false,
        autoNextTimer: null
      };
      $('homeworkStartCard').classList.add('hidden');
      $('homeworkDoneSection').classList.add('hidden');
      $('homeworkQuizSection').classList.remove('hidden');
      setStatus('');
      renderQuestion();
      startTimer();
    } catch (error) {
      setStatus(error.message || 'Could not start homework.');
    }
  }

  $('loadHomeworkBtn')?.addEventListener('click', renderAssignments);
  $('homeworkNextBtn')?.addEventListener('click', nextQuestion);
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.homework-open-btn');
    if (btn) startHomework(btn.dataset.id);
  });
})();
