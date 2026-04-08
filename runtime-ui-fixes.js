
(function(){
  function lang(){
    return ((typeof window.getLang === 'function' ? window.getLang() : (localStorage.getItem('kgQuizLang') || 'en')) === 'ar') ? 'ar' : 'en';
  }
  function t(key, fallback){
    const dict = (window.translations && window.translations[lang()]) || {};
    return dict[key] || fallback || key;
  }
  function normGrade(value){
    const v = String(value || '').trim().toLowerCase();
    if (!v || v === 'all') return 'all';
    return v.replace(/\s+/g,'').replace(/^grade-(\d)$/,'grade$1').replace(/^grade(\d)$/,'grade$1');
  }
  function prettyGrade(key){
    const k = normGrade(key);
    if (k === 'kg1') return 'KG1';
    if (k === 'kg2') return 'KG2';
    const m = k.match(/^grade(\d)$/);
    if (m) return 'Grade ' + m[1];
    return String(key || '').trim() || key;
  }
  function customClassKeys(){
    try {
      if (typeof window.getCustomClasses === 'function') {
        return (window.getCustomClasses() || []).map(function(cls){ return cls && cls.key ? String(cls.key).trim().toLowerCase() : ''; }).filter(Boolean);
      }
    } catch (e) {}
    return [];
  }
  function allGradeKeys(){
    return Array.from(new Set(['kg1','kg2','grade1','grade2','grade3','grade4','grade5','grade6'].concat(customClassKeys())));
  }
  function escapeHtml(v){
    return String(v == null ? '' : v).replace(/[&<>"']/g, function(ch){
      return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[ch];
    });
  }
  function ensureTranslations(){
    if (!window.translations) window.translations = { en:{}, ar:{} };
    const en = window.translations.en || (window.translations.en = {});
    const ar = window.translations.ar || (window.translations.ar = {});
    Object.assign(en, {
      studentIdOptional: 'Student ID (optional)',
      classCourse: 'Class / Course',
      outsideStudent: 'I am not in your class / course / school',
      studentIdentityNote: 'Name is required. Student ID is optional. Class is required unless the outside-student option is checked.',
      classRequired: 'Please enter the class or course, or check the outside-student option.',
      quizPasswordsSaved: 'Quiz password settings saved.',
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
      quizPasswordsSaved: 'تم حفظ كلمات مرور الاختبارات.',
      noQuestionsFound: 'لا توجد أسئلة.',
      noQuestionsYet: 'لا توجد أسئلة بعد.',
      addQuestionsAbove: 'أضف الأسئلة من المحرر بالأعلى.'
    });
  }
  function translateIdentityFields(){
    var idInput = document.getElementById('studentId');
    var classInput = document.getElementById('studentClass');
    var guest = document.getElementById('studentGuest');
    var guestText = guest && guest.parentNode ? guest.parentNode.querySelector('span') : null;
    var note = document.querySelector('.student-cloud-note');
    if (idInput) idInput.placeholder = t('studentIdOptional','Student ID (optional)');
    if (classInput) classInput.placeholder = t('classCourse','Class / Course');
    if (guestText) guestText.textContent = t('outsideStudent','I am not in your class / course / school');
    if (note) note.textContent = t('studentIdentityNote','Name is required. Student ID is optional. Class is required unless the outside-student option is checked.');
  }
  function ensureIdentityFields(){
    if (!document.body || document.body.dataset.page !== 'quiz') return;
    var box = document.querySelector('.student-form-box');
    if (!box) return;
    if (!document.getElementById('studentId')) {
      var wrap = document.createElement('div');
      wrap.className = 'student-cloud-grid';
      wrap.innerHTML =
        '<input id="studentId" maxlength="40">' +
        '<input id="studentClass" maxlength="40">' +
        '<label class="student-cloud-check"><input type="checkbox" id="studentGuest"> <span></span></label>' +
        '<p class="student-cloud-note"></p>';
      var nameInput = document.getElementById('studentName');
      if (nameInput && nameInput.parentNode) nameInput.insertAdjacentElement('afterend', wrap);
      var guest = document.getElementById('studentGuest');
      guest && guest.addEventListener('change', function(){
        var classInput = document.getElementById('studentClass');
        if (classInput) {
          classInput.disabled = !!this.checked;
          if (this.checked) classInput.value = '';
        }
      });
    }
    translateIdentityFields();
  }
  function patchStudentCloud(){
    if (!window.studentCloud) return;
    if (typeof window.studentCloud.ensureQuizIdentityFields === 'function') {
      var origEnsure = window.studentCloud.ensureQuizIdentityFields;
      window.studentCloud.ensureQuizIdentityFields = function(grade){
        try { origEnsure.call(this, grade); } catch (e) {}
        ensureIdentityFields();
      };
    }
    if (typeof window.studentCloud.collectIdentity === 'function') {
      var origCollect = window.studentCloud.collectIdentity;
      window.studentCloud.collectIdentity = function(grade){
        ensureIdentityFields();
        var name = String(document.getElementById('studentName')?.value || '').trim();
        var studentId = String(document.getElementById('studentId')?.value || '').trim();
        var isGuest = !!document.getElementById('studentGuest')?.checked;
        var className = String(document.getElementById('studentClass')?.value || '').trim();
        if (!name) throw new Error(lang() === 'ar' ? 'من فضلك اكتب اسم الطالب أولاً.' : 'Please enter the student name first.');
        if (!isGuest && !className) throw new Error(t('classRequired','Please enter the class or course, or check the outside-student option.'));
        var identity = origCollect.call(this, grade);
        identity.studentId = studentId;
        identity.className = className || 'Guest';
        identity.isGuest = isGuest;
        return identity;
      };
    }
  }
  function hideSnapshot(){
    document.querySelectorAll('h2,h3').forEach(function(el){
      var text = String(el.textContent || '').trim().toLowerCase();
      if (text === 'quick school snapshot') {
        var card = el.closest('.card') || el.parentElement;
        if (card) card.remove();
      }
    });
  }
  function rebuildQuizAccess(){
    if (!document.body || document.body.dataset.page !== 'admin') return;
    var body = document.getElementById('quizAccessBody');
    if (!body) return;
    var cfg = (typeof window.getQuizAccess === 'function' ? window.getQuizAccess() : {}) || {};
    var info = body.querySelector('p');
    if (info) info.textContent = lang() === 'ar'
      ? 'اضبط كلمة مرور لأي صف أو فصل. ستظهر هنا تلقائيًا الصفوف الأساسية والفصول المخصصة الجديدة. سيُطلب من الطلاب إدخالها قبل دخول الاختبار. اترك الحقل فارغًا لتعطيل كلمة المرور.'
      : 'Set a password for any grade or class. New built-in grades and custom classes appear here automatically. Students will be asked for it before entering the quiz. Leave blank to disable password.';
    var saveBtn = document.getElementById('saveQuizPasswordBtn');
    var old = body.querySelector('.quiz-access-grid-dynamic');
    if (old) old.remove();
    var grid = document.createElement('div');
    grid.className = 'quiz-access-grid-dynamic';
    grid.style.display = 'grid';
    grid.style.gridTemplateColumns = 'repeat(auto-fit,minmax(280px,1fr))';
    grid.style.gap = '16px';
    allGradeKeys().forEach(function(key){
      var rec = cfg[key] || { enabled:false, password:'' };
      var label = prettyGrade(key);
      var card = document.createElement('div');
      card.className = 'admin-subcard';
      card.innerHTML = '<h3>' + escapeHtml(label) + '</h3>' +
        '<label class="toggle-row"><input type="checkbox" id="quizPasswordEnabled_' + key + '"' + (rec.enabled ? ' checked' : '') + '><span>' +
        escapeHtml(lang()==='ar' ? ('حماية ' + label + ' بكلمة مرور') : ('Protect ' + label + ' with password')) +
        '</span></label>' +
        '<input id="quizPasswordValue_' + key + '" value="' + escapeHtml(rec.password || '') + '" placeholder="' + escapeHtml(lang()==='ar' ? ('كلمة مرور ' + label) : (label + ' password')) + '">';
      grid.appendChild(card);
    });
    body.insertBefore(grid, saveBtn || body.lastElementChild);
  }
  function patchQuizAccessFns(){
    window.saveQuizAccessFromAdmin = function(){
      var next = {};
      allGradeKeys().forEach(function(key){
        var en = document.getElementById('quizPasswordEnabled_' + key);
        var val = document.getElementById('quizPasswordValue_' + key);
        var password = String(val && val.value || '').trim();
        next[key] = { enabled: !!(en && en.checked && password), password: password };
      });
      if (typeof window.setQuizAccess === 'function') window.setQuizAccess(next);
      rebuildQuizAccess();
      alert(t('quizPasswordsSaved','Quiz password settings saved.'));
    };
    window.clearQuizAccessFromAdmin = function(){
      if (typeof window.setQuizAccess === 'function') window.setQuizAccess({});
      rebuildQuizAccess();
    };
  }
  function ensureQuestionFilters(){
    if (!document.body || document.body.dataset.page !== 'admin') return;
    var row = document.querySelector('.editor-filters');
    if (!row) return;
    if (row.querySelector('[data-filter-grade="Grade 6"]') || row.querySelector('[data-filter-grade="grade6"]')) return;
    var existing = Array.from(row.querySelectorAll('[data-filter-grade]')).map(function(btn){ return normGrade(btn.dataset.filterGrade); });
    allGradeKeys().forEach(function(key){
      if (existing.indexOf(normGrade(key)) !== -1) return;
      var btn = document.createElement('button');
      btn.className = 'level-btn';
      btn.dataset.filterGrade = key;
      btn.textContent = prettyGrade(key);
      row.appendChild(btn);
    });
    if (typeof window.wireQuestionFilterButtons === 'function') window.wireQuestionFilterButtons();
  }
  function collectAllQuestions(){
    var items = [];
    if (typeof window.collectQuestionsWithMeta !== 'function' || typeof window.applyQuestionOverrides !== 'function') return items;
    allGradeKeys().forEach(function(key){
      try { items = items.concat(window.collectQuestionsWithMeta(key)); } catch (e) {}
    });
    var dedupe = new Set();
    return items.map(function(q){ try { return window.applyQuestionOverrides(q); } catch (e) { return q; } }).filter(function(q){
      if (!q || q._deleted) return false;
      var sig = String((q._meta && q._meta.id) || q.id || q.text || Math.random());
      if (dedupe.has(sig)) return false;
      dedupe.add(sig);
      return true;
    });
  }
  function rebuildStoredQuestions(){
    if (!document.body || document.body.dataset.page !== 'admin') return;
    var list = document.getElementById('storedQuestionsList');
    if (!list || typeof window.questionEditorCard !== 'function') return;
    ensureQuestionFilters();
    var items = collectAllQuestions();
    list.innerHTML = items.length ? items.map(function(q){ return window.questionEditorCard(q); }).join('') :
      '<div class="stored-question"><h4>' + escapeHtml(t('noQuestionsYet','No questions yet.')) + '</h4><p>' + escapeHtml(t('addQuestionsAbove','Add questions from the editor above.')) + '</p></div>';
    if (typeof window.bindQuestionEditorActions === 'function') window.bindQuestionEditorActions();
    if (typeof window.wireQuestionFilterButtons === 'function') window.wireQuestionFilterButtons();
    setTimeout(updateQuestionCount, 0);
  }
  function updateQuestionCount(){
    var count = document.getElementById('questionResultsCount');
    var noRes = document.getElementById('questionNoResults');
    var cards = Array.from(document.querySelectorAll('#storedQuestionsList .question-edit-card'));
    var visible = cards.filter(function(card){ return card.offsetParent !== null && !card.hidden && card.style.display !== 'none'; }).length;
    if (count) count.textContent = lang()==='ar' ? (visible + ' سؤال') : (visible + ' questions found');
    if (noRes) {
      noRes.textContent = t('noQuestionsFound','No questions found.');
      noRes.classList.toggle('hidden', visible !== 0);
    }
  }
  function patchQuestionFns(){
    if (typeof window.filterQuestionCards === 'function' && !window.filterQuestionCards.__patchedByRuntime) {
      var orig = window.filterQuestionCards;
      var fn = function(grade){
        var normalized = normGrade(grade);
        document.querySelectorAll('#storedQuestionsList .question-edit-card').forEach(function(card){
          var cardGrade = normGrade(card.dataset.grade || '');
          card.style.display = (normalized === 'all' || cardGrade === normalized) ? '' : 'none';
        });
        document.querySelectorAll('[data-filter-grade]').forEach(function(btn){
          btn.classList.toggle('active', normGrade(btn.dataset.filterGrade) === normalized);
        });
        updateQuestionCount();
      };
      fn.__patchedByRuntime = true;
      window.filterQuestionCards = fn;
    }
    window.renderStoredQuestions = rebuildStoredQuestions;
  }
  function patchLeaderboard(){
    if (!document.body || document.body.dataset.page !== 'play') return;
    if (!window.renderLeaderboard || !window.requestAnimationFrame) return;
    var orig = window.renderLeaderboard;
    window.renderLeaderboard = function(data){
      try { localStorage.setItem('kgPlayLeaderboardCache', JSON.stringify(data || {})); } catch (e) {}
      return orig.apply(this, arguments);
    };
    var body = document.getElementById('playLeaderboardBody');
    if (body && /Loading leaderboard/i.test(body.textContent || '')) {
      try {
        var cached = JSON.parse(localStorage.getItem('kgPlayLeaderboardCache') || 'null');
        if (cached && typeof orig === 'function') orig(cached);
      } catch (e) {}
    }
  }
  function patchEndlessModeUi(){
    if (!document.body || document.body.dataset.page !== 'play') return;
    var endlessCard = Array.from(document.querySelectorAll('.mode-card, .game-mode-card')).find(function(el){
      return /endless/i.test(el.textContent || '');
    });
    if (endlessCard) {
      var desc = endlessCard.querySelector('p, .muted-note, .mode-desc');
      if (desc) desc.textContent = lang()==='ar' ? 'مؤقت تصاعدي يحسب الزمن حتى تنتهي من جميع الأسئلة' : 'Elapsed timer runs until all questions are finished';
    }
  }
  function applyLanguage(){
    ensureTranslations();
    ensureIdentityFields();
    translateIdentityFields();
    rebuildQuizAccess();
    updateQuestionCount();
    patchEndlessModeUi();
    hideSnapshot();
  }
  function run(){
    ensureTranslations();
    ensureIdentityFields();
    patchStudentCloud();
    patchQuizAccessFns();
    patchQuestionFns();
    patchLeaderboard();
    rebuildQuizAccess();
    rebuildStoredQuestions();
    patchEndlessModeUi();
    updateQuestionCount();
    hideSnapshot();
  }
  document.addEventListener('DOMContentLoaded', run);
  window.addEventListener('load', run);
  window.addEventListener('kg:quizmeta', function(){ ensureIdentityFields(); translateIdentityFields(); });
  window.addEventListener('kg:langchange', applyLanguage);
  setTimeout(run, 400);
  setTimeout(run, 1200);
})();
