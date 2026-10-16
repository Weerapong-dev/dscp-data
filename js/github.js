/**
 * DSCP - GitHub API Service Layer
 * Handles all read/write operations to the GitHub repository.
 */

const GitHubService = (() => {
  const BASE = 'https://api.github.com';

  function getConfig() {
    const raw = localStorage.getItem(STORAGE_KEYS.GITHUB_CONFIG);
    if (!raw) return null;
    try { return JSON.parse(raw); } catch { return null; }
  }

  function headers() {
    const cfg = getConfig();
    if (!cfg) throw new Error('GitHub ยังไม่ได้ตั้งค่า');
    return {
      Authorization: `token ${cfg.token}`,
      Accept: 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
    };
  }

  function repoBase() {
    const cfg = getConfig();
    return `${BASE}/repos/${cfg.owner}/${cfg.repo}`;
  }

  // ── Read a file; returns { content (parsed JSON), sha } ──────────────────
  async function readFile(path) {
    const url = `${repoBase()}/contents/${path}?ref=${DSCP_CONFIG.GITHUB_BRANCH}&t=${Date.now()}`;
    const res = await fetch(url, { headers: headers() });
    if (res.status === 404) return null;
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `GitHub API error ${res.status}`);
    }
    const data = await res.json();
    // decodeURIComponent(escape(...)) correctly handles UTF-8 / Thai characters
    // that atob() alone cannot decode (it only supports Latin-1).
    const decoded = decodeURIComponent(escape(atob(data.content.replace(/\n/g, ''))));
    return { content: JSON.parse(decoded), sha: data.sha };
  }

  // ── Write / update a file ────────────────────────────────────────────────
  async function writeFile(path, jsonData, sha = null, commitMsg = null) {
    const body = {
      message: commitMsg || `[DSCP] update ${path}`,
      content: btoa(unescape(encodeURIComponent(JSON.stringify(jsonData, null, 2)))),
      branch: DSCP_CONFIG.GITHUB_BRANCH,
    };
    if (sha) body.sha = sha;

    const res = await fetch(`${repoBase()}/contents/${path}`, {
      method: 'PUT',
      headers: headers(),
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `GitHub write error ${res.status}`);
    }
    const data = await res.json();
    return data.content.sha;
  }

  // ── Validate token & repo ────────────────────────────────────────────────
  async function validateConfig(owner, repo, token) {
    const res = await fetch(`${BASE}/repos/${owner}/${repo}`, {
      headers: {
        Authorization: `token ${token}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });
    if (res.status === 401) throw new Error('Token ไม่ถูกต้อง');
    if (res.status === 404) throw new Error('ไม่พบ Repository');
    if (!res.ok) throw new Error(`ไม่สามารถเชื่อมต่อ GitHub ได้ (${res.status})`);
    return true;
  }

  // ── Init repo: create data files if they don't exist ────────────────────
  async function initializeRepo(usersData, deptsData, docsData) {
    // departments
    let r = await readFile('data/departments.json');
    if (!r) {
      await writeFile('data/departments.json', deptsData, null, '[DSCP] init departments');
    }
    // users
    r = await readFile('data/users.json');
    if (!r) {
      await writeFile('data/users.json', usersData, null, '[DSCP] init users');
    }
    // documents
    r = await readFile('data/documents.json');
    if (!r) {
      await writeFile('data/documents.json', docsData, null, '[DSCP] init documents');
    }
  }

  return { readFile, writeFile, validateConfig, initializeRepo, getConfig };
})();
