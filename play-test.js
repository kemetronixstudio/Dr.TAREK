(function(){
  if (window.__kgPlayRuntimeV2Loaded) return;
  window.__kgPlayRuntimeV2Loaded = true;

  const API = '/api/student/play';
  const LOCAL_KEY = 'kgPlaySessionV2';
  const GRADE_OPTIONS = ['KG1','KG2','Grade1','Grade2','Grade3','Grade4','Grade5','Grade6'];

  function $(id){ return document.getElementById(id); }
  function lang(){ try { return typeof getLang === 'function' ? getLang() : 'en'; } catch (error) { return 'en'; } }
  function t(key, fallback){
    try { return (((translations || {})[lang()] || {})[key]) || fallback || key; }
    catch (error) { return fallback || key; }
  }
  function escape(value){
    if (typeof escapeHtml === 'function') return escapeHtml(value);
    return String(value || '').replace(/[&<>"']/g, function(ch){ return ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' })[ch]; });
  }
  function stageLabel(stage){
    const safe = String(stage || '').trim().toLowerCase();
    if (safe === 'explorer') return t('playStageExplorer', 'Explorer');
    if (safe === 'champion') return t('playStageChampion', 'Champion');
    return t('playStageStarter', 'Starter');
  }
  function readLocal(){
    try { return JSON.parse(localStorage.getItem(LOCAL_KEY) || 'null'); } catch (error) { return null; }
  }
  function saveLocal(state){
    try { localStorage.setItem(LOCAL_KEY, JSON.stringify(state)); } catch (error) {}
  }
  function clearLocal(){
    try { localStorage.removeItem(LOCAL_KEY); } catch (error) {}
  }
  async function request(action, payload, method){
    const response = await fetch(`${API}?action=${encodeURIComponent(action)}`, {
      method: method || 'POST',
      headers: { 'Content-Type':'application/json', 'Cache-Control':'no-store, no-cache, max-age=0', Pragma:'no-cache' },
      cache: 'no-store',
      credentials: 'same-origin',
      body: method === 'GET' ? undefined : JSON.stringify(payload || {})
    });
    const data = await response.json().catch(()=>({ ok:false, error:'Request failed' }));
    if (!response.ok || !data.ok) {
      const err = new Error(data.error || ('Request failed: ' + response.status));
      err.status = response.status;
      err.payload = data;
      throw err;
    }
    return data;
  }

  function initGradeOptions(){
    const select = $('playStudentGrade');
    if (!select) return;
    const current = select.value || 'KG1';
    select.innerHTML = GRADE_OPTIONS.map(function(grade){ return `<option value="${grade}">${grade}</option>`; }).join('');
    select.value = GRADE_OPTIONS.includes(current) ? current : 'KG1';
  }

  function normalizeIdentity(){
    const name = String($('playStudentName')?.value || '').trim();
    const studentId = String($('playStudentId')?.value || '').trim();
    const grade = String($('playStudentGrade')?.value || 'KG1').trim();
    if (!name) throw new Error(t('playEnterName', 'Please enter the student name first.'));
    return { name, studentId, grade, className: 'Play & Test', isGuest: true };
  }

  function setStatus(message){
    const el = $('playStatus');
    if (el) el.textContent = String(message || '');
  }

  function hideModeUi(){
    ['modeTop3Tabs','leaderboardModeTabs','gameModeCardsWrap','totalTimerInlineWrap'].forEach(function(id){
      const el = $(id);
      if (el) el.style.display = 'none';
    });
  }

  function renderTop3(top3){
    const box = $('playTop3List');
    if (!box) return;
    const rows = Array.isArray(top3) ? top3 : [];
    if (!rows.length) {
      box.innerHTML = `<div class="play-top3-empty">${escape(t('playNoTop3', 'No scores yet. Be the first champion!'))}</div>`;
      return;
    }
    box.innerHTML = rows.slice(0, 3).map(function(row, index){
      const medal = ['🥇','🥈','🥉'][index] || '🏅';
      return `<div class="play-top3-item"><div class="play-top3-rank">${medal}</div><div><strong>${escape(row.studentName || '-')}</strong><div class="muted-note">${escape(row.grade || '')} • ${escape(String(row.bestScore || 0))}</div></div></div>`;
    }).join('');
  }

  function renderLeaderboard(data){
    const leaderboard = data && Array.isArray(data.leaderboard) ? data.leaderboard : [];
    const tbody = $('playLeaderboardBody');
    if (tbody) {
      tbody.innerHTML = leaderboard.length
        ? leaderboard.map(function(row){
            const when = row.lastPlayedAt ? new Date(row.lastPlayedAt).toLocaleString() : '-';
            return `<tr><td>${row.rank || ''}</td><td>${escape(row.studentName || '-')}</td><td>${escape(row.grade || '-')}</td><td>${escape(row.studentId || '-')}</td><td>${escape(String(row.bestScore || 0))}</td><td>${escape(String(row.attempts || 0))}</td><td>${escape(when)}</td></tr>`;
          }).join('')
        : `<tr><td colspan="7">${escape(t('playNoLeaderboard', 'No leaderboard data yet.'))}</td></tr>`;
    }
    renderTop3(data && data.top3 || []);
  }

  async function loadLeaderboard(){
    const data = await request('leaderboard', null, 'GET');
    renderLeaderboard(data);
    return data;
  }

  const state = {
    sessionId: '',
    identity: null,
    progress: null,
    result: null,
    timerId: null,
    autoNextId: null,
    lock: false
  };

  function clearTimers(){
    if (state.timerId) clearInterval(state.timerId);
    if (state.autoNextId) clearTimeout(state.autoNextId);
    state.timerId = null;
    state.autoNextId = null;
  }

  function showSection(id){
    ['playStartCard','playQuizCard','playResultCard'].forEach(function(sectionId){
      const el = $(sectionId);
      if (el) el.classList.toggle('hidden', sectionId !== id);
    });
  }

  function currentQuestion(){
    return state.progress && (state.progress.question || (state.progress.questions || [])[state.progress.currentIndex]) || null;
  }

  function updateBadges(){
    const progress = state.progress || {};
    const q = currentQuestion();
    const playerBadge = $('playPlayerBadge');
    const stageBadge = $('playStageBadge');
    const questionBadge = $('playQuestionBadge');
    const scoreBadge = $('playScoreBadge');
    const timerBadge = $('playTimerBadge');
    const fill = $('playProgressFill');
    if (playerBadge) playerBadge.textContent = `${t('playPlayer', 'Player')}: ${state.identity && state.identity.name ? state.identity.name : '-'}`;
    if (stageBadge) stageBadge.textContent = `${t('playStage', 'Stage')}: ${stageLabel(progress.playStage)}`;
    if (questionBadge) questionBadge.textContent = `${t('playQuestion', 'Question')} ${Math.min((Number(progress.currentIndex || 0) + 1), Number(progress.questionCount || 1))}`;
    if (scoreBadge) scoreBadge.textContent = `${t('playScore', 'Score')}: ${Number(progress.score || 0) || 0}`;
    if (timerBadge) timerBadge.textContent = `${t('playTime', 'Time')}: ${progress.timerEnabled ? (progress.timeLeft != null ? progress.timeLeft : progress.timeLimitSeconds || 0) : '∞'}`;
    if (fill) {
      const total = Math.max(1, Number(progress.questionCount || 1));
      const done = Math.max(0, Number(progress.currentIndex || 0));
      fill.style.width = `${Math.min(100, Math.round((done / total) * 100))}%`;
    }
  }

  function startTimer(){
    clearTimers();
    const progress = state.progress || {};
    if (!progress.timerEnabled || !progress.timeLimitSeconds) {
      updateBadges();
      return;
    }
    let remaining = Math.max(0, Number(progress.timeLeft || progress.timeLimitSeconds) || progress.timeLimitSeconds || 0);
    const deadline = Date.now() + remaining * 1000;
    updateBadges();
    state.timerId = setInterval(function(){
      const next = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      if (state.progress) state.progress.timeLeft = next;
      updateBadges();
      if (next <= 0) {
        clearTimers();
        answerCurrent('', true).catch(function(error){ setStatus(error.message || 'Could not submit answer.'); });
      }
    }, 200);
  }

  function renderQuestion(){
    clearTimers();
    state.lock = false;
    const q = currentQuestion();
    if (!q) {
      if (state.result) renderResult(state.result);
      return;
    }
    showSection('playQuizCard');
    updateBadges();
    $('playQuestionText').textContent = q.text || t('playQuestionText', 'Question text');
    const options = $('playOptions');
    options.innerHTML = (q.options || []).map(function(opt){ return `<button type="button" class="play-option-btn" data-option-value="${escape(opt)}">${escape(opt)}</button>`; }).join('');
    Array.from(options.querySelectorAll('.play-option-btn')).forEach(function(btn){
      btn.addEventListener('click', function(){ answerCurrent(btn.dataset.optionValue || '', false).catch(function(error){ setStatus(error.message || 'Could not save the answer.'); }); });
    });
    const nextBtn = $('playNextBtn');
    if (nextBtn) nextBtn.disabled = true;
    startTimer();
  }

  function renderResult(result){
    state.result = result;
    showSection('playResultCard');
    const score = Number(result.score || 0) || 0;
    $('playResultScore').textContent = String(score);
    $('playResultBadge').textContent = score >= 15 ? 'Champion' : score >= 8 ? 'Explorer' : t('playRisingStar', 'Rising Star');
    $('playResultText').textContent = result.playEndedReason === 'wrong'
      ? t('playWrongResult', 'Wrong answer. Game over.').replace('{score}', String(score))
      : result.playEndedReason === 'timeout'
        ? t('playTimeOverResult', 'Time is over.').replace('{score}', String(score)).replace('{stage}', stageLabel(result.playStage))
        : t('playGreatResult', 'Fantastic!').replace('{score}', String(score)).replace('{stage}', stageLabel(result.playStage));
    try { if (typeof playTone === 'function') playTone('finish'); } catch (error) {}
    clearLocal();
  }

  async function answerCurrent(chosen, timedOut){
    if (state.lock) return;
    const q = currentQuestion();
    if (!state.identity || !state.sessionId || !q) return;
    state.lock = true;
    clearTimers();
    const data = await request('answer', {
      identity: state.identity,
      sessionId: state.sessionId,
      questionId: q.id,
      chosen,
      timedOut: !!timedOut
    });
    state.progress = data.progress || state.progress;
    if (data.answer) {
      Array.from(document.querySelectorAll('#playOptions .play-option-btn')).forEach(function(btn){
        btn.disabled = true;
        const value = btn.dataset.optionValue || '';
        if (value === String(data.answer.expected || '')) btn.classList.add('correct');
        if (value === String(data.answer.chosen || '') && !data.answer.correct) btn.classList.add('wrong');
      });
      try { if (typeof playTone === 'function') playTone(data.answer.correct ? 'correct' : 'wrong'); } catch (error) {}
    }
    updateBadges();
    if (data.finished && data.result) {
      state.result = data.result;
      if (data.leaderboard) renderLeaderboard(data.leaderboard);
      renderResult(data.result);
      return;
    }
    const nextBtn = $('playNextBtn');
    if (nextBtn) nextBtn.disabled = false;
    if ($('playAutoNextToggle') && $('playAutoNextToggle').checked) {
      state.autoNextId = setTimeout(renderQuestion, 350);
    } else {
      state.lock = false;
    }
  }

  async function startOrResume(){
    try {
      setStatus(t('playPreparing', 'Preparing your mixed quiz...'));
      const identity = normalizeIdentity();
      const saved = readLocal();
      const resumeSessionId = saved && saved.identity && saved.identity.name === identity.name && String(saved.identity.studentId || '') === identity.studentId && String(saved.identity.grade || '') === identity.grade
        ? saved.sessionId
        : '';
      const data = await request('start', { identity, sessionId: resumeSessionId, lang: lang() });
      state.identity = data.identity || identity;
      state.sessionId = data.sessionId || resumeSessionId;
      state.progress = data.progress;
      state.result = data.result || null;
      saveLocal({ sessionId: state.sessionId, identity: state.identity });
      if (data.leaderboard) renderLeaderboard(data.leaderboard);
      if (data.result) {
        renderResult(data.result);
        return;
      }
      renderQuestion();
      setStatus('');
    } catch (error) {
      setStatus(error.message || 'Could not start the quiz.');
    }
  }

  function bind(){
    if (!document.body || document.body.dataset.page !== 'playtest') return;
    hideModeUi();
    initGradeOptions();
    loadLeaderboard().catch(function(error){ setStatus(error.message || t('playNoLeaderboard', 'No leaderboard data yet.')); });
    $('playStartBtn')?.addEventListener('click', startOrResume);
    $('playNextBtn')?.addEventListener('click', renderQuestion);
    $('playAgainBtn')?.addEventListener('click', function(){
      clearTimers();
      clearLocal();
      state.sessionId = '';
      state.identity = null;
      state.progress = null;
      state.result = null;
      state.lock = false;
      showSection('playStartCard');
      setStatus('');
    });
    $('refreshPlayLeadersBtn')?.addEventListener('click', function(){ loadLeaderboard().catch(function(error){ setStatus(error.message || 'Could not refresh leaderboard.'); }); });
    $('playSoundToggleBtn')?.addEventListener('click', function(){
      this.dataset.muted = this.dataset.muted === '1' ? '0' : '1';
      this.textContent = this.dataset.muted === '1' ? '🔇 ' + t('playMuted', 'Muted') : '🔊 ' + t('playSounds', 'Sounds');
    });
    window.addEventListener('kg:langchange', function(){
      updateBadges();
      if (state.progress && currentQuestion()) renderQuestion();
      loadLeaderboard().catch(function(){});
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bind);
  else bind();
})();
