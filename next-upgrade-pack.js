(function(){
  const PAGE = document.body?.dataset?.page || '';
  const ADV_KEY = 'kgQuizAdvancedConfigsV1';
  const CUSTOM_Q_KEYS = ['kgEnglishCustomQuestionsV23','kgEnglishCustomQuestionsV23'];
  function readJson(key, fallback){ try { return JSON.parse(localStorage.getItem(key) || 'null') ?? fallback; } catch(e){ return fallback; } }
  function writeJson(key, value){ try { localStorage.setItem(key, JSON.stringify(value)); } catch(e){} return value; }
  function esc(v){ return String(v == null ? '' : v).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }
  function text(en, ar){ return (document.body?.dataset?.lang || 'en') === 'ar' ? ar : en; }
  function slug(v){ return String(v||'').trim().toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,''); }
  function builtinGrades(){ return ['kg1','kg2','grade1','grade2','grade3','grade4','grade5','grade6']; }
  function customClasses(){ return (typeof window.getCustomClasses === 'function' ? window.getCustomClasses() : []).filter(Boolean); }
  function allGradeKeys(){ return builtinGrades().concat(customClasses().map(c => String(c.key || '').trim().toLowerCase()).filter(Boolean)); }
  function gradeLabel(key){
    const k = String(key || '').trim().toLowerCase();
    const map = {kg1:'KG1',kg2:'KG2',grade1:'Grade 1',grade2:'Grade 2',grade3:'Grade 3',grade4:'Grade 4',grade5:'Grade 5',grade6:'Grade 6'};
    if (map[k]) return map[k];
    const cls = customClasses().find(c => String(c.key || '').trim().toLowerCase() === k);
    return cls?.name || k.replace(/-/g,' ').replace(/\b\w/g, m => m.toUpperCase());
  }
  function getAdvanced(){ return readJson(ADV_KEY, {}); }
  function setAdvanced(v){ return writeJson(ADV_KEY, v); }
  function ensureStyles(){
    if (document.getElementById('next-upgrade-style')) return;
    const style = document.createElement('style');
    style.id = 'next-upgrade-style';
    style.textContent = `
      .upgrade-status-note{margin-top:10px;padding:10px 12px;border-radius:14px;background:#f7fbff;border:1px solid rgba(53,91,140,.14);color:#355b8c;font-weight:700}
      .upgrade-status-note[data-state="error"]{background:#fff5f5;border-color:rgba(207,63,63,.18);color:#c23c3c}
      .upgrade-status-note[data-state="success"]{background:#effbf1;border-color:rgba(31,143,77,.18);color:#1f8f4d}
      .upgrade-bulk-row{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px}
      .upgrade-bulk-row .ghost-btn{border-radius:999px}
      .question-ops-bar{display:flex;gap:10px;flex-wrap:wrap;align-items:center;margin:12px 0 8px}
      .question-ops-bar .ghost-btn{border-radius:999px}
      .question-ops-chip{display:inline-flex;align-items:center;padding:8px 12px;border-radius:999px;background:#f5f7fb;color:#486484;font-weight:700}
      .teacher-summary-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:10px;margin-top:12px}
      .teacher-summary-card{padding:12px;border:1px solid rgba(0,0,0,.08);border-radius:14px;background:#fff}
      .teacher-summary-card strong{display:block;font-size:1.15rem}
    `;
    document.head.appendChild(style);
  }
  function setStatus(el, message, state){
    if (!el) return;
    el.textContent = message || '';
    if (state) el.dataset.state = state; else el.removeAttribute('data-state');
  }
  function getQuestionPool(grade){
    if (typeof window.sanitizedPool === 'function') return window.sanitizedPool(grade) || [];
    if (typeof window.collectQuestionsWithMeta === 'function') return window.collectQuestionsWithMeta(grade) || [];
    return [];
  }
  function currentTeacherGrade(){ return String(document.getElementById('testGrade')?.value || '').trim().toLowerCase(); }
  function getTeacherStatusNote(){
    let note = document.getElementById('teacherUpgradeStatus');
    if (!note && document.getElementById('teacherAdvancedBox')){
      note = document.createElement('div');
      note.id = 'teacherUpgradeStatus';
      note.className = 'upgrade-status-note';
      document.getElementById('teacherAdvancedBox').appendChild(note);
    }
    return note;
  }
  function getQuestionStatusNote(){
    let note = document.getElementById('questionUpgradeStatus');
    if (!note){
      const host = document.getElementById('questionBankEditorBody');
      if (!host) return null;
      note = document.createElement('div');
      note.id = 'questionUpgradeStatus';
      note.className = 'upgrade-status-note';
      const target = document.getElementById('storedQuestionsWrap') || host;
      host.insertBefore(note, target);
    }
    return note;
  }
  function validateTeacherForm(){
    const grade = currentTeacherGrade();
    const mode = String(document.getElementById('testMode')?.value || 'random');
    const count = Math.max(1, Number(document.getElementById('testCount')?.value || 0) || 0);
    const lines = (document.getElementById('testQuestionList')?.value || '').split(/\n+/).map(v => v.trim()).filter(Boolean);
    const pool = getQuestionPool(grade);
    const adv = getAdvanced()[grade] || {};
    const openMs = adv.openAt ? Date.parse(adv.openAt) : NaN;
    const closeMs = adv.closeAt ? Date.parse(adv.closeAt) : NaN;
    if (!grade) return {ok:false, message:text('Choose a grade before saving the teacher quiz.','اختر الصف قبل حفظ اختبار المعلم.')};
    if (!document.getElementById('testName')?.value?.trim()) return {ok:false, message:text('Enter a test name before saving.','أدخل اسم الاختبار قبل الحفظ.')};
    if (!Number.isNaN(openMs) && !Number.isNaN(closeMs) && closeMs <= openMs) return {ok:false, message:text('Close time must be after open time.','وقت الإغلاق يجب أن يكون بعد وقت الفتح.')};
    if (mode === 'random' && pool.length < count) return {ok:false, message:text('Not enough questions in this grade for the requested random count.','لا توجد أسئلة كافية في هذا الصف لعدد الأسئلة العشوائي المطلوب.')};
    if ((mode === 'manual' || mode === 'select') && !lines.length) return {ok:false, message:text('Choose at least one question for manual/select mode.','اختر سؤالًا واحدًا على الأقل في الوضع اليدوي أو الاختيار.')};
    if ((mode === 'manual' || mode === 'select') && count > lines.length) return {ok:false, message:text('Question count cannot be larger than the selected question list.','عدد الأسئلة لا يمكن أن يكون أكبر من قائمة الأسئلة المختارة.')};
    return {ok:true, message:text('Teacher quiz is ready to save.','اختبار المعلم جاهز للحفظ.')};
  }
  function renderTeacherSummary(){
    const box = document.getElementById('teacherAdvancedBox');
    if (!box) return;
    let summary = document.getElementById('teacherSummaryGrid');
    if (!summary){
      summary = document.createElement('div');
      summary.id = 'teacherSummaryGrid';
      summary.className = 'teacher-summary-grid';
      box.insertBefore(summary, document.getElementById('teacherUpgradeStatus') || null);
    }
    const grade = currentTeacherGrade();
    const mode = String(document.getElementById('testMode')?.value || 'random');
    const count = Math.max(0, Number(document.getElementById('testCount')?.value || 0) || 0);
    const lines = (document.getElementById('testQuestionList')?.value || '').split(/\n+/).map(v => v.trim()).filter(Boolean);
    const poolCount = getQuestionPool(grade).length;
    summary.innerHTML = `
      <div class="teacher-summary-card"><small>${esc(text('Grade','الصف'))}</small><strong>${esc(gradeLabel(grade || ''))}</strong></div>
      <div class="teacher-summary-card"><small>${esc(text('Available questions','الأسئلة المتاحة'))}</small><strong>${poolCount}</strong></div>
      <div class="teacher-summary-card"><small>${esc(text('Mode','الوضع'))}</small><strong>${esc(mode.toUpperCase())}</strong></div>
      <div class="teacher-summary-card"><small>${esc(text('Selected count','العدد المختار'))}</small><strong>${mode === 'random' ? count : lines.length}</strong></div>`;
  }
  function wireTeacherValidation(){
    if (PAGE !== 'admin') return;
    const saveBtn = document.getElementById('saveTeacherTestBtn');
    if (!saveBtn || saveBtn.dataset.nextUpgradeWrapped === '1') return;
    saveBtn.dataset.nextUpgradeWrapped = '1';
    const clone = saveBtn.cloneNode(true);
    saveBtn.parentNode.replaceChild(clone, saveBtn);
    clone.addEventListener('click', function(e){
      e.preventDefault();
      const note = getTeacherStatusNote();
      const check = validateTeacherForm();
      renderTeacherSummary();
      if (!check.ok){ setStatus(note, check.message, 'error'); return; }
      if (typeof window.saveTeacherTestFromAdmin === 'function') window.saveTeacherTestFromAdmin();
      setTimeout(() => setStatus(note, text('Teacher quiz saved successfully.','تم حفظ اختبار المعلم بنجاح.'), 'success'), 40);
    });
    ['testGrade','testName','testMode','testCount','testQuestionList','advTeacherOpenAt','advTeacherCloseAt'].forEach(id => {
      const el = document.getElementById(id);
      if (el && el.dataset.nextUpgradeWatch !== '1'){
        el.dataset.nextUpgradeWatch = '1';
        const handler = () => { renderTeacherSummary(); const check = validateTeacherForm(); setStatus(getTeacherStatusNote(), check.message, check.ok ? '' : 'error'); };
        el.addEventListener('input', handler);
        el.addEventListener('change', handler);
      }
    });
    renderTeacherSummary();
    const first = validateTeacherForm();
    setStatus(getTeacherStatusNote(), first.message, first.ok ? '' : 'error');
  }
  function ensureBulkStatusButtons(){
    if (PAGE !== 'admin') return;
    const box = document.getElementById('teacherAdvancedBox');
    if (!box || document.getElementById('bulkStatusRow')) return;
    const row = document.createElement('div');
    row.id = 'bulkStatusRow';
    row.className = 'upgrade-bulk-row';
    row.innerHTML = `
      <button class="ghost-btn" type="button" data-bulk-status="visible">${esc(text('Set all quizzes VISIBLE','جعل كل الاختبارات ظاهرة'))}</button>
      <button class="ghost-btn" type="button" data-bulk-status="hidden">${esc(text('Set all quizzes HIDDEN','جعل كل الاختبارات مخفية'))}</button>
      <button class="ghost-btn" type="button" data-bulk-status="frozen">${esc(text('Set all quizzes FROZEN','جعل كل الاختبارات مجمدة'))}</button>`;
    box.appendChild(row);
    row.querySelectorAll('[data-bulk-status]').forEach(btn => btn.addEventListener('click', function(){
      const status = String(btn.dataset.bulkStatus || 'visible');
      const all = getAdvanced();
      allGradeKeys().forEach(key => { all[key] = Object.assign({}, all[key] || {}, { status }); });
      setAdvanced(all);
      setStatus(getTeacherStatusNote(), text('Bulk quiz status updated for all grades and classes.','تم تحديث حالة كل الاختبارات لكل الصفوف والفصول.'), 'success');
      if (typeof document.getElementById('saveTeacherAdvancedBtn')?.click === 'function') {
        try { renderTeacherSummary(); } catch(e){}
      }
    }));
  }
  function persistCustomQuestions(map){
    CUSTOM_Q_KEYS.forEach(key => writeJson(key, map));
  }
  function normalizeQuestionType(value){
    const raw = String(value || 'Choice').trim();
    return raw || 'Choice';
  }
  function wireQuestionValidation(){
    if (PAGE !== 'admin') return;
    const addBtn = document.getElementById('addQuestionBtn');
    if (!addBtn || addBtn.dataset.nextUpgradeWrapped === '1') return;
    addBtn.dataset.nextUpgradeWrapped = '1';
    const clone = addBtn.cloneNode(true);
    addBtn.parentNode.replaceChild(clone, addBtn);
    clone.addEventListener('click', function(e){
      e.preventDefault();
      const note = getQuestionStatusNote();
      const grade = String(document.getElementById('newQGrade')?.value || '').trim().toLowerCase();
      const skill = String(document.getElementById('newQSkill')?.value || '').trim() || 'Vocabulary';
      const type = normalizeQuestionType(document.getElementById('newQType')?.value);
      const textValue = String(document.getElementById('newQText')?.value || '').trim();
      const options = String(document.getElementById('newQOptions')?.value || '').split('|').map(v => v.trim()).filter(Boolean);
      const answer = String(document.getElementById('newQAnswer')?.value || '').trim();
      const difficulty = Math.max(1, Math.min(3, Number(document.getElementById('newQDifficulty')?.value || 1) || 1));
      const image = String(document.getElementById('newQImage')?.value || '').trim() || document.getElementById('newQImageFile')?.dataset?.savedImage || null;
      const allowed = new Set(allGradeKeys());
      if (!grade || !allowed.has(grade)) { setStatus(note, text('Choose a valid grade or class before adding the question.','اختر صفًا أو فصلًا صحيحًا قبل إضافة السؤال.'), 'error'); return; }
      if (!textValue || !answer) { setStatus(note, text('Question text and correct answer are required.','نص السؤال والإجابة الصحيحة مطلوبان.'), 'error'); return; }
      if (/choice/i.test(type) && !options.length) { setStatus(note, text('Choice questions need options separated by |.','أسئلة الاختيار تحتاج خيارات مفصولة بـ |.'), 'error'); return; }
      const finalOptions = options.slice();
      if (/choice/i.test(type) && answer && !finalOptions.some(v => v.toLowerCase() === answer.toLowerCase())) finalOptions.push(answer);
      const map = (typeof window.getCustomQuestions === 'function' ? window.getCustomQuestions() : {}) || {};
      if (!Array.isArray(map[grade])) map[grade] = [];
      const duplicate = map[grade].find(q => String(q?.text || '').trim().toLowerCase() === textValue.toLowerCase());
      if (duplicate) { setStatus(note, text('A question with the same text already exists in this grade/class.','يوجد سؤال بنفس النص بالفعل داخل هذا الصف أو الفصل.'), 'error'); return; }
      map[grade].push({ grade: gradeLabel(grade), skill, type, text: textValue, options: finalOptions, answer, image, difficulty });
      persistCustomQuestions(map);
      ['newQGrade','newQSkill','newQType','newQText','newQOptions','newQAnswer','newQDifficulty','newQImage'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
      const fileEl = document.getElementById('newQImageFile');
      if (fileEl){ fileEl.value = ''; fileEl.dataset.savedImage = ''; }
      if (typeof window.renderStoredQuestions === 'function') window.renderStoredQuestions();
      setStatus(note, text('Question added and validated successfully.','تمت إضافة السؤال والتحقق منه بنجاح.'), 'success');
    });
    const summaryBar = document.createElement('div');
    summaryBar.id = 'questionOpsBar';
    summaryBar.className = 'question-ops-bar';
    summaryBar.innerHTML = `<span class="question-ops-chip" id="questionOpsChip">${esc(text('Question bank filters ready.','فلاتر بنك الأسئلة جاهزة.'))}</span>`;
    const host = document.querySelector('#questionBankEditorBody .toolbar');
    if (host && !document.getElementById('questionOpsBar')) host.parentNode.insertBefore(summaryBar, host.nextSibling);
  }
  function updateQuestionSearchSummary(){
    if (PAGE !== 'admin') return;
    const list = document.getElementById('storedQuestionsList');
    const chip = document.getElementById('questionOpsChip');
    const status = document.getElementById('questionSearchStatus');
    if (!list || !chip || !status) return;
    const visible = Array.from(list.querySelectorAll('.question-edit-card')).filter(card => card.style.display !== 'none').length;
    const total = list.querySelectorAll('.question-edit-card').length;
    const filters = [];
    const grade = String(document.querySelector('[data-filter-grade].active')?.dataset?.filterGrade || 'all');
    const q = String(document.getElementById('qSearchInput')?.value || '').trim();
    const skill = String(document.getElementById('qSkillFilterInput')?.value || '').trim();
    const className = String(document.getElementById('qClassFilterInput')?.value || '').trim();
    if (grade && grade.toLowerCase() !== 'all') filters.push(grade);
    if (q) filters.push(text('text','النص') + ': ' + q);
    if (skill) filters.push(text('skill','المهارة') + ': ' + skill);
    if (className) filters.push(text('class','الفصل') + ': ' + className);
    chip.textContent = filters.length ? filters.join(' • ') : text('Showing all questions.','عرض كل الأسئلة.');
    status.textContent = visible + ' / ' + total + ' ' + text('questions shown.','سؤال ظاهر.');
  }
  function wireQuestionSummaryObservers(){
    if (PAGE !== 'admin') return;
    const observerTarget = document.getElementById('storedQuestionsList');
    if (observerTarget && !observerTarget.dataset.nextUpgradeObserved){
      observerTarget.dataset.nextUpgradeObserved = '1';
      const obs = new MutationObserver(() => setTimeout(updateQuestionSearchSummary, 20));
      obs.observe(observerTarget, { childList:true, subtree:true, attributes:true, attributeFilter:['style','class'] });
    }
    document.querySelectorAll('[data-filter-grade], #qSearchInput, #qSkillFilterInput, #qClassFilterInput, #runQuestionSearchBtn, #clearQuestionSearchBtn, #showStoredQuestionsBtn').forEach(el => {
      if (el && el.dataset.nextUpgradeWatch !== '1'){
        el.dataset.nextUpgradeWatch = '1';
        el.addEventListener('click', () => setTimeout(updateQuestionSearchSummary, 20));
        el.addEventListener('input', () => setTimeout(updateQuestionSearchSummary, 20));
        el.addEventListener('change', () => setTimeout(updateQuestionSearchSummary, 20));
      }
    });
    setTimeout(updateQuestionSearchSummary, 80);
  }
  function init(){
    ensureStyles();
    if (PAGE === 'admin'){
      wireTeacherValidation();
      ensureBulkStatusButtons();
      wireQuestionValidation();
      wireQuestionSummaryObservers();
    }
  }
  window.addEventListener('load', () => setTimeout(init, 320));
})();
