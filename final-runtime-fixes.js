(function(){
  function onReady(fn){
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn, {once:true});
    else fn();
    window.addEventListener('load', fn);
  }
  function builtInMeta(){
    return {
      kg1:{label:'KG1'}, kg2:{label:'KG2'},
      grade1:{label:'Grade 1'}, grade2:{label:'Grade 2'}, grade3:{label:'Grade 3'},
      grade4:{label:'Grade 4'}, grade5:{label:'Grade 5'}, grade6:{label:'Grade 6'}
    };
  }
  function allGradeKeys(){
    const base = Object.keys(builtInMeta());
    try {
      const classes = (typeof window.getClasses === 'function' ? window.getClasses() : []) || [];
      classes.forEach(cls => { if (cls && cls.key && !base.includes(cls.key)) base.push(String(cls.key).toLowerCase()); });
    } catch (e) {}
    return base;
  }
  function gradeLabel(key){
    const meta = builtInMeta()[String(key||'').toLowerCase()];
    if (meta) return meta.label;
    try {
      const classes = (typeof window.getClasses === 'function' ? window.getClasses() : []) || [];
      const found = classes.find(c => String(c.key||'').toLowerCase() === String(key||'').toLowerCase());
      if (found) return found.name || found.label || found.key;
    } catch (e) {}
    return String(key || '').replace(/^./, s => s.toUpperCase());
  }
  function hideQuickSchoolSnapshot(){
    document.querySelectorAll('#studentSummaryUpgrade, .quick-school-snapshot').forEach(el => { el.remove(); });
    document.querySelectorAll('section.card').forEach(sec => {
      const h2 = sec.querySelector('h2');
      if (h2 && /quick school snapshot/i.test(h2.textContent || '')) sec.remove();
    });
  }
  function ensureQuizIdentityFieldsNow(){
    if (document.body?.dataset?.page !== 'quiz') return;
    const params = new URLSearchParams(location.search);
    const key = String(params.get('grade') || document.body.dataset.grade || '').trim().toLowerCase();
    if (!key) return;
    document.body.dataset.grade = key;
    try {
      if (window.studentCloud && typeof window.studentCloud.ensureQuizIdentityFields === 'function') {
        window.studentCloud.ensureQuizIdentityFields(String(key).toUpperCase());
      }
    } catch (e) {}
    try {
      if (typeof window.initQuiz === 'function' && !document.getElementById('studentClass')) {
        window.initQuiz();
      }
    } catch (e) {}
  }
  function collectEditorQuestions(){
    let items = [];
    allGradeKeys().forEach(key => {
      try {
        if (typeof window.collectQuestionsWithMeta === 'function') items = items.concat(window.collectQuestionsWithMeta(key) || []);
      } catch (e) {}
    });
    if (typeof window.applyQuestionOverrides === 'function') items = items.map(window.applyQuestionOverrides);
    return items.filter(q => q && !q._deleted);
  }
  function rebuildAdminGradeControls(){
    if (document.body?.dataset?.page !== 'admin') return;
    const filterHead = document.querySelector('.section-head.sub-head .editor-filters');
    if (filterHead) {
      filterHead.innerHTML = '';
      const keys = ['all'].concat(allGradeKeys());
      keys.forEach((key, idx) => {
        const btn = document.createElement('button');
        btn.className = 'level-btn' + (idx === 0 ? ' active' : '');
        btn.type = 'button';
        btn.dataset.filterGrade = key;
        btn.textContent = key === 'all' ? 'All' : gradeLabel(key);
        btn.addEventListener('click', function(){
          filterHead.querySelectorAll('[data-filter-grade]').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          if (typeof window.filterQuestionCards === 'function') window.filterQuestionCards(key);
        });
        filterHead.appendChild(btn);
      });
    }
    const input = document.getElementById('newQGrade');
    if (input && input.tagName.toLowerCase() !== 'select') {
      const select = document.createElement('select');
      select.id = 'newQGrade';
      select.className = input.className || '';
      allGradeKeys().forEach(key => {
        const opt = document.createElement('option');
        opt.value = key;
        opt.textContent = gradeLabel(key);
        select.appendChild(opt);
      });
      input.parentNode.replaceChild(select, input);
    } else if (input) {
      const current = input.value;
      input.innerHTML = '';
      allGradeKeys().forEach(key => {
        const opt = document.createElement('option');
        opt.value = key;
        opt.textContent = gradeLabel(key);
        if (key === current) opt.selected = true;
        input.appendChild(opt);
      });
    }
  }
  function patchRenderStoredQuestions(){
    if (document.body?.dataset?.page !== 'admin') return;
    window.renderStoredQuestions = function(){
      const list = document.getElementById('storedQuestionsList');
      const countEl = document.getElementById('questionResultsCount');
      const noEl = document.getElementById('questionNoResults');
      if (!list) return;
      const items = collectEditorQuestions();
      list.innerHTML = items.length ? items.map(window.questionEditorCard || function(q){ return '<div class="stored-question"><h4>' + (q.text||'Question') + '</h4></div>'; }).join('') : '<div class="stored-question"><h4>No questions yet.</h4><p>Add questions from the editor above.</p></div>';
      if (typeof window.bindQuestionEditorActions === 'function') window.bindQuestionEditorActions();
      const active = String(document.querySelector('[data-filter-grade].active')?.dataset.filterGrade || 'all').toLowerCase();
      if (typeof window.filterQuestionCards === 'function') window.filterQuestionCards(active);
      const visibleCount = list.querySelectorAll('.question-edit-card:not(.hidden)').length || (items.length && active === 'all' ? items.length : list.querySelectorAll('.question-edit-card').length);
      if (countEl) countEl.textContent = visibleCount + ' questions found';
      if (noEl) noEl.classList.toggle('hidden', visibleCount > 0);
    };
  }
  function hookAdmin(){
    if (document.body?.dataset?.page !== 'admin') return;
    rebuildAdminGradeControls();
    patchRenderStoredQuestions();
    const btn = document.getElementById('showStoredQuestionsBtn');
    if (btn && !btn.dataset.finalRuntimeFixed) {
      btn.dataset.finalRuntimeFixed = '1';
      btn.addEventListener('click', function(){ setTimeout(function(){ try { window.renderStoredQuestions && window.renderStoredQuestions(); } catch (e) {} }, 0); });
    }
    setTimeout(function(){ try { window.renderStoredQuestions && window.renderStoredQuestions(); } catch (e) {} }, 50);
  }
  function heartbeat(){ hideQuickSchoolSnapshot(); ensureQuizIdentityFieldsNow(); hookAdmin(); }
  onReady(heartbeat);
  setInterval(heartbeat, 1200);
})();
