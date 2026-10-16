/**
 * DSCP - Authentication Service
 * Manages login, sessions, and role-based permissions.
 */

const AuthService = (() => {
  const SALT = 'dscp_secure_salt_v1';

  // ── Hash password with Web Crypto API ────────────────────────────────────
  async function hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password + SALT);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hash))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  // ── Get current session ───────────────────────────────────────────────────
  function getSession() {
    const raw = localStorage.getItem(STORAGE_KEYS.SESSION);
    if (!raw) return null;
    try {
      const s = JSON.parse(raw);
      // expire after 8 hours
      if (Date.now() - s.loginAt > 8 * 60 * 60 * 1000) {
        localStorage.removeItem(STORAGE_KEYS.SESSION);
        return null;
      }
      return s;
    } catch { return null; }
  }

  // ── Save session ──────────────────────────────────────────────────────────
  function saveSession(user) {
    const session = {
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      role: user.role,
      department: user.department,
      loginAt: Date.now(),
    };
    localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(session));
    return session;
  }

  // ── Login ─────────────────────────────────────────────────────────────────
  async function login(username, password) {
    const result = await GitHubService.readFile('data/users.json');
    if (!result) throw new Error('ไม่พบข้อมูลผู้ใช้งาน');

    const { users } = result.content;
    const user = users.find(u => u.username.toLowerCase() === username.toLowerCase());
    if (!user) throw new Error('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');

    const hash = await hashPassword(password);
    if (hash !== user.passwordHash) throw new Error('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');

    return saveSession(user);
  }

  // ── Logout ────────────────────────────────────────────────────────────────
  function logout() {
    localStorage.removeItem(STORAGE_KEYS.SESSION);
    localStorage.removeItem(STORAGE_KEYS.CACHE_DOCS);
    localStorage.removeItem(STORAGE_KEYS.CACHE_TS);
  }

  // ── Permission checks ─────────────────────────────────────────────────────
  function can(action) {
    const s = getSession();
    if (!s) return false;
    const role = s.role;
    switch (action) {
      case 'viewDashboard':     return true;
      case 'createDocument':    return role === 'staff' || role === 'admin';
      case 'editDocument':      return role === 'staff' || role === 'admin';
      case 'deleteDocument':    return role === 'admin';
      case 'changeStatus':      return role === 'staff' || role === 'admin';
      case 'manageUsers':       return role === 'admin';
      case 'manageDepartments': return role === 'admin';
      case 'viewAuditLog':      return role === 'admin';
      case 'manageSettings':    return role === 'admin';
      default: return false;
    }
  }

  // ── Can this user change a specific department's status? ──────────────────
  function canChangeDeptStatus(deptId) {
    const s = getSession();
    if (!s) return false;
    if (s.role === 'admin') return true;
    if (s.role === 'staff') return s.department === deptId;
    return false;
  }

  return { hashPassword, login, logout, getSession, can, canChangeDeptStatus };
})();
