(function(){
  const API = '/api/student/play';
  const STORAGE_KEY = 'kgPlayTestSessionV9';
  const SOUND_STORAGE_KEY = 'kgPlayTestSound';
  const AUTO_NEXT_STORAGE_KEY = 'kgPlayTestAutoNext';
  const QUESTION_SECONDS = 20;
  function currentMode(){ const el = document.getElementById('gameMode'); return String(el && el.value || 'question_timer').trim().toLowerCase(); }
  function isEndlessMode(){ return currentMode() === 'endless'; }
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
  function buildIdentity(){ const name = String($('playStudentName')?.value || '').trim(); const studentId = String($('playStudentId')?.value || '').trim(); const grade = String($('playStudentGrade')?.value || 'KG1').trim(); if (!name) throw new Error(tr('playEnterName')); return { name, studentId, grade, isGuest:true, className:'Play & Test' }; }
  function formatTime(seconds){ return String(Math.max(0, Number(seconds||0))); }
  function setStatus(msg){ const el=$('playStatus'); if (el) el.textContent = msg || ''; }
  function showSection(id){ ['playStartCard','playQuizCard','playResultCard'].forEach(x => $(x)?.classList.add('hidden')); $(id)?.classList.remove('hidden'); }
  function updateProgress(){ const fill=$('playProgressFill'); if (!fill || !state) return; const solved = state.answers.length; const total = state.questions.length || 1; fill.style.width = Math.max(6, Math.round((solved/total)*100)) + '%'; }
  function updateBadges(){ if (!state) return; $('playPlayerBadge').textContent = tr('playPlayer') + ': ' + state.identity.name; $('playStageBadge').textContent = tr('playStage') + ': ' + getStageLabel(state.stage); $('playQuestionBadge').textContent = tr('playQuestion') + ' ' + (state.currentIndex + 1); $('playScoreBadge').textContent = tr('playScore') + ': ' + state.score; $('playTimerBadge').textContent = tr('playTime') + ': ' + formatTime(state.timeLeft); $('playTimerBadge').classList.toggle('timer-warning', Number(state.timeLeft) <= 5); updateProgress(); }
  function updateSoundButton(){ const btn=$('playSoundToggleBtn'); if (btn) btn.textContent = (soundEnabled ? '🔊 ' + tr('playSounds') : '🔈 ' + tr('playMuted')); }
  function updateAutoNextToggle(){ const el=$('playAutoNextToggle'); if (el) el.checked = autoNextEnabled; }
  function playTone(freq,duration,type,volume){ if (!soundEnabled) return; try{ const Ctx=window.AudioContext||window.webkitAudioContext; if(!Ctx) return; const ctx=playTone.ctx||(playTone.ctx=new Ctx()); const osc=ctx.createOscillator(); const gain=ctx.createGain(); osc.type=type||'sine'; osc.frequency.value=freq; gain.gain.value=volume||0.05; osc.connect(gain); gain.connect(ctx.destination); osc.start(); gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + (duration||0.15)); osc.stop(ctx.currentTime + (duration||0.15)); }catch(e){} }
  function playCorrect(){ playTone(660,0.12,'triangle',0.06); setTimeout(()=>playTone(880,0.16,'triangle',0.05),90); }
  function playWrong(){ playTone(220,0.16,'sawtooth',0.05); setTimeout(()=>playTone(180,0.18,'sawtooth',0.04),80); }
  function playFinish(){ playTone(523,0.12,'triangle',0.05); setTimeout(()=>playTone(659,0.12,'triangle',0.05),90); setTimeout(()=>playTone(784,0.18,'triangle',0.06),180); }
  function questionPayload(q){ return { text:q.text, options:q.options, answer:q.answer, skill:q.skill||'', type:'Choice', difficulty:Number(q.difficulty||1)||1 }; }
  function getBadgeMeta(score){ if (score >= 50) return { medal:'👑', title: getLang()==='ar' ? 'ملك التحدي' : 'Quiz King / Queen', cls:'gold' }; if (score >= 30) return { medal:'🥇', title:getLang()==='ar'?'بطل ذهبي':'Gold Champion', cls:'gold' }; if (score >= 20) return { medal:'🥈', title:getLang()==='ar'?'نجم فضي':'Silver Star', cls:'silver' }; if (score >= 10) return { medal:'🥉', title:getLang()==='ar'?'بطل برونزي':'Bronze Brave', cls:'bronze' }; return { medal:'🌟', title:tr('playRisingStar'), cls:'star' }; }

  function applyPlayTranslations(){
    setDir();
    document.querySelectorAll('[data-i18n]').forEach(el => { const key = el.dataset.i18n; if (I18N.en[key] || (I18N.ar&&I18N.ar[key])) el.textContent = tr(key); });
    document.querySelectorAll('[data-placeholder-i18n]').forEach(el => { el.placeholder = tr(el.dataset.placeholderI18n); });
    const gradeSelect=$('playStudentGrade');
    if (gradeSelect) {
      const current = gradeSelect.value || 'KG1';
      const labels = { en:['KG1','KG2','Grade 1','Grade 2','Grade 3','Grade 4','Grade 5','Grade 6'], ar:['كي جي 1','كي جي 2','الصف 1','الصف 2','الصف 3','الصف 4','الصف 5','الصف 6'] };
      gradeSelect.innerHTML = GRADE_OPTIONS.map((pair, idx) => `<option value="${pair[0]}" ${pair[0]===current?'selected':''}>${labels[getLang()][idx]}</option>`).join('');
    }
    updateSoundButton(); updateAutoNextToggle(); updateBadges();
  }

  function renderLeaderboard(data){
    const top3 = Array.isArray(data.top3) ? data.top3 : [];
    const leaders = Array.isArray(data.leaderboard) ? data.leaderboard : [];
    $('playTop3List').innerHTML = top3.length ? top3.map((row, index) => `<div class="play-top3-item rank-${index+1}"><div class="play-medal">${index===0?'🥇':index===1?'🥈':'🥉'}</div><div><strong>${escapeHtml(row.studentName)}</strong><span>${escapeHtml(row.grade || '-')}</span><small>${escapeHtml(String(row.bestScore || 0))} pts</small></div><div class="play-medal-score">${escapeHtml(String(row.bestScore || 0))}</div></div>`).join('') : `<div class="play-top3-empty">${escapeHtml(tr('playNoTop3'))}</div>`;
    $('playLeaderboardBody').innerHTML = leaders.length ? leaders.map((row, index) => `<tr><td>${index+1}</td><td>${escapeHtml(row.studentName)}</td><td>${escapeHtml(row.grade || '-')}</td><td>${escapeHtml(row.studentId || '-')}</td><td>${escapeHtml(String(row.bestScore || 0))}</td><td>${escapeHtml(String(row.attempts || 0))}</td><td>${escapeHtml(row.updatedAt ? new Date(row.updatedAt).toLocaleString() : '-')}</td></tr>`).join('') : `<tr><td colspan="7">${escapeHtml(tr('playNoLeaderboard'))}</td></tr>`;
  }
  async function loadLeaderboard(){ const data = await request('?action=leaderboard'); renderLeaderboard(data); return data; }
  function stopTimer(){ timerVersion += 1; if (timerId) { clearInterval(timerId); timerId = null; } if (autoNextTimer) { clearTimeout(autoNextTimer); autoNextTimer = null; } playDeadlineTs = 0; }
  
function startTimer(){
  stopTimer();
  if (!state) return;
  const version = timerVersion;
  const renderToken = questionRenderToken;
  if (isEndlessMode()) {
    const elapsedStart = Number(state.elapsedSeconds || 0) || 0;
    const startedAtMs = Date.now() - (elapsedStart * 1000);
    timerId = setInterval(function(){
      if (!state || version !== timerVersion || renderToken !== questionRenderToken) return stopTimer();
      state.elapsedSeconds = Math.max(0, Math.floor((Date.now() - startedAtMs) / 1000));
      state.timeLeft = state.elapsedSeconds;
      updateBadges();
    }, 200);
    updateBadges();
    return;
  }
  const startLeft = Math.max(0, Number(state.timeLeft || QUESTION_SECONDS) || QUESTION_SECONDS);
  state.timeLeft = startLeft;
  playDeadlineTs = Date.now() + (startLeft * 1000);
  updateBadges();
  timerId = setInterval(async function(){
    if (!state || version !== timerVersion || renderToken !== questionRenderToken) return stopTimer();
    const remaining = Math.max(0, Math.floor((playDeadlineTs - Date.now() + 999) / 1000));
    if (remaining !== state.timeLeft) {
      state.timeLeft = remaining;
      updateBadges();
    }
    if (remaining <= 0) {
      stopTimer();
      await finishQuiz(true, false);
    }
  }, 200);
}
async function saveProgress(){ if (!state) return; state.updatedAt = new Date().toISOString(); saveLocal(); await request('?action=save-progress', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ identity:state.identity, sessionId:state.sessionId, state:{ currentIndex:state.currentIndex, score:state.score, answers:state.answers, questions:state.questions.map(questionPayload), startedAt:state.startedAt, updatedAt:state.updatedAt, completed:false, stage:state.stage, stageLabel:getStageLabel(state.stage), timeLeft:state.timeLeft, elapsedSeconds: state.elapsedSeconds || 0, totalSeconds: isEndlessMode() ? 0 : QUESTION_SECONDS, mode: currentMode() } }) }); }
  function markAnsweredUi(option, correct){ const q = state.questions[state.currentIndex]; [...document.querySelectorAll('#playOptions .play-option-btn')].forEach(btn => { const idx = Number(btn.dataset.optionIndex || 0); const opt = q.options[idx]; btn.disabled = true; if (opt === q.answer) btn.classList.add('correct'); if (opt === option && !correct) btn.classList.add('wrong'); }); $('playNextBtn').disabled = false; }
  async function chooseAnswer(option){ if (!state || answerLock) return; const q = state.questions[state.currentIndex]; if (!q) return; if (state.answers.find(a => a.index === state.currentIndex)) return; answerLock = true; stopTimer(); const correct = option === q.answer; state.answers.push({ index:state.currentIndex, questionText:q.text, chosen:option, correct, expected:q.answer, answeredAt:new Date().toISOString(), difficulty:q.difficulty || 1 }); if (correct) { state.score += 1; playCorrect(); } else { playWrong(); }
    markAnsweredUi(option, correct); updateBadges(); saveProgress().catch(()=>{});
    if (!correct) { setStatus(tr('playWrongSaved')); autoNextTimer = setTimeout(() => { finishQuiz(false, true).catch(()=>{}); }, 450); return; }
    if (autoNextEnabled) autoNextTimer = setTimeout(() => { nextQuestion(); }, 320); else answerLock = false;
  }
  function renderQuestion(){ if (!state) return; questionRenderToken += 1; answerLock = false; if (autoNextTimer) { clearTimeout(autoNextTimer); autoNextTimer = null; } if (state.currentIndex >= state.questions.length) { finishQuiz(false, false).catch(()=>{}); return; } showSection('playQuizCard'); const q = state.questions[state.currentIndex]; const resumingSameQuestion = state._resumeIndex === state.currentIndex && !state.answers.find(a => a.index === state.currentIndex); if (!isEndlessMode() && (!resumingSameQuestion || !Number.isFinite(Number(state.timeLeft)) || Number(state.timeLeft) <= 0 || state.answers.find(a => a.index === state.currentIndex))) state.timeLeft = QUESTION_SECONDS; state._resumeIndex = null; updateBadges(); $('playQuestionText').textContent = q.text; $('playOptions').innerHTML = q.options.map((opt, idx) => `<button type="button" class="play-option-btn" data-option-index="${idx}" onclick="window.__playChooseAnswer(${idx})">${escapeHtml(opt)}</button>`).join(''); $('playNextBtn').disabled = true; startTimer(); }
  function nextQuestion(){ if (!state) return; if (!state.answers.find(a => a.index === state.currentIndex)) return; stopTimer(); state.currentIndex += 1; if (!isEndlessMode()) state.timeLeft = QUESTION_SECONDS; saveProgress().catch(()=>{}); renderQuestion(); }
  async function finishQuiz(timeUp, wrongStop){ if (!state || state.completed) return; state.completed = true; stopTimer(); const score = Number(state.score || 0); const badge = getBadgeMeta(score); const result = await request('?action=submit', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ identity:state.identity, sessionId:state.sessionId, result:{ score, total:state.questions.length || state.answers.length, percent: (state.questions.length || state.answers.length) ? Math.round((score / (state.questions.length || state.answers.length)) * 100) : 0, answers:state.answers, elapsedSeconds: state.elapsedSeconds || 0, questionCount:state.answers.length, completedAt:new Date().toISOString(), quizLevel:'Play & Test', stage:state.stage, stageLabel:getStageLabel(state.stage), badgeTitle:badge.title }, progress:{ completed:true, currentIndex:state.currentIndex, questions:state.questions.map(questionPayload) } }) }); playFinish(); $('playResultMedal').textContent = badge.medal; $('playResultBadge').textContent = badge.title; $('playResultBadge').className = 'play-result-badge ' + badge.cls; $('playResultScore').textContent = String(score); $('playResultText').textContent = timeUp ? tr('playTimeOverResult',{score}) : wrongStop ? tr('playWrongResult',{score}) : tr('playGreatResult',{score}); saveLocal(); showSection('playResultCard'); if (result && result.leaderboard) renderLeaderboard(result.leaderboard); else loadLeaderboard().catch(()=>{}); }
  window.__playChooseAnswer = function(index){ if (!state) return; const q=state.questions[state.currentIndex]; const idx=Number(index||0); if (!q || Number.isNaN(idx) || idx<0 || idx>=q.options.length) return; chooseAnswer(q.options[idx]); };
  async function startOrResume(){ try{ setStatus(tr('playPreparing')); const identity = buildIdentity(); const stage = getStageFromGrade(identity.grade); const local = loadLocal(); const same = local && local.identity && local.identity.name === identity.name && String(local.identity.studentId||'').trim() === identity.studentId && String(local.identity.grade||'') === identity.grade; const startData = await request('?action=start',{ method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ identity, sessionId: same ? local.sessionId : '' }) }); if (startData.progress && Array.isArray(startData.progress.questions) && startData.progress.questions.length && !startData.progress.completed) { state = { identity:startData.identity, sessionId:startData.sessionId, questions:startData.progress.questions, currentIndex:Number(startData.progress.currentIndex||0)||0, score:Number(startData.progress.score||0)||0, answers:Array.isArray(startData.progress.answers)?startData.progress.answers:[], startedAt:startData.progress.startedAt || new Date().toISOString(), completed:false, stage:startData.progress.stage||stage, timeLeft:Number(startData.progress.timeLeft||QUESTION_SECONDS)||QUESTION_SECONDS, _resumeIndex:Number(startData.progress.currentIndex||0)||0 }; setStatus(tr('playResuming')); } else { const questions = (window.PlayQuestionBank && window.PlayQuestionBank.createMixedQuiz) ? window.PlayQuestionBank.createMixedQuiz(STAGE_POOL_SIZE[stage], stage, identity.grade) : []; state = { identity:startData.identity, sessionId:startData.sessionId, questions, currentIndex:0, score:0, answers:[], startedAt:new Date().toISOString(), completed:false, stage, timeLeft:QUESTION_SECONDS, _resumeIndex:null }; await saveProgress(); setStatus(tr('playReady')); } renderQuestion(); updateAutoNextToggle(); } catch(error){ setStatus(error.message || 'Could not start the quiz.'); } }
  function wireOptionFallbacks(){ const wrap = $('playOptions'); if (!wrap) return; const handler = function(event){ const btn = event.target && event.target.closest ? event.target.closest('.play-option-btn') : null; if (!btn || btn.disabled || answerLock) return; event.preventDefault(); event.stopPropagation(); const index = Number(btn.dataset.optionIndex || 0); if (!Number.isNaN(index)) window.__playChooseAnswer(index); }; wrap.addEventListener('click', handler, true); wrap.addEventListener('pointerup', handler, true); wrap.addEventListener('touchend', handler, true); }
  function init(){ if (document.body.dataset.page !== 'playtest') return; soundEnabled = loadSoundSetting(); autoNextEnabled = loadAutoNextSetting(); applyPlayTranslations(); wireOptionFallbacks(); loadLeaderboard().catch(error => setStatus(error.message || tr('playNoLeaderboard'))); $('playStartBtn')?.addEventListener('click', startOrResume); $('playNextBtn')?.addEventListener('click', nextQuestion); $('playAgainBtn')?.addEventListener('click', function(){ if ($('playStudentName') && state && state.identity) $('playStudentName').value = state.identity.name || ''; if ($('playStudentId') && state && state.identity) $('playStudentId').value = state.identity.studentId || ''; if ($('playStudentGrade') && state && state.identity) $('playStudentGrade').value = state.identity.grade || 'KG1'; clearLocal(); stopTimer(); answerLock = false; state = null; showSection('playStartCard'); setStatus(tr('playReady')); loadLeaderboard().catch(()=>{}); }); $('refreshPlayLeadersBtn')?.addEventListener('click', ()=> loadLeaderboard().catch(()=>{})); $('playSoundToggleBtn')?.addEventListener('click', ()=>{ soundEnabled=!soundEnabled; saveSoundSetting(); updateSoundButton(); }); $('playAutoNextToggle')?.addEventListener('change', function(){ autoNextEnabled=!!this.checked; saveAutoNextSetting(); updateAutoNextToggle(); }); window.kgPlayHandleLangChange = function(){ applyPlayTranslations(); if (state) { renderQuestion(); } loadLeaderboard().catch(()=>{}); } }
  document.addEventListener('DOMContentLoaded', init);
})();
window.addEventListener('kg:langchange', function(){ if (typeof window.kgPlayHandleLangChange === 'function') window.kgPlayHandleLangChange(); });

window.renderLeaderboard = renderLeaderboard;
