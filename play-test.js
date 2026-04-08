(function(){
  const API = '/api/student/play';
  const STORAGE_KEY = 'kgPlayTestSessionV10';
  const SOUND_STORAGE_KEY = 'kgPlayTestSound';
  const AUTO_NEXT_STORAGE_KEY = 'kgPlayTestAutoNext';
  const QUESTION_SECONDS = 20;
  const GRADE_OPTIONS = [
    ['KG1','KG1'],['KG2','KG2'],['Grade 1','Grade 1'],['Grade 2','Grade 2'],['Grade 3','Grade 3'],['Grade 4','Grade 4'],['Grade 5','Grade 5'],['Grade 6','Grade 6']
  ];
  const I18N = {
    en: {
      playBadge:'Mixed English Challenge', playTitle:'Play & Test With Dr. Tarek',
      playHeroText:'Every start gives a different mixed quiz in English. Play, score high, and race to the top of the live leaderboard.',
      playTop3:'Top 3 Champions', playStartTitle:'Start a New Mixed Quiz', playStudentNamePlaceholder:'Student name',
      playStudentIdPlaceholder:'Student ID (optional)', playStartBtn:'Start Playing', playChooseStage:'Difficulty follows the selected grade',
      playStageAutoNote:'KG1–Grade 2 use Starter, Grade 3–4 use Explorer, and Grade 5–6 use Champion.',
      playStartNote:'Before you start, check the live Top 3. Your score will be shared with all players on the leaderboard.',
      playLoadingLeaderboard:'Loading leaderboard...', playNoTop3:'No scores yet. Be the first champion!', playNoLeaderboard:'No leaderboard data yet.',
      playPlayer:'Player', playStage:'Stage', playQuestion:'Question', playScore:'Score', playTime:'Time', playSounds:'Sounds', playMuted:'Muted',
      playQuestionText:'Question text', playNextQuestion:'Next Question', playResultTitle:'Your Result', playAgain:'Play Again', playLiveLeaderboard:'Live Leaderboard',
      playEnterName:'Please enter the student name first.', playPreparing:'Preparing your mixed challenge...', playResuming:'Resuming your last mixed quiz.',
      playReady:'New mixed quiz ready. Good luck!', playWrongSaved:'Wrong answer recorded. Keep going.', playTimeOver:'Time is over!',
      playTimeOverResult:'Time is over. You scored {score} points.', playWrongResult:'Wrong answer. Final score: {score}', playGreatResult:'Amazing. Final score: {score}',
      playRisingStar:'Rising Star', refresh:'Refresh', leaderName:'Name', leaderGrade:'Grade', leaderStudentId:'Student ID', leaderBestScore:'Best Score',
      leaderAttempts:'Attempts', leaderLastPlayed:'Last Played', playGradeLabel:'Grade', stageStarter:'Starter', stageExplorer:'Explorer', stageChampion:'Champion'
    },
    ar: {
      playBadge:'تحدي إنجليزي مختلط', playTitle:'العب واختبر نفسك مع د. طارق',
      playHeroText:'في كل مرة تبدأ فيها ستحصل على اختبار إنجليزي مختلط مختلف. العب، واجمع النقاط، واصعد إلى لوحة المتصدرين المباشرة.',
      playTop3:'أفضل 3 أبطال', playStartTitle:'ابدأ اختبارًا مختلطًا جديدًا', playStudentNamePlaceholder:'اسم الطالب', playStudentIdPlaceholder:'رقم الطالب (اختياري)',
      playStartBtn:'ابدأ اللعب', playChooseStage:'يتم تحديد الصعوبة تلقائيًا حسب الصف', playStageAutoNote:'KG1 إلى Grade 2 = مبتدئ، Grade 3 إلى Grade 4 = مستكشف، Grade 5 إلى Grade 6 = بطل.',
      playStartNote:'قبل أن تبدأ، تحقق من أفضل 3. سيتم مشاركة نتيجتك مع جميع اللاعبين في لوحة المتصدرين.', playLoadingLeaderboard:'جارٍ تحميل لوحة المتصدرين...',
      playNoTop3:'لا توجد نتائج بعد. كن أول بطل!', playNoLeaderboard:'لا توجد بيانات في لوحة المتصدرين حتى الآن.', playPlayer:'اللاعب', playStage:'المرحلة', playQuestion:'السؤال',
      playScore:'النقاط', playTime:'الوقت', playSounds:'الأصوات', playMuted:'صامت', playQuestionText:'نص السؤال', playNextQuestion:'السؤال التالي',
      playResultTitle:'النتيجة', playAgain:'العب مرة أخرى', playLiveLeaderboard:'لوحة المتصدرين المباشرة', playEnterName:'من فضلك اكتب اسم الطالب أولاً.',
      playPreparing:'جارٍ تجهيز التحدي المختلط...', playResuming:'جارٍ استكمال آخر اختبار مختلط لك.', playReady:'الاختبار المختلط جاهز. بالتوفيق!',
      playWrongSaved:'تم تسجيل الإجابة الخاطئة. أكمل اللعب.', playTimeOver:'انتهى الوقت!', playTimeOverResult:'انتهى الوقت. لقد حصلت على {score} نقطة.',
      playWrongResult:'إجابة خاطئة. النتيجة النهائية: {score}', playGreatResult:'رائع! النتيجة النهائية: {score}', playRisingStar:'نجم صاعد', refresh:'تحديث',
      leaderName:'الاسم', leaderGrade:'الصف', leaderStudentId:'رقم الطالب', leaderBestScore:'أفضل نتيجة', leaderAttempts:'المحاولات', leaderLastPlayed:'آخر لعب',
      playGradeLabel:'الصف', stageStarter:'مبتدئ', stageExplorer:'مستكشف', stageChampion:'بطل'
    }
  };
  const STAGE_LABELS = { starter:{en:'Starter',ar:'مبتدئ'}, explorer:{en:'Explorer',ar:'مستكشف'}, champion:{en:'Champion',ar:'بطل'} };
  const STAGE_POOL_SIZE = { starter:120, explorer:150, champion:180 };
  let state = null, timerId = null, soundEnabled = true, autoNextEnabled = true, answerLock = false, autoNextTimer = null, playDeadlineTs = 0, timerVersion = 0, questionRenderToken = 0;

  function $(id){ return document.getElementById(id); }
  function getLang(){ return window.kgGetLang ? window.kgGetLang() : (localStorage.getItem('kgAppLang') || 'en'); }
  function tr(key, vars){ let value = (I18N[getLang()] && I18N[getLang()][key]) || I18N.en[key] || key; if (vars) Object.keys(vars).forEach(k => value = value.replace(new RegExp('\\{'+k+'\\}','g'), String(vars[k]))); return value; }
  function setDir(){ const lang = getLang(); document.documentElement.lang = lang === 'ar' ? 'ar' : 'en'; document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr'; document.body.dataset.lang = lang; }
  function escapeHtml(v){ return String(v || '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch])); }
  function saveLocal(){ try{ localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }catch(e){} }
  function loadLocal(){ try{ return JSON.parse(localStorage.getItem(STORAGE_KEY)||'null'); }catch(e){ return null; } }
  function clearLocal(){ try{ localStorage.removeItem(STORAGE_KEY); }catch(e){} }
  function saveSoundSetting(){ try{ localStorage.setItem(SOUND_STORAGE_KEY, soundEnabled ? '1' : '0'); }catch(e){} }
  function loadSoundSetting(){ try{ return localStorage.getItem(SOUND_STORAGE_KEY) !== '0'; }catch(e){ return true; } }
  function saveAutoNextSetting(){ try{ localStorage.setItem(AUTO_NEXT_STORAGE_KEY, autoNextEnabled ? '1' : '0'); }catch(e){} }
  function loadAutoNextSetting(){ try{ return localStorage.getItem(AUTO_NEXT_STORAGE_KEY) !== '0'; }catch(e){ return true; } }
  async function request(path, options){ const res = await fetch(API + path, Object.assign({ credentials:'same-origin', cache:'no-store' }, options || {})); const data = await res.json().catch(()=>({ ok:false, error:'Request failed' })); if (!res.ok || !data.ok) throw new Error(data.error || 'Request failed'); return data; }
  function getStageFromGrade(grade){ const g = String(grade || '').toLowerCase(); if (g === 'kg1' || g === 'kg2' || g === 'grade 1' || g === 'grade 2') return 'starter'; if (g === 'grade 3' || g === 'grade 4') return 'explorer'; return 'champion'; }
  function getStageLabel(stage){ return (STAGE_LABELS[stage] && STAGE_LABELS[stage][getLang()]) || STAGE_LABELS[stage].en; }
  function currentMode(){ return document.querySelector('input[name="gameModeCards"]:checked')?.value || $('gameMode')?.value || 'question_timer'; }
  function currentTotalMinutes(){ return Number($('totalTimerMinutesInline')?.value || $('totalTimerMinutes')?.value || 10) || 10; }
  function buildIdentity(){ const name = String($('playStudentName')?.value || '').trim(); const studentId = String($('playStudentId')?.value || '').trim(); const grade = String($('playStudentGrade')?.value || 'KG1').trim(); if (!name) throw new Error(tr('playEnterName')); return { name, studentId, grade, isGuest:true, className:'Play & Test', mode:currentMode(), totalMinutes:currentTotalMinutes() }; }
  function formatTime(seconds){ const total = Math.max(0, Number(seconds || 0) || 0); const mm = String(Math.floor(total / 60)).padStart(2, '0'); const ss = String(total % 60).padStart(2, '0'); return mm + ':' + ss; }
  function setStatus(msg){ const el=$('playStatus'); if (el) el.textContent = msg || ''; }
  function showSection(id){ ['playStartCard','playQuizCard','playResultCard'].forEach(x => $(x)?.classList.add('hidden')); $(id)?.classList.remove('hidden'); }
  function updateProgress(){ const fill=$('playProgressFill'); if (!fill || !state) return; const solved = state.answers.length; const total = state.questions.length || 1; fill.style.width = Math.max(6, Math.round((solved/total)*100)) + '%'; }
  function timerValue(){ if (!state) return 0; return state.mode === 'endless' ? Number(state.elapsedSeconds || 0) : Number(state.timeLeft || 0); }
  function updateBadges(){ if (!state) return; $('playPlayerBadge').textContent = tr('playPlayer') + ': ' + state.identity.name; $('playStageBadge').textContent = tr('playStage') + ': ' + getStageLabel(state.stage); $('playQuestionBadge').textContent = tr('playQuestion') + ' ' + (state.currentIndex + 1); $('playScoreBadge').textContent = tr('playScore') + ': ' + state.score; $('playTimerBadge').textContent = tr('playTime') + ': ' + formatTime(timerValue()); $('playTimerBadge').classList.toggle('timer-warning', state.mode !== 'endless' && Number(state.timeLeft) <= 5); updateProgress(); }
  function updateSoundButton(){ const btn=$('playSoundToggleBtn'); if (btn) btn.textContent = (soundEnabled ? '🔊 ' + tr('playSounds') : '🔈 ' + tr('playMuted')); }
  function updateAutoNextToggle(){ const el=$('playAutoNextToggle'); if (el) el.checked = autoNextEnabled; }
  function playTone(freq,duration,type,volume){ if (!soundEnabled) return; try{ const Ctx=window.AudioContext||window.webkitAudioContext; if(!Ctx) return; const ctx=playTone.ctx||(playTone.ctx=new Ctx()); const osc=ctx.createOscillator(); const gain=ctx.createGain(); osc.type=type||'sine'; osc.frequency.value=freq; gain.gain.value=volume||0.05; osc.connect(gain); gain.connect(ctx.destination); osc.start(); gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + (duration||0.15)); osc.stop(ctx.currentTime + (duration||0.15)); }catch(e){} }
  function playCorrect(){ playTone(660,0.12,'triangle',0.06); setTimeout(()=>playTone(880,0.16,'triangle',0.05),90); }
  function playWrong(){ playTone(220,0.16,'sawtooth',0.05); setTimeout(()=>playTone(180,0.18,'sawtooth',0.04),80); }
  function playFinish(){ playTone(523,0.12,'triangle',0.05); setTimeout(()=>playTone(659,0.12,'triangle',0.05),90); setTimeout(()=>playTone(784,0.18,'triangle',0.06),180); }
  function questionPayload(q){ return { text:q.text, options:q.options, answer:q.answer, skill:q.skill||'', type:'Choice', difficulty:Number(q.difficulty||1)||1, image:q.image||'' }; }
  function getBadgeMeta(score){ if (score >= 25) return { medal:'🏆', title:'Grand Champion', cls:'gold' }; if (score >= 15) return { medal:'🥇', title:'Super Star', cls:'silver' }; return { medal:'🌟', title:tr('playRisingStar'), cls:'bronze' }; }
  function applyPlayTranslations(){
    setDir();
    document.querySelectorAll('[data-i18n]').forEach(el => { const k = el.getAttribute('data-i18n'); if (I18N[getLang()]?.[k]) el.textContent = I18N[getLang()][k]; });
    document.querySelectorAll('[data-placeholder-i18n]').forEach(el => { const k = el.getAttribute('data-placeholder-i18n'); if (I18N[getLang()]?.[k]) el.setAttribute('placeholder', I18N[getLang()][k]); });
    const select = $('playStudentGrade'); if (select && !select.dataset.ready){ select.innerHTML = GRADE_OPTIONS.map(([label,value]) => `<option value="${escapeHtml(value)}">${escapeHtml(label)}</option>`).join(''); select.dataset.ready='1'; }
    updateSoundButton(); updateAutoNextToggle();
  }
  function renderQuestionImage(q){
    const wrap = $('questionImageWrap'); const img = $('questionImage'); if (!wrap || !img) return;
    const image = q && q.image ? q.image : null;
    if (!image || typeof window.loadQuestionImage !== 'function') { wrap.classList.add('hidden'); img.removeAttribute('src'); return; }
    try { window.loadQuestionImage(image, q.text || ''); } catch (e) { wrap.classList.add('hidden'); img.removeAttribute('src'); }
  }
  function renderLeaderboard(data){
    const top = $('playTop3List'); const body = $('playLeaderboardBody'); const rows = Array.isArray(data.leaderboard) ? data.leaderboard : [];
    if (top) top.innerHTML = rows.slice(0,3).map((row, idx) => `<div class="play-top3-item place-${idx+1}"><strong>#${idx+1} ${escapeHtml(row.name || '-')}</strong><span>${escapeHtml(row.grade || '-')}</span><b>${Number(row.bestScore || 0)}</b></div>`).join('') || `<div class="play-top3-empty">${tr('playNoTop3')}</div>`;
    if (body) body.innerHTML = rows.map((row, idx) => `<tr><td>${idx+1}</td><td>${escapeHtml(row.name || '-')}</td><td>${escapeHtml(row.grade || '-')}</td><td>${escapeHtml(row.studentId || '-')}</td><td>${Number(row.bestScore || 0)}</td><td>${Number(row.attempts || 0)}</td><td>${escapeHtml(row.lastPlayed || '-')}</td></tr>`).join('') || `<tr><td colspan="7">${tr('playNoLeaderboard')}</td></tr>`;
  }
  async function loadLeaderboard(){ const data = await request('?action=leaderboard'); renderLeaderboard(data); return data; }
  function stopTimer(){ timerVersion += 1; if (timerId) { clearInterval(timerId); timerId = null; } if (autoNextTimer) { clearTimeout(autoNextTimer); autoNextTimer = null; } playDeadlineTs = 0; }
  function startTimer(){
    stopTimer(); if (!state) return; const version = timerVersion; const renderToken = questionRenderToken;
    if (state.mode === 'endless') {
      const startedAtMs = Number(state.startedAtMs || Date.now()); state.startedAtMs = startedAtMs;
      timerId = setInterval(function(){ if (!state || version !== timerVersion || renderToken !== questionRenderToken) return stopTimer(); state.elapsedSeconds = Math.max(0, Math.floor((Date.now() - startedAtMs) / 1000)); updateBadges(); }, 250);
      updateBadges(); return;
    }
    const startLeft = Math.max(0, Number(state.timeLeft || QUESTION_SECONDS) || QUESTION_SECONDS); state.timeLeft = startLeft; playDeadlineTs = Date.now() + (startLeft * 1000); updateBadges();
    timerId = setInterval(async function(){ if (!state || version !== timerVersion || renderToken !== questionRenderToken) return stopTimer(); const remaining = Math.max(0, Math.floor((playDeadlineTs - Date.now() + 999) / 1000)); if (remaining !== state.timeLeft) { state.timeLeft = remaining; updateBadges(); } if (remaining <= 0) { stopTimer(); await finishQuiz(true, false); } }, 200);
  }
  async function saveProgress(){ if (!state) return; state.updatedAt = new Date().toISOString(); saveLocal(); await request('?action=save-progress', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ identity:state.identity, sessionId:state.sessionId, state:{ currentIndex:state.currentIndex, score:state.score, answers:state.answers, questions:state.questions.map(questionPayload), startedAt:state.startedAt, startedAtMs:state.startedAtMs, updatedAt:state.updatedAt, completed:false, stage:state.stage, stageLabel:getStageLabel(state.stage), timeLeft:state.timeLeft, elapsedSeconds:state.elapsedSeconds||0, totalSeconds:QUESTION_SECONDS, mode:state.mode, totalMinutes:state.totalMinutes||10 } }) }); }
  function markAnsweredUi(option, correct){ const q = state.questions[state.currentIndex]; [...document.querySelectorAll('#playOptions .play-option-btn')].forEach(btn => { const idx = Number(btn.dataset.optionIndex || 0); const opt = q.options[idx]; btn.disabled = true; if (opt === q.answer) btn.classList.add('correct'); if (opt === option && !correct) btn.classList.add('wrong'); }); $('playNextBtn').disabled = false; }
  async function chooseAnswer(option){ if (!state || answerLock) return; const q = state.questions[state.currentIndex]; if (!q) return; if (state.answers.find(a => a.index === state.currentIndex)) return; answerLock = true; if (state.mode !== 'endless') stopTimer(); const correct = option === q.answer; state.answers.push({ index:state.currentIndex, questionText:q.text, chosen:option, correct, expected:q.answer, answeredAt:new Date().toISOString(), difficulty:q.difficulty || 1 }); if (correct) { state.score += 1; playCorrect(); } else { playWrong(); }
    markAnsweredUi(option, correct); updateBadges(); saveProgress().catch(()=>{});
    if (!correct && state.mode !== 'endless') { setStatus(tr('playWrongSaved')); autoNextTimer = setTimeout(() => { finishQuiz(false, true).catch(()=>{}); }, 450); return; }
    if (autoNextEnabled) autoNextTimer = setTimeout(() => { nextQuestion(); }, 320); else answerLock = false;
  }
  function renderQuestion(){ if (!state) return; questionRenderToken += 1; answerLock = false; if (autoNextTimer) { clearTimeout(autoNextTimer); autoNextTimer = null; } if (state.currentIndex >= state.questions.length) { finishQuiz(false, false).catch(()=>{}); return; } showSection('playQuizCard'); const q = state.questions[state.currentIndex]; const answered = state.answers.find(a => a.index === state.currentIndex); const resumingSameQuestion = state._resumeIndex === state.currentIndex && !answered; if (state.mode !== 'endless' && (!resumingSameQuestion || !Number.isFinite(Number(state.timeLeft)) || Number(state.timeLeft) <= 0 || answered)) state.timeLeft = state.mode === 'total_timer' ? (Number(state.timeLeft || (state.totalMinutes*60)) || (state.totalMinutes*60)) : QUESTION_SECONDS; state._resumeIndex = null; updateBadges(); $('playQuestionText').textContent = q.text; renderQuestionImage(q); $('playOptions').innerHTML = q.options.map((opt, idx) => `<button type="button" class="play-option-btn" data-option-index="${idx}" onclick="window.__playChooseAnswer(${idx})">${escapeHtml(opt)}</button>`).join(''); $('playNextBtn').disabled = true; startTimer(); }
  function nextQuestion(){ if (!state) return; if (!state.answers.find(a => a.index === state.currentIndex)) return; if (state.mode === 'question_timer') { stopTimer(); state.timeLeft = QUESTION_SECONDS; } else if (state.mode === 'total_timer') { stopTimer(); } else { answerLock = false; }
    state.currentIndex += 1; saveProgress().catch(()=>{}); renderQuestion(); }
  async function finishQuiz(timeUp, wrongStop){ if (!state || state.completed) return; state.completed = true; stopTimer(); const score = Number(state.score || 0); const badge = getBadgeMeta(score); const total = Number(state.questions?.length || state.answers.length || 0) || 1; const result = await request('?action=submit', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ identity:state.identity, sessionId:state.sessionId, result:{ score, total, percent: Math.round((score / total) * 100), answers:state.answers, questionCount:total, completedAt:new Date().toISOString(), quizLevel:'Play & Test', stage:state.stage, stageLabel:getStageLabel(state.stage), badgeTitle:badge.title, mode:state.mode, elapsedSeconds:timerValue() }, progress:{ completed:true, currentIndex:state.currentIndex, questions:state.questions.map(questionPayload) } }) }); playFinish(); $('playResultMedal').textContent = badge.medal; $('playResultBadge').textContent = badge.title; $('playResultBadge').className = 'play-result-badge ' + badge.cls; $('playResultScore').textContent = String(score); $('playResultText').textContent = timeUp ? tr('playTimeOverResult',{score}) : wrongStop ? tr('playWrongResult',{score}) : tr('playGreatResult',{score}); saveLocal(); showSection('playResultCard'); if (result && result.leaderboard) renderLeaderboard(result.leaderboard); else loadLeaderboard().catch(()=>{}); }
  window.__playChooseAnswer = function(index){ if (!state) return; const q=state.questions[state.currentIndex]; const idx=Number(index||0); if (!q || Number.isNaN(idx) || idx<0 || idx>=q.options.length) return; chooseAnswer(q.options[idx]); };
  async function startOrResume(){ try{ setStatus(tr('playPreparing')); const identity = buildIdentity(); const stage = getStageFromGrade(identity.grade); const local = loadLocal(); const same = local && local.identity && local.identity.name === identity.name && String(local.identity.studentId||'').trim() === identity.studentId && String(local.identity.grade||'') === identity.grade; const startData = await request('?action=start',{ method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ identity, sessionId: same ? local.sessionId : '' }) }); if (startData.progress && Array.isArray(startData.progress.questions) && startData.progress.questions.length && !startData.progress.completed) { state = { identity:startData.identity, sessionId:startData.sessionId, questions:startData.progress.questions, currentIndex:Number(startData.progress.currentIndex||0)||0, score:Number(startData.progress.score||0)||0, answers:Array.isArray(startData.progress.answers)?startData.progress.answers:[], startedAt:startData.progress.startedAt || new Date().toISOString(), startedAtMs:Number(startData.progress.startedAtMs||Date.now()), completed:false, stage:startData.progress.stage||stage, timeLeft:Number(startData.progress.timeLeft||QUESTION_SECONDS)||QUESTION_SECONDS, elapsedSeconds:Number(startData.progress.elapsedSeconds||0)||0, mode:startData.progress.mode || identity.mode || 'question_timer', totalMinutes:Number(startData.progress.totalMinutes||identity.totalMinutes||10)||10, _resumeIndex:Number(startData.progress.currentIndex||0)||0 }; setStatus(tr('playResuming')); } else { const questions = (window.PlayQuestionBank && window.PlayQuestionBank.createMixedQuiz) ? window.PlayQuestionBank.createMixedQuiz(STAGE_POOL_SIZE[stage], stage, identity.grade) : []; const totalTime = identity.mode === 'total_timer' ? identity.totalMinutes * 60 : QUESTION_SECONDS; state = { identity:startData.identity, sessionId:startData.sessionId, questions, currentIndex:0, score:0, answers:[], startedAt:new Date().toISOString(), startedAtMs:Date.now(), completed:false, stage, timeLeft:totalTime, elapsedSeconds:0, mode:identity.mode, totalMinutes:identity.totalMinutes, _resumeIndex:null }; await saveProgress(); setStatus(tr('playReady')); } renderQuestion(); updateAutoNextToggle(); } catch(error){ setStatus(error.message || 'Could not start the quiz.'); } }
  function wireOptionFallbacks(){ const wrap = $('playOptions'); if (!wrap) return; const handler = function(event){ const btn = event.target && event.target.closest ? event.target.closest('.play-option-btn') : null; if (!btn || btn.disabled || answerLock) return; event.preventDefault(); event.stopPropagation(); const index = Number(btn.dataset.optionIndex || 0); if (!Number.isNaN(index)) window.__playChooseAnswer(index); }; wrap.addEventListener('click', handler, true); wrap.addEventListener('pointerup', handler, true); wrap.addEventListener('touchend', handler, true); }
  function wireModeCards(){ document.querySelectorAll('input[name="gameModeCards"]').forEach(input => { input.addEventListener('change', function(){ const wrap = $('totalTimerInlineWrap'); if (wrap) wrap.hidden = this.value !== 'total_timer'; if ($('gameMode')) $('gameMode').value = this.value; document.querySelectorAll('.mode-card').forEach(card => card.classList.toggle('active', card.dataset.modeValue === this.value)); }); }); document.querySelector('input[name="gameModeCards"]:checked')?.dispatchEvent(new Event('change')); }
  function init(){ if (document.body.dataset.page !== 'playtest') return; soundEnabled = loadSoundSetting(); autoNextEnabled = loadAutoNextSetting(); applyPlayTranslations(); wireOptionFallbacks(); wireModeCards(); loadLeaderboard().catch(error => setStatus(error.message || tr('playNoLeaderboard'))); $('playStartBtn')?.addEventListener('click', startOrResume); $('playNextBtn')?.addEventListener('click', nextQuestion); $('playAgainBtn')?.addEventListener('click', function(){ if ($('playStudentName') && state && state.identity) $('playStudentName').value = state.identity.name || ''; if ($('playStudentId') && state && state.identity) $('playStudentId').value = state.identity.studentId || ''; if ($('playStudentGrade') && state && state.identity) $('playStudentGrade').value = state.identity.grade || 'KG1'; clearLocal(); stopTimer(); answerLock = false; state = null; showSection('playStartCard'); setStatus(tr('playReady')); loadLeaderboard().catch(()=>{}); }); $('refreshPlayLeadersBtn')?.addEventListener('click', ()=> loadLeaderboard().catch(()=>{})); $('playSoundToggleBtn')?.addEventListener('click', ()=>{ soundEnabled=!soundEnabled; saveSoundSetting(); updateSoundButton(); }); $('playAutoNextToggle')?.addEventListener('change', function(){ autoNextEnabled=!!this.checked; saveAutoNextSetting(); updateAutoNextToggle(); }); window.kgPlayHandleLangChange = function(){ applyPlayTranslations(); if (state) { renderQuestion(); } loadLeaderboard().catch(()=>{}); }; }
  document.addEventListener('DOMContentLoaded', init);
})();
window.addEventListener('kg:langchange', function(){ if (typeof window.kgPlayHandleLangChange === 'function') window.kgPlayHandleLangChange(); });
