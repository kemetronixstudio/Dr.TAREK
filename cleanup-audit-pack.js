(function(){
  function unique(list){ const seen = new Set(); return (list || []).filter(v => { const key = String(v || '').trim().toLowerCase(); if (!key || seen.has(key)) return false; seen.add(key); return true; }); }
  function customClasses(){ try { return typeof window.getCustomClasses === 'function' ? (window.getCustomClasses() || []) : []; } catch(e){ return []; } }
  function gradeKeys(){ return unique(['kg1','kg2','grade1','grade2','grade3','grade4','grade5','grade6'].concat(customClasses().map(c => c && c.key).filter(Boolean))); }
  function gradeLabel(key){
    const k = String(key || '').toLowerCase();
    const builtin = { kg1:'KG1', kg2:'KG2', grade1:'Grade 1', grade2:'Grade 2', grade3:'Grade 3', grade4:'Grade 4', grade5:'Grade 5', grade6:'Grade 6' };
    const cls = customClasses().find(c => c && c.key === k);
    return (cls && cls.name) || builtin[k] || String(key || '').toUpperCase();
  }
  function renderQuizAccessEditorDynamic(){
    const body = document.getElementById('quizAccessBody');
    if (!body || document.body.dataset.page !== 'admin') return;
    const cfg = (typeof window.getQuizAccess === 'function') ? window.getQuizAccess() : {};
    const cards = gradeKeys().map(key => {
      const item = cfg[key] || { enabled:false, password:'' };
      return '<div class="admin-level-card-item">' +
        '<h3>' + gradeLabel(key) + '</h3>' +
        '<label class="level-toggle admin-toggle-row"><input type="checkbox" data-quiz-access-enabled="' + key + '" ' + (item.enabled ? 'checked' : '') + '><span>Protect ' + gradeLabel(key) + ' with password</span></label>' +
        '<input class="admin-text-input" data-quiz-access-value="' + key + '" placeholder="' + gradeLabel(key) + ' password" value="' + String(item.password || '').replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;') + '">' +
      '</div>';
    }).join('');
    body.innerHTML = '<p class="muted-note">Set a password for any built-in grade or custom class. Newly added classes appear automatically here.</p><div class="admin-level-grid">' + cards + '</div><div class="action-row"><button class="main-btn" id="saveQuizPasswordBtn" type="button">Save Quiz Password</button></div>';
    document.getElementById('saveQuizPasswordBtn')?.addEventListener('click', function(){
      const next = {};
      gradeKeys().forEach(key => {
        const enabled = document.querySelector('[data-quiz-access-enabled="' + key + '"]');
        const value = document.querySelector('[data-quiz-access-value="' + key + '"]');
        const password = String(value?.value || '').trim();
        next[key] = { enabled: !!enabled?.checked && !!password, password };
      });
      if (typeof window.setQuizAccess === 'function') window.setQuizAccess(next);
      renderQuizAccessEditorDynamic();
      alert('Quiz password settings saved.');
    });
  }
  function clearQuizAccessDynamic(){
    if (typeof window.setQuizAccess !== 'function') return;
    const next = {};
    gradeKeys().forEach(key => next[key] = { enabled:false, password:'' });
    window.setQuizAccess(next);
    renderQuizAccessEditorDynamic();
  }
  function removeQuickSnapshot(){ document.getElementById('studentSummaryUpgrade')?.remove(); }
  function init(){
    removeQuickSnapshot();
    if (document.body.dataset.page === 'admin') {
      renderQuizAccessEditorDynamic();
      document.getElementById('clearQuizPasswordBtn')?.addEventListener('click', function(e){ e.preventDefault(); clearQuizAccessDynamic(); });
    }
  }
  window.addEventListener('load', function(){ setTimeout(init, 250); });
})();
