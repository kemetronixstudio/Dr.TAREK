(function(){
  if (typeof window === 'undefined') return;

  const KEY_CLASSES = 'kgEnglishCustomClassesV29';
  const KEY_CUSTOM_Q = 'kgEnglishCustomQuestionsV23';
  const KEY_TESTS = 'kgEnglishTeacherTestsV23';
  const KEY_LEVEL_VIS = 'kgEnglishLevelVisibilityV7';
  const KEY_TIMER = 'kgEnglishTimerSettingsV21';
  const KEY_ACCESS = 'kgEnglishQuizAccessV29';
  const BUILTIN_KEYS = ['kg1','kg2','grade1','grade2','grade3','grade4','grade5','grade6'];
  const BUILTIN_LABELS = {
    kg1: 'KG1',
    kg2: 'KG2',
    grade1: 'Grade 1',
    grade2: 'Grade 2',
    grade3: 'Grade 3',
    grade4: 'Grade 4',
    grade5: 'Grade 5',
    grade6: 'Grade 6'
  };

  function readJson(key, fallback){
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      return fallback;
    }
  }
  function writeJson(key, value){ localStorage.setItem(key, JSON.stringify(value)); }
  function getCustomClasses(){
    return (typeof window.getCustomClasses === 'function') ? (window.getCustomClasses() || []) : readJson(KEY_CLASSES, []);
  }
  function uniqueKeys(list){
    const out = [];
    const seen = new Set();
    (list || []).forEach((item) => {
      const key = String(item || '').trim().toLowerCase();
      if (!key || seen.has(key)) return;
      seen.add(key);
      out.push(key);
    });
    return out;
  }
  function allGradeKeys(){
    const custom = getCustomClasses().map((c) => c && c.key).filter(Boolean);
    return uniqueKeys(BUILTIN_KEYS.concat(custom));
  }
  function gradeMeta(key){
    const grade = String(key || '').trim().toLowerCase();
    if (window.kgBulkGradeMeta && window.kgBulkGradeMeta[grade]) return window.kgBulkGradeMeta[grade];
    const cls = getCustomClasses().find((c) => c && c.key === grade);
    if (cls) return { label: cls.name || BUILTIN_LABELS[grade] || grade.toUpperCase(), name: cls.name || grade.toUpperCase(), kind: 'class' };
    return { label: BUILTIN_LABELS[grade] || grade.toUpperCase(), name: BUILTIN_LABELS[grade] || grade.toUpperCase(), kind: BUILTIN_KEYS.includes(grade) ? 'grade' : 'class' };
  }
  function gradeLabel(key){ return gradeMeta(key).label; }
  function gradeKind(key){
    const grade = String(key || '').trim().toLowerCase();
    if (grade === 'kg1' || grade === 'kg2') return 'kg';
    if (BUILTIN_KEYS.includes(grade)) return 'grade';
    return 'class';
  }
  function escapeHtml(s){
    if (typeof window.escapeHtml === 'function') return window.escapeHtml(s);
    return String(s || '').replace(/[&<>"']/g, function(m){ return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[m]; });
  }
  function slugify(name){
    return String(name || '').trim().toLowerCase().replace(/[^a-z0-9\u0600-\u06FF]+/g, '-').replace(/^-+|-+$/g, '') || 'class';
  }
  function textFor(keyEn, keyAr){
    const ar = typeof window.getLang === 'function' && window.getLang() === 'ar';
    return ar ? keyAr : keyEn;
  }

  function ensureQuestionMap(base){
    const obj = base || {};
    BUILTIN_KEYS.forEach((key) => { if (!Array.isArray(obj[key])) obj[key] = []; });
    getCustomClasses().forEach((c) => { if (c && c.key && !Array.isArray(obj[c.key])) obj[c.key] = []; });
    return obj;
  }
  function ensureTestMap(base){
    const obj = base || {};
    BUILTIN_KEYS.forEach((key) => { if (!(key in obj)) obj[key] = null; });
    getCustomClasses().forEach((c) => { if (c && c.key && !(c.key in obj)) obj[c.key] = null; });
    return obj;
  }
  function ensureLevelMap(base){
    const obj = base || {};
    BUILTIN_KEYS.forEach((key) => { if (!Array.isArray(obj[key])) obj[key] = [10,20,30,40,50]; });
    getCustomClasses().forEach((c) => { if (c && c.key && !Array.isArray(obj[c.key])) obj[c.key] = [10,20,30,40,50]; });
    return obj;
  }
  function ensureTimerMap(base){
    const obj = base || {};
    BUILTIN_KEYS.forEach((key) => { if (typeof obj[key] !== 'boolean') obj[key] = true; });
    getCustomClasses().forEach((c) => { if (c && c.key && typeof obj[c.key] !== 'boolean') obj[c.key] = true; });
    return obj;
  }
  function ensureAccessMap(base){
    const obj = base || {};
    BUILTIN_KEYS.forEach((key) => { if (!obj[key]) obj[key] = {enabled:false, password:''}; });
    getCustomClasses().forEach((c) => { if (c && c.key && !obj[c.key]) obj[c.key] = {enabled:false, password:''}; });
    return obj;
  }

  const prevGetCustomQuestions = window.getCustomQuestions;
  window.getCustomQuestions = function(){
    const base = prevGetCustomQuestions ? prevGetCustomQuestions() : readJson(KEY_CUSTOM_Q, {});
    return ensureQuestionMap(base);
  };

  const prevGetTeacherTests = window.getTeacherTests;
  window.getTeacherTests = function(){
    const base = prevGetTeacherTests ? prevGetTeacherTests() : readJson(KEY_TESTS, {});
    return ensureTestMap(base);
  };

  const prevGetLevelVisibility = window.getLevelVisibility;
  window.getLevelVisibility = function(){
    const base = prevGetLevelVisibility ? prevGetLevelVisibility() : readJson(KEY_LEVEL_VIS, {});
    return ensureLevelMap(base);
  };

  const prevGetTimerSettings = window.getTimerSettings;
  window.getTimerSettings = function(){
    const base = prevGetTimerSettings ? prevGetTimerSettings() : readJson(KEY_TIMER, {});
    return ensureTimerMap(base);
  };

  const prevGetQuizAccess = window.getQuizAccess;
  window.getQuizAccess = function(){
    const base = prevGetQuizAccess ? prevGetQuizAccess() : readJson(KEY_ACCESS, {});
    return ensureAccessMap(base);
  };

  function ensureSelect(id, keys){
    const old = document.getElementById(id);
    if (!old) return null;
    let sel = old;
    if (old.tagName.toLowerCase() !== 'select'){
      sel = document.createElement('select');
      sel.id = id;
      sel.className = old.className || '';
      if (old.parentNode) old.parentNode.replaceChild(sel, old);
    }
    const current = String(sel.value || '').trim().toLowerCase();
    sel.innerHTML = '';
    keys.forEach((key) => {
      const opt = document.createElement('option');
      opt.value = key;
      opt.textContent = gradeLabel(key);
      sel.appendChild(opt);
    });
    if ([].slice.call(sel.options).some((o) => o.value === current)) sel.value = current;
    else if (sel.options[0]) sel.value = sel.options[0].value;
    return sel;
  }

  function syncNewQuestionGradeSelect(){
    if (document.body.dataset.page !== 'admin') return;
    ensureSelect('newQGrade', BUILTIN_KEYS);
  }

  function syncTeacherGradeSelect(){
    if (document.body.dataset.page !== 'admin') return;
    ensureSelect('testGrade', allGradeKeys());
  }

  function renderQuestionFilterButtons(){
    if (document.body.dataset.page !== 'admin') return;
    const row = document.querySelector('.editor-filters');
    if (!row) return;
    const active = String(document.querySelector('[data-filter-grade].active')?.dataset.filterGrade || 'all').toLowerCase();
    row.innerHTML = '';
    const keys = ['all'].concat(BUILTIN_KEYS).concat(getCustomClasses().map((c) => c && c.key).filter(Boolean));
    uniqueKeys(keys).forEach((key) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'level-btn';
      btn.dataset.filterGrade = key;
      btn.textContent = key === 'all' ? 'All' : gradeLabel(key);
      if (key === active || (!active && key === 'all')) btn.classList.add('active');
      row.appendChild(btn);
    });
    if (!row.querySelector('.active')) row.querySelector('[data-filter-grade="all"]')?.classList.add('active');
    if (typeof window.wireQuestionFilterButtons === 'function') window.wireQuestionFilterButtons();
  }

  window.wireQuestionFilterButtons = function(){
    document.querySelectorAll('[data-filter-grade]').forEach((btn) => {
      if (btn.dataset.kgFullGradeWired === '1') return;
      btn.dataset.kgFullGradeWired = '1';
      btn.addEventListener('click', function(e){
        e.preventDefault();
        e.stopPropagation();
        if (typeof window.filterQuestionCards === 'function') window.filterQuestionCards(String(btn.dataset.filterGrade || 'all').toLowerCase());
      });
    });
    ['qSearchInput','qSkillFilterInput','qClassFilterInput'].forEach((id) => {
      const el = document.getElementById(id);
      if (!el || el.dataset.kgFullGradeWired === '1') return;
      el.dataset.kgFullGradeWired = '1';
      el.addEventListener('input', function(){
        if (typeof window.filterQuestionCards === 'function') window.filterQuestionCards(String(document.querySelector('[data-filter-grade].active')?.dataset.filterGrade || 'all').toLowerCase());
      });
    });
  };

  function questionEditorContext(question){
    const meta = question && question._meta ? question._meta : {};
    const gradeKey = String(meta.grade || question?.grade || '').trim().toLowerCase();
    const kind = gradeKind(gradeKey);
    const metaInfo = gradeMeta(gradeKey);
    return {
      gradeKey: gradeKey,
      gradeLabel: metaInfo.label,
      kind: kind,
      kindLabel: kind === 'class' ? 'CLASS' : (kind === 'grade' ? 'GRADE' : 'KG')
    };
  }

  window.questionEditorCard = function(question){
    const meta = question._meta || {};
    const ctx = questionEditorContext(question);
    const opts = (question.options || []).join(' | ');
    const srcLabel = meta.source === 'base' ? 'Base' : 'Custom';
    const secondChip = '<span class="class-chip">' + escapeHtml(ctx.gradeLabel) + '</span>';
    return '' +
      '<div class="question-edit-card" data-qid="' + escapeHtml(meta.id || '') + '" data-grade="' + escapeHtml(ctx.gradeKey) + '" data-grade-key="' + escapeHtml(ctx.gradeKey) + '" data-class-label="' + escapeHtml(ctx.gradeLabel) + '">' +
        '<div class="meta-line">' +
          '<span class="class-chip">' + escapeHtml(ctx.kindLabel) + '</span>' +
          secondChip +
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

  function collectEditorQuestions(){
    let items = [];
    allGradeKeys().forEach((key) => {
      try {
        if (typeof window.collectQuestionsWithMeta === 'function') items = items.concat(window.collectQuestionsWithMeta(key) || []);
      } catch (e) {}
    });
    if (typeof window.applyQuestionOverrides === 'function') items = items.map(window.applyQuestionOverrides);
    return items.filter((q) => !(q && q._deleted));
  }

  window.renderStoredQuestions = function(){
    const list = document.getElementById('storedQuestionsList');
    const countEl = document.getElementById('questionResultsCount');
    const noEl = document.getElementById('questionNoResults');
    if (!list) return;
    const items = collectEditorQuestions();
    list.innerHTML = items.length ? items.map(window.questionEditorCard).join('') : '<div class="stored-question"><h4>No questions yet.</h4><p>Add questions from the editor above.</p></div>';
    if (typeof window.bindQuestionEditorActions === 'function') window.bindQuestionEditorActions();
    renderQuestionFilterButtons();
    if (typeof window.filterQuestionCards === 'function') {
      const active = String(document.querySelector('[data-filter-grade].active')?.dataset.filterGrade || 'all').toLowerCase();
      window.filterQuestionCards(active);
    }
    const visibleCount = list.querySelectorAll('.question-edit-card').length;
    if (countEl) countEl.textContent = visibleCount + ' questions found';
    if (noEl) noEl.classList.toggle('hidden', visibleCount > 0);
  };

  const prevAddCustomQuestion = window.addCustomQuestion;
  window.addCustomQuestion = function(){
    syncNewQuestionGradeSelect();
    const gradeEl = document.getElementById('newQGrade');
    const raw = String(gradeEl?.value || '').trim().toLowerCase();
    if (!raw || !BUILTIN_KEYS.includes(raw)){
      alert(textFor('Please choose a grade from KG1 to Grade 6.', 'اختر الصف من KG1 إلى Grade 6.'));
      return;
    }
    if (prevAddCustomQuestion) return prevAddCustomQuestion();
  };

  function allAvailableQuestionsPatched(){
    let pool = [];
    allGradeKeys().forEach((key) => {
      try {
        if (typeof window.collectQuestionsWithMeta === 'function') {
          (window.collectQuestionsWithMeta(key) || []).forEach((q) => {
            const patched = (typeof window.applyQuestionOverrides === 'function') ? window.applyQuestionOverrides(q) : q;
            if (patched && !patched._deleted) pool.push(Object.assign({}, patched, { __grade: key }));
          });
        } else if (typeof window.allQuestionsFor === 'function') {
          (window.allQuestionsFor(key) || []).forEach((q) => pool.push(Object.assign({}, q, { __grade: key })));
        }
      } catch (e) {}
    });
    return pool;
  }

  function renderClassQuestionPickerPatched(){
    if (document.body.dataset.page !== 'admin') return;
    const wrap = document.getElementById('classExistingWrap');
    const list = document.getElementById('classQuestionPickerList');
    const mode = document.getElementById('classSourceMode');
    const uploadWrap = document.getElementById('classUploadWrap');
    if (!wrap || !list || !mode || !uploadWrap) return;
    const useExisting = mode.value === 'existing';
    wrap.classList.toggle('hidden', !useExisting);
    uploadWrap.classList.toggle('hidden', useExisting);
    if (!useExisting) return;
    const pool = allAvailableQuestionsPatched();
    list.innerHTML = pool.length ? pool.map((q, idx) => {
      return '<label class="teacher-question-row">' +
        '<input type="checkbox" class="class-question-check" data-grade="' + escapeHtml(q.__grade) + '" data-question-text="' + escapeHtml(q.text) + '">' +
        '<span><strong>' + (idx + 1) + '. ' + escapeHtml(q.text) + '</strong>' +
        '<span class="teacher-question-meta">' + escapeHtml(gradeLabel(q.__grade) + ' • ' + (q.skill || 'Skill') + ' • ' + (q.answer || '')) + '</span></span>' +
      '</label>';
    }).join('') : '<div class="picker-empty">' + escapeHtml(textFor('No questions available.', 'لا توجد أسئلة متاحة.')) + '</div>';
  }

  function saveClassFromAdminPatched(){
    if (document.body.dataset.page !== 'admin') return;
    const nameEl = document.getElementById('classNameInput');
    const descEl = document.getElementById('classDescInput');
    const modeEl = document.getElementById('classSourceMode');
    const countEl = document.getElementById('classQuestionCount');
    if (!nameEl || !descEl || !modeEl) return;
    const name = nameEl.value.trim();
    if (!name){
      alert(textFor('Please enter a class name.', 'من فضلك أدخل اسم الفصل.'));
      return;
    }
    let key = slugify(name);
    const classes = getCustomClasses().slice();
    const existing = classes.find((c) => c && (c.key === key || String(c.name || '').trim().toLowerCase() === name.toLowerCase()));
    if (existing) key = existing.key;
    const meta = existing || { key: key, name: name, description: '', image: 'assets/svg/school.svg', questionCount: 0 };
    meta.name = name;
    meta.description = descEl.value.trim();
    meta.questionCount = Number(countEl?.value || 0) || 0;
    meta.hidden = !!document.getElementById('classHiddenToggle')?.checked;
    const mode = modeEl.value;
    const customQ = ensureQuestionMap(readJson(KEY_CUSTOM_Q, {}));
    const finalize = function(){
      const idx = classes.findIndex((c) => c && c.key === key);
      if (idx >= 0) classes[idx] = meta; else classes.push(meta);
      if (typeof window.setCustomClasses === 'function') window.setCustomClasses(classes);
      else writeJson(KEY_CLASSES, classes);
      if (!Array.isArray(customQ[key])) customQ[key] = [];
      writeJson(KEY_CUSTOM_Q, customQ);
      if (typeof window.renderStoredQuestions === 'function') window.renderStoredQuestions();
      syncTeacherGradeSelect();
      renderQuestionFilterButtons();
      alert(textFor('Class saved.', 'تم حفظ الفصل.'));
    };

    if (mode === 'existing'){
      const selected = Array.from(document.querySelectorAll('.class-question-check:checked')).map((ch) => ({ grade: ch.dataset.grade, text: ch.dataset.questionText }));
      if (!selected.length){
        alert(textFor('Please choose at least one source question.', 'اختر سؤالاً واحداً على الأقل.'));
        return;
      }
      const allPool = allAvailableQuestionsPatched();
      customQ[key] = selected.map((sel) => {
        const found = allPool.find((item) => String(item.text).trim() === String(sel.text).trim() && String(item.__grade) === String(sel.grade));
        if (!found) return null;
        const cloned = JSON.parse(JSON.stringify(found));
        delete cloned.__grade;
        delete cloned._meta;
        delete cloned._deleted;
        cloned.grade = name.toUpperCase();
        return cloned;
      }).filter(Boolean);
      writeJson(KEY_CUSTOM_Q, customQ);
      finalize();
      return;
    }

    const file = document.getElementById('classQuestionUpload')?.files?.[0];
    if (!file){
      alert(textFor('Please choose a source file.', 'اختر ملف المصدر.'));
      return;
    }
    if (typeof XLSX === 'undefined'){
      alert('xlsx not loaded');
      return;
    }
    const reader = new FileReader();
    reader.onload = function(e){
      try {
        const wb = XLSX.read(e.target.result, {type:'binary'});
        const sheet = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(sheet, {defval:''});
        if (!Array.isArray(customQ[key])) customQ[key] = [];
        rows.forEach((r) => {
          const text = String(r['Question'] || '').trim();
          const options = [r['Choice 1'], r['Choice 2'], r['Choice 3'], r['Choice 4']].map((v) => String(v || '').trim()).filter(Boolean);
          const answer = String(r['Correct Answer'] || '').trim();
          if (!text || options.length < 2 || !answer || !options.includes(answer)) return;
          customQ[key].push({
            grade: name.toUpperCase(),
            text: text,
            options: options,
            answer: answer,
            skill: String(r['Skill (optional)'] || 'Vocabulary').trim() || 'Vocabulary',
            type: String(r['Type (optional)'] || 'Choice').trim() || 'Choice',
            image: String(r['Image (optional)'] || '').trim() || null,
            difficulty: Math.max(1, Math.min(3, Number(r['Difficulty 1-3 (optional)'] || 1))),
            note: String(r['Note (optional)'] || '').trim() || ''
          });
        });
        writeJson(KEY_CUSTOM_Q, customQ);
        finalize();
      } catch (err) {
        console.error(err);
        alert(textFor('Could not import class workbook.', 'تعذر استيراد ملف الفصل.'));
      }
    };
    reader.readAsBinaryString(file);
  }

  function rewireClassManager(){
    if (document.body.dataset.page !== 'admin') return;
    const saveBtn = document.getElementById('saveClassBtn');
    if (saveBtn && saveBtn.dataset.kgFullGradePatched !== '1'){
      const clone = saveBtn.cloneNode(true);
      clone.dataset.kgFullGradePatched = '1';
      saveBtn.parentNode.replaceChild(clone, saveBtn);
      clone.addEventListener('click', saveClassFromAdminPatched);
    }
    const mode = document.getElementById('classSourceMode');
    if (mode && mode.dataset.kgFullGradePatched !== '1'){
      const clone = mode.cloneNode(true);
      clone.dataset.kgFullGradePatched = '1';
      mode.parentNode.replaceChild(clone, mode);
      clone.addEventListener('change', renderClassQuestionPickerPatched);
    }
    const selectAllBtn = document.getElementById('selectAllClassQuestionsBtn');
    if (selectAllBtn && selectAllBtn.dataset.kgFullGradePatched !== '1') {
      selectAllBtn.dataset.kgFullGradePatched = '1';
      selectAllBtn.addEventListener('click', function(){
        document.querySelectorAll('.class-question-check').forEach((ch) => { ch.checked = true; });
      });
    }
    const clearBtn = document.getElementById('clearClassQuestionsBtn');
    if (clearBtn && clearBtn.dataset.kgFullGradePatched !== '1') {
      clearBtn.dataset.kgFullGradePatched = '1';
      clearBtn.addEventListener('click', function(){
        document.querySelectorAll('.class-question-check').forEach((ch) => { ch.checked = false; });
      });
    }
    renderClassQuestionPickerPatched();
  }

  const prevRenderTeacherTestEditor = window.renderTeacherTestEditor;
  window.renderTeacherTestEditor = function(){
    if (prevRenderTeacherTestEditor) prevRenderTeacherTestEditor();
    syncTeacherGradeSelect();
  };

  function rewireAdminButtons(){
    const addBtn = document.getElementById('addQuestionBtn');
    if (addBtn && addBtn.dataset.kgFullGradePatched !== '1') {
      const clone = addBtn.cloneNode(true);
      clone.dataset.kgFullGradePatched = '1';
      addBtn.parentNode.replaceChild(clone, addBtn);
      clone.addEventListener('click', function(){ if (typeof window.addCustomQuestion === 'function') window.addCustomQuestion(); });
    }
    const showBtn = document.getElementById('showStoredQuestionsBtn');
    if (showBtn && showBtn.dataset.kgFullGradePatched !== '1') {
      const clone = showBtn.cloneNode(true);
      clone.dataset.kgFullGradePatched = '1';
      showBtn.parentNode.replaceChild(clone, showBtn);
      clone.addEventListener('click', function(){ if (typeof window.renderStoredQuestions === 'function') window.renderStoredQuestions(); });
    }
  }

  function runAdminRefresh(){
    syncNewQuestionGradeSelect();
    syncTeacherGradeSelect();
    renderQuestionFilterButtons();
    rewireAdminButtons();
    rewireClassManager();
    if (document.getElementById('storedQuestionsList') && typeof window.renderStoredQuestions === 'function') window.renderStoredQuestions();
  }


  function levelCounts(){ return [10,20,30,40,50]; }
  function localizedLevelLabel(count){
    const labels = {10:'Level 1 (10)',20:'Level 2 (20)',30:'Level 3 (30)',40:'Level 4 (40)',50:'Level 5 (50)'};
    const labelsAr = {10:'المستوى 1 (10)',20:'المستوى 2 (20)',30:'المستوى 3 (30)',40:'المستوى 4 (40)',50:'المستوى 5 (50)'};
    return (typeof window.getLang === 'function' && window.getLang() === 'ar') ? labelsAr[count] : labels[count];
  }
  function updateAdminLevelTimerCopy(){
    const levelNote = document.querySelector('#levelVisibilityBody .muted-note[data-i18n="chooseWhichLevels"]');
    if (levelNote) levelNote.textContent = textFor('Choose which quiz levels students can see for each grade from KG1 to Grade 6 and for custom classes.', 'اختر مستويات الاختبار التي يمكن للطلاب رؤيتها لكل صف من KG1 حتى Grade 6 وللفصول المخصصة.');
    const timerNote = document.querySelector('#timerSettingsBody .muted-note[data-i18n="timerInfo"]');
    if (timerNote) timerNote.textContent = textFor('Turn the timer on or off for each grade from KG1 to Grade 6 and for custom classes. When timer is off, students answer without countdown and each correct answer gives fixed points.', 'يمكنك تشغيل أو إيقاف المؤقت لكل صف من KG1 حتى Grade 6 وللفصول المخصصة. عند إيقافه يجيب الطالب بدون عد تنازلي وتحصل كل إجابة صحيحة على نقاط ثابتة.');
  }

  window.renderLevelVisibilityEditor = function(){
    const wrap = document.getElementById('adminLevelVisibility');
    if (!wrap) return;
    updateAdminLevelTimerCopy();
    const cfg = ensureLevelMap(window.getLevelVisibility ? window.getLevelVisibility() : {});
    const keys = allGradeKeys();
    wrap.innerHTML = keys.length ? keys.map(function(grade){
      const visible = new Set(Array.isArray(cfg[grade]) ? cfg[grade].map(Number) : levelCounts());
      return '<div class="level-visibility-card"><h3>' + escapeHtml(gradeLabel(grade)) + '</h3><div class="level-visibility-list">' +
        levelCounts().map(function(count){
          return '<label class="level-toggle"><input type="checkbox" data-level-grade="' + escapeHtml(grade) + '" value="' + count + '" ' + (visible.has(count) ? 'checked' : '') + '> <span>' + escapeHtml(localizedLevelLabel(count)) + '</span></label>';
        }).join('') + '</div></div>';
    }).join('') : '<div class="muted-note">' + escapeHtml(textFor('No grades or classes available.', 'لا توجد صفوف أو فصول متاحة.')) + '</div>';
  };

  window.saveLevelVisibilityFromAdmin = function(){
    const keys = allGradeKeys();
    const result = ensureLevelMap({});
    keys.forEach(function(key){ result[key] = []; });
    document.querySelectorAll('#adminLevelVisibility input[type="checkbox"][data-level-grade]').forEach(function(input){
      if (!result[input.dataset.levelGrade]) result[input.dataset.levelGrade] = [];
      if (input.checked) result[input.dataset.levelGrade].push(Number(input.value));
    });
    const emptyKey = keys.find(function(key){ return !Array.isArray(result[key]) || !result[key].length; });
    if (emptyKey){
      alert(textFor('Keep at least one visible level for ' + gradeLabel(emptyKey) + '.', 'يجب إبقاء مستوى واحد على الأقل ظاهرًا لـ ' + gradeLabel(emptyKey) + '.'));
      return;
    }
    keys.forEach(function(key){ result[key] = Array.from(new Set((result[key] || []).map(Number))).sort(function(a,b){ return a-b; }); });
    if (typeof window.setLevelVisibility === 'function') window.setLevelVisibility(result);
    window.renderLevelVisibilityEditor();
    alert(textFor('Level visibility saved.', 'تم حفظ إعدادات إظهار المستويات.'));
  };

  window.resetLevelVisibilityFromAdmin = function(){
    const defaults = ensureLevelMap({});
    if (typeof window.setLevelVisibility === 'function') window.setLevelVisibility(defaults);
    window.renderLevelVisibilityEditor();
  };

  window.renderTimerSettingsEditor = function(){
    const wrap = document.getElementById('adminTimerSettings');
    if (!wrap) return;
    updateAdminLevelTimerCopy();
    const cfg = ensureTimerMap(window.getTimerSettings ? window.getTimerSettings() : {});
    const keys = allGradeKeys();
    wrap.innerHTML = keys.length ? keys.map(function(grade){
      const enabled = cfg[grade] !== false;
      return '<div class="level-visibility-card"><h3>' + escapeHtml(gradeLabel(grade)) + '</h3><label class="level-toggle admin-toggle-row"><input type="checkbox" data-timer-grade="' + escapeHtml(grade) + '" ' + (enabled ? 'checked' : '') + '><span>' + escapeHtml(enabled ? textFor('Timer enabled', 'المؤقت يعمل') : textFor('Timer disabled', 'المؤقت متوقف')) + '</span></label></div>';
    }).join('') : '<div class="muted-note">' + escapeHtml(textFor('No grades or classes available.', 'لا توجد صفوف أو فصول متاحة.')) + '</div>';
    wrap.querySelectorAll('input[data-timer-grade]').forEach(function(input){
      input.addEventListener('change', function(){
        const span = input.closest('label') && input.closest('label').querySelector('span');
        if (span) span.textContent = input.checked ? textFor('Timer enabled', 'المؤقت يعمل') : textFor('Timer disabled', 'المؤقت متوقف');
      });
    });
  };

  window.saveTimerSettingsFromAdmin = function(){
    const keys = allGradeKeys();
    const result = ensureTimerMap({});
    keys.forEach(function(key){ result[key] = true; });
    document.querySelectorAll('#adminTimerSettings input[type="checkbox"][data-timer-grade]').forEach(function(input){
      result[input.dataset.timerGrade] = !!input.checked;
    });
    if (typeof window.setTimerSettings === 'function') window.setTimerSettings(result);
    window.renderTimerSettingsEditor();
    alert(textFor('Timer settings saved.', 'تم حفظ إعدادات المؤقت.'));
  };

  window.resetTimerSettingsFromAdmin = function(){
    const defaults = ensureTimerMap({});
    if (typeof window.setTimerSettings === 'function') window.setTimerSettings(defaults);
    window.renderTimerSettingsEditor();
  };

  window.addEventListener('load', function(){
    ensureQuestionMap(readJson(KEY_CUSTOM_Q, {}));
    if (document.body.dataset.page === 'admin') runAdminRefresh();
  });
  document.addEventListener('DOMContentLoaded', function(){
    if (document.body.dataset.page === 'admin') runAdminRefresh();
  });
})();
