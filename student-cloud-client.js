(function(){
  const API_BASE = '/api/student';
  const IDENTITY_KEY = 'kgStudentIdentityV1';

  function $(id){ return document.getElementById(id); }
  function slugify(value){ return String(value || '').trim().toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,''); }
  function readIdentity(){
    try { return JSON.parse(localStorage.getItem(IDENTITY_KEY) || 'null'); } catch (error) { return null; }
  }
  function saveIdentity(identity){
    try { localStorage.setItem(IDENTITY_KEY, JSON.stringify(identity)); } catch (error) {}
  }
  function renderInviteCard(data){
    const card = $('guestInviteCard');
    if (!card) return;
    const show = !!(data && data.isGuest);
    card.classList.toggle('hidden', !show);
    if (!show) return;
    const nameEl = $('guestInviteName');
    if (nameEl) nameEl.textContent = data.studentName || data.name || 'Dear student';
  }
  async function post(path, payload){
    const res = await fetch(API_BASE + path, {
      method: 'POST',
      headers: { 'Content-Type':'application/json' },
      credentials: 'same-origin',
      cache: 'no-store',
      body: JSON.stringify(payload || {})
    });
    const data = await res.json().catch(()=>({ ok:false, error:'Request failed' }));
    if (!res.ok || !data.ok) throw new Error(data.error || ('Request failed: ' + res.status));
    return data;
  }
  function buildQuizKey(info){
    const grade = String(info.grade || '').trim().toUpperCase();
    const count = Number(info.count || info.selectedCount || 0) || 0;
    const label = String(info.label || info.selectedLevelLabel || info.testName || 'quiz').trim();
    return [grade, count || 'custom', slugify(label || 'quiz')].join('|');
  }
  function ensureQuizIdentityFields(grade){
    const anchor = document.querySelector('.student-form-box');
    if (!anchor || $('studentClass')) return;
    const wrap = document.createElement('div');
    wrap.className = 'student-cloud-grid';
    wrap.innerHTML = [
      '<input id="studentId" placeholder="Student ID (Optional)" maxlength="40">',
      '<input id="studentClass" placeholder="Class / Course" maxlength="40">',
      '<label class="student-cloud-check"><input type="checkbox" id="studentGuest"> <span>I am not in your class / course / school</span></label>',
      '<p class="student-cloud-note">Name is required. Student ID is optional. Class is required unless the outside-student option is checked.</p>'
    ].join('');
    const nameInput = $('studentName');
    if (nameInput && nameInput.parentNode) nameInput.insertAdjacentElement('afterend', wrap);
    const existing = readIdentity();
    if (existing && String(existing.grade || '').toUpperCase() === String(grade || '').toUpperCase()) {
      if ($('studentName') && existing.name) $('studentName').value = existing.name;
      if ($('studentId') && existing.studentId) $('studentId').value = existing.studentId;
      if ($('studentClass') && existing.className && existing.className !== 'Guest') $('studentClass').value = existing.className;
      if ($('studentGuest')) $('studentGuest').checked = !!existing.isGuest;
    }
    $('studentGuest')?.addEventListener('change', function(){
      const disabled = !!this.checked;
      const classInput = $('studentClass');
      if (!classInput) return;
      classInput.disabled = disabled;
      if (disabled) classInput.value = '';
    });
    if ($('studentGuest')?.checked) $('studentClass').disabled = true;
  }
  function collectIdentity(grade){
    const name = String($('studentName')?.value || '').trim();
    const studentId = String($('studentId')?.value || '').trim();
    const isGuest = !!$('studentGuest')?.checked;
    const className = String($('studentClass')?.value || '').trim();
    if (!name) throw new Error('Please enter the student name first.');
    if (!isGuest && !className) throw new Error('Please enter the class or course, or check the outside-student option.');
    const identity = { name, studentId, className: className || 'Guest', isGuest, grade: String(grade || '').toUpperCase() };
    saveIdentity(identity);
    return identity;
  }

  window.studentCloud = {
    ensureQuizIdentityFields,
    collectIdentity,
    buildQuizKey,
    startOrResume(payload){ return post('/start', payload); },
    saveProgress(payload){ return post('/save-progress', payload); },
    submitResult(payload){ return post('/submit', payload); },
    readIdentity,
    renderInviteCard
  };
})();
