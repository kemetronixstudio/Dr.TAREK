(function(){
  if (typeof document === 'undefined' || !document.body || document.body.dataset.page !== 'homework') return;
  const API = '/api/homework';
  const TRY_KEY = 'kgHomeworkTryCountsV1';
  const $ = (id) => document.getElementById(id);
  const studentCloud = window.studentCloudClient || null;
  let state = null;
  let timer = null;
  const esc = (v) => String(v || '').replace(/[&<>"']/g, (ch) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  async function readAssignments(){
    const res = await fetch(API, { cache:'no-store' });
    const data = await res.json().catch(()=>({ ok:false, rows:[] }));
    if (!res.ok || !data.ok) throw new Error(data.error || 'Could not load homework.');
    return Array.isArray(data.rows) ? data.rows : [];
  }
  const readTries = () => { try { return JSON.parse(localStorage.getItem(TRY_KEY) || '{}'); } catch (e) { return {}; } };
  const writeTries = (v) => localStorage.setItem(TRY_KEY, JSON.stringify(v || {}));
  function setStatus(msg){ $('homeworkStatus').textContent = msg || ''; }
  function studentIdentity(){
    const name = String($('homeworkStudentName').value || '').trim();
    const studentId = String($('homeworkStudentId').value || '').trim();
    const grade = String($('homeworkStudentGrade').value || 'KG1').trim();
    const className = String($('homeworkStudentClass').value || '').trim();
    if (!name) throw new Error('Please enter student name.');
    if (!className) throw new Error('Please enter class name.');
    return { name, studentId, grade, className, isGuest:false };
  }
  function norm(v){ return String(v || '').trim().toLowerCase(); }
  function tryKey(student, hw){ return [norm(student.grade), norm(student.className), norm(student.studentId || student.name), hw.id].join('::'); }
  async function renderAssignments(){
    try {
      const student = studentIdentity();
      const rows = (await readAssignments()).filter((hw) => norm(hw.grade) === norm(student.grade) && (!(hw.classes||[]).length || (hw.classes || []).some((c) => norm(c) === norm(student.className))));
      const tries = readTries();
      $('homeworkAvailableList').innerHTML = rows.map((hw) => {
        const used = Number(tries[tryKey(student, hw)] || 0) || 0;
        const blocked = Number(hw.tryLimit || 0) > 0 && used >= Number(hw.tryLimit || 0);
        return `<div class="stored-question"><h4>${esc(hw.title)}</h4><p><strong>Date:</strong> ${esc(hw.date || '-')}</p><p><strong>Classes:</strong> ${esc((hw.classes || []).join(', ') || 'All')}</p><p><strong>Questions:</strong> ${esc(String((hw.questions || []).length))}</p><p><strong>Timer:</strong> ${hw.useTimer ? esc(String(hw.timerMinutes) + ' min') : 'No'}</p><p><strong>Password:</strong> ${hw.usePassword ? 'Required' : 'No'}</p><p><strong>Tries used:</strong> ${used}${Number(hw.tryLimit || 0) > 0 ? ' / ' + Number(hw.tryLimit || 0) : ''}</p><div class="action-row"><button class="main-btn homework-open-btn" data-id="${esc(hw.id)}" ${blocked ? 'disabled' : ''}>${blocked ? 'No tries left' : 'Start homework'}</button></div></div>`;
      }).join('') || '<div class="muted-note">No homework available for this grade and class.</div>';
      setStatus(rows.length ? rows.length + ' homework item(s) found.' : 'No homework found.');
    } catch (error) {
      $('homeworkAvailableList').innerHTML='';
      setStatus(error.message || 'Could not load homework.');
    }
  }
  function updateQuizHead(){
    $('homeworkStudentPreview').textContent = state.identity.name;
    $('homeworkTitlePreview').textContent = state.assignment.title;
    $('homeworkQuestionProgress').textContent = `${state.index + 1} / ${state.assignment.questions.length}`;
    $('homeworkAnsweredValue').textContent = String(state.answers.filter((a) => a.chosen).length);
    $('homeworkClassBadge').textContent = state.identity.className;
    $('homeworkDateBadge').textContent = state.assignment.date || '-';
    $('homeworkTimerValue').textContent = state.timeLeft == null ? 'Off' : String(state.timeLeft);
  }
  function renderQuestion(){
    const q = state.assignment.questions[state.index];
    if (!q) return finishHomework();
    updateQuizHead();
    $('homeworkQuestionText').textContent = q.text || 'Question';
    $('homeworkOptionsWrap').innerHTML = (q.options || []).map((opt, idx) => `<button type="button" class="option-btn" data-option="${idx}">${esc(opt)}</button>`).join('');
    document.querySelectorAll('#homeworkOptionsWrap .option-btn').forEach((btn) => btn.addEventListener('click', function(){ chooseAnswer(this.textContent || ''); }));
  }
  function chooseAnswer(choice){
    const q = state.assignment.questions[state.index];
    state.answers[state.index] = { index: state.index, questionText: q.text, chosen: choice, correct: choice === q.answer, expected: q.answer, answeredAt: new Date().toISOString() };
    document.querySelectorAll('#homeworkOptionsWrap .option-btn').forEach((btn) => { btn.disabled = true; btn.classList.add(String(btn.textContent || '').trim() === String(choice || '').trim() ? 'selected' : 'disabled'); });
    updateQuizHead();
  }
  function nextQuestion(){
    if (!state.answers[state.index]) { alert('Please choose an answer first.'); return; }
    state.index += 1;
    if (state.index >= state.assignment.questions.length) return finishHomework();
    renderQuestion();
  }
  function startTimer(){
    stopTimer();
    if (!state.assignment.useTimer || !state.timeLeft) { state.timeLeft = null; updateQuizHead(); return; }
    updateQuizHead();
    timer = setInterval(() => { state.timeLeft -= 1; updateQuizHead(); if (state.timeLeft <= 0) finishHomework(true); }, 1000);
  }
  function stopTimer(){ if (timer) { clearInterval(timer); timer = null; } }
  async function finishHomework(timeUp){
    stopTimer();
    const questions = state.assignment.questions || [];
    const answers = questions.map((q, i) => state.answers[i] || { index:i, questionText:q.text, chosen:'', correct:false, expected:q.answer, answeredAt:new Date().toISOString() });
    const score = answers.filter((a) => a.correct).length;
    const percent = questions.length ? Math.round((score / questions.length) * 100) : 0;
    const result = { studentName:state.identity.name, studentId:state.identity.studentId || '', className:state.identity.className, grade:state.identity.grade, quizLevel:'Homework', questionCount:questions.length, score, percent, strengths:[], weaknesses:[], advice:'Homework submitted.', remark: timeUp ? 'Time Up' : 'Submitted', date:new Date().toLocaleDateString('en-GB'), lang:'en', missedQuestions:answers.filter((a) => !a.correct).map((a) => a.questionText), answers, questions, homeworkId:state.assignment.id, homeworkTitle:state.assignment.title, completedAt:new Date().toISOString() };
    if (studentCloud) {
      try { await studentCloud.submitResult({ identity: state.identity, quizKey: `HOMEWORK|${state.assignment.id}|${Date.now()}`, result, state: { completed:true, currentIndex:state.index, selectedCount:questions.length, selectedLevelLabel:state.assignment.title, questions, answers } }); } catch (e) {}
    }
    const tries = readTries();
    const key = tryKey(state.identity, state.assignment);
    tries[key] = (Number(tries[key] || 0) || 0) + 1;
    writeTries(tries);
    $('homeworkQuizSection').classList.add('hidden');
    $('homeworkDoneSection').classList.remove('hidden');
    $('homeworkDoneText').textContent = timeUp ? 'Homework submitted automatically when time ended. Score saved for report.' : 'Homework submitted. Score saved for report.';
  }
  function startHomework(id){
    try {
      const identity = studentIdentity();
      readAssignments().then((rows) => {
        const assignment = rows.find((row) => row.id === id);
        if (!assignment) throw new Error('Homework was not found.');
        const tries = readTries();
        const used = Number(tries[tryKey(identity, assignment)] || 0) || 0;
        if (Number(assignment.tryLimit || 0) > 0 && used >= Number(assignment.tryLimit || 0)) throw new Error('No tries left for this homework.');
        if (assignment.usePassword) { const pass = prompt('Enter homework password'); if (String(pass || '') !== String(assignment.password || '')) throw new Error('Wrong password.'); }
        state = { identity, assignment, index:0, answers:[], timeLeft: assignment.useTimer ? Number(assignment.timerMinutes || 0) * 60 : null };
        $('homeworkStartCard').classList.add('hidden');
        $('homeworkDoneSection').classList.add('hidden');
        $('homeworkQuizSection').classList.remove('hidden');
        renderQuestion();
        startTimer();
      }).catch((error) => { setStatus(error.message || 'Could not start homework.'); });
    } catch (error) {
      setStatus(error.message || 'Could not start homework.');
    }
  }
  $('loadHomeworkBtn').addEventListener('click', renderAssignments);
  $('homeworkNextBtn').addEventListener('click', nextQuestion);
  document.addEventListener('click', (e) => { const btn = e.target.closest('.homework-open-btn'); if (btn) startHomework(btn.dataset.id); });
})();
