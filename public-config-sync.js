(function(){
  const KEY_CLASSES = 'kgEnglishCustomClassesV29';
  const KEY_LEVELS = 'kgEnglishLevelVisibilityV7';
  const KEY_TIMER = 'kgEnglishTimerSettingsV23';
  const KEY_ACCESS = 'kgEnglishQuizAccessV23';
  const KEY_TESTS = 'kgEnglishTeacherTestsV23';
  const SYNC_KEY = 'kgPublicConfigUpdatedAtV1';
  const RELOAD_PREFIX = 'kgPublicConfigReloadedV1:';

  function readJson(key, fallback){
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (error) {
      return fallback;
    }
  }
  function writeJson(key, value){
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (error) {}
  }
  function same(a,b){
    try { return JSON.stringify(a) === JSON.stringify(b); } catch (error) { return false; }
  }
  async function fetchConfig(){
    const response = await fetch('/api/config', { credentials:'same-origin', cache:'no-store', headers:{ 'Cache-Control':'no-store, no-cache, max-age=0', Pragma:'no-cache' } });
    const payload = await response.json().catch(()=>({ ok:false, error:'Could not read public config.' }));
    if (!response.ok || !payload.ok) throw new Error(payload.error || ('Config request failed: ' + response.status));
    return payload;
  }
  function applyConfig(config){
    let changed = false;
    const nextClasses = Array.isArray(config.classes) ? config.classes : [];
    const nextLevels = config.levelVisibility && typeof config.levelVisibility === 'object' ? config.levelVisibility : {};
    const nextTimer = config.timerSettings && typeof config.timerSettings === 'object' ? config.timerSettings : {};
    const nextAccess = Object.fromEntries(Object.keys(config.quizAccess || {}).map((key) => [key, { enabled: !!(config.quizAccess[key] && config.quizAccess[key].enabled), password: '' }]));
    const nextTests = Object.fromEntries(Object.keys(config.teacherTests || {}).map((key) => [key, config.teacherTests[key] ? Object.assign({ questions: [] }, config.teacherTests[key]) : null]));

    if (!same(readJson(KEY_CLASSES, []), nextClasses)) { writeJson(KEY_CLASSES, nextClasses); changed = true; }
    if (!same(readJson(KEY_LEVELS, {}), nextLevels)) { writeJson(KEY_LEVELS, nextLevels); changed = true; }
    if (!same(readJson(KEY_TIMER, {}), nextTimer)) { writeJson(KEY_TIMER, nextTimer); changed = true; }
    if (!same(readJson(KEY_ACCESS, {}), nextAccess)) { writeJson(KEY_ACCESS, nextAccess); changed = true; }
    if (!same(readJson(KEY_TESTS, {}), nextTests)) { writeJson(KEY_TESTS, nextTests); changed = true; }
    try { localStorage.setItem(SYNC_KEY, String(config.updatedAt || '')); } catch (error) {}
    return changed;
  }
  async function sync(){
    const config = await fetchConfig();
    window.__kgPublicConfig = config;
    const changed = applyConfig(config);
    const tag = RELOAD_PREFIX + String(config.updatedAt || 'none') + ':' + location.pathname;
    if (changed) {
      try {
        if (!sessionStorage.getItem(tag)) {
          sessionStorage.setItem(tag, '1');
          location.reload();
          return config;
        }
      } catch (error) {}
    }
    return config;
  }
  window.__kgPublicConfigPromise = sync().catch(function(error){
    console.warn('public config sync failed', error);
    return null;
  });
})();
