/**
 * DSCP - UI Rendering Engine
 * All HTML generation and DOM manipulation live here.
 */

const UI = (() => {

  // ── Status helpers ─────────────────────────────────────────────────────────
  const STATUS_META = {
    red:    { label: 'ยังไม่ถึง',       icon: '🔴', cls: 'status-red',    th: 'ยังไม่ถึงฝ่าย' },
    yellow: { label: 'รอดำเนินการ',    icon: '🟡', cls: 'status-yellow', th: 'เอกสารมาถึงแล้ว' },
    green:  { label: 'ดำเนินการแล้ว', icon: '🟢', cls: 'status-green',  th: 'ดำเนินการเรียบร้อย' },
  };

  function statusLight(status, deptName, small = false) {
    const m = STATUS_META[status] || STATUS_META.red;
    return `<span class="status-light ${m.cls}${small ? ' status-sm' : ''}" title="${deptName}: ${m.th}">
              <span class="light-core"></span>
            </span>`;
  }

  // ── Toast notification ─────────────────────────────────────────────────────
  let _toastTimer = null;
  function toast(msg, type = 'info') {
    const existing = document.getElementById('dscp-toast');
    if (existing) existing.remove();
    clearTimeout(_toastTimer);

    const icons = { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️' };
    const el = document.createElement('div');
    el.id = 'dscp-toast';
    el.className = `toast toast-${type} toast-enter`;
    el.innerHTML = `<span class="toast-icon">${icons[type] || 'ℹ️'}</span><span>${msg}</span>`;
    document.body.appendChild(el);

    requestAnimationFrame(() => el.classList.remove('toast-enter'));
    _toastTimer = setTimeout(() => {
      el.classList.add('toast-exit');
      setTimeout(() => el.remove(), 400);
    }, 3500);
  }

  // ── Loading overlay ────────────────────────────────────────────────────────
  function showLoading(msg = 'กำลังโหลด...') {
    let el = document.getElementById('dscp-loading');
    if (!el) {
      el = document.createElement('div');
      el.id = 'dscp-loading';
      el.innerHTML = `<div class="loading-inner">
        <div class="spinner"></div>
        <span id="dscp-loading-msg">${msg}</span>
      </div>`;
      document.body.appendChild(el);
    } else {
      document.getElementById('dscp-loading-msg').textContent = msg;
    }
    el.style.display = 'flex';
  }

  function hideLoading() {
    const el = document.getElementById('dscp-loading');
    if (el) el.style.display = 'none';
  }

  // ── Modal ──────────────────────────────────────────────────────────────────
  function showModal({ title, body, footer = '', size = 'md', id = 'dscp-modal' }) {
    closeModal(id);
    const el = document.createElement('div');
    el.id = id;
    el.className = 'modal-overlay';
    el.innerHTML = `
      <div class="modal modal-${size}" role="dialog" aria-modal="true" aria-label="${title}">
        <div class="modal-header">
          <h3 class="modal-title">${title}</h3>
          <button class="modal-close" onclick="UI.closeModal('${id}')" aria-label="ปิด">&times;</button>
        </div>
        <div class="modal-body">${body}</div>
        ${footer ? `<div class="modal-footer">${footer}</div>` : ''}
      </div>`;
    document.body.appendChild(el);
    requestAnimationFrame(() => el.classList.add('modal-open'));
    el.addEventListener('click', e => { if (e.target === el) closeModal(id); });
  }

  function closeModal(id = 'dscp-modal') {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.remove('modal-open');
    setTimeout(() => el.remove(), 300);
  }

  // ── Sidebar ────────────────────────────────────────────────────────────────
  function renderSidebar(session) {
    const roleLabel = { admin: 'ผู้ดูแลระบบ', manager: 'ผู้บริหาร', staff: 'เจ้าหน้าที่' }[session.role] || session.role;
    const roleColor = { admin: '#f59e0b', manager: '#60a5fa', staff: '#34d399' }[session.role] || '#8892a4';

    const adminLinks = session.role === 'admin' ? `
      <div class="nav-group-label">จัดการระบบ</div>
      <a class="nav-link" href="#" data-page="admin-users" id="nav-admin-users">
        <svg viewBox="0 0 24 24"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg>
        จัดการผู้ใช้
      </a>
      <a class="nav-link" href="#" data-page="admin-depts" id="nav-admin-depts">
        <svg viewBox="0 0 24 24"><path d="M12 3L1 9l11 6 9-4.91V17h2V9L12 3zM5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82z"/></svg>
        จัดการฝ่าย
      </a>
      <a class="nav-link" href="#" data-page="admin-audit" id="nav-admin-audit">
        <svg viewBox="0 0 24 24"><path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zM6 20V4h7v5h5v11H6z"/></svg>
        ประวัติการใช้งาน
      </a>
      <a class="nav-link" href="#" data-page="settings" id="nav-settings">
        <svg viewBox="0 0 24 24"><path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/></svg>
        ตั้งค่า GitHub
      </a>` : '';

    return `
    <aside class="sidebar" id="sidebar">
      <div class="sidebar-brand">
        <div class="brand-icon">
          <svg viewBox="0 0 24 24"><path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/></svg>
        </div>
        <div>
          <div class="brand-name">DSCP</div>
          <div class="brand-sub">เดินเอกสาร</div>
        </div>
      </div>

      <div class="sidebar-user">
        <div class="user-avatar" style="background: ${roleColor}22; border-color: ${roleColor}44">
          <span style="color:${roleColor}">${session.displayName.charAt(0)}</span>
        </div>
        <div class="user-info">
          <div class="user-name">${session.displayName}</div>
          <div class="user-role" style="color:${roleColor}">${roleLabel}</div>
        </div>
      </div>

      <nav class="sidebar-nav">
        <div class="nav-group-label">เมนูหลัก</div>
        <a class="nav-link" href="#" data-page="dashboard" id="nav-dashboard">
          <svg viewBox="0 0 24 24"><path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/></svg>
          แดชบอร์ด
        </a>
        ${AuthService.can('createDocument') ? `
        <a class="nav-link" href="#" data-page="documents" id="nav-documents">
          <svg viewBox="0 0 24 24"><path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zM13 9V3.5L18.5 9H13z"/></svg>
          จัดการเอกสาร
        </a>` : ''}
        ${adminLinks}
      </nav>

      <button class="logout-btn" id="btn-logout">
        <svg viewBox="0 0 24 24"><path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/></svg>
        ออกจากระบบ
      </button>
    </aside>
    <button class="sidebar-toggle" id="sidebar-toggle" aria-label="เปิด/ปิดเมนู">
      <span></span><span></span><span></span>
    </button>`;
  }

  // ── Setup Page ─────────────────────────────────────────────────────────────
  function renderSetup() {
    return `
    <div class="auth-page">
      <div class="auth-card setup-card">
        <div class="auth-logo">
          <div class="logo-circle"><svg viewBox="0 0 24 24" width="36" height="36"><path fill="currentColor" d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/></svg></div>
          <h1 class="auth-title">ตั้งค่า DSCP</h1>
          <p class="auth-sub">เชื่อมต่อ GitHub Repository</p>
        </div>
        <form id="setup-form" class="auth-form" autocomplete="off">
          <div class="form-group">
            <label class="form-label">GitHub Username / Organization</label>
            <input id="setup-owner" type="text" class="form-input" placeholder="เช่น myschool" required />
          </div>
          <div class="form-group">
            <label class="form-label">Repository Name</label>
            <input id="setup-repo" type="text" class="form-input" placeholder="เช่น dscp-data" required />
          </div>
          <div class="form-group">
            <label class="form-label">Personal Access Token (PAT)</label>
            <div class="input-eye">
              <input id="setup-token" type="password" class="form-input" placeholder="ghp_xxxxxxxxxxxx" required />
              <button type="button" class="eye-btn" onclick="UI.toggleEye('setup-token',this)">👁</button>
            </div>
            <p class="form-hint">สร้าง Token ได้ที่ GitHub → Settings → Developer settings → Personal access tokens<br>ต้องมีสิทธิ์ <code>repo</code></p>
          </div>
          <button type="submit" class="btn btn-primary btn-full" id="setup-submit">
            <span>เชื่อมต่อและตั้งค่าระบบ</span>
          </button>
        </form>
      </div>
    </div>`;
  }

  // ── Login Page ─────────────────────────────────────────────────────────────
  function renderLogin() {
    return `
    <div class="auth-page">
      <div class="auth-card">
        <div class="auth-logo">
          <div class="logo-circle"><svg viewBox="0 0 24 24" width="36" height="36"><path fill="currentColor" d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/></svg></div>
          <h1 class="auth-title">${DSCP_CONFIG.APP_NAME}</h1>
          <p class="auth-sub">ระบบตรวจสอบการเดินเอกสาร</p>
        </div>
        <form id="login-form" class="auth-form">
          <div class="form-group">
            <label class="form-label" for="login-user">ชื่อผู้ใช้</label>
            <input id="login-user" type="text" class="form-input" placeholder="username" required autocomplete="username" />
          </div>
          <div class="form-group">
            <label class="form-label" for="login-pass">รหัสผ่าน</label>
            <div class="input-eye">
              <input id="login-pass" type="password" class="form-input" placeholder="password" required autocomplete="current-password" />
              <button type="button" class="eye-btn" onclick="UI.toggleEye('login-pass',this)">👁</button>
            </div>
          </div>
          <button type="submit" class="btn btn-primary btn-full" id="login-submit">
            <span>เข้าสู่ระบบ</span>
          </button>
        </form>
        <div class="login-hint">
          <p>บัญชีทดสอบ: <code>admin</code> / <code>admin1234</code></p>
        </div>
      </div>
    </div>`;
  }

  // ── Dashboard ──────────────────────────────────────────────────────────────
  function renderDashboard(documents, departments, session) {
    const stats = computeStats(documents, departments);
    const canCreate = AuthService.can('createDocument');

    return `
    <div class="page-header">
      <div>
        <h2 class="page-title">แดชบอร์ด</h2>
        <p class="page-sub">ภาพรวมการเดินเอกสารทั้งหมด</p>
      </div>
      <div class="header-actions">
        <button class="btn btn-ghost btn-sm" id="btn-refresh" title="รีเฟรชข้อมูล">
          <svg viewBox="0 0 24 24" width="16"><path fill="currentColor" d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/></svg>
          รีเฟรช
        </button>
        ${canCreate ? `<button class="btn btn-primary btn-sm" id="btn-new-doc">
          <svg viewBox="0 0 24 24" width="16"><path fill="currentColor" d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
          สร้างเอกสาร
        </button>` : ''}
      </div>
    </div>

    <!-- Stats -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon stat-icon-blue"><svg viewBox="0 0 24 24"><path fill="currentColor" d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6z"/></svg></div>
        <div class="stat-body"><div class="stat-value">${documents.length}</div><div class="stat-label">เอกสารทั้งหมด</div></div>
      </div>
      <div class="stat-card">
        <div class="stat-icon stat-icon-green"><svg viewBox="0 0 24 24"><path fill="currentColor" d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg></div>
        <div class="stat-body"><div class="stat-value">${stats.fullyDone}</div><div class="stat-label">ดำเนินการครบแล้ว</div></div>
      </div>
      <div class="stat-card">
        <div class="stat-icon stat-icon-yellow"><svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg></div>
        <div class="stat-body"><div class="stat-value">${stats.inProgress}</div><div class="stat-label">กำลังดำเนินการ</div></div>
      </div>
      <div class="stat-card">
        <div class="stat-icon stat-icon-red"><svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg></div>
        <div class="stat-body"><div class="stat-value">${stats.notStarted}</div><div class="stat-label">ยังไม่เริ่ม</div></div>
      </div>
    </div>

    <!-- Search & Filter -->
    <div class="filter-bar">
      <div class="search-box">
        <svg viewBox="0 0 24 24" width="16"><path fill="currentColor" d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>
        <input id="doc-search" type="text" placeholder="ค้นหาเอกสาร..." class="search-input" />
      </div>
      <select id="doc-filter-status" class="form-select-sm">
        <option value="">ทุกสถานะ</option>
        <option value="all-green">ครบทุกฝ่าย ✅</option>
        <option value="has-yellow">กำลังดำเนินการ 🟡</option>
        <option value="all-red">ยังไม่เริ่ม 🔴</option>
      </select>
    </div>

    <!-- Documents Grid -->
    <div class="docs-grid" id="docs-grid">
      ${documents.length === 0
        ? `<div class="empty-state"><div class="empty-icon">📄</div><p>ยังไม่มีเอกสาร</p>${canCreate ? '<button class="btn btn-primary mt-2" id="btn-new-doc-2">+ สร้างเอกสารแรก</button>' : ''}</div>`
        : documents.map(doc => renderDocCard(doc, departments, session)).join('')
      }
    </div>`;
  }

  function computeStats(documents, departments) {
    let fullyDone = 0, inProgress = 0, notStarted = 0;
    documents.forEach(doc => {
      const statuses = departments.map(d => doc.statuses?.[d.id]?.status || 'red');
      if (statuses.every(s => s === 'green')) fullyDone++;
      else if (statuses.every(s => s === 'red')) notStarted++;
      else inProgress++;
    });
    return { fullyDone, inProgress, notStarted };
  }

  // ── Document Card ──────────────────────────────────────────────────────────
  function renderDocCard(doc, departments, session) {
    const statuses = departments.map(d => ({
      dept: d,
      st: doc.statuses?.[d.id] || { status: 'red' },
    }));

    const allGreen = statuses.every(s => s.st.status === 'green');
    const hasYellow = statuses.some(s => s.st.status === 'yellow');
    const cardBadge = allGreen
      ? '<span class="badge badge-green">ครบทุกฝ่าย</span>'
      : hasYellow
        ? '<span class="badge badge-yellow">กำลังดำเนินการ</span>'
        : '<span class="badge badge-red">ยังไม่เริ่ม</span>';

    const lightsHtml = statuses.map(({ dept, st }) => `
      <div class="light-col">
        <div class="light-label">${dept.name}</div>
        ${statusLight(st.status, dept.name)}
        ${st.updatedByName ? `<div class="light-by">${st.updatedByName}</div>` : '<div class="light-by">-</div>'}
      </div>`).join('');

    const canEdit = AuthService.can('editDocument');
    const canDelete = AuthService.can('deleteDocument');
    const canStatus = AuthService.can('changeStatus');

    const d = new Date(doc.createdAt);
    const dateStr = d.toLocaleDateString('th-TH', { day: '2-digit', month: 'short', year: '2-digit' });

    return `
    <div class="doc-card ${allGreen ? 'doc-done' : ''}" data-doc-id="${doc.id}" data-title="${escHtml(doc.title)}">
      <div class="doc-card-header">
        <div class="doc-title-row">
          <h3 class="doc-title">${escHtml(doc.title)}</h3>
          ${cardBadge}
        </div>
        <div class="doc-meta">
          <span>${dateStr}</span>
          <span>โดย ${escHtml(doc.createdByName || doc.createdBy)}</span>
        </div>
        ${doc.description ? `<p class="doc-desc">${escHtml(doc.description)}</p>` : ''}
      </div>
      <div class="doc-lights">${lightsHtml}</div>
      <div class="doc-card-footer">
        ${canStatus ? `<button class="btn btn-ghost btn-xs" onclick="App.openStatusModal('${doc.id}')">🔄 อัพเดตสถานะ</button>` : ''}
        ${canEdit ? `<button class="btn btn-ghost btn-xs" onclick="App.openEditDoc('${doc.id}')">✏️ แก้ไข</button>` : ''}
        ${canDelete ? `<button class="btn btn-danger btn-xs" onclick="App.confirmDeleteDoc('${doc.id}','${escHtml(doc.title)}')">🗑️</button>` : ''}
      </div>
    </div>`;
  }

  // ── Status Update Modal ────────────────────────────────────────────────────
  function renderStatusModal(doc, departments, session) {
    const rows = departments.map(dept => {
      const st = doc.statuses?.[dept.id] || { status: 'red' };
      const canChange = AuthService.canChangeDeptStatus(dept.id);
      const m = STATUS_META[st.status] || STATUS_META.red;

      return `
      <div class="status-row${canChange ? ' status-row-editable' : ''}">
        <div class="status-row-dept">
          <span class="status-dot ${m.cls}"></span>
          <strong>${escHtml(dept.name)}</strong>
        </div>
        ${canChange ? `
        <div class="status-row-controls">
          <div class="status-btns">
            <button class="status-pick-btn ${st.status === 'red' ? 'active' : ''} pick-red" 
              data-dept="${dept.id}" data-status="red" title="ยังไม่ถึง">🔴</button>
            <button class="status-pick-btn ${st.status === 'yellow' ? 'active' : ''} pick-yellow" 
              data-dept="${dept.id}" data-status="yellow" title="รอดำเนินการ">🟡</button>
            <button class="status-pick-btn ${st.status === 'green' ? 'active' : ''} pick-green" 
              data-dept="${dept.id}" data-status="green" title="ดำเนินการแล้ว">🟢</button>
          </div>
          <input type="text" class="form-input-sm" placeholder="หมายเหตุ (ไม่จำเป็น)" 
            id="note-${dept.id}" value="${escHtml(st.note || '')}" />
        </div>` : `
        <div class="status-row-view">
          <span>${m.icon} ${m.label}</span>
          ${st.updatedByName ? `<span class="text-muted">โดย ${escHtml(st.updatedByName)}</span>` : ''}
          ${st.note ? `<span class="text-muted">"${escHtml(st.note)}"</span>` : ''}
        </div>`}
      </div>`;
    }).join('');

    showModal({
      title: `🔄 อัพเดตสถานะ — ${escHtml(doc.title)}`,
      body: `<div class="status-modal-body">${rows}</div>`,
      footer: `<button class="btn btn-ghost" onclick="UI.closeModal()">ยกเลิก</button>
               <button class="btn btn-primary" id="btn-save-status" data-doc-id="${doc.id}">บันทึก</button>`,
      size: 'lg',
    });
  }

  // ── Create / Edit Document Modal ───────────────────────────────────────────
  function renderDocFormModal(doc = null) {
    const isEdit = !!doc;
    showModal({
      title: isEdit ? `✏️ แก้ไขเอกสาร` : '➕ สร้างเอกสารใหม่',
      body: `
        <form id="doc-form" class="auth-form" style="gap:12px">
          <div class="form-group">
            <label class="form-label">ชื่อเอกสาร *</label>
            <input id="doc-form-title" type="text" class="form-input" placeholder="ระบุชื่อเอกสาร" value="${escHtml(doc?.title || '')}" required />
          </div>
          <div class="form-group">
            <label class="form-label">รายละเอียด</label>
            <textarea id="doc-form-desc" class="form-input form-textarea" placeholder="รายละเอียดเพิ่มเติม (ไม่จำเป็น)" rows="3">${escHtml(doc?.description || '')}</textarea>
          </div>
        </form>`,
      footer: `<button class="btn btn-ghost" onclick="UI.closeModal()">ยกเลิก</button>
               <button class="btn btn-primary" id="btn-save-doc" data-doc-id="${doc?.id || ''}">
                 ${isEdit ? 'บันทึกการแก้ไข' : 'สร้างเอกสาร'}
               </button>`,
    });
  }

  // ── Admin: Users Page ──────────────────────────────────────────────────────
  function renderUsersPage(users, departments) {
    const roleLabel = { admin: 'ผู้ดูแลระบบ', manager: 'ผู้บริหาร', staff: 'เจ้าหน้าที่' };
    const deptMap = Object.fromEntries(departments.map(d => [d.id, d.name]));

    return `
    <div class="page-header">
      <div><h2 class="page-title">จัดการผู้ใช้งาน</h2><p class="page-sub">เพิ่ม แก้ไข ลบ ผู้ใช้งานในระบบ</p></div>
      <button class="btn btn-primary btn-sm" id="btn-new-user">+ เพิ่มผู้ใช้</button>
    </div>
    <div class="table-card">
      <table class="data-table">
        <thead><tr><th>ชื่อผู้ใช้</th><th>ชื่อ-นามสกุล</th><th>สิทธิ์</th><th>ฝ่าย</th><th>จัดการ</th></tr></thead>
        <tbody>
          ${users.map(u => `
          <tr>
            <td><code>${escHtml(u.username)}</code></td>
            <td>${escHtml(u.displayName)}</td>
            <td><span class="role-badge role-${u.role}">${roleLabel[u.role] || u.role}</span></td>
            <td>${u.department ? escHtml(deptMap[u.department] || u.department) : '<span class="text-muted">-</span>'}</td>
            <td class="td-actions">
              <button class="btn btn-ghost btn-xs" onclick="App.openEditUser('${u.id}')">✏️</button>
              <button class="btn btn-danger btn-xs" onclick="App.confirmDeleteUser('${u.id}','${escHtml(u.displayName)}')">🗑️</button>
            </td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>`;
  }

  function renderUserFormModal(user = null, departments = []) {
    const isEdit = !!user;
    const deptOptions = departments.map(d =>
      `<option value="${d.id}" ${user?.department === d.id ? 'selected' : ''}>${escHtml(d.name)}</option>`
    ).join('');

    showModal({
      title: isEdit ? '✏️ แก้ไขผู้ใช้' : '➕ เพิ่มผู้ใช้ใหม่',
      body: `
        <form id="user-form" class="auth-form" style="gap:12px">
          ${!isEdit ? `<div class="form-group">
            <label class="form-label">ชื่อผู้ใช้ *</label>
            <input id="uf-username" type="text" class="form-input" placeholder="username" required />
          </div>` : ''}
          <div class="form-group">
            <label class="form-label">ชื่อ-นามสกุล *</label>
            <input id="uf-displayname" type="text" class="form-input" value="${escHtml(user?.displayName || '')}" required />
          </div>
          <div class="form-group">
            <label class="form-label">${isEdit ? 'รหัสผ่านใหม่ (เว้นว่างถ้าไม่เปลี่ยน)' : 'รหัสผ่าน *'}</label>
            <div class="input-eye">
              <input id="uf-password" type="password" class="form-input" ${!isEdit ? 'required' : ''} />
              <button type="button" class="eye-btn" onclick="UI.toggleEye('uf-password',this)">👁</button>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">สิทธิ์การใช้งาน *</label>
            <select id="uf-role" class="form-input" onchange="UI.toggleDeptField(this.value)">
              <option value="admin" ${user?.role === 'admin' ? 'selected' : ''}>ผู้ดูแลระบบ</option>
              <option value="manager" ${user?.role === 'manager' ? 'selected' : ''}>ผู้บริหาร</option>
              <option value="staff" ${user?.role === 'staff' ? 'selected' : ''}>เจ้าหน้าที่</option>
            </select>
          </div>
          <div class="form-group" id="dept-field" style="display:${user?.role === 'staff' ? 'block' : 'none'}">
            <label class="form-label">ฝ่าย</label>
            <select id="uf-dept" class="form-input">
              <option value="">-- ไม่ระบุ --</option>
              ${deptOptions}
            </select>
          </div>
        </form>`,
      footer: `<button class="btn btn-ghost" onclick="UI.closeModal()">ยกเลิก</button>
               <button class="btn btn-primary" id="btn-save-user" data-user-id="${user?.id || ''}">
                 ${isEdit ? 'บันทึก' : 'สร้างผู้ใช้'}
               </button>`,
    });
    // set initial role display
    const roleEl = document.getElementById('uf-role');
    if (roleEl) UI.toggleDeptField(roleEl.value);
  }

  // ── Admin: Departments Page ────────────────────────────────────────────────
  function renderDeptsPage(departments) {
    return `
    <div class="page-header">
      <div><h2 class="page-title">จัดการฝ่าย</h2><p class="page-sub">เพิ่ม แก้ไข ลบ ฝ่ายในระบบ</p></div>
      <button class="btn btn-primary btn-sm" id="btn-new-dept">+ เพิ่มฝ่าย</button>
    </div>
    <div class="table-card">
      <table class="data-table">
        <thead><tr><th>#</th><th>ชื่อฝ่าย</th><th>จัดการ</th></tr></thead>
        <tbody>
          ${departments.map((d, i) => `
          <tr>
            <td class="text-muted">${i + 1}</td>
            <td><strong>${escHtml(d.name)}</strong></td>
            <td class="td-actions">
              <button class="btn btn-ghost btn-xs" onclick="App.openEditDept('${d.id}','${escHtml(d.name)}')">✏️</button>
              <button class="btn btn-danger btn-xs" onclick="App.confirmDeleteDept('${d.id}','${escHtml(d.name)}')">🗑️</button>
            </td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>`;
  }

  // ── Admin: Audit Log ───────────────────────────────────────────────────────
  function renderAuditPage(logs) {
    return `
    <div class="page-header">
      <div><h2 class="page-title">ประวัติการใช้งาน</h2><p class="page-sub">บันทึกการดำเนินการทั้งหมด (ล่าสุด 500 รายการ)</p></div>
    </div>
    <div class="table-card">
      <table class="data-table">
        <thead><tr><th>เวลา</th><th>ผู้ใช้</th><th>การดำเนินการ</th></tr></thead>
        <tbody>
          ${logs.length === 0 ? `<tr><td colspan="3" class="text-center text-muted">ยังไม่มีประวัติ</td></tr>` :
            logs.map(l => `
            <tr>
              <td class="text-muted text-sm">${new Date(l.timestamp).toLocaleString('th-TH')}</td>
              <td>${escHtml(l.displayName || l.user)}</td>
              <td>${escHtml(l.details)}</td>
            </tr>`).join('')}
        </tbody>
      </table>
    </div>`;
  }

  // ── Settings Page ──────────────────────────────────────────────────────────
  function renderSettingsPage() {
    const cfg = GitHubService.getConfig() || {};
    return `
    <div class="page-header">
      <div><h2 class="page-title">ตั้งค่า GitHub</h2><p class="page-sub">แก้ไขการเชื่อมต่อ GitHub Repository</p></div>
    </div>
    <div class="settings-card">
      <form id="settings-form" class="auth-form" style="gap:16px;max-width:480px">
        <div class="form-group">
          <label class="form-label">GitHub Owner</label>
          <input id="s-owner" type="text" class="form-input" value="${escHtml(cfg.owner || '')}" required />
        </div>
        <div class="form-group">
          <label class="form-label">Repository Name</label>
          <input id="s-repo" type="text" class="form-input" value="${escHtml(cfg.repo || '')}" required />
        </div>
        <div class="form-group">
          <label class="form-label">Personal Access Token</label>
          <div class="input-eye">
            <input id="s-token" type="password" class="form-input" value="${escHtml(cfg.token || '')}" required />
            <button type="button" class="eye-btn" onclick="UI.toggleEye('s-token',this)">👁</button>
          </div>
        </div>
        <button type="submit" class="btn btn-primary">บันทึกการตั้งค่า</button>
      </form>
    </div>`;
  }

  // ── Documents Management Page ──────────────────────────────────────────────
  function renderDocumentsPage(documents, departments, session) {
    return `
    <div class="page-header">
      <div><h2 class="page-title">จัดการเอกสาร</h2><p class="page-sub">รายการเอกสารทั้งหมดในระบบ</p></div>
      ${AuthService.can('createDocument') ? `<button class="btn btn-primary btn-sm" id="btn-new-doc">+ สร้างเอกสาร</button>` : ''}
    </div>
    <div class="filter-bar">
      <div class="search-box">
        <svg viewBox="0 0 24 24" width="16"><path fill="currentColor" d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>
        <input id="doc-search" type="text" placeholder="ค้นหา..." class="search-input" />
      </div>
    </div>
    <div class="docs-grid" id="docs-grid">
      ${documents.length === 0
        ? `<div class="empty-state"><div class="empty-icon">📄</div><p>ยังไม่มีเอกสาร</p></div>`
        : documents.map(doc => renderDocCard(doc, departments, session)).join('')}
    </div>`;
  }

  // ── Utility ────────────────────────────────────────────────────────────────
  function escHtml(s) {
    return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  function toggleEye(inputId, btn) {
    const input = document.getElementById(inputId);
    if (!input) return;
    if (input.type === 'password') { input.type = 'text'; btn.textContent = '🙈'; }
    else { input.type = 'password'; btn.textContent = '👁'; }
  }

  function toggleDeptField(role) {
    const el = document.getElementById('dept-field');
    if (el) el.style.display = role === 'staff' ? 'block' : 'none';
  }

  function setActiveNav(page) {
    document.querySelectorAll('.nav-link').forEach(a => {
      a.classList.toggle('active', a.dataset.page === page);
    });
  }

  function filterDocGrid(query, statusFilter) {
    const cards = document.querySelectorAll('.doc-card');
    query = (query || '').toLowerCase();
    cards.forEach(card => {
      const title = (card.dataset.title || '').toLowerCase();
      const matchQ = !query || title.includes(query);
      let matchS = true;
      if (statusFilter === 'all-green') matchS = card.classList.contains('doc-done');
      else if (statusFilter === 'has-yellow') {
        matchS = card.querySelector('.status-yellow') !== null && !card.classList.contains('doc-done');
      } else if (statusFilter === 'all-red') {
        matchS = !card.querySelector('.status-yellow') && !card.querySelector('.status-green');
      }
      card.style.display = matchQ && matchS ? '' : 'none';
    });
  }

  return {
    toast, showLoading, hideLoading, showModal, closeModal,
    renderSetup, renderLogin, renderSidebar, renderDashboard,
    renderDocCard, renderStatusModal, renderDocFormModal,
    renderUsersPage, renderUserFormModal, renderDeptsPage,
    renderAuditPage, renderSettingsPage, renderDocumentsPage,
    toggleEye, toggleDeptField, setActiveNav, filterDocGrid,
    statusLight, escHtml,
  };
})();
