
(function(){
  if (typeof window === 'undefined') return;
  var BUILTIN_KEYS = ['kg1','kg2','grade1','grade2','grade3','grade4','grade5','grade6'];
  var BUILTIN_LABELS = {
    kg1:'KG1', kg2:'KG2',
    grade1:'Grade 1', grade2:'Grade 2', grade3:'Grade 3', grade4:'Grade 4', grade5:'Grade 5', grade6:'Grade 6'
  };
  function lang(){ try { return typeof window.getLang === 'function' ? window.getLang() : (localStorage.getItem('kgAppLang') || 'en'); } catch(e){ return 'en'; } }
  function t(en, ar){ return lang() === 'ar' ? ar : en; }
  function esc(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, function(m){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]; }); }
  function readJson(key, fallback){ try { var raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : fallback; } catch(e){ return fallback; } }
  function uniq(arr){ var out=[], seen=new Set(); (arr||[]).forEach(function(x){ x=String(x||'').trim().toLowerCase(); if(x && !seen.has(x)){ seen.add(x); out.push(x); }}); return out; }
  function collectCustomClasses(){
    var items = [];
    try {
      if (typeof window.getCustomClasses === 'function') {
        var classes = window.getCustomClasses() || [];
        classes.forEach(function(c){ if (c && (c.key || c.name)) items.push({ key:String(c.key || c.name).trim().toLowerCase(), name:c.name || c.label || c.key }); });
      }
    } catch(e){}
    try {
      var classes2 = readJson('kgEnglishCustomClassesV29', []);
      (classes2 || []).forEach(function(c){ if (c && (c.key || c.name)) items.push({ key:String(c.key || c.name).trim().toLowerCase(), name:c.name || c.label || c.key }); });
    } catch(e){}
    try {
      var qmap = typeof window.getCustomQuestions === 'function' ? window.getCustomQuestions() : {};
      Object.keys(qmap || {}).forEach(function(k){
        if (!BUILTIN_KEYS.includes(String(k).toLowerCase())) items.push({key:String(k).toLowerCase(), name:String(k)});
      });
    } catch(e){}
    try {
      var tests = typeof window.getTeacherTests === 'function' ? window.getTeacherTests() : {};
      Object.keys(tests || {}).forEach(function(k){
        if (!BUILTIN_KEYS.includes(String(k).toLowerCase())) items.push({key:String(k).toLowerCase(), name:String(k)});
      });
    } catch(e){}
    var merged = [];
    var seen = new Set();
    items.forEach(function(c){
      var key = String(c.key||'').trim().toLowerCase();
      if (!key || seen.has(key)) return;
      seen.add(key);
      merged.push({ key:key, name:c.name || key.toUpperCase() });
    });
    return merged;
  }
  function allKeys(){
    var custom = collectCustomClasses().map(function(c){ return c.key; });
    return uniq(BUILTIN_KEYS.concat(custom));
  }
  function labelFor(key){
    key = String(key || '').trim().toLowerCase();
    if (BUILTIN_LABELS[key]) return BUILTIN_LABELS[key];
    var found = collectCustomClasses().find(function(c){ return c.key === key; });
    return found ? String(found.name || key).trim() : key.toUpperCase();
  }

  function ensureTimerMap(base){
    var obj = Object.assign({}, base || {});
    allKeys().forEach(function(k){ if (typeof obj[k] !== 'boolean') obj[k] = true; });
    return obj;
  }
  function ensureAccessMap(base){
    var obj = Object.assign({}, base || {});
    allKeys().forEach(function(k){ if (!obj[k] || typeof obj[k] !== 'object') obj[k] = {enabled:false,password:''}; else { if (typeof obj[k].enabled !== 'boolean') obj[k].enabled = false; if (typeof obj[k].password !== 'string') obj[k].password = ''; } });
    return obj;
  }

  var prevGetTimer = window.getTimerSettings;
  window.getTimerSettings = function(){
    var base = {};
    try { base = prevGetTimer ? prevGetTimer() : readJson('kgEnglishTimerSettingsV23', {}); } catch(e){}
    return ensureTimerMap(base);
  };
  var prevSetTimer = window.setTimerSettings;
  window.setTimerSettings = function(v){
    var next = ensureTimerMap(v);
    if (prevSetTimer) return prevSetTimer(next);
    localStorage.setItem('kgEnglishTimerSettingsV23', JSON.stringify(next));
  };

  var prevGetAccess = window.getQuizAccess;
  window.getQuizAccess = function(){
    var base = {};
    try { base = prevGetAccess ? prevGetAccess() : readJson('kgEnglishQuizAccessV29', {}); } catch(e){}
    return ensureAccessMap(base);
  };
  var prevSetAccess = window.setQuizAccess;
  window.setQuizAccess = function(v){
    var next = ensureAccessMap(v);
    if (prevSetAccess) return prevSetAccess(next);
    sessionStorage.setItem('kgEnglishQuizAccessV29', JSON.stringify(next));
  };

  window.renderTimerSettingsEditor = function(){
    var wrap = document.getElementById('adminTimerSettings');
    if (!wrap) return;
    var note = document.querySelector('#timerSettingsBody .muted-note');
    if (note) note.textContent = t('Turn the timer on or off for each grade from KG1 to Grade 6 and for custom classes. When timer is off, students answer without countdown and each correct answer gives fixed points.','شغّل أو أوقف المؤقت لكل صف من KG1 إلى Grade 6 ولكل الصفوف المخصصة. عند إيقاف المؤقت يجيب الطلاب بدون عدّ تنازلي وتحصل كل إجابة صحيحة على نقاط ثابتة.');
    var cfg = window.getTimerSettings();
    wrap.innerHTML = allKeys().map(function(key){
      var enabled = cfg[key] !== false;
      return '<div class="level-visibility-card">'
        + '<h3>' + esc(labelFor(key)) + '</h3>'
        + '<label class="level-toggle admin-toggle-row">'
        + '<input type="checkbox" data-timer-grade="' + esc(key) + '"' + (enabled ? ' checked' : '') + '>'
        + '<span>' + esc(enabled ? t('Timer enabled','المؤقت يعمل') : t('Timer disabled','المؤقت متوقف')) + '</span>'
        + '</label></div>';
    }).join('');
    wrap.querySelectorAll('input[data-timer-grade]').forEach(function(input){
      input.addEventListener('change', function(){
        var span = input.closest('label') && input.closest('label').querySelector('span');
        if (span) span.textContent = input.checked ? t('Timer enabled','المؤقت يعمل') : t('Timer disabled','المؤقت متوقف');
      });
    });
  };
  window.saveTimerSettingsFromAdmin = function(){
    var result = {};
    allKeys().forEach(function(key){ result[key] = true; });
    document.querySelectorAll('#adminTimerSettings input[data-timer-grade]').forEach(function(input){
      result[String(input.dataset.timerGrade).toLowerCase()] = !!input.checked;
    });
    window.setTimerSettings(result);
    window.renderTimerSettingsEditor();
    alert(t('Timer settings saved.','تم حفظ إعدادات المؤقت.'));
  };
  window.resetTimerSettingsFromAdmin = function(){
    var result = {};
    allKeys().forEach(function(key){ result[key] = true; });
    window.setTimerSettings(result);
    window.renderTimerSettingsEditor();
  };

  window.renderQuizAccessEditor = function(){
    var wrap = document.getElementById('adminQuizAccess');
    if (!wrap) return;
    var note = document.querySelector('#quizAccessBody .muted-note');
    if (note) note.textContent = t('Set a password for any grade or class. New built-in grades and custom classes appear here automatically. Students will be asked for it before entering the quiz. Leave blank to disable password.','اضبط كلمة مرور لأي صف أو فصل. ستظهر الصفوف الأساسية والصفوف المخصصة هنا تلقائيًا. سيُطلب من الطالب إدخالها قبل دخول الاختبار. اترك الحقل فارغًا لإلغاء كلمة المرور.');
    var cfg = window.getQuizAccess();
    wrap.innerHTML = allKeys().map(function(key){
      var rec = cfg[key] || {enabled:false,password:''};
      var label = labelFor(key);
      return '<div class="level-visibility-card">'
        + '<h3>' + esc(label) + '</h3>'
        + '<label class="level-toggle admin-toggle-row">'
        + '<input type="checkbox" id="quizPasswordEnabled_' + esc(key) + '"' + (rec.enabled ? ' checked' : '') + '>'
        + '<span>' + esc(t('Protect ' + label + ' with password', 'حماية ' + label + ' بكلمة مرور')) + '</span>'
        + '</label>'
        + '<input class="admin-text-input" id="quizPasswordValue_' + esc(key) + '" placeholder="' + esc(t(label + ' password', 'كلمة مرور ' + label)) + '" value="' + esc(rec.password || '') + '">'
        + '</div>';
    }).join('');
  };
  window.saveQuizAccessFromAdmin = function(){
    var next = {};
    allKeys().forEach(function(key){
      var enabled = document.getElementById('quizPasswordEnabled_' + key);
      var value = document.getElementById('quizPasswordValue_' + key);
      var pw = value && value.value ? value.value.trim() : '';
      next[key] = { enabled: !!(enabled && enabled.checked && pw), password: pw };
    });
    window.setQuizAccess(next);
    window.renderQuizAccessEditor();
    alert(t('Quiz password settings saved.','تم حفظ إعدادات كلمات مرور الاختبارات.'));
  };
  window.clearQuizAccessFromAdmin = function(){
    var next = {};
    allKeys().forEach(function(key){ next[key] = {enabled:false,password:''}; });
    window.setQuizAccess(next);
    window.renderQuizAccessEditor();
  };

  function refreshAdminEditors(){
    if (!document.body || document.body.dataset.page !== 'admin') return;
    if (document.getElementById('adminTimerSettings')) window.renderTimerSettingsEditor();
    if (document.getElementById('adminQuizAccess')) window.renderQuizAccessEditor();
  }

  document.addEventListener('DOMContentLoaded', function(){
    setTimeout(refreshAdminEditors, 0);
    setTimeout(refreshAdminEditors, 400);
    setTimeout(refreshAdminEditors, 1200);
  });

  window.addEventListener('storage', function(){ setTimeout(refreshAdminEditors, 0); });

  var origInitAdmin = window.initAdmin;
  if (typeof origInitAdmin === 'function') {
    window.initAdmin = function(){
      var result = origInitAdmin.apply(this, arguments);
      setTimeout(refreshAdminEditors, 50);
      return result;
    };
  }
})();
