(function(){
  const API = '/api/student/play';
  const STORAGE_KEY = 'kgPlayTestSessionV2';
  const STAGE_STORAGE_KEY = 'kgPlayTestStage';
  const SOUND_STORAGE_KEY = 'kgPlayTestSound';
  const AUTO_NEXT_STORAGE_KEY = 'kgPlayTestAutoNext';
  const STAGE_CONFIGS = {
    starter: { label:'Starter', count:30, seconds:420, difficulty:1 },
    explorer: { label:'Explorer', count:50, seconds:540, difficulty:2 },
    champion: { label:'Champion', count:75, seconds:720, difficulty:3 }
  };
  let state = null;
  let timerId = null;
  let soundEnabled = true;
  let autoNextEnabled = true;
  let answerLock = false;
  let autoNextTimer = null;

  function $(id){ return document.getElementById(id); }
  function setStatus(msg){ const el = $('playStatus'); if (el) el.textContent = msg || ''; }
  function escapeHtml(value){ return String(value || '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch])); }
  function saveLocal(){ try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (error) {} }
  function loadLocal(){ try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null'); } catch (error) { return null; } }
  function saveSelectedStage(stage){ try { localStorage.setItem(STAGE_STORAGE_KEY, stage); } catch (error) {} }
  function loadSelectedStage(){ try { return localStorage.getItem(STAGE_STORAGE_KEY) || 'starter'; } catch (error) { return 'starter'; } }
  function saveSoundSetting(){ try { localStorage.setItem(SOUND_STORAGE_KEY, soundEnabled ? '1' : '0'); } catch (error) {} }
  function loadSoundSetting(){ try { return localStorage.getItem(SOUND_STORAGE_KEY) !== '0'; } catch (error) { return true; } }
  function saveAutoNextSetting(){ try { localStorage.setItem(AUTO_NEXT_STORAGE_KEY, autoNextEnabled ? '1' : '0'); } catch (error) {} }
  function loadAutoNextSetting(){ try { return localStorage.getItem(AUTO_NEXT_STORAGE_KEY) !== '0'; } catch (error) { return true; } }
  async function request(path, options){
    const res = await fetch(API + path, Object.assign({ credentials:'same-origin', cache:'no-store' }, options || {}));
    const data = await res.json().catch(()=>({ ok:false, error:'Request failed' }));
    if (!res.ok || !data.ok) throw new Error(data.error || 'Request failed');
    return data;
  }
  function buildIdentity(){
    const name = String($('playStudentName')?.value || '').trim();
    const studentId = String($('playStudentId')?.value || '').trim();
    if (!name) throw new Error('Please enter the student name first.');
    return { name, studentId, grade:'PLAY', isGuest:true, className:'Play & Test' };
  }
  function getSelectedStage(){
    const btn = document.querySelector('.play-stage-btn.active');
    const stage = btn ? btn.dataset.stage : loadSelectedStage();
    return STAGE_CONFIGS[stage] ? stage : 'starter';
  }
  function formatTime(totalSeconds){
    const mins = Math.floor(Math.max(0, totalSeconds) / 60);
    const secs = Math.max(0, totalSeconds) % 60;
    return String(mins).padStart(2,'0') + ':' + String(secs).padStart(2,'0');
  }
  function setTimerBadge(){
    const el = $('playTimerBadge');
    if (!el) return;
    const seconds = state ? Number(state.timeLeft || 0) : 0;
    el.textContent = 'Time: ' + formatTime(seconds);
    el.classList.toggle('timer-warning', seconds <= 60);
  }
  function updateSoundButton(){
    const btn = $('playSoundToggleBtn');
    if (!btn) return;
    btn.textContent = soundEnabled ? '🔊 Sounds' : '🔈 Muted';
  }
  function updateAutoNextToggle(){
    const input = $('playAutoNextToggle');
    if (input) input.checked = autoNextEnabled;
  }
  function playTone(freq, duration, type, volume){
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = playTone.ctx || (playTone.ctx = new AudioCtx());
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type || 'sine';
      osc.frequency.value = freq;
      gain.gain.value = volume || 0.05;
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + (duration || 0.15));
      osc.stop(ctx.currentTime + (duration || 0.15));
    } catch (error) {}
  }
  function playCorrect(){ playTone(660, 0.12, 'triangle', 0.06); setTimeout(()=>playTone(880,0.16,'triangle',0.05), 90); }
  function playWrong(){ playTone(220, 0.16, 'sawtooth', 0.05); setTimeout(()=>playTone(180,0.18,'sawtooth',0.04), 80); }
  function playFinish(){ playTone(523,0.12,'triangle',0.05); setTimeout(()=>playTone(659,0.12,'triangle',0.05),90); setTimeout(()=>playTone(784,0.18,'triangle',0.06),180); }
  function questionPayload(q){ return { text:q.text, options:q.options, answer:q.answer, skill:q.skill || '', type:'Choice', difficulty:Number(q.difficulty || 1) || 1 }; }
  function getBadgeMeta(percent){
    if (percent >= 95) return { medal:'👑', title:'Quiz King / Queen', cls:'gold' };
    if (percent >= 85) return { medal:'🥇', title:'Gold Champion', cls:'gold' };
    if (percent >= 70) return { medal:'🥈', title:'Silver Star', cls:'silver' };
    if (percent >= 55) return { medal:'🥉', title:'Bronze Brave', cls:'bronze' };
    return { medal:'🌟', title:'Rising Star', cls:'star' };
  }
  function renderLeaderboard(data){
    const top3 = Array.isArray(data.top3) ? data.top3 : [];
    const leaders = Array.isArray(data.leaderboard) ? data.leaderboard : [];
    $('playTop3List').innerHTML = top3.length ? top3.map((row, index) => {
      const meta = getBadgeMeta(Number(row.bestPercent || 0));
      return `<div class="play-top3-item rank-${index+1}"><div class="play-medal">${index===0?'🥇':index===1?'🥈':'🥉'}</div><div><strong>${escapeHtml(row.studentName)}</strong><span>${escapeHtml(row.studentId || 'No ID')}</span><small>${escapeHtml(meta.title)}</small></div><div class="play-medal-score">${escapeHtml(String(row.bestPercent || 0))}%</div></div>`;
    }).join('') : '<div class="play-top3-empty">No scores yet. Be the first champion!</div>';
    $('playLeaderboardBody').innerHTML = leaders.length ? leaders.map((row, index) => {
      const meta = getBadgeMeta(Number(row.bestPercent || 0));
      return `<tr><td>${index+1}</td><td>${meta.medal} ${escapeHtml(row.studentName)}</td><td>${escapeHtml(row.studentId || '-')}</td><td>${escapeHtml(String(row.bestPercent || 0))}%</td><td>${escapeHtml(String(row.attempts || 0))}</td><td>${escapeHtml(row.updatedAt ? new Date(row.updatedAt).toLocaleString() : '-')}</td></tr>`;
    }).join('') : '<tr><td colspan="6">No leaderboard data yet.</td></tr>';
  }
  async function loadLeaderboard(){ const data = await request('?action=leaderboard'); renderLeaderboard(data); return data; }
  function showSection(cardId){ ['playStartCard','playQuizCard','playResultCard'].forEach(id => $(id)?.classList.add('hidden')); $(cardId)?.classList.remove('hidden'); }
  function updateBadges(){
    if (!state) return;
    $('playPlayerBadge').textContent = `Player: ${state.identity.name}`;
    $('playStageBadge').textContent = `Stage: ${state.stageLabel}`;
    $('playQuestionBadge').textContent = `Question ${Math.min(state.currentIndex + 1, state.questions.length)} / ${state.questions.length}`;
    $('playScoreBadge').textContent = `Score: ${state.score}`;
    $('playProgressFill').style.width = `${Math.round((state.answers.length / state.questions.length) * 100)}%`;
    setTimerBadge();
  }
  function clearAutoNext(){ if (autoNextTimer) { clearTimeout(autoNextTimer); autoNextTimer = null; } }
  function stopTimer(){ if (timerId) { clearInterval(timerId); timerId = null; } clearAutoNext(); }
  function startTimer(){
    stopTimer();
    setTimerBadge();
    timerId = setInterval(async function(){
      if (!state) { stopTimer(); return; }
      state.timeLeft = Math.max(0, Number(state.timeLeft || 0) - 1);
      setTimerBadge();
      if (state.timeLeft <= 0) {
        stopTimer();
        setStatus('Time is over. Your quiz is being submitted.');
        await finishQuiz(true);
      }
    }, 1000);
  }
  function renderQuestion(){
    if (!state) return;
    answerLock = false;
    clearAutoNext();
    if (state.currentIndex >= state.questions.length) { finishQuiz(false); return; }
    showSection('playQuizCard');
    updateBadges();
    const q = state.questions[state.currentIndex];
    $('playQuestionText').textContent = q.text;
    const answered = state.answers.find(a => a.index === state.currentIndex);
    $('playOptions').innerHTML = q.options.map((opt, idx) => {
      const chosen = answered && answered.chosen === opt;
      const correct = answered && q.answer === opt;
      const cls = answered ? (correct ? 'correct' : chosen ? 'wrong' : '') : '';
      return `<button type="button" class="play-option-btn ${cls}" data-option-index="${idx}" onclick="window.__playChooseAnswer(${idx}); return false;" ${answered ? 'disabled' : ''}>${escapeHtml(opt)}</button>`;
    }).join('');
    const optionButtons = Array.from(document.querySelectorAll('#playOptions .play-option-btn'));
    optionButtons.forEach((btn) => {
      const idx = Number(btn.dataset.optionIndex || 0);
      const choose = function(event){
        if (event) {
          event.preventDefault();
          event.stopPropagation();
        }
        if (btn.disabled || answerLock) return;
        if (!Number.isNaN(idx) && state && state.questions && state.questions[state.currentIndex]) {
          chooseAnswer(state.questions[state.currentIndex].options[idx]);
        }
      };
      btn.addEventListener('click', choose);
      btn.addEventListener('touchend', choose, { passive:false });
      btn.addEventListener('pointerup', choose);
    });
    $('playNextBtn').disabled = !answered;
  }
  function markAnsweredUi(option, correct){
    const q = state && state.questions ? state.questions[state.currentIndex] : null;
    if (!q) return;
    const buttons = [...document.querySelectorAll('#playOptions .play-option-btn')];
    buttons.forEach(btn => {
      const idx = Number(btn.dataset.optionIndex || 0);
      const opt = q.options[idx];
      btn.disabled = true;
      if (opt === q.answer) btn.classList.add('correct');
      if (opt === option && !correct) btn.classList.add('wrong');
    });
    $('playNextBtn').disabled = false;
  }
  async function saveProgress(){
    if (!state) return;
    state.updatedAt = new Date().toISOString();
    saveLocal();
    await request('?action=save-progress', {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ identity:state.identity, sessionId:state.sessionId, state:{ selectedCount:state.questions.length, selectedLevelLabel:'Mixed English - ' + state.stageLabel, currentIndex:state.currentIndex, score:state.score, answers:state.answers, questions:state.questions.map(questionPayload), startedAt:state.startedAt, updatedAt:state.updatedAt, completed:false, stage:state.stage, stageLabel:state.stageLabel, timeLeft:state.timeLeft, totalSeconds:state.totalSeconds } })
    });
  }
  async function chooseAnswer(option){
    if (!state || answerLock) return;
    const q = state.questions[state.currentIndex];
    if (!q) return;
    const alreadyAnswered = state.answers.find(a => a.index === state.currentIndex);
    if (alreadyAnswered) return;
    answerLock = true;
    const correct = option === q.answer;
    state.answers.push({ index:state.currentIndex, questionText:q.text, chosen:option, correct, expected:q.answer, answeredAt:new Date().toISOString(), difficulty:q.difficulty || 1 });
    if (correct) { state.score += 1; playCorrect(); } else { playWrong(); }
    updateBadges();
    markAnsweredUi(option, correct);
    saveProgress().catch(()=>{});
    if (!correct) {
      setStatus('Wrong answer. Your score has been saved to the leaderboard.');
      autoNextTimer = setTimeout(() => { finishQuiz(false, true).catch(()=>{}); }, 700);
      return;
    }
    if (autoNextEnabled) {
      autoNextTimer = setTimeout(() => { nextQuestion(); }, 420);
    } else {
      answerLock = false;
    }
  }
  function nextQuestion(){
    const answered = state.answers.find(a => a.index === state.currentIndex);
    if (!answered) return;
    state.currentIndex += 1;
    renderQuestion();
    saveProgress().catch(()=>{});
  }
  async function finishQuiz(timeUp, wrongStop){
    if (!state || state.completed) return;
    state.completed = true;
    stopTimer();
    const answeredCount = Math.max(1, state.answers.length);
    const percent = Math.round((state.score / answeredCount) * 100);
    const badge = getBadgeMeta(percent);
    const result = await request('?action=submit', {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ identity:state.identity, sessionId:state.sessionId, result:{ score:state.score, total:answeredCount, percent, answers:state.answers, questionCount:answeredCount, completedAt:new Date().toISOString(), selectedLevelLabel:'Mixed English - ' + state.stageLabel, stage:state.stage, stageLabel:state.stageLabel, timeLeft:state.timeLeft, totalSeconds:state.totalSeconds, badgeTitle:badge.title, finishedByWrong: !!wrongStop }, progress:{ completed:true, currentIndex:state.currentIndex, questions:state.questions.map(questionPayload) } })
    });
    playFinish();
    $('playResultMedal').textContent = badge.medal;
    $('playResultBadge').textContent = badge.title;
    $('playResultBadge').className = 'play-result-badge ' + badge.cls;
    $('playResultScore').textContent = state.score + ' pts';
    $('playResultText').textContent = timeUp ? `Time is over. You scored ${state.score} points in ${state.stageLabel}.` : wrongStop ? `Wrong answer. Game over with ${state.score} points. Try again and climb higher!` : `Fantastic! You finished the ${state.stageLabel} challenge with ${state.score} points.`;
    saveLocal();
    showSection('playResultCard');
    if (result && result.leaderboard) renderLeaderboard(result.leaderboard);
    else loadLeaderboard().catch(()=>{});
  }

  window.__playChooseAnswer = function(index){
    if (!state) return;
    const q = state.questions && state.questions[state.currentIndex];
    if (!q || !Array.isArray(q.options)) return;
    const idx = Number(index || 0);
    if (Number.isNaN(idx) || idx < 0 || idx >= q.options.length) return;
    chooseAnswer(q.options[idx]);
  };

  async function startOrResume(){
    try {
      setStatus('Preparing your mixed quiz...');
      const identity = buildIdentity();
      const stage = getSelectedStage();
      const stageConfig = STAGE_CONFIGS[stage];
      saveSelectedStage(stage);
      const local = loadLocal();
      const samePlayer = local && local.identity && local.identity.name === identity.name && String((local.identity.studentId || '')).trim() === identity.studentId;
      const startData = await request('?action=start', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ identity, sessionId: samePlayer ? local.sessionId : '' }) });
      if (startData.progress && Array.isArray(startData.progress.questions) && startData.progress.questions.length && !startData.progress.completed) {
        state = {
          identity:startData.identity,
          sessionId:startData.sessionId,
          questions:startData.progress.questions,
          currentIndex:Number(startData.progress.currentIndex || 0) || 0,
          score:Number(startData.progress.score || 0) || 0,
          answers:Array.isArray(startData.progress.answers) ? startData.progress.answers : [],
          startedAt:startData.progress.startedAt || new Date().toISOString(),
          completed:false,
          stage:startData.progress.stage || stage,
          stageLabel:startData.progress.stageLabel || stageConfig.label,
          timeLeft:Number(startData.progress.timeLeft || stageConfig.seconds),
          totalSeconds:Number(startData.progress.totalSeconds || stageConfig.seconds)
        };
        setStatus('Resuming your last mixed quiz.');
      } else {
        const questions = (window.PlayQuestionBank && window.PlayQuestionBank.createMixedQuiz ? window.PlayQuestionBank.createMixedQuiz(stageConfig.count, stage) : []);
        state = {
          identity:startData.identity,
          sessionId:startData.sessionId,
          questions:questions,
          currentIndex:0,
          score:0,
          answers:[],
          startedAt:new Date().toISOString(),
          completed:false,
          stage:stage,
          stageLabel:stageConfig.label,
          timeLeft:stageConfig.seconds,
          totalSeconds:stageConfig.seconds
        };
        await saveProgress();
        setStatus('New mixed quiz ready. Good luck!');
      }
      startTimer();
      renderQuestion();
      updateAutoNextToggle();
    } catch (error) {
      setStatus(error.message || 'Could not start the quiz.');
    }
  }
  function wireStageButtons(){
    const selected = loadSelectedStage();
    document.querySelectorAll('.play-stage-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.stage === selected);
      btn.addEventListener('click', function(){
        document.querySelectorAll('.play-stage-btn').forEach(item => item.classList.remove('active'));
        btn.classList.add('active');
        saveSelectedStage(btn.dataset.stage || 'starter');
      });
    });
  }
  document.addEventListener('DOMContentLoaded', function(){
    if (document.body.dataset.page !== 'playtest') return;
    soundEnabled = loadSoundSetting();
    autoNextEnabled = loadAutoNextSetting();
    updateSoundButton();
    updateAutoNextToggle();
    wireStageButtons();
    loadLeaderboard().catch((error)=> setStatus(error.message || 'Could not load leaderboard.'));
    $('playStartBtn')?.addEventListener('click', startOrResume);
    $('playNextBtn')?.addEventListener('click', nextQuestion);
    $('playAgainBtn')?.addEventListener('click', function(){
      if ($('playStudentName') && state && state.identity) $('playStudentName').value = state.identity.name || '';
      if ($('playStudentId') && state && state.identity) $('playStudentId').value = state.identity.studentId || '';
      localStorage.removeItem(STORAGE_KEY);
      stopTimer();
      answerLock = false;
      state = null;
      showSection('playStartCard');
      setStatus('Start a new mixed quiz to get a fresh set of questions.');
    });
    $('refreshPlayLeadersBtn')?.addEventListener('click', ()=> loadLeaderboard().catch(()=>{}));
    $('playSoundToggleBtn')?.addEventListener('click', function(){ soundEnabled = !soundEnabled; saveSoundSetting(); updateSoundButton(); });
    $('playAutoNextToggle')?.addEventListener('change', function(){ autoNextEnabled = !!this.checked; saveAutoNextSetting(); updateAutoNextToggle(); });
    const optionHandler = function(event){
      const btn = event.target && event.target.closest ? event.target.closest('.play-option-btn') : null;
      if (!btn || btn.disabled || answerLock) return;
      event.preventDefault();
      event.stopPropagation();
      const index = Number(btn.dataset.optionIndex || 0);
      if (!Number.isNaN(index) && state && state.questions && state.questions[state.currentIndex]) {
        chooseAnswer(state.questions[state.currentIndex].options[index]);
      }
    };
    $('playOptions')?.addEventListener('click', optionHandler, true);
    $('playOptions')?.addEventListener('pointerup', optionHandler, true);
  });
})();
