(function(){
  if (typeof document === 'undefined' || !document.body || document.body.dataset.page !== 'admin') return;
  const API = '/api/homework';
  const $ = (id) => document.getElementById(id);
  const esc = (v) => String(v || '').replace(/[&<>"']/g, (ch) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  async function api(path = '', options){
    const res = await fetch(API + path, Object.assign({ headers:{ 'Content-Type':'application/json' } }, options || {}));
    const data = await res.json().catch(()=>({ ok:false, error:'Request failed' }));
    if (!res.ok || !data.ok) throw new Error(data.error || 'Request failed');
    return data;
  }
  function allQuestionsForGrade(grade){
    try { return typeof allQuestionsFor === 'function' ? allQuestionsFor(String(grade || '').toLowerCase()) : []; } catch (e) { return []; }
  }
  function renderPicker(){
    const list = $('homeworkQuestionPickerList');
    if (!list) return;
    const grade = $('homeworkGrade')?.value || 'KG1';
    const rows = allQuestionsForGrade(grade).slice(0, 300);
    list.innerHTML = rows.map((q, i) => `<label class="teacher-picker-item"><input type="checkbox" class="homework-question-check" value="${i}"><span><strong>${esc(q.skill || 'Question')}</strong><br>${esc(q.text || '')}</span></label>`).join('') || '<div class="muted-note">No questions found for this grade.</div>';
  }
  function selectedQuestions(){
    const grade = $('homeworkGrade')?.value || 'KG1';
    const source = allQuestionsForGrade(grade);
    return [...document.querySelectorAll('.homework-question-check:checked')].map((el) => source[Number(el.value)]).filter(Boolean).map((q) => ({ text:q.text, options:[...(q.options||[])], answer:q.answer, skill:q.skill || '', type:q.type || 'Question', image:q.image || null }));
  }
  function parseManualQuestions(){
    return String($('homeworkQuestionList')?.value || '').split(/\n+/).map((line) => line.trim()).filter(Boolean).map((line) => {
      const parts = line.split('|').map((p) => p.trim()).filter(Boolean);
      if (parts.length < 6) return null;
      return { text:parts[0], options:parts.slice(1, 5), answer:parts[5], skill:'Homework', type:'Question', image:null };
    }).filter(Boolean);
  }
  function formData(){
    const classes = String($('homeworkClasses')?.value || '').split(',').map((v) => v.trim()).filter(Boolean);
    const useTimer = !!$('homeworkTimerToggle')?.checked;
    const usePassword = !!$('homeworkPasswordToggle')?.checked;
    const mode = $('homeworkMode')?.value || 'select';
    const questions = mode === 'manual' ? parseManualQuestions() : selectedQuestions();
    return {
      id: 'HW-' + Date.now(),
      title: String($('homeworkTitle')?.value || '').trim(),
      grade: String($('homeworkGrade')?.value || 'KG1').trim(),
      classes,
      date: String($('homeworkDate')?.value || '').trim(),
      mode,
      questions,
      useTimer,
      timerMinutes: useTimer ? Math.max(1, Number($('homeworkTimerMinutes')?.value || 0) || 0) : 0,
      usePassword,
      password: usePassword ? String($('homeworkPassword')?.value || '').trim() : '',
      tryLimit: Math.max(0, Math.min(5, Number($('homeworkTryLimit')?.value || 0) || 0)),
      createdAt: new Date().toISOString()
    };
  }
  async function renderList(){
    const wrap = $('homeworkAdminList');
    if (!wrap) return;
    try {
      const rows = ((await api()).rows || []).sort((a,b) => String(b.createdAt||'').localeCompare(String(a.createdAt||'')));
      wrap.innerHTML = rows.map((row) => `<div class="stored-question"><h4>${esc(row.title || 'Homework')}</h4><p><strong>Grade:</strong> ${esc(row.grade)}</p><p><strong>Classes:</strong> ${esc((row.classes || []).join(', ') || 'All')}</p><p><strong>Date:</strong> ${esc(row.date || '-')}</p><p><strong>Questions:</strong> ${esc(String((row.questions || []).length))}</p><p><strong>Timer:</strong> ${row.useTimer ? esc(String(row.timerMinutes) + ' min') : 'No'}</p><p><strong>Password:</strong> ${row.usePassword ? 'Yes' : 'No'}</p><p><strong>Tries:</strong> ${esc(String(row.tryLimit))}</p><div class="action-row wrap-row"><button class="ghost-btn small-btn homework-delete-btn" data-id="${esc(row.id)}" type="button">Delete</button></div></div>`).join('') || '<div class="muted-note">No homework saved yet.</div>';
    } catch (error) {
      wrap.innerHTML = `<div class="muted-note">${esc(error.message || 'Could not load homework.')}</div>`;
    }
  }
  function saveHomework(){
    const data = formData();
    if (!data.title) return $('homeworkAdminStatus').textContent = 'Please enter homework title.';
    if (!data.date) return $('homeworkAdminStatus').textContent = 'Please choose the date.';
    if (!data.questions.length) return $('homeworkAdminStatus').textContent = 'Please add questions first.';
    api('', { method:'POST', body: JSON.stringify(data) }).then(() => {
      $('homeworkAdminStatus').textContent = 'Homework saved.';
      renderList();
    }).catch((error) => {
      $('homeworkAdminStatus').textContent = error.message || 'Could not save homework.';
    });
  }
  function clearForm(){
    ['homeworkTitle','homeworkClasses','homeworkDate','homeworkQuestionList','homeworkTimerMinutes','homeworkPassword'].forEach((id)=>{ if ($(id)) $(id).value=''; });
    ['homeworkTimerToggle','homeworkPasswordToggle'].forEach((id)=>{ if ($(id)) $(id).checked=false; });
    if ($('homeworkTryLimit')) $('homeworkTryLimit').value='0';
    document.querySelectorAll('.homework-question-check').forEach((el)=>{ el.checked=false; });
    $('homeworkAdminStatus').textContent='';
  }
  function wire(){
    $('homeworkGrade')?.addEventListener('change', renderPicker);
    $('homeworkMode')?.addEventListener('change', function(){ const manual = this.value === 'manual'; $('homeworkQuestionList').classList.toggle('hidden', !manual); $('homeworkQuestionPickerWrap').classList.toggle('hidden', manual); });
    $('selectAllHomeworkQuestionsBtn')?.addEventListener('click', ()=> document.querySelectorAll('.homework-question-check').forEach((el)=>{ el.checked=true; }));
    $('clearHomeworkQuestionsBtn')?.addEventListener('click', ()=> document.querySelectorAll('.homework-question-check').forEach((el)=>{ el.checked=false; }));
    $('saveHomeworkBtn')?.addEventListener('click', saveHomework);
    $('clearHomeworkBtn')?.addEventListener('click', clearForm);
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('.homework-delete-btn');
      if (!btn) return;
      api('', { method:'DELETE', body: JSON.stringify({ id: btn.dataset.id }) }).then(() => renderList()).catch((error) => { $('homeworkAdminStatus').textContent = error.message || 'Could not delete homework.'; });
    });
  }
  renderPicker();
  renderList();
  wire();
})();
