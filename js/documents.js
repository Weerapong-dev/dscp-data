/**
 * DSCP - Document & Data Management Service
 * CRUD operations for documents, departments, users, and audit log.
 */

const DataService = (() => {
  // ── Helpers ───────────────────────────────────────────────────────────────
  function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  }

  function now() {
    return new Date().toISOString();
  }

  // ── Audit log entry ───────────────────────────────────────────────────────
  function makeLog(action, details) {
    const s = AuthService.getSession();
    return {
      id: uid(),
      timestamp: now(),
      user: s ? s.username : 'system',
      displayName: s ? s.displayName : 'ระบบ',
      action,
      details,
    };
  }

  // ════════════════════════════════════════════════
  // DOCUMENTS
  // ════════════════════════════════════════════════

  async function getDocs() {
    // Simple cache
    const ts = localStorage.getItem(STORAGE_KEYS.CACHE_TS);
    if (ts && Date.now() - parseInt(ts) < CACHE_DURATION) {
      const cached = localStorage.getItem(STORAGE_KEYS.CACHE_DOCS);
      if (cached) return JSON.parse(cached);
    }
    const r = await GitHubService.readFile('data/documents.json');
    if (!r) return { documents: [], auditLog: [] };
    localStorage.setItem(STORAGE_KEYS.CACHE_DOCS, JSON.stringify(r.content));
    localStorage.setItem(STORAGE_KEYS.CACHE_TS, Date.now().toString());
    return r.content;
  }

  function invalidateCache() {
    localStorage.removeItem(STORAGE_KEYS.CACHE_DOCS);
    localStorage.removeItem(STORAGE_KEYS.CACHE_TS);
  }

  async function getAllDocuments() {
    const data = await getDocs();
    return data.documents || [];
  }

  async function createDocument({ title, description }) {
    // get departments for initial statuses
    const deptRes = await GitHubService.readFile('data/departments.json');
    const departments = deptRes ? deptRes.content.departments : [];

    const statuses = {};
    departments.forEach(d => {
      statuses[d.id] = { status: 'red', updatedBy: null, updatedAt: null, note: '' };
    });

    const docId = 'doc-' + uid();
    const session = AuthService.getSession();
    const newDoc = {
      id: docId,
      title: title.trim(),
      description: (description || '').trim(),
      createdBy: session.username,
      createdByName: session.displayName,
      createdAt: now(),
      updatedAt: now(),
      statuses,
    };

    invalidateCache();
    const r = await GitHubService.readFile('data/documents.json');
    const data = r ? r.content : { documents: [], auditLog: [] };
    data.documents.unshift(newDoc);
    data.auditLog.unshift(makeLog('create_document', `สร้างเอกสาร: ${title}`));
    if (data.auditLog.length > 500) data.auditLog = data.auditLog.slice(0, 500);
    await GitHubService.writeFile('data/documents.json', data, r ? r.sha : null, `[DSCP] create doc: ${title}`);
    invalidateCache();
    return newDoc;
  }

  async function updateDocument(docId, { title, description }) {
    invalidateCache();
    const r = await GitHubService.readFile('data/documents.json');
    if (!r) throw new Error('ไม่พบข้อมูลเอกสาร');
    const data = r.content;
    const idx = data.documents.findIndex(d => d.id === docId);
    if (idx === -1) throw new Error('ไม่พบเอกสาร');

    if (title !== undefined) data.documents[idx].title = title.trim();
    if (description !== undefined) data.documents[idx].description = description.trim();
    data.documents[idx].updatedAt = now();
    data.auditLog.unshift(makeLog('update_document', `แก้ไขเอกสาร: ${data.documents[idx].title}`));
    if (data.auditLog.length > 500) data.auditLog = data.auditLog.slice(0, 500);
    await GitHubService.writeFile('data/documents.json', data, r.sha, `[DSCP] update doc: ${data.documents[idx].title}`);
    invalidateCache();
  }

  async function deleteDocument(docId) {
    invalidateCache();
    const r = await GitHubService.readFile('data/documents.json');
    if (!r) throw new Error('ไม่พบข้อมูลเอกสาร');
    const data = r.content;
    const doc = data.documents.find(d => d.id === docId);
    if (!doc) throw new Error('ไม่พบเอกสาร');
    data.documents = data.documents.filter(d => d.id !== docId);
    data.auditLog.unshift(makeLog('delete_document', `ลบเอกสาร: ${doc.title}`));
    await GitHubService.writeFile('data/documents.json', data, r.sha, `[DSCP] delete doc: ${doc.title}`);
    invalidateCache();
  }

  async function updateStatus(docId, deptId, status, note = '') {
    if (!['red', 'yellow', 'green'].includes(status)) throw new Error('สถานะไม่ถูกต้อง');
    invalidateCache();
    const r = await GitHubService.readFile('data/documents.json');
    if (!r) throw new Error('ไม่พบข้อมูล');
    const data = r.content;
    const doc = data.documents.find(d => d.id === docId);
    if (!doc) throw new Error('ไม่พบเอกสาร');

    const session = AuthService.getSession();
    const statusLabels = { red: 'ยังไม่ถึง', yellow: 'รอดำเนินการ', green: 'ดำเนินการแล้ว' };
    doc.statuses[deptId] = {
      status,
      updatedBy: session.username,
      updatedByName: session.displayName,
      updatedAt: now(),
      note: note.trim(),
    };
    doc.updatedAt = now();
    data.auditLog.unshift(makeLog('update_status', `เปลี่ยนสถานะ [${doc.title}] ฝ่าย ${deptId} → ${statusLabels[status]}`));
    if (data.auditLog.length > 500) data.auditLog = data.auditLog.slice(0, 500);
    await GitHubService.writeFile('data/documents.json', data, r.sha, `[DSCP] status update: ${doc.title}`);
    invalidateCache();
  }

  async function getAuditLog() {
    const r = await GitHubService.readFile('data/documents.json');
    return r ? (r.content.auditLog || []) : [];
  }

  // ════════════════════════════════════════════════
  // DEPARTMENTS
  // ════════════════════════════════════════════════

  async function getDepartments() {
    const r = await GitHubService.readFile('data/departments.json');
    return r ? r.content.departments : [];
  }

  async function createDepartment(name) {
    const r = await GitHubService.readFile('data/departments.json');
    const data = r ? r.content : { departments: [] };
    const id = 'dept-' + uid();
    const newDept = { id, name: name.trim(), order: data.departments.length + 1 };
    data.departments.push(newDept);
    await GitHubService.writeFile('data/departments.json', data, r ? r.sha : null, `[DSCP] add dept: ${name}`);

    // Add status field to all existing documents
    invalidateCache();
    const docR = await GitHubService.readFile('data/documents.json');
    if (docR) {
      docR.content.documents.forEach(doc => {
        if (!doc.statuses[id]) {
          doc.statuses[id] = { status: 'red', updatedBy: null, updatedAt: null, note: '' };
        }
      });
      docR.content.auditLog.unshift(makeLog('create_department', `สร้างฝ่าย: ${name}`));
      await GitHubService.writeFile('data/documents.json', docR.content, docR.sha, `[DSCP] add dept to docs: ${name}`);
      invalidateCache();
    }
    return newDept;
  }

  async function updateDepartment(id, name) {
    const r = await GitHubService.readFile('data/departments.json');
    if (!r) throw new Error('ไม่พบข้อมูลฝ่าย');
    const dept = r.content.departments.find(d => d.id === id);
    if (!dept) throw new Error('ไม่พบฝ่าย');
    dept.name = name.trim();
    await GitHubService.writeFile('data/departments.json', r.content, r.sha, `[DSCP] update dept: ${name}`);
  }

  async function deleteDepartment(id) {
    const r = await GitHubService.readFile('data/departments.json');
    if (!r) throw new Error('ไม่พบข้อมูลฝ่าย');
    r.content.departments = r.content.departments.filter(d => d.id !== id);
    await GitHubService.writeFile('data/departments.json', r.content, r.sha, `[DSCP] delete dept ${id}`);
  }

  // ════════════════════════════════════════════════
  // USERS
  // ════════════════════════════════════════════════

  async function getUsers() {
    const r = await GitHubService.readFile('data/users.json');
    return r ? r.content.users : [];
  }

  async function createUser({ username, password, displayName, role, department }) {
    const r = await GitHubService.readFile('data/users.json');
    const data = r ? r.content : { users: [] };
    if (data.users.find(u => u.username.toLowerCase() === username.toLowerCase())) {
      throw new Error('ชื่อผู้ใช้นี้มีอยู่แล้ว');
    }
    const hash = await AuthService.hashPassword(password);
    const newUser = {
      id: 'user-' + uid(),
      username: username.trim(),
      passwordHash: hash,
      displayName: displayName.trim(),
      role,
      department: department || null,
    };
    data.users.push(newUser);
    await GitHubService.writeFile('data/users.json', data, r ? r.sha : null, `[DSCP] add user: ${username}`);
    return newUser;
  }

  async function updateUser(id, { displayName, role, department, password }) {
    const r = await GitHubService.readFile('data/users.json');
    if (!r) throw new Error('ไม่พบข้อมูลผู้ใช้');
    const user = r.content.users.find(u => u.id === id);
    if (!user) throw new Error('ไม่พบผู้ใช้');
    if (displayName) user.displayName = displayName.trim();
    if (role) user.role = role;
    if (department !== undefined) user.department = department || null;
    if (password) user.passwordHash = await AuthService.hashPassword(password);
    await GitHubService.writeFile('data/users.json', r.content, r.sha, `[DSCP] update user: ${user.username}`);
  }

  async function deleteUser(id) {
    const r = await GitHubService.readFile('data/users.json');
    if (!r) throw new Error('ไม่พบข้อมูลผู้ใช้');
    r.content.users = r.content.users.filter(u => u.id !== id);
    await GitHubService.writeFile('data/users.json', r.content, r.sha, `[DSCP] delete user ${id}`);
  }

  return {
    getAllDocuments, createDocument, updateDocument, deleteDocument, updateStatus, getAuditLog,
    getDepartments, createDepartment, updateDepartment, deleteDepartment,
    getUsers, createUser, updateUser, deleteUser,
    invalidateCache,
  };
})();
