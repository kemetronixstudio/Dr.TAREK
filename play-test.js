(function(){
  const API = '/api/student/play';
  const STORAGE_KEY = 'kgPlayTestSessionV1';
  const QUESTION_COUNT = 15;
  let state = null;

  function $(id){ return document.getElementById(id); }
  function setStatus(msg){ const el = $('playStatus'); if (el) el.textContent = msg || ''; }
  function escapeHtml(value){ return String(value || '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch])); }
  function saveLocal(){ try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (error) {} }
  function loadLocal(){ try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null'); } catch (error) { return null; } }
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
  function questionPayload(q){
    return { text:q.text, options:q.options, answer:q.answer, skill:q.skill || '', type:'Choice', difficulty:1 };
  }
  function renderLeaderboard(data){
    const top3 = Array.isArray(data.top3) ? data.top3 : [];
    const leaders = Array.isArray(data.leaderboard) ? data.leaderboard : [];
    $('playTop3List').innerHTML = top3.length ? top3.map((row, index) => `<div class="play-top3-item rank-${index+1}"><div class="play-medal">${index===0?'🥇':index===1?'🥈':'🥉'}</div><div><strong>${escapeHtml(row.studentName)}</strong><span>${escapeHtml(row.studentId || 'No ID')}</span></div><div class="play-medal-score">${escapeHtml(String(row.bestPercent || 0))}%</div></div>`).join('') : '<div class="play-top3-empty">No scores yet. Be the first champion!</div>';
    $('playLeaderboardBody').innerHTML = leaders.length ? leaders.map((row, index) => `<tr><td>${index+1}</td><td>${escapeHtml(row.studentName)}</td><td>${escapeHtml(row.studentId || '-')}</td><td>${escapeHtml(String(row.bestPercent || 0))}%</td><td>${escapeHtml(String(row.attempts || 0))}</td><td>${escapeHtml(row.updatedAt ? new Date(row.updatedAt).toLocaleString() : '-')}</td></tr>`).join('') : '<tr><td colspan="6">No leaderboard data yet.</td></tr>';
  }
  async function loadLeaderboard(){
    const data = await request('?action=leaderboard');
    renderLeaderboard(data);
    return data;
  }
  function showSection(cardId){ ['playStartCard','playQuizCard','playResultCard'].forEach(id => $(id)?.classList.add('hidden')); $(cardId)?.classList.remove('hidden'); }
  function updateBadges(){
    if (!state) return;
    $('playPlayerBadge').textContent = `Player: ${state.identity.name}`;
    $('playQuestionBadge').textContent = `Question ${Math.min(state.currentIndex + 1, state.questions.length)} / ${state.questions.length}`;
    $('playScoreBadge').textContent = `Score: ${state.score}`;
    $('playProgressFill').style.width = `${Math.round((state.answers.length / state.questions.length) * 100)}%`;
  }
  function renderQuestion(){
    if (!state) return;
    if (state.currentIndex >= state.questions.length) { finishQuiz(); return; }
    showSection('playQuizCard');
    updateBadges();
    const q = state.questions[state.currentIndex];
    $('playQuestionText').textContent = q.text;
    const answered = state.answers.find(a => a.index === state.currentIndex);
    $('playOptions').innerHTML = q.options.map((opt) => {
      const chosen = answered && answered.chosen === opt;
      const correct = answered && q.answer === opt;
      const cls = answered ? (correct ? 'correct' : chosen ? 'wrong' : '') : '';
      return `<button type="button" class="play-option-btn ${cls}" data-option="${escapeHtml(opt)}" ${answered ? 'disabled' : ''}>${escapeHtml(opt)}</button>`;
    }).join('');
    $('playOptions').querySelectorAll('[data-option]').forEach(btn => btn.addEventListener('click', () => chooseAnswer(btn.dataset.option)));
    $('playNextBtn').disabled = !answered;
  }
  async function saveProgress(){
    if (!state) return;
    saveLocal();
    await request('?action=save-progress', {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ identity:state.identity, sessionId:state.sessionId, state:{ selectedCount:state.questions.length, selectedLevelLabel:'Mixed English', currentIndex:state.currentIndex, score:state.score, answers:state.answers, questions:state.questions.map(questionPayload), startedAt:state.startedAt, updatedAt:new Date().toISOString(), completed:false } })
    });
  }
  async function chooseAnswer(option){
    const q = state.questions[state.currentIndex];
    const correct = option === q.answer;
    state.answers.push({ index:state.currentIndex, questionText:q.text, chosen:option, correct, expected:q.answer, answeredAt:new Date().toISOString() });
    if (correct) state.score += 1;
    await saveProgress();
    renderQuestion();
  }
  function nextQuestion(){
    const answered = state.answers.find(a => a.index === state.currentIndex);
    if (!answered) return;
    state.currentIndex += 1;
    renderQuestion();
    saveProgress().catch(()=>{});
  }
  async function finishQuiz(){
    const percent = Math.round((state.score / state.questions.length) * 100);
    const result = await request('?action=submit', {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ identity:state.identity, sessionId:state.sessionId, result:{ quizLevel:'Mixed English', questionCount:state.questions.length, score:state.score, percent, strengths:[], weaknesses:[], advice:'Keep playing and improving every day.', remark:percent >= 90 ? 'Excellent' : percent >= 70 ? 'Very Good' : 'Keep Practicing', date:new Date().toLocaleDateString(), lang:'en', answers:state.answers, questions:state.questions.map(questionPayload) }, progress:{ selectedCount:state.questions.length, selectedLevelLabel:'Mixed English', currentIndex:state.questions.length, score:state.score, answers:state.answers, questions:state.questions.map(questionPayload), startedAt:state.startedAt, completed:true } })
    });
    showSection('playResultCard');
    $('playResultScore').textContent = `${percent}%`;
    $('playResultText').textContent = percent >= 90 ? 'Amazing! You are one of the stars of the challenge.' : percent >= 70 ? 'Great work! Play again to climb even higher.' : 'Nice try! Start another mixed quiz and beat your score.';
    renderLeaderboard(result.leaderboard || { top3:[], leaderboard:[] });
    state.completed = true;
    saveLocal();
  }
  async function startOrResume(){
    try {
      setStatus('Preparing your mixed quiz...');
      const identity = buildIdentity();
      const local = loadLocal();
      const startData = await request('?action=start', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ identity, sessionId: local && local.identity && local.identity.name === identity.name ? local.sessionId : '' }) });
      if (startData.progress && Array.isArray(startData.progress.questions) && startData.progress.questions.length) {
        state = {
          identity:startData.identity,
          sessionId:startData.sessionId,
          questions:startData.progress.questions,
          currentIndex:Number(startData.progress.currentIndex || 0) || 0,
          score:Number(startData.progress.score || 0) || 0,
          answers:Array.isArray(startData.progress.answers) ? startData.progress.answers : [],
          startedAt:startData.progress.startedAt || new Date().toISOString(),
          completed:false
        };
        setStatus('Resuming your last mixed quiz.');
      } else {
        state = {
          identity:startData.identity,
          sessionId:startData.sessionId,
          questions:(window.PlayQuestionBank && window.PlayQuestionBank.createMixedQuiz ? window.PlayQuestionBank.createMixedQuiz(QUESTION_COUNT) : []),
          currentIndex:0,
          score:0,
          answers:[],
          startedAt:new Date().toISOString(),
          completed:false
        };
        await saveProgress();
        setStatus('New mixed quiz ready. Good luck!');
      }
      renderQuestion();
    } catch (error) {
      setStatus(error.message || 'Could not start the quiz.');
    }
  }
  document.addEventListener('DOMContentLoaded', function(){
    if (document.body.dataset.page !== 'playtest') return;
    loadLeaderboard().catch((error)=> setStatus(error.message || 'Could not load leaderboard.'));
    $('playStartBtn')?.addEventListener('click', startOrResume);
    $('playNextBtn')?.addEventListener('click', nextQuestion);
    $('playAgainBtn')?.addEventListener('click', function(){
      if ($('playStudentName') && state && state.identity) $('playStudentName').value = state.identity.name || '';
      if ($('playStudentId') && state && state.identity) $('playStudentId').value = state.identity.studentId || '';
      localStorage.removeItem(STORAGE_KEY);
      state = null;
      showSection('playStartCard');
      setStatus('Start a new mixed quiz to get a fresh set of questions.');
    });
    $('refreshPlayLeadersBtn')?.addEventListener('click', ()=> loadLeaderboard().catch(()=>{}));
  });
})();
