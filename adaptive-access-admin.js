(function(){
  if (typeof window === 'undefined') return;
  var BUILTIN_KEYS = ['kg1','kg2','grade1','grade2','grade3','grade4','grade5','grade6'];
  var BUILTIN_LABELS = {kg1:'KG1',kg2:'KG2',grade1:'Grade 1',grade2:'Grade 2',grade3:'Grade 3',grade4:'Grade 4',grade5:'Grade 5',grade6:'Grade 6'};
  function esc(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, function(ch){ return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[ch]; }); }
  function lang(){ try { return typeof window.getLang === 'function' ? window.getLang() : 'en'; } catch(e){ return 'en'; } }
  function t(en, ar){ return lang() === 'ar' ? ar : en; }
  function customClasses(){ try { return typeof window.getCustomClasses === 'function' ? (window.getCustomClasses() || []) : []; } catch(e){ return []; } }
  function uniqueKeys(items){ var out=[]; var seen={}; (items||[]).forEach(function(item){ var key=String(item||'').trim().toLowerCase(); if(!key||seen[key]) return; seen[key]=1; out.push(key); }); return out; }
  function allKeys(){ return uniqueKeys(BUILTIN_KEYS.concat(customClasses().map(function(c){ return c && c.key; }))); }
  function labelFor(key){
    key = String(key || '').trim().toLowerCase();
    var found = customClasses().find(function(c){ return c && c.key === key; });
    return (found && (found.name || found.label)) || BUILTIN_LABELS[key] || key.toUpperCase();
  }
  function getAccess(){ try { return typeof window.getQuizAccess === 'function' ? (window.getQuizAccess() || {}) : {}; } catch(e){ return {}; } }
  function setAccess(v){ try { if (typeof window.setQuizAccess === 'function') window.setQuizAccess(v); } catch(e){} }
    var snap = document.getElementById('studentSummaryUpgrade');
    if (snap) snap.remove();
  }
  function accessGrid(){ return document.querySelector('#quizAccessBody .quiz-password-grid'); }
  function updateQuizAccessCopy(){
    var note = document.querySelector('#quizAccessBody .muted-note[data-i18n="setPasswordInfo"]');
    if (note) note.textContent = t('Set a password for any grade or class. New built-in grades and custom classes appear here automatically. Students will be asked for it before entering the quiz. Leave blank to disable password.', 'يمكنك ضبط كلمة مرور لأي صف أو فصل. ستظهر الصفوف والفصول الجديدة هنا تلقائيًا. سيُطلب من الطالب إدخالها قبل بدء الاختبار. اترك الحقل فارغًا لإلغاء كلمة المرور.');
  }
  window.renderQuizAccessEditor = function(){
    updateQuizAccessCopy();
    var grid = accessGrid();
    if (!grid) return;
    var cfg = getAccess();
    var keys = allKeys();
    grid.innerHTML = keys.map(function(key){
      var entry = cfg[key] || {enabled:false,password:''};
      var checked = entry.enabled && entry.password ? ' checked' : '';
      var title = labelFor(key);
      return '<div class="quiz-password-card">'
        + '<h3>' + esc(title) + '</h3>'
        + '<label class="level-toggle admin-toggle-row"><input type="checkbox" data-quiz-access-grade="' + esc(key) + '" data-role="enabled"' + checked + '><span>'
        + esc(t('Protect ' + title + ' with password', 'حماية ' + title + ' بكلمة مرور'))
        + '</span></label>'
        + '<input class="admin-text-input" data-quiz-access-grade="' + esc(key) + '" data-role="password" placeholder="' + esc(t(title + ' password', 'كلمة مرور ' + title)) + '" value="' + esc(entry.password || '') + '">'
        + '</div>';
    }).join('');
  };
  window.saveQuizAccessFromAdmin = function(){
    var next = getAccess();
    allKeys().forEach(function(key){
      var enabled = document.querySelector('[data-quiz-access-grade="' + key.replace(/"/g,'\\"') + '"][data-role="enabled"]');
      var value = document.querySelector('[data-quiz-access-grade="' + key.replace(/"/g,'\\"') + '"][data-role="password"]');
      var password = String(value && value.value || '').trim();
      next[key] = { enabled: !!(enabled && enabled.checked && password), password: password };
    });
    setAccess(next);
    window.renderQuizAccessEditor();
    alert(t('Quiz password settings saved.', 'تم حفظ إعدادات كلمات المرور للاختبارات.'));
  };
  window.clearQuizAccessFromAdmin = function(){
    var next = getAccess();
    allKeys().forEach(function(key){ next[key] = {enabled:false, password:''}; });
    setAccess(next);
    window.renderQuizAccessEditor();
  };
  function boot(){
    updateQuizAccessCopy();
    if (document.body && document.body.dataset && document.body.dataset.page === 'admin') {
      if (document.getElementById('adminPanel') && !document.getElementById('adminPanel').classList.contains('hidden')) window.renderQuizAccessEditor();
    }
  }

  document.addEventListener('click', function(event){
    var btn = event.target && event.target.closest ? event.target.closest('#saveClassBtn') : null;
    if (btn) setTimeout(function(){ try { window.renderQuizAccessEditor(); } catch(e){} }, 50);
  });
  document.addEventListener('DOMContentLoaded', boot);
  window.addEventListener('load', boot);
  document.addEventListener('DOMContentLoaded', function(){ try { mo.observe(document.body, {childList:true, subtree:true}); } catch(e){} });
})();
