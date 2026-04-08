
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
        <img src="${cls.image || 'assets/grades/kg2.png'}" alt="${escapeHtml(cls.name)}" class="grade-card-art">
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
    const meta = existing || { key, name, description:'', image:'assets/svg/school.svg', questionCount:0 };
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

/* === v38.11 quiz visibility controls === */
(function(){
  if (typeof window === 'undefined') return;
  const KEY_CLASSES = 'kgEnglishCustomClassesV29';
  const KEY_TESTS = 'kgEnglishTeacherTestsV23';

  function readJson(key, fallback){
    try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : fallback; }
    catch (e) { return fallback; }
  }
  function writeJson(key, value){ localStorage.setItem(key, JSON.stringify(value)); }
  function getClasses(){ return readJson(KEY_CLASSES, []); }
  function setClasses(v){ writeJson(KEY_CLASSES, v); }
  function getTests(){
    return (typeof window.getTeacherTests === 'function') ? window.getTeacherTests() : readJson(KEY_TESTS, {kg1:null, kg2:null});
  }
  function setTests(v){
    if (typeof window.setTeacherTests === 'function') window.setTeacherTests(v);
    else writeJson(KEY_TESTS, v);
  }
  function getClassMeta(key){ return getClasses().find(c => c && c.key === key) || null; }
  function currentTeacherGrade(){ return String(document.getElementById('testGrade')?.value || 'KG1').trim().toLowerCase(); }
  function gradeLabel(key){
    if (key === 'kg1' || key === 'kg2') return key.toUpperCase();
    const meta = getClassMeta(key);
    return meta?.name || key.toUpperCase();
  }

  function ensureTeacherTestVisibilityControls(){
    if (document.body.dataset.page !== 'admin') return;
    const body = document.getElementById('teacherTestBody');
    const saveBtn = document.getElementById('saveTeacherTestBtn');
    if (!body || !saveBtn) return;

    let wrap = document.getElementById('teacherTestVisibilityTools');
    if (!wrap){
      wrap = document.createElement('div');
      wrap.id = 'teacherTestVisibilityTools';
      wrap.className = 'action-row wrap-row';
      wrap.innerHTML = '' +
        '<button type="button" class="ghost-btn" id="hideTeacherQuizBtn">Freeze / Hide Quiz</button>' +
        '<button type="button" class="ghost-btn" id="showTeacherQuizBtn">Unhide Quiz</button>' +
        '<span class="muted-note" id="teacherQuizVisibilityStatus"></span>';
      const actionRow = saveBtn.closest('.action-row') || saveBtn.parentNode;
      if (actionRow && actionRow.parentNode) actionRow.parentNode.insertBefore(wrap, actionRow.nextSibling);
      else body.appendChild(wrap);
    }

    const hideBtn = document.getElementById('hideTeacherQuizBtn');
    const showBtn = document.getElementById('showTeacherQuizBtn');
    const status = document.getElementById('teacherQuizVisibilityStatus');

    function refreshStatus(){
      const grade = currentTeacherGrade();
      const tests = getTests();
      const cfg = tests && tests[grade];
      if (!status) return;
      if (!cfg){
        status.textContent = 'No saved quiz for ' + gradeLabel(grade) + '.';
        if (hideBtn) hideBtn.disabled = true;
        if (showBtn) showBtn.disabled = true;
        return;
      }
      const visible = cfg.enabled !== false;
      status.textContent = visible
        ? ('Quiz for ' + gradeLabel(grade) + ' is visible to students.')
        : ('Quiz for ' + gradeLabel(grade) + ' is hidden from students.');
      if (hideBtn) hideBtn.disabled = !visible;
      if (showBtn) showBtn.disabled = visible;
    }

    if (hideBtn && !hideBtn.dataset.bound){
      hideBtn.dataset.bound = '1';
      hideBtn.addEventListener('click', () => {
        const grade = currentTeacherGrade();
        const tests = getTests();
        const cfg = tests && tests[grade];
        if (!cfg){
          alert('Save the quiz first, then you can hide it.');
          refreshStatus();
          return;
        }
        cfg.enabled = false;
        tests[grade] = cfg;
        setTests(tests);
        refreshStatus();
        alert('Quiz hidden from students.');
      });
    }
    if (showBtn && !showBtn.dataset.bound){
      showBtn.dataset.bound = '1';
      showBtn.addEventListener('click', () => {
        const grade = currentTeacherGrade();
        const tests = getTests();
        const cfg = tests && tests[grade];
        if (!cfg){
          alert('No saved quiz to unhide.');
          refreshStatus();
          return;
        }
        cfg.enabled = true;
        tests[grade] = cfg;
        setTests(tests);
        refreshStatus();
        alert('Quiz is visible to students again.');
      });
    }

    ['testGrade','testName','testMode','testCount','testQuestionList'].forEach((id) => {
      const el = document.getElementById(id);
      if (el && !el.dataset.visibilityWatch){
        el.dataset.visibilityWatch = '1';
        el.addEventListener('change', refreshStatus);
        el.addEventListener('input', refreshStatus);
      }
    });
    ['saveTeacherTestBtn','clearTeacherTestBtn','archiveTeacherTestBtn'].forEach((id) => {
      const el = document.getElementById(id);
      if (el && !el.dataset.visibilityRefresh){
        el.dataset.visibilityRefresh = '1';
        el.addEventListener('click', () => setTimeout(refreshStatus, 30));
      }
    });

    refreshStatus();
  }

  function toggleClassHidden(key, hidden){
    const classes = getClasses();
    const idx = classes.findIndex(c => c && c.key === key);
    if (idx < 0) return false;
    classes[idx].hidden = !!hidden;
    setClasses(classes);
    return true;
  }

  function decorateClassManagerCards(){
    if (document.body.dataset.page !== 'admin') return;
    const list = document.getElementById('customClassesList');
    if (!list) return;
    const classes = getClasses();
    list.querySelectorAll('.question-edit-card').forEach((card) => {
      const delBtn = card.querySelector('.delete-class-btn');
      if (!delBtn) return;
      const key = delBtn.dataset.classKey;
      const meta = classes.find(c => c && c.key === key);
      const actions = card.querySelector('.question-edit-actions');
      const infoRow = card.querySelector('.class-manager-meta');
      if (!actions || !key) return;

      let toggleBtn = actions.querySelector('.toggle-class-visibility-btn');
      if (!toggleBtn){
        toggleBtn = document.createElement('button');
        toggleBtn.type = 'button';
        toggleBtn.className = 'ghost-btn toggle-class-visibility-btn';
        actions.insertBefore(toggleBtn, delBtn);
        toggleBtn.addEventListener('click', () => {
          const current = getClassMeta(key);
          if (!current) return;
          const nextHidden = !current.hidden;
          toggleClassHidden(key, nextHidden);
          decorateClassManagerCards();
          if (document.body.dataset.page === 'home'){
            document.querySelectorAll('.custom-class-card').forEach(el => el.remove());
          }
          alert(nextHidden ? 'Class quiz hidden from students.' : 'Class quiz is visible to students again.');
        });
      }
      const hidden = !!(meta && meta.hidden);
      toggleBtn.textContent = hidden ? 'Show Quiz' : 'Hide Quiz';

      let badge = infoRow && infoRow.querySelector('.class-manager-hidden-badge');
      if (hidden && infoRow && !badge){
        badge = document.createElement('span');
        badge.className = 'class-manager-hidden-badge';
        badge.textContent = 'Hidden';
        infoRow.appendChild(badge);
      } else if (!hidden && badge) {
        badge.remove();
      }
    });
  }

  function watchClassManagerList(){
    if (document.body.dataset.page !== 'admin') return;
    const list = document.getElementById('customClassesList');
    if (!list || list.dataset.visibilityObserver) return;
    list.dataset.visibilityObserver = '1';
    const obs = new MutationObserver(() => decorateClassManagerCards());
    obs.observe(list, { childList:true, subtree:true });
    decorateClassManagerCards();
  }

  function blockHiddenClassDirectAccess(){
    if (document.body.dataset.page !== 'quiz') return;
    const params = new URLSearchParams(location.search);
    const grade = String(params.get('grade') || document.body.dataset.grade || '').trim().toLowerCase();
    if (!grade || grade === 'kg1' || grade === 'kg2') return;
    const meta = getClassMeta(grade);
    if (!meta || !meta.hidden) return;
    const shell = document.querySelector('main.container') || document.body;
    if (shell){
      shell.innerHTML = '<section class="card"><h2>Quiz Hidden</h2><p>This class quiz is hidden by the teacher.</p><p><a class="main-btn" href="index.html">Back Home</a></p></section>';
    }
    try { history.replaceState({}, '', 'index.html'); } catch (e) {}
  }

  window.addEventListener('load', () => {
    ensureTeacherTestVisibilityControls();
    watchClassManagerList();
    blockHiddenClassDirectAccess();
    setTimeout(() => {
      ensureTeacherTestVisibilityControls();
      decorateClassManagerCards();
    }, 120);
  });
})();

/* === v38.12 status badges + question bank class fixes === */
(function(){
  if (typeof window === 'undefined') return;

  const KEY_CLASSES = 'kgEnglishCustomClassesV29';
  const KEY_TESTS = 'kgEnglishTeacherTestsV23';
  const VALID_STATUSES = ['visible','hidden','frozen'];

  function readJson(key, fallback){
    try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : fallback; }
    catch (e) { return fallback; }
  }
  function writeJson(key, value){ localStorage.setItem(key, JSON.stringify(value)); }
  function getClasses(){ return Array.isArray(readJson(KEY_CLASSES, [])) ? readJson(KEY_CLASSES, []) : []; }
  function setClasses(v){ writeJson(KEY_CLASSES, v); }
  function getTests(){ return (typeof window.getTeacherTests === 'function') ? window.getTeacherTests() : readJson(KEY_TESTS, {kg1:null, kg2:null}); }
  function setTests(v){ if (typeof window.setTeacherTests === 'function') window.setTeacherTests(v); else writeJson(KEY_TESTS, v); }
  function getClassMeta(key){ return getClasses().find(c => c && c.key === key) || null; }
  function normStatus(value, fallback){
    const s = String(value || '').trim().toLowerCase();
    return VALID_STATUSES.includes(s) ? s : (fallback || 'visible');
  }
  function getTeacherQuizStatus(cfg){
    if (!cfg) return 'visible';
    if (VALID_STATUSES.includes(String(cfg.status || '').toLowerCase())) return String(cfg.status).toLowerCase();
    return cfg.enabled === false ? 'hidden' : 'visible';
  }
  function getClassQuizStatus(meta){
    if (!meta) return 'visible';
    if (VALID_STATUSES.includes(String(meta.status || '').toLowerCase())) return String(meta.status).toLowerCase();
    return meta.hidden ? 'hidden' : 'visible';
  }
  function setTeacherQuizStatus(grade, status){
    const tests = getTests();
    const cfg = tests && tests[grade];
    if (!cfg) return false;
    const next = normStatus(status, 'visible');
    cfg.status = next;
    cfg.enabled = next !== 'hidden';
    tests[grade] = cfg;
    setTests(tests);
    return true;
  }
  function setClassQuizStatus(key, status){
    const classes = getClasses();
    const idx = classes.findIndex(c => c && c.key === key);
    if (idx < 0) return false;
    const next = normStatus(status, 'visible');
    classes[idx].status = next;
    classes[idx].hidden = next === 'hidden';
    setClasses(classes);
    return true;
  }
  function gradeLabel(key){
    const grade = String(key || '').trim().toLowerCase();
    if (!grade) return '';
    if (grade === 'kg1' || grade === 'kg2') return grade.toUpperCase();
    const meta = getClassMeta(grade);
    return meta?.name || String(key || '').toUpperCase();
  }
  function statusLabel(status){ return normStatus(status).toUpperCase(); }
  function statusText(status, label){
    const quizLabel = label || 'Quiz';
    if (status === 'hidden') return quizLabel + ' is hidden from students.';
    if (status === 'frozen') return quizLabel + ' is visible but locked for students.';
    return quizLabel + ' is visible to students.';
  }
  function escapeHtml(s){
    return String(s || '').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  }

  function ensureTeacherStatusControls(){
    if (document.body.dataset.page !== 'admin') return;
    const body = document.getElementById('teacherTestBody');
    const saveBtn = document.getElementById('saveTeacherTestBtn');
    if (!body || !saveBtn) return;

    let wrap = document.getElementById('teacherTestVisibilityTools');
    if (!wrap){
      wrap = document.createElement('div');
      wrap.id = 'teacherTestVisibilityTools';
      wrap.className = 'quiz-status-toolbar';
      const actionRow = saveBtn.closest('.action-row') || saveBtn.parentNode;
      if (actionRow && actionRow.parentNode) actionRow.parentNode.insertBefore(wrap, actionRow.nextSibling);
      else body.appendChild(wrap);
    }
    wrap.innerHTML = '' +
      '<span class="quiz-state-badge quiz-state-visible" id="teacherQuizStateBadge">VISIBLE</span>' +
      '<button type="button" class="ghost-btn" id="teacherQuizSetVisibleBtn">Show</button>' +
      '<button type="button" class="ghost-btn" id="teacherQuizSetHiddenBtn">Hide</button>' +
      '<button type="button" class="ghost-btn" id="teacherQuizSetFrozenBtn">Freeze</button>' +
      '<span class="muted-note" id="teacherQuizVisibilityStatus"></span>';

    const grade = () => String(document.getElementById('testGrade')?.value || 'KG1').trim().toLowerCase();
    const badge = document.getElementById('teacherQuizStateBadge');
    const status = document.getElementById('teacherQuizVisibilityStatus');
    const visibleBtn = document.getElementById('teacherQuizSetVisibleBtn');
    const hiddenBtn = document.getElementById('teacherQuizSetHiddenBtn');
    const frozenBtn = document.getElementById('teacherQuizSetFrozenBtn');

    function refresh(){
      const g = grade();
      const cfg = getTests()?.[g] || null;
      const current = getTeacherQuizStatus(cfg);
      if (!cfg){
        if (badge){ badge.textContent = 'NO QUIZ'; badge.className = 'quiz-state-badge'; }
        if (status) status.textContent = 'Save the quiz first for ' + gradeLabel(g) + '.';
        if (visibleBtn) visibleBtn.disabled = true;
        if (hiddenBtn) hiddenBtn.disabled = true;
        if (frozenBtn) frozenBtn.disabled = true;
        return;
      }
      if (badge){ badge.textContent = statusLabel(current); badge.className = 'quiz-state-badge quiz-state-' + current; }
      if (status) status.textContent = statusText(current, 'Quiz for ' + gradeLabel(g));
      if (visibleBtn) visibleBtn.disabled = current === 'visible';
      if (hiddenBtn) hiddenBtn.disabled = current === 'hidden';
      if (frozenBtn) frozenBtn.disabled = current === 'frozen';
    }

    const bindStatusBtn = (el, nextStatus, okMessage) => {
      if (!el || el.dataset.bound === '1') return;
      el.dataset.bound = '1';
      el.addEventListener('click', () => {
        const g = grade();
        const cfg = getTests()?.[g] || null;
        if (!cfg){ refresh(); alert('Save the quiz first.'); return; }
        setTeacherQuizStatus(g, nextStatus);
        refresh();
        alert(okMessage);
      });
    };
    bindStatusBtn(visibleBtn, 'visible', 'Quiz is now visible to students.');
    bindStatusBtn(hiddenBtn, 'hidden', 'Quiz hidden from students.');
    bindStatusBtn(frozenBtn, 'frozen', 'Quiz frozen for students.');

    ['testGrade','testName','testMode','testCount','testQuestionList'].forEach((id) => {
      const el = document.getElementById(id);
      if (el && el.dataset.statusWatch !== '1'){
        el.dataset.statusWatch = '1';
        el.addEventListener('change', () => setTimeout(refresh, 20));
        el.addEventListener('input', () => setTimeout(refresh, 20));
      }
    });
    ['saveTeacherTestBtn','clearTeacherTestBtn','archiveTeacherTestBtn','cloneTeacherTestBtn'].forEach((id) => {
      const el = document.getElementById(id);
      if (el && el.dataset.statusRefresh !== '1'){
        el.dataset.statusRefresh = '1';
        el.addEventListener('click', () => setTimeout(refresh, 40));
      }
    });

    refresh();
  }

  function preserveTeacherStatusOnSave(){
    if (typeof window.saveTeacherTestFromAdmin !== 'function' || window.saveTeacherTestFromAdmin.__statusWrapped) return;
    const original = window.saveTeacherTestFromAdmin;
    const wrapped = function(){
      const grade = String(document.getElementById('testGrade')?.value || 'KG1').trim().toLowerCase();
      const before = getTests()?.[grade] || null;
      const prevStatus = getTeacherQuizStatus(before);
      original.apply(this, arguments);
      const tests = getTests();
      if (tests && tests[grade]){
        tests[grade].status = prevStatus || 'visible';
        tests[grade].enabled = tests[grade].status !== 'hidden';
        setTests(tests);
      }
      setTimeout(ensureTeacherStatusControls, 10);
    };
    wrapped.__statusWrapped = true;
    window.saveTeacherTestFromAdmin = wrapped;
  }

  function applyTeacherStudentStatus(){
    if (document.body.dataset.page !== 'quiz') return;
    const grade = String(document.body.dataset.grade || '').trim().toLowerCase();
    if (!grade) return;
    const cfg = getTests()?.[grade] || null;
    if (!cfg) return;
    const status = getTeacherQuizStatus(cfg);
    const wrap = document.getElementById('testLaunchWrap');
    const btn = document.getElementById('startAssignedTestBtn');
    if (!wrap || !btn) return;
    if (status === 'hidden'){
      wrap.classList.add('hidden');
      btn.disabled = true;
      btn.dataset.quizStatus = status;
      return;
    }
    btn.dataset.quizStatus = status;
    btn.disabled = status === 'frozen';
    let note = wrap.querySelector('.teacher-quiz-status-note');
    if (!note){
      note = document.createElement('p');
      note.className = 'teacher-quiz-status-note muted-note';
      wrap.appendChild(note);
    }
    if (status === 'frozen'){
      wrap.classList.remove('hidden');
      note.textContent = 'This teacher quiz is frozen. Students can see it but cannot start it.';
    } else {
      note.textContent = '';
    }
  }

  document.addEventListener('click', function(e){
    const target = e.target && e.target.closest ? e.target.closest('#startAssignedTestBtn') : null;
    if (!target) return;
    if (String(target.dataset.quizStatus || '').toLowerCase() !== 'frozen') return;
    e.preventDefault();
    e.stopImmediatePropagation();
    alert('This quiz is frozen and cannot be started right now.');
  }, true);

  function decorateHomeClassCards(){
    if (document.body.dataset.page !== 'home') return;
    document.querySelectorAll('.custom-class-card').forEach((card) => {
      const href = card.getAttribute('href') || '';
      const m = href.match(/[?&]grade=([^&]+)/i);
      const key = m ? decodeURIComponent(m[1]).toLowerCase() : '';
      if (!key) return;
      const meta = getClassMeta(key);
      const status = getClassQuizStatus(meta);
      let badge = card.querySelector('.quiz-state-badge.home-class-status');
      if (!badge){
        badge = document.createElement('span');
        badge.className = 'quiz-state-badge home-class-status';
        card.insertBefore(badge, card.firstChild.nextSibling);
      }
      badge.className = 'quiz-state-badge home-class-status quiz-state-' + status;
      badge.textContent = statusLabel(status);
    });
  }

  function decorateClassManagerCardsV3812(){
    if (document.body.dataset.page !== 'admin') return;
    const list = document.getElementById('customClassesList');
    if (!list) return;
    list.querySelectorAll('.question-edit-card').forEach((card) => {
      const delBtn = card.querySelector('.delete-class-btn');
      if (!delBtn) return;
      const key = String(delBtn.dataset.classKey || '').trim().toLowerCase();
      const meta = getClassMeta(key);
      const status = getClassQuizStatus(meta);
      const infoRow = card.querySelector('.class-manager-meta');
      const actions = card.querySelector('.question-edit-actions');
      const legacyToggle = actions && actions.querySelector('.toggle-class-visibility-btn');
      if (legacyToggle) legacyToggle.remove();
      const legacyHiddenBadge = infoRow && infoRow.querySelector('.class-manager-hidden-badge');
      if (legacyHiddenBadge) legacyHiddenBadge.remove();
      if (infoRow){
        let badge = infoRow.querySelector('.quiz-state-badge.class-quiz-status');
        if (!badge){
          badge = document.createElement('span');
          badge.className = 'quiz-state-badge class-quiz-status';
          infoRow.appendChild(badge);
        }
        badge.className = 'quiz-state-badge class-quiz-status quiz-state-' + status;
        badge.textContent = statusLabel(status);
      }
      if (!actions) return;
      let tool = actions.querySelector('.class-status-actions');
      if (!tool){
        tool = document.createElement('div');
        tool.className = 'class-status-actions';
        tool.innerHTML = '' +
          '<button type="button" class="ghost-btn set-class-visible-btn">Show</button>' +
          '<button type="button" class="ghost-btn set-class-hidden-btn">Hide</button>' +
          '<button type="button" class="ghost-btn set-class-frozen-btn">Freeze</button>';
        actions.insertBefore(tool, delBtn);
        const visibleBtn = tool.querySelector('.set-class-visible-btn');
        const hiddenBtn = tool.querySelector('.set-class-hidden-btn');
        const frozenBtn = tool.querySelector('.set-class-frozen-btn');
        visibleBtn.addEventListener('click', () => { setClassQuizStatus(key, 'visible'); decorateClassManagerCardsV3812(); decorateHomeClassCards(); alert('Class quiz is visible to students again.'); });
        hiddenBtn.addEventListener('click', () => { setClassQuizStatus(key, 'hidden'); decorateClassManagerCardsV3812(); decorateHomeClassCards(); alert('Class quiz hidden from students.'); });
        frozenBtn.addEventListener('click', () => { setClassQuizStatus(key, 'frozen'); decorateClassManagerCardsV3812(); decorateHomeClassCards(); alert('Class quiz frozen for students.'); });
      }
      const visibleBtn = actions.querySelector('.set-class-visible-btn');
      const hiddenBtn = actions.querySelector('.set-class-hidden-btn');
      const frozenBtn = actions.querySelector('.set-class-frozen-btn');
      if (visibleBtn) visibleBtn.disabled = status === 'visible';
      if (hiddenBtn) hiddenBtn.disabled = status === 'hidden';
      if (frozenBtn) frozenBtn.disabled = status === 'frozen';
    });
  }

  function enforceClassPageStatus(){
    if (document.body.dataset.page !== 'quiz') return;
    const params = new URLSearchParams(location.search);
    const grade = String(params.get('grade') || document.body.dataset.grade || '').trim().toLowerCase();
    if (!grade || grade === 'kg1' || grade === 'kg2') return;
    const meta = getClassMeta(grade);
    const status = getClassQuizStatus(meta);
    if (status === 'hidden') return;
    if (status !== 'frozen') return;
    const studentName = document.getElementById('studentName');
    const goBtn = document.getElementById('goBtn');
    const levelChooser = document.getElementById('levelChooser');
    const testLaunchWrap = document.getElementById('testLaunchWrap');
    const card = document.querySelector('.student-form-card') || document.querySelector('main.container .card');
    if (studentName) studentName.disabled = true;
    if (goBtn){
      goBtn.disabled = true;
      goBtn.textContent = 'Quiz Frozen';
    }
    if (levelChooser) levelChooser.classList.add('hidden');
    if (testLaunchWrap) testLaunchWrap.classList.add('hidden');
    if (card && !card.querySelector('.class-frozen-note')){
      const note = document.createElement('div');
      note.className = 'class-frozen-note stored-question';
      note.innerHTML = '<h4>FROZEN</h4><p>This class quiz is visible but locked by the teacher. Students cannot start it right now.</p>';
      card.appendChild(note);
    }
  }

  function watchClassLists(){
    if (document.body.dataset.page === 'admin'){
      const list = document.getElementById('customClassesList');
      if (list && list.dataset.v3812watch !== '1'){
        list.dataset.v3812watch = '1';
        const obs = new MutationObserver(() => decorateClassManagerCardsV3812());
        obs.observe(list, {childList:true, subtree:true});
      }
    }
    if (document.body.dataset.page === 'home'){
      const grid = document.getElementById('homeLevelsGrid');
      if (grid && grid.dataset.v3812watch !== '1'){
        grid.dataset.v3812watch = '1';
        const obs = new MutationObserver(() => decorateHomeClassCards());
        obs.observe(grid, {childList:true, subtree:true});
      }
    }
  }

  function questionClassContext(question){
    const meta = question && question._meta ? question._meta : {};
    const gradeKey = String(meta.grade || question?.grade || '').trim().toLowerCase();
    const isBase = gradeKey === 'kg1' || gradeKey === 'kg2';
    const classMeta = isBase ? null : getClassMeta(gradeKey);
    const classLabel = isBase ? gradeKey.toUpperCase() : (classMeta?.name || String(question?.grade || gradeKey).trim() || gradeKey.toUpperCase());
    const gradeLabelText = isBase ? gradeKey.toUpperCase() : 'CLASS';
    const filterKey = gradeKey || String(question?.grade || '').trim().toLowerCase();
    return { gradeKey, classLabel, gradeLabelText, filterKey, isBase };
  }

  window.questionEditorCard = function(question){
    const meta = question._meta || {};
    const ctx = questionClassContext(question);
    const opts = (question.options || []).join(' | ');
    const srcLabel = meta.source === 'base' ? 'Base' : 'Custom';
    const classBadge = ctx.isBase ? '' : '<span class="class-chip">' + escapeHtml(ctx.classLabel) + '</span>';
    return '' +
      '<div class="question-edit-card" data-qid="' + escapeHtml(meta.id || '') + '" data-grade="' + escapeHtml(ctx.filterKey) + '" data-grade-key="' + escapeHtml(ctx.gradeKey) + '" data-class-label="' + escapeHtml(ctx.classLabel) + '">' +
        '<div class="meta-line">' +
          '<span class="class-chip">' + escapeHtml(ctx.gradeLabelText) + '</span>' +
          classBadge +
          '<span>' + escapeHtml(question.skill || '-') + '</span>' +
          '<span>' + escapeHtml(question.type || 'Choice') + '</span>' +
          '<span>' + escapeHtml(srcLabel) + '</span>' +
        '</div>' +
        '<div class="question-edit-grid">' +
          '<textarea class="qe-text full">' + escapeHtml(question.text || '') + '</textarea>' +
          '<input class="qe-skill" value="' + escapeHtml(question.skill || '') + '" placeholder="Skill">' +
          '<input class="qe-type" value="' + escapeHtml(question.type || '') + '" placeholder="Type">' +
          '<textarea class="qe-options full" placeholder="Options separated by |">' + escapeHtml(opts) + '</textarea>' +
          '<input class="qe-answer" value="' + escapeHtml(question.answer || '') + '" placeholder="Answer">' +
          '<input class="qe-difficulty" value="' + escapeHtml(question.difficulty || 1) + '" placeholder="Difficulty 1-3">' +
          '<input class="qe-image full" value="' + escapeHtml(question.image || '') + '" placeholder="Image filename or data URL">' +
        '</div>' +
        '<div class="question-edit-actions">' +
          '<button class="main-btn save-question-btn" type="button">Save Changes</button>' +
          '<button class="ghost-btn reset-question-btn" type="button">Reset</button>' +
          '<button class="danger-btn delete-question-btn" type="button">' + escapeHtml(((window.translations?.[window.getLang?.() || 'en'] || {}).deleteQuestion) || 'Delete') + '</button>' +
        '</div>' +
      '</div>';
  };

  function questionEditorItems(){
    let items = [];
    try {
      items = ['kg1','kg2'].reduce((acc, key) => acc.concat((window.collectQuestionsWithMeta ? window.collectQuestionsWithMeta(key) : [])), []);
      const extras = getClasses().map(cls => cls.key).reduce((acc, key) => acc.concat((window.collectQuestionsWithMeta ? window.collectQuestionsWithMeta(key) : [])), []);
      items = items.concat(extras);
    } catch (e) {}
    if (typeof window.applyQuestionOverrides === 'function') items = items.map(window.applyQuestionOverrides);
    return items.filter(q => !(q && q._deleted));
  }

  window.renderStoredQuestions = function(){
    const list = document.getElementById('storedQuestionsList');
    const countEl = document.getElementById('questionResultsCount');
    const noEl = document.getElementById('questionNoResults');
    if (!list) return;
    const items = questionEditorItems();
    list.innerHTML = items.length ? items.map(window.questionEditorCard).join('') : '<div class="stored-question"><h4>No questions yet.</h4><p>Add questions from the editor above.</p></div>';
    if (typeof window.bindQuestionEditorActions === 'function') window.bindQuestionEditorActions();
    ensureDynamicQuestionFilters();
    window.filterQuestionCards((document.querySelector('[data-filter-grade].active')?.dataset.filterGrade || 'all').toLowerCase());
    const visibleCount = list.querySelectorAll('.question-edit-card').length;
    if (countEl) countEl.textContent = visibleCount + ' questions found';
    if (noEl) noEl.classList.toggle('hidden', visibleCount > 0);
  };

  function ensureDynamicQuestionFilters(){
    const row = document.querySelector('.editor-filters');
    if (!row) return;
    const keep = ['all','kg1','kg2'];
    row.querySelectorAll('[data-filter-grade]').forEach(btn => {
      if (!keep.includes(String(btn.dataset.filterGrade || '').toLowerCase())) btn.remove();
    });
    getClasses().forEach((cls) => {
      if (!cls || !cls.key) return;
      if (row.querySelector('[data-filter-grade="' + cls.key + '"]')) return;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'level-btn';
      btn.dataset.filterGrade = cls.key;
      btn.textContent = cls.name || cls.key.toUpperCase();
      row.appendChild(btn);
    });
    if (typeof window.wireQuestionFilterButtons === 'function') window.wireQuestionFilterButtons();
  }

  window.filterQuestionCards = function(grade){
    const wrap = document.getElementById('storedQuestionsWrap');
    const list = document.getElementById('storedQuestionsList');
    const countEl = document.getElementById('questionResultsCount');
    const noEl = document.getElementById('questionNoResults');
    if (!wrap || !list) return;
    wrap.hidden = false;
    wrap.style.display = '';
    wrap.classList.remove('collapsed-body');
    const activeGrade = String(grade || 'all').toLowerCase();
    const search = (document.getElementById('qSearchInput')?.value || '').toLowerCase().trim();
    const skill = (document.getElementById('qSkillFilterInput')?.value || '').toLowerCase().trim();
    const klass = (document.getElementById('qClassFilterInput')?.value || '').toLowerCase().trim();
    let shown = 0;
    list.querySelectorAll('.question-edit-card').forEach((card) => {
      const gradeKey = String(card.dataset.gradeKey || card.dataset.grade || '').toLowerCase();
      const gradeLabelText = String(card.dataset.classLabel || '').toLowerCase();
      const text = (card.querySelector('.qe-text')?.value || '').toLowerCase();
      const qskill = (card.querySelector('.qe-skill')?.value || '').toLowerCase();
      const byGrade = activeGrade === 'all' || gradeKey === activeGrade;
      const bySearch = !search || text.includes(search);
      const bySkill = !skill || qskill.includes(skill);
      const byClass = !klass || gradeKey.includes(klass) || gradeLabelText.includes(klass);
      const show = byGrade && bySearch && bySkill && byClass;
      card.style.display = show ? '' : 'none';
      if (show) shown += 1;
    });
    document.querySelectorAll('[data-filter-grade]').forEach((btn) => {
      btn.classList.toggle('active', String(btn.dataset.filterGrade || 'all').toLowerCase() === activeGrade);
    });
    if (countEl) countEl.textContent = shown + ' questions found';
    if (noEl) noEl.classList.toggle('hidden', shown > 0);
  };

  window.wireQuestionFilterButtons = function(){
    ensureDynamicQuestionFilters();
    document.querySelectorAll('[data-filter-grade]').forEach((btn) => {
      if (btn.dataset.v3812wired === '1') return;
      btn.dataset.v3812wired = '1';
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        window.filterQuestionCards((btn.dataset.filterGrade || 'all').toLowerCase());
      });
    });
    ['qSearchInput','qSkillFilterInput','qClassFilterInput'].forEach((id) => {
      const el = document.getElementById(id);
      if (!el || el.dataset.v3812wired === '1') return;
      el.dataset.v3812wired = '1';
      el.addEventListener('input', () => {
        window.filterQuestionCards((document.querySelector('[data-filter-grade].active')?.dataset.filterGrade || 'all').toLowerCase());
      });
    });
  };

  window.addEventListener('load', () => {
    preserveTeacherStatusOnSave();
    ensureTeacherStatusControls();
    decorateClassManagerCardsV3812();
    decorateHomeClassCards();
    enforceClassPageStatus();
    applyTeacherStudentStatus();
    const goBtn = document.getElementById('goBtn');
    if (goBtn && goBtn.dataset.v3812TeacherStatus !== '1'){
      goBtn.dataset.v3812TeacherStatus = '1';
      goBtn.addEventListener('click', () => setTimeout(applyTeacherStudentStatus, 40));
    }
    const launchWrap = document.getElementById('testLaunchWrap');
    if (launchWrap && launchWrap.dataset.v3812TeacherStatus !== '1'){
      launchWrap.dataset.v3812TeacherStatus = '1';
      const obs = new MutationObserver(() => applyTeacherStudentStatus());
      obs.observe(launchWrap, {attributes:true, attributeFilter:['class']});
    }
    watchClassLists();
    setTimeout(() => {
      preserveTeacherStatusOnSave();
      ensureTeacherStatusControls();
      decorateClassManagerCardsV3812();
      decorateHomeClassCards();
      enforceClassPageStatus();
      applyTeacherStudentStatus();
      ensureDynamicQuestionFilters();
      if (document.getElementById('storedQuestionsList')) window.renderStoredQuestions();
    }, 120);
  });
})();
