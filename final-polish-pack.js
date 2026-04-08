(function(){
  const PAGE = document.body?.dataset?.page || '';
  if (PAGE !== 'admin') return;
  const BACKUP_KEYS = [
    'kgQuizAdvancedConfigsV1','kgQuizLevelVisibilityV1','kgQuizTimerSettingsV1','kgQuizAccessPasswordsV1',
    'kgTeacherTestV1','kgTeacherArchivedTestsV1','kgTeacherAuditLogV1','kgTeacherDashboardDataV1',
    'kgEnglishCustomQuestionsV23','kgEnglishCustomQuestionsV7','kgQuestionOverridesV1','kgCustomClassesV1',
    'kgAccessAccountsV1','kgStudentProgressV1','kgStudentRecordsV1','kgAttemptsLogV1','kgAnalyticsV1',
    'kgPlayLeaderboardV1','kgPlayConfigV1'
  ];
  const DRAFT_KEY = 'kgAdminDraftsV2';
  function jread(key, fallback){ try { return JSON.parse(localStorage.getItem(key) || 'null') ?? fallback; } catch(e){ return fallback; } }
  function jwrite(key, value){ try { localStorage.setItem(key, JSON.stringify(value)); } catch(e){} }
  function lang(){ return document.body?.dataset?.lang || 'en'; }
  function t(en, ar){ return lang() === 'ar' ? ar : en; }
  function esc(v){ return String(v == null ? '' : v).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }
  function setStatus(text, state){
    const box = document.getElementById('adminCommandStatus');
    if (!box) return;
    box.textContent = text || '';
    box.dataset.state = state || '';
  }
  function ensureStyles(){
    if (document.getElementById('final-polish-style')) return;
    const style = document.createElement('style');
    style.id = 'final-polish-style';
    style.textContent = `
      .admin-command-card{position:sticky;top:10px;z-index:25;border:1px solid rgba(53,91,140,.10);background:linear-gradient(180deg,#ffffff 0%,#fbfdff 100%)}
      .admin-command-grid{display:grid;grid-template-columns:minmax(220px,1.4fr) repeat(4,auto);gap:10px;align-items:center}
      .admin-command-grid .ghost-btn,.admin-command-grid .main-btn{border-radius:999px;white-space:nowrap}
      .admin-command-search{min-width:0}
      .admin-command-status{margin-top:10px;padding:10px 12px;border-radius:14px;background:#f6f9ff;color:#355b8c;font-weight:700;display:none}
      .admin-command-status[data-state]{display:block}
      .admin-command-status[data-state="error"]{background:#fff3f3;color:#bf3c3c}
      .admin-command-status[data-state="success"]{background:#eefbf1;color:#1f8f4d}
      .admin-command-status[data-state="info"]{background:#f6f9ff;color:#355b8c}
      .admin-section-hidden{display:none !important}
      .admin-highlight-section{box-shadow:0 0 0 3px rgba(255,154,74,.18) inset}
      .mini-chip-row{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px}
      .mini-chip{padding:6px 10px;border-radius:999px;background:#f5f7fb;color:#486484;font-weight:700;font-size:.92rem}
      .floating-top-btn{position:fixed;right:16px;bottom:16px;z-index:30;border:none;border-radius:999px;padding:12px 14px;box-shadow:0 12px 24px rgba(0,0,0,.12);background:#ff9a4a;color:#fff;font-weight:800;cursor:pointer}
      @media (max-width: 900px){
        .admin-command-card{position:static}
        .admin-command-grid{grid-template-columns:1fr 1fr}
        .admin-command-grid input{grid-column:1/-1}
      }
      @media (max-width: 560px){
        .admin-command-grid{grid-template-columns:1fr}
        .floating-top-btn{right:10px;bottom:10px;padding:11px 13px}
      }
    `;
    document.head.appendChild(style);
  }
  function createCommandCenter(){
    if (document.getElementById('adminCommandCenter')) return;
    const host = document.getElementById('adminDashboardContent');
    const firstSection = host?.querySelector('.admin-shortcuts-card');
    if (!host || !firstSection) return;
    const card = document.createElement('section');
    card.className = 'card admin-command-card';
    card.id = 'adminCommandCenter';
    card.innerHTML = `
      <div class="section-head"><h2>${esc(t('Command Center','مركز التحكم'))}</h2></div>
      <div class="admin-command-grid">
        <input id="adminSectionSearch" class="admin-text-input admin-command-search" placeholder="${esc(t('Search admin sections','ابحث داخل أقسام الإدارة'))}">
        <button type="button" class="ghost-btn" id="expandAllAdminBtn">${esc(t('Expand All','فتح الكل'))}</button>
        <button type="button" class="ghost-btn" id="collapseAllAdminBtn">${esc(t('Collapse All','طي الكل'))}</button>
        <button type="button" class="ghost-btn" id="exportAdminBackupBtn">${esc(t('Export Backup','تصدير نسخة احتياطية'))}</button>
        <label class="ghost-btn" style="display:inline-flex;align-items:center;justify-content:center;cursor:pointer">${esc(t('Import Backup','استيراد نسخة'))}<input id="importAdminBackupInput" type="file" accept="application/json" hidden></label>
      </div>
      <div class="mini-chip-row" id="adminSearchChips"></div>
      <div class="admin-command-status" id="adminCommandStatus" aria-live="polite"></div>`;
    host.insertBefore(card, firstSection);
  }
  function getSectionCards(){
    return Array.from(document.querySelectorAll('#adminDashboardContent > section, #adminDashboardContent > .admin-top-grid, #adminDashboardContent > .admin-grid')).filter(Boolean);
  }
  function filterSections(){
    const input = document.getElementById('adminSectionSearch');
    const q = String(input?.value || '').trim().toLowerCase();
    const chips = document.getElementById('adminSearchChips');
    if (chips) chips.innerHTML = '';
    let shown = 0;
    document.querySelectorAll('#adminDashboardContent > section.card').forEach(section => {
      if (section.id === 'adminCommandCenter') return;
      const text = section.textContent.toLowerCase();
      const match = !q || text.includes(q);
      section.classList.toggle('admin-section-hidden', !match);
      section.classList.toggle('admin-highlight-section', !!q && match);
      if (match) shown += 1;
    });
    document.querySelectorAll('#adminDashboardContent > .admin-top-grid, #adminDashboardContent > .admin-grid').forEach(block => {
      const visibleChild = block.querySelector('section.card:not(.admin-section-hidden)');
      block.classList.toggle('admin-section-hidden', !!q && !visibleChild);
    });
    if (chips){
      const chip = document.createElement('span');
      chip.className = 'mini-chip';
      chip.textContent = q ? t('Matches','مطابقات') + ': ' + shown : t('Showing all sections','عرض كل الأقسام');
      chips.appendChild(chip);
    }
  }
  function setAllCollapsed(collapsed){
    if (typeof window.ADMIN_COLLAPSIBLE_CONFIGS === 'undefined' || typeof window.setCollapsed !== 'function') return false;
    window.ADMIN_COLLAPSIBLE_CONFIGS.forEach(cfg => {
      const btn = document.getElementById(cfg.buttonId);
      if (document.getElementById(cfg.bodyId)) window.setCollapsed(cfg.bodyId, btn, collapsed);
    });
    return true;
  }
  function collectBackup(){
    const payload = { exportedAt: new Date().toISOString(), source: 'kg-v38.10-final-polish-pack', data: {} };
    BACKUP_KEYS.forEach(key => {
      const value = localStorage.getItem(key);
      if (value != null) payload.data[key] = value;
    });
    return payload;
  }
  function exportBackup(){
    const payload = collectBackup();
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type:'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'kg-admin-backup.json';
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1200);
    setStatus(t('Backup exported successfully.','تم تصدير النسخة الاحتياطية بنجاح.'), 'success');
  }
  async function importBackup(file){
    try {
      const raw = await file.text();
      const payload = JSON.parse(raw);
      const data = payload && typeof payload === 'object' ? payload.data : null;
      if (!data || typeof data !== 'object') throw new Error('Invalid backup format');
      Object.keys(data).forEach(key => {
        if (BACKUP_KEYS.includes(key) && typeof data[key] === 'string') localStorage.setItem(key, data[key]);
      });
      setStatus(t('Backup imported. Refreshing the dashboard...','تم استيراد النسخة. يتم تحديث اللوحة...'), 'success');
      setTimeout(() => window.location.reload(), 550);
    } catch (err) {
      setStatus(t('Could not import that backup file.','تعذر استيراد ملف النسخة الاحتياطية.'), 'error');
    }
  }
  function draftFields(){
    return ['testGrade','testName','testMode','testCount','testQuestionList','newQGrade','newQSkill','newQType','newQText','newQOptions','newQAnswer','newQDifficulty','newQImage'];
  }
  function saveDrafts(){
    const draft = jread(DRAFT_KEY, {});
    draftFields().forEach(id => {
      const el = document.getElementById(id);
      if (el) draft[id] = el.value;
    });
    jwrite(DRAFT_KEY, draft);
  }
  function restoreDrafts(){
    const draft = jread(DRAFT_KEY, {});
    draftFields().forEach(id => {
      const el = document.getElementById(id);
      if (el && typeof draft[id] === 'string' && !el.value) el.value = draft[id];
    });
    const chips = document.getElementById('adminSearchChips');
    const used = Object.values(draft).filter(v => String(v || '').trim()).length;
    if (chips && used){
      const chip = document.createElement('span');
      chip.className = 'mini-chip';
      chip.textContent = t('Draft restored','تمت استعادة المسودة');
      chips.appendChild(chip);
    }
  }
  function clearDrafts(){
    localStorage.removeItem(DRAFT_KEY);
    setStatus(t('Saved drafts cleared.','تم مسح المسودات المحفوظة.'), 'info');
  }
  function addTopButton(){
    if (document.getElementById('adminBackToTopBtn')) return;
    const btn = document.createElement('button');
    btn.id = 'adminBackToTopBtn';
    btn.className = 'floating-top-btn';
    btn.type = 'button';
    btn.textContent = '↑';
    btn.title = t('Back to top','العودة للأعلى');
    btn.addEventListener('click', () => window.scrollTo({ top:0, behavior:'smooth' }));
    document.body.appendChild(btn);
  }
  function wire(){
    createCommandCenter();
    restoreDrafts();
    addTopButton();
    document.getElementById('adminSectionSearch')?.addEventListener('input', filterSections);
    document.getElementById('expandAllAdminBtn')?.addEventListener('click', () => {
      if (setAllCollapsed(false)) setStatus(t('All admin sections expanded.','تم فتح كل أقسام الإدارة.'), 'info');
    });
    document.getElementById('collapseAllAdminBtn')?.addEventListener('click', () => {
      if (setAllCollapsed(true)) setStatus(t('All admin sections collapsed.','تم طي كل أقسام الإدارة.'), 'info');
    });
    document.getElementById('exportAdminBackupBtn')?.addEventListener('click', exportBackup);
    document.getElementById('importAdminBackupInput')?.addEventListener('change', e => {
      const file = e.target.files?.[0];
      if (file) importBackup(file);
      e.target.value = '';
    });
    draftFields().forEach(id => {
      const el = document.getElementById(id);
      if (!el || el.dataset.finalPolishDraft === '1') return;
      el.dataset.finalPolishDraft = '1';
      el.addEventListener('input', saveDrafts);
      el.addEventListener('change', saveDrafts);
    });
    document.getElementById('clearTeacherTestBtn')?.addEventListener('click', () => setTimeout(saveDrafts, 50));
    document.getElementById('addQuestionBtn')?.addEventListener('click', () => setTimeout(saveDrafts, 50));
    document.getElementById('saveTeacherTestBtn')?.addEventListener('click', clearDrafts);
    filterSections();
  }
  function boot(){
    ensureStyles();
    const panel = document.getElementById('adminPanel');
    const observer = new MutationObserver(() => {
      if (!panel.classList.contains('hidden')) setTimeout(wire, 160);
    });
    if (panel) observer.observe(panel, { attributes:true, attributeFilter:['class'] });
    if (panel && !panel.classList.contains('hidden')) setTimeout(wire, 160);
  }
  window.addEventListener('load', () => setTimeout(boot, 400));
})();
