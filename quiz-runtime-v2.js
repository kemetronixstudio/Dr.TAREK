(function(){
  if (window.__kgQuizRuntimeV2Loaded) return;
  window.__kgQuizRuntimeV2Loaded = true;

  function $(id){ return document.getElementById(id); }
  function lang(){ try { return typeof getLang === 'function' ? getLang() : 'en'; } catch (error) { return 'en'; } }
  function t(key, fallback){
    try { return (((translations || {})[lang()] || {})[key]) || fallback || key; }
    catch (error) { return fallback || key; }
  }
  function gradeKey(){
    const bodyGrade = String((document.body && document.body.dataset && document.body.dataset.grade) || '').trim().toLowerCase();
    if (bodyGrade) return bodyGrade;
    try {
      return String(new URLSearchParams(location.search).get('grade') || '').trim().toLowerCase();
    } catch (error) {
      return '';
    }
  }
  function cloneNode(id){
    return cloneElement($(id));
  }
  function cloneElement(node){
    if (!node || !node.parentNode) return node;
    const clone = node.cloneNode(true);
    node.parentNode.replaceChild(clone, node);
    return clone;
  }
  function clearTimer(state){
    if (state && state.timerId) { clearInterval(state.timerId); state.timerId = null; }
    if (state && state.autoNextId) { clearTimeout(state.autoNextId); state.autoNextId = null; }
  }
  function levelLabelForCount(count){
    const map = { 10:'level1', 20:'level2', 30:'level3', 40:'level4', 50:'level5' };
    return t(map[Number(count)] || 'level1', 'Level 1');
  }
  function skillLabel(skill){
    try { return ((skillLabels || {})[lang()] || {})[skill] || skill || '-'; }
    catch (error) { return skill || '-'; }
  }
  function questionTypeLabel(type){
    try { return ((typeLabels || {})[lang()] || {})[type] || type || t('questionTypeDefault', 'Question'); }
    catch (error) { return type || t('questionTypeDefault', 'Question'); }
  }
  function highlightAnswers(optionsWrap, answer){
    Array.from(optionsWrap.querySelectorAll('.option-btn')).forEach(function(btn){
      btn.disabled = true;
      const value = String(btn.dataset.optionValue || '');
      if (answer && value === String(answer.expected || '')) btn.classList.add('correct');
      if (value === String(answer.chosen || '') && !answer.correct) btn.classList.add('wrong');
    });
  }
  function certificatePayloadFromResult(result){
    return {
      studentName: result.studentName,
      studentId: result.studentId || '',
      className: result.className || '',
      isGuest: !!result.isGuest,
      grade: result.grade,
      quizLevel: result.quizLevel,
      questionCount: result.questionCount,
      score: result.score,
      percent: result.percent,
      strengths: Array.isArray(result.strengths) ? result.strengths : [],
      weaknesses: Array.isArray(result.weaknesses) ? result.weaknesses : [],
      advice: result.advice || (typeof smartAdvice === 'function' ? smartAdvice(result.weaknesses || []) : ''),
      remark: result.remark || (typeof resultRemark === 'function' ? resultRemark(result.percent || 0) : ''),
      date: result.date || new Date().toLocaleDateString('en-GB'),
      lang: result.lang || lang(),
      missedQuestions: Array.isArray(result.missedQuestions) ? result.missedQuestions : [],
      answers: Array.isArray(result.answers) ? result.answers : [],
      questions: Array.isArray(result.questions) ? result.questions : []
    };
  }
  function saveCertificateAndGo(result){
    if (!result) return;
    try {
      localStorage.setItem(storeKeys.cert, JSON.stringify(certificatePayloadFromResult(result)));
    } catch (error) {}
    try {
      if (typeof recordStudentAttempt === 'function') recordStudentAttempt(certificatePayloadFromResult(result));
    } catch (error) {}
    location.href = 'certificate.html';
  }
  function withPasswordRetry(studentCloud, payload, runner){
    return runner(payload).catch(async function(error){
      if (!error || (error.code !== 'PASSWORD_REQUIRED' && error.code !== 'INVALID_PASSWORD')) throw error;
      const promptText = error.code === 'INVALID_PASSWORD'
        ? 'Wrong quiz password. Enter the correct password to continue.'
        : 'This quiz is protected. Enter the quiz password to continue.';
      const accessPassword = window.prompt(promptText) || '';
      if (!accessPassword) throw error;
      const nextPayload = Object.assign({}, payload, { accessPassword });
      return runner(nextPayload);
    });
  }
  function renderTeacherTestLaunch(grade){
    const wrap = $('testLaunchWrap');
    if (!wrap) return;
    const tests = typeof getTeacherTests === 'function' ? getTeacherTests() : {};
    const active = tests && tests[grade] && tests[grade].enabled ? tests[grade] : null;
    if (!active) {
      wrap.classList.add('hidden');
      return;
    }
    wrap.classList.remove('hidden');
    const title = wrap.querySelector('h2');
    const text = wrap.querySelector('p');
    if (title) title.textContent = active.name || t('teacherTestTitle', 'Teacher Test');
    if (text) text.textContent = active.mode === 'manual' || active.mode === 'select'
      ? `A custom teacher test is active with ${active.count || 0} selected questions.`
      : `A random teacher test is active with ${active.count || 0} questions.`;
  }

  function init(){
    if (!document.body || document.body.dataset.page !== 'quiz') return;
    const studentCloud = window.studentCloud;
    if (!studentCloud) return;
    const safeGrade = gradeKey();
    if (!safeGrade) {
      setTimeout(init, 100);
      return;
    }

    try { if (typeof studentCloud.ensureQuizIdentityFields === 'function') studentCloud.ensureQuizIdentityFields(safeGrade.toUpperCase()); } catch (error) {}

    const setupCard = $('setupCard');
    const levelChooser = $('levelChooser');
    const quizSection = $('quizSection');
    const studentNameInput = $('studentName');
    const studentPreview = $('studentPreview');
    const quizLevelLabel = $('quizLevelLabel');
    const questionProgressEl = $('questionProgress');
    const timerValueEl = $('timerValue');
    const scoreValueEl = $('scoreValue');
    const skillBadge = $('skillBadge');
    const typeBadge = $('questionTypeBadge');
    const questionText = $('questionText');
    const optionsWrap = $('optionsWrap');
    const nextBtn = cloneNode('nextBtn');
    const goBtn = cloneNode('goToLevelBtn');
    const voiceBtn = cloneNode('voiceBtn');
    const startAssignedTestBtn = cloneNode('startAssignedTestBtn');
    const levelBtns = Array.from(document.querySelectorAll('#levelChooser .level-btn[data-count]')).map(function(btn){ return cloneElement(btn); }).filter(Boolean);
    const autoNextToggle = $('autoNextToggle');

    const liveState = {
      started: false,
      lock: false,
      identity: null,
      quizKey: '',
      progress: null,
      result: null,
      timerId: null,
      autoNextId: null,
      currentQuestion: null
    };

    function currentQuestion(){
      return liveState.currentQuestion || (liveState.progress && (liveState.progress.question || (liveState.progress.questions || [])[liveState.progress.currentIndex])) || null;
    }

    function setSetupLocked(flag){
      if (studentNameInput) studentNameInput.disabled = !!flag;
      const studentId = $('studentId');
      const studentClass = $('studentClass');
      const studentGuest = $('studentGuest');
      if (studentId) studentId.disabled = !!flag;
      if (studentClass) studentClass.disabled = !!flag || !!(studentGuest && studentGuest.checked);
      if (studentGuest) studentGuest.disabled = !!flag;
      if (goBtn) goBtn.disabled = !!flag;
    }

    function showQuizSection(){
      if (setupCard) setupCard.classList.add('hidden');
      if (quizSection) quizSection.classList.remove('hidden');
    }

    function startTimer(seconds){
      clearTimer(liveState);
      const progress = liveState.progress || {};
      if (!progress.timerEnabled || !progress.timeLimitSeconds) {
        if (timerValueEl) timerValueEl.textContent = '∞';
        return;
      }
      let remaining = Math.max(0, Number(seconds || progress.timeLimitSeconds) || progress.timeLimitSeconds || 0);
      const deadline = Date.now() + remaining * 1000;
      if (timerValueEl) timerValueEl.textContent = String(remaining);
      liveState.timerId = setInterval(function(){
        const next = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
        if (timerValueEl) timerValueEl.textContent = String(next);
        if (next <= 0) {
          clearTimer(liveState);
          submitAnswer('', true).catch(function(error){ console.warn('timeout submit failed', error); });
        }
      }, 200);
    }

    function renderQuestion(){
      clearTimer(liveState);
      liveState.lock = false;
      const progress = liveState.progress;
      const q = currentQuestion();
      if (!progress || !q) {
        if (liveState.result) saveCertificateAndGo(liveState.result);
        return;
      }
      liveState.currentQuestion = q;
      showQuizSection();
      if (studentPreview) studentPreview.textContent = liveState.identity && liveState.identity.name ? liveState.identity.name : '-';
      if (quizLevelLabel) quizLevelLabel.textContent = progress.selectedLevelLabel || t('quizLabel', 'Quiz');
      if (questionProgressEl) questionProgressEl.textContent = `${Math.min((Number(progress.currentIndex || 0) + 1), Number(progress.questionCount || 1))} / ${Number(progress.questionCount || (progress.questions || []).length || 1)}`;
      if (scoreValueEl) scoreValueEl.textContent = String(Number(progress.score || 0) || 0);
      if (skillBadge) skillBadge.textContent = skillLabel(q.skill);
      if (typeBadge) typeBadge.textContent = questionTypeLabel(q.type);
      if (questionText) questionText.textContent = q.text || t('questionTypeDefault', 'Question');
      if (typeof loadQuestionImage === 'function') loadQuestionImage(q.image, q.text || '');
      optionsWrap.innerHTML = (q.options || []).map(function(opt){
        return `<button type="button" class="option-btn"><span>${escapeHtml(opt)}</span></button>`;
      }).join('');
      Array.from(optionsWrap.querySelectorAll('.option-btn')).forEach(function(btn, index){
        const opt = (q.options || [])[index];
        btn.dataset.optionValue = opt;
        btn.addEventListener('click', function(){ submitAnswer(opt, false).catch(function(error){ alert(error.message || 'Could not save the answer.'); }); });
      });
      if (nextBtn) {
        nextBtn.disabled = true;
        nextBtn.classList.toggle('hidden', !!(autoNextToggle && autoNextToggle.checked));
      }
      startTimer(progress.timeLeft != null ? progress.timeLeft : progress.timeLimitSeconds);
    }

    async function submitAnswer(chosen, timedOut){
      if (liveState.lock) return;
      const q = currentQuestion();
      if (!q || !liveState.identity || !liveState.quizKey) return;
      liveState.lock = true;
      clearTimer(liveState);
      const response = await studentCloud.answerQuestion({
        identity: liveState.identity,
        quizKey: liveState.quizKey,
        questionId: q.id,
        chosen,
        timedOut: !!timedOut
      });
      if (response.stale) {
        liveState.progress = response.progress || liveState.progress;
        liveState.result = response.result || liveState.result;
        renderQuestion();
        return;
      }
      liveState.progress = response.progress || liveState.progress;
      liveState.result = response.result || null;
      if (response.answer) {
        highlightAnswers(optionsWrap, response.answer);
        if (response.answer.correct) {
          try { if (typeof showStars === 'function') showStars(3); } catch (error) {}
          try { if (typeof playTone === 'function') playTone('correct'); } catch (error) {}
        } else {
          try { if (typeof playTone === 'function') playTone('wrong'); } catch (error) {}
        }
      }
      if (scoreValueEl) scoreValueEl.textContent = String((liveState.progress && liveState.progress.score) || 0);
      if (response.finished && response.result) {
        try { if (typeof playTone === 'function') playTone('finish'); } catch (error) {}
        saveCertificateAndGo(response.result);
        return;
      }
      if (nextBtn) {
        nextBtn.disabled = false;
        nextBtn.classList.toggle('hidden', !!(autoNextToggle && autoNextToggle.checked));
      }
      if (autoNextToggle && autoNextToggle.checked) {
        liveState.autoNextId = setTimeout(renderQuestion, 420);
      } else {
        liveState.lock = false;
      }
    }

    async function launch(useTeacherTest, count, label){
      let identity;
      try {
        identity = studentCloud.collectIdentity(safeGrade.toUpperCase());
      } catch (error) {
        alert(error.message || t('enterNameAlert', 'Please enter the student name first.'));
        return;
      }
      const payload = {
        identity,
        gradeKey: safeGrade,
        count,
        label,
        useTeacherTest: !!useTeacherTest,
        lang: lang()
      };
      try {
        const response = await withPasswordRetry(studentCloud, payload, studentCloud.startSession);
        if (response.result) {
          saveCertificateAndGo(response.result);
          return;
        }
        liveState.started = true;
        liveState.identity = response.identity || identity;
        liveState.quizKey = response.quizKey;
        liveState.progress = response.progress;
        liveState.result = null;
        renderQuestion();
      } catch (error) {
        alert(error.message || 'Could not start the quiz.');
      }
    }

    goBtn?.addEventListener('click', function(){
      try {
        liveState.identity = studentCloud.collectIdentity(safeGrade.toUpperCase());
      } catch (error) {
        alert(error.message || t('enterNameAlert', 'Please enter the student name first.'));
        return;
      }
      if (levelChooser) levelChooser.classList.remove('hidden');
      setSetupLocked(true);
      renderTeacherTestLaunch(safeGrade);
      try { if (typeof renderStudentHistory === 'function') renderStudentHistory(studentNameInput && studentNameInput.value, safeGrade); } catch (error) {}
    });

    levelBtns.forEach(function(btn){
      const count = Number(btn.dataset.count || 10) || 10;
      btn.addEventListener('click', function(){ launch(false, count, levelLabelForCount(count)); });
    });

    startAssignedTestBtn?.addEventListener('click', function(){
      const tests = typeof getTeacherTests === 'function' ? getTeacherTests() : {};
      const active = tests && tests[safeGrade] && tests[safeGrade].enabled ? tests[safeGrade] : null;
      if (!active) return;
      launch(true, Number(active.count || 10) || 10, active.name || t('teacherTestTitle', 'Teacher Test'));
    });

    nextBtn?.addEventListener('click', function(){ renderQuestion(); });
    voiceBtn?.addEventListener('click', function(){
      const q = currentQuestion();
      if (!q) return;
      try { if (typeof unlockSpeech === 'function') unlockSpeech(); } catch (error) {}
      try { if (typeof speakText === 'function') speakText(q.text || '', true); } catch (error) {}
    });

    window.addEventListener('kg:langchange', function(){
      if (liveState.started && liveState.progress) renderQuestion();
      else renderTeacherTestLaunch(safeGrade);
    });

    renderTeacherTestLaunch(safeGrade);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
