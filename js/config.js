/**
 * DSCP - Document Status Control Panel
 * GitHub Configuration & App Settings
 */

const DSCP_CONFIG = {
  APP_NAME: 'DSCP - ระบบเดินเอกสาร',
  APP_SUBTITLE: 'Document Status Control Panel',
  VERSION: '1.0.0',
  GITHUB_BRANCH: 'main',
  DATA_PATH: 'data/',
};

// Storage keys for localStorage
const STORAGE_KEYS = {
  GITHUB_CONFIG: 'dscp_github_config',
  SESSION:       'dscp_session',
  CACHE_DOCS:    'dscp_cache_docs',
  CACHE_TS:      'dscp_cache_ts',
};

// Cache duration (ms) — 30 seconds to reduce API calls
const CACHE_DURATION = 30000;

// Default data to initialise the GitHub repo with
const DEFAULT_DEPARTMENTS = [
  { id: 'dept-a', name: 'ฝ่าย A', order: 1 },
  { id: 'dept-b', name: 'ฝ่าย B', order: 2 },
  { id: 'dept-c', name: 'ฝ่าย C', order: 3 },
];

// Pre-computed SHA-256 (password + salt) for default accounts
// Passwords: admin=admin1234, manager=manager1234, staff*=staff1234
// Re-generate with: hashPassword(pw) in browser console after app loads
const DEFAULT_USERS = [
  {
    id: 'user-admin',
    username: 'admin',
    passwordHash: '', // filled at runtime on first init
    displayName: 'ผู้ดูแลระบบ',
    role: 'admin',
    department: null,
    defaultPassword: 'admin1234',
  },
  {
    id: 'user-manager',
    username: 'manager',
    passwordHash: '',
    displayName: 'ผู้บริหาร',
    role: 'manager',
    department: null,
    defaultPassword: 'manager1234',
  },
  {
    id: 'user-staff-a',
    username: 'staffa',
    passwordHash: '',
    displayName: 'เจ้าหน้าที่ฝ่าย A',
    role: 'staff',
    department: 'dept-a',
    defaultPassword: 'staff1234',
  },
  {
    id: 'user-staff-b',
    username: 'staffb',
    passwordHash: '',
    displayName: 'เจ้าหน้าที่ฝ่าย B',
    role: 'staff',
    department: 'dept-b',
    defaultPassword: 'staff1234',
  },
  {
    id: 'user-staff-c',
    username: 'staffc',
    passwordHash: '',
    displayName: 'เจ้าหน้าที่ฝ่าย C',
    role: 'staff',
    department: 'dept-c',
    defaultPassword: 'staff1234',
  },
];
