(function(){
  if (typeof window === 'undefined') return;
  function qs(sel, root){ return (root||document).querySelector(sel); }
  function qsa(sel, root){ return Array.from((root||document).querySelectorAll(sel)); }
  function page(){ return String(document.body?.dataset?.page || '').toLowerCase(); }
  function currentGrade(){
    const params = new URLSearchParams(location.search);
    const g = String(params.get('grade') || document.body?.dataset?.grade || '').trim().toLowerCase();
    return g;
  }
  function removeQuickSnapshot(){
    if (page() !== 'home') return;
    const direct = document.getElementById('studentSummaryUpgrade');
    if (direct) direct.remove();
    qsa('section.card').forEach((sec) => {
      const h2 = sec.querySelector('h2');
      if (h2 && /quick school snapshot/i.test(h2.textContent || '')) sec.remove();
    });
  }
  function ensureQuizGradeAndFields(){
    if (page() !== 'quiz') return;
    const grade = currentGrade();
    if (grade && !document.body.dataset.grade) document.body.dataset.grade = grade;
    const sc = window.studentCloud;
    if (sc && typeof sc.ensureQuizIdentityFields === 'function' && grade) {
      sc.ensureQuizIdentityFields(String(grade).toUpperCase());
    }
  }
  function patchGoValidation(){
    if (page() !== 'quiz') return;
    const btn = document.getElementById('goToLevelBtn');
    if (!btn || btn.dataset.finalFixValidation === '1') return;
    btn.dataset.finalFixValidation = '1';
    btn.addEventListener('click', function(ev){
      const sc = window.studentCloud;
      const grade = currentGrade();
      if (!sc || typeof sc.collectIdentity !== 'function' || !grade) return;
      try {
        sc.collectIdentity(String(grade).toUpperCase());
      } catch (error) {
        ev.preventDefault();
        ev.stopImmediatePropagation();
        alert(error && error.message ? error.message : 'Please complete the student details.');
      }
    }, true);
  }
  function patchAdminQuestionList(){
    if (page() !== 'admin') return;
    function allKeys(){
      const builtin = ['kg1','kg2','grade1','grade2','grade3','grade4','grade5','grade6'];
      let custom = [];
      try { custom = (window.getCustomClasses?.() || []).map(c => c && c.key).filter(Boolean); } catch (e) {}
      return Array.from(new Set(builtin.concat(custom.map(k => String(k).toLowerCase()))));
    }
    function collect(){
      let items = [];
      allKeys().forEach((key) => {
        try {
          if (typeof window.collectQuestionsWithMeta === 'function') {
            items = items.concat(window.collectQuestionsWithMeta(key) || []);
          } else if (typeof window.allQuestionsFor === 'function') {
            items = items.concat((window.allQuestionsFor(key) || []).map((q, idx) => ({...q, _meta:{id:key+'-'+idx, grade:key, source:'base'}})));
          }
        } catch (e) {}
      });
      if (typeof window.applyQuestionOverrides === 'function') items = items.map(window.applyQuestionOverrides);
      return items.filter(q => !(q && q._deleted));
    }
    function render(){
      const list = document.getElementById('storedQuestionsList');
      const countEl = document.getElementById('questionResultsCount');
      const noEl = document.getElementById('questionNoResults');
      if (!list) return;
      const items = collect();
      if (typeof window.questionEditorCard === 'function') {
        list.innerHTML = items.length ? items.map(window.questionEditorCard).join('') : '<div class="stored-question"><h4>No questions yet.</h4><p>Add questions from the editor above.</p></div>';
        if (typeof window.bindQuestionEditorActions === 'function') window.bindQuestionEditorActions();
      }
      if (typeof window.filterQuestionCards === 'function') {
        const active = String(document.querySelector('[data-filter-grade].active')?.dataset.filterGrade || 'all').toLowerCase();
        window.filterQuestionCards(active);
      }
      const shown = list.querySelectorAll('.question-edit-card').length;
      if (countEl) countEl.textContent = shown + ' questions found';
      if (noEl) noEl.classList.toggle('hidden', shown > 0);
    }
    window.renderStoredQuestions = render;
    setTimeout(render, 150);
    setTimeout(render, 800);
  }
  function boot(){
    removeQuickSnapshot();
    ensureQuizGradeAndFields();
    patchGoValidation();
    patchAdminQuestionList();
  }
  document.addEventListener('DOMContentLoaded', boot);
  window.addEventListener('load', function(){ boot(); setTimeout(boot, 200); setTimeout(boot, 1000); });
  const mo = new MutationObserver(function(){ removeQuickSnapshot(); ensureQuizGradeAndFields(); });
  if (document.documentElement) mo.observe(document.documentElement, {childList:true, subtree:true});
})();
