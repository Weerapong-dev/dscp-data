/**
 * DSCP - Main Application Controller
 * SPA router, event wiring, and app initialization.
 */

const App = (() => {

  let _currentPage = 'dashboard';
  let _departments = [];
  let _documents   = [];
  let _session     = null;

  // ════════════════════════════════════════════════
  // BOOT
  // ════════════════════════════════════════════════

  async function boot() {
    // Check GitHub config
    const cfg = GitHubService.getConfig();
    if (!cfg) {
      showPage('setup');
      return;
    }

    // Check session
    _session = AuthService.getSession();
    if (!_session) {
      showPage('login');
      return;
    }

    // Load main app
    await loadApp();
  }

  async function loadApp() {
    UI.showLoading('กำลังโหลดข้อมูล...');
    try {
      _departments = await DataService.getDepartments();
      _documents   = await DataService.getAllDocuments();
      renderShell();
      await navigateTo('dashboard');
    } catch (e) {
      UI.hideLoading();
      UI.toast('เชื่อมต่อ GitHub ไม่สำเร็จ: ' + e.message, 'error');
    } finally {
      UI.hideLoading();
    }
  }

  // ════════════════════════════════════════════════
  // SHELL (Sidebar + Main Content wrapper)
  // ════════════════════════════════════════════════

  function renderShell() {
    document.body.innerHTML = `
      <div class="app-layout" id="app-layout">
        ${UI.renderSidebar(_session)}
        <main class="main-content" id="main-content"></main>
      </div>`;
    wireSidebarEvents();
  }

  function wireSidebarEvents() {
    // Nav links
    document.querySelectorAll('.nav-link').forEach(a => {
      a.addEventListener('click', e => {
        e.preventDefault();
        navigateTo(a.dataset.page);
      });
    });

    // Logout
    const logoutBtn = document.getElementById('btn-logout');
    if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);

    // Sidebar toggle (mobile)
    const toggle = document.getElementById('sidebar-toggle');
    const sidebar = document.getElementById('sidebar');
    if (toggle && sidebar) {
      toggle.addEventListener('click', () => {
        sidebar.classList.toggle('sidebar-open');
        toggle.classList.toggle('toggle-open');
      });
    }
  }

  // ════════════════════════════════════════════════
  // ROUTER
  // ════════════════════════════════════════════════

  async function navigateTo(page) {
    _currentPage = page;
    UI.setActiveNav(page);
    const main = document.getElementById('main-content');
    if (!main) return;

    // Close sidebar on mobile
    document.getElementById('sidebar')?.classList.remove('sidebar-open');

    switch (page) {
      case 'dashboard':    await showDashboard(main); break;
      case 'documents':    await showDocuments(main); break;
      case 'admin-users':  await showUsers(main); break;
      case 'admin-depts':  await showDepts(main); break;
      case 'admin-audit':  await showAudit(main); break;
      case 'settings':     showSettings(main); break;
      default:             await showDashboard(main);
    }
  }

  // ── Pages ──────────────────────────────────────────────────────────────────

  async function showDashboard(main) {
    UI.showLoading('กำลังโหลด...');
    try {
      DataService.invalidateCache();
      _documents   = await DataService.getAllDocuments();
      _departments = await DataService.getDepartments();
      main.innerHTML = UI.renderDashboard(_documents, _departments, _session);
      wireDashboardEvents();
    } catch (e) {
      main.innerHTML = errorHtml(e.message);
    } finally {
      UI.hideLoading();
    }
  }

  async function showDocuments(main) {
    UI.showLoading();
    try {
      DataService.invalidateCache();
      _documents   = await DataService.getAllDocuments();
      _departments = await DataService.getDepartments();
      main.innerHTML = UI.renderDocumentsPage(_documents, _departments, _session);
      wireDashboardEvents();
    } catch (e) {
      main.innerHTML = errorHtml(e.message);
    } finally {
      UI.hideLoading();
    }
  }

  async function showUsers(main) {
    if (!AuthService.can('manageUsers')) { main.innerHTML = noPermHtml(); return; }
    UI.showLoading();
    try {
      const [users, depts] = await Promise.all([DataService.getUsers(), DataService.getDepartments()]);
      main.innerHTML = UI.renderUsersPage(users, depts);
      wireUsersPageEvents(users, depts);
    } catch (e) {
      main.innerHTML = errorHtml(e.message);
    } finally {
      UI.hideLoading();
    }
  }

  async function showDepts(main) {
    if (!AuthService.can('manageDepartments')) { main.innerHTML = noPermHtml(); return; }
    UI.showLoading();
    try {
      _departments = await DataService.getDepartments();
      main.innerHTML = UI.renderDeptsPage(_departments);
      wireDeptsPageEvents();
    } catch (e) {
      main.innerHTML = errorHtml(e.message);
    } finally {
      UI.hideLoading();
    }
  }

  async function showAudit(main) {
    if (!AuthService.can('viewAuditLog')) { main.innerHTML = noPermHtml(); return; }
    UI.showLoading();
    try {
      const logs = await DataService.getAuditLog();
      main.innerHTML = UI.renderAuditPage(logs);
    } catch (e) {
      main.innerHTML = errorHtml(e.message);
    } finally {
      UI.hideLoading();
    }
  }

  function showSettings(main) {
    if (!AuthService.can('manageSettings')) { main.innerHTML = noPermHtml(); return; }
    main.innerHTML = UI.renderSettingsPage();
    const form = document.getElementById('settings-form');
    if (form) {
      form.addEventListener('submit', async e => {
        e.preventDefault();
        const owner = document.getElementById('s-owner').value.trim();
        const repo  = document.getElementById('s-repo').value.trim();
        const token = document.getElementById('s-token').value.trim();
        try {
          UI.showLoading('ตรวจสอบ...');
          await GitHubService.validateConfig(owner, repo, token);
          localStorage.setItem(STORAGE_KEYS.GITHUB_CONFIG, JSON.stringify({ owner, repo, token }));
          UI.toast('บันทึกการตั้งค่าแล้ว', 'success');
        } catch (err) {
          UI.toast(err.message, 'error');
        } finally {
          UI.hideLoading();
        }
      });
    }
  }

  // ════════════════════════════════════════════════
  // DASHBOARD EVENT WIRING
  // ════════════════════════════════════════════════

  function wireDashboardEvents() {
    // Refresh
    document.getElementById('btn-refresh')?.addEventListener('click', () => navigateTo(_currentPage));

    // New doc buttons
    ['btn-new-doc', 'btn-new-doc-2'].forEach(id => {
      document.getElementById(id)?.addEventListener('click', () => openNewDoc());
    });

    // Search
    const searchEl = document.getElementById('doc-search');
    const filterEl = document.getElementById('doc-filter-status');
    function applyFilter() {
      UI.filterDocGrid(searchEl?.value, filterEl?.value);
    }
    searchEl?.addEventListener('input', applyFilter);
    filterEl?.addEventListener('change', applyFilter);
  }

  function wireUsersPageEvents(users, depts) {
    document.getElementById('btn-new-user')?.addEventListener('click', () => {
      UI.renderUserFormModal(null, depts);
      document.getElementById('btn-save-user')?.addEventListener('click', () => handleSaveUser(null, depts));
    });
  }

  function wireDeptsPageEvents() {
    document.getElementById('btn-new-dept')?.addEventListener('click', () => {
      UI.showModal({
        title: '➕ เพิ่มฝ่ายใหม่',
        body: `<div class="form-group"><label class="form-label">ชื่อฝ่าย *</label>
               <input id="new-dept-name" type="text" class="form-input" placeholder="ชื่อฝ่าย" required /></div>`,
        footer: `<button class="btn btn-ghost" onclick="UI.closeModal()">ยกเลิก</button>
                 <button class="btn btn-primary" id="btn-save-dept-new">สร้างฝ่าย</button>`,
      });
      document.getElementById('btn-save-dept-new')?.addEventListener('click', async () => {
        const name = document.getElementById('new-dept-name')?.value.trim();
        if (!name) { UI.toast('กรุณาระบุชื่อฝ่าย', 'warning'); return; }
        await withLoading(async () => {
          await DataService.createDepartment(name);
          UI.toast(`สร้างฝ่าย "${name}" แล้ว`, 'success');
          UI.closeModal();
          await showDepts(document.getElementById('main-content'));
        });
      });
    });
  }

  // ════════════════════════════════════════════════
  // DOCUMENT ACTIONS (called from inline onclick)
  // ════════════════════════════════════════════════

  async function openStatusModal(docId) {
    const doc = _documents.find(d => d.id === docId);
    if (!doc) { UI.toast('ไม่พบเอกสาร', 'error'); return; }
    UI.renderStatusModal(doc, _departments, _session);

    // Wire status pick buttons
    let pendingChanges = {}; // deptId → { status, note }
    document.querySelectorAll('.status-pick-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const deptId = btn.dataset.dept;
        const status = btn.dataset.status;
        // Update visual
        document.querySelectorAll(`.status-pick-btn[data-dept="${deptId}"]`).forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const noteEl = document.getElementById(`note-${deptId}`);
        pendingChanges[deptId] = { status, note: noteEl?.value || '' };
      });
    });

    document.getElementById('btn-save-status')?.addEventListener('click', async () => {
      if (Object.keys(pendingChanges).length === 0) {
        // Still save even if no changes picked — check note fields
        _departments.forEach(d => {
          const noteEl = document.getElementById(`note-${d.id}`);
          if (noteEl && AuthService.canChangeDeptStatus(d.id)) {
            // mark as unchanged but note might differ
          }
        });
        UI.toast('ไม่มีการเปลี่ยนแปลง', 'info');
        UI.closeModal();
        return;
      }
      await withLoading(async () => {
        for (const [deptId, { status, note }] of Object.entries(pendingChanges)) {
          if (!AuthService.canChangeDeptStatus(deptId)) continue;
          await DataService.updateStatus(docId, deptId, status, note);
        }
        UI.toast('บันทึกสถานะเรียบร้อย', 'success');
        UI.closeModal();
        await navigateTo(_currentPage);
      });
    });
  }

  function openNewDoc() {
    UI.renderDocFormModal(null);
    document.getElementById('btn-save-doc')?.addEventListener('click', async () => {
      const title = document.getElementById('doc-form-title')?.value.trim();
      const desc  = document.getElementById('doc-form-desc')?.value.trim();
      if (!title) { UI.toast('กรุณาระบุชื่อเอกสาร', 'warning'); return; }
      await withLoading(async () => {
        await DataService.createDocument({ title, description: desc });
        UI.toast(`สร้างเอกสาร "${title}" แล้ว`, 'success');
        UI.closeModal();
        await navigateTo(_currentPage);
      });
    });
  }

  async function openEditDoc(docId) {
    const doc = _documents.find(d => d.id === docId);
    if (!doc) { UI.toast('ไม่พบเอกสาร', 'error'); return; }
    UI.renderDocFormModal(doc);
    document.getElementById('btn-save-doc')?.addEventListener('click', async () => {
      const title = document.getElementById('doc-form-title')?.value.trim();
      const desc  = document.getElementById('doc-form-desc')?.value.trim();
      if (!title) { UI.toast('กรุณาระบุชื่อเอกสาร', 'warning'); return; }
      await withLoading(async () => {
        await DataService.updateDocument(docId, { title, description: desc });
        UI.toast('แก้ไขเอกสารแล้ว', 'success');
        UI.closeModal();
        await navigateTo(_currentPage);
      });
    });
  }

  function confirmDeleteDoc(docId, title) {
    UI.showModal({
      title: '⚠️ ยืนยันการลบ',
      body: `<p>คุณต้องการลบเอกสาร <strong>"${UI.escHtml(title)}"</strong> ใช่หรือไม่?<br>การกระทำนี้ไม่สามารถยกเลิกได้</p>`,
      footer: `<button class="btn btn-ghost" onclick="UI.closeModal()">ยกเลิก</button>
               <button class="btn btn-danger" id="btn-confirm-delete">ลบเอกสาร</button>`,
    });
    document.getElementById('btn-confirm-delete')?.addEventListener('click', async () => {
      await withLoading(async () => {
        await DataService.deleteDocument(docId);
        UI.toast('ลบเอกสารแล้ว', 'success');
        UI.closeModal();
        await navigateTo(_currentPage);
      });
    });
  }

  // ════════════════════════════════════════════════
  // USER ACTIONS
  // ════════════════════════════════════════════════

  async function openEditUser(userId) {
    const depts = await DataService.getDepartments();
    const users = await DataService.getUsers();
    const user  = users.find(u => u.id === userId);
    if (!user) { UI.toast('ไม่พบผู้ใช้', 'error'); return; }
    UI.renderUserFormModal(user, depts);
    document.getElementById('btn-save-user')?.addEventListener('click', () => handleSaveUser(userId, depts));
  }

  async function handleSaveUser(userId, depts) {
    const isEdit = !!userId;
    const displayName = document.getElementById('uf-displayname')?.value.trim();
    const password    = document.getElementById('uf-password')?.value;
    const role        = document.getElementById('uf-role')?.value;
    const department  = document.getElementById('uf-dept')?.value || null;

    if (!displayName) { UI.toast('กรุณาระบุชื่อ', 'warning'); return; }
    if (!isEdit && !password) { UI.toast('กรุณาระบุรหัสผ่าน', 'warning'); return; }

    await withLoading(async () => {
      if (isEdit) {
        await DataService.updateUser(userId, { displayName, role, department, password: password || undefined });
        UI.toast('แก้ไขผู้ใช้แล้ว', 'success');
      } else {
        const username = document.getElementById('uf-username')?.value.trim();
        if (!username) { UI.toast('กรุณาระบุชื่อผู้ใช้', 'warning'); return; }
        await DataService.createUser({ username, password, displayName, role, department });
        UI.toast(`สร้างผู้ใช้ "${username}" แล้ว`, 'success');
      }
      UI.closeModal();
      await showUsers(document.getElementById('main-content'));
    });
  }

  function confirmDeleteUser(userId, displayName) {
    UI.showModal({
      title: '⚠️ ยืนยันการลบผู้ใช้',
      body: `<p>คุณต้องการลบผู้ใช้ <strong>${UI.escHtml(displayName)}</strong> ใช่หรือไม่?</p>`,
      footer: `<button class="btn btn-ghost" onclick="UI.closeModal()">ยกเลิก</button>
               <button class="btn btn-danger" id="btn-confirm-del-user">ลบ</button>`,
    });
    document.getElementById('btn-confirm-del-user')?.addEventListener('click', async () => {
      await withLoading(async () => {
        await DataService.deleteUser(userId);
        UI.toast('ลบผู้ใช้แล้ว', 'success');
        UI.closeModal();
        await showUsers(document.getElementById('main-content'));
      });
    });
  }

  // ════════════════════════════════════════════════
  // DEPT ACTIONS
  // ════════════════════════════════════════════════

  function openEditDept(id, currentName) {
    UI.showModal({
      title: '✏️ แก้ไขชื่อฝ่าย',
      body: `<div class="form-group"><label class="form-label">ชื่อฝ่าย *</label>
             <input id="edit-dept-name" type="text" class="form-input" value="${UI.escHtml(currentName)}" required /></div>`,
      footer: `<button class="btn btn-ghost" onclick="UI.closeModal()">ยกเลิก</button>
               <button class="btn btn-primary" id="btn-save-dept-edit">บันทึก</button>`,
    });
    document.getElementById('btn-save-dept-edit')?.addEventListener('click', async () => {
      const name = document.getElementById('edit-dept-name')?.value.trim();
      if (!name) { UI.toast('กรุณาระบุชื่อฝ่าย', 'warning'); return; }
      await withLoading(async () => {
        await DataService.updateDepartment(id, name);
        UI.toast('แก้ไขชื่อฝ่ายแล้ว', 'success');
        UI.closeModal();
        await showDepts(document.getElementById('main-content'));
      });
    });
  }

  function confirmDeleteDept(id, name) {
    UI.showModal({
      title: '⚠️ ยืนยันการลบฝ่าย',
      body: `<p>คุณต้องการลบฝ่าย <strong>${UI.escHtml(name)}</strong> ใช่หรือไม่?<br>สถานะของฝ่ายนี้ในเอกสารทั้งหมดจะยังคงอยู่</p>`,
      footer: `<button class="btn btn-ghost" onclick="UI.closeModal()">ยกเลิก</button>
               <button class="btn btn-danger" id="btn-confirm-del-dept">ลบฝ่าย</button>`,
    });
    document.getElementById('btn-confirm-del-dept')?.addEventListener('click', async () => {
      await withLoading(async () => {
        await DataService.deleteDepartment(id);
        UI.toast('ลบฝ่ายแล้ว', 'success');
        UI.closeModal();
        await showDepts(document.getElementById('main-content'));
      });
    });
  }

  // ════════════════════════════════════════════════
  // AUTH HANDLERS
  // ════════════════════════════════════════════════

  function handleLogout() {
    AuthService.logout();
    location.reload();
  }

  // ════════════════════════════════════════════════
  // SETUP & LOGIN PAGE FLOWS (no shell)
  // ════════════════════════════════════════════════

  function showPage(page) {
    document.body.innerHTML = page === 'setup' ? UI.renderSetup() : UI.renderLogin();
    if (page === 'setup') wireSetupForm();
    else wireLoginForm();
  }

  function wireSetupForm() {
    document.getElementById('setup-form')?.addEventListener('submit', async e => {
      e.preventDefault();
      const owner = document.getElementById('setup-owner').value.trim();
      const repo  = document.getElementById('setup-repo').value.trim();
      const token = document.getElementById('setup-token').value.trim();
      const btn   = document.getElementById('setup-submit');
      btn.disabled = true;
      btn.querySelector('span').textContent = 'กำลังตรวจสอบ...';
      try {
        UI.showLoading('กำลังเชื่อมต่อ GitHub...');
        await GitHubService.validateConfig(owner, repo, token);
        // Save config
        localStorage.setItem(STORAGE_KEYS.GITHUB_CONFIG, JSON.stringify({ owner, repo, token }));

        // Init repo with default data (hash passwords)
        UI.showLoading('กำลังตั้งค่าข้อมูลเริ่มต้น...');
        const users = [];
        for (const u of DEFAULT_USERS) {
          const hash = await AuthService.hashPassword(u.defaultPassword);
          users.push({ id: u.id, username: u.username, passwordHash: hash,
                       displayName: u.displayName, role: u.role, department: u.department });
        }
        await GitHubService.initializeRepo(
          { users },
          { departments: DEFAULT_DEPARTMENTS },
          { documents: [], auditLog: [] }
        );
        UI.hideLoading();
        UI.toast('ตั้งค่าเสร็จสิ้น! กำลังไปหน้า Login...', 'success');
        setTimeout(() => { showPage('login'); }, 1500);
      } catch (err) {
        UI.hideLoading();
        UI.toast(err.message, 'error');
        btn.disabled = false;
        btn.querySelector('span').textContent = 'เชื่อมต่อและตั้งค่าระบบ';
      }
    });
  }

  function wireLoginForm() {
    document.getElementById('login-form')?.addEventListener('submit', async e => {
      e.preventDefault();
      const username = document.getElementById('login-user').value.trim();
      const password = document.getElementById('login-pass').value;
      const btn = document.getElementById('login-submit');
      btn.disabled = true;
      btn.querySelector('span').textContent = 'กำลังเข้าสู่ระบบ...';
      try {
        UI.showLoading('กำลังตรวจสอบ...');
        _session = await AuthService.login(username, password);
        UI.hideLoading();
        await loadApp();
      } catch (err) {
        UI.hideLoading();
        UI.toast(err.message, 'error');
        btn.disabled = false;
        btn.querySelector('span').textContent = 'เข้าสู่ระบบ';
      }
    });
  }

  // ════════════════════════════════════════════════
  // HELPERS
  // ════════════════════════════════════════════════

  async function withLoading(fn) {
    UI.showLoading('กำลังบันทึก...');
    try { await fn(); }
    catch (e) { UI.toast(e.message, 'error'); }
    finally { UI.hideLoading(); }
  }

  function errorHtml(msg) {
    return `<div class="empty-state"><div class="empty-icon">⚠️</div><p>${UI.escHtml(msg)}</p>
            <button class="btn btn-ghost mt-2" onclick="location.reload()">โหลดใหม่</button></div>`;
  }

  function noPermHtml() {
    return `<div class="empty-state"><div class="empty-icon">🔒</div><p>คุณไม่มีสิทธิ์เข้าถึงหน้านี้</p></div>`;
  }

  return {
    boot,
    navigateTo,
    openStatusModal,
    openEditDoc,
    openNewDoc,
    confirmDeleteDoc,
    openEditUser,
    confirmDeleteUser,
    openEditDept,
    confirmDeleteDept,
  };
})();

// ── Entry Point ──────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => App.boot());
