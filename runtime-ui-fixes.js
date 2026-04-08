(function(){
  function lang(){ return (typeof getLang === 'function' ? getLang() : (localStorage.getItem('kgQuizLang') || 'en')) === 'ar' ? 'ar' : 'en'; }
  function t(key, fallback){
    const dict = (window.translations && window.translations[lang()]) || {};
    return dict[key] || fallback || key;
  }
  function normGrade(value){
    const v = String(value || '').trim().toLowerCase();
    if (!v || v === 'all') return 'all';
    return v.replace(/\s+/g,'').replace(/^grade(\d)$/,'grade$1').replace(/^grade-(\d)$/,'grade$1');
  }
  function prettyGrade(key){
    const k = normGrade(key);
    if (k === 'kg1') return 'KG1';
    if (k === 'kg2') return 'KG2';
    const m = k.match(/^grade(\d)$/);
    if (m) return 'Grade ' + m[1];
    return key;
  }
  function allPasswordKeys(){
    const keys = ['kg1','kg2','grade1','grade2','grade3','grade4','grade5','grade6'];
    try {
      const classes = typeof window.getCustomClasses === 'function' ? (window.getCustomClasses() || []) : [];
      classes.forEach(cls => { if (cls && cls.key) keys.push(String(cls.key).trim().toLowerCase()); });
    } catch (e) {}
    return Array.from(new Set(keys.filter(Boolean)));
  }
  function ensureQuizTranslations(){
    if (!window.translations) return;
    const en = window.translations.en || (window.translations.en = {});
    const ar = window.translations.ar || (window.translations.ar = {});
    Object.assign(en, {
      studentIdOptional: 'Student ID (optional)',
      classCourse: 'Class / Course',
      outsideStudent: 'I am not in your class / course / school',
      studentIdentityNote: 'Name is required. Student ID is optional. Class is required unless the outside-student option is checked.',
      classRequired: 'Please enter the class or course, or check the outside-student option.',
      dynamicPasswordInfo: 'Set a password for any grade or class. New built-in grades and custom classes appear here automatically. Students will be asked for it before entering the quiz. Leave blank to disable password.',
      noQuestionsFound: 'No questions found.',
      noQuestionsYet: 'No questions yet.',
      addQuestionsAbove: 'Add questions from the editor above.'
    });
    Object.assign(ar, {
      studentIdOptional: 'كود الطالب (اختياري)',
      classCourse: 'الصف / الكورس',
      outsideStudent: 'أنا لست ضمن صفك / كورسك / مدرستك',
      studentIdentityNote: 'الاسم مطلوب. كود الطالب اختياري. الصف / الكورس مطلوب إلا إذا تم اختيار أنك من خارج الصف / الكورس / المدرسة.',
      classRequired: 'من فضلك أدخل الصف أو الكورس أو فعّل خيار أنك لست ضمن الصف / الكورس / المدرسة.',
      dynamicPasswordInfo: 'اضبط كلمة مرور لأي صف أو فصل. ستظهر هنا تلقائيًا الصفوف الأساسية والفصول المخصصة الجديدة. سيُطلب من الطلاب إدخالها قبل دخول الاختبار. اترك الحقل فارغًا لتعطيل كلمة المرور.',
      noQuestionsFound: 'لا توجد أسئلة.',
      noQuestionsYet: 'لا توجد أسئلة بعد.',
      addQuestionsAbove: 'أضف الأسئلة من المحرر بالأعلى.'
    });
  }
  function translateIdentityFields(){
    const idInput = document.getElementById('studentId');
    const classInput = document.getElementById('studentClass');
    const guest = document.getElementById('studentGuest');
    const guestText = guest && guest.parentNode ? guest.parentNode.querySelector('span') : null;
    const note = document.querySelector('.student-cloud-note');
    if (idInput) idInput.placeholder = t('studentIdOptional', 'Student ID (optional)');
    if (classInput) classInput.placeholder = t('classCourse', 'Class / Course');
    if (guestText) guestText.textContent = t('outsideStudent', 'I am not in your class / course / school');
    if (note) note.textContent = t('studentIdentityNote', 'Name is required. Student ID is optional. Class is required unless the outside-student option is checked.');
  }
  function forceQuizIdentity(){
    if (!document.body || document.body.dataset.page !== 'quiz') return;
    const grade = String(document.body.dataset.grade || new URLSearchParams(location.search).get('grade') || '').trim();
    if (!grade || !window.studentCloud || typeof window.studentCloud.ensureQuizIdentityFields !== 'function') return;
    window.studentCloud.ensureQuizIdentityFields(grade.toUpperCase());
    translateIdentityFields();
  }
      const text = (el.textContent || '').toLowerCase();
        const card = el.closest('.card') || el;
        card.style.display = 'none';
      }
    });
    document.querySelectorAll('h2, h3').forEach(el => {
      const text = (el.textContent || '').trim().toLowerCase();
        const card = el.closest('.card') || el.parentElement;
        if (card) card.style.display = 'none';
      }
    });
  }
  function rebuildQuizAccess(){
    if (!document.body || document.body.dataset.page !== 'admin') return;
    const body = document.getElementById('quizAccessBody');
    if (!body) return;
    const cfg = (typeof getQuizAccess === 'function' ? getQuizAccess() : {}) || {};
    const info = body.querySelector('p');
    if (info) info.textContent = t('dynamicPasswordInfo', info.textContent);
    let grid = body.querySelector('.quiz-access-grid-dynamic');
    if (!grid) {
      const oldBoxes = body.querySelectorAll('.quiz-access-grid, .quiz-password-grid, .quiz-password-cards');
      oldBoxes.forEach(el => el.remove());
      grid = document.createElement('div');
      grid.className = 'quiz-access-grid-dynamic';
      grid.style.display = 'grid';
      grid.style.gridTemplateColumns = 'repeat(auto-fit,minmax(280px,1fr))';
      grid.style.gap = '16px';
      body.insertBefore(grid, document.getElementById('saveQuizPasswordBtn'));
    }
    const keys = allPasswordKeys();
    grid.innerHTML = keys.map(key => {
      const rec = cfg[key] || {enabled:false,password:''};
      const label = prettyGrade(key);
      return '<div class="admin-subcard">' +
        '<h3>' + label + '</h3>' +
        '<label class="toggle-row"><input type="checkbox" id="quizPasswordEnabled_' + key + '" ' + (rec.enabled ? 'checked' : '') + '><span>' + (lang()==='ar' ? ('حماية ' + label + ' بكلمة مرور') : ('Protect ' + label + ' with password')) + '</span></label>' +
        '<input id="quizPasswordValue_' + key + '" placeholder="' + (lang()==='ar' ? ('كلمة مرور ' + label) : (label + ' password')) + '" value="' + String(rec.password || '').replace(/&/g,'&amp;').replace(/"/g,'&quot;') + '">' +
      '</div>';
    }).join('');
  }
  function patchQuizAccessFns(){
    if (typeof window.renderQuizAccessEditor === 'function') {
      const orig = window.renderQuizAccessEditor;
      window.renderQuizAccessEditor = function(){ try { orig(); } catch(e){} rebuildQuizAccess(); };
    }
    window.saveQuizAccessFromAdmin = function(){
      const next = {};
      allPasswordKeys().forEach(key => {
        const enabled = document.getElementById('quizPasswordEnabled_' + key);
        const value = document.getElementById('quizPasswordValue_' + key);
        next[key] = { enabled: !!(enabled && enabled.checked && value && value.value.trim()), password: value && value.value.trim() || '' };
      });
      if (typeof setQuizAccess === 'function') setQuizAccess(next);
      rebuildQuizAccess();
      alert(lang()==='ar' ? 'تم حفظ كلمات مرور الاختبارات.' : 'Quiz password settings saved.');
    };
    window.clearQuizAccessFromAdmin = function(){
      if (typeof setQuizAccess === 'function') setQuizAccess({});
      rebuildQuizAccess();
    };
  }
  function rebuildStoredQuestions(){
    if (!document.body || document.body.dataset.page !== 'admin') return;
    const list = document.getElementById('storedQuestionsList');
    const count = document.getElementById('questionResultsCount');
    const noRes = document.getElementById('questionNoResults');
    if (!list || typeof window.collectQuestionsWithMeta !== 'function' || typeof window.applyQuestionOverrides !== 'function') return;
    let items = [];
    const builtins = ['kg1','kg2','grade1','grade2','grade3','grade4','grade5','grade6'];
    builtins.forEach(key => { try { items = items.concat(window.collectQuestionsWithMeta(key)); } catch(e){} });
    try {
      const classes = typeof window.getCustomClasses === 'function' ? (window.getCustomClasses() || []) : [];
      classes.forEach(cls => { if (cls && cls.key) items = items.concat(window.collectQuestionsWithMeta(cls.key)); });
    } catch(e){}
    const dedupe = new Set();
    items = items.map(window.applyQuestionOverrides).filter(q => {
      if (!q || q._deleted) return false;
      const sig = String((q._meta && q._meta.id) || q.text || Math.random());
      if (dedupe.has(sig)) return false;
      dedupe.add(sig);
      return true;
    });
    list.innerHTML = items.length ? items.map(window.questionEditorCard).join('') : '<div class="stored-question"><h4>' + t('noQuestionsYet','No questions yet.') + '</h4><p>' + t('addQuestionsAbove','Add questions from the editor above.') + '</p></div>';
    if (typeof window.bindQuestionEditorActions === 'function') window.bindQuestionEditorActions();
    if (typeof window.wireQuestionFilterButtons === 'function') window.wireQuestionFilterButtons();
    updateQuestionCount();
  }
  function updateQuestionCount(){
    const count = document.getElementById('questionResultsCount');
    const noRes = document.getElementById('questionNoResults');
    if (!count) return;
    const visible = Array.from(document.querySelectorAll('#storedQuestionsList .question-edit-card')).filter(card => card.style.display !== 'none' && !card.hidden).length;
    count.textContent = (lang()==='ar' ? (visible + ' سؤال') : (visible + ' questions found'));
    if (noRes) noRes.classList.toggle('hidden', visible !== 0), noRes.textContent = t('noQuestionsFound', 'No questions found.');
  }
  function patchQuestionFns(){
    if (typeof window.filterQuestionCards === 'function') {
      const orig = window.filterQuestionCards;
      window.filterQuestionCards = function(grade){
        const normalized = normGrade(grade);
        document.querySelectorAll('#storedQuestionsList .question-edit-card').forEach(card => {
          const cardGrade = normGrade(card.dataset.grade || '');
          const show = normalized === 'all' || cardGrade === normalized || prettyGrade(cardGrade).toLowerCase() === String(grade || '').toLowerCase();
          if (card.style.display !== 'none') card.dataset.preFilterVisible = '1';
          card.style.display = show ? '' : 'none';
        });
        document.querySelectorAll('[data-filter-grade]').forEach(btn => btn.classList.toggle('active', normGrade(btn.dataset.filterGrade) === normalized));
        updateQuestionCount();
      };
    }
    const oldRender = window.renderStoredQuestions;
    window.renderStoredQuestions = function(){ rebuildStoredQuestions(); };
  }
  function patchStudentCloud(){
    if (!window.studentCloud || !window.studentCloud.ensureQuizIdentityFields) return;
    const origEnsure = window.studentCloud.ensureQuizIdentityFields;
    window.studentCloud.ensureQuizIdentityFields = function(grade){
      origEnsure(grade);
      translateIdentityFields();
    };
    const origCollect = window.studentCloud.collectIdentity;
    window.studentCloud.collectIdentity = function(grade){
      const name = String(document.getElementById('studentName')?.value || '').trim();
      const studentId = String(document.getElementById('studentId')?.value || '').trim();
      const isGuest = !!document.getElementById('studentGuest')?.checked;
      const className = String(document.getElementById('studentClass')?.value || '').trim();
      if (!name) throw new Error(lang()==='ar' ? 'من فضلك اكتب اسم الطالب أولاً.' : 'Please enter the student name first.');
      if (!isGuest && !className) throw new Error(t('classRequired', 'Please enter the class or course, or check the outside-student option.'));
      return origCollect(grade);
    };
  }
  function patchLang(){
    const orig = window.applyTranslations;
    if (typeof orig === 'function') {
      window.applyTranslations = function(){
        const result = orig.apply(this, arguments);
        ensureQuizTranslations();
        translateIdentityFields();
        rebuildQuizAccess();
        updateQuestionCount();
        return result;
      };
    }
  }
  function run(){
    ensureQuizTranslations();
    patchStudentCloud();
    patchLang();
    patchQuizAccessFns();
    patchQuestionFns();
    forceQuizIdentity();
    rebuildQuizAccess();
    rebuildStoredQuestions();
    updateQuestionCount();
  }
  document.addEventListener('DOMContentLoaded', run);
  window.addEventListener('load', run);
  window.addEventListener('kg:quizmeta', forceQuizIdentity);
})();
