(function(){
  if (typeof document === 'undefined' || !document.body || document.body.dataset.page !== 'admin') return;

  const TOKEN_KEY = 'kgAccessApiTokenV1';
  const LEGACY_TOKEN_KEY = 'admin_token';
  const KEY_CLASSES = 'kgEnglishCustomClassesV29';
  const KEY_CUSTOM_Q = 'kgEnglishCustomQuestionsV7';
  const KEY_LEVELS = 'kgEnglishLevelVisibilityV7';
  const KEY_TIMER = 'kgEnglishTimerSettingsV23';
  const KEY_ACCESS = 'kgEnglishQuizAccessV23';
  const KEY_TESTS = 'kgEnglishTeacherTestsV23';
  const KEY_OVERRIDES = 'kgEnglishQuestionOverridesV7';

  function readJson(key, fallback){
    try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : fallback; } catch (error) { return fallback; }
  }
  function writeJson(key, value){
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (error) {}
  }
  function readToken(){
    try { return sessionStorage.getItem(TOKEN_KEY) || localStorage.getItem(TOKEN_KEY) || localStorage.getItem(LEGACY_TOKEN_KEY) || ''; }
    catch (error) { try { return localStorage.getItem(TOKEN_KEY) || localStorage.getItem(LEGACY_TOKEN_KEY) || ''; } catch (e) { return ''; } }
  }
  function headers(extra){
    const token = readToken();
    const base = Object.assign({ 'Content-Type':'application/json', 'Cache-Control':'no-store, no-cache, max-age=0', Pragma:'no-cache' }, extra || {});
    if (token) base.Authorization = 'Bearer ' + token;
    return base;
  }
  async function api(path, options){
    const response = await fetch(path, Object.assign({ credentials:'same-origin', cache:'no-store', headers: headers((options && options.headers) || {}) }, options || {}));
    const payload = await response.json().catch(()=>({ ok:false, error:'Request failed' }));
    if (!response.ok || !payload.ok) {
      const err = new Error(payload.error || ('Request failed: ' + response.status));
      err.status = response.status;
      throw err;
    }
    return payload;
  }
  function adminStatus(message, state){
    const el = document.getElementById('accessAccountsStatus');
    if (!el) return;
    el.textContent = message || '';
    if (message) el.dataset.state = state || 'info';
    else delete el.dataset.state;
  }

  function applyConfig(config){
    if (!config) return;
    if (config.settings) {
      if (config.settings.levelVisibility) writeJson(KEY_LEVELS, config.settings.levelVisibility);
      if (config.settings.timerSettings) writeJson(KEY_TIMER, config.settings.timerSettings);
      if (config.settings.quizAccess) writeJson(KEY_ACCESS, config.settings.quizAccess);
    }
    if (typeof config.classes !== 'undefined') writeJson(KEY_CLASSES, config.classes || []);
    if (typeof config.teacherTests !== 'undefined') writeJson(KEY_TESTS, config.teacherTests || {});
    if (typeof config.customQuestions !== 'undefined') writeJson(KEY_CUSTOM_Q, config.customQuestions || {});
    if (typeof config.questionOverrides !== 'undefined') writeJson(KEY_OVERRIDES, config.questionOverrides || {});
  }

  function collectQuestionsWithMetaV2(grade){
    const safeGrade = String(grade || '').trim().toLowerCase();
    const pools = window.__kgAdminBankPools || {};
    const list = Array.isArray(pools[safeGrade]) ? pools[safeGrade] : [];
    return list.map(function(q, idx){
      const id = q.id || (typeof questionId === 'function' ? questionId(safeGrade, q, idx, 'bank') : `${safeGrade}:bank:${idx + 1}`);
      return Object.assign({}, q, { _meta: { id, grade: safeGrade, idx, source: String(q.id || '').includes(':custom:') ? 'custom' : 'bank' } });
    });
  }

  function installQuestionBankOverrides(){
    window.collectQuestionsWithMeta = collectQuestionsWithMetaV2;
    window.allQuestionsFor = function(grade){
      const raw = collectQuestionsWithMetaV2(grade).map(function(item){ const copy = Object.assign({}, item); delete copy._meta; return copy; });
      return typeof sanitizeQuestions === 'function' ? sanitizeQuestions(raw) : raw;
    };
    window.sanitizedPool = function(grade){
      const pool = (window.allQuestionsFor(grade) || []).map(function(q){ return typeof normalizeQuestion === 'function' ? normalizeQuestion(q) : q; }).filter(Boolean);
      const seen = new Set();
      return pool.filter(function(q){
        const sig = typeof questionSignature === 'function' ? questionSignature(q) : JSON.stringify(q);
        if (seen.has(sig)) return false;
        seen.add(sig);
        return true;
      });
    };
    window.renderStoredQuestions = function(){
      const list = document.getElementById('storedQuestionsList');
      if (!list) return;
      const pools = window.__kgAdminBankPools || {};
      const gradeKeys = Object.keys(pools).sort();
      const items = [];
      gradeKeys.forEach(function(grade){
        collectQuestionsWithMetaV2(grade).forEach(function(item){
          items.push(typeof applyQuestionOverrides === 'function' ? applyQuestionOverrides(item) : item);
        });
      });
      list.innerHTML = items.length
        ? items.map(function(item){ return typeof questionEditorCard === 'function' ? questionEditorCard(item) : ''; }).join('')
        : '<div class="stored-question"><h4>No questions yet.</h4><p>Add questions from the editor above.</p></div>';
      if (typeof bindQuestionEditorActions === 'function') bindQuestionEditorActions();
    };
  }

  let persistTimer = null;
  async function persistNow(){
    const payload = {
      settings: {
        levelVisibility: typeof getLevelVisibility === 'function' ? getLevelVisibility() : readJson(KEY_LEVELS, {}),
        timerSettings: typeof getTimerSettings === 'function' ? getTimerSettings() : readJson(KEY_TIMER, {}),
        quizAccess: typeof getQuizAccess === 'function' ? getQuizAccess() : readJson(KEY_ACCESS, {})
      },
      classes: typeof window.getCustomClasses === 'function' ? window.getCustomClasses() : readJson(KEY_CLASSES, []),
      teacherTests: typeof getTeacherTests === 'function' ? getTeacherTests() : readJson(KEY_TESTS, {}),
      customQuestions: typeof window.getCustomQuestions === 'function' ? window.getCustomQuestions() : readJson(KEY_CUSTOM_Q, {}),
      questionOverrides: readJson(KEY_OVERRIDES, {})
    };
    await api('/api/admin/config', { method:'POST', body: JSON.stringify(payload) });
    await hydrate(false);
  }
  function schedulePersist(reason){
    if (persistTimer) clearTimeout(persistTimer);
    persistTimer = setTimeout(function(){
      persistNow().catch(function(error){
        console.warn('admin config persist failed', reason, error);
        adminStatus(error.message || 'Could not sync admin config.', 'error');
      });
    }, 250);
  }

  function wrapFunction(name, after){
    const original = window[name];
    if (typeof original !== 'function' || original.__kgWrapped) return;
    const wrapped = function(){
      const result = original.apply(this, arguments);
      Promise.resolve(result).then(function(){ after.apply(this, arguments); }.bind(this));
      return result;
    };
    wrapped.__kgWrapped = true;
    window[name] = wrapped;
  }

  function installPersistenceHooks(){
    [
      'saveLevelVisibilityFromAdmin',
      'resetLevelVisibilityFromAdmin',
      'saveTimerSettingsFromAdmin',
      'resetTimerSettingsFromAdmin',
      'saveQuizAccessFromAdmin',
      'clearQuizAccessFromAdmin',
      'saveTeacherTestFromAdmin',
      'clearTeacherTestFromAdmin',
      'addCustomQuestion',
      'saveQuestionEdits',
      'resetQuestionEdits'
    ].forEach(function(name){ wrapFunction(name, function(){ schedulePersist(name); }); });

    if (typeof importBulkQuestionsFromWorkbook === 'function' && !importBulkQuestionsFromWorkbook.__kgWrapped) {
      const originalImport = importBulkQuestionsFromWorkbook;
      window.importBulkQuestionsFromWorkbook = function(){
        const result = originalImport.apply(this, arguments);
        Promise.resolve(result).then(function(){ schedulePersist('importBulkQuestionsFromWorkbook'); });
        return result;
      };
      window.importBulkQuestionsFromWorkbook.__kgWrapped = true;
    }

    document.addEventListener('click', function(event){
      const target = event.target && event.target.closest ? event.target.closest('#saveClassBtn,.delete-class-btn') : null;
      if (target) setTimeout(function(){ schedulePersist('classManager'); }, 120);
    }, true);
  }

  async function hydrate(render){
    const token = readToken();
    if (!token) return false;
    try {
      const [configPayload, bankPayload] = await Promise.all([
        api('/api/admin/config', { method:'GET' }),
        api('/api/admin/question-bank', { method:'GET' })
      ]);
      applyConfig(configPayload.config || configPayload);
      window.__kgAdminBankPools = (bankPayload && bankPayload.pools) || {};
      installQuestionBankOverrides();
      installPersistenceHooks();
      if (render !== false) {
        try { if (typeof renderLevelVisibilityEditor === 'function') renderLevelVisibilityEditor(); } catch (error) {}
        try { if (typeof renderTimerSettingsEditor === 'function') renderTimerSettingsEditor(); } catch (error) {}
        try { if (typeof renderQuizAccessEditor === 'function') renderQuizAccessEditor(); } catch (error) {}
        try { if (typeof renderTeacherTestEditor === 'function') renderTeacherTestEditor(); } catch (error) {}
        try { if (typeof renderStoredQuestions === 'function') renderStoredQuestions(); } catch (error) {}
        try { if (typeof renderCustomClassesAdmin === 'function') renderCustomClassesAdmin(); } catch (error) {}
        try { if (typeof renderTeacherQuestionPicker === 'function') renderTeacherQuestionPicker(); } catch (error) {}
        try { if (typeof wireQuestionFilterButtons === 'function') wireQuestionFilterButtons(); } catch (error) {}
      }
      adminStatus('', 'info');
      return true;
    } catch (error) {
      if (error.status !== 401) console.warn('admin config hydrate failed', error);
      return false;
    }
  }

  function init(){
    hydrate(true).catch(function(){});
    document.addEventListener('click', function(event){
      const loginBtn = event.target && event.target.closest ? event.target.closest('#adminLoginBtn') : null;
      if (loginBtn) setTimeout(function(){ hydrate(true).catch(function(){}); }, 700);
    }, true);
    window.addEventListener('load', function(){ hydrate(true).catch(function(){}); });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
