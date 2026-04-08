(function(){
  const BUILTIN_KEYS = ['kg1','kg2','grade1','grade2','grade3','grade4','grade5','grade6'];
  const LABELS = {kg1:'KG1',kg2:'KG2',grade1:'Grade 1',grade2:'Grade 2',grade3:'Grade 3',grade4:'Grade 4',grade5:'Grade 5',grade6:'Grade 6'};

  function readJson(key, fallback){ try { return JSON.parse(localStorage.getItem(key) || 'null') ?? fallback; } catch (_) { return fallback; } }
  function writeJson(key, value){ try { localStorage.setItem(key, JSON.stringify(value)); } catch (_) {} }
  function escapeHtml(text){ return String(text ?? '').replace(/[&<>"']/g, function(ch){ return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[ch]; }); }
  function allKeys(){
    const extra = (typeof window.getCustomClasses === 'function' ? window.getCustomClasses() : readJson('kgEnglishCustomClassesV29', [])) || [];
    return BUILTIN_KEYS.concat(extra.map(function(c){ return c && c.key; }).filter(Boolean));
  }
  function labelFor(key){
    key = String(key || '').toLowerCase();
    if (LABELS[key]) return LABELS[key];
    const extra = (typeof window.getCustomClasses === 'function' ? window.getCustomClasses() : readJson('kgEnglishCustomClassesV29', [])) || [];
    const found = extra.find(function(c){ return c && c.key === key; });
    return found && (found.name || found.label || found.key) || String(key || '').toUpperCase();
  }
  function collectAllQuestions(){
    let items = [];
    allKeys().forEach(function(key){
      try {
        if (typeof window.collectQuestionsWithMeta === 'function') items = items.concat(window.collectQuestionsWithMeta(key) || []);
      } catch (_) {}
    });
    if (typeof window.applyQuestionOverrides === 'function') items = items.map(window.applyQuestionOverrides);
    return items.filter(function(q){ return q && !q._deleted; });
  }
  function activeGradeFilter(){
    const btn = document.querySelector('[data-filter-grade].active');
    return String(btn ? btn.dataset.filterGrade : 'all').toLowerCase();
  }
  function ensureQuestionFilterButtons(){
    const row = document.querySelector('.editor-filters');
    if (!row) return;
    const have = new Set([].slice.call(row.querySelectorAll('[data-filter-grade]')).map(function(btn){ return String(btn.dataset.filterGrade || '').toLowerCase(); }));
    allKeys().forEach(function(key){
      if (have.has(key)) return;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'level-btn';
      btn.dataset.filterGrade = key;
      btn.textContent = labelFor(key);
      row.appendChild(btn);
    });
    if (typeof window.wireQuestionFilterButtons === 'function') window.wireQuestionFilterButtons();
  }
  function updateQuestionCounts(){
    const list = document.getElementById('storedQuestionsList');
    const countEl = document.getElementById('questionResultsCount');
    const noEl = document.getElementById('questionNoResults');
    if (!list) return;
    const shown = list.querySelectorAll('.question-edit-card:not([style*="display: none"])').length;
    if (countEl) countEl.textContent = shown + ' questions found';
    if (noEl) noEl.classList.toggle('hidden', shown > 0);
  }
  function installQuestionRenderer(){
    const list = document.getElementById('storedQuestionsList');
    if (!list) return;
    window.renderStoredQuestions = function(){
      const items = collectAllQuestions();
      list.innerHTML = items.length
        ? items.map(function(q){ return typeof window.questionEditorCard === 'function' ? window.questionEditorCard(q) : ''; }).join('')
        : '<div class="stored-question"><h4>No questions yet.</h4><p>Add questions from the editor above.</p></div>';
      if (typeof window.bindQuestionEditorActions === 'function') window.bindQuestionEditorActions();
      ensureQuestionFilterButtons();
      if (typeof window.filterQuestionCards === 'function') window.filterQuestionCards(activeGradeFilter());
      updateQuestionCounts();
    };
    const prevFilter = window.filterQuestionCards;
    window.filterQuestionCards = function(grade){
      if (typeof prevFilter === 'function') prevFilter(grade);
      updateQuestionCounts();
    };
    window.renderStoredQuestions();
  }
  function ensureIdentityFields(){
    if (document.body.dataset.page !== 'quiz') return;
    const grade = String(new URLSearchParams(location.search).get('grade') || document.body.dataset.grade || '').trim();
    if (!grade) return;
    if (window.studentCloud && typeof window.studentCloud.ensureQuizIdentityFields === 'function') {
      window.studentCloud.ensureQuizIdentityFields(grade.toUpperCase());
    }
  }
  function hideQuickSchoolSnapshot(){
    [].slice.call(document.querySelectorAll('section.card')).forEach(function(sec){
      const h2 = sec.querySelector('h2');
      if (h2 && /quick school snapshot/i.test(h2.textContent || '')) sec.remove();
    });
  }
  function ensureQuizAccessEditor(){
    if (document.body.dataset.page !== 'admin') return;
    const host = document.getElementById('adminQuizAccess');
    if (!host) return;
    const getAccess = typeof window.getQuizAccess === 'function'
      ? window.getQuizAccess
      : function(){ return readJson('kgEnglishQuizAccessV29', {}); };
    const setAccess = typeof window.setQuizAccess === 'function'
      ? window.setQuizAccess
      : function(v){ writeJson('kgEnglishQuizAccessV29', v); };
    window.renderQuizAccessEditor = function(){
      const cfg = getAccess() || {};
      host.innerHTML = allKeys().map(function(key){
        const item = cfg[key] || { enabled:false, password:'' };
        return '<div class="level-visibility-card">' +
          '<h3>' + escapeHtml(labelFor(key)) + '</h3>' +
          '<label class="level-toggle admin-toggle-row"><input type="checkbox" id="quizPasswordEnabled_' + escapeHtml(key) + '"' + (item.enabled ? ' checked' : '') + '><span>Protect ' + escapeHtml(labelFor(key)) + ' with password</span></label>' +
          '<input class="admin-text-input" id="quizPasswordValue_' + escapeHtml(key) + '" placeholder="' + escapeHtml(labelFor(key) + ' password') + '" value="' + escapeHtml(item.password || '') + '">' +
        '</div>';
      }).join('');
    };
    window.saveQuizAccessFromAdmin = function(){
      const next = {};
      allKeys().forEach(function(key){
        const enabled = document.getElementById('quizPasswordEnabled_' + key);
        const value = document.getElementById('quizPasswordValue_' + key);
        const password = String(value && value.value || '').trim();
        next[key] = { enabled: !!(enabled && enabled.checked && password), password: password };
      });
      setAccess(next);
      window.renderQuizAccessEditor();
      alert('Quiz password settings saved.');
    };
    window.clearQuizAccessFromAdmin = function(){
      const next = {};
      allKeys().forEach(function(key){ next[key] = { enabled:false, password:'' }; });
      setAccess(next);
      window.renderQuizAccessEditor();
    };
    window.renderQuizAccessEditor();
  }
  function boot(){
    hideQuickSchoolSnapshot();
    ensureIdentityFields();
    ensureQuizAccessEditor();
    installQuestionRenderer();
  }
  window.addEventListener('load', function(){
    boot();
    setTimeout(boot, 300);
    setTimeout(boot, 1200);
  });
})();
