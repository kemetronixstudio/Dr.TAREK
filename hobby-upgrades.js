(function(){
  const PAGE = document.body?.dataset?.page || 'home';
  const ADV_KEY = 'kgQuizAdvancedConfigsV1';
  const AUDIT_KEY = 'kgAuditTrailV1';
  const ARCHIVE_KEY = 'kgArchivedQuizConfigsV1';

  function readJsonSafe(key, fallback){
    try { return JSON.parse(localStorage.getItem(key) || 'null') ?? fallback; } catch(e){ return fallback; }
  }
  function writeJsonSafe(key, value){
    try { localStorage.setItem(key, JSON.stringify(value)); } catch(e){}
    return value;
  }
  function nowIso(){ return new Date().toISOString(); }
  function slug(v){ return String(v||'').trim().toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,''); }
  function labelForGrade(key){
    const k = String(key||'').trim();
    if (!k) return 'Quiz';
    if (/^kg[12]$/i.test(k)) return k.toUpperCase();
    if (window.getCustomClasses) {
      const cls = (window.getCustomClasses()||[]).find(c => String(c.key||'') === k);
      if (cls?.name) return cls.name;
    }
    return k.replace(/-/g,' ').replace(/\b\w/g, m => m.toUpperCase());
  }
  function getAdvanced(){ return readJsonSafe(ADV_KEY, {}); }
  function setAdvanced(v){ return writeJsonSafe(ADV_KEY, v); }
  function getAudit(){ return readJsonSafe(AUDIT_KEY, []); }
  function pushAudit(action, detail){
    const user = sessionStorage.getItem('kgCurrentAdminUser') || 'unknown';
    const rows = getAudit();
    rows.unshift({ at: nowIso(), user, action, detail });
    writeJsonSafe(AUDIT_KEY, rows.slice(0, 300));
    renderAuditPanel();
  }
  function getArchived(){ return readJsonSafe(ARCHIVE_KEY, {}); }
  function setArchived(v){ return writeJsonSafe(ARCHIVE_KEY, v); }
  function getQuizConfig(key){
    const all = getAdvanced();
    const cfg = all[key] || {};
    const status = String(cfg.status || 'visible').toLowerCase();
    return {
      status: ['draft','visible','hidden','frozen','scheduled','expired','archived'].includes(status) ? status : 'visible',
      openAt: cfg.openAt || '',
      closeAt: cfg.closeAt || '',
      timerMinutes: Math.max(0, Number(cfg.timerMinutes || 0)),
      attempts: Math.max(0, Number(cfg.attempts || 0)),
      passMark: Math.max(0, Math.min(100, Number(cfg.passMark || 0))),
      randomizeQuestions: !!cfg.randomizeQuestions,
      randomizeOptions: !!cfg.randomizeOptions,
      templateName: cfg.templateName || '',
      archivedAt: cfg.archivedAt || ''
    };
  }
  function saveQuizConfig(key, cfg){
    const all = getAdvanced();
    all[key] = Object.assign({}, getQuizConfig(key), cfg || {});
    setAdvanced(all);
    return all[key];
  }
  function computeStatus(key){
    const cfg = getQuizConfig(key);
    const now = Date.now();
    if (cfg.status === 'archived') return 'archived';
    if (cfg.status === 'hidden' || cfg.status === 'frozen' || cfg.status === 'draft' || cfg.status === 'expired') return cfg.status;
    const openMs = cfg.openAt ? Date.parse(cfg.openAt) : NaN;
    const closeMs = cfg.closeAt ? Date.parse(cfg.closeAt) : NaN;
    if (!Number.isNaN(closeMs) && now > closeMs) return 'expired';
    if (!Number.isNaN(openMs) && now < openMs) return 'scheduled';
    return cfg.status || 'visible';
  }
  function badgeText(status){
    return String(status || 'visible').toUpperCase();
  }
  function statusMessage(status, key){
    const label = labelForGrade(key);
    if (status === 'draft') return label + ' is saved as draft and not shown to students.';
    if (status === 'hidden') return label + ' is hidden from students.';
    if (status === 'frozen') return label + ' is visible but locked.';
    if (status === 'scheduled') return label + ' is scheduled and will open automatically.';
    if (status === 'expired') return label + ' has expired.';
    if (status === 'archived') return label + ' is archived.';
    return label + ' is visible to students.';
  }
  function ensureStyles(){
    if (document.getElementById('hobby-upgrades-style')) return;
    const style = document.createElement('style');
    style.id = 'hobby-upgrades-style';
    style.textContent = `
      .upgrade-box{margin-top:12px;padding:14px;border:1px solid rgba(0,0,0,.08);border-radius:16px;background:#fffdf7}
      .upgrade-box h3{margin:0 0 10px;font-size:1rem}
      .upgrade-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px}
      .upgrade-grid input,.upgrade-grid select{width:100%;padding:10px;border-radius:12px;border:1px solid #d8d8d8}
      .upgrade-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:10px}
      .status-badge-adv{display:inline-flex;align-items:center;justify-content:center;padding:4px 10px;border-radius:999px;font-size:.8rem;font-weight:700;letter-spacing:.04em}
      .status-visible{background:#e7f8eb;color:#1b7f38}.status-hidden{background:#fff2d9;color:#9a6400}.status-frozen{background:#ffe2e2;color:#b21d1d}.status-scheduled{background:#e5f0ff;color:#2458b8}.status-expired{background:#ececec;color:#555}.status-draft{background:#f0e8ff;color:#6a2eb8}.status-archived{background:#e9eef3;color:#4a5b6d}
      .mini-note{font-size:.85rem;opacity:.8;margin-top:8px}
      .recycle-item,.audit-item{padding:10px;border:1px solid rgba(0,0,0,.07);border-radius:12px;margin:8px 0;background:#fff}
      .dashboard-mini{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:10px;margin-top:12px}
      .dashboard-mini .card{padding:12px;border-radius:14px;border:1px solid rgba(0,0,0,.08);background:#fff}
      .quiz-locked-note{margin-top:10px;padding:10px;border-radius:12px;background:#fff7e8;border:1px solid #f3d59a}
    `;
    document.head.appendChild(style);
  }

  function ensureAdminLoginTracking(){
    const btn = document.getElementById('adminLoginBtn');
    if (!btn || btn.dataset.auditBound === '1') return;
    btn.dataset.auditBound = '1';
    btn.addEventListener('click', () => {
      setTimeout(() => {
        const panel = document.getElementById('adminPanel');
        const user = document.getElementById('adminUser')?.value?.trim() || 'unknown';
        if (panel && !panel.classList.contains('hidden')) {
          sessionStorage.setItem('kgCurrentAdminUser', user);
          pushAudit('login', 'Admin login succeeded');
        }
      }, 60);
    });
  }

  function ensureTeacherAdvancedPanel(){
    const body = document.getElementById('teacherTestBody');
    if (!body || document.getElementById('teacherAdvancedBox')) return;
    const box = document.createElement('div');
    box.id = 'teacherAdvancedBox';
    box.className = 'upgrade-box';
    box.innerHTML = `
      <h3>Advanced Quiz Controls</h3>
      <div class="upgrade-grid">
        <select id="advTeacherStatus"><option value="draft">DRAFT</option><option value="visible">VISIBLE</option><option value="hidden">HIDDEN</option><option value="frozen">FROZEN</option></select>
        <input id="advTeacherOpenAt" type="datetime-local" placeholder="Open at">
        <input id="advTeacherCloseAt" type="datetime-local" placeholder="Close at">
        <input id="advTeacherTimer" type="number" min="0" placeholder="Timer minutes (0 = none)">
        <input id="advTeacherAttempts" type="number" min="0" placeholder="Attempts limit (0 = unlimited)">
        <input id="advTeacherPassMark" type="number" min="0" max="100" placeholder="Pass mark %">
      </div>
      <div class="upgrade-actions">
        <label><input type="checkbox" id="advTeacherRandomQ"> Randomize questions</label>
        <label><input type="checkbox" id="advTeacherRandomA"> Randomize answers</label>
        <button class="ghost-btn" type="button" id="saveTeacherAdvancedBtn">Save Advanced Settings</button>
        <button class="ghost-btn" type="button" id="archiveTeacherQuizBtn">Archive Quiz</button>
        <button class="ghost-btn" type="button" id="exportTeacherTemplateBtn">Export Template JSON</button>
      </div>
      <div class="mini-note" id="teacherAdvancedStatusNote"></div>
    `;
    body.appendChild(box);

    function currentKey(){ return String(document.getElementById('testGrade')?.value || 'KG1').trim().toLowerCase(); }
    function sync(){
      const key = currentKey();
      const cfg = getQuizConfig(key);
      document.getElementById('advTeacherStatus').value = cfg.status;
      document.getElementById('advTeacherOpenAt').value = cfg.openAt || '';
      document.getElementById('advTeacherCloseAt').value = cfg.closeAt || '';
      document.getElementById('advTeacherTimer').value = cfg.timerMinutes || '';
      document.getElementById('advTeacherAttempts').value = cfg.attempts || '';
      document.getElementById('advTeacherPassMark').value = cfg.passMark || '';
      document.getElementById('advTeacherRandomQ').checked = !!cfg.randomizeQuestions;
      document.getElementById('advTeacherRandomA').checked = !!cfg.randomizeOptions;
      document.getElementById('teacherAdvancedStatusNote').innerHTML = '<span class="status-badge-adv status-' + computeStatus(key) + '">' + badgeText(computeStatus(key)) + '</span> ' + statusMessage(computeStatus(key), key);
    }
    sync();
    document.getElementById('testGrade')?.addEventListener('change', sync);
    document.getElementById('saveTeacherAdvancedBtn').addEventListener('click', () => {
      const key = currentKey();
      saveQuizConfig(key, {
        status: document.getElementById('advTeacherStatus').value,
        openAt: document.getElementById('advTeacherOpenAt').value,
        closeAt: document.getElementById('advTeacherCloseAt').value,
        timerMinutes: Number(document.getElementById('advTeacherTimer').value || 0),
        attempts: Number(document.getElementById('advTeacherAttempts').value || 0),
        passMark: Number(document.getElementById('advTeacherPassMark').value || 0),
        randomizeQuestions: document.getElementById('advTeacherRandomQ').checked,
        randomizeOptions: document.getElementById('advTeacherRandomA').checked
      });
      pushAudit('quiz_settings_saved', labelForGrade(key) + ' advanced settings updated');
      sync();
      alert('Advanced quiz settings saved.');
    });
    document.getElementById('archiveTeacherQuizBtn').addEventListener('click', () => {
      const key = currentKey();
      const archived = getArchived();
      archived[key] = { archivedAt: nowIso(), teacherTest: (window.getTeacherTests?.() || {})[key] || null, advanced: getQuizConfig(key) };
      setArchived(archived);
      saveQuizConfig(key, { status:'archived', archivedAt: nowIso() });
      pushAudit('quiz_archived', labelForGrade(key) + ' archived');
      sync();
      alert('Quiz archived.');
    });
    document.getElementById('exportTeacherTemplateBtn').addEventListener('click', () => {
      const key = currentKey();
      const payload = { key, label: labelForGrade(key), teacherTest: (window.getTeacherTests?.() || {})[key] || null, advanced: getQuizConfig(key) };
      const blob = new Blob([JSON.stringify(payload,null,2)], {type:'application/json'});
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = slug(labelForGrade(key)) + '-quiz-template.json';
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 1500);
    });
  }

  function ensureQuestionRecycleBin(){
    const body = document.getElementById('questionBankEditorBody');
    if (!body || document.getElementById('questionRecycleBox')) return;
    const box = document.createElement('div');
    box.id = 'questionRecycleBox';
    box.className = 'upgrade-box';
    box.innerHTML = `
      <h3>Question Recycle Bin & Export</h3>
      <div class="upgrade-actions">
        <button class="ghost-btn" type="button" id="refreshRecycleBtn">Refresh Deleted Questions</button>
        <button class="ghost-btn" type="button" id="restoreAllDeletedQuestionsBtn">Restore All</button>
        <button class="ghost-btn" type="button" id="exportQuestionsJsonBtn">Export Questions JSON</button>
        <button class="ghost-btn" type="button" id="exportQuestionsCsvBtn">Export Questions CSV</button>
      </div>
      <div id="questionRecycleList"></div>
    `;
    body.appendChild(box);
    function renderRecycle(){
      const list = document.getElementById('questionRecycleList');
      if (!list) return;
      const deleted = window.getDeletedQuestions ? window.getDeletedQuestions() : {};
      const ids = Object.keys(deleted || {});
      if (!ids.length){ list.innerHTML = '<div class="mini-note">No deleted questions.</div>'; return; }
      list.innerHTML = ids.map(id => '<div class="recycle-item"><strong>' + id + '</strong><div class="mini-note">Deleted: ' + (deleted[id]?.deletedAt || '-') + '</div><button class="ghost-btn restore-question-btn" data-qid="' + id + '">Restore</button></div>').join('');
      list.querySelectorAll('.restore-question-btn').forEach(btn => btn.addEventListener('click', () => {
        const qid = btn.dataset.qid;
        const data = window.getDeletedQuestions ? window.getDeletedQuestions() : {};
        delete data[qid];
        window.writeJson ? window.writeJson(window.storeKeys.deletedQuestions, data) : localStorage.setItem('kgEnglishDeletedQuestionsV2', JSON.stringify(data));
        pushAudit('question_restored', qid + ' restored from recycle bin');
        renderRecycle();
        if (window.renderStoredQuestions) window.renderStoredQuestions();
      }));
    }
    document.getElementById('refreshRecycleBtn').addEventListener('click', renderRecycle);
    document.getElementById('restoreAllDeletedQuestionsBtn').addEventListener('click', () => {
      const key = (window.storeKeys && window.storeKeys.deletedQuestions) || 'kgEnglishDeletedQuestionsV2';
      localStorage.setItem(key, JSON.stringify({}));
      pushAudit('question_restore_all', 'All deleted questions restored');
      renderRecycle();
      if (window.renderStoredQuestions) window.renderStoredQuestions();
    });
    document.getElementById('exportQuestionsJsonBtn').addEventListener('click', () => {
      const payload = { questions: typeof window.questionEditorItems === 'function' ? window.questionEditorItems() : [] };
      const blob = new Blob([JSON.stringify(payload,null,2)], {type:'application/json'});
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'question-bank-export.json'; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1500);
    });
    document.getElementById('exportQuestionsCsvBtn').addEventListener('click', () => {
      const items = typeof window.questionEditorItems === 'function' ? window.questionEditorItems() : [];
      const rows = [['grade','skill','type','text','options','answer','difficulty','image']].concat(items.map(q => [q.grade || q._meta?.grade || '', q.skill || '', q.type || '', q.text || '', (q.options||[]).join(' | '), q.answer || '', q.difficulty || '', q.image || '']));
      const csv = rows.map(r => r.map(v => '"' + String(v ?? '').replace(/"/g,'""') + '"').join(',')).join('\n');
      const blob = new Blob([csv], {type:'text/csv'});
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'question-bank-export.csv'; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1500);
    });
    renderRecycle();
  }

  function renderAuditPanel(){
    const list = document.getElementById('accessLogsList');
    if (!list) return;
    const items = getAudit();
    list.innerHTML = (items.length ? items : []).map(item => '<div class="audit-item"><strong>' + item.action + '</strong><div>' + (item.detail || '') + '</div><div class="mini-note">' + item.user + ' • ' + item.at + '</div></div>').join('') || '<div class="mini-note">No audit events yet.</div>';
  }

  function enhanceActivitySection(){
    const body = document.getElementById('activityLogsBody');
    if (!body || document.getElementById('auditExportRow')) return;
    const row = document.createElement('div');
    row.id = 'auditExportRow';
    row.className = 'upgrade-actions';
    row.innerHTML = '<button class="ghost-btn" type="button" id="exportAuditJsonBtn">Export Audit JSON</button><button class="ghost-btn" type="button" id="exportAuditCsvBtn">Export Audit CSV</button><button class="ghost-btn" type="button" id="clearAuditBtn">Clear Audit</button>';
    body.insertBefore(row, body.firstChild.nextSibling);
    document.getElementById('exportAuditJsonBtn').addEventListener('click', () => {
      const blob = new Blob([JSON.stringify(getAudit(),null,2)], {type:'application/json'});
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'audit-log.json'; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1500);
    });
    document.getElementById('exportAuditCsvBtn').addEventListener('click', () => {
      const rows = [['at','user','action','detail']].concat(getAudit().map(x => [x.at,x.user,x.action,x.detail]));
      const csv = rows.map(r => r.map(v => '"' + String(v ?? '').replace(/"/g,'""') + '"').join(',')).join('\n');
      const blob = new Blob([csv], {type:'text/csv'});
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'audit-log.csv'; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1500);
    });
    document.getElementById('clearAuditBtn').addEventListener('click', () => { localStorage.removeItem(AUDIT_KEY); renderAuditPanel(); });
    renderAuditPanel();
  }

  function enforceStudentVisibility(){
    const page = document.body?.dataset?.page || '';
    if (page === 'home'){
      document.querySelectorAll('[data-home-grade], .level-card, .home-card').forEach(card => {
        const gradeKey = String(card.dataset.homeGrade || card.dataset.grade || card.getAttribute('data-grade') || '').toLowerCase();
        if (!gradeKey) return;
        const status = computeStatus(gradeKey);
        let note = card.querySelector('.quiz-locked-note');
        if (status === 'visible') { if (note) note.remove(); return; }
        if (!note){ note = document.createElement('div'); note.className = 'quiz-locked-note'; card.appendChild(note); }
        note.innerHTML = '<strong>' + badgeText(status) + '</strong><div>' + statusMessage(status, gradeKey) + '</div>';
        if (status === 'hidden' || status === 'draft' || status === 'archived') card.style.display = 'none';
      });
    }
    if (page === 'class'){
      const params = new URLSearchParams(location.search);
      const key = String(params.get('class') || '').toLowerCase();
      if (!key) return;
      const status = computeStatus(key);
      if (status !== 'visible'){
        const shell = document.getElementById('classQuizShell') || document.querySelector('main');
        if (shell){
          shell.innerHTML = '<section class="card"><h2>' + badgeText(status) + '</h2><p>' + statusMessage(status, key) + '</p><p><a class="main-btn" href="index.html">Back Home</a></p></section>';
        }
      }
    }
  }

  function enhanceHomeDashboard(){ return;

    const host = document.querySelector('.progress-card');
    if (!host || document.getElementById('studentSummaryUpgrade')) return;
    const wrap = document.createElement('section');
    wrap.id = 'studentSummaryUpgrade';
    wrap.className = 'card';
    const progress = window.getProgress ? window.getProgress() : {};
    const totalStudents = Object.keys(progress || {}).length;
    const statuses = ['visible','hidden','frozen','scheduled','expired','draft'];
    const counts = statuses.reduce((acc, s) => (acc[s]=0, acc), {});
    Object.keys(getAdvanced()).forEach(k => { const s = computeStatus(k); if (counts[s] != null) counts[s] += 1; });
    wrap.innerHTML = '<div class="section-head"><h2>Quick School Snapshot</h2></div><div class="dashboard-mini">' +
      '<div class="card"><strong>' + totalStudents + '</strong><div>Students with progress</div></div>' +
      '<div class="card"><strong>' + counts.visible + '</strong><div>Visible quizzes</div></div>' +
      '<div class="card"><strong>' + counts.scheduled + '</strong><div>Scheduled quizzes</div></div>' +
      '<div class="card"><strong>' + (counts.hidden + counts.draft + counts.expired + counts.frozen) + '</strong><div>Locked/hidden quizzes</div></div>' +
      '</div>';
    host.parentNode.insertBefore(wrap, host.nextSibling);
  }

  function patchTeacherSaveAudit(){
    if (!window.saveTeacherTestFromAdmin || window.saveTeacherTestFromAdmin.__auditWrapped) return;
    const orig = window.saveTeacherTestFromAdmin;
    window.saveTeacherTestFromAdmin = function(){
      const before = JSON.stringify((window.getTeacherTests?.() || {}));
      const out = orig.apply(this, arguments);
      const after = JSON.stringify((window.getTeacherTests?.() || {}));
      if (before !== after) pushAudit('teacher_test_saved', 'Teacher test saved/updated');
      return out;
    };
    window.saveTeacherTestFromAdmin.__auditWrapped = true;
  }
  function patchQuestionDeleteAudit(){
    if (!window.deleteQuestionEdits || window.deleteQuestionEdits.__auditWrapped) return;
    const orig = window.deleteQuestionEdits;
    window.deleteQuestionEdits = function(card){
      const qid = card?.dataset?.qid || 'unknown';
      const out = orig.apply(this, arguments);
      pushAudit('question_deleted', qid + ' moved to recycle bin');
      return out;
    };
    window.deleteQuestionEdits.__auditWrapped = true;
  }

  function addReadmeNote(){
    if (PAGE !== 'home') return;
  }

  function init(){
    ensureStyles();
    ensureAdminLoginTracking();
    patchTeacherSaveAudit();
    patchQuestionDeleteAudit();
    if (PAGE === 'admin'){
      ensureTeacherAdvancedPanel();
      ensureQuestionRecycleBin();
      enhanceActivitySection();
    }
    enforceStudentVisibility();
    enhanceHomeDashboard();
  }

  window.addEventListener('load', () => setTimeout(init, 220));
})();
