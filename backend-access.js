(function(){
  if (typeof document === 'undefined' || !document.body || document.body.dataset.page !== 'admin') return;

  const API_BASE = '/api/access-accounts';
  const TOKEN_KEY = 'kgAccessApiTokenV1';
  const ACCOUNT_KEY = 'kgEnglishAccessSessionV1';
  const ACCOUNT_STATUS_AUTO_CLEAR_MS = 2600;
  let accountCache = [];

  function lang(){
    try { return typeof getLang === 'function' ? getLang() : 'en'; } catch (error) { return 'en'; }
  }
  function t(key, fallback){
    try {
      return (((translations || {})[lang()] || {})[key]) || fallback;
    } catch (error) {
      return fallback;
    }
  }
  function allPerms(){
    return Array.isArray(window.PERMISSIONS) ? window.PERMISSIONS.slice() : ['dashboard','levelVisibility','timerSettings','quizAccess','teacherTest','bulkQuestions','questionBank','classManager','accountManager'];
  }
  function nonAdminPerms(){ return allPerms().filter(function(key){ return key !== 'accountManager'; }); }
  function isAdminOnlyPermission(key){ return key === 'accountManager'; }
  function escapeText(value){
    if (typeof escapeHtml === 'function') return escapeHtml(String(value || ''));
    return String(value || '').replace(/[&<>"']/g, function(ch){ return ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' })[ch]; });
  }
  function permissionLabelSafe(key){
    try { return typeof permissionLabel === 'function' ? permissionLabel(key) : key; }
    catch (error) { return key; }
  }
  function normalizeUser(value){ return String(value || '').trim().toLowerCase(); }
  function currentAccount(){ return window.__currentAccessAccount || null; }
  function currentIsAdmin(){ return !!(currentAccount() && currentAccount().role === 'admin'); }
  function statusEl(){ return document.getElementById('accessAccountsStatus'); }
  function showStatus(message, state){
    const el = statusEl();
    if (!el) return;
    el.textContent = String(message || '').trim();
    if (showStatus._timer) clearTimeout(showStatus._timer);
    if (message) {
      el.dataset.state = state || 'info';
      showStatus._timer = setTimeout(function(){
        if (el.textContent === message) {
          el.textContent = '';
          delete el.dataset.state;
        }
      }, ACCOUNT_STATUS_AUTO_CLEAR_MS);
    } else {
      delete el.dataset.state;
    }
  }
  function persistSession(account, token){
    window.__currentAccessAccount = account || null;
    try {
      if (token) sessionStorage.setItem(TOKEN_KEY, token);
      if (account) sessionStorage.setItem(ACCOUNT_KEY, JSON.stringify({ user: account.user, originalUser: account.originalUser || account.user, role: account.role }));
      else sessionStorage.removeItem(ACCOUNT_KEY);
      if (!account) sessionStorage.removeItem(TOKEN_KEY);
    } catch (error) {}
  }
  function readToken(){
    try { return sessionStorage.getItem(TOKEN_KEY) || ''; } catch (error) { return ''; }
  }
  function authHeaders(){
    const token = readToken();
    return token ? { Authorization: 'Bearer ' + token } : {};
  }
  async function api(path, options){
    const response = await fetch(API_BASE + path, Object.assign({
      headers: Object.assign({ 'Content-Type': 'application/json' }, authHeaders(), (options && options.headers) || {})
    }, options || {}));
    let payload = {};
    try { payload = await response.json(); } catch (error) {}
    if (!response.ok || !payload.ok) {
      const err = new Error((payload && payload.error) || ('Request failed: ' + response.status));
      err.status = response.status;
      throw err;
    }
    return payload;
  }
  function cloneButton(id){
    const node = document.getElementById(id);
    if (!node || !node.parentNode) return node;
    const clone = node.cloneNode(true);
    node.parentNode.replaceChild(clone, node);
    return clone;
  }
  function setPanelVisible(account){
    const loginCard = document.getElementById('adminLoginCard');
    const panel = document.getElementById('adminPanel');
    if (loginCard) loginCard.classList.add('hidden');
    if (panel) panel.classList.remove('hidden');
    if (typeof window.applySectionPermissions === 'function') {
      try { window.applySectionPermissions(account); } catch (error) {}
    }
    if (typeof populateDashboardDateFilter === 'function') try { populateDashboardDateFilter(); } catch (error) {}
    if (typeof renderAdminDashboard === 'function') try { renderAdminDashboard(); } catch (error) {}
    if (typeof renderLevelVisibilityEditor === 'function') try { renderLevelVisibilityEditor(); } catch (error) {}
    if (typeof renderTimerSettingsEditor === 'function') try { renderTimerSettingsEditor(); } catch (error) {}
    if (typeof renderQuizAccessEditor === 'function') try { renderQuizAccessEditor(); } catch (error) {}
    if (typeof renderTeacherTestEditor === 'function') try { renderTeacherTestEditor(); } catch (error) {}
    if (typeof renderTeacherQuestionPicker === 'function') try { renderTeacherQuestionPicker(); } catch (error) {}
    if (typeof wireCollapseButtons === 'function') try { wireCollapseButtons(); } catch (error) {}
    if (typeof wireQuestionFilterButtons === 'function') try { wireQuestionFilterButtons(); } catch (error) {}
  }
  function clearForm(){
    const userEl = document.getElementById('accessAccountUser');
    const passEl = document.getElementById('accessAccountPass');
    const roleEl = document.getElementById('accessAccountRole');
    const saveBtn = document.getElementById('saveAccessAccountBtn');
    if (userEl) {
      userEl.value = '';
      userEl.dataset.originalUser = '';
      userEl.dataset.originalBuiltIn = '';
      userEl.dataset.keepPassword = '';
    }
    if (passEl) passEl.value = '';
    if (roleEl) roleEl.value = 'user';
    if (saveBtn) saveBtn.textContent = t('saveAccessAccount', 'Save Account');
    if (typeof window.renderAccessPermissions === 'function') window.renderAccessPermissions([]);
  }
  window.clearAccessAccountForm = clearForm;

  function collectSelectedPermissions(){
    return Array.from(document.querySelectorAll('.perm-check:checked')).map(function(el){ return el.value; }).filter(function(key){ return !isAdminOnlyPermission(key); });
  }

  async function refreshAccounts(){
    if (!currentIsAdmin()) {
      accountCache = [];
      const box = document.getElementById('accessAccountsList');
      if (box) box.innerHTML = '<div class="stored-question"><h4>' + escapeText('Account management is available to admins only.') + '</h4></div>';
      return [];
    }
    const payload = await api('', { method: 'GET' });
    accountCache = Array.isArray(payload.accounts) ? payload.accounts : [];
    return accountCache;
  }

  window.renderAccessAccountsList = async function(){
    const box = document.getElementById('accessAccountsList');
    if (!box) return;
    if (!currentIsAdmin()) {
      box.innerHTML = '<div class="stored-question"><h4>' + escapeText(lang()==='ar' ? 'إدارة الحسابات متاحة للمشرف فقط.' : 'Account management is available to admins only.') + '</h4></div>';
      return;
    }
    box.innerHTML = '<div class="stored-question"><h4>' + escapeText(lang()==='ar' ? 'جار تحميل الحسابات...' : 'Loading accounts...') + '</h4></div>';
    try {
      const accounts = await refreshAccounts();
      if (!accounts.length) {
        box.innerHTML = '<div class="stored-question"><h4>' + escapeText(t('noExtraAccounts', 'No accounts yet.')) + '</h4></div>';
        return;
      }
      box.innerHTML = accounts.map(function(account){
        const safeUser = String(account.user || '').replace(/'/g, "\\'");
        const roleText = account.role === 'admin' ? (t('adminRole', 'Admin')) : (t('staffRole', 'Staff'));
        const stateText = account.builtIn
          ? (account.builtInOverride ? (lang()==='ar' ? 'مشرف أساسي + تعديل' : 'Built-in + Override') : (lang()==='ar' ? 'مشرف أساسي' : 'Built-in'))
          : (lang()==='ar' ? 'حساب مخصص' : 'Custom account');
        const perms = account.role === 'admin'
          ? (lang()==='ar' ? 'كل الصلاحيات' : 'Full access')
          : ((account.permissions || []).map(permissionLabelSafe).join(', ') || '-');
        return '<div class="account-card account-realfix-card account-pro-card">'
          + '<div class="account-meta-top"><strong class="account-name">' + escapeText(account.user || '') + '</strong><div class="account-badges"><span class="role-badge">' + escapeText(roleText) + '</span> <span class="state-badge">' + escapeText(stateText) + '</span></div></div>'
          + '<div class="account-perms-line">' + escapeText(perms) + '</div>'
          + '<div class="account-actions">'
          + '<button class="ghost-btn" type="button" onclick="accEditByUser(\'' + safeUser + '\')">' + escapeText(lang()==='ar' ? 'تعديل' : 'Edit') + '</button>'
          + '<button class="ghost-btn" type="button" onclick="accChangePassByUser(\'' + safeUser + '\')">' + escapeText(lang()==='ar' ? 'كلمة المرور' : 'Password') + '</button>'
          + '<button class="danger-btn" type="button" onclick="accDeleteByUser(\'' + safeUser + '\')">' + escapeText(t('deleteAccount', 'Delete')) + '</button>'
          + '</div></div>';
      }).join('');
    } catch (error) {
      box.innerHTML = '<div class="stored-question"><h4>' + escapeText(error.message || 'Failed to load accounts.') + '</h4></div>';
      showStatus(error.message || 'Failed to load accounts.', 'error');
    }
  };

  window.accEditByUser = function(user){
    if (!currentIsAdmin()) {
      showStatus(lang()==='ar' ? 'إدارة الحسابات متاحة للمشرف فقط.' : 'Only admins can manage accounts.', 'error');
      return;
    }
    const account = accountCache.find(function(item){ return normalizeUser(item.user) === normalizeUser(user); });
    if (!account) {
      showStatus(lang()==='ar' ? 'الحساب غير موجود.' : 'Account not found.', 'error');
      return;
    }
    const userEl = document.getElementById('accessAccountUser');
    const passEl = document.getElementById('accessAccountPass');
    const roleEl = document.getElementById('accessAccountRole');
    const saveBtn = document.getElementById('saveAccessAccountBtn');
    if (userEl) {
      userEl.value = account.user || '';
      userEl.dataset.originalUser = account.originalUser || account.user || '';
      userEl.dataset.originalBuiltIn = account.builtIn ? '1' : '';
      userEl.dataset.keepPassword = '1';
    }
    if (passEl) passEl.value = '';
    if (roleEl) roleEl.value = account.role || 'user';
    if (saveBtn) saveBtn.textContent = lang()==='ar' ? 'تحديث الحساب' : 'Update Account';
    if (typeof window.renderAccessPermissions === 'function') window.renderAccessPermissions(account.role === 'admin' ? [] : (account.permissions || []));
    showStatus(lang()==='ar' ? 'يمكنك الآن تعديل الحساب ثم الضغط على حفظ.' : 'You can now modify the account and save.', 'info');
  };

  window.accDeleteByUser = async function(user){
    if (!currentIsAdmin()) {
      showStatus(lang()==='ar' ? 'إدارة الحسابات متاحة للمشرف فقط.' : 'Only admins can manage accounts.', 'error');
      return;
    }
    const account = accountCache.find(function(item){ return normalizeUser(item.user) === normalizeUser(user); });
    if (!account) return;
    const message = account.builtIn
      ? (lang()==='ar' ? 'سيتم حذف التعديل فقط والرجوع إلى بيانات المشرف الأساسية. هل تريد المتابعة؟' : 'This removes only the override and restores the built-in admin. Continue?')
      : (lang()==='ar' ? 'هل تريد حذف هذا الحساب؟' : 'Delete this account?');
    if (!confirm(message)) return;
    try {
      await api('', { method: 'DELETE', body: JSON.stringify({ user: account.user }) });
      clearForm();
      await window.renderAccessAccountsList();
      showStatus(lang()==='ar' ? 'تم حذف الحساب بنجاح.' : 'Account deleted successfully.', 'success');
    } catch (error) {
      showStatus(error.message || 'Delete failed.', 'error');
    }
  };

  window.accChangePassByUser = async function(user){
    if (!currentIsAdmin()) {
      showStatus(lang()==='ar' ? 'إدارة الحسابات متاحة للمشرف فقط.' : 'Only admins can manage accounts.', 'error');
      return;
    }
    const account = accountCache.find(function(item){ return normalizeUser(item.user) === normalizeUser(user); });
    if (!account) return;
    const nextPass = prompt(lang()==='ar' ? 'أدخل كلمة المرور الجديدة' : 'New password:', '');
    if (!nextPass) return;
    try {
      const payload = await api('/change-password', { method: 'POST', body: JSON.stringify({ user: account.user, pass: nextPass }) });
      if (payload.token && payload.currentAccount) persistSession(payload.currentAccount, payload.token);
      await window.renderAccessAccountsList();
      showStatus(lang()==='ar' ? 'تم تحديث كلمة المرور بنجاح.' : 'Password updated successfully.', 'success');
    } catch (error) {
      showStatus(error.message || 'Password update failed.', 'error');
    }
  };

  window.saveAccessAccountFromAdmin = async function(){
    if (!currentIsAdmin()) {
      showStatus(lang()==='ar' ? 'إدارة الحسابات متاحة للمشرف فقط.' : 'Only admins can manage accounts.', 'error');
      return false;
    }
    const userEl = document.getElementById('accessAccountUser');
    const passEl = document.getElementById('accessAccountPass');
    const roleEl = document.getElementById('accessAccountRole');
    const user = String(userEl && userEl.value || '').trim();
    const pass = String(passEl && passEl.value || '').trim();
    const role = String(roleEl && roleEl.value || 'user').trim().toLowerCase() === 'admin' ? 'admin' : 'user';
    const originalUser = String(userEl && userEl.dataset.originalUser || '').trim();
    const originalBuiltIn = String(userEl && userEl.dataset.originalBuiltIn || '') === '1';
    const keepPassword = String(userEl && userEl.dataset.keepPassword || '') === '1' && !pass;
    if (!user) {
      showStatus(t('usernamePasswordRequired', 'Please enter username and password.'), 'error');
      return false;
    }
    let permissions = role === 'admin' ? allPerms() : collectSelectedPermissions();
    if (role !== 'admin' && permissions.length === 0) {
      showStatus(t('chooseOnePermission', 'Please choose at least one permission for this staff account.'), 'error');
      return false;
    }
    if (!pass && !keepPassword) {
      showStatus(t('usernamePasswordRequired', 'Please enter username and password.'), 'error');
      return false;
    }
    try {
      const payload = await api('', {
        method: 'POST',
        body: JSON.stringify({
          user: user,
          pass: pass,
          role: role,
          permissions: permissions,
          originalUser: originalUser || user,
          originalBuiltIn: originalBuiltIn,
          keepExistingPassword: keepPassword
        })
      });
      if (payload.token && payload.currentAccount) persistSession(payload.currentAccount, payload.token);
      clearForm();
      await window.renderAccessAccountsList();
      showStatus(t('accountSaved', 'Account saved.'), 'success');
      return true;
    } catch (error) {
      showStatus(error.message || 'Save failed.', 'error');
      return false;
    }
  };

  async function handleLogin(event){
    if (event) event.preventDefault();
    const user = document.getElementById('adminUser') && document.getElementById('adminUser').value || '';
    const pass = document.getElementById('adminPass') && document.getElementById('adminPass').value || '';
    try {
      const payload = await api('/login', { method: 'POST', body: JSON.stringify({ user: user, pass: pass }), headers: { Authorization: '' } });
      persistSession(payload.account, payload.token);
      setPanelVisible(payload.account);
      if (typeof window.renderAccessPermissions === 'function') window.renderAccessPermissions([]);
      await window.renderAccessAccountsList();
    } catch (error) {
      alert((lang()==='ar' ? 'اسم المشرف أو كلمة المرور غير صحيحة.' : 'Wrong admin name or password.') + (error && error.status >= 500 ? ' ' + (lang()==='ar' ? 'تحقق من إعدادات الـ API.' : 'Check the backend API configuration.') : ''));
    }
  }

  async function restoreBackendSession(){
    const token = readToken();
    if (!token) return false;
    try {
      const payload = await api('/me', { method: 'GET' });
      persistSession(payload.account, token);
      setPanelVisible(payload.account);
      if (typeof window.renderAccessPermissions === 'function') window.renderAccessPermissions([]);
      await window.renderAccessAccountsList();
      return true;
    } catch (error) {
      persistSession(null, '');
      return false;
    }
  }

  function bind(){
    const loginBtn = cloneButton('adminLoginBtn');
    if (loginBtn) loginBtn.addEventListener('click', handleLogin);

    const saveBtn = cloneButton('saveAccessAccountBtn');
    if (saveBtn) saveBtn.addEventListener('click', function(event){
      event.preventDefault();
      window.saveAccessAccountFromAdmin();
    });

    const clearBtn = cloneButton('clearAccessAccountBtn');
    if (clearBtn) clearBtn.addEventListener('click', function(event){
      event.preventDefault();
      clearForm();
      showStatus(lang()==='ar' ? 'تم مسح النموذج.' : 'Form cleared.', 'info');
    });

    const roleEl = cloneButton('accessAccountRole');
    if (roleEl) roleEl.addEventListener('change', function(){
      if (typeof window.renderAccessPermissions === 'function') window.renderAccessPermissions(collectSelectedPermissions());
    });

    if (typeof window.renderAccessPermissions === 'function') window.renderAccessPermissions([]);
    restoreBackendSession();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bind);
  else bind();
})();
