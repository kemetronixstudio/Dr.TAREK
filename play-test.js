(function(){
  const API = '/api/student/play';
  const STORAGE_KEY = 'kgPlayTestSessionV10';
  const SOUND_STORAGE_KEY = 'kgPlayTestSound';
  const AUTO_NEXT_STORAGE_KEY = 'kgPlayTestAutoNext';
  const QUESTION_SECONDS = 20;
  const DEFAULT_TOTAL_MINUTES = 10;
  const GRADE_OPTIONS = [
    ['KG1','KG1'],['KG2','KG2'],['Grade 1','Grade 1'],['Grade 2','Grade 2'],['Grade 3','Grade 3'],['Grade 4','Grade 4'],['Grade 5','Grade 5'],['Grade 6','Grade 6']
  ];
  const I18N = {
    en: {
      playBadge:'Mixed English Challenge',
      playTitle:'Play & Test With Dr. Tarek',
      playHeroText:'Every start gives a different mixed quiz in English. Play, score high, and race to the top of the live leaderboard.',
      playTop3:'Top 3 Champions',
      playStartTitle:'Start a New Mixed Quiz',
      playStudentNamePlaceholder:'Student name',
      playStudentIdPlaceholder:'Student ID (optional)',
      playStartBtn:'Start Playing',
      playChooseStage:'Difficulty follows the selected grade',
      playStageAutoNote:'KG1–Grade 2 use Starter, Grade 3–4 use Explorer, and Grade 5–6 use Champion.',
      playStartNote:'Before you start, check the live Top 3. Your score will be shared with all players on the leaderboard.',
      playLoadingLeaderboard:'Loading leaderboard...',
      playNoTop3:'No scores yet. Be the first champion!',
      playNoLeaderboard:'No leaderboard data yet.',
      playPlayer:'Player', playStage:'Stage', playQuestion:'Question', playScore:'Score', playTime:'Time',
      playSounds:'Sounds', playMuted:'Muted', playQuestionText:'Question text', playNextQuestion:'Next Question',
      playResultTitle:'Your Result', playAgain:'Play Again', playLiveLeaderboard:'Live Leaderboard',
      playEnterName:'Please enter the student name first.', playPreparing:'Preparing your mixed challenge...',
      playResuming:'Resuming your last mixed quiz.', playReady:'New mixed quiz ready. Good luck!',
      playWrongSaved:'Wrong answer. Score saved.', playTimeOver:'Time is over!',
      playTimeOverResult:'Time is over. You scored {score} points.', playWrongResult:'Wrong answer. Final score: {score}',
      playGreatResult:'Amazing. Final score: {score}', playRisingStar:'Rising Star', refresh:'Refresh',
      leaderName:'Name', leaderGrade:'Grade', leaderStudentId:'Student ID', leaderBestScore:'Best Score', leaderAttempts:'Attempts', leaderLastPlayed:'Last Played',
      playGradeLabel:'Grade', stageStarter:'Starter', stageExplorer:'Explorer', stageChampion:'Champion'
    },
    ar: {
      playBadge:'تحدي إنجليزي مختلط',
      playTitle:'العب واختبر نفسك مع د. طارق',
      playHeroText:'في كل مرة تبدأ فيها ستحصل على اختبار إنجليزي مختلط مختلف. العب، واجمع النقاط، واصعد إلى لوحة المتصدرين المباشرة.',
      playTop3:'أفضل 3 أبطال',
      playStartTitle:'ابدأ اختبارًا مختلطًا جديدًا',
      playStudentNamePlaceholder:'اسم الطالب',
      playStudentIdPlaceholder:'رقم الطالب (اختياري)',
      playStartBtn:'ابدأ اللعب',
      playChooseStage:'يتم تحديد الصعوبة تلقائيًا حسب الصف',
      playStageAutoNote:'KG1 إلى Grade 2 = مبتدئ، Grade 3 إلى Grade 4 = مستكشف، Grade 5 إلى Grade 6 = بطل.',
      playStartNote:'قبل أن تبدأ، تحقق من أفضل 3. سيتم مشاركة نتيجتك مع جميع اللاعبين في لوحة المتصدرين.',
      playLoadingLeaderboard:'جارٍ تحميل لوحة المتصدرين...',
      playNoTop3:'لا توجد نتائج بعد. كن أول بطل!',
      playNoLeaderboard:'لا توجد بيانات في لوحة المتصدرين حتى الآن.',
      playPlayer:'اللاعب', playStage:'المرحلة', playQuestion:'السؤال', playScore:'النقاط', playTime:'الوقت',
      playSounds:'الأصوات', playMuted:'صامت', playQuestionText:'نص السؤال', playNextQuestion:'السؤال التالي',
      playResultTitle:'النتيجة', playAgain:'العب مرة أخرى', playLiveLeaderboard:'لوحة المتصدرين المباشرة',
      playEnterName:'من فضلك اكتب اسم الطالب أولاً.', playPreparing:'جارٍ تجهيز التحدي المختلط...',
      playResuming:'جارٍ استكمال آخر اختبار مختلط لك.', playReady:'الاختبار المختلط جاهز. بالتوفيق!',
      playWrongSaved:'إجابة خاطئة. تم حفظ النتيجة.', playTimeOver:'انتهى الوقت!',
      playTimeOverResult:'انتهى الوقت. لقد حصلت على {score} نقطة.', playWrongResult:'إجابة خاطئة. النتيجة النهائية: {score}',
      playGreatResult:'رائع! النتيجة النهائية: {score}', playRisingStar:'نجم صاعد', refresh:'تحديث',
      leaderName:'الاسم', leaderGrade:'الصف', leaderStudentId:'رقم الطالب', leaderBestScore:'أفضل نتيجة', leaderAttempts:'المحاولات', leaderLastPlayed:'آخر لعب',
      playGradeLabel:'الصف', stageStarter:'مبتدئ', stageExplorer:'مستكشف', stageChampion:'بطل'
    }
  };
  const STAGE_LABELS = { starter:{en:'Starter',ar:'مبتدئ'}, explorer:{en:'Explorer',ar:'مستكشف'}, champion:{en:'Champion',ar:'بطل'} };
  const STAGE_POOL_SIZE = { starter:120, explorer:150, champion:180 };

  let state = null;
  let timerId = null;
  let soundEnabled = true;
  let autoNextEnabled = true;
  let answerLock = false;
  let autoNextTimer = null;
  let timerVersion = 0;
  let questionRenderToken = 0;

  function $(id){ return document.getElementById(id); }
  function getLang(){ return window.kgGetLang ? window.kgGetLang() : (localStorage.getItem('kgAppLang') || 'en'); }
  function tr(key, vars){
    let value = (I18N[getLang()] && I18N[getLang()][key]) || I18N.en[key] || key;
    if (vars) Object.keys(vars).forEach(k => value = value.replace(new RegExp('\\{'+k+'\\}','g'), String(vars[k])));
    return value;
  }
  function setDir(){
    const lang = getLang();
    document.documentElement.lang = lang === 'ar' ? 'ar' : 'en';
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.body.dataset.lang = lang;
  }
  function escapeHtml(v){ return String(v || '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch])); }
  function saveLocal(){ try{ localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }catch(e){} }
  function loadLocal(){ try{ return JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null'); }catch(e){ return null; } }
  function clearLocal(){ try{ localStorage.removeItem(STORAGE_KEY); }catch(e){} }
  function saveSoundSetting(){ try{ localStorage.setItem(SOUND_STORAGE_KEY, soundEnabled ? '1' : '0'); }catch(e){} }
  function loadSoundSetting(){ try{ return localStorage.getItem(SOUND_STORAGE_KEY) !== '0'; }catch(e){ return true; } }
  function saveAutoNextSetting(){ try{ localStorage.setItem(AUTO_NEXT_STORAGE_KEY, autoNextEnabled ? '1' : '0'); }catch(e){} }
  function loadAutoNextSetting(){ try{ return localStorage.getItem(AUTO_NEXT_STORAGE_KEY) !== '0'; }catch(e){ return true; } }
  async function request(path, options){
    const res = await fetch(API + path, Object.assign({ credentials:'same-origin', cache:'no-store' }, options || {}));
    const data = await res.json().catch(()=>({ ok:false, error:'Request failed' }));
    if (!res.ok || !data.ok) throw new Error(data.error || 'Request failed');
    return data;
  }
  function getStageFromGrade(grade){
    const g = String(grade || '').toLowerCase();
    if (g === 'kg1' || g === 'kg2' || g === 'grade 1' || g === 'grade 2') return 'starter';
    if (g === 'grade 3' || g === 'grade 4') return 'explorer';
    return 'champion';
  }
  function getStageLabel(stage){ return (STAGE_LABELS[stage] && STAGE_LABELS[stage][getLang()]) || STAGE_LABELS[stage].en; }
  function getSelectedMode(){
    const checked = document.querySelector('input[name="gameModeCards"]:checked');
    return checked?.value || $('gameMode')?.value || 'question_timer';
  }
  function syncModeUi(){
    const mode = getSelectedMode();
    if ($('gameMode')) $('gameMode').value = mode;
    document.querySelectorAll('.mode-card').forEach(card => {
      const active = card.dataset.modeValue === mode;
      card.classList.toggle('active', active);
      const input = card.querySelector('input[type="radio"]');
      if (input) input.checked = active;
    });
    const showTotal = mode === 'total_timer';
    const totalWrap = $('totalTimerInlineWrap');
    if (totalWrap) totalWrap.hidden = !showTotal;
  }
  function getSelectedTotalMinutes(){
    const inline = $('totalTimerMinutesInline');
    const hidden = $('totalTimerMinutes');
    const raw = String(inline?.value || hidden?.value || DEFAULT_TOTAL_MINUTES);
    const minutes = Math.max(1, Number(raw) || DEFAULT_TOTAL_MINUTES);
    if (inline) inline.value = String(minutes);
    if (hidden) hidden.value = String(minutes);
    return minutes;
  }
  function buildIdentity(){
    const name = String($('playStudentName')?.value || '').trim();
    const studentId = String($('playStudentId')?.value || '').trim();
    const grade = String($('playStudentGrade')?.value || 'KG1').trim();
    if (!name) throw new Error(tr('playEnterName'));
    return { name, studentId, grade, isGuest:true, className:'Play & Test' };
  }
  function formatTime(seconds){
    const total = Math.max(0, Math.floor(Number(seconds || 0)));
    const mins = Math.floor(total / 60);
    const secs = total % 60;
    return mins + ':' + String(secs).padStart(2, '0');
  }
  function setStatus(msg){ const el = $('playStatus'); if (el) el.textContent = msg || ''; }
  function showSection(id){ ['playStartCard','playQuizCard','playResultCard'].forEach(x => $(x)?.classList.add('hidden')); $(id)?.classList.remove('hidden'); }
  function updateProgress(){
    const fill = $('playProgressFill');
    if (!fill || !state) return;
    const solved = state.answers.length;
    const total = state.questions.length || 1;
    fill.style.width = Math.max(6, Math.round((solved / total) * 100)) + '%';
  }
  function updateBadges(){
    if (!state) return;
    $('playPlayerBadge').textContent = tr('playPlayer') + ': ' + state.identity.name;
    $('playStageBadge').textContent = tr('playStage') + ': ' + getStageLabel(state.stage);
    $('playQuestionBadge').textContent = tr('playQuestion') + ' ' + (Math.min(state.currentIndex + 1, state.questions.length || 1));
    $('playScoreBadge').textContent = tr('playScore') + ': ' + state.score;
    $('playTimerBadge').textContent = tr('playTime') + ': ' + formatTime(state.timeLeft);
    $('playTimerBadge').classList.toggle('timer-warning', state.mode !== 'endless' && Number(state.timeLeft) <= 5);
    updateProgress();
  }
  function updateSoundButton(){ const btn = $('playSoundToggleBtn'); if (btn) btn.textContent = soundEnabled ? '🔊 ' + tr('playSounds') : '🔈 ' + tr('playMuted'); }
  function updateAutoNextToggle(){ const el = $('playAutoNextToggle'); if (el) el.checked = autoNextEnabled; }
  function playTone(freq,duration,type,volume){
    if (!soundEnabled) return;
    try{
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      const ctx = playTone.ctx || (playTone.ctx = new Ctx());
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type || 'sine';
      osc.frequency.value = freq;
      gain.gain.value = volume || 0.05;
      osc.connect(gain); gain.connect(ctx.destination);
      osc.start(); gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + (duration || 0.15));
      osc.stop(ctx.currentTime + (duration || 0.15));
    }catch(e){}
  }
  function playCorrect(){ playTone(660,0.12,'triangle',0.06); setTimeout(()=>playTone(880,0.16,'triangle',0.05),90); }
  function playWrong(){ playTone(220,0.16,'sawtooth',0.05); setTimeout(()=>playTone(180,0.18,'sawtooth',0.04),80); }
  function playFinish(){ playTone(523,0.12,'triangle',0.05); setTimeout(()=>playTone(659,0.12,'triangle',0.05),90); setTimeout(()=>playTone(784,0.18,'triangle',0.06),180); }
  function questionPayload(q){
    return {
      text:q.text, options:q.options, answer:q.answer, skill:q.skill || '', type:'Choice', difficulty:Number(q.difficulty || 1) || 1, image:q.image || null, grade:q.grade || ''
    };
  }
  function applyTranslations(){
    setDir();
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (key) el.textContent = tr(key);
    });
    document.querySelectorAll('[data-placeholder-i18n]').forEach(el => {
      const key = el.getAttribute('data-placeholder-i18n');
      if (key) el.setAttribute('placeholder', tr(key));
    });
    const gradeSel = $('playStudentGrade');
    if (gradeSel && !gradeSel.options.length){
      gradeSel.innerHTML = GRADE_OPTIONS.map(([value, label]) => `<option value="${escapeHtml(value)}">${escapeHtml(label)}</option>`).join('');
    }
    updateSoundButton();
    syncModeUi();
  }
  function getBadgeMeta(score){
    if (score >= 80) return { medal:'🥇', title:getLang()==='ar'?'بطل القمة':'Champion', cls:'gold' };
    if (score >= 50) return { medal:'🥈', title:getLang()==='ar'?'نجم صاعد':'Rising Star', cls:'silver' };
    return { medal:'🥉', title:getLang()==='ar'?'محاول رائع':'Great Try', cls:'bronze' };
  }
  function renderLeaderboard(data){
    const top3 = $('playTop3List');
    const body = $('playLeaderboardBody');
    const leaders = Array.isArray(data?.leaders) ? data.leaders : [];
    if (top3) {
      top3.innerHTML = leaders.slice(0,3).map((row, idx) => `<div class="play-top3-item"><span class="play-top3-rank">${idx+1}</span><strong>${escapeHtml(row.name || '-')}</strong><span>${escapeHtml(row.grade || '-')}</span><span>${row.bestScore || 0}</span></div>`).join('') || `<div class="play-top3-empty">${tr('playNoTop3')}</div>`;
    }
    if (body) {
      body.innerHTML = leaders.map((row, idx) => `<tr><td>${idx+1}</td><td>${escapeHtml(row.name || '-')}</td><td>${escapeHtml(row.grade || '-')}</td><td>${escapeHtml(row.studentId || '-')}</td><td>${row.bestScore || 0}</td><td>${row.attempts || 0}</td><td>${escapeHtml(row.lastPlayed || '-')}</td></tr>`).join('') || `<tr><td colspan="7">${tr('playLoadingLeaderboard')}</td></tr>`;
    }
  }
  async function loadLeaderboard(){ const data = await request('?action=leaderboard'); renderLeaderboard(data); return data; }
  function stopTimer(){
    timerVersion += 1;
    if (timerId) { clearInterval(timerId); timerId = null; }
    if (autoNextTimer) { clearTimeout(autoNextTimer); autoNextTimer = null; }
  }
  function startTimer(){
    stopTimer();
    if (!state) return;
    const version = timerVersion;
    const renderToken = questionRenderToken;
    const now = Date.now();
    if (!state.timerStartedAt) state.timerStartedAt = now;
    if (state.mode === 'endless') {
      state.timeLeft = Math.max(0, Number(state.elapsedSeconds || 0));
      updateBadges();
      timerId = setInterval(function(){
        if (!state || version !== timerVersion || renderToken !== questionRenderToken) return stopTimer();
        const elapsed = Math.max(0, Math.floor((Date.now() - Number(state.timerStartedAt || now)) / 1000));
        if (elapsed !== state.elapsedSeconds) {
          state.elapsedSeconds = elapsed;
          state.timeLeft = elapsed;
          updateBadges();
        }
      }, 250);
      return;
    }
    const seconds = state.mode === 'total_timer' ? Number(state.timeLeft || state.totalSeconds || 0) : Number(state.timeLeft || QUESTION_SECONDS || 0);
    const startLeft = Math.max(0, seconds);
    state.timeLeft = startLeft;
    const deadline = now + (startLeft * 1000);
    updateBadges();
    timerId = setInterval(async function(){
      if (!state || version !== timerVersion || renderToken !== questionRenderToken) return stopTimer();
      const remaining = Math.max(0, Math.floor((deadline - Date.now() + 999) / 1000));
      if (remaining !== state.timeLeft) {
        state.timeLeft = remaining;
        updateBadges();
      }
      if (remaining <= 0) {
        stopTimer();
        await finishQuiz(true, false);
      }
    }, 250);
  }
  async function saveProgress(){
    if (!state) return;
    state.updatedAt = new Date().toISOString();
    saveLocal();
    await request('?action=save-progress', {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({
        identity:state.identity,
        sessionId:state.sessionId,
        state:{
          currentIndex:state.currentIndex,
          score:state.score,
          answers:state.answers,
          questions:state.questions.map(questionPayload),
          startedAt:state.startedAt,
          updatedAt:state.updatedAt,
          completed:false,
          stage:state.stage,
          stageLabel:getStageLabel(state.stage),
          timeLeft:state.timeLeft,
          totalSeconds:state.totalSeconds,
          mode:state.mode,
          timerStartedAt:state.timerStartedAt,
          elapsedSeconds:state.elapsedSeconds || 0
        }
      })
    });
  }
  function markAnsweredUi(option, correct){
    const q = state.questions[state.currentIndex];
    [...document.querySelectorAll('#playOptions .play-option-btn')].forEach(btn => {
      const idx = Number(btn.dataset.optionIndex || 0);
      const opt = q.options[idx];
      btn.disabled = true;
      if (opt === q.answer) btn.classList.add('correct');
      if (opt === option && !correct) btn.classList.add('wrong');
    });
    $('playNextBtn').disabled = false;
  }
  function renderQuestionImage(question){
    const wrap = $('playQuestionImageWrap');
    const img = $('playQuestionImage');
    if (!wrap || !img) return;
    const base = question && question.image ? question.image : '';
    const normalized = typeof window.normalizeQuestionImage === 'function'
      ? window.normalizeQuestionImage(base, question?.grade || state?.identity?.grade || '', question?.text || '')
      : String(base || '').trim();
    if (!normalized) {
      wrap.classList.add('hidden');
      img.removeAttribute('src');
      img.onerror = null;
      return;
    }
    const tried = new Set();
    const candidates = [];
    const push = (value) => {
      const v = String(value || '').trim();
      if (!v || tried.has(v)) return;
      tried.add(v);
      candidates.push(v);
    };
    push(normalized);
    if (/^svg\//i.test(normalized)) push(normalized.replace(/^svg\//i, 'assets/svg/'));
    if (/^assets\/svg\//i.test(normalized)) push(normalized.replace(/^assets\/svg\//i, 'svg/'));
    if (/^assets\/quiz-bulk\//i.test(normalized)) {
      const fileName = normalized.split('/').pop();
      if (fileName) {
        push('assets/svg/' + fileName);
        push('svg/' + fileName);
      }
    }
    if (!/\.(png|jpe?g|webp|gif)($|\?)/i.test(normalized)) {
      push(normalized + '.png');
      if (/^svg\//i.test(normalized)) push(normalized.replace(/^svg\//i, 'assets/svg/') + '.png');
    }
    let idx = 0;
    wrap.classList.remove('hidden');
    img.onerror = function(){
      idx += 1;
      if (idx < candidates.length) { img.src = candidates[idx]; return; }
      img.onerror = null;
      img.removeAttribute('src');
      wrap.classList.add('hidden');
    };
    img.src = candidates[idx];
  }
  async function chooseAnswer(option){
    if (!state || answerLock) return;
    const q = state.questions[state.currentIndex];
    if (!q) return;
    if (state.answers.find(a => a.index === state.currentIndex)) return;
    answerLock = true;
    if (state.mode === 'question_timer') stopTimer();
    const correct = option === q.answer;
    state.answers.push({ index:state.currentIndex, questionText:q.text, chosen:option, correct, expected:q.answer, answeredAt:new Date().toISOString(), difficulty:q.difficulty || 1 });
    if (correct) { state.score += 1; playCorrect(); } else { playWrong(); }
    markAnsweredUi(option, correct);
    updateBadges();
    saveProgress().catch(()=>{});

    if (state.mode === 'endless') {
      if (autoNextEnabled) autoNextTimer = setTimeout(() => { nextQuestion(); }, 320);
      else answerLock = false;
      return;
    }

    if (!correct) {
      setStatus(tr('playWrongSaved'));
      autoNextTimer = setTimeout(() => { finishQuiz(false, true).catch(()=>{}); }, 450);
      return;
    }
    if (autoNextEnabled) autoNextTimer = setTimeout(() => { nextQuestion(); }, 320);
    else answerLock = false;
  }
  function renderQuestion(){
    if (!state) return;
    questionRenderToken += 1;
    answerLock = false;
    if (autoNextTimer) { clearTimeout(autoNextTimer); autoNextTimer = null; }
    if (state.currentIndex >= state.questions.length) { finishQuiz(false, false).catch(()=>{}); return; }
    showSection('playQuizCard');
    const q = state.questions[state.currentIndex];
    const answeredCurrent = state.answers.find(a => a.index === state.currentIndex);
    if (state.mode === 'question_timer' && (!Number.isFinite(Number(state.timeLeft)) || Number(state.timeLeft) <= 0 || answeredCurrent)) {
      state.timeLeft = QUESTION_SECONDS;
    }
    if (state.mode === 'endless') {
      state.timeLeft = Math.max(0, Number(state.elapsedSeconds || 0));
    }
    updateBadges();
    $('playQuestionText').textContent = q.text;
    renderQuestionImage(q);
    $('playOptions').innerHTML = q.options.map((opt, idx) => `<button type="button" class="play-option-btn" data-option-index="${idx}" onclick="window.__playChooseAnswer(${idx})">${escapeHtml(opt)}</button>`).join('');
    $('playNextBtn').disabled = true;
    startTimer();
  }
  function nextQuestion(){
    if (!state) return;
    if (!state.answers.find(a => a.index === state.currentIndex)) return;
    if (state.mode === 'question_timer') stopTimer();
    state.currentIndex += 1;
    if (state.mode === 'question_timer') state.timeLeft = QUESTION_SECONDS;
    saveProgress().catch(()=>{});
    renderQuestion();
  }
  async function finishQuiz(timeUp, wrongStop){
    if (!state || state.completed) return;
    state.completed = true;
    stopTimer();
    if (state.mode === 'endless') {
      state.elapsedSeconds = Math.max(0, Math.floor((Date.now() - Number(state.timerStartedAt || Date.now())) / 1000));
      state.timeLeft = state.elapsedSeconds;
    }
    const score = Number(state.score || 0);
    const totalAnswered = state.mode === 'endless' ? state.questions.length : state.answers.length;
    const badge = getBadgeMeta(score);
    const result = await request('?action=submit', {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({
        identity:state.identity,
        sessionId:state.sessionId,
        result:{
          score,
          total:totalAnswered,
          percent: totalAnswered ? Math.round((score / totalAnswered) * 100) : 0,
          answers:state.answers,
          questionCount:totalAnswered,
          completedAt:new Date().toISOString(),
          quizLevel:'Play & Test',
          stage:state.stage,
          stageLabel:getStageLabel(state.stage),
          badgeTitle:badge.title,
          mode:state.mode,
          elapsedSeconds:state.elapsedSeconds || 0
        },
        progress:{ completed:true, currentIndex:state.currentIndex, questions:state.questions.map(questionPayload) }
      })
    });
    playFinish();
    $('playResultMedal').textContent = badge.medal;
    $('playResultBadge').textContent = badge.title;
    $('playResultBadge').className = 'play-result-badge ' + badge.cls;
    $('playResultScore').textContent = String(score);
    $('playResultText').textContent = timeUp ? tr('playTimeOverResult',{score}) : wrongStop ? tr('playWrongResult',{score}) : tr('playGreatResult',{score});
    saveLocal();
    showSection('playResultCard');
    if (result && result.leaderboard) renderLeaderboard(result.leaderboard); else loadLeaderboard().catch(()=>{});
  }
  window.__playChooseAnswer = function(index){
    if (!state) return;
    const q = state.questions[state.currentIndex];
    const idx = Number(index || 0);
    if (!q || Number.isNaN(idx) || idx < 0 || idx >= q.options.length) return;
    chooseAnswer(q.options[idx]);
  };
  async function startOrResume(){
    try{
      setStatus(tr('playPreparing'));
      const identity = buildIdentity();
      const stage = getStageFromGrade(identity.grade);
      const local = loadLocal();
      const same = local && local.identity && local.identity.name === identity.name && String(local.identity.studentId || '').trim() === identity.studentId && String(local.identity.grade || '') === identity.grade;
      const selectedMode = getSelectedMode();
      const totalMinutes = getSelectedTotalMinutes();
      const totalSeconds = selectedMode === 'total_timer' ? totalMinutes * 60 : selectedMode === 'question_timer' ? QUESTION_SECONDS : 0;
      const startData = await request('?action=start', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ identity, sessionId: same ? local.sessionId : '' }) });
      if (startData.progress && Array.isArray(startData.progress.questions) && startData.progress.questions.length && !startData.progress.completed) {
        const savedMode = startData.progress.mode || selectedMode;
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
          timeLeft:Number(startData.progress.timeLeft || (savedMode === 'question_timer' ? QUESTION_SECONDS : totalSeconds)) || 0,
          mode:savedMode,
          totalSeconds:Number(startData.progress.totalSeconds || totalSeconds) || totalSeconds,
          timerStartedAt:Number(startData.progress.timerStartedAt || Date.now()),
          elapsedSeconds:Number(startData.progress.elapsedSeconds || 0) || 0
        };
        setStatus(tr('playResuming'));
      } else {
        const questions = (window.PlayQuestionBank && window.PlayQuestionBank.createMixedQuiz) ? window.PlayQuestionBank.createMixedQuiz(STAGE_POOL_SIZE[stage], stage, identity.grade) : [];
        state = {
          identity:startData.identity,
          sessionId:startData.sessionId,
          questions,
          currentIndex:0,
          score:0,
          answers:[],
          startedAt:new Date().toISOString(),
          completed:false,
          stage,
          mode:selectedMode,
          totalSeconds,
          timeLeft:selectedMode === 'question_timer' ? QUESTION_SECONDS : selectedMode === 'total_timer' ? totalSeconds : 0,
          timerStartedAt:Date.now(),
          elapsedSeconds:0
        };
        await saveProgress();
        setStatus(tr('playReady'));
      }
      syncModeUi();
      renderQuestion();
      updateAutoNextToggle();
    } catch(error) {
      setStatus(error.message || 'Could not start the quiz.');
    }
  }
  function wireOptionFallbacks(){
    const wrap = $('playOptions');
    if (!wrap) return;
    const handler = function(event){
      const btn = event.target && event.target.closest ? event.target.closest('.play-option-btn') : null;
      if (!btn || btn.disabled || answerLock) return;
      event.preventDefault();
      event.stopPropagation();
      const index = Number(btn.dataset.optionIndex || 0);
      if (!Number.isNaN(index)) window.__playChooseAnswer(index);
    };
    wrap.addEventListener('click', handler, true);
    wrap.addEventListener('pointerup', handler, true);
    wrap.addEventListener('touchend', handler, true);
  }
  function init(){
    if (document.body.dataset.page !== 'playtest') return;
    soundEnabled = loadSoundSetting();
    autoNextEnabled = loadAutoNextSetting();
    applyTranslations();
    wireOptionFallbacks();
    loadLeaderboard().catch(error => setStatus(error.message || tr('playNoLeaderboard')));
    document.querySelectorAll('input[name="gameModeCards"]').forEach(input => input.addEventListener('change', syncModeUi));
    $('totalTimerMinutesInline')?.addEventListener('change', function(){ if ($('totalTimerMinutes')) $('totalTimerMinutes').value = this.value; });
    $('totalTimerMinutes')?.addEventListener('change', function(){ if ($('totalTimerMinutesInline')) $('totalTimerMinutesInline').value = this.value; });
    $('playStartBtn')?.addEventListener('click', startOrResume);
    $('playNextBtn')?.addEventListener('click', nextQuestion);
    $('playAgainBtn')?.addEventListener('click', function(){
      if ($('playStudentName') && state && state.identity) $('playStudentName').value = state.identity.name || '';
      if ($('playStudentId') && state && state.identity) $('playStudentId').value = state.identity.studentId || '';
      if ($('playStudentGrade') && state && state.identity) $('playStudentGrade').value = state.identity.grade || 'KG1';
      clearLocal();
      stopTimer();
      answerLock = false;
      state = null;
      showSection('playStartCard');
      setStatus(tr('playReady'));
      loadLeaderboard().catch(()=>{});
    });
    $('refreshPlayLeadersBtn')?.addEventListener('click', () => loadLeaderboard().catch(()=>{}));
    $('playSoundToggleBtn')?.addEventListener('click', () => { soundEnabled = !soundEnabled; saveSoundSetting(); updateSoundButton(); });
    $('playAutoNextToggle')?.addEventListener('change', function(){ autoNextEnabled = !!this.checked; saveAutoNextSetting(); updateAutoNextToggle(); });
    window.kgPlayHandleLangChange = function(){ applyTranslations(); if (state) renderQuestion(); loadLeaderboard().catch(()=>{}); };
  }
  document.addEventListener('DOMContentLoaded', init);
})();
window.addEventListener('kg:langchange', function(){ if (typeof window.kgPlayHandleLangChange === 'function') window.kgPlayHandleLangChange(); });
