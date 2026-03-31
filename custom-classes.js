
(function(){
  const KEY_CLASSES = 'kgEnglishCustomClassesV29';
  const KEY_CUSTOM_Q = 'kgEnglishCustomQuestionsV7';
  const KEY_LEVEL_VIS = 'kgEnglishLevelVisibilityV7';
  const KEY_TIMER = 'kgEnglishTimerSettingsV23';
  const KEY_ACCESS = 'kgEnglishQuizAccessV23';
  const KEY_TESTS = 'kgEnglishTeacherTestsV23';

  const txt = {
    en: {
      classTitle: 'Class Manager',
      classSaved: 'Class saved.',
      classDeleted: 'Class deleted.',
      classNameRequired: 'Please enter the class name.',
      chooseSource: 'Choose questions or upload a file for the class.',
      noClassQuestions: 'No questions selected yet.',
      useExisting: 'Use existing questions',
      uploadFile: 'Upload question file',
      startClass: 'Start',
      customClassTitle: 'Class Quiz',
      customClassSubtitle: 'Custom class questions selected by the teacher.',
      customClassBadge: 'Custom Class',
      deleteClass: 'Delete Class',
      existingQuestions: 'Use existing questions',
      uploadQuestions: 'Upload question file',
      selectedQuestions: 'selected questions',
      uploadAdded: 'questions were imported for the class.',
    },
    ar: {
      classTitle: 'إدارة الصفوف',
      classSaved: 'تم حفظ الصف.',
      classDeleted: 'تم حذف الصف.',
      classNameRequired: 'من فضلك أدخل اسم الصف.',
      chooseSource: 'اختر أسئلة أو ارفع ملفًا لهذا الصف.',
      noClassQuestions: 'لا توجد أسئلة مختارة بعد.',
      useExisting: 'استخدام الأسئلة الموجودة',
      uploadFile: 'رفع ملف أسئلة',
      startClass: 'ابدأ',
      customClassTitle: 'اختبار الصف',
      customClassSubtitle: 'أسئلة صف مخصص اختارها المعلم.',
      customClassBadge: 'صف مخصص',
      deleteClass: 'حذف الصف',
      existingQuestions: 'استخدام الأسئلة الموجودة',
      uploadQuestions: 'رفع ملف أسئلة',
      selectedQuestions: 'سؤالًا محددًا',
      uploadAdded: 'تم استيراد أسئلة للصف.',
    }
  };

  function lang(){ return (localStorage.getItem('kgAppLang') || 'en') === 'ar' ? 'ar' : 'en'; }
  function T(key){ return (txt[lang()] && txt[lang()][key]) || (txt.en && txt.en[key]) || key; }
  function readJson(key, fallback){
    try{ const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : fallback; } catch(e){ return fallback; }
  }
  function writeJson(key, value){ localStorage.setItem(key, JSON.stringify(value)); }
  function slugify(name){
    return String(name || '').trim().toLowerCase().replace(/[^a-z0-9\u0600-\u06FF]+/g, '-').replace(/^-+|-+$/g, '') || 'class';
  }
  function getCustomClasses(){ return readJson(KEY_CLASSES, []); }
  function setCustomClasses(v){ writeJson(KEY_CLASSES, v); }
  function getCustomQuestions(){ return readJson(KEY_CUSTOM_Q, {}); }
  function setCustomQuestions(v){ writeJson(KEY_CUSTOM_Q, v); }

  // Upgrade earlier fixed-schema stores to allow any grade
  const _oldGetLevelVisibility = window.getLevelVisibility;
  window.getLevelVisibility = function(){
    const base = (_oldGetLevelVisibility ? _oldGetLevelVisibility() : readJson(KEY_LEVEL_VIS, {kg1:[10,20,30,40,50], kg2:[10,20,30,40,50]})) || {};
    getCustomClasses().forEach(c => { if (!Array.isArray(base[c.key])) base[c.key] = [10,20,30,40,50]; });
    return base;
  };
  window.setLevelVisibility = function(v){ writeJson(KEY_LEVEL_VIS, v); };

  const _oldGetTimer = window.getTimerSettings;
  window.getTimerSettings = function(){
    const base = (_oldGetTimer ? _oldGetTimer() : readJson(KEY_TIMER, {kg1:true, kg2:true})) || {};
    getCustomClasses().forEach(c => { if (typeof base[c.key] !== 'boolean') base[c.key] = true; });
    return base;
  };
  window.setTimerSettings = function(v){ writeJson(KEY_TIMER, v); };

  const _oldGetAccess = window.getQuizAccess;
  window.getQuizAccess = function(){
    const base = (_oldGetAccess ? _oldGetAccess() : readJson(KEY_ACCESS, {kg1:{enabled:false,password:''}, kg2:{enabled:false,password:''}})) || {};
    getCustomClasses().forEach(c => { if (!base[c.key]) base[c.key] = {enabled:false,password:''}; });
    return base;
  };
  window.setQuizAccess = function(v){ writeJson(KEY_ACCESS, v); };

  const _oldGetTests = window.getTeacherTests;
  window.getTeacherTests = function(){
    const base = (_oldGetTests ? _oldGetTests() : readJson(KEY_TESTS, {kg1:null, kg2:null})) || {};
    getCustomClasses().forEach(c => { if (!(c.key in base)) base[c.key] = null; });
    return base;
  };
  window.setTeacherTests = function(v){ writeJson(KEY_TESTS, v); };

  // Expand custom questions beyond kg1/kg2
  window.getCustomQuestions = function(){
    const obj = readJson(KEY_CUSTOM_Q, {});
    if (!obj.kg1) obj.kg1 = [];
    if (!obj.kg2) obj.kg2 = [];
    getCustomClasses().forEach(c => { if (!Array.isArray(obj[c.key])) obj[c.key] = []; });
    return obj;
  };

  function allGradeKeys(){
    return ['kg1','kg2'].concat(getCustomClasses().map(c => c.key));
  }
  function classMeta(key){
    return getCustomClasses().find(c => c.key === key);
  }

  function allAvailableQuestions(){
    let list = [];
    try{
      allGradeKeys().forEach(g => {
        if (typeof window.allQuestionsFor === 'function'){
          (window.allQuestionsFor(g) || []).forEach(q => list.push({...q, __grade:g}));
        }
      });
    }catch(e){}
    return list;
  }

  function ensureTeacherGradeSelect(){
    const adminPage = document.body.dataset.page === 'admin';
    if (!adminPage) return;
    const old = document.getElementById('testGrade');
    if (!old) return;
    if (old.tagName.toLowerCase() === 'select' && old.dataset.classEnhanced === '1'){
      refreshTeacherGradeOptions(old);
      return;
    }
    const sel = document.createElement('select');
    sel.id = 'testGrade';
    sel.dataset.classEnhanced = '1';
    sel.className = old.className || '';
    old.parentNode.replaceChild(sel, old);
    refreshTeacherGradeOptions(sel);
    sel.addEventListener('change', ()=>{
      if (typeof window.renderTeacherTestEditor === 'function') window.renderTeacherTestEditor();
      renderTeacherQuestionPickerForClasses();
    });
  }

  function refreshTeacherGradeOptions(sel){
    const current = sel.value || 'KG1';
    sel.innerHTML = '';
    allGradeKeys().forEach(g => {
      const opt = document.createElement('option');
      opt.value = g.toUpperCase();
      opt.textContent = (g === 'kg1' || g === 'kg2') ? g.toUpperCase() : (classMeta(g)?.name || g.toUpperCase());
      sel.appendChild(opt);
    });
    if ([...sel.options].some(o => o.value === current)) sel.value = current;
  }

  function renderHomeCustomClasses(){
    if (document.body.dataset.page !== 'home') return;
    const grid = document.getElementById('homeLevelsGrid');
    if (!grid) return;
    grid.querySelectorAll('.custom-class-card').forEach(el => el.remove());
    getCustomClasses().filter(cls => !cls.hidden).forEach(cls => {
      const a = document.createElement('a');
      a.className = 'level-card custom-class-card';
      a.href = `class.html?grade=${encodeURIComponent(cls.key)}`;
      a.innerHTML = `
        <img src="${cls.image || 'school.svg'}" alt="${escapeHtml(cls.name)}">
        <h3>${escapeHtml(cls.name)}</h3>
        <p>${escapeHtml(cls.description || T('customClassSubtitle'))}</p>
        <span class="main-btn alt">${T('startClass')} ${escapeHtml(cls.name)}</span>
      `;
      grid.appendChild(a);
    });
  }

  function renderClassPageMeta(){
    if (document.body.dataset.page !== 'quiz') return;
    const params = new URLSearchParams(location.search);
    const grade = (params.get('grade') || '').trim().toLowerCase();
    if (!grade || grade === 'kg1' || grade === 'kg2') return;
    document.body.dataset.grade = grade;
    const meta = classMeta(grade);
    const badge = document.querySelector('[data-i18n="customClassBadge"]') || document.querySelector('.badge-pill');
    const title = document.querySelector('[data-i18n="customClassTitle"]') || document.querySelector('h1');
    const subtitle = document.querySelector('[data-i18n="customClassSubtitle"]') || document.querySelector('p');
    if (badge) badge.textContent = meta?.name || T('customClassBadge');
    if (title) title.textContent = meta?.name || T('customClassTitle');
    if (subtitle) subtitle.textContent = meta?.description || T('customClassSubtitle');
    document.title = `${meta?.name || T('customClassTitle')}`;
    if (typeof window.initQuiz === 'function') window.initQuiz();
  }

  function escapeHtml(s){
    return String(s || '').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  }

  function renderClassQuestionPicker(){
    const wrap = document.getElementById('classExistingWrap');
    const list = document.getElementById('classQuestionPickerList');
    const mode = document.getElementById('classSourceMode');
    const uploadWrap = document.getElementById('classUploadWrap');
    if (!wrap || !list || !mode || !uploadWrap) return;
    const useExisting = mode.value === 'existing';
    wrap.classList.toggle('hidden', !useExisting);
    uploadWrap.classList.toggle('hidden', useExisting);
    if (!useExisting) return;
    const pool = allAvailableQuestions();
    list.innerHTML = pool.length ? pool.map((q, idx) => `
      <label class="teacher-question-row">
        <input type="checkbox" class="class-question-check" data-grade="${escapeHtml(q.__grade)}" data-question-text="${escapeHtml(q.text)}">
        <span>
          <strong>${idx+1}. ${escapeHtml(q.text)}</strong>
          <span class="teacher-question-meta">${escapeHtml((q.grade || q.__grade || '').toUpperCase())} • ${escapeHtml(q.skill || 'Skill')} • ${escapeHtml(q.answer || '')}</span>
        </span>
      </label>
    `).join('') : `<div class="picker-empty">${T('noClassQuestions')}</div>`;
  }

  function selectAllClassQuestions(flag){
    document.querySelectorAll('.class-question-check').forEach(ch => ch.checked = !!flag);
  }

  function importWorkbookToClass(file, classKey){
    return new Promise((resolve, reject) => {
      if (typeof XLSX === 'undefined') {
        reject(new Error('xlsx'));
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        try{
          const wb = XLSX.read(e.target.result, {type:'binary'});
          const sheet = wb.Sheets[wb.SheetNames[0]];
          const rows = XLSX.utils.sheet_to_json(sheet, {defval:''});
          const all = getCustomQuestions();
          if (!Array.isArray(all[classKey])) all[classKey] = [];
          let added = 0;
          rows.forEach(r => {
            const text = String(r['Question'] || '').trim();
            const options = [r['Choice 1'], r['Choice 2'], r['Choice 3'], r['Choice 4']].map(v => String(v || '').trim()).filter(Boolean);
            const answer = String(r['Correct Answer'] || '').trim();
            if (!text || options.length < 2 || !answer || !options.includes(answer)) return;
            all[classKey].push({
              grade: (classMeta(classKey)?.name || classKey).toUpperCase(),
              text, options, answer,
              skill: String(r['Skill (optional)'] || 'Vocabulary').trim() || 'Vocabulary',
              type: String(r['Type (optional)'] || 'Choice').trim() || 'Choice',
              image: String(r['Image (optional)'] || '').trim() || null,
              difficulty: Math.max(1, Math.min(3, Number(r['Difficulty 1-3 (optional)'] || 1))),
              note: String(r['Note (optional)'] || '').trim() || ''
            });
            added += 1;
          });
          setCustomQuestions(all);
          resolve(added);
        }catch(err){ reject(err); }
      };
      reader.readAsBinaryString(file);
    });
  }

  function saveClassFromAdmin(){
    const nameEl = document.getElementById('classNameInput');
    const descEl = document.getElementById('classDescInput');
    const modeEl = document.getElementById('classSourceMode');
    const countEl = document.getElementById('classQuestionCount');
    if (!nameEl || !descEl || !modeEl) return;
    const name = nameEl.value.trim();
    if (!name){
      alert(T('classNameRequired'));
      return;
    }
    let key = slugify(name);
    let classes = getCustomClasses();
    const existing = classes.find(c => c.key === key || c.name.toLowerCase() === name.toLowerCase());
    if (existing) key = existing.key;
    const meta = existing || { key, name, description:'', image:'school.svg', questionCount:0 };
    meta.name = name;
    meta.description = descEl.value.trim();
    meta.questionCount = Number(countEl.value || 0) || 0;
    meta.hidden = !!document.getElementById('classHiddenToggle')?.checked;
    const mode = modeEl.value;
    const customQ = getCustomQuestions();
    const finalize = () => {
      const idx = classes.findIndex(c => c.key === key);
      if (idx >= 0) classes[idx] = meta; else classes.push(meta);
      setCustomClasses(classes);
      if (!Array.isArray(customQ[key])) customQ[key] = [];
      setCustomQuestions(customQ);
      renderCustomClassesAdmin();
      renderHomeCustomClasses();
      ensureTeacherGradeSelect();
      const hiddenEl=document.getElementById('classHiddenToggle'); if(hiddenEl) hiddenEl.checked=false; alert(T('classSaved'));
    };
    if (mode === 'existing'){
      const selectedTexts = Array.from(document.querySelectorAll('.class-question-check:checked')).map(ch => ({
        grade: ch.dataset.grade,
        text: ch.dataset.questionText
      }));
      if (!selectedTexts.length){
        alert(T('chooseSource'));
        return;
      }
      const allPool = allAvailableQuestions();
      customQ[key] = selectedTexts.map(sel => {
        const q = allPool.find(item => String(item.text).trim() === String(sel.text).trim() && item.__grade === sel.grade);
        if (!q) return null;
        const cloned = JSON.parse(JSON.stringify(q));
        delete cloned.__grade;
        cloned.grade = name.toUpperCase();
        return cloned;
      }).filter(Boolean);
      setCustomQuestions(customQ);
      finalize();
      return;
    }
    const file = document.getElementById('classQuestionUpload')?.files?.[0];
    if (!file){
      alert(T('chooseSource'));
      return;
    }
    importWorkbookToClass(file, key).then((added) => {
      const q = getCustomQuestions();
      if (Array.isArray(q[key])) q[key] = q[key].map(item => ({...item, grade: name.toUpperCase()}));
      setCustomQuestions(q);
      finalize();
    }).catch(() => {
      alert('Could not read the file.');
    });
  }

  function deleteClass(key){
    if (!confirm('Delete this class?')) return;
    const classes = getCustomClasses().filter(c => c.key !== key);
    setCustomClasses(classes);
    const customQ = getCustomQuestions();
    delete customQ[key];
    setCustomQuestions(customQ);
    const tests = window.getTeacherTests ? window.getTeacherTests() : readJson(KEY_TESTS,{});
    delete tests[key];
    window.setTeacherTests ? window.setTeacherTests(tests) : writeJson(KEY_TESTS, tests);
    renderCustomClassesAdmin();
    renderHomeCustomClasses();
    ensureTeacherGradeSelect();
    alert(T('classDeleted'));
  }

  function renderCustomClassesAdmin(){
    const list = document.getElementById('customClassesList');
    if (!list) return;
    const classes = getCustomClasses();
    list.innerHTML = classes.length ? classes.map(cls => {
      const qCount = (window.getCustomQuestions ? window.getCustomQuestions() : getCustomQuestions())[cls.key]?.length || 0;
      return `
        <div class="question-edit-card">
          <div class="class-manager-meta">
            <span class="class-chip"><strong>${escapeHtml(cls.name)}</strong></span>
            <span class="class-chip">${escapeHtml(cls.key)}</span>
            <span class="class-chip">${qCount} ${T('selectedQuestions')}</span>${cls.hidden ? '<span class="class-manager-hidden-badge">Hidden</span>' : ''}
          </div>
          <p>${escapeHtml(cls.description || '')}</p>
          <div class="question-edit-actions">
            <button class="ghost-btn delete-class-btn" data-class-key="${escapeHtml(cls.key)}">${T('deleteClass')}</button>
          </div>
        </div>
      `;
    }).join('') : `<div class="stored-question"><h4>${T('customClassBadge')}</h4><p>${T('noClassQuestions')}</p></div>`;
    list.querySelectorAll('.delete-class-btn').forEach(btn => btn.addEventListener('click', ()=>deleteClass(btn.dataset.classKey)));
  }

  function overrideTeacherTestFunctions(){
    window.renderTeacherTestEditor = function(){
      ensureTeacherGradeSelect();
      const tests = window.getTeacherTests ? window.getTeacherTests() : readJson(KEY_TESTS, {});
      const gradeEl = document.getElementById('testGrade');
      const nameEl = document.getElementById('testName');
      const modeEl = document.getElementById('testMode');
      const countEl = document.getElementById('testCount');
      const listEl = document.getElementById('testQuestionList');
      if (!gradeEl || !nameEl || !modeEl || !countEl || !listEl) return;
      const activeGrade = (gradeEl.value || 'KG1').trim().toLowerCase();
      const cfg = tests[activeGrade];
      if (cfg){
        gradeEl.value = activeGrade.toUpperCase();
        nameEl.value = cfg.name || '';
        if (![...modeEl.options].some(o=>o.value===cfg.mode)){
          const opt=document.createElement('option');
          opt.value='select';
          opt.textContent=txt[lang()].chooseExistingQuestions;
          modeEl.appendChild(opt);
        }
        modeEl.value = cfg.mode || 'random';
        countEl.value = cfg.count || '';
        listEl.value = (cfg.questions || []).join('\n');
      } else {
        if (![...gradeEl.options].length) refreshTeacherGradeOptions(gradeEl);
        nameEl.value = '';
        modeEl.value = 'random';
        countEl.value = '';
        listEl.value = '';
      }
      renderTeacherQuestionPickerForClasses();
    };

    window.saveTeacherTestFromAdmin = function(){
      const grade = (document.getElementById('testGrade')?.value || 'KG1').trim().toLowerCase();
      const name = (document.getElementById('testName')?.value || '').trim() || `${grade.toUpperCase()} Test`;
      const mode = (document.getElementById('testMode')?.value || 'random').trim();
      let count = Math.max(1, Math.min(50, Number(document.getElementById('testCount')?.value || 10)));
      const list = (document.getElementById('testQuestionList')?.value || '').split(/\n+/).map(s => s.trim()).filter(Boolean);
      if ((mode === 'manual' || mode === 'select') && !list.length){
        alert(lang()==='ar' ? 'اختر سؤالاً واحداً على الأقل.' : 'Please choose at least one question.');
        return;
      }
      if (mode === 'manual' || mode === 'select') count = Math.min(count, list.length);
      const tests = window.getTeacherTests ? window.getTeacherTests() : readJson(KEY_TESTS, {});
      tests[grade] = {enabled:true, name, mode, count, questions:list};
      window.setTeacherTests ? window.setTeacherTests(tests) : writeJson(KEY_TESTS, tests);
      renderTeacherQuestionPickerForClasses();
      alert(lang()==='ar' ? 'تم حفظ اختبار المعلم.' : 'Teacher test saved.');
    };

    window.clearTeacherTestFromAdmin = function(){
      const tests = window.getTeacherTests ? window.getTeacherTests() : readJson(KEY_TESTS,{});
      const grade = (document.getElementById('testGrade')?.value || '').trim().toLowerCase();
      if (grade && grade in tests) tests[grade] = null; else Object.keys(tests).forEach(k => tests[k] = null);
      window.setTeacherTests ? window.setTeacherTests(tests) : writeJson(KEY_TESTS, tests);
      const listEl = document.getElementById('testQuestionList');
      if (listEl) listEl.value = '';
      window.renderTeacherTestEditor();
      alert(lang()==='ar' ? 'تم مسح الاختبار.' : 'Teacher test cleared.');
    };
  }

  function renderTeacherQuestionPickerForClasses(){
    const wrap = document.getElementById('teacherQuestionPickerWrap');
    const list = document.getElementById('teacherQuestionPickerList');
    const gradeEl = document.getElementById('testGrade');
    const modeEl = document.getElementById('testMode');
    const listEl = document.getElementById('testQuestionList');
    if (!wrap || !list || !gradeEl || !modeEl || !listEl) return;
    const grade = (gradeEl.value || 'KG1').trim().toLowerCase();
    const mode = (modeEl.value || 'random').trim();
    if (mode !== 'manual' && mode !== 'select'){
      wrap.hidden = true;
      wrap.classList.add('hidden');
      return;
    }
    wrap.hidden = false;
    wrap.classList.remove('hidden');
    const pool = typeof window.sanitizedPool === 'function' ? window.sanitizedPool(grade) : [];
    const selected = new Set((listEl.value || '').split(/\n+/).map(s => s.trim()).filter(Boolean).map(s => s.toLowerCase()));
    list.innerHTML = pool.length ? pool.map((q, idx) => `
      <label class="teacher-question-row">
        <input type="checkbox" class="teacher-question-check" data-question-text="${escapeHtml(q.text)}" ${selected.has(String(q.text).trim().toLowerCase()) ? 'checked' : ''}>
        <span><strong>${idx+1}. ${escapeHtml(q.text)}</strong><span class="teacher-question-meta">${escapeHtml((q.skill || 'Skill') + ' • ' + (q.answer || ''))}</span></span>
      </label>
    `).join('') : `<div class="picker-empty">${T('noClassQuestions')}</div>`;
    list.querySelectorAll('.teacher-question-check').forEach(ch => ch.addEventListener('change', () => {
      const vals = Array.from(list.querySelectorAll('.teacher-question-check:checked')).map(el => el.dataset.questionText || '');
      listEl.value = vals.join('\n');
    }));
  }

  function bindTeacherTestButtons(){
    const saveBtn = document.getElementById('saveTeacherTestBtn');
    if (saveBtn){
      const clone = saveBtn.cloneNode(true);
      saveBtn.parentNode.replaceChild(clone, saveBtn);
      clone.addEventListener('click', window.saveTeacherTestFromAdmin);
    }
    const clearBtn = document.getElementById('clearTeacherTestBtn');
    if (clearBtn){
      const clone = clearBtn.cloneNode(true);
      clearBtn.parentNode.replaceChild(clone, clearBtn);
      clone.addEventListener('click', window.clearTeacherTestFromAdmin);
    }
    const modeEl = document.getElementById('testMode');
    if (modeEl){
      modeEl.addEventListener('change', renderTeacherQuestionPickerForClasses);
    }
    const gradeEl = document.getElementById('testGrade');
    if (gradeEl){
      gradeEl.addEventListener('change', renderTeacherQuestionPickerForClasses);
    }
  }

  function initClassManager(){
    if (document.body.dataset.page !== 'admin') return;
    ensureTeacherGradeSelect();
    overrideTeacherTestFunctions();
    bindTeacherTestButtons();
    renderTeacherQuestionPickerForClasses();
    renderCustomClassesAdmin();
    renderClassQuestionPicker();
    renderTeacherQuestionPickerForClasses();
    const sec=document.querySelector('[data-section-key="classManager"]'); if(sec){ sec.classList.remove('hidden'); sec.hidden=false; sec.style.display=''; }

    const saveBtn = document.getElementById('saveClassBtn');
    if (saveBtn) saveBtn.addEventListener('click', saveClassFromAdmin);
    document.getElementById('classSourceMode')?.addEventListener('change', renderClassQuestionPicker);
    document.getElementById('selectAllClassQuestionsBtn')?.addEventListener('click', ()=>selectAllClassQuestions(true));
    document.getElementById('clearClassQuestionsBtn')?.addEventListener('click', ()=>selectAllClassQuestions(false));
  }

  window.addEventListener('load', () => {
    renderHomeCustomClasses();
    renderClassPageMeta();
    initClassManager();
  });
})();



/* === v38.2 class manager enhancements === */
(function(){
  if (typeof window === 'undefined') return;
  const _oldRenderCustomClassesAdmin = typeof renderCustomClassesAdmin === 'function' ? renderCustomClassesAdmin : null;
  if (_oldRenderCustomClassesAdmin){
    window.renderCustomClassesAdmin = function(){
      _oldRenderCustomClassesAdmin();
      const list=document.getElementById('customClassesList');
      if(!list) return;
      list.querySelectorAll('.question-edit-card').forEach(card=>{
        const del = card.querySelector('.delete-class-btn');
        if(del && !card.querySelector('.edit-class-btn')){
          const edit=document.createElement('button');
          edit.className='ghost-btn class-edit-btn';
          edit.textContent=(typeof T==='function'?T('editClass'):'Edit Class');
          edit.addEventListener('click', ()=>{
            const key=del.dataset.classKey;
            const cls=getCustomClasses().find(c=>c.key===key);
            if(!cls) return;
            const name=document.getElementById('classNameInput');
            const desc=document.getElementById('classDescInput');
            const count=document.getElementById('classQuestionCount');
            const hidden=document.getElementById('classHiddenToggle');
            if(name) name.value=cls.name || '';
            if(desc) desc.value=cls.description || '';
            if(count) count.value=cls.questionCount || '';
            if(hidden) hidden.checked=!!cls.hidden;
          });
          del.parentNode.insertBefore(edit, del);
        }
      });
    };
  }
  window.getCustomClasses = function(){ return getCustomClasses(); };
  window.setCustomClasses = function(v){ return setCustomClasses(v); };
})();
