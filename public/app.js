// ===== NUMA Pilates Certification Portal — Application =====

// ----- State Management -----
const APP = {
  currentUser: null,
  currentView: 'login',
  sidebarOpen: false
};

// ----- Backend API Configuration -----
// Set this to your Railway URL after deploying the backend.
// Leave blank to use localStorage-only mode.
const API_BASE = window.NUMA_API_BASE || '';

// ----- Storage Helpers (localStorage with optional backend sync) -----
function _sGet(key) { try { return localStorage.getItem(key); } catch { return null; } }
function _sSet(key, val) { try { if(val===null) localStorage.removeItem(key); else localStorage.setItem(key, val); } catch {} }
function getUsers() { return JSON.parse(_sGet('numa_users') || '[]'); }
function saveUsers(users) { _sSet('numa_users', JSON.stringify(users)); }
function getSession() { return JSON.parse(_sGet('numa_session') || 'null'); }
function saveSession(sess) { _sSet('numa_session', sess === null ? null : JSON.stringify(sess)); }
function getAuthToken() { return _sGet('numa_token'); }
function setAuthToken(t) { _sSet('numa_token', t); }

// Backend API client — silently no-ops if API_BASE is not configured
async function apiCall(path, options = {}) {
  if (!API_BASE) return null;
  try {
    const token = getAuthToken();
    const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
    if (!res.ok) {
      // Backend returned an error response (4xx/5xx) — surface the error
      // message so callers can show it to the user. Do NOT return null — null
      // means "network unreachable" and triggers fallback paths that should
      // only run when the server is genuinely offline.
      const errBody = await res.json().catch(() => ({ error: res.statusText || `HTTP ${res.status}` }));
      // 401 "No token" or "Invalid token" means our session is dead. Wipe the
      // ghost session and bounce back to login — but only for endpoints that
      // actually need auth (skip /api/auth/* and /api/health).
      if (res.status === 401 && !path.startsWith('/api/auth/') && !path.includes('/api/health')) {
        const isGhostSession = !!(APP && APP.currentUser);
        if (isGhostSession) {
          console.warn('[api] 401 with active session — wiping ghost session');
          try { saveSession(null); } catch (e) {}
          try { setAuthToken(''); } catch (e) {}
          try { APP.currentUser = null; } catch (e) {}
          try { alert('Your session has expired or was never properly saved. Please log in again.'); } catch (e) {}
          try { navigate('login'); } catch (e) {}
        }
      }
      return { error: errBody.error || `HTTP ${res.status}`, _httpStatus: res.status };
    }
    return await res.json();
  } catch (err) {
    // Genuine network failure (CORS, DNS, offline, etc.)
    console.warn('[api]', path, err.message);
    return null;
  }
}

function getUserData(username) {
  const users = getUsers();
  return users.find(u => u.username === username);
}

function saveUserData(userData) {
  const users = getUsers();
  const idx = users.findIndex(u => u.username === userData.username);
  if (idx >= 0) users[idx] = userData;
  else users.push(userData);
  saveUsers(users);
}

function createDefaultUserData(username, fullName) {
  return {
    username,
    fullName,
    createdAt: new Date().toISOString(),
    moduleProgress: {},
    quizScores: {},
    sectionProgress: {},
    hourLogs: { observation: [], teaching: [], personal: [] },
    examPassed: false,
    examScore: null,
    examDate: null,
    activity: []
  };
}

function addActivity(msg) {
  if (!APP.currentUser) return;
  APP.currentUser.activity.unshift({ text: msg, time: new Date().toISOString() });
  if (APP.currentUser.activity.length > 50) APP.currentUser.activity = APP.currentUser.activity.slice(0, 50);
  saveUserData(APP.currentUser);
}

// ----- Routing -----
function navigate(view, params = {}) {
  APP.currentView = view;
  APP.viewParams = params;
  render();
  window.scrollTo(0, 0);
  // Update hash for back button
  const hash = view === 'dashboard' ? '' : view + (params.id ? '/' + params.id : '') + (params.section ? '/' + params.section : '');
  if (window.location.hash !== '#' + hash) {
    history.pushState(null, '', '#' + hash);
  }
}

window.addEventListener('popstate', () => {
  const hash = window.location.hash.replace('#', '');
  if (!hash || hash === '') { navigate('dashboard'); return; }
  const parts = hash.split('/');
  if (parts[0] === 'module' && parts[1]) {
    navigate('module', { id: parseInt(parts[1]), section: parts[2] || null });
  } else if (parts[0] === 'hours') {
    navigate('hours');
  } else if (parts[0] === 'exam') {
    navigate('exam');
  } else if (parts[0] === 'certificate') {
    navigate('certificate');
  } else if (parts[0] === 'admin') {
    navigate('admin', { student: parts[1] || null });
  } else {
    navigate(parts[0]);
  }
});

// ----- Init -----
function init() {
  const session = getSession();
  if (session) {
    if (session.isAdmin) {
      // Detect ghost admin sessions (set in localStorage but no backend token).
      // These cause every admin API call to fail with 401 "No token".
      const hasToken = !!getAuthToken();
      if (API_BASE && !hasToken) {
        console.warn('[init] Admin session has no token — forcing re-login');
        saveSession(null);
        setAuthToken('');
        navigate('login');
        return;
      }
      APP.currentUser = { username: 'admin', isAdmin: true };
      navigate('admin');
    } else {
      APP.currentUser = getUserData(session.username);
      if (APP.currentUser) {
        navigate('dashboard');
      } else {
        saveSession(null);
        navigate('login');
      }
    }
  } else {
    navigate('login');
  }
}

// ----- Render Engine -----
function render() {
  const app = document.getElementById('app');
  if (APP.currentView === 'login') {
    app.innerHTML = renderLogin();
  } else if (APP.currentUser?.isAdmin) {
    app.innerHTML = renderAdminShell();
  } else {
    app.innerHTML = renderAppShell();
  }
}

// ===== LOGIN / REGISTER =====
function renderLogin() {
  return `
  <div class="login-page">
    <div class="login-wrapper">
      <div class="login-card">
        <div class="login-logo">${numaLogo(120)}</div>
        <div class="login-subtitle" style="margin-top:8px;">Certification Portal</div>
        <div class="tabs" id="login-tabs">
          <button class="tab-btn active" onclick="switchLoginTab('login')">Sign In</button>
          <button class="tab-btn" onclick="switchLoginTab('register')">Register</button>
        </div>
        <div id="login-error" class="login-error"></div>
        <div id="login-form">
          <div class="form-group">
            <label>Username</label>
            <input type="text" class="form-control" id="login-user" placeholder="Enter your username" autocomplete="username">
          </div>
          <div class="form-group">
            <label>Password</label>
            <input type="password" class="form-control" id="login-pass" placeholder="Enter your password" autocomplete="current-password">
          </div>
          <button class="btn btn-primary btn-block btn-lg mt-2" onclick="handleLogin()">Sign In</button>
        </div>
        <div id="register-form" class="hidden">
          <div class="form-group">
            <label>Enrollment Code</label>
            <input type="text" class="form-control" id="reg-code" placeholder="Enter the code provided by your instructor">
            <small style="color:var(--charcoal-muted);font-size:0.75rem;margin-top:4px;display:block;">You must have a valid enrollment code to register</small>
          </div>
          <div class="form-group">
            <label>Full Name</label>
            <input type="text" class="form-control" id="reg-name" placeholder="Your full name">
          </div>
          <div class="form-group">
            <label>Email</label>
            <input type="email" class="form-control" id="reg-email" placeholder="Your email address">
          </div>
          <div class="form-group">
            <label>Username</label>
            <input type="text" class="form-control" id="reg-user" placeholder="Choose a username">
          </div>
          <div class="form-group">
            <label>Password</label>
            <input type="password" class="form-control" id="reg-pass" placeholder="Create a password">
          </div>
          <button class="btn btn-primary btn-block btn-lg mt-2" onclick="handleRegister()">Create Account</button>
        </div>
        <div class="login-toggle mt-3">
          <span id="toggle-text">Don't have an account? <a href="#" onclick="switchLoginTab('register');return false;">Register here</a></span>
        </div>
      </div>
    </div>
  </div>`;
}

function switchLoginTab(tab) {
  document.querySelectorAll('#login-tabs .tab-btn').forEach((b, i) => {
    b.classList.toggle('active', (tab === 'login' && i === 0) || (tab === 'register' && i === 1));
  });
  document.getElementById('login-form').classList.toggle('hidden', tab !== 'login');
  document.getElementById('register-form').classList.toggle('hidden', tab !== 'register');
  document.getElementById('login-error').style.display = 'none';
}

async function handleLogin() {
  const user = document.getElementById('login-user').value.trim();
  const pass = document.getElementById('login-pass').value;
  const errEl = document.getElementById('login-error');

  if (!user || !pass) {
    errEl.textContent = 'Please enter both username and password.';
    errEl.style.display = 'block';
    return;
  }

  // Try backend first if configured
  if (API_BASE) {
    const result = await apiCall('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username: user, password: pass })
    });
    if (result?.token) {
      setAuthToken(result.token);
      if (result.user.role === 'admin') {
        APP.currentUser = { username: 'admin', isAdmin: true, ...result.user };
        saveSession({ username: 'admin', isAdmin: true });
        navigate('admin');
      } else {
        // Merge with local data for offline-style usage
        let userData = getUserData(user);
        if (!userData) {
          userData = createDefaultUserData(user, result.user.full_name);
          userData.email = result.user.email;
          saveUserData(userData);
        }
        APP.currentUser = userData;
        saveSession({ username: user });
        navigate('dashboard');
      }
      return;
    }
    // If backend rejected, fall through to local check (lets you log in even if backend is down)
  }

  // No backend-success above means: backend rejected the credentials OR was
  // unreachable. Do NOT silently log the user in via localStorage — that
  // creates token-less "ghost admin" sessions that hit 401 on every API call.
  errEl.innerHTML = '<strong>Login failed.</strong> Check your username and password, or wait a minute and try again if the server is restarting.';
  errEl.style.display = 'block';
  // Clear any stale ghost session
  saveSession(null);
  setAuthToken('');
}

// ===== ENROLLMENT CODES =====
// Add or change codes here. Students must enter one of these to register.
const VALID_ENROLLMENT_CODES = ['NUMA2026', 'NUMPILATES', 'NUMAREFORMER'];

async function handleRegister() {
  const code = document.getElementById('reg-code').value.trim().toUpperCase();
  const name = document.getElementById('reg-name').value.trim();
  const email = document.getElementById('reg-email').value.trim();
  const user = document.getElementById('reg-user').value.trim();
  const pass = document.getElementById('reg-pass').value;
  const errEl = document.getElementById('login-error');

  if (!code || !name || !email || !user || !pass) {
    errEl.textContent = 'Please fill in all fields including your enrollment code.';
    errEl.style.display = 'block';
    return;
  }
  if (!VALID_ENROLLMENT_CODES.includes(code)) {
    errEl.textContent = 'Invalid enrollment code. Please contact your instructor for a valid code.';
    errEl.style.display = 'block';
    return;
  }
  if (user.length < 3) {
    errEl.textContent = 'Username must be at least 3 characters.';
    errEl.style.display = 'block';
    return;
  }
  if (pass.length < 4) {
    errEl.textContent = 'Password must be at least 4 characters.';
    errEl.style.display = 'block';
    return;
  }
  if (getUserData(user)) {
    errEl.textContent = 'Username already taken. Please choose another.';
    errEl.style.display = 'block';
    return;
  }

  // Backend registration is REQUIRED — we no longer silently fall back to
  // localStorage-only registration, because that creates ghost accounts that
  // vanish when the browser cache is cleared or when the user logs in from
  // another device.
  if (!API_BASE) {
    errEl.textContent = 'Registration is temporarily unavailable (no backend configured). Please contact support.';
    errEl.style.display = 'block';
    return;
  }
  const result = await apiCall('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ username: user, password: pass, fullName: name, email, enrollmentCode: code })
  });
  if (result?.token) {
    setAuthToken(result.token);
  } else if (result === null) {
    // Backend unreachable — STOP. Do not create a phantom local account.
    errEl.innerHTML = '<strong>Registration failed:</strong> the server is currently unreachable. Please try again in a minute. If this keeps happening, contact info@numapilatesmiami.com so we can check the database.';
    errEl.style.display = 'block';
    return;
  } else {
    errEl.textContent = result?.error || 'Registration failed.';
    errEl.style.display = 'block';
    return;
  }

  const userData = createDefaultUserData(user, name);
  userData.password = pass;
  userData.email = email;
  userData.enrollmentCode = code;
  saveUserData(userData);
  APP.currentUser = userData;
  saveSession({ username: user });
  addActivity('Account created — welcome to NUMA Pilates Certification!');
  navigate('dashboard');
}

function handleLogout() {
  APP.currentUser = null;
  saveSession(null);
  navigate('login');
}

// ===== NUMA LOGO =====
function numaLogo(size = 36) {
  // size controls width for login (large), height for nav (small)
  if (size > 80) {
    return `<img src="numa-logo.png" alt="NUMA Reformer Pilates" style="width:${size * 2}px;height:auto;object-fit:contain;">`;
  }
  return `<img src="numa-logo.png" alt="NUMA Reformer Pilates" style="height:${size}px;width:auto;object-fit:contain;">`;
}

// ===== APP SHELL =====
function renderAppShell() {
  const user = APP.currentUser;
  return `
  <div class="top-nav">
    <div style="display:flex;align-items:center;gap:12px;">
      <button class="mobile-menu-btn" onclick="toggleSidebar()">
        <i class="fa-solid fa-bars"></i>
      </button>
      <div class="nav-logo" onclick="navigate('dashboard')">
        ${numaLogo(44)}
        <div>
          <span class="nav-logo-sub">Certification Portal</span>
        </div>
      </div>
    </div>
    <div class="nav-right">
      <span class="nav-user">Welcome, <strong>${user.fullName?.split(' ')[0] || user.username}</strong></span>
      <button class="btn btn-ghost btn-sm" onclick="handleLogout()"><i class="fa-solid fa-right-from-bracket"></i> Sign Out</button>
    </div>
  </div>
  <div class="mobile-overlay" id="mobile-overlay" onclick="toggleSidebar()"></div>
  <div class="dashboard-layout">
    <aside class="sidebar" id="sidebar">
      ${renderSidebar()}
    </aside>
    <main class="main-content">
      ${renderMainContent()}
    </main>
  </div>`;
}

function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('mobile-overlay');
  APP.sidebarOpen = !APP.sidebarOpen;
  sidebar.classList.toggle('open', APP.sidebarOpen);
  overlay.classList.toggle('show', APP.sidebarOpen);
}

function renderSidebar() {
  const v = APP.currentView;
  const p = APP.viewParams || {};
  let html = `
  <div class="sidebar-section">
    <div class="sidebar-label">Main</div>
    <div class="sidebar-item ${v === 'dashboard' ? 'active' : ''}" onclick="navigate('dashboard')">
      <i class="fa-solid fa-house"></i> Dashboard
    </div>
    <div class="sidebar-item ${v === 'hours' ? 'active' : ''}" onclick="navigate('hours')">
      <i class="fa-solid fa-clock"></i> Hour Logging
    </div>
    <div class="sidebar-item ${v === 'exam' || v === 'certificate' ? 'active' : ''}" onclick="navigate('exam')">
      <i class="fa-solid fa-file-certificate"></i> Final Exam
    </div>
  </div>
  <div class="sidebar-section">
    <div class="sidebar-label">Modules</div>`;

  COURSE_MODULES.forEach((mod, i) => {
    const status = getModuleStatus(mod.id);
    const isActive = v === 'module' && p.id === mod.id;
    html += `<div class="sidebar-item ${isActive ? 'active' : ''} ${status === 'locked' ? '' : ''}" onclick="navigateModule(${mod.id})">
      <i class="fa-solid ${mod.icon}"></i>
      <span style="flex:1;font-size:13px;">${mod.id}. ${mod.title.length > 22 ? mod.title.substring(0,22)+'…' : mod.title}</span>
      <span class="status-dot ${status}"></span>
    </div>`;
  });

  html += '</div>';
  return html;
}

// ===== MODULE STATUS HELPERS =====
function getModuleStatus(moduleId) {
  const user = APP.currentUser;
  if (!user) return 'locked';
  if (moduleId === 1) {
    // Module 1 always unlocked
    if (user.quizScores && user.quizScores[1] >= 80) return 'completed';
    if (user.sectionProgress && Object.keys(user.sectionProgress).some(k => k.startsWith('1-'))) return 'in-progress';
    return 'in-progress';
  }
  // Check previous module quiz passed
  const prevPassed = user.quizScores && user.quizScores[moduleId - 1] >= 80;
  if (!prevPassed) return 'locked';
  if (user.quizScores && user.quizScores[moduleId] >= 80) return 'completed';
  if (user.sectionProgress && Object.keys(user.sectionProgress).some(k => k.startsWith(moduleId + '-'))) return 'in-progress';
  return 'in-progress';
}

function isModuleUnlocked(moduleId) {
  return getModuleStatus(moduleId) !== 'locked';
}

function getOverallProgress() {
  const user = APP.currentUser;
  if (!user) return 0;
  let completed = 0;
  COURSE_MODULES.forEach(mod => {
    if (user.quizScores && user.quizScores[mod.id] >= 80) completed++;
  });
  return Math.round((completed / COURSE_MODULES.length) * 100);
}

function allModulesPassed() {
  const user = APP.currentUser;
  if (!user || !user.quizScores) return false;
  return COURSE_MODULES.every(mod => user.quizScores[mod.id] >= 80);
}

function navigateModule(id) {
  if (!isModuleUnlocked(id)) return;
  navigate('module', { id });
}

// ===== MAIN CONTENT ROUTER =====
function renderMainContent() {
  const v = APP.currentView;
  const p = APP.viewParams || {};
  switch (v) {
    case 'dashboard': return renderDashboard();
    case 'module': return renderModulePage(p.id, p.section);
    case 'hours': return renderHoursPage();
    case 'exam': return renderExamPage();
    case 'certificate': return renderCertificatePage();
    default: return renderDashboard();
  }
}

// ===== DASHBOARD =====
function renderDashboard() {
  const user = APP.currentUser;
  const progress = getOverallProgress();
  const completedModules = COURSE_MODULES.filter(m => user.quizScores && user.quizScores[m.id] >= 80).length;
  const totalHours = getTotalHours();

  let html = `
  <div class="page-header fade-in">
    <h1>Welcome back, ${user.fullName?.split(' ')[0] || user.username}</h1>
    <p>Continue your journey toward Pilates certification</p>
  </div>

  <div class="stats-grid slide-up">
    <div class="stat-card">
      <div class="stat-icon terracotta"><i class="fa-solid fa-chart-line"></i></div>
      <div class="stat-label">Overall Progress</div>
      <div class="stat-value">${progress}%</div>
      <div class="progress-bar-wrap mt-1"><div class="progress-bar-fill" style="width:${progress}%"></div></div>
    </div>
    <div class="stat-card">
      <div class="stat-icon sage"><i class="fa-solid fa-book-open"></i></div>
      <div class="stat-label">Modules Completed</div>
      <div class="stat-value">${completedModules} <span style="font-size:1rem;color:var(--charcoal-muted)">/ ${COURSE_MODULES.length}</span></div>
    </div>
    <div class="stat-card">
      <div class="stat-icon charcoal"><i class="fa-solid fa-clock"></i></div>
      <div class="stat-label">Hours Logged</div>
      <div class="stat-value">${totalHours.toFixed(1)}</div>
      <div class="stat-sub">of ${getHourReq('total')} target</div>
    </div>
    <div class="stat-card">
      <div class="stat-icon terracotta"><i class="fa-solid fa-award"></i></div>
      <div class="stat-label">Certification</div>
      <div class="stat-value" style="font-size:1.2rem;">${user.examPassed ? '<span style="color:var(--success)">PASSED</span>' : allModulesPassed() ? '<span style="color:var(--warning)">Ready</span>' : '<span style="color:var(--charcoal-muted)">In Progress</span>'}</div>
    </div>
  </div>

  <h2 class="mb-2" style="font-size:1.3rem;">Course Modules</h2>
  <div class="modules-grid">`;

  COURSE_MODULES.forEach((mod, i) => {
    const status = getModuleStatus(mod.id);
    const score = user.quizScores ? user.quizScores[mod.id] : null;
    const topClass = status === 'completed' ? 'completed' : status === 'locked' ? 'locked' : (i % 2 === 0 ? 'terracotta' : 'sage');
    const badgeHtml = status === 'completed' ? '<span class="badge badge-complete"><i class="fa-solid fa-check"></i> Passed</span>' :
                      status === 'locked' ? '<span class="badge badge-locked"><i class="fa-solid fa-lock"></i> Locked</span>' :
                      '<span class="badge badge-progress">In Progress</span>';

    html += `
    <div class="module-card ${status === 'locked' ? 'locked' : ''} slide-up stagger-${(i % 4) + 1}" onclick="${status !== 'locked' ? `navigateModule(${mod.id})` : ''}">
      <div class="module-card-top ${topClass}"></div>
      <div class="module-card-body">
        <div class="module-card-num"><span>Module ${mod.id} · ${mod.week}</span></div>
        <h3>${mod.title}</h3>
        <p>${mod.description}</p>
        <div class="module-card-footer">
          ${badgeHtml}
          ${score !== null && score !== undefined ? `<span class="text-sm text-muted">Quiz: ${score}%</span>` : ''}
        </div>
      </div>
    </div>`;
  });

  html += '</div>';

  // Recent Activity
  if (user.activity && user.activity.length > 0) {
    html += `<h2 class="mb-2 mt-4" style="font-size:1.3rem;">Recent Activity</h2>
    <div class="card"><div class="card-body"><div class="activity-feed">`;
    user.activity.slice(0, 8).forEach(a => {
      const time = new Date(a.time);
      const relTime = getRelativeTime(time);
      html += `<div class="activity-item">
        <span class="activity-dot" style="background:var(--sage)"></span>
        <div><div>${a.text}</div><div class="activity-time">${relTime}</div></div>
      </div>`;
    });
    html += '</div></div></div>';
  }

  return html;
}

function getRelativeTime(date) {
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}

// ===== MODULE PAGE =====
function renderModulePage(moduleId, sectionId) {
  const mod = COURSE_MODULES.find(m => m.id === moduleId);
  if (!mod) return '<p>Module not found.</p>';
  if (!isModuleUnlocked(moduleId)) return renderLockedModule(mod);

  const currentSection = sectionId ? mod.sections.find(s => s.id === sectionId) : mod.sections[0];
  if (!currentSection) return '<p>Section not found.</p>';

  // Mark section as visited
  if (!currentSection.isQuiz) {
    APP.currentUser.sectionProgress = APP.currentUser.sectionProgress || {};
    APP.currentUser.sectionProgress[currentSection.id] = true;
    saveUserData(APP.currentUser);
  }

  const sectionIdx = mod.sections.indexOf(currentSection);

  let html = `
  <div class="module-page fade-in">
    <div class="breadcrumb">
      <a href="#" onclick="navigate('dashboard');return false;">Dashboard</a>
      <i class="fa-solid fa-chevron-right" style="font-size:10px;"></i>
      <span>Module ${mod.id}: ${mod.title}</span>
    </div>
    <div class="page-header">
      <h1>${mod.title}</h1>
      <p>${mod.week}</p>
    </div>

    <div class="module-nav">`;

  mod.sections.forEach(s => {
    const isActive = s.id === currentSection.id;
    const visited = APP.currentUser.sectionProgress && APP.currentUser.sectionProgress[s.id];
    const quizPassed = s.isQuiz && APP.currentUser.quizScores && APP.currentUser.quizScores[mod.id] >= 80;
    html += `<button class="section-tab ${isActive ? 'active' : ''} ${(visited || quizPassed) ? 'completed' : ''}" onclick="navigate('module',{id:${mod.id},section:'${s.id}'})">${s.isQuiz ? '<i class=&quot;fa-solid fa-clipboard-check&quot;></i> ' : ''}${s.title}</button>`;
  });

  html += '</div>';

  if (currentSection.isQuiz) {
    html += renderQuiz(mod);
  } else {
    html += `<div class="module-content">${currentSection.content}</div>`;
  }

  // Navigation buttons
  html += '<div class="section-nav-btns">';
  if (sectionIdx > 0) {
    const prev = mod.sections[sectionIdx - 1];
    html += `<button class="btn btn-secondary" onclick="navigate('module',{id:${mod.id},section:'${prev.id}'})"><i class="fa-solid fa-chevron-left"></i> Previous</button>`;
  } else {
    html += '<div></div>';
  }
  if (sectionIdx < mod.sections.length - 1) {
    const next = mod.sections[sectionIdx + 1];
    html += `<button class="btn btn-primary" onclick="navigate('module',{id:${mod.id},section:'${next.id}'})">Next <i class="fa-solid fa-chevron-right"></i></button>`;
  } else {
    html += '<div></div>';
  }
  html += '</div></div>';

  return html;
}

function renderLockedModule(mod) {
  return `<div class="locked-overlay fade-in">
    <i class="fa-solid fa-lock"></i>
    <h3>Module ${mod.id}: ${mod.title}</h3>
    <p>Complete the previous module's quiz with a score of 80% or higher to unlock this module.</p>
    <button class="btn btn-primary mt-3" onclick="navigate('dashboard')">Back to Dashboard</button>
  </div>`;
}

// ===== QUIZZES =====
function renderQuiz(mod) {
  const user = APP.currentUser;
  const rawScore = user.quizScores ? user.quizScores[mod.id] : null;
  // Treat undefined/null/non-numeric as "not taken yet"
  const bestScore = (typeof rawScore === 'number' && !isNaN(rawScore)) ? rawScore : null;
  const quiz = mod.quiz;

  // Check if quiz is currently being taken
  const quizState = window._quizState && window._quizState.moduleId === mod.id ? window._quizState : null;

  if (quizState && quizState.submitted) {
    return renderQuizResults(mod, quizState);
  }

  if (quizState) {
    return renderQuizInProgress(mod, quizState);
  }

  // Quiz landing
  let html = `<div class="quiz-section">
    <div class="text-center mb-3">
      <h2>Module ${mod.id} Quiz</h2>
      <p class="text-muted">${quiz.length} questions · Must score 80% to pass · Unlimited retakes</p>
      ${bestScore !== null ? `<p class="mt-2"><strong>Your best score: <span style="color:${bestScore >= 80 ? 'var(--success)' : 'var(--error)'};">${bestScore}%</span></strong></p>` : ''}
    </div>
    <div class="text-center">
      <button class="btn btn-primary btn-lg" onclick="startQuiz(${mod.id})">
        ${bestScore !== null ? 'Retake Quiz' : 'Start Quiz'}
      </button>
    </div>
  </div>`;
  return html;
}

function startQuiz(moduleId) {
  const mod = COURSE_MODULES.find(m => m.id === moduleId);
  // Shuffle questions
  const shuffled = [...mod.quiz].sort(() => Math.random() - 0.5);
  window._quizState = {
    moduleId,
    questions: shuffled,
    answers: new Array(shuffled.length).fill(-1),
    submitted: false
  };
  render();
}

function renderQuizInProgress(mod, state) {
  let html = `<div class="quiz-section">
    <div class="flex justify-between items-center mb-3">
      <h2>Module ${mod.id} Quiz</h2>
      <span class="text-muted">${state.questions.length} questions</span>
    </div>`;

  state.questions.forEach((q, i) => {
    html += `<div class="quiz-question">
      <div class="quiz-question-num">Question ${i + 1} of ${state.questions.length}</div>
      <h4>${q.q}</h4>`;
    q.opts.forEach((opt, oi) => {
      const selected = state.answers[i] === oi;
      html += `<div class="quiz-option ${selected ? 'selected' : ''}" onclick="selectQuizAnswer(${i}, ${oi})">
        <span class="option-letter">${String.fromCharCode(65 + oi)}</span>
        <span>${opt}</span>
      </div>`;
    });
    html += '</div>';
  });

  const allAnswered = state.answers.every(a => a >= 0);
  html += `<div class="text-center mt-3">
    <button class="btn btn-primary btn-lg" ${!allAnswered ? 'disabled' : ''} onclick="submitQuiz()">
      Submit Quiz ${!allAnswered ? `(${state.answers.filter(a => a >= 0).length}/${state.questions.length} answered)` : ''}
    </button>
  </div></div>`;

  return html;
}

function selectQuizAnswer(questionIdx, optionIdx) {
  if (!window._quizState || window._quizState.submitted) return;
  window._quizState.answers[questionIdx] = optionIdx;
  render();
}

function submitQuiz() {
  const state = window._quizState;
  if (!state || state.submitted) return;

  let correct = 0;
  state.questions.forEach((q, i) => {
    if (state.answers[i] === q.correct) correct++;
  });

  const score = Math.round((correct / state.questions.length) * 100);
  state.submitted = true;
  state.score = score;
  state.correct = correct;

  // Save score
  const user = APP.currentUser;
  user.quizScores = user.quizScores || {};
  if (!user.quizScores[state.moduleId] || score > user.quizScores[state.moduleId]) {
    user.quizScores[state.moduleId] = score;
  }
  saveUserData(user);

  const mod = COURSE_MODULES.find(m => m.id === state.moduleId);
  addActivity(`Completed Module ${state.moduleId} quiz: ${score}% (${score >= 80 ? 'PASSED' : 'not passed'})`);

  render();
}

function renderQuizResults(mod, state) {
  const passed = state.score >= 80;
  let html = `<div class="quiz-section">
    <div class="quiz-result ${passed ? 'passed' : 'failed'}">
      <div class="score" style="color:${passed ? 'var(--success)' : 'var(--error)'}">${state.score}%</div>
      <h3>${passed ? 'Congratulations! You passed!' : 'Not quite — keep studying!'}</h3>
      <p>${state.correct} of ${state.questions.length} correct · ${passed ? '80% threshold met' : 'You need 80% to pass'}</p>
      <div class="mt-3" style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap;">
        <button class="btn btn-secondary" onclick="window._quizState=null;render();">
          ${passed ? 'Review Quiz' : 'Try Again'}
        </button>
        ${passed && mod.id < COURSE_MODULES.length ? `<button class="btn btn-primary" onclick="window._quizState=null;navigateModule(${mod.id + 1})">Next Module <i class="fa-solid fa-chevron-right"></i></button>` : ''}
        ${passed && mod.id === COURSE_MODULES.length ? `<button class="btn btn-sage" onclick="window._quizState=null;navigate('exam')">Go to Final Exam</button>` : ''}
      </div>
    </div>

    <h3 class="mt-4 mb-2">Answer Review</h3>`;

  state.questions.forEach((q, i) => {
    const userAnswer = state.answers[i];
    const isCorrect = userAnswer === q.correct;

    html += `<div class="quiz-question">
      <div class="quiz-question-num">Question ${i + 1}</div>
      <h4>${q.q}</h4>`;

    q.opts.forEach((opt, oi) => {
      const cls = oi === q.correct ? 'correct' : (oi === userAnswer && !isCorrect ? 'incorrect' : '');
      html += `<div class="quiz-option ${cls}">
        <span class="option-letter">${String.fromCharCode(65 + oi)}</span>
        <span>${opt}</span>
        ${oi === q.correct ? ' <i class="fa-solid fa-check" style="margin-left:auto;color:var(--success)"></i>' : ''}
        ${oi === userAnswer && !isCorrect ? ' <i class="fa-solid fa-xmark" style="margin-left:auto;color:var(--error)"></i>' : ''}
      </div>`;
    });
    html += '</div>';
  });

  html += '</div>';
  return html;
}

// ===== HOUR LOGGING =====
function getTotalHours() {
  const user = APP.currentUser;
  if (!user || !user.hourLogs) return 0;
  let total = 0;
  ['observation', 'teaching', 'personal'].forEach(type => {
    (user.hourLogs[type] || []).forEach(entry => {
      total += parseFloat(entry.hours) || 0;
    });
  });
  return total;
}

function getHoursByType(type) {
  const user = APP.currentUser;
  if (!user || !user.hourLogs) return 0;
  return (user.hourLogs[type] || []).reduce((sum, e) => sum + (parseFloat(e.hours) || 0), 0);
}

function renderHoursPage() {
  const user = APP.currentUser;
  const total = getTotalHours();
  const obs = getHoursByType('observation');
  const teach = getHoursByType('teaching');
  const personal = getHoursByType('personal');

  let html = `
  <div class="page-header fade-in">
    <h1>Hour Logging</h1>
    <p>Track your observation, teaching practicum, and personal practice hours toward the ${getHourReq('total')}-hour requirement.</p>
  </div>

  <div class="hours-summary slide-up">
    <div class="hours-card">
      <div class="hours-num">${total.toFixed(1)}</div>
      <div class="hours-label">Total Hours</div>
      <div class="progress-bar-wrap mt-1"><div class="progress-bar-fill" style="width:${getHourReq('total') > 0 ? Math.min(100, (total/getHourReq('total'))*100) : 0}%"></div></div>
      <div class="text-xs text-muted mt-1">${getHourReq('total') > 0 ? Math.min(100, ((total/getHourReq('total'))*100)).toFixed(1) : '0.0'}% of ${getHourReq('total')}</div>
    </div>
    <div class="hours-card">
      <div class="hours-num" style="color:var(--sage)">${obs.toFixed(1)}</div>
      <div class="hours-label">Observation</div>
      <div class="progress-bar-wrap mt-1"><div class="progress-bar-fill" style="width:${getHourReq('observation') > 0 ? Math.min(100, (obs/getHourReq('observation'))*100) : 0}%"></div></div>
      <div class="text-xs text-muted mt-1">${obs.toFixed(1)} / ${getHourReq('observation')} hrs</div>
    </div>
    <div class="hours-card">
      <div class="hours-num" style="color:var(--sage-dark)">${teach.toFixed(1)}</div>
      <div class="hours-label">Teaching</div>
      <div class="progress-bar-wrap mt-1"><div class="progress-bar-fill" style="width:${getHourReq('teaching') > 0 ? Math.min(100, (teach/getHourReq('teaching'))*100) : 0}%"></div></div>
      <div class="text-xs text-muted mt-1">${teach.toFixed(1)} / ${getHourReq('teaching')} hrs</div>
    </div>
    <div class="hours-card">
      <div class="hours-num" style="color:var(--charcoal-muted)">${personal.toFixed(1)}</div>
      <div class="hours-label">Personal Practice</div>
      <div class="progress-bar-wrap mt-1"><div class="progress-bar-fill" style="width:${getHourReq('personal') > 0 ? Math.min(100, (personal/getHourReq('personal'))*100) : 0}%"></div></div>
      <div class="text-xs text-muted mt-1">${personal.toFixed(1)} / ${getHourReq('personal')} hrs</div>
    </div>
  </div>

  <div class="tabs mb-3" id="hour-tabs">
    <button class="tab-btn active" onclick="switchHourTab('observation')">Observation</button>
    <button class="tab-btn" onclick="switchHourTab('teaching')">Teaching</button>
    <button class="tab-btn" onclick="switchHourTab('personal')">Personal Practice</button>
  </div>

  <div id="hour-tab-content">${renderHourTabContent('observation')}</div>`;

  return html;
}

window._hourTab = 'observation';

function switchHourTab(tab) {
  window._hourTab = tab;
  document.querySelectorAll('#hour-tabs .tab-btn').forEach((b, i) => {
    b.classList.toggle('active', (tab === 'observation' && i === 0) || (tab === 'teaching' && i === 1) || (tab === 'personal' && i === 2));
  });
  document.getElementById('hour-tab-content').innerHTML = renderHourTabContent(tab);
}

function renderHourTabContent(type) {
  const user = APP.currentUser;
  const entries = (user.hourLogs && user.hourLogs[type]) || [];

  const fields = type === 'observation' ?
    `<div class="form-row">
      <div class="form-group"><label>Date</label><input type="date" class="form-control" id="log-date"></div>
      <div class="form-group"><label>Location</label><input type="text" class="form-control" id="log-location" placeholder="Studio name"></div>
      <div class="form-group"><label>Instructor Observed</label><input type="text" class="form-control" id="log-instructor" placeholder="Instructor name"></div>
      <div class="form-group"><label>Hours</label><input type="number" class="form-control" id="log-hours" step="0.5" min="0.5" placeholder="1.0"></div>
    </div>` :
    type === 'teaching' ?
    `<div class="form-row">
      <div class="form-group"><label>Date</label><input type="date" class="form-control" id="log-date"></div>
      <div class="form-group"><label>Class Type</label><input type="text" class="form-control" id="log-classtype" placeholder="e.g., Mat, Reformer"></div>
      <div class="form-group"><label>Hours</label><input type="number" class="form-control" id="log-hours" step="0.5" min="0.5" placeholder="1.0"></div>
      <div class="form-group"><label>Supervisor</label><input type="text" class="form-control" id="log-supervisor" placeholder="Supervisor name"></div>
    </div>` :
    `<div class="form-row">
      <div class="form-group"><label>Date</label><input type="date" class="form-control" id="log-date"></div>
      <div class="form-group"><label>Type</label><input type="text" class="form-control" id="log-practicetype" placeholder="e.g., Mat, Reformer, Props"></div>
      <div class="form-group"><label>Hours</label><input type="number" class="form-control" id="log-hours" step="0.5" min="0.5" placeholder="1.0"></div>
    </div>`;

  let html = `<div class="log-form">${fields}
    <button class="btn btn-primary" onclick="addHourEntry('${type}')"><i class="fa-solid fa-plus"></i> Add Entry</button>
  </div>`;

  if (entries.length > 0) {
    const headers = type === 'observation' ? '<th>Date</th><th>Location</th><th>Instructor</th><th>Hours</th><th></th>' :
                    type === 'teaching' ? '<th>Date</th><th>Class Type</th><th>Hours</th><th>Supervisor</th><th></th>' :
                    '<th>Date</th><th>Type</th><th>Hours</th><th></th>';

    html += `<div class="card"><div class="card-body" style="padding:0;overflow-x:auto;">
      <table class="log-table"><thead><tr>${headers}</tr></thead><tbody>`;

    entries.forEach((e, i) => {
      if (type === 'observation') {
        html += `<tr><td>${e.date}</td><td>${e.location || ''}</td><td>${e.instructor || ''}</td><td>${e.hours}</td><td><button class="btn-delete" onclick="deleteHourEntry('${type}',${i})"><i class="fa-solid fa-trash"></i></button></td></tr>`;
      } else if (type === 'teaching') {
        html += `<tr><td>${e.date}</td><td>${e.classType || ''}</td><td>${e.hours}</td><td>${e.supervisor || ''}</td><td><button class="btn-delete" onclick="deleteHourEntry('${type}',${i})"><i class="fa-solid fa-trash"></i></button></td></tr>`;
      } else {
        html += `<tr><td>${e.date}</td><td>${e.practiceType || ''}</td><td>${e.hours}</td><td><button class="btn-delete" onclick="deleteHourEntry('${type}',${i})"><i class="fa-solid fa-trash"></i></button></td></tr>`;
      }
    });

    html += '</tbody></table></div></div>';
  } else {
    html += '<p class="text-center text-muted mt-3">No entries yet. Add your first log above.</p>';
  }

  return html;
}

function addHourEntry(type) {
  const date = document.getElementById('log-date')?.value;
  const hours = parseFloat(document.getElementById('log-hours')?.value);

  if (!date || !hours || hours <= 0) {
    alert('Please fill in the date and hours.');
    return;
  }

  const user = APP.currentUser;
  user.hourLogs = user.hourLogs || { observation: [], teaching: [], personal: [] };

  const entry = { date, hours };
  if (type === 'observation') {
    entry.location = document.getElementById('log-location')?.value || '';
    entry.instructor = document.getElementById('log-instructor')?.value || '';
  } else if (type === 'teaching') {
    entry.classType = document.getElementById('log-classtype')?.value || '';
    entry.supervisor = document.getElementById('log-supervisor')?.value || '';
  } else {
    entry.practiceType = document.getElementById('log-practicetype')?.value || '';
  }

  user.hourLogs[type].unshift(entry);
  saveUserData(user);
  addActivity(`Logged ${hours} ${type} hours`);
  render();
}

function deleteHourEntry(type, idx) {
  const user = APP.currentUser;
  user.hourLogs[type].splice(idx, 1);
  saveUserData(user);
  document.getElementById('hour-tab-content').innerHTML = renderHourTabContent(type);
}

// ===== FINAL EXAM =====
function renderExamPage() {
  const user = APP.currentUser;

  if (user.examPassed) {
    return `<div class="exam-header fade-in">
      <h1 style="color:var(--success)"><i class="fa-solid fa-circle-check"></i> Exam Passed!</h1>
      <p class="mt-2">You passed the NUMA Pilates Certification Exam with a score of <strong>${user.examScore}%</strong> on ${new Date(user.examDate).toLocaleDateString()}.</p>
      <button class="btn btn-primary btn-lg mt-3" onclick="navigate('certificate')"><i class="fa-solid fa-award"></i> View Certificate</button>
    </div>`;
  }

  if (!allModulesPassed()) {
    const incomplete = COURSE_MODULES.filter(m => !(user.quizScores && user.quizScores[m.id] >= 80));
    return `<div class="exam-header fade-in">
      <h1>Final Certification Exam</h1>
      <div class="locked-overlay" style="padding:20px;">
        <i class="fa-solid fa-lock"></i>
        <h3>Not Yet Available</h3>
        <p>You must pass all 7 module quizzes before taking the final exam.</p>
        <p class="mt-2"><strong>Remaining modules:</strong></p>
        <ul style="text-align:left;display:inline-block;">
          ${incomplete.map(m => `<li>Module ${m.id}: ${m.title}</li>`).join('')}
        </ul>
      </div>
    </div>`;
  }

  // Check if exam in progress
  const examState = window._examState;
  if (examState && !examState.submitted) {
    return renderExamInProgress(examState);
  }
  if (examState && examState.submitted) {
    return renderExamResults(examState);
  }

  return `<div class="exam-header fade-in">
    <h1>Final Certification Exam</h1>
    <p class="text-muted mt-2">125 multiple choice questions · 2-hour time limit · Must score 80% to pass</p>
    <p class="mt-2">This exam covers all 7 modules proportionally, aligned with the NPCP certification format.</p>
    <button class="btn btn-primary btn-lg mt-3" onclick="startFinalExam()"><i class="fa-solid fa-play"></i> Begin Exam</button>
  </div>`;
}

function startFinalExam() {
  const questions = generateFinalExam();
  window._examState = {
    questions,
    answers: new Array(questions.length).fill(-1),
    submitted: false,
    startTime: Date.now(),
    timeLimit: 2 * 60 * 60 * 1000 // 2 hours in ms
  };
  window._examTimer = setInterval(updateExamTimer, 1000);
  render();
}

function updateExamTimer() {
  const state = window._examState;
  if (!state || state.submitted) {
    clearInterval(window._examTimer);
    return;
  }
  const elapsed = Date.now() - state.startTime;
  const remaining = state.timeLimit - elapsed;
  if (remaining <= 0) {
    submitFinalExam();
    return;
  }
  const timerEl = document.getElementById('exam-timer');
  if (timerEl) {
    const mins = Math.floor(remaining / 60000);
    const secs = Math.floor((remaining % 60000) / 1000);
    timerEl.textContent = `${mins}:${secs.toString().padStart(2, '0')}`;
    timerEl.className = 'exam-timer' + (mins < 10 ? ' warning' : '');
  }
}

function renderExamInProgress(state) {
  const elapsed = Date.now() - state.startTime;
  const remaining = state.timeLimit - elapsed;
  const mins = Math.floor(remaining / 60000);
  const secs = Math.floor((remaining % 60000) / 1000);
  const answered = state.answers.filter(a => a >= 0).length;

  // Show 10 questions at a time
  const page = window._examPage || 0;
  const perPage = 10;
  const start = page * perPage;
  const end = Math.min(start + perPage, state.questions.length);
  const totalPages = Math.ceil(state.questions.length / perPage);

  let html = `
  <div class="exam-header" style="margin-bottom:16px;padding:20px;">
    <div class="flex justify-between items-center flex-wrap gap-2">
      <div>
        <strong>Final Exam</strong>
        <span class="exam-progress"> — ${answered}/${state.questions.length} answered</span>
      </div>
      <div id="exam-timer" class="exam-timer${mins < 10 ? ' warning' : ''}">${mins}:${secs.toString().padStart(2, '0')}</div>
    </div>
    <div class="progress-bar-wrap mt-1"><div class="progress-bar-fill" style="width:${(answered/state.questions.length)*100}%"></div></div>
  </div>

  <div class="quiz-section">`;

  for (let i = start; i < end; i++) {
    const q = state.questions[i];
    html += `<div class="quiz-question">
      <div class="quiz-question-num">Question ${i + 1} of ${state.questions.length} <span class="text-muted" style="float:right;font-size:10px;">${q.moduleTitle || ''}</span></div>
      <h4>${q.q}</h4>`;
    q.opts.forEach((opt, oi) => {
      const selected = state.answers[i] === oi;
      html += `<div class="quiz-option ${selected ? 'selected' : ''}" onclick="selectExamAnswer(${i}, ${oi})">
        <span class="option-letter">${String.fromCharCode(65 + oi)}</span>
        <span>${opt}</span>
      </div>`;
    });
    html += '</div>';
  }

  html += `<div class="flex justify-between mt-3 flex-wrap gap-2">
    <div>
      ${page > 0 ? `<button class="btn btn-secondary" onclick="window._examPage=${page-1};render();">← Previous 10</button>` : ''}
    </div>
    <div style="display:flex;gap:8px;">
      ${page < totalPages - 1 ? `<button class="btn btn-secondary" onclick="window._examPage=${page+1};render();">Next 10 →</button>` : ''}
      <button class="btn btn-primary" onclick="submitFinalExam()" ${answered < state.questions.length ? 'title="You can submit with unanswered questions"' : ''}>Submit Exam</button>
    </div>
  </div></div>`;

  return html;
}

function selectExamAnswer(qi, oi) {
  if (!window._examState || window._examState.submitted) return;
  window._examState.answers[qi] = oi;
  // Don't re-render, just update visually
  const questionEls = document.querySelectorAll('.quiz-question');
  const page = window._examPage || 0;
  const localIdx = qi - page * 10;
  if (localIdx >= 0 && localIdx < questionEls.length) {
    const opts = questionEls[localIdx].querySelectorAll('.quiz-option');
    opts.forEach((o, i) => {
      o.classList.toggle('selected', i === oi);
      o.querySelector('.option-letter').className = 'option-letter';
    });
  }
  // Update answered count
  const answered = window._examState.answers.filter(a => a >= 0).length;
  const progEl = document.querySelector('.exam-progress');
  if (progEl) progEl.textContent = ` — ${answered}/${window._examState.questions.length} answered`;
  const barEl = document.querySelector('.progress-bar-fill');
  if (barEl) barEl.style.width = `${(answered/window._examState.questions.length)*100}%`;
}

function submitFinalExam() {
  const state = window._examState;
  if (!state || state.submitted) return;
  clearInterval(window._examTimer);

  let correct = 0;
  state.questions.forEach((q, i) => {
    if (state.answers[i] === q.correct) correct++;
  });
  const score = Math.round((correct / state.questions.length) * 100);
  state.submitted = true;
  state.score = score;
  state.correct = correct;

  const user = APP.currentUser;
  if (score >= 80) {
    user.examPassed = true;
    user.examScore = score;
    user.examDate = new Date().toISOString();
    addActivity(`PASSED Final Certification Exam with ${score}%!`);
  } else {
    addActivity(`Final Exam attempted: ${score}% (need 80% to pass)`);
  }
  saveUserData(user);
  window._examPage = 0;
  render();
}

function renderExamResults(state) {
  const passed = state.score >= 80;
  return `<div class="exam-header fade-in">
    <div class="quiz-result ${passed ? 'passed' : 'failed'}">
      <div class="score" style="color:${passed ? 'var(--success)' : 'var(--error)'}">${state.score}%</div>
      <h3>${passed ? 'You passed the NUMA Certification Exam!' : 'Not quite — review the material and try again.'}</h3>
      <p>${state.correct} of ${state.questions.length} correct</p>
      <div class="mt-3" style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap;">
        ${passed ? `<button class="btn btn-primary btn-lg" onclick="window._examState=null;navigate('certificate')"><i class="fa-solid fa-award"></i> View Certificate</button>` :
        `<button class="btn btn-primary" onclick="window._examState=null;render();">Try Again</button>
         <button class="btn btn-secondary" onclick="window._examState=null;navigate('dashboard');">Back to Dashboard</button>`}
      </div>
    </div>
  </div>`;
}

// ===== CERTIFICATE =====
function renderCertificatePage() {
  const user = APP.currentUser;
  if (!user.examPassed) {
    navigate('exam');
    return '';
  }

  const date = new Date(user.examDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  return `
  <div class="page-header fade-in text-center">
    <h1>Your Certificate</h1>
    <p>Congratulations on completing the NUMA Pilates Certification Program</p>
    <button class="btn btn-primary mt-2" onclick="window.print()"><i class="fa-solid fa-print"></i> Print Certificate</button>
  </div>

  <div class="certificate-wrapper slide-up">
    <div class="certificate">
      <div style="margin-bottom:16px;">${numaLogo(80)}</div>
      <h2>CERTIFICATE OF COMPLETION</h2>
      <p style="font-size:12px;text-transform:uppercase;letter-spacing:0.2em;color:var(--charcoal-muted);">NUMA Pilates · Homestead, FL</p>
      <p class="cert-text" style="margin-top:24px;">This certifies that</p>
      <div class="cert-name">${user.fullName}</div>
      <p class="cert-text">has successfully completed the <strong>NUMA Pilates Comprehensive Teacher Training Program</strong>, demonstrating proficiency in Mat Pilates, Reformer Pilates, Anatomy & Biomechanics, Cueing, Special Populations, and Professional Ethics.</p>
      <p class="cert-text">Final Examination Score: <strong>${user.examScore}%</strong></p>
      <div class="cert-date">${date}</div>
      <div class="cert-seal">${numaLogo(80)}</div>
      <p style="font-size:11px;color:var(--charcoal-muted);margin-top:16px;">This certificate is recognized by NUMA Pilates, Homestead, FL. Program aligned with NPCP certification standards (450 hours).</p>
    </div>
  </div>`;
}

// ===== ADMIN DASHBOARD =====
function renderAdminShell() {
  return `
  <div class="top-nav">
    <div class="nav-logo" onclick="navigate('admin')">
      ${numaLogo(44)}
      <div>
        <span class="nav-logo-sub">Admin Dashboard</span>
      </div>
    </div>
    <div class="nav-right">
      <span class="nav-user"><strong>Administrator</strong></span>
      <button class="btn btn-ghost btn-sm" onclick="handleLogout()"><i class="fa-solid fa-right-from-bracket"></i> Sign Out</button>
    </div>
  </div>
  <div class="admin-content-wrap">
    ${renderAdminContent()}
  </div>`;
}

function renderAdminContent() {
  const p = APP.viewParams || {};

  if (p.student) {
    return renderAdminStudentDetail(p.student);
  }

  const users = getUsers().filter(u => u.username !== 'admin');

  let html = `
  <div class="page-header fade-in">
    <h1>Welcome back</h1>
    <p>${users.length} registered student${users.length !== 1 ? 's' : ''} · Manage the NUMA Certification Portal</p>
  </div>

  <div class="admin-overview-grid">
    <div class="admin-overview-card" onclick="navigate('admin',{view:'modules'})">
      <div class="admin-overview-icon"><i class="fa-solid fa-book-open"></i></div>
      <h3>Course Content</h3>
      <p>Edit modules, sections, and quizzes</p>
    </div>
    <div class="admin-overview-card" onclick="navigate('admin',{view:'gradebook'})">
      <div class="admin-overview-icon"><i class="fa-solid fa-table"></i></div>
      <h3>Gradebook</h3>
      <p>Review quiz scores and student progress</p>
    </div>
    <div class="admin-overview-card" onclick="navigate('admin',{view:'codes'})">
      <div class="admin-overview-icon"><i class="fa-solid fa-key"></i></div>
      <h3>Enrollment Codes</h3>
      <p>Create codes for new students to sign up</p>
    </div>
    <div class="admin-overview-card" onclick="navigate('admin',{view:'questions'})">
      <div class="admin-overview-icon"><i class="fa-solid fa-inbox"></i></div>
      <h3>Student Questions</h3>
      <p>Reply to questions submitted by students</p>
    </div>
    <div class="admin-overview-card" onclick="navigate('admin',{view:'attempts'})">
      <div class="admin-overview-icon"><i class="fa-solid fa-stopwatch"></i></div>
      <h3>Quiz Attempts</h3>
      <p>See every section-quiz attempt with timing</p>
    </div>
    <div class="admin-overview-card" onclick="navigate('admin',{view:'forum'})">
      <div class="admin-overview-icon"><i class="fa-solid fa-comments"></i></div>
      <h3>Discussion Forum</h3>
      <p>Moderate posts · pin announcements</p>
    </div>
    <div class="admin-overview-card" onclick="navigate('admin',{view:'plagiarism'})">
      <div class="admin-overview-icon"><i class="fa-solid fa-flag"></i></div>
      <h3>Plagiarism Check</h3>
      <p>Compare student work for similarities</p>
    </div>
    <div class="admin-overview-card" onclick="navigate('admin',{view:'program-settings'})">
      <div class="admin-overview-icon"><i class="fa-solid fa-sliders"></i></div>
      <h3>Program Settings</h3>
      <p>Edit required hours for observation, teaching, personal practice</p>
    </div>
  </div>

  <h2 class="admin-section-heading">Students</h2>`;

  if (users.length === 0) {
    html += '<div class="card"><div class="card-body text-center text-muted">No students registered yet.</div></div>';
    return html;
  }

  html += `<div class="card slide-up"><div class="card-body" style="padding:0;overflow-x:auto;">
  <table class="admin-table">
    <thead><tr>
      <th>Student</th><th>Email</th><th>Progress</th><th>Modules</th><th>Hours</th><th>Exam</th><th></th>
    </tr></thead><tbody>`;

  users.forEach(u => {
    const completed = COURSE_MODULES.filter(m => u.quizScores && u.quizScores[m.id] >= 80).length;
    let totalHrs = 0;
    ['observation', 'teaching', 'personal'].forEach(type => {
      (u.hourLogs?.[type] || []).forEach(e => totalHrs += parseFloat(e.hours) || 0);
    });
    const progress = Math.round((completed / COURSE_MODULES.length) * 100);

    html += `<tr>
      <td><strong>${u.fullName || u.username}</strong><br><span class="text-muted" style="font-size:11px;">${u.username}</span></td>
      <td class="text-muted" style="font-size:12px;">${u.email || '—'}</td>
      <td>
        <div class="progress-bar-wrap" style="width:100px;display:inline-block;vertical-align:middle;">
          <div class="progress-bar-fill" style="width:${progress}%"></div>
        </div>
        <span class="text-sm"> ${progress}%</span>
      </td>
      <td>${completed}/${COURSE_MODULES.length}</td>
      <td>${totalHrs.toFixed(1)}</td>
      <td>${u.examPassed ? `<span class="badge badge-complete">Passed ${u.examScore}%</span>` : '<span class="badge badge-locked">—</span>'}</td>
      <td><button class="btn btn-ghost btn-sm" onclick="navigate('admin',{student:'${u.username}'})">View</button></td>
    </tr>`;
  });

  html += '</tbody></table></div></div>';
  return html;
}

function renderAdminStudentDetail(username) {
  const u = getUserData(username);
  if (!u) return '<p>Student not found.</p>';

  let totalHrs = 0;
  ['observation', 'teaching', 'personal'].forEach(type => {
    (u.hourLogs?.[type] || []).forEach(e => totalHrs += parseFloat(e.hours) || 0);
  });

  let html = `
  <div class="breadcrumb fade-in">
    <a href="#" onclick="navigate('admin');return false;">All Students</a>
    <i class="fa-solid fa-chevron-right" style="font-size:10px;"></i>
    <span>${u.fullName}</span>
  </div>
  <div class="page-header">
    <h1>${u.fullName}</h1>
    <p>@${u.username} · Joined ${new Date(u.createdAt).toLocaleDateString()}</p>
  </div>

  <div class="stats-grid slide-up">
    <div class="stat-card">
      <div class="stat-label">Overall Progress</div>
      <div class="stat-value">${Math.round((COURSE_MODULES.filter(m => u.quizScores && u.quizScores[m.id] >= 80).length / COURSE_MODULES.length) * 100)}%</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Total Hours</div>
      <div class="stat-value">${totalHrs.toFixed(1)}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Exam Status</div>
      <div class="stat-value" style="font-size:1rem;">${u.examPassed ? `Passed (${u.examScore}%)` : 'Not taken'}</div>
    </div>
  </div>

  <h3 class="mb-2">Module Quiz Scores</h3>
  <div class="card mb-3"><div class="card-body" style="padding:0;overflow-x:auto;">
    <table class="admin-table">
      <thead><tr><th>Module</th><th>Status</th><th>Best Score</th></tr></thead>
      <tbody>`;

  COURSE_MODULES.forEach(m => {
    const score = u.quizScores ? u.quizScores[m.id] : null;
    html += `<tr>
      <td>${m.id}. ${m.title}</td>
      <td>${score >= 80 ? '<span class="badge badge-complete">Passed</span>' : score ? '<span class="badge badge-progress">Attempted</span>' : '<span class="badge badge-locked">Not started</span>'}</td>
      <td>${score !== null && score !== undefined ? score + '%' : '—'}</td>
    </tr>`;
  });

  html += '</tbody></table></div></div>';

  // Hour logs
  html += '<h3 class="mb-2">Hour Logs</h3>';
  ['observation', 'teaching', 'personal'].forEach(type => {
    const entries = u.hourLogs?.[type] || [];
    const typeHrs = entries.reduce((s, e) => s + (parseFloat(e.hours) || 0), 0);
    html += `<h4 class="mt-2" style="text-transform:capitalize;">${type} — ${typeHrs.toFixed(1)} hours</h4>`;
    if (entries.length > 0) {
      html += '<div class="card mb-2"><div class="card-body" style="padding:0;overflow-x:auto;"><table class="log-table"><thead><tr><th>Date</th><th>Details</th><th>Hours</th></tr></thead><tbody>';
      entries.forEach(e => {
        const detail = type === 'observation' ? `${e.location || ''} — ${e.instructor || ''}` :
                       type === 'teaching' ? `${e.classType || ''} — Sup: ${e.supervisor || ''}` :
                       e.practiceType || '';
        html += `<tr><td>${e.date}</td><td>${detail}</td><td>${e.hours}</td></tr>`;
      });
      html += '</tbody></table></div></div>';
    } else {
      html += '<p class="text-sm text-muted">No entries.</p>';
    }
  });

  return html;
}

// ===== INITIALIZE =====
document.addEventListener('DOMContentLoaded', init);

// ===== ENHANCED FEATURES: Grading System, Timed Quizzes, Scenario Assessments =====

// ----- Quiz Timer System -----
window._quizTimers = {};

function startQuizTimer(moduleId, timeLimitMinutes) {
  window._quizTimers[moduleId] = {
    startTime: Date.now(),
    timeLimit: timeLimitMinutes * 60 * 1000,
    interval: setInterval(() => updateQuizTimerDisplay(moduleId), 1000)
  };
}

function updateQuizTimerDisplay(moduleId) {
  const timer = window._quizTimers[moduleId];
  if (!timer) return;
  const elapsed = Date.now() - timer.startTime;
  const remaining = timer.timeLimit - elapsed;
  const timerEl = document.getElementById('quiz-timer-' + moduleId);
  if (remaining <= 0) {
    clearInterval(timer.interval);
    if (timerEl) timerEl.textContent = '0:00';
    // Auto-submit quiz
    autoSubmitQuiz(moduleId);
    return;
  }
  if (timerEl) {
    const mins = Math.floor(remaining / 60000);
    const secs = Math.floor((remaining % 60000) / 1000);
    timerEl.textContent = mins + ':' + secs.toString().padStart(2, '0');
    timerEl.className = 'exam-timer' + (mins < 5 ? ' warning' : '');
  }
}

function autoSubmitQuiz(moduleId) {
  const submitBtn = document.getElementById('quiz-submit-btn-' + moduleId);
  if (submitBtn) submitBtn.click();
}

function getQuizTimeLimit(moduleId) {
  const limits = { 1: 20, 2: 30, 3: 35, 4: 35, 5: 20, 6: 30, 7: 20 };
  return limits[moduleId] || 25;
}

// ----- Grading System -----
function getLetterGrade(pct) {
  if (pct >= 93) return 'A';
  if (pct >= 90) return 'A-';
  if (pct >= 87) return 'B+';
  if (pct >= 83) return 'B';
  if (pct >= 80) return 'B-';
  if (pct >= 77) return 'C+';
  if (pct >= 73) return 'C';
  if (pct >= 70) return 'C-';
  return 'F';
}

function getGradeColor(grade) {
  if (grade.startsWith('A')) return 'var(--success)';
  if (grade.startsWith('B')) return '#2E86AB';
  if (grade.startsWith('C')) return 'var(--warning)';
  return 'var(--error)';
}

function calculateOverallGrade(user) {
  if (!user || !user.quizScores) return { pct: 0, letter: 'N/A' };
  const quizScores = [];
  COURSE_MODULES.forEach(m => {
    if (user.quizScores[m.id] !== undefined && user.quizScores[m.id] !== null) {
      quizScores.push(user.quizScores[m.id]);
    }
  });
  const quizAvg = quizScores.length > 0 ? quizScores.reduce((a,b) => a+b, 0) / quizScores.length : 0;
  const examScore = user.examScore || 0;
  // Scenarios average
  const scenarioScores = [];
  (user.scenarioSubmissions || []).forEach(s => {
    if (s.grade !== undefined && s.grade !== null) scenarioScores.push(s.grade);
  });
  const scenarioAvg = scenarioScores.length > 0 ? scenarioScores.reduce((a,b) => a+b, 0) / scenarioScores.length : 0;
  
  // Weighted: Quizzes 40%, Final Exam 35%, Scenarios 25%
  let overall;
  if (user.examPassed && scenarioScores.length > 0) {
    overall = (quizAvg * 0.4) + (examScore * 0.35) + (scenarioAvg * 0.25);
  } else if (user.examPassed) {
    overall = (quizAvg * 0.55) + (examScore * 0.45);
  } else {
    overall = quizAvg;
  }
  return { pct: Math.round(overall), letter: getLetterGrade(Math.round(overall)) };
}

// ----- Quiz History Tracking -----
function recordQuizAttempt(user, moduleId, score, timeTaken) {
  user.quizHistory = user.quizHistory || [];
  user.quizHistory.push({
    moduleId,
    score,
    timeTaken, // in seconds
    timestamp: new Date().toISOString(),
    attempt: (user.quizHistory.filter(h => h.moduleId === moduleId).length) + 1
  });
  saveUserData(user);
}

// ----- Scenario-Based Assessments -----
const SCENARIO_POOL = [
  // Prenatal scenarios
  {
    id: 'pre1',
    category: 'Prenatal',
    title: 'Second Trimester Client with Low Back Pain',
    scenario: 'A 32-year-old client is 24 weeks pregnant (second trimester) and has been doing reformer Pilates with you for 1 year. Today she reports new onset low back pain (5/10) and mild pelvic floor pressure when she coughs or sneezes. She says her OB cleared her for Pilates. She asks if she can still do her usual intermediate class.',
    prompts: [
      'What questions do you ask her before starting the session?',
      'What specific modifications do you make to her usual reformer program?',
      'What exercises do you remove entirely and why?',
      'What exercises do you add or emphasize and why?',
      'At what point would you refer her to a pelvic floor physiotherapist?',
      'Design a safe 45-minute reformer session for her today. List exercises, spring settings, and cueing modifications.'
    ],
    timeLimit: 30
  },
  {
    id: 'pre2',
    category: 'Prenatal',
    title: 'Third Trimester Group Class Design',
    scenario: 'You have been asked to teach a 50-minute prenatal reformer class. The class has 4 clients: one at 14 weeks (first timer), one at 26 weeks (experienced), one at 34 weeks (experienced), and one at 38 weeks (intermediate). All have medical clearance.',
    prompts: [
      'How do you structure a class that safely accommodates all four trimesters?',
      'What exercises are safe for all four women?',
      'What specific modifications does the 38-week client need that others do not?',
      'What positions are contraindicated and at which gestational ages?',
      'Design the full 50-minute class flow with exercises, springs, and per-client modifications.'
    ],
    timeLimit: 35
  },
  // Postnatal scenarios
  {
    id: 'post1',
    category: 'Postnatal',
    title: 'C-Section Recovery Client',
    scenario: 'A client comes to you 10 weeks after an emergency C-section. She was active before and during pregnancy (yoga and Pilates). Her OB has cleared her for "light exercise." She is eager to "get her body back" and wants to do reformer immediately. She also mentions she sometimes leaks when she laughs.',
    prompts: [
      'What is your initial assessment process for this client?',
      'How do you address her eagerness to jump back into full reformer work?',
      'What do the urinary leakage symptoms tell you, and how does this change your approach?',
      'What exercises are absolutely contraindicated at 10 weeks post C-section?',
      'Design a progressive 4-week program (sessions 1-4) that safely reintroduces her to Pilates. Include exercises, goals per session, and red flags to watch for.'
    ],
    timeLimit: 35
  },
  // Osteoporosis scenarios
  {
    id: 'osteo1',
    category: 'Osteoporosis',
    title: 'Osteoporosis Client Risk Assessment',
    scenario: 'A 68-year-old woman with diagnosed osteoporosis (T-score -2.8 at lumbar spine) wants to start private Pilates sessions. She has mild thoracic kyphosis, no recent fractures, but had a Colles fracture (wrist) 2 years ago from a fall. She takes alendronate (Fosamax). She has never done Pilates before.',
    prompts: [
      'Walk through your complete initial assessment for this client.',
      'What specific movements and positions are contraindicated for her and why? Explain the biomechanical reasoning.',
      'What is the role of loaded flexion vs. extension in osteoporosis, and how does this impact your exercise selection?',
      'Design a safe 45-minute reformer session for her first visit. Include exercises, spring settings, and rationale for each choice.',
      'How do you address her thoracic kyphosis without putting her at fracture risk?',
      'What are the red flags that would make you stop the session and refer to her physician?'
    ],
    timeLimit: 35
  },
  {
    id: 'osteo2',
    category: 'Osteoporosis',
    title: 'Osteoporosis Group Class Challenge',
    scenario: 'Your studio owner asks you to create a "Bone Health Reformer" group class for clients with osteoporosis and osteopenia. You need to design a repeatable 50-minute class template that is safe for this population while still being engaging and effective.',
    prompts: [
      'What screening criteria would you require before allowing someone into this class?',
      'List all contraindicated movements for this population with biomechanical reasoning.',
      'Design the full 50-minute class flow (footwork through cool-down) with every exercise, spring setting, and safety rationale.',
      'How do you incorporate balance training (referencing the Araujo single-leg stance research)?',
      'What props would you use and how?'
    ],
    timeLimit: 30
  },
  // Injury scenarios
  {
    id: 'inj1',
    category: 'Injury Management',
    title: 'Disc Herniation Client',
    scenario: 'A 45-year-old male client comes to you with a referral from his physical therapist. He had an L4-L5 posterolateral disc herniation 4 months ago, completed 8 weeks of PT, and has been cleared for Pilates with the note "avoid loaded flexion, progress gradually." He still has occasional right-leg sciatic symptoms (tingling) that rate 2/10.',
    prompts: [
      'What additional questions do you ask before his first session?',
      'Explain the biomechanics of why loaded flexion is contraindicated for this client (reference disc mechanics).',
      'What positions and exercises are safe, and why?',
      'How do you interpret "occasional right-leg sciatic symptoms" — what does this tell you about his current status?',
      'Design his first 50-minute reformer session. Include exercises, spring settings, positions to avoid, and progression criteria.',
      'At what point during a session would you stop and refer him back to his PT?'
    ],
    timeLimit: 35
  },
  {
    id: 'inj2',
    category: 'Injury Management',
    title: 'Shoulder Impingement in Regular Client',
    scenario: 'One of your regular intermediate clients (42-year-old female, been with you 6 months) arrives for her session and mentions she has been having right shoulder pain for 2 weeks — sharp pain when reaching overhead and a dull ache at night. She has not seen a doctor yet. She rates the pain 6/10 when reaching overhead, 3/10 at rest.',
    prompts: [
      'What do you assess before the session? What tests or observations can you do within your scope of practice?',
      'What exercises from her normal intermediate reformer program do you modify or remove today?',
      'Using your knowledge of scapulohumeral rhythm and the convex-concave rule, explain what might be happening biomechanically.',
      'Design a modified 50-minute reformer session for today that works around her shoulder while still giving her a productive session.',
      'When and how do you recommend she seek medical evaluation? What language do you use (scope of practice)?'
    ],
    timeLimit: 30
  },
  // Emergency/Ethics scenarios
  {
    id: 'emerg1',
    category: 'Emergency & Ethics',
    title: 'Mid-Class Medical Emergency',
    scenario: 'You are teaching a group reformer class of 6 people. A 55-year-old male client suddenly becomes very pale, says he feels "weird pressure" in his chest, and begins sweating heavily. He tries to continue the exercise.',
    prompts: [
      'What are your immediate steps, in order?',
      'How do you manage the other 5 clients in the room?',
      'What information do you gather and relay to emergency services?',
      'After the incident, what documentation do you complete?',
      'How does this scenario relate to your scope of practice and your intake/screening process?'
    ],
    timeLimit: 20
  },
  // Class design scenarios
  {
    id: 'class1',
    category: 'Class Design',
    title: 'Beginner Reformer Class Design',
    scenario: 'You are designing your first beginner reformer class for a group of 4 brand-new clients who have never been on a reformer. None have injuries or medical conditions. The class is 50 minutes. The class must start with footwork, include a plank series, and end with feet in straps.',
    prompts: [
      'How do you orient them to the reformer safely? What do you teach them first?',
      'Design the complete 50-minute class flow: every exercise, spring setting, rep count, and transition.',
      'Write out your exact cueing for the first footwork exercise (parallel heels).',
      'How do you modify the plank series for complete beginners?',
      'What is your cool-down/feet-in-straps sequence and why did you choose those exercises to end?'
    ],
    timeLimit: 30
  },
  {
    id: 'class2',
    category: 'Class Design',
    title: 'Advanced Athletic Reformer Flow',
    scenario: 'Design a 60-minute advanced reformer class for 3 experienced clients (all 2+ years of Pilates, no injuries, athletic backgrounds). The class must start with footwork, include a plank series, and end with feet in straps. Incorporate at least 2 prop combinations (choose from: magic ring, resistance band, light weights, dowel).',
    prompts: [
      'Design the complete 60-minute class flow: every exercise, spring setting, rep count, props used, and transitions.',
      'Explain how you applied the principle of progressive overload (referencing Adam McAtee\'s work).',
      'What makes this class "advanced" vs. intermediate — identify the specific progressions.',
      'Write out detailed cueing for your plank series (at least 3 plank variations).',
      'How do you use the SAID principle in your exercise selection?'
    ],
    timeLimit: 35
  }
];

function getRandomScenarios(count, excludeIds) {
  excludeIds = excludeIds || [];
  const available = SCENARIO_POOL.filter(s => !excludeIds.includes(s.id));
  const shuffled = available.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

function renderScenariosPage() {
  const user = APP.currentUser;
  user.scenarioSubmissions = user.scenarioSubmissions || [];
  
  // Check if all module quizzes passed (at least through Module 6)
  const prereqMet = user.quizScores && user.quizScores[6] >= 80;
  
  if (!prereqMet) {
    return '<div class="exam-header fade-in"><h1>Scenario Assessments</h1><div class="locked-overlay" style="padding:20px;"><i class="fa-solid fa-lock"></i><h3>Complete Modules 1-6 First</h3><p>You must pass the first 6 module quizzes before accessing scenario assessments.</p></div></div>';
  }

  let html = '<div class="page-header fade-in"><h1>Scenario-Based Assessments</h1><p>Apply your knowledge to real-world clinical situations. These are manually graded by your instructor.</p></div>';
  
  // Show assigned scenarios or let them start
  if (!user.assignedScenarios || user.assignedScenarios.length === 0) {
    // Assign 4 random scenarios from different categories
    const previousIds = user.scenarioSubmissions.map(s => s.scenarioId);
    const scenarios = getRandomScenarios(4, previousIds);
    user.assignedScenarios = scenarios.map(s => s.id);
    saveUserData(user);
  }

  const assigned = user.assignedScenarios.map(id => SCENARIO_POOL.find(s => s.id === id)).filter(Boolean);
  
  html += '<div class="modules-grid">';
  assigned.forEach((scenario, i) => {
    const submission = user.scenarioSubmissions.find(s => s.scenarioId === scenario.id);
    const status = submission ? (submission.grade !== undefined && submission.grade !== null ? 'graded' : 'submitted') : 'pending';
    const badgeHtml = status === 'graded' ? '<span class="badge badge-complete">Graded: ' + submission.grade + '%</span>' :
                      status === 'submitted' ? '<span class="badge badge-progress">Awaiting Review</span>' :
                      '<span class="badge badge-locked">Not Started</span>';
    
    html += '<div class="module-card slide-up stagger-' + ((i%4)+1) + '" onclick="openScenario(\'' + scenario.id + '\')">' +
      '<div class="module-card-top ' + (status === 'graded' ? 'completed' : i % 2 === 0 ? 'terracotta' : 'sage') + '"></div>' +
      '<div class="module-card-body">' +
      '<div class="module-card-num"><span>' + scenario.category + '</span>' + badgeHtml + '</div>' +
      '<h3 style="font-size:1rem;margin:8px 0;">' + scenario.title + '</h3>' +
      '<p class="text-sm text-muted">Time limit: ' + scenario.timeLimit + ' minutes</p>' +
      '</div></div>';
  });
  html += '</div>';
  
  // Show completed scenarios
  if (user.scenarioSubmissions.length > 0) {
    html += '<h2 class="mt-4 mb-2">Previous Submissions</h2><div class="card"><div class="card-body" style="padding:0;overflow-x:auto;"><table class="admin-table"><thead><tr><th>Scenario</th><th>Category</th><th>Submitted</th><th>Time Used</th><th>Grade</th></tr></thead><tbody>';
    user.scenarioSubmissions.forEach(sub => {
      const sc = SCENARIO_POOL.find(s => s.id === sub.scenarioId);
      html += '<tr><td>' + (sc ? sc.title : sub.scenarioId) + '</td><td>' + (sc ? sc.category : '') + '</td><td>' + new Date(sub.timestamp).toLocaleDateString() + '</td><td>' + (sub.timeUsed ? Math.round(sub.timeUsed/60) + ' min' : '—') + '</td><td>' + (sub.grade !== undefined && sub.grade !== null ? sub.grade + '% (' + getLetterGrade(sub.grade) + ')' : 'Pending') + '</td></tr>';
    });
    html += '</tbody></table></div></div>';
  }
  
  return html;
}

function openScenario(scenarioId) {
  const user = APP.currentUser;
  const existing = (user.scenarioSubmissions || []).find(s => s.scenarioId === scenarioId);
  if (existing) {
    alert('You have already submitted this scenario.');
    return;
  }
  APP.currentScenario = scenarioId;
  APP.scenarioStartTime = Date.now();
  navigate('scenario-active');
}

function renderActiveScenario() {
  const scenario = SCENARIO_POOL.find(s => s.id === APP.currentScenario);
  if (!scenario) return '<p>Scenario not found.</p>';
  
  const elapsed = Date.now() - (APP.scenarioStartTime || Date.now());
  const remaining = (scenario.timeLimit * 60 * 1000) - elapsed;
  const mins = Math.max(0, Math.floor(remaining / 60000));
  const secs = Math.max(0, Math.floor((remaining % 60000) / 1000));
  
  // Start timer if not already running
  if (!window._scenarioTimer) {
    window._scenarioTimer = setInterval(() => {
      const el = document.getElementById('scenario-timer');
      if (!el) return;
      const rem = (scenario.timeLimit * 60 * 1000) - (Date.now() - APP.scenarioStartTime);
      if (rem <= 0) {
        clearInterval(window._scenarioTimer);
        window._scenarioTimer = null;
        submitScenario(scenario.id);
        return;
      }
      const m = Math.floor(rem / 60000);
      const s = Math.floor((rem % 60000) / 1000);
      el.textContent = m + ':' + s.toString().padStart(2, '0');
      el.className = 'exam-timer' + (m < 5 ? ' warning' : '');
    }, 1000);
  }
  
  let html = '<div class="exam-header" style="margin-bottom:16px;padding:20px;">' +
    '<div class="flex justify-between items-center flex-wrap gap-2">' +
    '<div><strong>' + scenario.category + ':</strong> ' + scenario.title + '</div>' +
    '<div id="scenario-timer" class="exam-timer">' + mins + ':' + secs.toString().padStart(2,'0') + '</div>' +
    '</div></div>';
  
  html += '<div class="card mb-3"><div class="card-body"><h3 style="margin-bottom:12px;">Scenario</h3><p style="line-height:1.7;font-size:15px;">' + scenario.scenario + '</p></div></div>';
  
  html += '<div class="card mb-3"><div class="card-body"><h3 style="margin-bottom:16px;">Your Responses</h3><p class="text-sm text-muted mb-3">Answer each prompt thoroughly. Your responses will be reviewed and graded by your instructor using a rubric.</p>';
  
  scenario.prompts.forEach((prompt, i) => {
    html += '<div class="form-group" style="margin-bottom:20px;">' +
      '<label style="font-weight:600;font-size:14px;margin-bottom:8px;display:block;">' + (i+1) + '. ' + prompt + '</label>' +
      '<textarea class="form-control scenario-response" id="scenario-resp-' + i + '" rows="6" style="min-height:120px;font-size:14px;line-height:1.6;" placeholder="Type your complete response here..."></textarea>' +
      '</div>';
  });
  
  html += '<div style="display:flex;gap:12px;margin-top:20px;">' +
    '<button class="btn btn-primary btn-lg" onclick="submitScenario(\'' + scenario.id + '\')"><i class="fa-solid fa-paper-plane"></i> Submit Responses</button>' +
    '<button class="btn btn-secondary" onclick="if(confirm(\'Are you sure? Your responses will be lost.\')){clearInterval(window._scenarioTimer);window._scenarioTimer=null;navigate(\'scenarios\');}">Cancel</button>' +
    '</div></div></div>';
  
  return html;
}

function submitScenario(scenarioId) {
  clearInterval(window._scenarioTimer);
  window._scenarioTimer = null;
  
  const scenario = SCENARIO_POOL.find(s => s.id === scenarioId);
  if (!scenario) return;
  
  const responses = [];
  scenario.prompts.forEach((_, i) => {
    const el = document.getElementById('scenario-resp-' + i);
    responses.push(el ? el.value : '');
  });
  
  const timeUsed = Math.round((Date.now() - APP.scenarioStartTime) / 1000);
  
  const user = APP.currentUser;
  user.scenarioSubmissions = user.scenarioSubmissions || [];
  user.scenarioSubmissions.push({
    scenarioId,
    responses,
    timeUsed,
    timestamp: new Date().toISOString(),
    grade: null, // null until admin grades
    rubricScores: null,
    adminNotes: null
  });
  
  // Remove from assigned
  user.assignedScenarios = (user.assignedScenarios || []).filter(id => id !== scenarioId);
  
  saveUserData(user);
  addActivity('Submitted scenario assessment: ' + scenario.title);
  APP.currentScenario = null;
  APP.scenarioStartTime = null;
  navigate('scenarios');
}

// ----- Admin Grading for Scenarios -----
function renderAdminGradingView(username) {
  const u = getUserData(username);
  if (!u) return '<p>Student not found.</p>';
  
  const submissions = u.scenarioSubmissions || [];
  if (submissions.length === 0) return '<p class="text-muted">No scenario submissions yet.</p>';
  
  let html = '<h3 class="mb-2">Scenario Submissions</h3>';
  
  submissions.forEach((sub, idx) => {
    const sc = SCENARIO_POOL.find(s => s.id === sub.scenarioId);
    if (!sc) return;
    
    const isGraded = sub.grade !== undefined && sub.grade !== null;
    
    html += '<div class="card mb-3"><div class="card-body">' +
      '<div class="flex justify-between items-center flex-wrap gap-2 mb-2">' +
      '<div><strong>' + sc.category + ':</strong> ' + sc.title + '</div>' +
      '<div>' + (isGraded ? '<span class="badge badge-complete">Graded: ' + sub.grade + '%</span>' : '<span class="badge badge-progress">Needs Grading</span>') + '</div>' +
      '</div>' +
      '<p class="text-sm text-muted">Submitted: ' + new Date(sub.timestamp).toLocaleDateString() + ' · Time used: ' + Math.round(sub.timeUsed/60) + ' min</p>';
    
    html += '<div style="margin-top:16px;">';
    sc.prompts.forEach((prompt, pi) => {
      html += '<div style="margin-bottom:16px;padding:12px;background:var(--cream-dark,#f0ede6);border-radius:8px;">' +
        '<p style="font-weight:600;font-size:13px;margin-bottom:8px;">' + (pi+1) + '. ' + prompt + '</p>' +
        '<div style="font-size:14px;line-height:1.6;white-space:pre-wrap;background:white;padding:12px;border-radius:6px;border:1px solid var(--border);">' + (sub.responses[pi] || '<em class="text-muted">No response</em>') + '</div>' +
        '</div>';
    });
    html += '</div>';
    
    // Grading rubric
    const rubricCategories = ['Safety Awareness', 'Exercise Selection Accuracy', 'Modification Knowledge', 'Cueing Quality', 'Scope of Practice', 'Clinical Reasoning'];
    
    html += '<div style="margin-top:16px;padding:16px;background:var(--cream-dark,#f0ede6);border-radius:8px;">' +
      '<h4 style="margin-bottom:12px;">Grading Rubric (0-10 each)</h4>' +
      '<div class="form-row" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:8px;">';
    
    rubricCategories.forEach((cat, ci) => {
      const currentScore = sub.rubricScores ? sub.rubricScores[ci] : '';
      html += '<div class="form-group">' +
        '<label style="font-size:12px;">' + cat + '</label>' +
        '<input type="number" class="form-control" id="rubric-' + idx + '-' + ci + '" min="0" max="10" step="1" value="' + currentScore + '" style="width:80px;">' +
        '</div>';
    });
    
    html += '</div>' +
      '<div class="form-group mt-2">' +
      '<label style="font-size:12px;">Instructor Notes</label>' +
      '<textarea class="form-control" id="admin-notes-' + idx + '" rows="3" style="font-size:13px;">' + (sub.adminNotes || '') + '</textarea>' +
      '</div>' +
      '<button class="btn btn-primary mt-2" onclick="gradeScenario(\'' + username + '\',' + idx + ')"><i class="fa-solid fa-check"></i> Save Grade</button>' +
      '</div>';
    
    html += '</div></div>';
  });
  
  return html;
}

function gradeScenario(username, subIdx) {
  const u = getUserData(username);
  if (!u || !u.scenarioSubmissions[subIdx]) return;
  
  const rubricScores = [];
  for (let ci = 0; ci < 6; ci++) {
    const el = document.getElementById('rubric-' + subIdx + '-' + ci);
    const val = el ? parseInt(el.value) : 0;
    rubricScores.push(isNaN(val) ? 0 : Math.min(10, Math.max(0, val)));
  }
  
  const notesEl = document.getElementById('admin-notes-' + subIdx);
  const notes = notesEl ? notesEl.value : '';
  
  const totalRubric = rubricScores.reduce((a,b) => a+b, 0);
  const grade = Math.round((totalRubric / 60) * 100); // Out of 60 possible points
  
  u.scenarioSubmissions[subIdx].rubricScores = rubricScores;
  u.scenarioSubmissions[subIdx].adminNotes = notes;
  u.scenarioSubmissions[subIdx].grade = grade;
  
  saveUserData(u);
  alert('Grade saved: ' + grade + '% (' + getLetterGrade(grade) + ')');
  render();
}

// ----- Plagiarism Detection (simple similarity check) -----
function checkSimilarity(text1, text2) {
  if (!text1 || !text2) return 0;
  const words1 = text1.toLowerCase().split(/\s+/).filter(w => w.length > 3);
  const words2 = text2.toLowerCase().split(/\s+/).filter(w => w.length > 3);
  if (words1.length === 0 || words2.length === 0) return 0;
  const set1 = new Set(words1);
  const set2 = new Set(words2);
  const intersection = [...set1].filter(w => set2.has(w)).length;
  const union = new Set([...set1, ...set2]).size;
  return Math.round((intersection / union) * 100);
}

function renderPlagiarismReport() {
  const users = getUsers().filter(u => u.username !== 'admin');
  const flags = [];
  
  for (let i = 0; i < users.length; i++) {
    for (let j = i + 1; j < users.length; j++) {
      const subs1 = users[i].scenarioSubmissions || [];
      const subs2 = users[j].scenarioSubmissions || [];
      
      subs1.forEach(s1 => {
        subs2.forEach(s2 => {
          if (s1.scenarioId === s2.scenarioId) {
            const allText1 = s1.responses.join(' ');
            const allText2 = s2.responses.join(' ');
            const similarity = checkSimilarity(allText1, allText2);
            if (similarity > 60) {
              const sc = SCENARIO_POOL.find(s => s.id === s1.scenarioId);
              flags.push({
                student1: users[i].fullName || users[i].username,
                student2: users[j].fullName || users[j].username,
                scenario: sc ? sc.title : s1.scenarioId,
                similarity
              });
            }
          }
        });
      });
    }
  }
  
  if (flags.length === 0) return '<p class="text-muted">No similarity flags detected.</p>';
  
  let html = '<div class="card"><div class="card-body" style="padding:0;overflow-x:auto;"><table class="admin-table"><thead><tr><th>Student 1</th><th>Student 2</th><th>Scenario</th><th>Similarity</th></tr></thead><tbody>';
  flags.forEach(f => {
    const color = f.similarity > 80 ? 'var(--error)' : 'var(--warning)';
    html += '<tr><td>' + f.student1 + '</td><td>' + f.student2 + '</td><td>' + f.scenario + '</td><td style="color:' + color + ';font-weight:700;">' + f.similarity + '%</td></tr>';
  });
  html += '</tbody></table></div></div>';
  return html;
}

// ===== PATCH: Add scenarios and grading to navigation and routing =====

// Override the original renderMainContent to include new views
const _origRenderMainContent = renderMainContent;
window.renderMainContent = function() {
  const v = APP.currentView;
  if (v === 'scenarios') return renderScenariosPage();
  if (v === 'scenario-active') return renderActiveScenario();
  return _origRenderMainContent();
};
// Replace the reference
renderMainContent = window.renderMainContent;

// Override admin content to include grading
const _origRenderAdminContent = renderAdminContent;
window.renderAdminContent = function() {
  const p = APP.viewParams || {};
  if (p.view === 'gradebook') return renderAdminGradebook();
  if (p.view === 'plagiarism') return renderAdminPlagiarismPage();
  if (p.view === 'codes') return renderEnrollmentCodesPage();
  if (p.view === 'modules') return renderModuleManager();
  if (p.view === 'editModule') return renderModuleEditor(p.moduleId);
  if (p.view === 'editSection') return renderSectionEditor(p.moduleId, p.sectionId);
  if (p.view === 'newModule') return renderModuleEditor(null);
  if (p.view === 'newSection') return renderSectionEditor(p.moduleId, null);
  return _origRenderAdminContent();
};
renderAdminContent = window.renderAdminContent;

// Override admin student detail to include scenario grading
const _origRenderAdminStudentDetail = renderAdminStudentDetail;
window.renderAdminStudentDetail = function(username) {
  let html = _origRenderAdminStudentDetail(username);
  html += renderAdminGradingView(username);
  return html;
};
renderAdminStudentDetail = window.renderAdminStudentDetail;

// Override sidebar to add Scenarios link
const _origRenderSidebar = renderSidebar;
window.renderSidebar = function() {
  let html = _origRenderSidebar();
  const v = APP.currentView;
  const scenarioItem = '<div class="sidebar-item ' + (v === 'scenarios' || v === 'scenario-active' ? 'active' : '') + '" onclick="navigate(\'scenarios\')">' +
    '<i class="fa-solid fa-clipboard-question"></i> Scenarios' +
    '</div>';
  // Insert before the Modules section
  html = html.replace('<div class="sidebar-section">\n    <div class="sidebar-label">Modules</div>', 
    scenarioItem + '</div><div class="sidebar-section"><div class="sidebar-label">Modules</div>');
  return html;
};
renderSidebar = window.renderSidebar;

// Admin Gradebook
function renderAdminGradebook() {
  const users = getUsers().filter(u => u.username !== 'admin');
  
  let html = '<div class="page-header fade-in"><h1>Gradebook</h1><p>Weighted grading: Module Quizzes (40%) + Final Exam (35%) + Scenarios (25%)</p></div>';
  
  html += '<div style="display:flex;gap:12px;margin-bottom:20px;">' +
    '<button class="btn btn-secondary" onclick="navigate(\'admin\')"><i class="fa-solid fa-arrow-left"></i> All Students</button>' +
    '<button class="btn btn-secondary" onclick="navigate(\'admin\',{view:\'plagiarism\'})"><i class="fa-solid fa-flag"></i> Plagiarism Check</button>' +
    '</div>';
  
  if (users.length === 0) {
    html += '<div class="card"><div class="card-body text-center text-muted">No students registered.</div></div>';
    return html;
  }
  
  html += '<div class="card"><div class="card-body" style="padding:0;overflow-x:auto;"><table class="admin-table"><thead><tr>' +
    '<th>Student</th>';
  COURSE_MODULES.forEach(m => {
    html += '<th style="text-align:center;font-size:11px;">M' + m.id + '</th>';
  });
  html += '<th style="text-align:center;">Quiz Avg</th><th style="text-align:center;">Exam</th><th style="text-align:center;">Scenarios</th><th style="text-align:center;">Overall</th><th style="text-align:center;">Grade</th></tr></thead><tbody>';
  
  users.forEach(u => {
    const grade = calculateOverallGrade(u);
    const quizScores = [];
    
    html += '<tr><td><strong>' + (u.fullName || u.username) + '</strong></td>';
    COURSE_MODULES.forEach(m => {
      const score = u.quizScores ? u.quizScores[m.id] : null;
      if (score !== null && score !== undefined) quizScores.push(score);
      const color = score >= 80 ? 'var(--success)' : score ? 'var(--error)' : 'var(--charcoal-muted)';
      html += '<td style="text-align:center;color:' + color + ';font-size:12px;">' + (score !== null && score !== undefined ? score + '%' : '—') + '</td>';
    });
    
    const quizAvg = quizScores.length > 0 ? Math.round(quizScores.reduce((a,b)=>a+b,0)/quizScores.length) : 0;
    const scenarioGrades = (u.scenarioSubmissions || []).filter(s => s.grade !== null && s.grade !== undefined).map(s => s.grade);
    const scenarioAvg = scenarioGrades.length > 0 ? Math.round(scenarioGrades.reduce((a,b)=>a+b,0)/scenarioGrades.length) : null;
    
    html += '<td style="text-align:center;">' + (quizScores.length > 0 ? quizAvg + '%' : '—') + '</td>';
    html += '<td style="text-align:center;">' + (u.examPassed ? u.examScore + '%' : '—') + '</td>';
    html += '<td style="text-align:center;">' + (scenarioAvg !== null ? scenarioAvg + '%' : '—') + '</td>';
    html += '<td style="text-align:center;font-weight:700;">' + (grade.pct > 0 ? grade.pct + '%' : '—') + '</td>';
    html += '<td style="text-align:center;font-weight:700;font-size:1.1rem;color:' + getGradeColor(grade.letter) + '">' + grade.letter + '</td>';
    html += '</tr>';
  });
  
  html += '</tbody></table></div></div>';
  return html;
}

function renderAdminPlagiarismPage() {
  let html = '<div class="page-header fade-in"><h1>Plagiarism Detection</h1><p>Checks scenario responses for high similarity between students</p></div>';
  html += '<div style="margin-bottom:20px;"><button class="btn btn-secondary" onclick="navigate(\'admin\',{view:\'gradebook\'})"><i class="fa-solid fa-arrow-left"></i> Back to Gradebook</button></div>';
  html += renderPlagiarismReport();
  return html;
}

// Override admin shell to include gradebook nav
const _origRenderAdminShell = renderAdminShell;
window.renderAdminShell = function() {
  let html = _origRenderAdminShell();
  // Add gradebook button to admin nav
  html = html.replace('<span class="nav-user"><strong>Administrator</strong></span>', 
    '<button class="btn btn-ghost btn-sm" onclick="navigate(\'admin\',{view:\'gradebook\'})"><i class="fa-solid fa-table"></i> Gradebook</button> <span class="nav-user"><strong>Administrator</strong></span>');
  return html;
};
renderAdminShell = window.renderAdminShell;

// ===== ENROLLMENT CODE MANAGEMENT =====
function renderEnrollmentCodesPage() {
  let html = `
  <div class="page-header fade-in">
    <h1><i class="fa-solid fa-key"></i> Enrollment Codes</h1>
    <p>Manage the codes students need to register. Share a code with enrolled students only.</p>
  </div>
  <div style="margin-bottom:20px;">
    <button class="btn btn-secondary" onclick="navigate('admin')"><i class="fa-solid fa-arrow-left"></i> Back to Students</button>
  </div>`;

  html += `<div class="card slide-up"><div class="card-body">
    <h3 style="margin-bottom:12px;">Active Enrollment Codes</h3>
    <table class="admin-table"><thead><tr><th>Code</th><th>Status</th><th>Students Using This Code</th></tr></thead><tbody>`;

  const users = getUsers().filter(u => u.username !== 'admin');

  VALID_ENROLLMENT_CODES.forEach(code => {
    const usersWithCode = users.filter(u => u.enrollmentCode === code);
    html += `<tr>
      <td><strong style="font-family:monospace;font-size:1.1rem;letter-spacing:2px;color:var(--terracotta);">${code}</strong></td>
      <td><span class="badge badge-complete">Active</span></td>
      <td>${usersWithCode.length > 0 ? usersWithCode.map(u => u.fullName || u.username).join(', ') : '<span class="text-muted">None yet</span>'}</td>
    </tr>`;
  });

  html += `</tbody></table>
  </div></div>`;

  html += `<div class="card slide-up" style="margin-top:20px;"><div class="card-body">
    <h3 style="margin-bottom:8px;">How It Works</h3>
    <ol style="line-height:1.8;color:var(--charcoal-light);">
      <li>Share one of the codes above with your enrolled students (via email, text, or in person)</li>
      <li>Students go to the portal, click <strong>Register</strong>, and enter the code along with their info</li>
      <li>Without a valid code, no one can create an account</li>
      <li>You can see which students used which code in the table above</li>
    </ol>
    <div style="margin-top:16px;padding:12px 16px;background:var(--cream-dark);border-radius:8px;">
      <strong>To change codes:</strong> Edit the <code>VALID_ENROLLMENT_CODES</code> array in the portal's app.js file. You can add, remove, or change codes at any time. Students who already registered keep their access.
    </div>
  </div></div>`;

  return html;
}


// ===== ADMIN MODULE EDITOR =====
// In-memory cache of remote modules (loaded from backend) — used by the editor screens.
// If backend is not configured, we fall back to the COURSE_MODULES const from content.js.
let _adminModulesCache = null;

async function loadAdminModules(force = false) {
  if (!force && _adminModulesCache) return _adminModulesCache;
  if (API_BASE) {
    // Use the admin endpoint that returns ALL modules including unpublished
    // drafts. Falls back to the public endpoint if the admin one isn't
    // available (e.g. older backend or non-admin user).
    let data = await apiCall('/api/admin/modules-all');
    if (!data || data.error || !Array.isArray(data)) {
      data = await apiCall('/api/modules');
    }
    if (data && Array.isArray(data)) {
      // Hydrate each module with its sections
      const full = [];
      for (const m of data) {
        const detail = await apiCall(`/api/modules/${m.id}`);
        // detail may also be missing if module is unpublished and endpoint
        // is strict — fall back to the basic module row in that case
        if (detail && !detail.error) {
          // Make sure is_published from the list is preserved (detail may
          // overwrite it; keep both sources merged with detail winning)
          full.push({ ...m, ...detail });
        } else {
          full.push({ ...m, sections: [] });
        }
      }
      _adminModulesCache = full;
      return full;
    }
  }
  // Fallback to bundled content
  _adminModulesCache = (typeof COURSE_MODULES !== 'undefined' ? COURSE_MODULES : []).map(m => ({
    ...m,
    sections: (m.sections || []).filter(s => s.content !== null && s.content !== undefined)
  }));
  return _adminModulesCache;
}

// Extract the first week number from strings like "Week 1", "Weeks 2-3",
// "WEEKS 10–11", "Week 9". Modules with no parseable week sort to the end.
function extractFirstWeekNumber(m) {
  const s = String(m.week || m.subtitle || '').toLowerCase();
  const match = s.match(/week[s]?\s*(\d+)/i);
  if (match) return parseInt(match[1], 10);
  // Fallback: any leading number anywhere in the string
  const bare = s.match(/(\d+)/);
  if (bare) return parseInt(bare[1], 10);
  return Number.MAX_SAFE_INTEGER;
}

function renderModuleManager() {
  setTimeout(async () => {
    const modules = await loadAdminModules(true);
    const container = document.getElementById('module-manager-list');
    if (!container) return;
    if (!modules.length) {
      container.innerHTML = '<p class="text-muted">No modules yet. Click "Add New Module" to create one.</p>';
      return;
    }
    // Sort modules by assigned week number (Week 1 first, Week 12 last).
    // Modules with no week label fall to the bottom in their original order.
    const sortedModules = [...modules].sort((a, b) => {
      const wa = extractFirstWeekNumber(a);
      const wb = extractFirstWeekNumber(b);
      if (wa !== wb) return wa - wb;
      // Tiebreaker: numeric module id, then string compare
      const ia = Number(a.id), ib = Number(b.id);
      if (Number.isFinite(ia) && Number.isFinite(ib) && ia !== ib) return ia - ib;
      return String(a.id).localeCompare(String(b.id));
    });
    container.innerHTML = sortedModules.map((m, idx) => {
      const isDraft = m.is_published === false;
      return `
      <div class="card" style="margin-bottom:14px;${isDraft ? 'border-left:4px solid var(--warning);background:#fffaf3;' : ''}">
        <div class="card-body" style="display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;">
          <div style="flex:1;min-width:240px;">
            <div style="display:flex;align-items:center;gap:10px;margin-bottom:4px;flex-wrap:wrap;">
              <i class="fa-solid ${m.icon || 'fa-book'}" style="color:var(--terracotta);"></i>
              <strong style="font-size:1.05rem;">${escapeHtml(m.title)}</strong>
              <span class="badge ${isDraft ? 'badge-warning' : 'badge-complete'}" title="${isDraft ? 'Hidden from students' : 'Visible to students'}">
                <i class="fa-solid ${isDraft ? 'fa-eye-slash' : 'fa-eye'}"></i> ${isDraft ? 'Draft (hidden)' : 'Published'}
              </span>
            </div>
            <div class="text-muted" style="font-size:0.85rem;">${escapeHtml(m.week || m.subtitle || '')}</div>
            <div class="text-muted" style="font-size:0.8rem;margin-top:4px;">${(m.sections || []).length} section${(m.sections || []).length !== 1 ? 's' : ''}</div>
          </div>
          <div style="display:flex;gap:8px;flex-wrap:wrap;">
            ${isDraft ? `<button class="btn btn-primary btn-sm" onclick="quickTogglePublish('${m.id}', true)" title="Make visible to students"><i class="fa-solid fa-eye"></i> Publish</button>` : `<button class="btn btn-secondary btn-sm" onclick="quickTogglePublish('${m.id}', false)" title="Hide from students"><i class="fa-solid fa-eye-slash"></i> Unpublish</button>`}
            <button class="btn btn-secondary btn-sm" onclick="navigate('admin',{view:'editModule',moduleId:'${m.id}'})"><i class="fa-solid fa-pen"></i> Edit</button>
            <button class="btn btn-secondary btn-sm" onclick="deleteModuleConfirm('${m.id}', '${escapeAttr(m.title)}')"><i class="fa-solid fa-trash"></i> Delete</button>
          </div>
        </div>
      </div>
    `;
    }).join('');
  }, 50);

  return `
    <div class="page-header fade-in">
      <h1><i class="fa-solid fa-book-open"></i> Course Content Manager</h1>
      <p>Edit module titles, descriptions, sections, and add new modules.</p>
    </div>
    <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:20px;">
      <button class="btn btn-secondary" onclick="navigate('admin')"><i class="fa-solid fa-arrow-left"></i> Back</button>
      <button class="btn btn-primary" onclick="navigate('admin',{view:'newModule'})"><i class="fa-solid fa-plus"></i> Add New Module</button>
    </div>
    ${!API_BASE ? `
      <div class="card slide-up" style="margin-bottom:20px;border-left:4px solid var(--warning);">
        <div class="card-body">
          <strong><i class="fa-solid fa-info-circle"></i> Local editing mode</strong>
          <p style="margin-top:6px;color:var(--charcoal-light);font-size:0.9rem;">
            The backend isn't connected yet, so edits won't save to a shared database. To make edits persist across all students and devices, deploy the Railway backend and set <code>window.NUMA_API_BASE</code> in the portal.
          </p>
        </div>
      </div>` : ''}
    <div id="module-manager-list" class="slide-up">
      <p class="text-muted">Loading modules...</p>
    </div>
  `;
}

function renderModuleEditor(moduleId) {
  const isNew = !moduleId;
  setTimeout(async () => {
    if (isNew) {
      hydrateModuleForm(null);
      return;
    }
    const modules = await loadAdminModules();
    const m = modules.find(x => String(x.id) === String(moduleId));
    hydrateModuleForm(m);
  }, 50);

  return `
    <div class="page-header fade-in">
      <h1><i class="fa-solid fa-${isNew ? 'plus' : 'pen'}"></i> ${isNew ? 'New Module' : 'Edit Module'}</h1>
      <p>${isNew ? 'Create a new module of course content.' : 'Edit module details and manage sections.'}</p>
    </div>
    <div style="margin-bottom:20px;">
      <button class="btn btn-secondary" onclick="navigate('admin',{view:'modules'})"><i class="fa-solid fa-arrow-left"></i> Back to Modules</button>
    </div>

    <div class="card slide-up"><div class="card-body">
      <h3 style="margin-bottom:14px;">Module Details</h3>
      <div class="form-group">
        <label>Module ID <span class="text-muted">(short identifier, no spaces — e.g. "8" or "advanced")</span></label>
        <input type="text" id="mod-id" class="form-control" ${isNew ? '' : 'readonly'} placeholder="e.g. 8">
      </div>
      <div class="form-group">
        <label>Title</label>
        <input type="text" id="mod-title" class="form-control" placeholder="e.g. Advanced Reformer Techniques">
      </div>
      <div class="form-group">
        <label>Subtitle / Week label</label>
        <input type="text" id="mod-subtitle" class="form-control" placeholder="e.g. Week 8-9">
      </div>
      <div class="form-group">
        <label>Description</label>
        <textarea id="mod-description" class="form-control" rows="3" placeholder="Brief description of this module"></textarea>
      </div>
      <div class="form-group">
        <label>Icon (Font Awesome class)</label>
        <input type="text" id="mod-icon" class="form-control" placeholder="e.g. fa-dumbbell" value="fa-book">
        <small class="text-muted">Browse icons at fontawesome.com/icons</small>
      </div>
      <div class="form-group">
        <label><input type="checkbox" id="mod-published" checked> Published (visible to students)</label>
      </div>
      <div style="display:flex;gap:10px;">
        <button class="btn btn-primary" onclick="saveModule('${moduleId || ''}', ${isNew})"><i class="fa-solid fa-floppy-disk"></i> ${isNew ? 'Create Module' : 'Save Changes'}</button>
      </div>
      <div id="module-save-status" style="margin-top:12px;"></div>
    </div></div>

    ${isNew ? '' : `
    <div class="card slide-up" style="margin-top:20px;"><div class="card-body">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;flex-wrap:wrap;gap:10px;">
        <h3 style="margin:0;">Sections</h3>
        <button class="btn btn-primary btn-sm" onclick="navigate('admin',{view:'newSection',moduleId:'${moduleId}'})"><i class="fa-solid fa-plus"></i> Add Section</button>
      </div>
      <div id="sections-list"><p class="text-muted">Loading sections...</p></div>
    </div></div>

    <div class="card slide-up" style="margin-top:20px;"><div class="card-body">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;flex-wrap:wrap;gap:10px;">
        <h3 style="margin:0;"><i class="fa-solid fa-question-circle"></i> Module-End Quiz</h3>
        <button class="btn btn-primary btn-sm" onclick="navigate('admin',{view:'editModuleQuiz',moduleId:'${moduleId}'})"><i class="fa-solid fa-pen"></i> Edit Questions &amp; Answers</button>
      </div>
      <p class="text-muted" style="margin:0;">The required quiz students take at the end of this module (80% to pass). Edit individual questions, answer choices, and correct answers.</p>
    </div></div>

    <div class="card slide-up" style="margin-top:20px;"><div class="card-body">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;flex-wrap:wrap;gap:10px;">
        <h3 style="margin:0;"><i class="fa-solid fa-video"></i> Module-End Homework</h3>
        <button class="btn btn-primary btn-sm" onclick="navigate('admin',{view:'moduleHomework',moduleId:'${moduleId}'})"><i class="fa-solid fa-pen"></i> Edit Homework &amp; View Submissions</button>
      </div>
      <p class="text-muted" style="margin:0;">Assign a video-upload homework at the end of this module. Mark it required or optional, then review and comment on each student's video.</p>
    </div></div>
    `}
  `;
}

function hydrateModuleForm(m) {
  if (!m) {
    // New module — leave blank
    document.getElementById('mod-id').value = '';
    document.getElementById('mod-title').value = '';
    document.getElementById('mod-subtitle').value = '';
    document.getElementById('mod-description').value = '';
    document.getElementById('mod-icon').value = 'fa-book';
    document.getElementById('mod-published').checked = true;
    return;
  }
  document.getElementById('mod-id').value = m.id;
  document.getElementById('mod-title').value = m.title || '';
  document.getElementById('mod-subtitle').value = m.subtitle || m.week || '';
  document.getElementById('mod-description').value = m.description || '';
  document.getElementById('mod-icon').value = m.icon || 'fa-book';
  document.getElementById('mod-published').checked = m.is_published !== false;

  const list = document.getElementById('sections-list');
  if (list) {
    renderSortableSections(m, list);
  }
}

// Module-level state for tracking the current section order (used during drag/arrow ops)
let _currentSectionOrder = { moduleId: null, ids: [] };

function renderSortableSections(m, container) {
  const sections = (m.sections || []);
  _currentSectionOrder = { moduleId: m.id, ids: sections.map(s => String(s.id)) };
  if (!sections.length) {
    container.innerHTML = '<p class="text-muted">No sections yet. Click "Add Section" to create one.</p>';
    return;
  }
  container.innerHTML = `
    <div style="margin-bottom:10px;padding:8px 12px;background:var(--cream-dark);border-radius:6px;font-size:0.85rem;color:var(--charcoal-light);">
      <i class="fa-solid fa-arrows-up-down"></i> Drag rows to reorder, or use the arrow buttons. Changes save automatically.
    </div>
    <div id="sortable-sections">
      ${sections.map((s, idx) => sortableSectionRow(s, idx, sections.length, m.id)).join('')}
    </div>
    <div id="reorder-status" style="margin-top:10px;"></div>
  `;
  attachSortableHandlers(m.id);
  // Async: decorate each row with a 'has quiz' badge
  hydrateSectionQuizBadges().catch(e => console.warn('[quiz badges]', e));
}

function sortableSectionRow(s, idx, total, moduleId) {
  // Quiz badge: filled in by hydrateSectionQuizBadges() after render
  const sid = String(s.id);
  return `
    <div class="sortable-row" draggable="true" data-section-id="${escapeAttr(s.id)}" data-module-id="${escapeAttr(moduleId)}"
         style="padding:12px;border:1px solid var(--cream-darker);border-radius:8px;margin-bottom:8px;display:flex;align-items:center;gap:10px;flex-wrap:wrap;background:#fff;cursor:move;transition:all 0.15s;">
      <div style="color:var(--charcoal-light);cursor:grab;padding:0 6px;" title="Drag to reorder"><i class="fa-solid fa-grip-vertical"></i></div>
      <div class="section-index" style="width:28px;height:28px;border-radius:50%;background:var(--terracotta);color:#fff;display:flex;align-items:center;justify-content:center;font-weight:600;font-size:0.85rem;flex-shrink:0;">${idx + 1}</div>
      <div style="flex:1;min-width:200px;">
        <strong>${escapeHtml(s.title)}</strong>
        <div class="text-muted" style="font-size:0.8rem;">
          ${(s.content || '').length} characters
          <span class="section-quiz-badge" data-section-id="${escapeAttr(sid)}" style="margin-left:8px;"></span>
        </div>
      </div>
      <div style="display:flex;gap:4px;flex-wrap:wrap;">
        <button class="btn btn-ghost btn-sm" onclick="moveSectionArrow('${escapeAttr(moduleId)}','${escapeAttr(s.id)}',-1)" ${idx === 0 ? 'disabled style="opacity:0.3;"' : ''} title="Move up"><i class="fa-solid fa-arrow-up"></i></button>
        <button class="btn btn-ghost btn-sm" onclick="moveSectionArrow('${escapeAttr(moduleId)}','${escapeAttr(s.id)}',1)" ${idx === total - 1 ? 'disabled style="opacity:0.3;"' : ''} title="Move down"><i class="fa-solid fa-arrow-down"></i></button>
        <button class="btn btn-secondary btn-sm" onclick="navigate('admin',{view:'editSection',moduleId:'${escapeAttr(moduleId)}',sectionId:'${escapeAttr(s.id)}'})"><i class="fa-solid fa-pen"></i> Edit</button>
        <button class="btn btn-secondary btn-sm" onclick="navigate('admin',{view:'section-quiz',moduleId:'${escapeAttr(moduleId)}',sectionId:'${escapeAttr(s.id)}'})" title="Add or edit the quiz at the end of this section"><i class="fa-solid fa-circle-question"></i> Quiz</button>
        <button class="btn btn-secondary btn-sm" onclick="deleteSectionConfirm('${escapeAttr(s.id)}','${escapeAttr(s.title)}','${escapeAttr(moduleId)}')"><i class="fa-solid fa-trash"></i></button>
      </div>
    </div>
  `;
}

// Decorate section rows with a 'Has quiz' / 'No quiz' badge
async function hydrateSectionQuizBadges() {
  if (!API_BASE) return;
  const summary = await apiCall('/api/admin/section-quizzes-summary');
  const map = {};
  if (Array.isArray(summary)) {
    summary.forEach(s => { map[String(s.section_id)] = s; });
  }
  document.querySelectorAll('.section-quiz-badge').forEach(el => {
    const sid = el.getAttribute('data-section-id');
    const q = map[sid];
    if (q && q.question_count > 0) {
      const required = q.is_optional === false;
      const color = required ? '#2e7d32' : '#8d6e63';
      const label = required ? 'Required quiz' : 'Optional quiz';
      el.innerHTML = `<span style="display:inline-block;padding:2px 8px;border-radius:10px;background:${color};color:#fff;font-size:11px;font-weight:600;"><i class="fa-solid fa-circle-check"></i> ${label} \u00b7 ${q.question_count} Q</span>`;
    } else {
      el.innerHTML = `<span style="display:inline-block;padding:2px 8px;border-radius:10px;background:#eee;color:#777;font-size:11px;">No quiz yet</span>`;
    }
  });
}

function attachSortableHandlers(moduleId) {
  const container = document.getElementById('sortable-sections');
  if (!container) return;
  let draggedEl = null;

  container.querySelectorAll('.sortable-row').forEach(row => {
    row.addEventListener('dragstart', (e) => {
      draggedEl = row;
      row.style.opacity = '0.4';
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', row.dataset.sectionId);
    });
    row.addEventListener('dragend', () => {
      row.style.opacity = '1';
      container.querySelectorAll('.sortable-row').forEach(r => r.style.borderColor = 'var(--cream-darker)');
      draggedEl = null;
    });
    row.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      if (row === draggedEl) return;
      row.style.borderColor = 'var(--terracotta)';
    });
    row.addEventListener('dragleave', () => {
      row.style.borderColor = 'var(--cream-darker)';
    });
    row.addEventListener('drop', (e) => {
      e.preventDefault();
      if (!draggedEl || row === draggedEl) return;
      const rows = Array.from(container.querySelectorAll('.sortable-row'));
      const draggedIdx = rows.indexOf(draggedEl);
      const targetIdx = rows.indexOf(row);
      if (draggedIdx < targetIdx) {
        row.parentNode.insertBefore(draggedEl, row.nextSibling);
      } else {
        row.parentNode.insertBefore(draggedEl, row);
      }
      commitSectionOrder(moduleId);
    });
  });
}

function commitSectionOrder(moduleId) {
  const container = document.getElementById('sortable-sections');
  if (!container) return;
  const rows = Array.from(container.querySelectorAll('.sortable-row'));
  const newIds = rows.map(r => r.dataset.sectionId);
  // Renumber the visible badges
  rows.forEach((r, i) => {
    const badge = r.querySelector('.section-index');
    if (badge) badge.textContent = String(i + 1);
    // Toggle arrow disabled states
    const ups = r.querySelectorAll('.fa-arrow-up');
    const downs = r.querySelectorAll('.fa-arrow-down');
    ups.forEach(u => {
      const btn = u.closest('button');
      if (i === 0) { btn.setAttribute('disabled', ''); btn.style.opacity = '0.3'; }
      else { btn.removeAttribute('disabled'); btn.style.opacity = ''; }
    });
    downs.forEach(d => {
      const btn = d.closest('button');
      if (i === rows.length - 1) { btn.setAttribute('disabled', ''); btn.style.opacity = '0.3'; }
      else { btn.removeAttribute('disabled'); btn.style.opacity = ''; }
    });
  });
  _currentSectionOrder = { moduleId, ids: newIds };
  saveSectionOrder(moduleId, newIds);
}

async function saveSectionOrder(moduleId, sectionIds) {
  const statusEl = document.getElementById('reorder-status');
  if (statusEl) statusEl.innerHTML = '<span class="text-muted"><i class="fa-solid fa-arrows-rotate fa-spin"></i> Saving new order…</span>';
  if (!API_BASE) {
    if (statusEl) statusEl.innerHTML = '<span style="color:var(--warning);">Reordering needs the backend connected.</span>';
    return;
  }
  if (!Array.isArray(sectionIds) || sectionIds.length === 0) {
    if (statusEl) statusEl.innerHTML = '<span style="color:var(--error);">No section IDs to save. Refresh and try again.</span>';
    console.error('saveSectionOrder called with empty/invalid sectionIds', sectionIds);
    return;
  }
  // Filter out any null/undefined/empty IDs (defensive)
  const cleanIds = sectionIds.filter(id => id != null && String(id).trim() !== '');
  if (cleanIds.length !== sectionIds.length) {
    console.warn('Some section IDs were empty:', sectionIds);
  }
  console.log('[reorder] PUT /api/admin/modules/' + moduleId + '/reorder-sections', cleanIds);
  const result = await apiCall(`/api/admin/modules/${moduleId}/reorder-sections`, {
    method: 'PUT',
    body: JSON.stringify({ section_ids: cleanIds })
  });
  console.log('[reorder] response:', result);
  if (result && result.ok) {
    if (statusEl) statusEl.innerHTML = '<span style="color:var(--success);"><i class="fa-solid fa-check"></i> Order saved.</span>';
    _adminModulesCache = null;
    setTimeout(() => { if (statusEl) statusEl.innerHTML = ''; }, 2000);
  } else {
    // Surface the actual error message from the backend (since apiCall now
    // returns {error, _httpStatus} on 4xx/5xx instead of null)
    const msg = (result && result.error) ? result.error : (result === null ? 'Network error — backend unreachable' : 'Unknown response');
    const status = (result && result._httpStatus) ? ' (HTTP ' + result._httpStatus + ')' : '';
    if (statusEl) statusEl.innerHTML = `<span style="color:var(--error);">Save failed: ${escapeHtml(msg)}${status}. Check the console for details.</span>`;
    console.error('[reorder] failed', { result, sectionIds: cleanIds, moduleId });
  }
}

function moveSectionArrow(moduleId, sectionId, direction) {
  const container = document.getElementById('sortable-sections');
  if (!container) return;
  const rows = Array.from(container.querySelectorAll('.sortable-row'));
  const idx = rows.findIndex(r => r.dataset.sectionId === String(sectionId));
  if (idx === -1) return;
  const newIdx = idx + direction;
  if (newIdx < 0 || newIdx >= rows.length) return;
  const moving = rows[idx];
  const target = rows[newIdx];
  if (direction > 0) {
    target.parentNode.insertBefore(moving, target.nextSibling);
  } else {
    target.parentNode.insertBefore(moving, target);
  }
  commitSectionOrder(moduleId);
}

async function saveModule(moduleId, isNew) {
  const statusEl = document.getElementById('module-save-status');
  statusEl.innerHTML = '<span class="text-muted">Saving...</span>';

  const payload = {
    id: document.getElementById('mod-id').value.trim(),
    title: document.getElementById('mod-title').value.trim(),
    subtitle: document.getElementById('mod-subtitle').value.trim(),
    description: document.getElementById('mod-description').value.trim(),
    icon: document.getElementById('mod-icon').value.trim() || 'fa-book',
    is_published: document.getElementById('mod-published').checked,
    sort_order: 99
  };
  if (!payload.title || !payload.id) {
    statusEl.innerHTML = '<span style="color:var(--error);">Title and ID are required.</span>';
    return;
  }

  if (API_BASE) {
    const result = isNew
      ? await apiCall('/api/admin/modules', { method: 'POST', body: JSON.stringify(payload) })
      : await apiCall(`/api/admin/modules/${moduleId}`, { method: 'PUT', body: JSON.stringify(payload) });
    if (result) {
      statusEl.innerHTML = '<span style="color:var(--success);"><i class="fa-solid fa-check"></i> Saved.</span>';
      _adminModulesCache = null;
      setTimeout(() => navigate('admin', { view: 'editModule', moduleId: payload.id }), 600);
      return;
    }
    statusEl.innerHTML = '<span style="color:var(--error);">Failed to save. Check the backend connection.</span>';
    return;
  }
  statusEl.innerHTML = '<span style="color:var(--warning);">Backend not configured — changes are local-only.</span>';
}

async function deleteModuleConfirm(moduleId, title) {
  if (!confirm(`Delete module "${title}" and all its sections? This cannot be undone.`)) return;
  if (API_BASE) {
    await apiCall(`/api/admin/modules/${moduleId}`, { method: 'DELETE' });
    _adminModulesCache = null;
  }
  navigate('admin', { view: 'modules' });
}

function renderSectionEditor(moduleId, sectionId) {
  const isNew = !sectionId;
  setTimeout(async () => {
    const modules = await loadAdminModules();
    const m = modules.find(x => String(x.id) === String(moduleId));
    if (!m) return;
    const editor = document.getElementById('sec-content-rich');
    if (isNew) {
      document.getElementById('sec-id').value = `${moduleId}-${(m.sections || []).length + 1}`;
      document.getElementById('sec-title').value = '';
      if (editor) editor.innerHTML = '<p>Start typing here…</p>';
      return;
    }
    const s = (m.sections || []).find(x => String(x.id) === String(sectionId));
    if (s) {
      document.getElementById('sec-id').value = s.id;
      document.getElementById('sec-title').value = s.title || '';
      if (editor) editor.innerHTML = s.content || '<p></p>';
    }
  }, 50);

  return `
    <div class="page-header fade-in">
      <h1><i class="fa-solid fa-${isNew ? 'plus' : 'pen'}"></i> ${isNew ? 'New Section' : 'Edit Section'}</h1>
      <p>Module ${escapeHtml(moduleId)}</p>
    </div>
    <div style="margin-bottom:20px;display:flex;gap:8px;flex-wrap:wrap;">
      <button class="btn btn-secondary" onclick="navigate('admin',{view:'editModule',moduleId:'${moduleId}'})"><i class="fa-solid fa-arrow-left"></i> Back to Module</button>
      ${isNew ? '' : `<button class="btn btn-primary" onclick="navigate('admin',{view:'section-quiz',moduleId:'${moduleId}',sectionId:'${sectionId}'})"><i class="fa-solid fa-circle-question"></i> Edit End-of-Section Quiz</button>`}
    </div>

    <div class="card slide-up"><div class="card-body">
      <div class="form-group">
        <label>Section ID</label>
        <input type="text" id="sec-id" class="form-control" ${isNew ? '' : 'readonly'} placeholder="e.g. 8-1">
      </div>
      <div class="form-group">
        <label>Title</label>
        <input type="text" id="sec-title" class="form-control" placeholder="e.g. Introduction to Springs">
      </div>
      <div class="form-group">
        <label>Lesson Content</label>
        ${renderRichEditorToolbar()}
        <div id="sec-content-rich" class="rich-editor" contenteditable="true"
             style="min-height:400px;border:1px solid var(--cream-darker);border-top:none;border-radius:0 0 8px 8px;padding:20px;background:#fff;line-height:1.7;font-family:'Work Sans',sans-serif;font-size:15px;outline:none;overflow-y:auto;max-height:600px;">
          <p>Start typing here…</p>
        </div>
        <input type="file" id="sec-image-upload" accept="image/*" style="display:none;" onchange="handleImageUpload(this)">
        <small class="text-muted" style="display:block;margin-top:8px;">Tip: Highlight text and use the toolbar to format. Click the image button to upload from your computer.</small>
      </div>
      <div style="display:flex;gap:10px;flex-wrap:wrap;">
        <button class="btn btn-primary" onclick="saveSection('${moduleId}','${sectionId || ''}', ${isNew})"><i class="fa-solid fa-floppy-disk"></i> ${isNew ? 'Create Section' : 'Save Changes'}</button>
        <button class="btn btn-secondary" onclick="previewSection()"><i class="fa-solid fa-eye"></i> Preview</button>
        <button class="btn btn-ghost" onclick="toggleHtmlSource()"><i class="fa-solid fa-code"></i> Toggle HTML</button>
      </div>
      <div id="section-save-status" style="margin-top:12px;"></div>
      <div id="section-preview" style="margin-top:20px;display:none;border-top:1px solid var(--cream-darker);padding-top:20px;"></div>
      <textarea id="sec-content-html" class="form-control" rows="15" style="display:none;margin-top:12px;font-family:monospace;font-size:0.9rem;"></textarea>
    </div></div>
  `;
}

function renderRichEditorToolbar() {
  return `
    <div class="rich-toolbar" style="display:flex;flex-wrap:wrap;gap:4px;padding:10px;background:var(--cream-dark);border:1px solid var(--cream-darker);border-radius:8px 8px 0 0;align-items:center;">
      <select onchange="richExec('formatBlock', this.value); this.value='';" style="padding:6px;border-radius:6px;border:1px solid var(--cream-darker);background:#fff;cursor:pointer;">
        <option value="">Format…</option>
        <option value="<h2>">Heading 1</option>
        <option value="<h3>">Heading 2</option>
        <option value="<h4>">Heading 3</option>
        <option value="<p>">Paragraph</option>
        <option value="<blockquote>">Quote</option>
      </select>
      <select onchange="richExec('fontName', this.value); this.value='';" style="padding:6px;border-radius:6px;border:1px solid var(--cream-darker);background:#fff;cursor:pointer;">
        <option value="">Font…</option>
        <option value="Work Sans">Work Sans (body)</option>
        <option value="Cormorant Garamond">Cormorant (display)</option>
        <option value="Georgia">Georgia</option>
        <option value="Arial">Arial</option>
        <option value="Helvetica">Helvetica</option>
        <option value="Courier New">Courier New</option>
      </select>
      <select onchange="richExec('fontSize', this.value); this.value='';" style="padding:6px;border-radius:6px;border:1px solid var(--cream-darker);background:#fff;cursor:pointer;">
        <option value="">Size…</option>
        <option value="2">Small</option>
        <option value="3">Normal</option>
        <option value="4">Medium</option>
        <option value="5">Large</option>
        <option value="6">X-Large</option>
        <option value="7">Huge</option>
      </select>
      <span style="width:1px;height:24px;background:var(--cream-darker);margin:0 4px;"></span>
      <button type="button" class="rt-btn" onclick="richExec('bold')" title="Bold"><i class="fa-solid fa-bold"></i></button>
      <button type="button" class="rt-btn" onclick="richExec('italic')" title="Italic"><i class="fa-solid fa-italic"></i></button>
      <button type="button" class="rt-btn" onclick="richExec('underline')" title="Underline"><i class="fa-solid fa-underline"></i></button>
      <button type="button" class="rt-btn" onclick="richExec('strikeThrough')" title="Strikethrough"><i class="fa-solid fa-strikethrough"></i></button>
      <span style="width:1px;height:24px;background:var(--cream-darker);margin:0 4px;"></span>
      <button type="button" class="rt-btn" onclick="richExec('justifyLeft')" title="Align left"><i class="fa-solid fa-align-left"></i></button>
      <button type="button" class="rt-btn" onclick="richExec('justifyCenter')" title="Center"><i class="fa-solid fa-align-center"></i></button>
      <button type="button" class="rt-btn" onclick="richExec('justifyRight')" title="Align right"><i class="fa-solid fa-align-right"></i></button>
      <button type="button" class="rt-btn" onclick="richExec('justifyFull')" title="Justify"><i class="fa-solid fa-align-justify"></i></button>
      <span style="width:1px;height:24px;background:var(--cream-darker);margin:0 4px;"></span>
      <button type="button" class="rt-btn" onclick="richExec('insertUnorderedList')" title="Bulleted list"><i class="fa-solid fa-list-ul"></i></button>
      <button type="button" class="rt-btn" onclick="richExec('insertOrderedList')" title="Numbered list"><i class="fa-solid fa-list-ol"></i></button>
      <button type="button" class="rt-btn" onclick="richExec('outdent')" title="Decrease indent"><i class="fa-solid fa-outdent"></i></button>
      <button type="button" class="rt-btn" onclick="richExec('indent')" title="Increase indent"><i class="fa-solid fa-indent"></i></button>
      <span style="width:1px;height:24px;background:var(--cream-darker);margin:0 4px;"></span>
      <input type="color" onchange="richExec('foreColor', this.value)" title="Text color" style="width:32px;height:32px;border:none;background:none;cursor:pointer;padding:0;">
      <button type="button" class="rt-btn" onclick="insertLink()" title="Link"><i class="fa-solid fa-link"></i></button>
      <button type="button" class="rt-btn" onclick="document.getElementById('sec-image-upload').click()" title="Upload image"><i class="fa-solid fa-image"></i></button>
      <button type="button" class="rt-btn" onclick="insertYoutubeEmbed()" title="Embed YouTube video"><i class="fa-brands fa-youtube" style="color:#c4302b;"></i></button>
      <span style="width:1px;height:24px;background:var(--cream-darker);margin:0 4px;"></span>
      <button type="button" class="rt-btn" onclick="richExec('removeFormat')" title="Clear formatting"><i class="fa-solid fa-eraser"></i></button>
      <button type="button" class="rt-btn" onclick="richExec('undo')" title="Undo"><i class="fa-solid fa-rotate-left"></i></button>
      <button type="button" class="rt-btn" onclick="richExec('redo')" title="Redo"><i class="fa-solid fa-rotate-right"></i></button>
    </div>
  `;
}

function richExec(command, value) {
  const editor = document.getElementById('sec-content-rich');
  if (editor) editor.focus();
  try {
    document.execCommand(command, false, value || null);
  } catch (e) {
    console.warn('Editor command failed:', e);
  }
}

function insertLink() {
  const url = prompt('Enter the URL (include https://):');
  if (url) richExec('createLink', url);
}

function insertYoutubeEmbed() {
  const url = prompt('Paste a YouTube URL (e.g. https://youtu.be/abc123 or https://youtube.com/watch?v=abc123):');
  if (!url) return;
  let videoId = null;
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) { videoId = m[1]; break; }
  }
  if (!videoId) { alert('Could not detect a YouTube video ID in that URL.'); return; }
  const embed = `<div class="video-wrap" style="position:relative;padding-bottom:56.25%;height:0;margin:20px 0;border-radius:8px;overflow:hidden;"><iframe src="https://www.youtube.com/embed/${videoId}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen style="position:absolute;top:0;left:0;width:100%;height:100%;"></iframe></div>`;
  const editor = document.getElementById('sec-content-rich');
  editor.focus();
  document.execCommand('insertHTML', false, embed + '<p></p>');
}

async function handleImageUpload(input) {
  const file = input.files && input.files[0];
  if (!file) return;
  const editor = document.getElementById('sec-content-rich');
  if (!editor) return;
  if (!API_BASE) {
    alert('Image upload needs the backend connected. Add window.NUMA_API_BASE to your site.');
    input.value = '';
    return;
  }
  const placeholder = `<p><em>Uploading ${escapeHtml(file.name)}…</em></p>`;
  editor.focus();
  document.execCommand('insertHTML', false, placeholder);
  try {
    const fd = new FormData();
    fd.append('file', file);
    const token = localStorage.getItem('numa_token');
    const res = await fetch(`${API_BASE}/api/admin/upload`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: fd
    });
    const data = await res.json();
    if (!res.ok || !data.url) throw new Error(data.error || 'Upload failed');
    let imgUrl = data.absoluteUrl || (API_BASE + data.url);
    // Force HTTPS — browsers block mixed content on HTTPS pages.
    if (imgUrl.startsWith('http://')) imgUrl = imgUrl.replace(/^http:\/\//, 'https://');
    // Replace placeholder with real image
    editor.innerHTML = editor.innerHTML.replace(placeholder, `<p><img src="${imgUrl}" alt="${escapeAttr(file.name)}" style="max-width:100%;height:auto;border-radius:8px;display:block;margin:16px auto;"></p>`);
  } catch (err) {
    editor.innerHTML = editor.innerHTML.replace(placeholder, `<p style="color:#c00;"><em>Upload failed: ${escapeHtml(err.message || 'unknown error')}</em></p>`);
  }
  input.value = '';
}

function toggleHtmlSource() {
  const rich = document.getElementById('sec-content-rich');
  const html = document.getElementById('sec-content-html');
  if (!rich || !html) return;
  if (html.style.display === 'none') {
    html.value = rich.innerHTML;
    html.style.display = 'block';
    rich.style.display = 'none';
  } else {
    rich.innerHTML = html.value;
    html.style.display = 'none';
    rich.style.display = 'block';
  }
}

async function saveSection(moduleId, sectionId, isNew) {
  const statusEl = document.getElementById('section-save-status');
  statusEl.innerHTML = '<span class="text-muted">Saving...</span>';

  // Pull content from whichever view is active (rich vs raw HTML)
  const rich = document.getElementById('sec-content-rich');
  const html = document.getElementById('sec-content-html');
  let content = '';
  if (html && html.style.display !== 'none') content = html.value;
  else if (rich) content = rich.innerHTML;

  const payload = {
    id: document.getElementById('sec-id').value.trim(),
    module_id: moduleId,
    title: document.getElementById('sec-title').value.trim(),
    content,
    sort_order: 99
  };
  if (!payload.title || !payload.id) {
    statusEl.innerHTML = '<span style="color:var(--error);">Title and ID are required.</span>';
    return;
  }

  if (API_BASE) {
    const result = isNew
      ? await apiCall('/api/admin/sections', { method: 'POST', body: JSON.stringify(payload) })
      : await apiCall(`/api/admin/sections/${sectionId}`, { method: 'PUT', body: JSON.stringify(payload) });
    if (result) {
      statusEl.innerHTML = '<span style="color:var(--success);"><i class="fa-solid fa-check"></i> Saved.</span>';
      _adminModulesCache = null;
      setTimeout(() => navigate('admin', { view: 'editModule', moduleId }), 600);
      return;
    }
    statusEl.innerHTML = '<span style="color:var(--error);">Failed to save.</span>';
    return;
  }
  statusEl.innerHTML = '<span style="color:var(--warning);">Backend not configured — changes are local-only.</span>';
}

async function deleteSectionConfirm(sectionId, title, moduleId) {
  if (!confirm(`Delete section "${title}"? This cannot be undone.`)) return;
  if (API_BASE) {
    await apiCall(`/api/admin/sections/${sectionId}`, { method: 'DELETE' });
    _adminModulesCache = null;
  }
  navigate('admin', { view: 'editModule', moduleId });
}

function previewSection() {
  const rich = document.getElementById('sec-content-rich');
  const html = document.getElementById('sec-content-html');
  let content = '';
  if (html && html.style.display !== 'none') content = html.value;
  else if (rich) content = rich.innerHTML;
  const previewEl = document.getElementById('section-preview');
  if (!previewEl) return;
  previewEl.style.display = 'block';
  previewEl.innerHTML = `<h4 style="margin-bottom:14px;color:var(--terracotta);">Preview</h4><div class="content-area">${content}</div>`;
}

function escapeHtml(s) {
  if (s === null || s === undefined) return '';
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}
function escapeAttr(s) {
  return escapeHtml(s).replace(/'/g, "\\'");
}

// ===== ACCOUNT SETTINGS PAGE =====
function renderAccountSettings() {
  const u = APP.currentUser;
  if (!u) return '<p>Please log in.</p>';
  const isAdmin = u.role === 'admin' || u.username === 'admin';
  return `
    <div class="page-header fade-in">
      <h1><i class="fa-solid fa-user-gear"></i> Account Settings</h1>
      <p>Update your profile and password</p>
    </div>
    <div style="max-width:640px;">
      <div class="card slide-up"><div class="card-body">
        <h3 style="margin-bottom:16px;">Profile</h3>
        <div class="form-group">
          <label>Username</label>
          <input type="text" class="form-control" value="${escapeAttr(u.username)}" readonly style="opacity:0.6;">
          <small class="text-muted">Username cannot be changed.</small>
        </div>
        <div class="form-group">
          <label>Full Name</label>
          <input type="text" id="acct-name" class="form-control" value="${escapeAttr(u.fullName || u.full_name || '')}">
        </div>
        <div class="form-group">
          <label>Email</label>
          <input type="email" id="acct-email" class="form-control" value="${escapeAttr(u.email || '')}">
        </div>
        <button class="btn btn-primary" onclick="saveAccountProfile()"><i class="fa-solid fa-floppy-disk"></i> Save Profile</button>
        <div id="acct-profile-status" style="margin-top:12px;"></div>
      </div></div>

      <div class="card slide-up" style="margin-top:20px;"><div class="card-body">
        <h3 style="margin-bottom:16px;">Change Password</h3>
        <div class="form-group">
          <label>Current Password</label>
          <input type="password" id="acct-pw-current" class="form-control" autocomplete="current-password">
        </div>
        <div class="form-group">
          <label>New Password <span class="text-muted">(at least 6 characters)</span></label>
          <input type="password" id="acct-pw-new" class="form-control" autocomplete="new-password">
        </div>
        <div class="form-group">
          <label>Confirm New Password</label>
          <input type="password" id="acct-pw-confirm" class="form-control" autocomplete="new-password">
        </div>
        <button class="btn btn-primary" onclick="saveAccountPassword()"><i class="fa-solid fa-lock"></i> Change Password</button>
        <div id="acct-pw-status" style="margin-top:12px;"></div>
      </div></div>

      ${!isAdmin ? `
      <div class="card slide-up" style="margin-top:20px;background:var(--cream-dark);"><div class="card-body">
        <h4 style="margin-bottom:8px;"><i class="fa-solid fa-circle-info"></i> Forgot your password?</h4>
        <p style="margin:0;color:var(--charcoal-light);">If you forget your password, contact your studio admin and they can reset it for you.</p>
      </div></div>
      ` : ''}
    </div>
  `;
}

async function saveAccountProfile() {
  const statusEl = document.getElementById('acct-profile-status');
  const fullName = document.getElementById('acct-name').value.trim();
  const email = document.getElementById('acct-email').value.trim();
  if (!fullName || !email) {
    statusEl.innerHTML = '<span style="color:var(--error);">Name and email are required.</span>';
    return;
  }
  statusEl.innerHTML = '<span class="text-muted">Saving...</span>';
  if (API_BASE) {
    const result = await apiCall('/api/auth/me', { method: 'PUT', body: JSON.stringify({ full_name: fullName, email }) });
    if (result) {
      APP.currentUser.fullName = fullName;
      APP.currentUser.full_name = fullName;
      APP.currentUser.email = email;
      saveUserData(APP.currentUser);
      statusEl.innerHTML = '<span style="color:var(--success);"><i class="fa-solid fa-check"></i> Profile saved.</span>';
      setTimeout(() => render(), 800);
      return;
    }
    statusEl.innerHTML = '<span style="color:var(--error);">Save failed. Try again.</span>';
    return;
  }
  // Local fallback
  APP.currentUser.fullName = fullName;
  APP.currentUser.email = email;
  saveUserData(APP.currentUser);
  statusEl.innerHTML = '<span style="color:var(--success);"><i class="fa-solid fa-check"></i> Saved locally.</span>';
  setTimeout(() => render(), 800);
}

async function saveAccountPassword() {
  const statusEl = document.getElementById('acct-pw-status');
  const current = document.getElementById('acct-pw-current').value;
  const next = document.getElementById('acct-pw-new').value;
  const confirm = document.getElementById('acct-pw-confirm').value;
  if (!current || !next) {
    statusEl.innerHTML = '<span style="color:var(--error);">Both current and new password are required.</span>';
    return;
  }
  if (next.length < 6) {
    statusEl.innerHTML = '<span style="color:var(--error);">New password must be at least 6 characters.</span>';
    return;
  }
  if (next !== confirm) {
    statusEl.innerHTML = '<span style="color:var(--error);">New password and confirmation do not match.</span>';
    return;
  }
  statusEl.innerHTML = '<span class="text-muted">Updating...</span>';
  if (API_BASE) {
    const result = await apiCall('/api/auth/password', { method: 'PUT', body: JSON.stringify({ current_password: current, new_password: next }) });
    if (result && result.ok) {
      statusEl.innerHTML = '<span style="color:var(--success);"><i class="fa-solid fa-check"></i> Password updated. Use the new password next time you sign in.</span>';
      document.getElementById('acct-pw-current').value = '';
      document.getElementById('acct-pw-new').value = '';
      document.getElementById('acct-pw-confirm').value = '';
      return;
    }
    statusEl.innerHTML = '<span style="color:var(--error);">Could not change password. Check your current password.</span>';
    return;
  }
  statusEl.innerHTML = '<span style="color:var(--warning);">Password change requires the backend to be connected.</span>';
}

// ===== ADMIN: RESET STUDENT PASSWORD =====
async function adminResetStudentPassword(studentId, studentName) {
  const newPw = prompt(`Enter a new password for ${studentName}.\nThey will use this to log in. (at least 6 characters)`);
  if (!newPw) return;
  if (newPw.length < 6) { alert('Password must be at least 6 characters.'); return; }
  if (!API_BASE) { alert('This needs the backend connected.'); return; }
  const result = await apiCall(`/api/admin/students/${studentId}/password`, { method: 'PUT', body: JSON.stringify({ new_password: newPw }) });
  if (result && result.ok) {
    alert(`Password reset successfully for ${studentName}.\nNew password: ${newPw}\n\nPlease share this with them securely. They can change it themselves once logged in via Account Settings.`);
  } else {
    alert('Reset failed. Please try again.');
  }
}

// ===== Route patching: add 'account' view to both shells =====
(function patchRoutingForAccount() {
  if (typeof renderMainContent === 'function') {
    const _origMain = renderMainContent;
    window.renderMainContent = function() {
      if (APP.currentView === 'account') return renderAccountSettings();
      return _origMain();
    };
    renderMainContent = window.renderMainContent;
  }
  if (typeof renderAdminContent === 'function') {
    const _origAdmin = renderAdminContent;
    window.renderAdminContent = function() {
      const p = APP.viewParams || {};
      if (p.view === 'account') return renderAccountSettings();
      return _origAdmin();
    };
    renderAdminContent = window.renderAdminContent;
  }
})();

// ===== Sidebar & top-nav additions for account link =====
(function patchShellsForAccountLink() {
  if (typeof renderAppShell === 'function') {
    const _origShell = renderAppShell;
    window.renderAppShell = function() {
      let html = _origShell();
      // Insert account button before Sign Out
      html = html.replace(
        /<button class="btn btn-ghost btn-sm" onclick="handleLogout\(\)">/,
        '<button class="btn btn-ghost btn-sm" onclick="navigate(\'account\')" title="Account Settings"><i class="fa-solid fa-user-gear"></i> My Account</button> <button class="btn btn-ghost btn-sm" onclick="handleLogout()">'
      );
      return html;
    };
    renderAppShell = window.renderAppShell;
  }
  if (typeof renderAdminShell === 'function') {
    const _origAdminShell = renderAdminShell;
    window.renderAdminShell = function() {
      let html = _origAdminShell();
      html = html.replace(
        /<button class="btn btn-ghost btn-sm" onclick="handleLogout\(\)">/,
        '<button class="btn btn-ghost btn-sm" onclick="navigate(\'admin\',{view:\'account\'})" title="Account Settings"><i class="fa-solid fa-user-gear"></i> My Account</button> <button class="btn btn-ghost btn-sm" onclick="handleLogout()">'
      );
      return html;
    };
    renderAdminShell = window.renderAdminShell;
  }
})();

// ===== Add 'Reset Password' button on admin student detail page =====
(function patchAdminStudentDetail() {
  if (typeof renderAdminStudentDetail !== 'function') return;
  const _orig = renderAdminStudentDetail;
  window.renderAdminStudentDetail = function(username) {
    let html = _orig(username);
    const u = (typeof getUserData === 'function') ? getUserData(username) : null;
    if (!u) return html;
    const studentId = u.id || username;
    const studentName = (u.fullName || u.full_name || u.username || '').replace(/'/g, "\\'");
    // Insert a reset button next to the breadcrumb area
    const button = `
      <div style="margin:0 0 18px 0;display:flex;gap:8px;flex-wrap:wrap;">
        <button class="btn btn-secondary btn-sm" onclick="adminResetStudentPassword('${studentId}','${studentName}')"><i class="fa-solid fa-key"></i> Reset Password</button>
      </div>
    `;
    html = html.replace('<div class="stats-grid slide-up">', button + '<div class="stats-grid slide-up">');
    return html;
  };
  renderAdminStudentDetail = window.renderAdminStudentDetail;
})();

// =============================================================================
// ===== NEW FEATURES (May 2026): Progress, Section Quizzes, Q&A, Forum ========
// =============================================================================

// ----- Shared in-memory cache (refetched as needed) -----
const NUMA_NEW = {
  progress: null,            // { completedIds: Set, perModule: {moduleId:count}, totals: {moduleId:total}, byModuleProgress }
  questions: null,           // student's questions list
  adminQuestions: null,      // admin's full question list
  forumPosts: null,          // top-level forum posts
  sectionQuizCache: {},      // sectionId -> quiz
  attemptsCache: {}          // sectionId -> attempts[]
};

// ----- Fetch current user's progress and build percentages -----
async function loadMyProgress(force = false) {
  if (NUMA_NEW.progress && !force) return NUMA_NEW.progress;
  const data = await apiCall('/api/progress/me');
  if (!data) { NUMA_NEW.progress = { completedIds: new Set(), perModule: {}, totals: {} }; return NUMA_NEW.progress; }
  const completedIds = new Set();
  const perModule = {};
  (data.completed || []).forEach((row) => {
    completedIds.add(row.section_id);
    perModule[row.module_id] = (perModule[row.module_id] || 0) + 1;
  });
  const totals = {};
  (data.totals || []).forEach((row) => { totals[row.module_id] = row.total; });
  NUMA_NEW.progress = { completedIds, perModule, totals };
  return NUMA_NEW.progress;
}

function progressPctForModule(moduleId) {
  const p = NUMA_NEW.progress;
  if (!p) return 0;
  const total = p.totals[moduleId] || 0;
  const done = p.perModule[moduleId] || 0;
  if (!total) return 0;
  return Math.round((done / total) * 100);
}

function overallProgressPct() {
  const p = NUMA_NEW.progress;
  if (!p) return 0;
  let done = 0, total = 0;
  Object.values(p.totals || {}).forEach(v => { total += v; });
  Object.values(p.perModule || {}).forEach(v => { done += v; });
  if (!total) return 0;
  return Math.round((done / total) * 100);
}

async function markSectionComplete(sectionId, completed = true) {
  const out = await apiCall(`/api/progress/sections/${encodeURIComponent(sectionId)}`, {
    method: 'POST',
    body: JSON.stringify({ completed })
  });
  await loadMyProgress(true);
  return out;
}

// =============================================================================
// ===== ROUTE EXTENSIONS — wire new views into renderMainContent =============
// =============================================================================
(function extendStudentRouter() {
  if (typeof renderMainContent !== 'function') return;
  const _origMain = renderMainContent;
  window.renderMainContent = function() {
    const v = APP.currentView;
    if (v === 'progress') return renderStudentProgress();
    if (v === 'questions') return renderStudentQuestions();
    if (v === 'question-detail') return renderStudentQuestionDetail();
    if (v === 'forum') return renderForumList();
    if (v === 'forum-thread') return renderForumThread();
    return _origMain();
  };
  renderMainContent = window.renderMainContent;
})();

(function extendAdminRouter() {
  if (typeof renderAdminContent !== 'function') return;
  const _origAdmin = renderAdminContent;
  window.renderAdminContent = function() {
    const p = APP.viewParams || {};
    if (p.view === 'questions') return renderAdminQuestions();
    if (p.view === 'question-detail') return renderAdminQuestionDetail();
    if (p.view === 'attempts') return renderAdminAttempts();
    if (p.view === 'forum') return renderAdminForum();
    if (p.view === 'section-quiz') return renderAdminSectionQuizEditor();
    if (p.view === 'editModuleQuiz') return renderAdminModuleQuizEditor(p.moduleId);
    if (p.view === 'moduleHomework') return renderAdminModuleHomework(p.moduleId);
    if (p.view === 'homework-inbox') return renderAdminHomeworkInbox();
    if (p.view === 'program-settings') return renderProgramSettingsEditor();
    return _origAdmin();
  };
  renderAdminContent = window.renderAdminContent;
})();

// =============================================================================
// ===== STUDENT SIDEBAR — add Progress, My Questions, Forum links =============
// =============================================================================
(function extendStudentSidebar() {
  if (typeof renderSidebar !== 'function') return;
  const _origSb = renderSidebar;
  window.renderSidebar = function() {
    const v = APP.currentView;
    let extra = `
      <div class="sidebar-item ${v === 'progress' ? 'active' : ''}" onclick="navigate('progress')">
        <i class="fa-solid fa-chart-line"></i> My Progress
      </div>
      <div class="sidebar-item ${v === 'questions' || v === 'question-detail' ? 'active' : ''}" onclick="navigate('questions')">
        <i class="fa-solid fa-circle-question"></i> Ask a Question
      </div>
      <div class="sidebar-item ${v === 'forum' || v === 'forum-thread' ? 'active' : ''}" onclick="navigate('forum')">
        <i class="fa-solid fa-comments"></i> Discussion Forum
      </div>`;
    let html = _origSb();
    // Insert under "Main" section, before the closing </div> of that block
    html = html.replace(
      /(<div class="sidebar-item[^>]*onclick="navigate\('exam'\)">[\s\S]*?<\/div>)\s*<\/div>\s*<div class="sidebar-section">\s*<div class="sidebar-label">Modules<\/div>/,
      `$1${extra}</div><div class="sidebar-section"><div class="sidebar-label">Modules</div>`
    );
    return html;
  };
  renderSidebar = window.renderSidebar;
})();

// =============================================================================
// ===== ADMIN DASHBOARD — add new quick-action buttons ========================
// =============================================================================
(function extendAdminQuickActions() {
  if (typeof renderAdminContent !== 'function') return;
  const _orig = renderAdminContent;
  window.renderAdminContent = function() {
    const p = APP.viewParams || {};
    // Only inject buttons on the main admin home (no view, no student)
    let html = _orig();
    if (!p.student && !p.view) {
      const extra = `
        <button class="btn btn-secondary" onclick="navigate('admin',{view:'questions'})"><i class="fa-solid fa-inbox"></i> Student Questions <span id="admin-q-count" class="badge badge-progress" style="margin-left:6px;display:none;"></span></button>
        <button class="btn btn-secondary" onclick="navigate('admin',{view:'attempts'})"><i class="fa-solid fa-stopwatch"></i> Quiz Attempts</button>
        <button class="btn btn-secondary" onclick="navigate('admin',{view:'forum'})"><i class="fa-solid fa-comments"></i> Discussion Forum</button>`;
      html = html.replace(
        '<button class="btn btn-secondary" onclick="navigate(\'admin\',{view:\'plagiarism\'})"',
        extra + '<button class="btn btn-secondary" onclick="navigate(\'admin\',{view:\'plagiarism\'})"'
      );
      // Async update the unread question count
      setTimeout(async () => {
        const open = await apiCall('/api/admin/questions?status=open');
        const el = document.getElementById('admin-q-count');
        if (el && Array.isArray(open) && open.length > 0) {
          el.textContent = open.length;
          el.style.display = 'inline-block';
        }
      }, 0);
    }
    return html;
  };
  renderAdminContent = window.renderAdminContent;
})();

// =============================================================================
// ===== STUDENT: PROGRESS PAGE ================================================
// =============================================================================
function renderStudentProgress() {
  setTimeout(async () => {
    await loadMyProgress(true);
    const container = document.getElementById('progress-container');
    if (container) container.innerHTML = renderProgressBody();
  }, 0);
  return `
    <div class="page-header fade-in">
      <h1>My Progress</h1>
      <p>Track every section you've completed and every quiz attempt</p>
    </div>
    <div id="progress-container">
      <div class="card"><div class="card-body text-center text-muted">Loading your progress…</div></div>
    </div>`;
}

function renderProgressBody() {
  const overall = overallProgressPct();
  const p = NUMA_NEW.progress || { completedIds: new Set(), perModule: {}, totals: {} };
  let html = `
    <div class="card slide-up">
      <div class="card-body">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
          <h2 style="margin:0;font-size:1.2rem;">Overall Course Progress</h2>
          <strong style="font-size:1.4rem;">${overall}%</strong>
        </div>
        <div class="progress-bar-wrap"><div class="progress-bar-fill" style="width:${overall}%"></div></div>
        <p class="text-muted text-sm mt-1">Sections completed across all modules</p>
      </div>
    </div>
    <h2 class="mb-2 mt-4" style="font-size:1.3rem;">Per-Module Progress</h2>
    <div class="modules-grid">`;
  COURSE_MODULES.forEach((mod) => {
    const pct = progressPctForModule(mod.id);
    const done = p.perModule[mod.id] || 0;
    const total = p.totals[mod.id] || 0;
    html += `
      <div class="module-card slide-up" onclick="navigateModule(${mod.id})" style="cursor:pointer;">
        <div class="module-card-top ${mod.id % 2 === 0 ? 'terracotta' : 'sage'}"></div>
        <div class="module-card-body">
          <div class="module-card-num"><span>Module ${mod.id}</span></div>
          <h3 style="font-size:1.05rem;">${mod.title}</h3>
          <div class="progress-bar-wrap" style="margin:10px 0 6px;"><div class="progress-bar-fill" style="width:${pct}%"></div></div>
          <div style="display:flex;justify-content:space-between;font-size:13px;">
            <span class="text-muted">${done} / ${total} sections</span>
            <strong>${pct}%</strong>
          </div>
        </div>
      </div>`;
  });
  html += '</div>';
  // Section-quiz attempts history
  html += `
    <h2 class="mb-2 mt-4" style="font-size:1.3rem;">My Section-Quiz Attempts</h2>
    <div id="my-attempts-table" class="card"><div class="card-body text-center text-muted">Loading attempts…</div></div>`;
  setTimeout(loadMyAttemptsTable, 0);
  return html;
}

async function loadMyAttemptsTable() {
  const attempts = await apiCall('/api/admin/section-quiz-attempts?user_id=' + (APP.currentUser?.id || 0))
    || await apiCall('/api/quiz-scores'); // student fallback gives module-level
  const target = document.getElementById('my-attempts-table');
  if (!target) return;
  if (!attempts || attempts.length === 0) {
    target.innerHTML = '<div class="card-body text-center text-muted">No quiz attempts yet.</div>';
    return;
  }
  let rows = '';
  attempts.slice(0, 50).forEach(a => {
    const pct = Math.round((a.score / a.total) * 100);
    const time = a.time_spent_seconds ? formatDuration(a.time_spent_seconds) : '—';
    const when = a.completed_at ? new Date(a.completed_at).toLocaleString() : '—';
    rows += `<tr>
      <td>${a.section_title || a.module_id || '—'}</td>
      <td>${a.score} / ${a.total}</td>
      <td><strong>${pct}%</strong></td>
      <td>${time}</td>
      <td class="text-muted text-sm">${when}</td>
    </tr>`;
  });
  target.innerHTML = `<div class="card-body" style="padding:0;overflow-x:auto;">
    <table class="admin-table">
      <thead><tr><th>Section</th><th>Score</th><th>%</th><th>Time</th><th>Completed</th></tr></thead>
      <tbody>${rows}</tbody>
    </table></div>`;
}

function formatDuration(sec) {
  if (!sec || sec < 0) return '—';
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  if (m === 0) return `${s}s`;
  return `${m}m ${s.toString().padStart(2, '0')}s`;
}

// =============================================================================
// ===== STUDENT: ASK A QUESTION — EMAIL-STYLE INBOX ==========================
// =============================================================================

// Inject inbox CSS once
function _ensureInboxStyles() {
  if (document.getElementById('numa-inbox-styles')) return;
  const css = `
  .inbox-shell{background:#fafaf7;border:1px solid #e6dfd1;border-radius:14px;overflow:hidden;}
  .inbox-head{padding:16px 20px;background:#fff;border-bottom:1px solid #e6dfd1;display:flex;align-items:center;gap:12px;}
  .inbox-head h1{margin:0;font-size:20px;color:#3b2f24;font-weight:600;}
  .inbox-head .inbox-sub{font-size:12.5px;color:#8a7a6a;margin-top:2px;}
  .inbox-compose-btn{background:#A38D78;color:#fff;border:0;padding:9px 16px;border-radius:9px;font-size:13.5px;font-weight:600;cursor:pointer;display:inline-flex;align-items:center;gap:6px;}
  .inbox-compose-btn:hover{background:#8e7967;}
  .inbox-filters{padding:10px 20px;background:#fff;border-bottom:1px solid #f0e9da;display:flex;gap:6px;flex-wrap:wrap;}
  .inbox-filter{background:transparent;border:1px solid transparent;color:#8a7a6a;padding:5px 12px;border-radius:999px;font-size:12.5px;cursor:pointer;font-weight:500;}
  .inbox-filter:hover{background:#fafaf2;color:#3b2f24;}
  .inbox-filter.active{background:#f5ede0;color:#3b2f24;border-color:#e6d9bf;}
  .inbox-list{background:#fff;}
  .inbox-empty{padding:40px 20px;text-align:center;color:#8a7a6a;}
  .inbox-empty i{font-size:42px;color:#c7b9a3;display:block;margin-bottom:14px;}
  .inbox-row{display:grid;grid-template-columns:auto 180px 1fr auto auto;align-items:center;gap:14px;padding:13px 20px;border-bottom:1px solid #f3ecdc;cursor:pointer;transition:background .12s;}
  .inbox-row:last-child{border-bottom:0;}
  .inbox-row:hover{background:#fafaf2;}
  .inbox-row.unread{background:#fffaf0;}
  .inbox-row.unread .inbox-from,.inbox-row.unread .inbox-subject{font-weight:700;color:#3b2f24;}
  .inbox-dot{width:8px;height:8px;border-radius:50%;background:#A38D78;display:inline-block;}
  .inbox-row:not(.unread) .inbox-dot{visibility:hidden;}
  .inbox-from{font-size:13.5px;color:#3b2f24;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
  .inbox-snippet{min-width:0;font-size:13.5px;color:#6a5d4d;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
  .inbox-snippet .inbox-subject{color:#3b2f24;font-weight:500;}
  .inbox-snippet .inbox-preview{color:#8a7a6a;}
  .inbox-meta{display:flex;align-items:center;gap:8px;}
  .inbox-status-pill{font-size:10.5px;padding:2px 9px;border-radius:999px;font-weight:600;letter-spacing:.2px;text-transform:uppercase;}
  .inbox-status-open{background:#e3f2fd;color:#1565c0;}
  .inbox-status-answered{background:#e8f5e9;color:#2e7d32;}
  .inbox-status-closed{background:#f5efe4;color:#6a5d4d;}
  .inbox-reply-count{font-size:12px;color:#8a7a6a;display:inline-flex;align-items:center;gap:3px;}
  .inbox-time{font-size:12px;color:#8a7a6a;white-space:nowrap;}

  /* Email-thread view */
  .email-thread{background:#fafaf7;border:1px solid #e6dfd1;border-radius:14px;overflow:hidden;}
  .email-thread-head{padding:18px 22px 14px;background:#fff;border-bottom:1px solid #e6dfd1;}
  .email-thread-back{background:transparent;border:0;color:#A38D78;cursor:pointer;font-size:13px;display:inline-flex;align-items:center;gap:5px;padding:0;margin-bottom:8px;}
  .email-thread-back:hover{text-decoration:underline;}
  .email-thread-title{margin:0;font-size:20px;color:#3b2f24;font-weight:600;line-height:1.3;}
  .email-thread-meta{display:flex;align-items:center;gap:8px;margin-top:6px;flex-wrap:wrap;}
  .email-msg{background:#fff;border-bottom:1px solid #f0e9da;padding:18px 22px;}
  .email-msg:last-of-type{border-bottom:0;}
  .email-msg-head{display:flex;align-items:flex-start;gap:12px;margin-bottom:10px;}
  .email-avatar{width:38px;height:38px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:600;font-size:14px;flex-shrink:0;}
  .email-meta{flex:1;min-width:0;}
  .email-from{font-size:14.5px;color:#3b2f24;font-weight:600;display:flex;align-items:center;gap:8px;flex-wrap:wrap;}
  .email-staff-pill{background:#A38D78;color:#fff;font-size:10px;padding:1px 7px;border-radius:999px;font-weight:500;letter-spacing:.3px;}
  .email-to{font-size:12.5px;color:#8a7a6a;margin-top:2px;}
  .email-time{font-size:12.5px;color:#8a7a6a;white-space:nowrap;}
  .email-body{font-size:14.5px;color:#3b2f24;line-height:1.6;white-space:pre-wrap;word-wrap:break-word;padding-left:50px;}
  .email-reply-card{background:#fff;border-top:1px solid #e6dfd1;padding:18px 22px;}
  .email-reply-card label{display:block;font-size:12.5px;font-weight:600;color:#3b2f24;margin-bottom:6px;}
  .email-reply-card textarea{width:100%;border:1px solid #e6dfd1;border-radius:10px;padding:11px 14px;font-family:inherit;font-size:14px;background:#fafaf7;color:#3b2f24;outline:none;box-sizing:border-box;resize:vertical;min-height:110px;}
  .email-reply-card textarea:focus{border-color:#A38D78;background:#fff;}
  .email-reply-actions{display:flex;gap:8px;margin-top:10px;flex-wrap:wrap;}
  .email-reply-actions .btn-send{background:#A38D78;color:#fff;border:0;padding:9px 16px;border-radius:9px;font-size:13px;font-weight:600;cursor:pointer;display:inline-flex;align-items:center;gap:6px;}
  .email-reply-actions .btn-send:hover{background:#8e7967;}
  .email-reply-actions .btn-ghost-admin{background:transparent;border:1px solid #e6dfd1;color:#3b2f24;padding:9px 14px;border-radius:9px;font-size:13px;cursor:pointer;}
  .email-reply-actions .btn-ghost-admin:hover{background:#fafaf2;}
  .email-thread-closed{padding:16px 22px;background:#f5efe4;color:#6a5d4d;font-size:13px;text-align:center;border-top:1px solid #e6dfd1;}

  /* Compose modal (reuses topic-modal styles where possible) */
  .compose-modal{background:#fff;border-radius:14px;width:min(620px,94vw);box-shadow:0 8px 30px rgba(0,0,0,.18);overflow:hidden;}
  .compose-modal .topic-modal-head{padding:14px 18px;border-bottom:1px solid #e6dfd1;}
  .compose-row{padding:12px 18px;border-bottom:1px solid #f0e9da;display:flex;align-items:center;gap:10px;}
  .compose-row .lbl{font-size:12.5px;color:#8a7a6a;font-weight:600;width:60px;flex-shrink:0;}
  .compose-row input{flex:1;border:0;outline:0;font-family:inherit;font-size:14.5px;color:#3b2f24;background:transparent;padding:6px 0;}
  .compose-body{padding:14px 18px;}
  .compose-body textarea{width:100%;border:0;outline:0;font-family:inherit;font-size:14.5px;color:#3b2f24;background:transparent;resize:vertical;min-height:160px;line-height:1.55;box-sizing:border-box;}

  @media(max-width:780px){
    .inbox-row{grid-template-columns:auto 1fr auto;}
    .inbox-from{display:none;}
    .inbox-meta .inbox-status-pill{display:none;}
    .email-body{padding-left:0;}
  }
  `;
  const el = document.createElement('style');
  el.id = 'numa-inbox-styles';
  el.textContent = css;
  document.head.appendChild(el);
}

window.NUMA_INBOX = window.NUMA_INBOX || { filter: 'all', list: [], isAdmin: false };

function _inboxRelTime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  if (sameDay) return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  const diffDays = Math.floor((now - d) / 86400000);
  if (diffDays < 7) return d.toLocaleDateString([], { weekday: 'short' });
  if (d.getFullYear() === now.getFullYear()) return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  return d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
}

function _inboxAvatarColor(name, isStaff) {
  if (isStaff) return '#A38D78';
  const palette = ['#6b8e7e','#7a8aab','#9b7a8e','#8f7a55','#7a8a6e','#a07a6e','#6e8a92'];
  let h = 0; for (let i = 0; i < (name||'').length; i++) h = (h*31 + name.charCodeAt(i)) >>> 0;
  return palette[h % palette.length];
}
function _inboxInitials(name) {
  const s = (name || 'User').trim();
  const parts = s.split(/\s+/);
  return ((parts[0]?.[0] || 'U') + (parts[1]?.[0] || '')).toUpperCase();
}

function renderStudentQuestions() {
  _ensureInboxStyles();
  window.NUMA_INBOX.isAdmin = false;
  setTimeout(loadStudentQuestions, 0);
  const f = window.NUMA_INBOX.filter || 'all';
  return `
    <div class="inbox-shell fade-in">
      <div class="inbox-head">
        <div style="flex:1;min-width:0;">
          <h1><i class="fa-regular fa-envelope" style="color:#A38D78;margin-right:8px;"></i>Messages</h1>
          <div class="inbox-sub">Private messages between you and NUMA staff</div>
        </div>
        <button class="inbox-compose-btn" onclick="openComposeModal()"><i class="fa-solid fa-pen-to-square"></i> Compose</button>
      </div>
      <div class="inbox-filters">
        <button class="inbox-filter ${f==='all'?'active':''}" onclick="setInboxFilter('all')">All</button>
        <button class="inbox-filter ${f==='open'?'active':''}" onclick="setInboxFilter('open')">Open</button>
        <button class="inbox-filter ${f==='answered'?'active':''}" onclick="setInboxFilter('answered')">Answered</button>
        <button class="inbox-filter ${f==='closed'?'active':''}" onclick="setInboxFilter('closed')">Closed</button>
      </div>
      <div class="inbox-list" id="my-questions"><div class="inbox-empty">Loading…</div></div>
    </div>`;
}

function setInboxFilter(f) {
  window.NUMA_INBOX.filter = f;
  // Re-render filter pills
  document.querySelectorAll('.inbox-filter').forEach(b => b.classList.remove('active'));
  const el = [...document.querySelectorAll('.inbox-filter')].find(b => b.textContent.trim().toLowerCase() === (f === 'all' ? 'all' : f));
  if (el) el.classList.add('active');
  renderInboxList();
}
window.setInboxFilter = setInboxFilter;

async function loadStudentQuestions() {
  const list = await apiCall('/api/questions') || [];
  window.NUMA_INBOX.list = list;
  renderInboxList();
}

function renderInboxList() {
  const target = document.getElementById('my-questions');
  if (!target) return;
  const isAdmin = window.NUMA_INBOX.isAdmin;
  const filter = window.NUMA_INBOX.filter || 'all';
  let list = window.NUMA_INBOX.list || [];
  if (filter !== 'all') list = list.filter(q => q.status === filter);
  if (!list.length) {
    target.innerHTML = `<div class="inbox-empty"><i class="fa-regular fa-envelope-open"></i>${isAdmin ? 'No messages in this view.' : 'No messages yet. Click <strong>Compose</strong> to send your first question.'}</div>`;
    return;
  }
  // Newest first (server already sorts; this is a defensive re-sort)
  const sorted = [...list].sort((a, b) => {
    const at = new Date(a.last_activity_at || a.updated_at || a.created_at).getTime();
    const bt = new Date(b.last_activity_at || b.updated_at || b.created_at).getTime();
    return bt - at;
  });
  target.innerHTML = sorted.map(q => {
    const statusKey = q.status === 'answered' ? 'answered' : (q.status === 'closed' ? 'closed' : 'open');
    const statusLabel = statusKey === 'answered' ? 'Answered' : (statusKey === 'closed' ? 'Closed' : 'Open');
    const subject = q.subject && q.subject.trim() ? q.subject : '(No subject)';
    const preview = (q.body || '').replace(/\s+/g, ' ').slice(0, 100);
    const from = isAdmin
      ? (q.student_name || q.student_username || 'Student')
      : 'You → NUMA Staff';
    const time = _inboxRelTime(q.last_activity_at || q.updated_at || q.created_at);
    const replies = q.reply_count || 0;
    // Treat "open" with no replies as unread for the student view (so it stands out)
    const isUnread = isAdmin ? (statusKey === 'open') : false;
    const navTo = isAdmin
      ? `navigate('admin',{view:'question-detail',id:${q.id}})`
      : `navigate('question-detail',{id:${q.id}})`;
    return `
      <div class="inbox-row ${isUnread ? 'unread' : ''}" onclick="${navTo}">
        <span class="inbox-dot"></span>
        <div class="inbox-from">${escapeHtml(from)}</div>
        <div class="inbox-snippet">
          <span class="inbox-subject">${escapeHtml(subject)}</span>
          <span class="inbox-preview"> — ${escapeHtml(preview)}</span>
        </div>
        <div class="inbox-meta">
          ${replies > 0 ? `<span class="inbox-reply-count"><i class="fa-regular fa-comment"></i> ${replies}</span>` : ''}
          <span class="inbox-status-pill inbox-status-${statusKey}">${statusLabel}</span>
        </div>
        <div class="inbox-time">${time}</div>
      </div>`;
  }).join('');
}

// Compose modal (replaces always-visible compose form)
function openComposeModal() {
  _ensureChatStyles(); // for the topic-modal backdrop styles already defined
  if (document.getElementById('compose-modal-backdrop')) return;
  const backdrop = document.createElement('div');
  backdrop.id = 'compose-modal-backdrop';
  backdrop.className = 'topic-modal-backdrop';
  backdrop.innerHTML = `
    <div class="compose-modal" onclick="event.stopPropagation()">
      <div class="topic-modal-head">
        <h3><i class="fa-regular fa-envelope" style="color:#A38D78;margin-right:6px;"></i> New Message</h3>
        <button class="topic-modal-close" onclick="closeComposeModal()" title="Close"><i class="fa-solid fa-xmark"></i></button>
      </div>
      <div class="compose-row"><span class="lbl">To</span><input value="NUMA Staff" disabled style="color:#6a5d4d;"></div>
      <div class="compose-row"><span class="lbl">Subject</span><input id="compose-subject" placeholder="What's this about?" maxlength="160"></div>
      <div class="compose-body">
        <textarea id="compose-body" placeholder="Write your message…"></textarea>
      </div>
      <div class="topic-modal-foot">
        <button class="btn-cancel" onclick="closeComposeModal()">Cancel</button>
        <button class="btn-create" id="compose-send" onclick="submitStudentQuestion()"><i class="fa-solid fa-paper-plane"></i> Send</button>
      </div>
    </div>`;
  backdrop.onclick = () => closeComposeModal();
  document.body.appendChild(backdrop);
  setTimeout(() => document.getElementById('compose-subject')?.focus(), 50);
}
window.openComposeModal = openComposeModal;

function closeComposeModal() {
  const el = document.getElementById('compose-modal-backdrop');
  if (el) el.remove();
}
window.closeComposeModal = closeComposeModal;

async function submitStudentQuestion() {
  const subject = (document.getElementById('compose-subject')?.value || '').trim();
  const body = (document.getElementById('compose-body')?.value || '').trim();
  if (!body) { alert('Please write a message.'); return; }
  const btn = document.getElementById('compose-send');
  if (btn) btn.disabled = true;
  const out = await apiCall('/api/questions', {
    method: 'POST',
    body: JSON.stringify({ subject: subject || '(No subject)', body })
  });
  if (btn) btn.disabled = false;
  if (out) {
    closeComposeModal();
    loadStudentQuestions();
  } else {
    alert('Could not send. Please try again.');
  }
}
window.submitStudentQuestion = submitStudentQuestion;

function renderStudentQuestionDetail() {
  _ensureInboxStyles();
  const id = APP.viewParams?.id;
  setTimeout(() => loadQuestionThread(id, false), 0);
  return `<div id="q-thread"><div class="inbox-shell"><div class="inbox-empty">Loading…</div></div></div>`;
}

async function loadQuestionThread(id, isAdmin) {
  _ensureInboxStyles();
  const data = await apiCall(`/api/questions/${id}`);
  const target = document.getElementById('q-thread');
  if (!target || !data) return;
  const q = data.question;
  const replies = data.replies || [];
  const statusKey = q.status === 'answered' ? 'answered' : (q.status === 'closed' ? 'closed' : 'open');
  const statusLabel = statusKey === 'answered' ? 'Answered' : (statusKey === 'closed' ? 'Closed' : 'Open');
  const backNav = isAdmin ? "navigate('admin',{view:'questions'});return false;" : "navigate('questions');return false;";
  const backLabel = isAdmin ? 'Student Questions' : 'Messages';
  // First message (original question) rendered as an email
  const renderMsg = (m, opts = {}) => {
    const isStaff = opts.isStaff || m.author_role === 'admin';
    const name = opts.name || m.author_name || m.student_name || m.student_username || 'User';
    const avatar = `<div class="email-avatar" style="background:${_inboxAvatarColor(name, isStaff)};">${_inboxInitials(name)}</div>`;
    const time = new Date(m.created_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
    const toLabel = isStaff ? `to ${escapeHtml(q.student_name || q.student_username || 'Student')}` : 'to NUMA Staff';
    return `
      <div class="email-msg">
        <div class="email-msg-head">
          ${avatar}
          <div class="email-meta">
            <div class="email-from">${escapeHtml(name)} ${isStaff ? '<span class="email-staff-pill">Staff</span>' : ''}</div>
            <div class="email-to">${toLabel}</div>
          </div>
          <div class="email-time">${escapeHtml(time)}</div>
        </div>
        <div class="email-body">${escapeHtml(m.body || '')}</div>
      </div>`;
  };
  let html = `
    <div class="email-thread fade-in">
      <div class="email-thread-head">
        <button class="email-thread-back" onclick="${backNav}"><i class="fa-solid fa-chevron-left"></i> ${backLabel}</button>
        <h2 class="email-thread-title">${escapeHtml(q.subject || '(No subject)')}</h2>
        <div class="email-thread-meta">
          <span class="inbox-status-pill inbox-status-${statusKey}">${statusLabel}</span>
          <span class="text-muted text-sm" style="color:#8a7a6a;">${replies.length + 1} ${replies.length === 0 ? 'message' : 'messages'}</span>
        </div>
      </div>`;
  // Original question
  html += renderMsg({
    created_at: q.created_at,
    body: q.body,
    author_role: 'student'
  }, { name: q.student_name || q.student_username || 'Student', isStaff: false });
  // Replies
  replies.forEach(r => { html += renderMsg(r); });
  // Reply box / closed banner
  if (q.status === 'closed') {
    html += `<div class="email-thread-closed"><i class="fa-solid fa-lock" style="margin-right:6px;"></i>This conversation has been closed.</div>`;
  } else {
    html += `
      <div class="email-reply-card">
        <label for="q-reply-body">Reply</label>
        <textarea id="q-reply-body" placeholder="${isAdmin ? 'Write a reply to the student…' : 'Write your reply…'}"></textarea>
        <div class="email-reply-actions">
          <button class="btn-send" onclick="submitQuestionReply(${id}, ${isAdmin})"><i class="fa-solid fa-paper-plane"></i> Send Reply</button>
          ${isAdmin ? `
            <button class="btn-ghost-admin" onclick="updateQuestionStatus(${id},'answered')"><i class="fa-solid fa-check"></i> Mark Answered</button>
            <button class="btn-ghost-admin" onclick="updateQuestionStatus(${id},'closed')"><i class="fa-solid fa-lock"></i> Close Thread</button>` : ''}
        </div>
      </div>`;
  }
  html += `</div>`;
  target.innerHTML = html;
}

async function submitQuestionReply(id, isAdmin) {
  const body = (document.getElementById('q-reply-body')?.value || '').trim();
  if (!body) { alert('Reply cannot be empty.'); return; }
  const out = await apiCall(`/api/questions/${id}/replies`, {
    method: 'POST',
    body: JSON.stringify({ body })
  });
  if (out) loadQuestionThread(id, isAdmin);
  else alert('Could not send reply.');
}

async function updateQuestionStatus(id, status) {
  await apiCall(`/api/admin/questions/${id}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status })
  });
  loadQuestionThread(id, true);
}

// =============================================================================
// ===== ADMIN: STUDENT QUESTIONS INBOX =======================================
// =============================================================================
function renderAdminQuestions() {
  _ensureInboxStyles();
  window.NUMA_INBOX.isAdmin = true;
  setTimeout(loadAdminQuestions, 0);
  const f = window.NUMA_INBOX.filter || 'all';
  return `
    <div class="breadcrumb fade-in"><a href="#" onclick="navigate('admin');return false;">Admin</a> <i class="fa-solid fa-chevron-right" style="font-size:10px;"></i> <span>Student Questions</span></div>
    <div class="inbox-shell fade-in">
      <div class="inbox-head">
        <div style="flex:1;min-width:0;">
          <h1><i class="fa-regular fa-envelope" style="color:#A38D78;margin-right:8px;"></i>Student Questions</h1>
          <div class="inbox-sub">Reply to questions submitted by your students</div>
        </div>
      </div>
      <div class="inbox-filters">
        <button class="inbox-filter ${f==='all'?'active':''}" onclick="setAdminInboxFilter('all')">All</button>
        <button class="inbox-filter ${f==='open'?'active':''}" onclick="setAdminInboxFilter('open')">Open</button>
        <button class="inbox-filter ${f==='answered'?'active':''}" onclick="setAdminInboxFilter('answered')">Answered</button>
        <button class="inbox-filter ${f==='closed'?'active':''}" onclick="setAdminInboxFilter('closed')">Closed</button>
      </div>
      <div class="inbox-list" id="my-questions"><div class="inbox-empty">Loading…</div></div>
    </div>`;
}

function setAdminInboxFilter(f) {
  window.NUMA_INBOX.filter = f;
  loadAdminQuestions(f === 'all' ? undefined : f);
  // Update active state visually
  document.querySelectorAll('.inbox-filter').forEach(b => b.classList.remove('active'));
  const labelMap = { all: 'all', open: 'open', answered: 'answered', closed: 'closed' };
  const target = [...document.querySelectorAll('.inbox-filter')].find(b => b.textContent.trim().toLowerCase() === labelMap[f]);
  if (target) target.classList.add('active');
}
window.setAdminInboxFilter = setAdminInboxFilter;

async function loadAdminQuestions(status) {
  const path = '/api/admin/questions' + (status ? '?status=' + status : '');
  const list = await apiCall(path) || [];
  window.NUMA_INBOX.list = list;
  // For admin view, the server-side filter already applied; render without re-filtering.
  // Temporarily clear filter so renderInboxList shows whatever the server returned.
  const prevFilter = window.NUMA_INBOX.filter;
  window.NUMA_INBOX.filter = 'all';
  renderInboxList();
  window.NUMA_INBOX.filter = prevFilter;
}

function renderAdminQuestionDetail() {
  _ensureInboxStyles();
  const id = APP.viewParams?.id;
  setTimeout(() => loadQuestionThread(id, true), 0);
  return `
    <div class="breadcrumb fade-in"><a href="#" onclick="navigate('admin',{view:'questions'});return false;">Student Questions</a> <i class="fa-solid fa-chevron-right" style="font-size:10px;"></i> <span>Thread</span></div>
    <div id="q-thread"><div class="inbox-shell"><div class="inbox-empty">Loading…</div></div></div>`;
}

// =============================================================================
// ===== ADMIN: QUIZ ATTEMPTS LOG =============================================
// =============================================================================
function renderAdminAttempts() {
  setTimeout(loadAdminAttempts, 0);
  return `
    <div class="breadcrumb fade-in"><a href="#" onclick="navigate('admin');return false;">Admin</a> <i class="fa-solid fa-chevron-right" style="font-size:10px;"></i> <span>Quiz Attempts</span></div>
    <div class="page-header"><h1>Section-Quiz Attempts</h1><p>Every quiz attempt across all students — with score, %, and time</p></div>
    <div id="attempts-table" class="card"><div class="card-body text-center text-muted">Loading…</div></div>`;
}

async function loadAdminAttempts() {
  const list = await apiCall('/api/admin/section-quiz-attempts') || [];
  const target = document.getElementById('attempts-table');
  if (!target) return;
  if (list.length === 0) {
    target.innerHTML = '<div class="card-body text-center text-muted">No section-quiz attempts yet. Add a quiz to a section first.</div>';
    return;
  }
  let rows = '';
  list.forEach(a => {
    const pct = Math.round((a.score / a.total) * 100);
    const time = formatDuration(a.time_spent_seconds);
    const when = new Date(a.completed_at).toLocaleString();
    const passClass = pct >= 70 ? 'badge-complete' : 'badge-locked';
    rows += `<tr>
      <td><strong>${escapeHtml(a.full_name || a.username)}</strong><br><span class="text-muted text-sm">${escapeHtml(a.username)}</span></td>
      <td>${escapeHtml(a.module_title)}<br><span class="text-muted text-sm">${escapeHtml(a.section_title)}</span></td>
      <td>${a.score} / ${a.total}</td>
      <td><span class="badge ${passClass}">${pct}%</span></td>
      <td>${time}</td>
      <td class="text-muted text-sm">${when}</td>
    </tr>`;
  });
  target.innerHTML = `<div class="card-body" style="padding:0;overflow-x:auto;">
    <table class="admin-table">
      <thead><tr><th>Student</th><th>Section</th><th>Score</th><th>%</th><th>Time</th><th>Completed</th></tr></thead>
      <tbody>${rows}</tbody>
    </table></div>`;
}

// =============================================================================
// ===== ADMIN: SECTION-QUIZ EDITOR (per section) ============================
// =============================================================================
function renderAdminSectionQuizEditor() {
  const sectionId = APP.viewParams?.sectionId;
  const moduleId = APP.viewParams?.moduleId;
  setTimeout(() => loadSectionQuizForEdit(sectionId), 0);
  return `
    <div class="breadcrumb fade-in"><a href="#" onclick="navigate('admin',{view:'modules'});return false;">Course Content</a> <i class="fa-solid fa-chevron-right" style="font-size:10px;"></i> <span>Section Quiz</span></div>
    <div class="page-header"><h1>End-of-Section Quiz</h1><p>This quiz appears right after a student finishes reading this one section. Leave blank for sections that don't need a quiz; use the end-of-module quiz instead.</p></div>
    <div id="sq-editor" data-section="${sectionId}" data-module="${moduleId}"><div class="card"><div class="card-body text-center text-muted">Loading…</div></div></div>`;
}

async function loadSectionQuizForEdit(sectionId) {
  const quiz = await apiCall(`/api/sections/${encodeURIComponent(sectionId)}/quiz`) || {
    title: 'Section Quiz', time_limit_minutes: null, passing_score: 70, is_optional: true, questions: []
  };
  NUMA_NEW.sectionQuizCache[sectionId] = quiz;
  renderSectionQuizEditorBody(sectionId, quiz);
}

function renderSectionQuizEditorBody(sectionId, quiz) {
  const target = document.getElementById('sq-editor');
  if (!target) return;
  let qRows = '';
  (quiz.questions || []).forEach((q, i) => {
    qRows += `
      <div class="card" style="margin-bottom:10px;">
        <div class="card-body">
          <div style="display:flex;gap:8px;align-items:center;margin-bottom:6px;">
            <strong>Question ${i + 1}</strong>
            <button class="btn btn-ghost btn-sm" style="margin-left:auto;" onclick="removeSectionQuizQuestion('${sectionId}', ${i})"><i class="fa-solid fa-trash"></i></button>
          </div>
          <input class="input" placeholder="Question text" value="${escapeAttr(q.question || '')}" onchange="updateSectionQuizField('${sectionId}', ${i}, 'question', this.value)" style="margin-bottom:6px;">
          ${[0, 1, 2, 3].map(j => `
            <div style="display:flex;gap:8px;align-items:center;margin-bottom:4px;">
              <input type="radio" name="sq-${sectionId}-${i}" ${q.correct_index === j ? 'checked' : ''} onchange="updateSectionQuizField('${sectionId}', ${i}, 'correct_index', ${j})">
              <input class="input" placeholder="Option ${String.fromCharCode(65 + j)}" value="${escapeAttr((q.options || [])[j] || '')}" onchange="updateSectionQuizOption('${sectionId}', ${i}, ${j}, this.value)" style="flex:1;">
            </div>`).join('')}
          <input class="input" placeholder="Explanation (shown after answer, optional)" value="${escapeAttr(q.explanation || '')}" onchange="updateSectionQuizField('${sectionId}', ${i}, 'explanation', this.value)" style="margin-top:6px;">
        </div>
      </div>`;
  });
  target.innerHTML = `
    <div class="card slide-up">
      <div class="card-body">
        <label class="text-sm">Quiz Title</label>
        <input id="sq-title" class="input" value="${escapeAttr(quiz.title || 'Section Quiz')}" style="margin-bottom:8px;">
        <div style="display:flex;gap:10px;flex-wrap:wrap;">
          <label class="text-sm" style="flex:1;min-width:140px;">Passing Score (%)
            <input id="sq-passing" type="number" class="input" min="0" max="100" value="${quiz.passing_score ?? 70}">
          </label>
          <label class="text-sm" style="flex:1;min-width:140px;">Time Limit (minutes, optional)
            <input id="sq-time" type="number" class="input" min="0" value="${quiz.time_limit_minutes || ''}">
          </label>
          <label class="text-sm" style="display:flex;align-items:center;gap:6px;margin-top:18px;" title="If checked, students can read the section without taking the quiz. Uncheck to make passing the quiz required before moving on.">
            <input id="sq-optional" type="checkbox" ${quiz.is_optional !== false ? 'checked' : ''}> Optional (students may skip this quiz)
          </label>
        </div>
      </div>
    </div>
    <h3 style="margin:18px 0 10px;">Questions</h3>
    <div id="sq-questions">${qRows}</div>
    <div style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap;">
      <button class="btn btn-secondary" onclick="addSectionQuizQuestion('${sectionId}')"><i class="fa-solid fa-plus"></i> Add Question</button>
      <button class="btn btn-primary" onclick="saveSectionQuiz('${sectionId}')"><i class="fa-solid fa-floppy-disk"></i> Save Quiz</button>
      <button class="btn btn-ghost" onclick="deleteSectionQuiz('${sectionId}')"><i class="fa-solid fa-trash"></i> Remove Quiz</button>
    </div>
    <div id="sq-status" class="text-muted text-sm" style="margin-top:10px;"></div>`;
}

function getCachedQuiz(sectionId) {
  return NUMA_NEW.sectionQuizCache[sectionId] || (NUMA_NEW.sectionQuizCache[sectionId] = { title: 'Section Quiz', passing_score: 70, is_optional: true, questions: [] });
}

function addSectionQuizQuestion(sectionId) {
  const q = getCachedQuiz(sectionId);
  q.questions = q.questions || [];
  q.questions.push({ question: '', options: ['', '', '', ''], correct_index: 0, explanation: '' });
  renderSectionQuizEditorBody(sectionId, q);
}

function removeSectionQuizQuestion(sectionId, idx) {
  const q = getCachedQuiz(sectionId);
  q.questions.splice(idx, 1);
  renderSectionQuizEditorBody(sectionId, q);
}

function updateSectionQuizField(sectionId, idx, field, value) {
  const q = getCachedQuiz(sectionId);
  if (!q.questions[idx]) return;
  q.questions[idx][field] = field === 'correct_index' ? Number(value) : value;
}

function updateSectionQuizOption(sectionId, idx, optIdx, value) {
  const q = getCachedQuiz(sectionId);
  if (!q.questions[idx]) return;
  q.questions[idx].options = q.questions[idx].options || ['', '', '', ''];
  q.questions[idx].options[optIdx] = value;
}

async function saveSectionQuiz(sectionId) {
  const q = getCachedQuiz(sectionId);
  q.title = document.getElementById('sq-title')?.value || 'Section Quiz';
  q.passing_score = parseInt(document.getElementById('sq-passing')?.value || '70', 10);
  const t = document.getElementById('sq-time')?.value;
  q.time_limit_minutes = t ? parseInt(t, 10) : null;
  q.is_optional = !!document.getElementById('sq-optional')?.checked;
  const status = document.getElementById('sq-status');
  if (status) status.textContent = 'Saving…';
  const out = await apiCall(`/api/admin/sections/${encodeURIComponent(sectionId)}/quiz`, {
    method: 'PUT',
    body: JSON.stringify({
      title: q.title,
      time_limit_minutes: q.time_limit_minutes,
      passing_score: q.passing_score,
      is_optional: q.is_optional,
      questions: q.questions
    })
  });
  if (status) status.textContent = out ? 'Saved.' : 'Save failed.';
  // Refresh cache so student-side quiz button visibility updates immediately
  if (typeof loadSectionsWithQuiz === 'function') loadSectionsWithQuiz(true);
}

async function deleteSectionQuiz(sectionId) {
  if (!confirm('Remove this section quiz?')) return;
  await apiCall(`/api/admin/sections/${encodeURIComponent(sectionId)}/quiz`, { method: 'DELETE' });
  NUMA_NEW.sectionQuizCache[sectionId] = { title: 'Section Quiz', passing_score: 70, is_optional: true, questions: [] };
  renderSectionQuizEditorBody(sectionId, NUMA_NEW.sectionQuizCache[sectionId]);
  if (typeof loadSectionsWithQuiz === 'function') loadSectionsWithQuiz(true);
}

// =============================================================================
// ===== STUDENT: TAKE A SECTION QUIZ (inline modal) ==========================
// =============================================================================
async function openSectionQuiz(sectionId) {
  const quiz = await apiCall(`/api/sections/${encodeURIComponent(sectionId)}/quiz`);
  if (!quiz || !Array.isArray(quiz.questions) || quiz.questions.length === 0) {
    alert('This section does not have a quiz yet.');
    return;
  }
  NUMA_NEW._activeQuiz = { sectionId, quiz, answers: {}, startedAt: Date.now() };
  renderSectionQuizModal();
}

function renderSectionQuizModal() {
  const a = NUMA_NEW._activeQuiz;
  if (!a) return;
  const { quiz, answers } = a;
  let qHtml = '';
  quiz.questions.forEach((q, i) => {
    qHtml += `
      <div class="card" style="margin-bottom:10px;">
        <div class="card-body">
          <div style="font-weight:600;margin-bottom:8px;">${i + 1}. ${escapeHtml(q.question || '')}</div>
          ${(q.options || []).map((opt, j) => `
            <label style="display:flex;gap:8px;align-items:center;padding:6px;border-radius:6px;cursor:pointer;${answers[i] === j ? 'background:rgba(163,141,120,0.15);' : ''}">
              <input type="radio" name="quiz-q-${i}" ${answers[i] === j ? 'checked' : ''} onchange="setQuizAnswer(${i}, ${j})">
              <span>${escapeHtml(opt)}</span>
            </label>`).join('')}
        </div>
      </div>`;
  });
  const modal = document.getElementById('numa-quiz-modal') || (() => {
    const d = document.createElement('div');
    d.id = 'numa-quiz-modal';
    d.style.cssText = 'position:fixed;inset:0;background:rgba(20,15,10,0.6);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px;overflow:auto;';
    document.body.appendChild(d);
    return d;
  })();
  modal.innerHTML = `
    <div style="background:var(--cream, #fdfaf6);max-width:680px;width:100%;max-height:90vh;overflow:auto;border-radius:12px;padding:24px;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;">
        <h2 style="margin:0;">${escapeHtml(quiz.title || 'Section Quiz')}</h2>
        <button class="btn btn-ghost btn-sm" onclick="closeSectionQuiz()"><i class="fa-solid fa-xmark"></i></button>
      </div>
      ${quiz.is_optional ? '<p class="text-muted text-sm">This quiz is optional — your progress is saved either way.</p>' : ''}
      ${qHtml}
      <button class="btn btn-primary" onclick="submitSectionQuiz()"><i class="fa-solid fa-check"></i> Submit Quiz</button>
    </div>`;
}

function setQuizAnswer(qIdx, choiceIdx) {
  if (!NUMA_NEW._activeQuiz) return;
  NUMA_NEW._activeQuiz.answers[qIdx] = choiceIdx;
}

function closeSectionQuiz() {
  const m = document.getElementById('numa-quiz-modal');
  if (m) m.remove();
  NUMA_NEW._activeQuiz = null;
}

async function submitSectionQuiz() {
  const a = NUMA_NEW._activeQuiz;
  if (!a) return;
  // Re-fetch with admin answer keys not available, so we send answers; server scores would be safer.
  // Since the public endpoint strips correct answers, we do client-side scoring via a second admin call—
  // but as a student, we can't. So: we send the chosen indexes and let the backend NOT score
  // (we'll score 0 if no key). Simpler: store answers, present a self-grade workflow.
  // Practical approach: also expose a scoring endpoint OR have the editor stash correct_index unprotected.
  // For now: ask backend for the key via a dedicated scoring call.
  const startedAt = new Date(a.startedAt).toISOString();
  const timeSpent = Math.round((Date.now() - a.startedAt) / 1000);
  const scoringRes = await apiCall(`/api/sections/${encodeURIComponent(a.sectionId)}/quiz/score`, {
    method: 'POST',
    body: JSON.stringify({ answers: a.answers })
  });
  let score = 0, total = a.quiz.questions.length;
  if (scoringRes && typeof scoringRes.score === 'number') {
    score = scoringRes.score;
    total = scoringRes.total || total;
  } else {
    // Fallback: count answered as 0 — server will fix later
    score = 0;
  }
  await apiCall(`/api/sections/${encodeURIComponent(a.sectionId)}/quiz/attempts`, {
    method: 'POST',
    body: JSON.stringify({
      score, total,
      time_spent_seconds: timeSpent,
      started_at: startedAt,
      attempt_data: a.answers
    })
  });
  const pct = total ? Math.round((score / total) * 100) : 0;
  alert(`Quiz submitted!\nYour score: ${score} / ${total} (${pct}%)\nTime: ${formatDuration(timeSpent)}`);
  closeSectionQuiz();
}

// =============================================================================
// ===== DISCUSSION FORUM =====================================================
// =============================================================================
// =============================================================================
// ===== DISCUSSION FORUM — chat-room style ===================================
// =============================================================================
// Injects chat CSS once (so we don't depend on style.css edits).
function _ensureChatStyles() {
  if (document.getElementById('numa-chat-styles')) return;
  const css = `
  .chat-shell{display:flex;flex-direction:column;height:calc(100vh - 200px);min-height:520px;background:#fafaf7;border:1px solid #e6dfd1;border-radius:14px;overflow:hidden;}
  .chat-header{padding:14px 18px;background:#fff;border-bottom:1px solid #e6dfd1;display:flex;align-items:center;gap:12px;}
  .chat-header h2{margin:0;font-size:17px;color:#3b2f24;}
  .chat-header .chat-sub{font-size:12px;color:#8a7a6a;}
  .chat-stream{flex:1 1 auto;overflow-y:auto;padding:18px 16px 12px;display:flex;flex-direction:column;gap:4px;}
  .chat-empty{margin:auto;text-align:center;color:#8a7a6a;font-size:14px;}
  .chat-day-divider{align-self:center;margin:10px 0 4px;padding:3px 12px;border-radius:999px;background:#fff;border:1px solid #e6dfd1;color:#8a7a6a;font-size:11px;letter-spacing:.4px;text-transform:uppercase;}
  .chat-row{display:flex;gap:10px;align-items:flex-end;max-width:78%;}
  .chat-row.me{align-self:flex-end;flex-direction:row-reverse;}
  .chat-avatar{width:34px;height:34px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:600;font-size:13px;flex-shrink:0;box-shadow:0 1px 2px rgba(0,0,0,.06);}
  .chat-bubble{background:#fff;border:1px solid #ece4d5;padding:9px 13px;border-radius:16px;color:#3b2f24;white-space:pre-wrap;word-wrap:break-word;line-height:1.45;font-size:14.5px;position:relative;}
  .chat-row.me .chat-bubble{background:#A38D78;color:#fff;border-color:#A38D78;}
  .chat-row.staff .chat-bubble{background:#fff8ee;border-color:#e8d9b8;}
  .chat-meta{font-size:11px;color:#8a7a6a;margin:6px 4px 2px;}
  .chat-row.me .chat-meta{text-align:right;}
  .chat-name{font-weight:600;color:#3b2f24;}
  .chat-staff-pill{display:inline-block;background:#A38D78;color:#fff;font-size:10px;padding:1px 7px;border-radius:999px;margin-left:5px;letter-spacing:.3px;}
  .chat-actions{display:none;gap:6px;position:absolute;top:-12px;right:8px;background:#fff;border:1px solid #e6dfd1;border-radius:8px;padding:2px 4px;box-shadow:0 2px 4px rgba(0,0,0,.05);}
  .chat-row.me .chat-actions{right:auto;left:8px;}
  .chat-bubble:hover .chat-actions{display:inline-flex;}
  .chat-act-btn{background:transparent;border:0;color:#8a7a6a;font-size:12px;padding:2px 6px;cursor:pointer;border-radius:5px;}
  .chat-act-btn:hover{background:#f3ece0;color:#3b2f24;}
  .chat-pin-banner{padding:10px 14px;background:#fff8ee;border-bottom:1px solid #e8d9b8;color:#5a4a36;font-size:13px;display:flex;align-items:flex-start;gap:8px;}
  .chat-pin-banner i{color:#A38D78;margin-top:3px;}
  .chat-thread-link{align-self:flex-start;margin-left:46px;margin-top:2px;font-size:11.5px;color:#A38D78;cursor:pointer;text-decoration:none;display:inline-flex;gap:4px;align-items:center;background:transparent;border:0;padding:2px 0;}
  .chat-row.me + .chat-thread-link{align-self:flex-end;margin-left:0;margin-right:46px;}
  .chat-thread-link:hover{text-decoration:underline;}
  .chat-composer{border-top:1px solid #e6dfd1;background:#fff;padding:10px 12px;display:flex;gap:8px;align-items:flex-end;}
  .chat-composer textarea{flex:1 1 auto;resize:none;border:1px solid #e6dfd1;border-radius:12px;padding:10px 14px;font-family:inherit;font-size:14.5px;line-height:1.4;background:#fafaf7;color:#3b2f24;max-height:140px;outline:none;}
  .chat-composer textarea:focus{border-color:#A38D78;background:#fff;}
  .chat-send{background:#A38D78;color:#fff;border:0;width:42px;height:42px;border-radius:50%;display:flex;align-items:center;justify-content:center;cursor:pointer;flex-shrink:0;}
  .chat-send:hover{background:#8e7967;}
  .chat-send:disabled{opacity:.45;cursor:not-allowed;}
  .chat-thread-back{background:transparent;border:0;color:#A38D78;cursor:pointer;font-size:13px;display:inline-flex;align-items:center;gap:5px;padding:0;}
  .chat-disclaimer{padding:8px 14px 10px;background:#fafaf7;border-top:1px solid #f0e9da;color:#8a7a6a;font-size:11.5px;line-height:1.45;display:flex;align-items:flex-start;gap:7px;}
  .chat-disclaimer i{color:#A38D78;margin-top:2px;flex-shrink:0;}
  .chat-disclaimer strong{color:#5a4a36;font-weight:600;}

  /* Two-pane topic forum */
  .forum-2pane{display:grid;grid-template-columns:340px 1fr;gap:0;height:calc(100vh - 200px);min-height:560px;background:#fafaf7;border:1px solid #e6dfd1;border-radius:14px;overflow:hidden;}
  .topic-pane{display:flex;flex-direction:column;background:#fff;border-right:1px solid #e6dfd1;min-width:0;}
  .topic-pane-head{padding:14px 16px;border-bottom:1px solid #e6dfd1;display:flex;align-items:center;gap:8px;}
  .topic-pane-head h3{margin:0;font-size:15px;color:#3b2f24;flex:1;}
  .topic-new-btn{background:#A38D78;color:#fff;border:0;padding:7px 13px;border-radius:8px;font-size:12.5px;font-weight:600;cursor:pointer;display:inline-flex;align-items:center;gap:5px;}
  .topic-new-btn:hover{background:#8e7967;}
  .topic-list{flex:1 1 auto;overflow-y:auto;}
  .topic-empty{padding:30px 20px;text-align:center;color:#8a7a6a;font-size:13.5px;}
  .topic-card{padding:12px 14px;border-bottom:1px solid #f0e9da;cursor:pointer;display:flex;flex-direction:column;gap:4px;position:relative;transition:background .12s;}
  .topic-card:hover{background:#fafaf2;}
  .topic-card.active{background:#f5ede0;border-left:3px solid #A38D78;padding-left:11px;}
  .topic-card-top{display:flex;align-items:center;gap:6px;}
  .topic-card-title{font-weight:600;font-size:14px;color:#3b2f24;flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
  .topic-card-time{font-size:11px;color:#8a7a6a;flex-shrink:0;}
  .topic-card-preview{font-size:12.5px;color:#6a5d4d;line-height:1.4;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;}
  .topic-card-meta{display:flex;align-items:center;gap:10px;font-size:11.5px;color:#8a7a6a;margin-top:2px;}
  .topic-card-author{color:#8a7a6a;}
  .topic-card-replies{display:inline-flex;align-items:center;gap:3px;}
  .topic-pin-badge{color:#A38D78;}
  .topic-unread-badge{background:#A38D78;color:#fff;font-size:10.5px;font-weight:700;padding:1px 7px;border-radius:999px;margin-left:auto;}
  .topic-card.unread .topic-card-title{font-weight:700;}
  .chat-pane{display:flex;flex-direction:column;min-width:0;background:#fafaf7;}
  .chat-pane-empty{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;color:#8a7a6a;text-align:center;padding:30px;}
  .chat-pane-empty i{font-size:48px;color:#c7b9a3;margin-bottom:14px;}
  .chat-pane-empty h3{margin:0 0 6px;color:#3b2f24;font-size:17px;font-weight:600;}
  .chat-pane .chat-shell{height:100%;border:0;border-radius:0;}

  /* New Topic modal */
  .topic-modal-backdrop{position:fixed;inset:0;background:rgba(40,30,20,.45);display:flex;align-items:center;justify-content:center;z-index:9999;}
  .topic-modal{background:#fff;border-radius:14px;width:min(520px,92vw);box-shadow:0 8px 30px rgba(0,0,0,.18);overflow:hidden;}
  .topic-modal-head{padding:14px 18px;border-bottom:1px solid #e6dfd1;display:flex;align-items:center;}
  .topic-modal-head h3{margin:0;font-size:16px;color:#3b2f24;flex:1;}
  .topic-modal-close{background:transparent;border:0;color:#8a7a6a;cursor:pointer;font-size:18px;}
  .topic-modal-body{padding:16px 18px;}
  .topic-modal-body label{display:block;font-size:12.5px;font-weight:600;color:#3b2f24;margin-bottom:5px;}
  .topic-modal-body input,.topic-modal-body textarea{width:100%;border:1px solid #e6dfd1;border-radius:10px;padding:10px 12px;font-family:inherit;font-size:14px;background:#fafaf7;color:#3b2f24;outline:none;box-sizing:border-box;}
  .topic-modal-body input:focus,.topic-modal-body textarea:focus{border-color:#A38D78;background:#fff;}
  .topic-modal-body textarea{resize:vertical;min-height:90px;margin-top:0;}
  .topic-modal-foot{padding:12px 18px 16px;display:flex;justify-content:flex-end;gap:8px;}
  .topic-modal-foot .btn-cancel{background:transparent;border:1px solid #e6dfd1;color:#3b2f24;padding:8px 14px;border-radius:9px;cursor:pointer;font-size:13px;}
  .topic-modal-foot .btn-create{background:#A38D78;color:#fff;border:0;padding:8px 16px;border-radius:9px;cursor:pointer;font-size:13px;font-weight:600;}
  .topic-modal-foot .btn-create:disabled{opacity:.5;cursor:not-allowed;}
  .topic-modal-hint{font-size:11.5px;color:#8a7a6a;margin-top:4px;}

  @media(max-width:780px){
    .forum-2pane{grid-template-columns:1fr;height:calc(100vh - 180px);}
    .topic-pane{display:flex;}
    .forum-2pane.show-chat .topic-pane{display:none;}
    .forum-2pane:not(.show-chat) .chat-pane{display:none;}
  }
  `;
  const el = document.createElement('style');
  el.id = 'numa-chat-styles';
  el.textContent = css;
  document.head.appendChild(el);
}

function _chatInitials(name) {
  const s = (name || 'User').trim();
  const parts = s.split(/\s+/);
  return ((parts[0]?.[0] || 'U') + (parts[1]?.[0] || '')).toUpperCase();
}
// Deterministic color per author from a small brand-friendly palette
function _chatAvatarColor(name, isStaff) {
  if (isStaff) return '#A38D78';
  const palette = ['#6b8e7e','#7a8aab','#9b7a8e','#8f7a55','#7a8a6e','#a07a6e','#6e8a92'];
  let h = 0; for (let i = 0; i < (name||'').length; i++) h = (h*31 + name.charCodeAt(i)) >>> 0;
  return palette[h % palette.length];
}
function _chatTimeLabel(d) {
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  const yest = new Date(now); yest.setDate(yest.getDate() - 1);
  const isYest = d.toDateString() === yest.toDateString();
  if (isToday) return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  if (isYest)  return 'Yesterday ' + d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ' ' + d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}
function _chatDayLabel(d) {
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  if (isToday) return 'Today';
  const yest = new Date(now); yest.setDate(yest.getDate() - 1);
  if (d.toDateString() === yest.toDateString()) return 'Yesterday';
  return d.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });
}
function _chatBubble(msg, ctx) {
  const me = APP.currentUser;
  const isMe = msg.user_id === me?.id;
  const isStaff = msg.author_role === 'admin';
  const isAdmin = !!me?.isAdmin;
  const canDelete = isAdmin || msg.user_id === me?.id;
  const name = msg.author_name || 'User';
  const avatar = `<div class="chat-avatar" style="background:${_chatAvatarColor(name, isStaff)};" title="${escapeAttr(name)}">${_chatInitials(name)}</div>`;
  const meta = `<div class="chat-meta"><span class="chat-name">${escapeHtml(name)}</span>${isStaff ? '<span class="chat-staff-pill">Staff</span>' : ''} <span style="opacity:.7;">• ${_chatTimeLabel(new Date(msg.created_at))}</span></div>`;
  const pinAct = ctx.threadMode && isAdmin ? `<button class="chat-act-btn" title="${msg.is_pinned?'Unpin':'Pin'}" onclick="toggleForumPin(${msg.id}, ${!msg.is_pinned})"><i class="fa-solid fa-thumbtack"></i></button>` : '';
  const delAct = canDelete ? `<button class="chat-act-btn" title="Delete" onclick="deleteForumPost(${msg.id}, ${ctx.isTop ? 'true' : 'false'}, ${ctx.parentId || 'null'})"><i class="fa-solid fa-trash"></i></button>` : '';
  const actions = (pinAct || delAct) ? `<div class="chat-actions">${pinAct}${delAct}</div>` : '';
  // Top-of-list (channel feed) shows the bubble + an explicit "View replies" link
  let threadLink = '';
  if (ctx.feedMode) {
    const count = msg.reply_count || 0;
    threadLink = `<button class="chat-thread-link" onclick="navigate('forum-thread',{id:${msg.id}})"><i class="fa-solid fa-comment-dots"></i> ${count === 0 ? 'Reply in thread' : (count + ' repl' + (count === 1 ? 'y' : 'ies'))}</button>`;
  }
  return `
    <div class="chat-row ${isMe ? 'me' : ''} ${isStaff && !isMe ? 'staff' : ''}">
      ${avatar}
      <div style="min-width:0;">
        ${meta}
        <div class="chat-bubble">${escapeHtml(msg.body || '')}${actions}</div>
      </div>
    </div>
    ${threadLink}`;
}

function _chatStreamHtml(messages, ctx) {
  if (!messages.length) {
    return '<div class="chat-empty"><i class="fa-regular fa-comments" style="font-size:36px;color:#c7b9a3;display:block;margin-bottom:10px;"></i>No messages yet — say hi.</div>';
  }
  let html = '';
  let lastDay = '';
  messages.forEach(m => {
    const d = new Date(m.created_at);
    const dayKey = d.toDateString();
    if (dayKey !== lastDay) {
      html += `<div class="chat-day-divider">${_chatDayLabel(d)}</div>`;
      lastDay = dayKey;
    }
    html += _chatBubble(m, ctx);
  });
  return html;
}

function _scrollChatToBottom() {
  const s = document.getElementById('chat-stream');
  if (s) s.scrollTop = s.scrollHeight;
}

// Renders the chat shell once; subsequent loads update the stream only.
function _renderChatShell({ title, subtitle, composerPlaceholder, onSend, threadBack, pinned }) {
  _ensureChatStyles();
  const pinHtml = pinned ? `<div class="chat-pin-banner"><i class="fa-solid fa-thumbtack"></i><div><div style="font-weight:600;margin-bottom:2px;">Pinned</div>${escapeHtml(pinned.body || '').slice(0,200)}${(pinned.body||'').length > 200 ? '…' : ''}</div></div>` : '';
  const backBtn = threadBack ? `<button class="chat-thread-back" onclick="navigate('forum');return false;"><i class="fa-solid fa-chevron-left"></i> Back to channel</button>` : '';
  return `
    <div class="chat-shell fade-in">
      <div class="chat-header">
        ${backBtn}
        <div style="flex:1;min-width:0;">
          <h2><i class="fa-solid fa-comments" style="color:#A38D78;margin-right:6px;"></i> ${escapeHtml(title)}</h2>
          <div class="chat-sub">${escapeHtml(subtitle || '')}</div>
        </div>
      </div>
      ${pinHtml}
      <div class="chat-stream" id="chat-stream"><div class="chat-empty">Loading…</div></div>
      <div class="chat-composer">
        <textarea id="chat-input" rows="1" placeholder="${escapeAttr(composerPlaceholder || 'Type a message…')}" oninput="_chatAutoGrow(this)" onkeydown="_chatKeydown(event, ${onSend})"></textarea>
        <button class="chat-send" id="chat-send-btn" onclick="(${onSend})()" title="Send (Enter)"><i class="fa-solid fa-paper-plane"></i></button>
      </div>
    </div>`;
}

function _chatAutoGrow(t) {
  t.style.height = 'auto';
  t.style.height = Math.min(t.scrollHeight, 140) + 'px';
}
window._chatAutoGrow = _chatAutoGrow;

function _chatKeydown(e, sendFn) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    if (typeof sendFn === 'function') sendFn();
  }
}
window._chatKeydown = _chatKeydown;

// ----- Topic-based two-pane forum ------------------------------------------
// Topic state (kept on window so inline handlers can reach it)
window.NUMA_FORUM = window.NUMA_FORUM || { topics: [], selectedId: null, isAdmin: false };

function _forumRelTime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now - d;
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return mins + 'm';
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return hrs + 'h';
  const days = Math.floor(hrs / 24);
  if (days < 7) return days + 'd';
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function _renderForumShell({ isAdmin }) {
  _ensureChatStyles();
  const titleText = isAdmin ? 'Discussion Forum (admin)' : 'Discussion Forum';
  return `
    <div class="forum-2pane fade-in" id="forum-2pane">
      <div class="topic-pane">
        <div class="topic-pane-head">
          <h3><i class="fa-solid fa-comments" style="color:#A38D78;margin-right:6px;"></i>${escapeHtml(titleText)}</h3>
          <button class="topic-new-btn" onclick="openNewTopicModal()" title="Start a new topic"><i class="fa-solid fa-plus"></i> New</button>
        </div>
        <div class="topic-list" id="topic-list"><div class="topic-empty">Loading…</div></div>
      </div>
      <div class="chat-pane" id="chat-pane">
        <div class="chat-pane-empty">
          <i class="fa-regular fa-comments"></i>
          <h3>Pick a topic</h3>
          <div>Select a conversation on the left to read and reply.</div>
        </div>
      </div>
    </div>`;
}

function renderForumList() {
  window.NUMA_FORUM.isAdmin = false;
  setTimeout(loadForumTopics, 0);
  return _renderForumShell({ isAdmin: false });
}

function renderAdminForum() {
  window.NUMA_FORUM.isAdmin = true;
  setTimeout(loadForumTopics, 0);
  return _renderForumShell({ isAdmin: true });
}

// Old route still works — redirect to selecting that topic
function renderForumThread() {
  const id = APP.viewParams?.id;
  if (id) window.NUMA_FORUM.selectedId = id;
  setTimeout(() => {
    loadForumTopics().then(() => { if (id) selectTopic(id); });
  }, 0);
  return _renderForumShell({ isAdmin: !!APP.currentUser?.isAdmin });
}

async function loadForumTopics() {
  const topics = await apiCall('/api/forum/posts') || [];
  // Sort: pinned first, then most recent activity
  topics.sort((a, b) => {
    if ((b.is_pinned ? 1 : 0) !== (a.is_pinned ? 1 : 0)) return (b.is_pinned ? 1 : 0) - (a.is_pinned ? 1 : 0);
    const at = new Date(a.last_activity_at || a.created_at).getTime();
    const bt = new Date(b.last_activity_at || b.created_at).getTime();
    return bt - at;
  });
  window.NUMA_FORUM.topics = topics;
  renderTopicList();
  // If a topic is selected, re-render its pane too
  if (window.NUMA_FORUM.selectedId) {
    const stillThere = topics.find(t => t.id === window.NUMA_FORUM.selectedId);
    if (stillThere) selectTopic(window.NUMA_FORUM.selectedId, { silent: true });
  }
}

function renderTopicList() {
  const list = document.getElementById('topic-list');
  if (!list) return;
  const topics = window.NUMA_FORUM.topics || [];
  if (!topics.length) {
    list.innerHTML = `<div class="topic-empty"><i class="fa-regular fa-comments" style="font-size:32px;color:#c7b9a3;display:block;margin-bottom:10px;"></i>No topics yet.<br><br><button class="topic-new-btn" onclick="openNewTopicModal()"><i class="fa-solid fa-plus"></i> Start the first topic</button></div>`;
    return;
  }
  const selectedId = window.NUMA_FORUM.selectedId;
  list.innerHTML = topics.map(t => {
    const title = t.title && t.title.trim()
      ? t.title
      : ((t.body || 'Untitled').split('\n')[0].slice(0, 60) + ((t.body || '').length > 60 ? '…' : ''));
    const preview = (t.last_message_body || t.body || '').replace(/\s+/g, ' ').slice(0, 120);
    const author = t.last_message_author || t.author_name || 'User';
    const replies = t.reply_count || 0;
    const unread = t.unread_count || 0;
    const active = selectedId === t.id ? 'active' : '';
    const unreadCls = unread > 0 && selectedId !== t.id ? 'unread' : '';
    const pinIcon = t.is_pinned ? '<i class="fa-solid fa-thumbtack topic-pin-badge" title="Pinned"></i>' : '';
    const unreadBadge = unread > 0 && selectedId !== t.id ? `<span class="topic-unread-badge">${unread > 99 ? '99+' : unread}</span>` : '';
    return `
      <div class="topic-card ${active} ${unreadCls}" onclick="selectTopic(${t.id})">
        <div class="topic-card-top">
          ${pinIcon}
          <div class="topic-card-title">${escapeHtml(title)}</div>
          <div class="topic-card-time">${_forumRelTime(t.last_activity_at || t.created_at)}</div>
        </div>
        <div class="topic-card-preview"><span class="topic-card-author">${escapeHtml(author)}:</span> ${escapeHtml(preview)}</div>
        <div class="topic-card-meta">
          <span class="topic-card-replies"><i class="fa-regular fa-comment"></i> ${replies} ${replies === 1 ? 'reply' : 'replies'}</span>
          ${unreadBadge}
        </div>
      </div>`;
  }).join('');
}

async function selectTopic(id, opts = {}) {
  window.NUMA_FORUM.selectedId = id;
  // On mobile: show chat pane
  const root = document.getElementById('forum-2pane');
  if (root) root.classList.add('show-chat');
  // Re-render list to highlight selection
  renderTopicList();
  // Mount the chat shell into the chat-pane (replacing the placeholder)
  const chatPane = document.getElementById('chat-pane');
  if (!chatPane) return;
  const topic = (window.NUMA_FORUM.topics || []).find(t => t.id === id) || {};
  const title = topic.title && topic.title.trim()
    ? topic.title
    : ((topic.body || 'Topic').split('\n')[0].slice(0, 60) + ((topic.body || '').length > 60 ? '…' : ''));
  const replies = topic.reply_count || 0;
  const starter = topic.author_name || 'User';
  chatPane.innerHTML = `
    <div class="chat-shell">
      <div class="chat-header">
        <button class="chat-thread-back" onclick="closeTopicOnMobile()" style="display:none;" id="chat-back-mobile"><i class="fa-solid fa-chevron-left"></i> Topics</button>
        <div style="flex:1;min-width:0;">
          <h2 style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;"><i class="fa-solid fa-comments" style="color:#A38D78;margin-right:6px;"></i>${escapeHtml(title)}</h2>
          <div class="chat-sub">${replies} ${replies === 1 ? 'reply' : 'replies'} • Started by ${escapeHtml(starter)}</div>
        </div>
      </div>
      <div class="chat-stream" id="chat-stream"><div class="chat-empty">Loading…</div></div>
      <div class="chat-composer">
        <textarea id="chat-input" rows="1" placeholder="Reply to this topic…" oninput="_chatAutoGrow(this)" onkeydown="_chatKeydown(event, () => replyForumThread(${id}))"></textarea>
        <button class="chat-send" id="chat-send-btn" onclick="replyForumThread(${id})" title="Send (Enter)"><i class="fa-solid fa-paper-plane"></i></button>
      </div>
      <div class="chat-disclaimer">
        <i class="fa-solid fa-heart"></i>
        <div><strong>Keep it respectful</strong> — no profanity or vulgar language. Use this chat to ask each other questions, share tips &amp; tricks in teaching or cueing, or offer advice and encouragement.</div>
      </div>
    </div>`;
  // Show mobile back button when narrow
  const backBtn = document.getElementById('chat-back-mobile');
  if (backBtn && window.matchMedia('(max-width:780px)').matches) backBtn.style.display = 'inline-flex';
  await loadForumThread(id);
  // Mark read (best-effort)
  try {
    await apiCall(`/api/forum/posts/${id}/read`, { method: 'POST' });
    // Clear unread in local cache
    const t = (window.NUMA_FORUM.topics || []).find(x => x.id === id);
    if (t) t.unread_count = 0;
    renderTopicList();
  } catch (e) { /* ignore */ }
}

window.selectTopic = selectTopic;
window.loadForumTopics = loadForumTopics;

function closeTopicOnMobile() {
  const root = document.getElementById('forum-2pane');
  if (root) root.classList.remove('show-chat');
}
window.closeTopicOnMobile = closeTopicOnMobile;

async function loadForumThread(id) {
  const data = await apiCall(`/api/forum/posts/${id}`);
  const stream = document.getElementById('chat-stream');
  if (!stream || !data) return;
  const top = data.post;
  const replies = data.replies || [];
  const all = [top, ...replies].sort((a,b) => new Date(a.created_at) - new Date(b.created_at));
  let html = '';
  // Pin banner if pinned
  const chatHeader = document.querySelector('#chat-pane .chat-header');
  let pinBanner = document.querySelector('#chat-pane .chat-pin-banner');
  if (top.is_pinned && !pinBanner && chatHeader) {
    pinBanner = document.createElement('div');
    pinBanner.className = 'chat-pin-banner';
    pinBanner.innerHTML = `<i class="fa-solid fa-thumbtack"></i><div><div style="font-weight:600;margin-bottom:2px;">Pinned by staff</div>${escapeHtml((top.body || '').slice(0, 200))}${(top.body||'').length > 200 ? '…' : ''}</div>`;
    chatHeader.after(pinBanner);
  } else if (!top.is_pinned && pinBanner) {
    pinBanner.remove();
  }
  // Admin pin toggle in header
  if (APP.currentUser?.isAdmin && chatHeader && !chatHeader.querySelector('.chat-pin-toggle')) {
    const btn = document.createElement('button');
    btn.className = 'chat-act-btn chat-pin-toggle';
    btn.title = top.is_pinned ? 'Unpin topic' : 'Pin topic';
    btn.innerHTML = `<i class="fa-solid fa-thumbtack"></i>`;
    btn.style.cssText = 'background:#fafaf7;border:1px solid #e6dfd1;padding:6px 9px;border-radius:8px;color:' + (top.is_pinned ? '#A38D78' : '#8a7a6a') + ';';
    btn.onclick = () => toggleForumPin(top.id, !top.is_pinned);
    chatHeader.appendChild(btn);
  }
  html = _chatStreamHtml(all, { threadMode: true, isTop: false, parentId: top.id });
  stream.innerHTML = html;
  _scrollChatToBottom();
}

async function replyForumThread(parentId) {
  const input = document.getElementById('chat-input');
  const body = (input?.value || '').trim();
  if (!body) return;
  const btn = document.getElementById('chat-send-btn');
  if (btn) btn.disabled = true;
  const out = await apiCall('/api/forum/posts', { method: 'POST', body: JSON.stringify({ body, parent_id: parentId }) });
  if (btn) btn.disabled = false;
  if (out) {
    if (input) { input.value = ''; _chatAutoGrow(input); input.focus(); }
    await loadForumThread(parentId);
    // Refresh topic list so previews / counts update
    loadForumTopics();
  } else {
    alert('Could not post reply.');
  }
}
window.replyForumThread = replyForumThread;
window.deleteForumPost = (id, isTop, parentId) => deleteForumPost(id, isTop, parentId);
window.toggleForumPin = (id, pin) => toggleForumPin(id, pin);

// New-topic modal
function openNewTopicModal() {
  // Avoid double-open
  if (document.getElementById('topic-modal-backdrop')) return;
  const backdrop = document.createElement('div');
  backdrop.id = 'topic-modal-backdrop';
  backdrop.className = 'topic-modal-backdrop';
  backdrop.innerHTML = `
    <div class="topic-modal" onclick="event.stopPropagation()">
      <div class="topic-modal-head">
        <h3><i class="fa-solid fa-comments" style="color:#A38D78;margin-right:6px;"></i> New Topic</h3>
        <button class="topic-modal-close" onclick="closeNewTopicModal()" title="Close"><i class="fa-solid fa-xmark"></i></button>
      </div>
      <div class="topic-modal-body">
        <label for="new-topic-title">Topic title</label>
        <input id="new-topic-title" type="text" maxlength="120" placeholder="e.g. Cueing the hundred for beginners" />
        <div class="topic-modal-hint">Up to 120 characters. Make it specific so others know what's inside.</div>
        <div style="height:12px;"></div>
        <label for="new-topic-body">First message</label>
        <textarea id="new-topic-body" rows="4" placeholder="Start the conversation…"></textarea>
      </div>
      <div class="topic-modal-foot">
        <button class="btn-cancel" onclick="closeNewTopicModal()">Cancel</button>
        <button class="btn-create" id="new-topic-create" onclick="submitNewTopic()"><i class="fa-solid fa-paper-plane"></i> Create topic</button>
      </div>
    </div>`;
  backdrop.onclick = () => closeNewTopicModal();
  document.body.appendChild(backdrop);
  setTimeout(() => document.getElementById('new-topic-title')?.focus(), 50);
}
window.openNewTopicModal = openNewTopicModal;

function closeNewTopicModal() {
  const el = document.getElementById('topic-modal-backdrop');
  if (el) el.remove();
}
window.closeNewTopicModal = closeNewTopicModal;

async function submitNewTopic() {
  const titleEl = document.getElementById('new-topic-title');
  const bodyEl = document.getElementById('new-topic-body');
  const title = (titleEl?.value || '').trim();
  const body = (bodyEl?.value || '').trim();
  if (!title) { alert('Please enter a topic title.'); titleEl?.focus(); return; }
  if (!body) { alert('Please enter a first message.'); bodyEl?.focus(); return; }
  const btn = document.getElementById('new-topic-create');
  if (btn) btn.disabled = true;
  const out = await apiCall('/api/forum/posts', { method: 'POST', body: JSON.stringify({ title, body }) });
  if (btn) btn.disabled = false;
  if (out && out.id) {
    closeNewTopicModal();
    await loadForumTopics();
    selectTopic(out.id);
  } else {
    alert('Could not create topic.');
  }
}
window.submitNewTopic = submitNewTopic;

// Legacy postForumMessage: opens the new-topic modal (top-level posts now require a title)
async function postForumMessage() {
  openNewTopicModal();
}
window.postForumMessage = postForumMessage;

async function deleteForumPost(id, isTop, parentId) {
  if (!confirm(isTop ? 'Delete this entire topic and all replies?' : 'Delete this message?')) return;
  await apiCall(`/api/forum/posts/${id}`, { method: 'DELETE' });
  if (isTop) {
    window.NUMA_FORUM.selectedId = null;
    const chatPane = document.getElementById('chat-pane');
    if (chatPane) chatPane.innerHTML = `
      <div class="chat-pane-empty">
        <i class="fa-regular fa-comments"></i>
        <h3>Pick a topic</h3>
        <div>Select a conversation on the left to read and reply.</div>
      </div>`;
    loadForumTopics();
  } else if (parentId) {
    loadForumThread(parentId);
    loadForumTopics();
  } else {
    loadForumTopics();
  }
}

async function toggleForumPin(id, pin) {
  await apiCall(`/api/admin/forum/posts/${id}`, { method: 'PUT', body: JSON.stringify({ is_pinned: pin }) });
  // Update local cache
  const t = (window.NUMA_FORUM.topics || []).find(x => x.id === id);
  if (t) t.is_pinned = pin;
  await loadForumTopics();
  if (window.NUMA_FORUM.selectedId === id) {
    // Re-render thread to update pin banner
    loadForumThread(id);
  }
}

// =============================================================================
// ===== Small helpers =========================================================
// =============================================================================
function escapeHtml(s) {
  if (s === null || s === undefined) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
function escapeAttr(s) {
  if (s === null || s === undefined) return '';
  return String(s).replace(/"/g, '&quot;').replace(/&/g, '&amp;');
}

// =============================================================================
// ===== Extend hashchange routing for new views ==============================
// =============================================================================
(function extendPopstate() {
  window.addEventListener('popstate', () => {
    const hash = window.location.hash.replace('#', '');
    const parts = hash.split('/');
    if (parts[0] === 'progress') navigate('progress');
    else if (parts[0] === 'questions') navigate('questions');
    else if (parts[0] === 'question-detail' && parts[1]) navigate('question-detail', { id: parseInt(parts[1], 10) });
    else if (parts[0] === 'forum') navigate('forum');
    else if (parts[0] === 'forum-thread' && parts[1]) navigate('forum-thread', { id: parseInt(parts[1], 10) });
  });
})();

// =============================================================================
// ===== Patch module page: "Mark Complete" + "Take Section Quiz" buttons =====
// =============================================================================
// Cache of section IDs that actually have a quiz with questions.
window.NUMA_SECTIONS_WITH_QUIZ = window.NUMA_SECTIONS_WITH_QUIZ || null;
async function loadSectionsWithQuiz(force) {
  if (!force && window.NUMA_SECTIONS_WITH_QUIZ) return window.NUMA_SECTIONS_WITH_QUIZ;
  try {
    const list = await apiCall('/api/sections-with-quiz');
    window.NUMA_SECTIONS_WITH_QUIZ = new Set(Array.isArray(list) ? list.map(String) : []);
  } catch (_) {
    window.NUMA_SECTIONS_WITH_QUIZ = new Set();
  }
  return window.NUMA_SECTIONS_WITH_QUIZ;
}
window.loadSectionsWithQuiz = loadSectionsWithQuiz;

(function patchModulePage() {
  if (typeof renderModulePage !== 'function') return;
  const _orig = renderModulePage;
  window.renderModulePage = function(moduleId, sectionId) {
    let html = _orig(moduleId, sectionId);
    const mod = (typeof COURSE_MODULES !== 'undefined') ? COURSE_MODULES.find(m => m.id === moduleId) : null;
    const section = mod && (sectionId ? mod.sections.find(s => s.id === sectionId) : mod.sections[0]);
    if (!section || section.isQuiz) return html;
    const isAdmin = !!APP.currentUser?.isAdmin;
    // Only render the quiz button if this section has a quiz with questions.
    // We check the cached set synchronously; if cache is empty, kick off a load
    // and re-render the buttons in place once it resolves.
    const cache = window.NUMA_SECTIONS_WITH_QUIZ;
    const hasQuizNow = cache ? cache.has(String(section.id)) : false;
    const btnsId = 'sec-action-btns-' + section.id;
    const buildBtns = (hasQuiz) => `
      <div class="card slide-up" id="${btnsId}" style="margin-top:16px;">
        <div class="card-body" style="display:flex;gap:10px;flex-wrap:wrap;align-items:center;">
          <button class="btn btn-primary" onclick="markSectionCompleteUI('${section.id}', this)">
            <i class="fa-solid fa-check"></i> Mark Section Complete
          </button>
          ${hasQuiz ? `<button class="btn btn-secondary" onclick="openSectionQuiz('${section.id}')">
            <i class="fa-solid fa-clipboard-question"></i> Take Section Quiz
          </button>` : ''}
          ${isAdmin ? `<button class="btn btn-ghost" onclick="navigate('admin',{view:'section-quiz',sectionId:'${section.id}',moduleId:${moduleId}})"><i class="fa-solid fa-pen"></i> ${hasQuiz ? 'Edit' : 'Add'} Section Quiz</button>` : ''}
        </div>
      </div>`;
    const buttons = buildBtns(hasQuizNow);
    // Kick off cache load + re-render if needed
    if (!cache) {
      setTimeout(async () => {
        const set = await loadSectionsWithQuiz();
        const el = document.getElementById(btnsId);
        if (el) el.outerHTML = buildBtns(set.has(String(section.id)));
      }, 0);
    }
    // Insert before the module-nav-buttons (next/prev) or at end
    if (html.includes('module-nav-buttons')) {
      html = html.replace('module-nav-buttons', buttons + '<div class="module-nav-buttons" data-marker="x"');
    } else {
      html += buttons;
    }
    return html;
  };
  renderModulePage = window.renderModulePage;
})();

async function markSectionCompleteUI(sectionId, btnEl) {
  if (btnEl) { btnEl.disabled = true; btnEl.innerHTML = '<i class="fa-solid fa-check"></i> Completed'; }
  await markSectionComplete(sectionId, true);
}

// =============================================================================
// ===== Extend dashboard with backend progress bar (if available) ============
// =============================================================================
(function extendDashboard() {
  if (typeof renderDashboard !== 'function') return;
  const _orig = renderDashboard;
  window.renderDashboard = function() {
    setTimeout(async () => {
      await loadMyProgress(true);
      const overall = overallProgressPct();
      // If we got server progress, overwrite the dashboard's first progress card
      const firstFill = document.querySelector('.stat-card .progress-bar-fill');
      if (firstFill && overall > 0) {
        firstFill.style.width = overall + '%';
        const valEl = firstFill.parentElement?.previousElementSibling;
        if (valEl) valEl.textContent = overall + '%';
      }
    }, 0);
    return _orig();
  };
  renderDashboard = window.renderDashboard;
})();

// =============================================================================
// ===== MODULE-END QUIZ EDITOR (admin) =========================================
// =============================================================================
// Lets admin edit the questions/answers for the required end-of-module quiz.
// Saves to backend (module_quiz_overrides table). On app load, overrides are
// fetched and merged into COURSE_MODULES so students see the edited version.
// =============================================================================

// State for the in-progress quiz edit (mutated by UI handlers)
window._mqEditState = null;

function renderAdminModuleQuizEditor(moduleId) {
  const mod = (typeof COURSE_MODULES !== 'undefined') ? COURSE_MODULES.find(m => String(m.id) === String(moduleId)) : null;
  if (!mod) {
    return `<div class="page-header fade-in"><h1>Module Not Found</h1></div>
      <button class="btn btn-secondary" onclick="navigate('admin',{view:'modules'})">Back to Modules</button>`;
  }
  // Kick off async load
  setTimeout(() => loadModuleQuizForEdit(moduleId), 50);
  return `
    <div class="breadcrumb fade-in">
      <a href="#" onclick="navigate('admin',{view:'modules'});return false;">Modules</a>
      <i class="fa-solid fa-chevron-right" style="font-size:10px;"></i>
      <a href="#" onclick="navigate('admin',{view:'editModule',moduleId:'${escapeAttr(moduleId)}'});return false;">${escapeHtml(mod.title)}</a>
      <i class="fa-solid fa-chevron-right" style="font-size:10px;"></i>
      <span>Edit Quiz</span>
    </div>
    <div class="page-header fade-in" style="margin-top:8px;">
      <h1><i class="fa-solid fa-question-circle"></i> Module ${escapeHtml(String(mod.id))} Quiz Editor</h1>
      <p>${escapeHtml(mod.title)} &middot; Edit questions, answer choices, and the correct answer.</p>
    </div>
    <div style="margin-bottom:16px;display:flex;gap:8px;flex-wrap:wrap;">
      <button class="btn btn-secondary" onclick="navigate('admin',{view:'editModule',moduleId:'${escapeAttr(moduleId)}'})"><i class="fa-solid fa-arrow-left"></i> Back to Module</button>
      <button class="btn btn-secondary" onclick="resetModuleQuizToDefault('${escapeAttr(moduleId)}')" title="Revert to the hardcoded default questions"><i class="fa-solid fa-rotate-left"></i> Reset to default</button>
    </div>
    <div id="mq-editor-body"><p class="text-muted">Loading quiz...</p></div>
  `;
}

async function loadModuleQuizForEdit(moduleId) {
  const mod = COURSE_MODULES.find(m => String(m.id) === String(moduleId));
  if (!mod) return;
  let questions = null;
  let isOverride = false;
  if (API_BASE) {
    try {
      const res = await apiCall(`/api/admin/module-quiz/${encodeURIComponent(moduleId)}`);
      if (res && res.override && Array.isArray(res.override.questions)) {
        questions = res.override.questions;
        isOverride = true;
      }
    } catch (e) {
      console.warn('Could not load override, using default', e);
    }
  }
  // Fall back to the hardcoded default (deep clone so edits don't mutate it)
  if (!questions) {
    questions = JSON.parse(JSON.stringify(mod.quiz || []));
  }
  window._mqEditState = { moduleId, questions, isOverride, originalSnapshot: JSON.stringify(questions) };
  renderModuleQuizEditorBody();
}

function renderModuleQuizEditorBody() {
  const state = window._mqEditState;
  const body = document.getElementById('mq-editor-body');
  if (!state || !body) return;
  const { questions, isOverride } = state;
  body.innerHTML = `
    <div class="card slide-up"><div class="card-body">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;flex-wrap:wrap;gap:10px;">
        <div>
          <strong>${questions.length} question${questions.length === 1 ? '' : 's'}</strong>
          ${isOverride ? '<span class="badge" style="background:var(--cream-dark);color:var(--charcoal);margin-left:8px;">Custom (saved override)</span>' : '<span class="badge" style="background:var(--cream-dark);color:var(--charcoal-muted);margin-left:8px;">Default (no override yet)</span>'}
        </div>
        <div style="display:flex;gap:8px;">
          <button class="btn btn-secondary btn-sm" onclick="addModuleQuizQuestion()"><i class="fa-solid fa-plus"></i> Add question</button>
          <button class="btn btn-primary btn-sm" onclick="saveModuleQuizOverride()"><i class="fa-solid fa-floppy-disk"></i> Save changes</button>
        </div>
      </div>
      <div id="mq-questions-list">
        ${questions.map((q, i) => renderModuleQuizQuestionRow(q, i)).join('')}
      </div>
      <div id="mq-save-status" style="margin-top:12px;"></div>
      <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:16px;">
        <button class="btn btn-secondary btn-sm" onclick="addModuleQuizQuestion()"><i class="fa-solid fa-plus"></i> Add question</button>
        <button class="btn btn-primary btn-sm" onclick="saveModuleQuizOverride()"><i class="fa-solid fa-floppy-disk"></i> Save changes</button>
      </div>
    </div></div>
  `;
}

function renderModuleQuizQuestionRow(q, idx) {
  const opts = q.opts || [];
  const correct = (typeof q.correct === 'number') ? q.correct : 0;
  return `
    <div class="card" style="margin-bottom:12px;border:1px solid var(--cream-darker);"><div class="card-body">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:10px;margin-bottom:10px;flex-wrap:wrap;">
        <strong style="font-size:0.95rem;">Question ${idx + 1}</strong>
        <div style="display:flex;gap:4px;">
          <button class="btn btn-ghost btn-sm" onclick="moveModuleQuizQuestion(${idx},-1)" ${idx === 0 ? 'disabled style="opacity:0.3;"' : ''} title="Move up"><i class="fa-solid fa-arrow-up"></i></button>
          <button class="btn btn-ghost btn-sm" onclick="moveModuleQuizQuestion(${idx},1)" title="Move down"><i class="fa-solid fa-arrow-down"></i></button>
          <button class="btn btn-ghost btn-sm" onclick="deleteModuleQuizQuestion(${idx})" title="Delete this question" style="color:var(--error);"><i class="fa-solid fa-trash"></i></button>
        </div>
      </div>
      <div class="form-group">
        <label style="font-size:0.85rem;">Question text</label>
        <textarea class="form-control" rows="2" oninput="updateMqField(${idx},'q',this.value)">${escapeHtml(q.q || '')}</textarea>
      </div>
      <div style="margin-top:8px;">
        <label style="font-size:0.85rem;display:block;margin-bottom:6px;">Answer choices &middot; <span class="text-muted">click the radio to mark the correct answer</span></label>
        ${opts.map((opt, optIdx) => `
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
            <input type="radio" name="mq-correct-${idx}" ${optIdx === correct ? 'checked' : ''} onchange="updateMqCorrect(${idx}, ${optIdx})" style="margin:0;">
            <input type="text" class="form-control" value="${escapeAttr(opt)}" oninput="updateMqOption(${idx}, ${optIdx}, this.value)" placeholder="Option ${optIdx + 1}" style="flex:1;">
            <button class="btn btn-ghost btn-sm" onclick="deleteMqOption(${idx}, ${optIdx})" ${opts.length <= 2 ? 'disabled style="opacity:0.3;"' : ''} title="Remove this option" style="color:var(--error);"><i class="fa-solid fa-xmark"></i></button>
          </div>
        `).join('')}
        <button class="btn btn-ghost btn-sm" onclick="addMqOption(${idx})" style="margin-top:4px;"><i class="fa-solid fa-plus"></i> Add option</button>
      </div>
    </div></div>
  `;
}

// === State mutation handlers ===
function updateMqField(idx, field, value) {
  const s = window._mqEditState; if (!s) return;
  if (!s.questions[idx]) return;
  s.questions[idx][field] = value;
}
function updateMqOption(qIdx, optIdx, value) {
  const s = window._mqEditState; if (!s || !s.questions[qIdx]) return;
  s.questions[qIdx].opts[optIdx] = value;
}
function updateMqCorrect(qIdx, optIdx) {
  const s = window._mqEditState; if (!s || !s.questions[qIdx]) return;
  s.questions[qIdx].correct = optIdx;
}
function addMqOption(qIdx) {
  const s = window._mqEditState; if (!s || !s.questions[qIdx]) return;
  s.questions[qIdx].opts.push('');
  renderModuleQuizEditorBody();
}
function deleteMqOption(qIdx, optIdx) {
  const s = window._mqEditState; if (!s || !s.questions[qIdx]) return;
  if (s.questions[qIdx].opts.length <= 2) return;
  s.questions[qIdx].opts.splice(optIdx, 1);
  // Adjust correct index if needed
  if (s.questions[qIdx].correct === optIdx) s.questions[qIdx].correct = 0;
  else if (s.questions[qIdx].correct > optIdx) s.questions[qIdx].correct -= 1;
  renderModuleQuizEditorBody();
}
function addModuleQuizQuestion() {
  const s = window._mqEditState; if (!s) return;
  s.questions.push({ q: '', opts: ['', '', '', ''], correct: 0 });
  renderModuleQuizEditorBody();
}
function deleteModuleQuizQuestion(idx) {
  if (!confirm('Delete this question? This cannot be undone until you reload without saving.')) return;
  const s = window._mqEditState; if (!s) return;
  s.questions.splice(idx, 1);
  renderModuleQuizEditorBody();
}
function moveModuleQuizQuestion(idx, dir) {
  const s = window._mqEditState; if (!s) return;
  const newIdx = idx + dir;
  if (newIdx < 0 || newIdx >= s.questions.length) return;
  const [item] = s.questions.splice(idx, 1);
  s.questions.splice(newIdx, 0, item);
  renderModuleQuizEditorBody();
}

async function saveModuleQuizOverride() {
  const s = window._mqEditState; if (!s) return;
  const statusEl = document.getElementById('mq-save-status');
  // Client-side validation
  for (let i = 0; i < s.questions.length; i++) {
    const q = s.questions[i];
    if (!q.q || !q.q.trim()) {
      statusEl.innerHTML = `<span style="color:var(--error);">Question ${i + 1} is missing text.</span>`;
      return;
    }
    if (!Array.isArray(q.opts) || q.opts.length < 2) {
      statusEl.innerHTML = `<span style="color:var(--error);">Question ${i + 1} needs at least 2 answer choices.</span>`;
      return;
    }
    if (q.opts.some(o => !o || !String(o).trim())) {
      statusEl.innerHTML = `<span style="color:var(--error);">Question ${i + 1} has a blank answer choice.</span>`;
      return;
    }
    if (typeof q.correct !== 'number' || q.correct < 0 || q.correct >= q.opts.length) {
      statusEl.innerHTML = `<span style="color:var(--error);">Question ${i + 1} needs a correct answer selected.</span>`;
      return;
    }
  }
  if (!API_BASE) {
    statusEl.innerHTML = '<span style="color:var(--error);">Backend not connected. Cannot save.</span>';
    return;
  }
  statusEl.innerHTML = '<span class="text-muted">Saving…</span>';
  try {
    const res = await apiCall(`/api/admin/module-quiz/${encodeURIComponent(s.moduleId)}`, {
      method: 'PUT',
      body: JSON.stringify({ questions: s.questions })
    });
    if (res && res.ok) {
      // Apply override immediately to COURSE_MODULES so the change is live
      const mod = COURSE_MODULES.find(m => String(m.id) === String(s.moduleId));
      if (mod) mod.quiz = JSON.parse(JSON.stringify(s.questions));
      s.isOverride = true;
      statusEl.innerHTML = '<span style="color:var(--success);"><i class="fa-solid fa-check"></i> Saved. Students will see the updated quiz on their next attempt.</span>';
      renderModuleQuizEditorBody();
    } else {
      statusEl.innerHTML = `<span style="color:var(--error);">Save failed: ${escapeHtml((res && res.error) || 'unknown error')}</span>`;
    }
  } catch (e) {
    statusEl.innerHTML = `<span style="color:var(--error);">Save failed: ${escapeHtml(e.message || 'network error')}</span>`;
  }
}

async function resetModuleQuizToDefault(moduleId) {
  if (!confirm('Revert this quiz back to the original hardcoded questions? Any custom edits will be lost.')) return;
  if (!API_BASE) { alert('Backend not connected.'); return; }
  try {
    await apiCall(`/api/admin/module-quiz/${encodeURIComponent(moduleId)}`, { method: 'DELETE' });
    // Reload the editor with defaults
    await loadModuleQuizForEdit(moduleId);
  } catch (e) {
    alert('Reset failed: ' + (e.message || 'unknown error'));
  }
}

// =============================================================================
// ===== APPLY MODULE-QUIZ OVERRIDES ON APP LOAD ===============================
// =============================================================================
// Fetch all saved overrides once the user is logged in, then merge into the
// in-memory COURSE_MODULES array. This way students see the latest edited
// quiz without needing a code deploy.
// =============================================================================
async function applyModuleQuizOverrides() {
  if (!API_BASE) return;
  if (typeof COURSE_MODULES === 'undefined') return;
  try {
    const res = await apiCall('/api/module-quiz-overrides');
    if (!res || !res.overrides) return;
    Object.entries(res.overrides).forEach(([modId, questions]) => {
      const mod = COURSE_MODULES.find(m => String(m.id) === String(modId));
      if (mod && Array.isArray(questions) && questions.length > 0) {
        mod.quiz = questions;
      }
    });
  } catch (e) {
    console.warn('Could not load module quiz overrides', e);
  }
}

// Hook into the login flow — wrap the existing `render()` call after auth
(function hookOverrideLoader() {
  // Run once on script load if the user is already authed (page refresh)
  setTimeout(() => {
    if (APP && APP.currentUser && API_BASE) {
      applyModuleQuizOverrides().then(() => {
        // Trigger a re-render only if we're on the quiz/module view
        if (APP.currentView === 'module' || APP.currentView === 'dashboard') {
          if (typeof render === 'function') render();
        }
      });
    }
  }, 500);
  // Also re-apply after any successful login. We patch handleLogin if present.
  if (typeof handleLogin === 'function') {
    const _orig = handleLogin;
    window.handleLogin = async function(...args) {
      const r = await _orig.apply(this, args);
      try { await applyModuleQuizOverrides(); } catch (e) {}
      return r;
    };
    handleLogin = window.handleLogin;
  }
})();

// =============================================================================
// ===== PROGRAM SETTINGS (HOUR REQUIREMENTS) ==================================
// =============================================================================
// Admin can edit the required hours for observation, teaching, personal
// practice, and total. Values are persisted server-side in the
// program_settings table and cached on window._programSettings for synchronous
// access by render functions.
// =============================================================================

// Defaults — used until the server responds (and as fallback if API is down)
window._programSettings = window._programSettings || {
  hour_requirements: { observation: 100, teaching: 200, personal: 150, total: 450 }
};

function getHourReq(type) {
  const r = (window._programSettings && window._programSettings.hour_requirements) || {};
  const n = Number(r[type]);
  return Number.isFinite(n) ? n : 0;
}

async function loadProgramSettings() {
  if (!API_BASE) return;
  try {
    const res = await apiCall('/api/program-settings');
    if (res && res.settings) {
      window._programSettings = res.settings;
      // Make sure hour_requirements always exists
      if (!window._programSettings.hour_requirements) {
        window._programSettings.hour_requirements = { observation: 100, teaching: 200, personal: 150, total: 450 };
      }
    }
  } catch (e) {
    console.warn('Could not load program settings', e);
  }
}

// Kick off load on script start, and again after successful login
(function hookProgramSettingsLoader() {
  setTimeout(() => {
    if (APP && APP.currentUser && API_BASE) {
      loadProgramSettings();
    }
  }, 600);
  if (typeof handleLogin === 'function') {
    const _orig = handleLogin;
    window.handleLogin = async function(...args) {
      const r = await _orig.apply(this, args);
      try { await loadProgramSettings(); } catch (e) {}
      return r;
    };
    handleLogin = window.handleLogin;
  }
})();

// === Admin editor UI ===
function renderProgramSettingsEditor() {
  // Kick off load to make sure we have fresh values
  setTimeout(() => {
    loadProgramSettings().then(() => populateProgramSettingsForm());
  }, 50);
  return `
    <div class="breadcrumb fade-in">
      <a href="#" onclick="navigate('admin',{view:'dashboard'});return false;">Admin</a>
      <i class="fa-solid fa-chevron-right" style="font-size:10px;"></i>
      <span>Program Settings</span>
    </div>
    <div class="page-header fade-in" style="margin-top:8px;">
      <h1><i class="fa-solid fa-sliders"></i> Program Settings</h1>
      <p>Edit the hour requirements students must complete for certification.</p>
    </div>
    <div class="card slide-up"><div class="card-body">
      <h3 style="margin-top:0;">Hour Requirements</h3>
      <p class="text-muted" style="margin-bottom:20px;">These targets show up on every student's Hour Logging page and on the dashboard. NPCP-aligned defaults are 100 / 200 / 150 / 450, but you can set them to whatever your program requires.</p>
      <div id="ps-form-body"><p class="text-muted">Loading current values…</p></div>
    </div></div>
  `;
}

function populateProgramSettingsForm() {
  const body = document.getElementById('ps-form-body');
  if (!body) return;
  const r = (window._programSettings && window._programSettings.hour_requirements) || {};
  const obs = r.observation ?? 100;
  const teach = r.teaching ?? 200;
  const personal = r.personal ?? 150;
  const total = r.total ?? 450;
  body.innerHTML = `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;max-width:640px;">
      <div class="form-group">
        <label for="ps-obs">Observation hours</label>
        <input type="number" min="0" step="1" id="ps-obs" class="form-control" value="${obs}">
        <small class="text-muted">Hours watching certified instructors teach</small>
      </div>
      <div class="form-group">
        <label for="ps-teach">Teaching practicum hours</label>
        <input type="number" min="0" step="1" id="ps-teach" class="form-control" value="${teach}">
        <small class="text-muted">Hours student spends teaching real classes</small>
      </div>
      <div class="form-group">
        <label for="ps-personal">Personal practice hours</label>
        <input type="number" min="0" step="1" id="ps-personal" class="form-control" value="${personal}">
        <small class="text-muted">Hours of student's own Pilates practice</small>
      </div>
      <div class="form-group">
        <label for="ps-total">Total hours required</label>
        <input type="number" min="0" step="1" id="ps-total" class="form-control" value="${total}">
        <small class="text-muted">Grand total shown on the dashboard</small>
      </div>
    </div>
    <div style="display:flex;gap:12px;align-items:center;margin-top:12px;flex-wrap:wrap;">
      <button class="btn btn-primary" onclick="saveProgramSettings()"><i class="fa-solid fa-floppy-disk"></i> Save changes</button>
      <button class="btn btn-secondary" onclick="resetHourRequirementsToDefault()"><i class="fa-solid fa-rotate-left"></i> Reset to NPCP defaults (100 / 200 / 150 / 450)</button>
      <span id="ps-save-status" class="text-muted"></span>
    </div>
  `;
}

async function saveProgramSettings() {
  const statusEl = document.getElementById('ps-save-status');
  const obs = Number(document.getElementById('ps-obs').value);
  const teach = Number(document.getElementById('ps-teach').value);
  const personal = Number(document.getElementById('ps-personal').value);
  const total = Number(document.getElementById('ps-total').value);
  for (const [name, val] of [['observation', obs], ['teaching', teach], ['personal', personal], ['total', total]]) {
    if (!Number.isFinite(val) || val < 0) {
      statusEl.innerHTML = `<span style="color:var(--error);">${name} must be a non-negative number</span>`;
      return;
    }
  }
  if (!API_BASE) {
    statusEl.innerHTML = '<span style="color:var(--error);">Backend not connected.</span>';
    return;
  }
  statusEl.innerHTML = '<span class="text-muted">Saving…</span>';
  try {
    const res = await apiCall('/api/admin/program-settings/hour_requirements', {
      method: 'PUT',
      body: JSON.stringify({ value: { observation: obs, teaching: teach, personal: personal, total: total } })
    });
    if (res && res.ok) {
      window._programSettings.hour_requirements = res.setting.value;
      statusEl.innerHTML = '<span style="color:var(--success);"><i class="fa-solid fa-check"></i> Saved. Students will see the new requirements immediately.</span>';
    } else {
      statusEl.innerHTML = `<span style="color:var(--error);">Save failed: ${escapeHtml((res && res.error) || 'unknown error')}</span>`;
    }
  } catch (e) {
    statusEl.innerHTML = `<span style="color:var(--error);">Save failed: ${escapeHtml(e.message || 'network error')}</span>`;
  }
}

function resetHourRequirementsToDefault() {
  if (!confirm('Reset hour requirements to NPCP defaults (100 / 200 / 150 / 450)?')) return;
  document.getElementById('ps-obs').value = 100;
  document.getElementById('ps-teach').value = 200;
  document.getElementById('ps-personal').value = 150;
  document.getElementById('ps-total').value = 450;
  saveProgramSettings();
}

// =============================================================================
// ===== MERGE MODULE/SECTION OVERRIDES FROM BACKEND ===========================
// =============================================================================
// renderModulePage() reads from the hardcoded COURSE_MODULES constant in
// content.js. The admin module editor writes to the database. Without this
// merger, admin edits never reach students.
//
// On app load (and after login), fetch the live module data from /api/modules
// and overwrite the matching section content/title in COURSE_MODULES so the
// student view shows the latest version. Sections that exist ONLY in the DB
// (newly added) are also injected. Sections deleted from the DB stay hidden.
// =============================================================================

let _moduleContentLoaded = false;

async function applyModuleContentOverrides() {
  if (!API_BASE) return;
  if (typeof COURSE_MODULES === 'undefined') return;
  try {
    const list = await apiCall('/api/modules');
    if (!Array.isArray(list)) return;

    for (const m of list) {
      // Fetch full module with sections
      const detail = await apiCall(`/api/modules/${encodeURIComponent(m.id)}`);
      if (!detail || !Array.isArray(detail.sections)) continue;

      // Find the matching module in the hardcoded list (try both string + number id)
      const courseMod = COURSE_MODULES.find(cm =>
        String(cm.id) === String(m.id) || cm.id === Number(m.id)
      );
      if (!courseMod) continue;

      // Optionally update top-level module metadata if present
      if (detail.title) courseMod.title = detail.title;
      if (detail.subtitle) courseMod.subtitle = detail.subtitle;
      if (detail.description) courseMod.description = detail.description;

      // Preserve special bundled sections that may not exist in DB:
      // - Quiz sections (id ending in -quiz with isQuiz: true) keep their structure
      // - Sections with custom render flags
      const dbSectionsById = {};
      detail.sections.forEach(s => { dbSectionsById[String(s.id)] = s; });

      // 1) Update existing hardcoded sections that match DB rows
      courseMod.sections = (courseMod.sections || []).map(cs => {
        const dbS = dbSectionsById[String(cs.id)];
        if (!dbS) return cs;            // not in DB; keep as-is (e.g. quizzes)
        // Merge: keep cs's special flags (isQuiz, etc.), override title + content
        return {
          ...cs,
          title: dbS.title || cs.title,
          content: dbS.content != null ? dbS.content : cs.content
        };
      });

      // 2) Add brand-new sections (in DB but not in the hardcoded array).
      //    Insert them in DB sort order, before any quiz section if present.
      const existingIds = new Set(courseMod.sections.map(s => String(s.id)));
      const newOnes = detail.sections
        .filter(s => !existingIds.has(String(s.id)))
        .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
        .map(s => ({ id: s.id, title: s.title, content: s.content || '' }));

      if (newOnes.length) {
        // Insert before the first quiz section (so the quiz stays last)
        const quizIdx = courseMod.sections.findIndex(s => s.isQuiz);
        if (quizIdx === -1) {
          courseMod.sections = [...courseMod.sections, ...newOnes];
        } else {
          courseMod.sections = [
            ...courseMod.sections.slice(0, quizIdx),
            ...newOnes,
            ...courseMod.sections.slice(quizIdx)
          ];
        }
      }
    }

    _moduleContentLoaded = true;
    console.log('[numa] applied module content overrides from backend');

    // If user is currently viewing a module, re-render so they see fresh content
    try {
      if (APP && APP.currentView === 'module' && typeof render === 'function') render();
    } catch (e) {}
  } catch (e) {
    console.warn('Could not apply module content overrides', e);
  }
}

// Kick off on script load if already authed, and after login
(function hookModuleContentLoader() {
  setTimeout(() => {
    if (APP && APP.currentUser && API_BASE) {
      applyModuleContentOverrides();
    }
  }, 700);
  if (typeof handleLogin === 'function') {
    const _orig = handleLogin;
    window.handleLogin = async function(...args) {
      const r = await _orig.apply(this, args);
      try { await applyModuleContentOverrides(); } catch (e) {}
      return r;
    };
    handleLogin = window.handleLogin;
  }
})();

// Also re-apply when the admin saves a section so the change is visible
// immediately without a page reload. We monkey-patch saveSection if present.
(function hookSaveSection() {
  if (typeof saveSection !== 'function') return;
  const _orig = saveSection;
  window.saveSection = async function(...args) {
    const r = await _orig.apply(this, args);
    try {
      _moduleContentLoaded = false;
      await applyModuleContentOverrides();
    } catch (e) {}
    return r;
  };
  saveSection = window.saveSection;
})();

// Quick publish/unpublish toggle from the Course Content Manager list.
// Fetches the current module, flips is_published, and PUTs the full body
// back (the backend's PUT requires all the editable fields).
async function quickTogglePublish(moduleId, makePublished) {
  if (!API_BASE) {
    alert('Backend not connected — cannot toggle publish state.');
    return;
  }
  // Get current module data so we preserve all the other fields
  const current = await apiCall('/api/modules/' + encodeURIComponent(moduleId));
  if (!current || current.error) {
    // The public endpoint might 404 unpublished modules; fall back to admin-all
    const all = await apiCall('/api/admin/modules-all');
    if (Array.isArray(all)) {
      const found = all.find(m => String(m.id) === String(moduleId));
      if (found) {
        return _doTogglePublish(found, makePublished);
      }
    }
    alert('Could not find this module to update. Try refreshing the page.');
    return;
  }
  return _doTogglePublish(current, makePublished);
}

async function _doTogglePublish(mod, makePublished) {
  const payload = {
    title: mod.title,
    subtitle: mod.subtitle,
    description: mod.description,
    icon: mod.icon,
    sort_order: mod.sort_order,
    is_published: !!makePublished
  };
  const res = await apiCall('/api/admin/modules/' + encodeURIComponent(mod.id), {
    method: 'PUT',
    body: JSON.stringify(payload)
  });
  if (res && !res.error) {
    _adminModulesCache = null;
    // Re-render the module manager so the badge + button flip
    if (typeof renderModuleManager === 'function') {
      // Trigger a fresh load of the manager view
      navigate('admin', { view: 'modules' });
    }
  } else {
    alert('Update failed: ' + ((res && res.error) || 'unknown error'));
  }
}

// ============================================================
// Admin: sync students list from backend into localStorage
// ------------------------------------------------------------
// The admin pages render the students table from getUsers() which reads
// localStorage. Students live in the Railway Postgres DB, so when the admin
// signs in on a fresh browser, the local list is empty. This pulls the
// canonical student list from the backend and merges it into numa_users so
// every existing admin view (Students table, Gradebook, etc.) just works.
async function syncStudentsFromBackend() {
  if (!API_BASE) return false;
  if (!APP.currentUser || !APP.currentUser.isAdmin) return false;
  const rows = await apiCall('/api/admin/students');
  if (!rows || rows.error || !Array.isArray(rows)) {
    console.warn('[admin] could not fetch students from backend', rows);
    return false;
  }

  const local = getUsers();
  const byUsername = {};
  local.forEach(u => { byUsername[u.username] = u; });

  rows.forEach(row => {
    const existing = byUsername[row.username];
    if (existing) {
      // Refresh server-owned fields, keep local progress fields intact
      existing.fullName = row.full_name || existing.fullName || row.username;
      existing.email = row.email || existing.email;
      existing.createdAt = row.created_at || existing.createdAt;
      existing.enrollmentCode = row.enrollment_code || existing.enrollmentCode;
      existing.backendId = row.id;
    } else {
      const fresh = createDefaultUserData(row.username, row.full_name || row.username);
      fresh.email = row.email || '';
      fresh.createdAt = row.created_at || new Date().toISOString();
      fresh.enrollmentCode = row.enrollment_code || '';
      fresh.backendId = row.id;
      local.push(fresh);
      byUsername[row.username] = fresh;
    }
  });

  // Persist the merged list
  try { _sSet('numa_users', JSON.stringify(local)); }
  catch (e) { console.warn('[admin] failed to save merged users', e); }
  return true;
}

// Wrap renderAdminContent so the first paint kicks off a background sync.
// We render immediately (so the page never blanks) and re-render once the
// fresh data arrives. Guarded so a single navigation only syncs once.
(function wrapAdminRenderForSync() {
  if (typeof renderAdminContent !== 'function') return;
  const _orig = renderAdminContent;
  let _syncInFlight = false;
  let _lastSyncedAt = 0;
  window.renderAdminContent = function() {
    const now = Date.now();
    // Refresh at most every 5 seconds to avoid render loops
    if (!_syncInFlight && (now - _lastSyncedAt) > 5000 && APP.currentUser && APP.currentUser.isAdmin) {
      _syncInFlight = true;
      syncStudentsFromBackend().then(changed => {
        _lastSyncedAt = Date.now();
        _syncInFlight = false;
        if (changed) {
          // Re-render with fresh data, but only if we're still on an admin view
          if (APP.currentUser && APP.currentUser.isAdmin) {
            try { render(); } catch (e) {}
          }
        }
      });
    }
    return _orig.apply(this, arguments);
  };
  renderAdminContent = window.renderAdminContent;
})();

// Also kick off a sync immediately after admin login.
(function wrapHandleLoginForStudentSync() {
  if (typeof handleLogin !== 'function') return;
  const _orig = handleLogin;
  window.handleLogin = async function(...args) {
    const ret = await _orig.apply(this, args);
    if (APP.currentUser && APP.currentUser.isAdmin) {
      try { await syncStudentsFromBackend(); render(); } catch (e) {}
    }
    return ret;
  };
  handleLogin = window.handleLogin;
})();

// ============================================================
// Student writes that were ONLY saving to localStorage:
//   - module quiz scores
//   - practice hours
//   - scenario submissions
// These wrappers POST to the backend after the local save so admins
// can see real progress. They're safe to call even if offline: the
// local save still happens, and the POST quietly fails.
// ------------------------------------------------------------

// 1. Module quiz scores
(function wrapSubmitQuizForBackend() {
  if (typeof submitQuiz !== 'function') return;
  const _orig = submitQuiz;
  window.submitQuiz = function(...args) {
    const ret = _orig.apply(this, args);
    try {
      const state = window._quizState;
      if (state && state.submitted && APP.currentUser && !APP.currentUser.isAdmin && API_BASE) {
        const totalQ = state.questions ? state.questions.length : 0;
        const correctCount = typeof state.correct === 'number' ? state.correct
          : Math.round((state.score / 100) * totalQ);
        apiCall('/api/quiz-scores', {
          method: 'POST',
          body: JSON.stringify({
            module_id: state.moduleId,
            score: correctCount,
            total: totalQ,
            time_spent_seconds: state.timeSpent || null,
            attempt_data: { answers: state.answers || [], percentage: state.score }
          })
        }).catch(e => console.warn('[quiz-score sync]', e));
      }
    } catch (e) { console.warn('[quiz-score sync]', e); }
    return ret;
  };
  submitQuiz = window.submitQuiz;
})();

// 2. Practice hours
// Backend category column is a single string; map our local types onto it.
(function wrapAddHourEntryForBackend() {
  if (typeof addHourEntry !== 'function') return;
  const _orig = addHourEntry;
  window.addHourEntry = function(type, ...rest) {
    // Capture inputs BEFORE _orig runs (it consumes the form fields)
    const dateEl = document.getElementById('log-date');
    const hoursEl = document.getElementById('log-hours');
    const date = dateEl ? dateEl.value : null;
    const hours = hoursEl ? parseFloat(hoursEl.value) : null;
    let notesObj = {};
    if (type === 'observation') {
      notesObj = {
        location: document.getElementById('log-location')?.value || '',
        instructor: document.getElementById('log-instructor')?.value || ''
      };
    } else if (type === 'teaching') {
      notesObj = {
        classType: document.getElementById('log-classtype')?.value || '',
        supervisor: document.getElementById('log-supervisor')?.value || ''
      };
    } else {
      notesObj = {
        practiceType: document.getElementById('log-practicetype')?.value || ''
      };
    }
    notesObj.date = date;

    const ret = _orig.apply(this, [type, ...rest]);

    try {
      if (APP.currentUser && !APP.currentUser.isAdmin && API_BASE && date && hours > 0) {
        apiCall('/api/hours', {
          method: 'POST',
          body: JSON.stringify({
            category: type,
            hours: hours,
            notes: JSON.stringify(notesObj)
          })
        }).catch(e => console.warn('[hours sync]', e));
      }
    } catch (e) { console.warn('[hours sync]', e); }
    return ret;
  };
  addHourEntry = window.addHourEntry;
})();

// 3. Scenario submissions
(function wrapSubmitScenarioForBackend() {
  if (typeof submitScenario !== 'function') return;
  const _orig = submitScenario;
  window.submitScenario = function(scenarioId, ...rest) {
    // Capture the responses BEFORE _orig clears the form
    let captured = [];
    try {
      const sc = (typeof SCENARIO_POOL !== 'undefined') ? SCENARIO_POOL.find(s => s.id === scenarioId) : null;
      if (sc && sc.prompts) {
        sc.prompts.forEach((_, i) => {
          const el = document.getElementById('scenario-resp-' + i);
          captured.push(el ? el.value : '');
        });
      }
    } catch (e) {}

    const ret = _orig.apply(this, [scenarioId, ...rest]);

    try {
      if (APP.currentUser && !APP.currentUser.isAdmin && API_BASE) {
        const responseText = captured.join('\n\n---\n\n');
        const wordCount = responseText.split(/\s+/).filter(Boolean).length;
        apiCall('/api/scenarios', {
          method: 'POST',
          body: JSON.stringify({
            scenario_id: String(scenarioId),
            response: responseText,
            word_count: wordCount,
            flagged: false,
            flag_reason: null
          })
        }).catch(e => console.warn('[scenario sync]', e));
      }
    } catch (e) { console.warn('[scenario sync]', e); }
    return ret;
  };
  submitScenario = window.submitScenario;
})();

// ============================================================
// One-time backfill: push everything currently in this user's
// localStorage to the backend. A student can run this from the
// browser console after logging in to recover "lost" progress.
// Usage in browser console:  await pushMyLocalProgress();
// ------------------------------------------------------------
async function pushMyLocalProgress() {
  if (!APP.currentUser || APP.currentUser.isAdmin) {
    console.warn('Must be logged in as a student');
    return;
  }
  if (!API_BASE) {
    console.warn('Backend not configured');
    return;
  }
  const u = APP.currentUser;
  let pushed = { quizzes: 0, hours: 0, scenarios: 0 };

  // Quiz scores
  if (u.quizScores) {
    for (const [moduleId, pct] of Object.entries(u.quizScores)) {
      const total = 10;
      const score = Math.round((pct / 100) * total);
      const r = await apiCall('/api/quiz-scores', {
        method: 'POST',
        body: JSON.stringify({
          module_id: parseInt(moduleId, 10),
          score, total,
          time_spent_seconds: null,
          attempt_data: { backfilled: true, percentage: pct }
        })
      });
      if (r && !r.error) pushed.quizzes++;
    }
  }

  // Hours
  if (u.hourLogs) {
    for (const type of ['observation', 'teaching', 'personal']) {
      const entries = u.hourLogs[type] || [];
      for (const e of entries) {
        const r = await apiCall('/api/hours', {
          method: 'POST',
          body: JSON.stringify({
            category: type,
            hours: parseFloat(e.hours) || 0,
            notes: JSON.stringify({ ...e, backfilled: true })
          })
        });
        if (r && !r.error) pushed.hours++;
      }
    }
  }

  // Scenarios
  if (Array.isArray(u.scenarioSubmissions)) {
    for (const s of u.scenarioSubmissions) {
      const responseText = Array.isArray(s.responses) ? s.responses.join('\n\n---\n\n') : '';
      const wordCount = responseText.split(/\s+/).filter(Boolean).length;
      const r = await apiCall('/api/scenarios', {
        method: 'POST',
        body: JSON.stringify({
          scenario_id: String(s.scenarioId),
          response: responseText,
          word_count: wordCount,
          flagged: false,
          flag_reason: null
        })
      });
      if (r && !r.error) pushed.scenarios++;
    }
  }

  console.log('Backfill complete:', pushed);
  alert('Backfill complete!\n' + pushed.quizzes + ' quiz scores, ' + pushed.hours + ' hour logs, ' + pushed.scenarios + ' scenarios sent to the database.');
  return pushed;
}
window.pushMyLocalProgress = pushMyLocalProgress;

// ============================================================
// ENROLLMENT MANAGEMENT (Admin)
// ------------------------------------------------------------
// Adds: delete student button, edit student enrollment metadata
// (program track, tuition), and a Pathways admin page.
// All these features write to the backend; the admin views are
// rendered fresh from the backend each time so there is no
// localStorage drift to worry about.
// ============================================================

// Cache for pathway settings and the live student list (with new fields)
const NUMA_ENROLL = {
  studentListCache: null,
  studentListAt: 0,
  pathwayCache: null,
  pathwayAt: 0
};

async function fetchStudentsFresh() {
  const list = await apiCall('/api/admin/students');
  if (Array.isArray(list)) {
    NUMA_ENROLL.studentListCache = list;
    NUMA_ENROLL.studentListAt = Date.now();
  }
  return Array.isArray(list) ? list : [];
}

async function fetchPathways() {
  if (NUMA_ENROLL.pathwayCache && (Date.now() - NUMA_ENROLL.pathwayAt < 30000)) {
    return NUMA_ENROLL.pathwayCache;
  }
  const r = await apiCall('/api/program-settings');
  const settings = (r && r.settings) || {};
  // Defaults so built-in tracks always show even if program_settings row is missing
  const defaults = {
    mat: { required_module_ids: [], hour_requirements: null, label: 'Mat Certification' },
    reformer: { required_module_ids: [], hour_requirements: null, label: 'Reformer Certification' },
    both: { required_module_ids: [], hour_requirements: null, label: 'Mat + Reformer Certification' }
  };
  const pathways = { ...defaults };
  // Pick up every program_settings row that starts with pathway_
  Object.keys(settings).forEach(key => {
    if (key.indexOf('pathway_') === 0) {
      const slug = key.slice('pathway_'.length);
      if (slug) pathways[slug] = settings[key] || {};
    }
  });
  NUMA_ENROLL.pathwayCache = pathways;
  NUMA_ENROLL.pathwayAt = Date.now();
  return pathways;
}

// Built-in track labels; custom tracks supply their own .label in the pathway record
function trackLabel(track) {
  if (!track) return 'Not assigned';
  if (track === 'mat') return 'Mat Certification';
  if (track === 'reformer') return 'Reformer Certification';
  if (track === 'both') return 'Mat + Reformer';
  // Fall back to a Title-Cased version of the slug for custom tracks
  return String(track).replace(/[-_]+/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

// Resolve a human-readable label for any track slug using the cached pathway record
function resolveTrackLabel(slug, pathwayRecord) {
  if (pathwayRecord && pathwayRecord.label) return pathwayRecord.label;
  return trackLabel(slug);
}

function tuitionLabel(status) {
  if (status === 'paid') return '<span style="color:#2e7d32;font-weight:600;"><i class="fa-solid fa-circle-check"></i> Paid</span>';
  if (status === 'partial') return '<span style="color:#ef6c00;font-weight:600;"><i class="fa-solid fa-circle-half-stroke"></i> Partial</span>';
  return '<span style="color:#c62828;font-weight:600;"><i class="fa-solid fa-circle-exclamation"></i> Unpaid</span>';
}

// Delete student
async function deleteStudentConfirm(studentId, username) {
  const typed = prompt(`This will permanently delete ${username} and all their quiz scores, hours, and scenario submissions. This cannot be undone.\n\nType the username "${username}" to confirm:`);
  if (typed !== username) {
    if (typed !== null) alert('Username did not match. Deletion cancelled.');
    return;
  }
  const r = await apiCall(`/api/admin/students/${studentId}`, { method: 'DELETE' });
  if (r && r.ok) {
    alert(`Deleted ${username}.`);
    // Also remove from local cache so the rendered list updates
    try {
      const local = getUsers().filter(u => u.username !== username);
      _sSet('numa_users', JSON.stringify(local));
    } catch (e) {}
    navigate('admin');
  } else {
    alert('Delete failed: ' + ((r && r.error) || 'unknown error'));
  }
}
window.deleteStudentConfirm = deleteStudentConfirm;

// Patch a student's enrollment metadata
async function patchStudent(studentId, payload) {
  return await apiCall(`/api/admin/students/${studentId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload)
  });
}

// Save the enrollment form on the student detail page
async function saveStudentEnrollment(studentId) {
  const statusEl = document.getElementById('enroll-status');
  if (statusEl) statusEl.textContent = 'Saving…';
  const payload = {
    program_track: document.getElementById('enroll-track').value || null,
    tuition_status: document.getElementById('enroll-tuition-status').value,
    tuition_total: parseFloat(document.getElementById('enroll-tuition-total').value) || null,
    tuition_amount_paid: parseFloat(document.getElementById('enroll-tuition-paid').value) || 0,
    tuition_notes: document.getElementById('enroll-tuition-notes').value || null
  };
  const r = await patchStudent(studentId, payload);
  if (r && !r.error) {
    if (statusEl) statusEl.innerHTML = '<span style="color:#2e7d32;">Saved.</span>';
    // Force the next admin list to refresh
    NUMA_ENROLL.studentListCache = null;
  } else {
    if (statusEl) statusEl.innerHTML = '<span style="color:#c62828;">Save failed: ' + ((r && r.error) || 'error') + '</span>';
  }
}
window.saveStudentEnrollment = saveStudentEnrollment;

// Render the enrollment card (track + tuition) inside the student detail page
function renderEnrollmentCard(student) {
  if (!student) return '';
  const track = student.program_track || '';
  const status = student.tuition_status || 'unpaid';
  const total = student.tuition_total != null ? student.tuition_total : '';
  const paid = student.tuition_amount_paid != null ? student.tuition_amount_paid : 0;
  const notes = student.tuition_notes || '';
  return `
    <div class="card mb-3" style="border-left:4px solid #A38D78;">
      <div class="card-body">
        <h3 style="margin-top:0;"><i class="fa-solid fa-clipboard-user"></i> Enrollment</h3>
        <div class="form-group">
          <label><strong>Program Track</strong></label>
          <select id="enroll-track" class="form-control" data-current-track="${escapeAttr(track)}">
            <option value="" ${track === '' ? 'selected' : ''}>— Not assigned —</option>
            <option value="${escapeAttr(track || '__loading__')}" selected style="display:none;">${escapeHtml(track ? resolveTrackLabel(track) : 'Loading…')}</option>
          </select>
          <small class="text-muted">The student sees the modules required for this track. Leave unassigned and they'll see "contact your instructor". Manage tracks under <a href="#" onclick="navigate('admin',{view:'pathways'});return false;">Certification Pathways</a>.</small>
        </div>
        <hr>
        <div class="form-group">
          <label><strong>Tuition Status</strong></label>
          <select id="enroll-tuition-status" class="form-control">
            <option value="unpaid" ${status === 'unpaid' ? 'selected' : ''}>Unpaid</option>
            <option value="partial" ${status === 'partial' ? 'selected' : ''}>Partial</option>
            <option value="paid" ${status === 'paid' ? 'selected' : ''}>Paid in full</option>
          </select>
        </div>
        <div style="display:flex;gap:12px;flex-wrap:wrap;">
          <div class="form-group" style="flex:1;min-width:140px;">
            <label>Total Tuition ($)</label>
            <input type="number" min="0" step="0.01" id="enroll-tuition-total" class="form-control" value="${total === '' ? '' : total}" placeholder="e.g. 3500">
          </div>
          <div class="form-group" style="flex:1;min-width:140px;">
            <label>Amount Paid ($)</label>
            <input type="number" min="0" step="0.01" id="enroll-tuition-paid" class="form-control" value="${paid}" placeholder="e.g. 1500">
          </div>
        </div>
        <div class="form-group">
          <label>Notes (private — admin only)</label>
          <textarea id="enroll-tuition-notes" class="form-control" rows="2" placeholder="e.g. Payment plan, scholarship, due date">${escapeHtml(notes)}</textarea>
        </div>
        <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;">
          <button class="btn btn-primary" onclick="saveStudentEnrollment(${student.id})"><i class="fa-solid fa-floppy-disk"></i> Save Enrollment</button>
          <button class="btn btn-secondary" onclick="deleteStudentConfirm(${student.id}, '${escapeAttr(student.username)}')" style="background:#c62828;color:#fff;border-color:#c62828;"><i class="fa-solid fa-trash"></i> Delete Student</button>
          <span id="enroll-status" class="text-muted text-sm"></span>
        </div>
      </div>
    </div>`;
}

// Wrap the admin student detail page so it pulls fresh student data
// (with new fields) from the backend and adds the enrollment card up top.
(function wrapAdminStudentDetailForEnrollment() {
  if (typeof renderAdminStudentDetail !== 'function') return;
  const _orig = renderAdminStudentDetail;
  window.renderAdminStudentDetail = function(username) {
    // Kick off async fetch to populate the enrollment card from the backend
    setTimeout(async () => {
      try {
        const list = await fetchStudentsFresh();
        const student = list.find(s => s.username === username);
        const target = document.getElementById('enrollment-card-slot');
        if (target && student) {
          target.innerHTML = renderEnrollmentCard(student);
          // Populate the track dropdown dynamically from all known pathways
          try {
            const pathways = await fetchPathways();
            const sel = document.getElementById('enroll-track');
            if (sel) {
              const current = sel.dataset.currentTrack || '';
              const opts = ['<option value=""' + (current === '' ? ' selected' : '') + '>— Not assigned —</option>'];
              Object.keys(pathways).sort().forEach(slug => {
                const lbl = resolveTrackLabel(slug, pathways[slug]);
                opts.push('<option value="' + escapeAttr(slug) + '"' + (current === slug ? ' selected' : '') + '>' + escapeHtml(lbl) + '</option>');
              });
              sel.innerHTML = opts.join('');
            }
          } catch (e) { console.warn('[enrollment-tracks]', e); }
        }
      } catch (e) { console.warn('[enrollment]', e); }
    }, 0);
    // Render the original page but inject a slot at the top
    let html = _orig.call(this, username);
    // Insert the enrollment slot right after the page header
    const slot = '<div id="enrollment-card-slot"><div class="card mb-3"><div class="card-body text-center text-muted">Loading enrollment…</div></div></div>';
    // Look for the </div> closing the page-header — fall back to prepending
    const inserted = html.replace(/(<\/div>\s*<div class="stats-grid)/, '</div>' + slot + '$1');
    return inserted === html ? slot + html : inserted;
  };
  renderAdminStudentDetail = window.renderAdminStudentDetail;
})();

// Wrap the wrapper too (so the scenario-grading wrapper still works)
(function rewrapForLatestOverride() {
  // No-op: the chain is already preserved by wrap-on-wrap above.
})();

// Also enrich the Students list table with the new columns
(function wrapStudentsListForEnrollment() {
  if (typeof renderAdminContent !== 'function') return;
  const _orig = renderAdminContent;
  window.renderAdminContent = function() {
    const html = _orig.apply(this, arguments);
    // After rendering, decorate the rows with the extra columns
    setTimeout(decorateStudentsTable, 0);
    return html;
  };
  renderAdminContent = window.renderAdminContent;
})();

async function decorateStudentsTable() {
  const table = document.querySelector('.admin-table');
  if (!table) return;
  const head = table.querySelector('thead tr');
  if (!head) return;
  // Avoid double-injection
  if (table.dataset.enrollmentDecorated === '1') return;
  // Only decorate the Students table — has a row with header text "Student"
  const headerCells = Array.from(head.querySelectorAll('th'));
  const isStudents = headerCells.some(th => th.textContent.trim() === 'Student')
                    && headerCells.some(th => th.textContent.trim() === 'Email');
  if (!isStudents) return;
  table.dataset.enrollmentDecorated = '1';

  const list = await fetchStudentsFresh();
  const byUsername = {};
  list.forEach(s => { byUsername[s.username] = s; });

  // Insert two new header columns after "Email"
  const emailHeaderIdx = headerCells.findIndex(th => th.textContent.trim() === 'Email');
  if (emailHeaderIdx >= 0) {
    const trackTh = document.createElement('th'); trackTh.textContent = 'Track';
    const tuitionTh = document.createElement('th'); tuitionTh.textContent = 'Tuition';
    head.insertBefore(tuitionTh, headerCells[emailHeaderIdx + 1] || null);
    head.insertBefore(trackTh, tuitionTh);
  }

  // Decorate each row
  const rows = table.querySelectorAll('tbody tr');
  rows.forEach(tr => {
    const userCell = tr.querySelector('td');
    if (!userCell) return;
    const small = userCell.querySelector('span');
    const username = small ? small.textContent.trim() : '';
    const s = byUsername[username];
    const trackCell = document.createElement('td');
    trackCell.style.fontSize = '12px';
    trackCell.textContent = s ? trackLabel(s.program_track) : 'Not assigned';
    if (s && !s.program_track) trackCell.style.color = '#c62828';
    const tuitionCell = document.createElement('td');
    tuitionCell.style.fontSize = '12px';
    tuitionCell.innerHTML = s ? tuitionLabel(s.tuition_status || 'unpaid') : '—';
    // Insert after email column (the 2nd td)
    const tds = tr.querySelectorAll('td');
    if (tds.length >= 2) {
      tds[1].parentNode.insertBefore(tuitionCell, tds[2] || null);
      tds[1].parentNode.insertBefore(trackCell, tuitionCell);
    }
  });
}

// ============================================================
// PATHWAYS PAGE (Admin)
// ------------------------------------------------------------
// Lets admin pick which modules are required for each of the three
// tracks (Mat, Reformer, Both) and override the hour requirements.
// ============================================================

(function wrapAdminContentForPathways() {
  if (typeof renderAdminContent !== 'function') return;
  const _orig = renderAdminContent;
  window.renderAdminContent = function() {
    const p = APP.viewParams || {};
    if (p.view === 'pathways') return renderAdminPathways();
    return _orig.apply(this, arguments);
  };
  renderAdminContent = window.renderAdminContent;
})();

function renderAdminPathways() {
  setTimeout(loadPathwaysIntoPage, 0);
  return `
    <div class="breadcrumb fade-in">
      <a href="#" onclick="navigate('admin');return false;">Admin</a>
      <i class="fa-solid fa-chevron-right" style="font-size:10px;"></i>
      <span>Certification Pathways</span>
    </div>
    <div class="page-header fade-in">
      <h1><i class="fa-solid fa-route"></i> Certification Pathways</h1>
      <p>Define which modules are required for each track and the practice hours each student must log to certify.</p>
    </div>
    <div id="pathway-content"><div class="card"><div class="card-body text-center text-muted">Loading pathways…</div></div></div>
  `;
}

// Built-in tracks cannot be deleted (only edited / hidden via assignment)
const NUMA_BUILTIN_TRACKS = ['mat', 'reformer', 'both'];

function pathwayAccentColor(slug) {
  if (slug === 'mat') return '#8d6e63';
  if (slug === 'reformer') return '#5d4037';
  if (slug === 'both') return '#A38D78';
  // Deterministic warm-tone color for custom tracks
  let h = 0;
  for (let i = 0; i < slug.length; i++) h = (h * 31 + slug.charCodeAt(i)) & 0xffff;
  const hue = (h % 40) + 20; // 20–60° (warm brown/amber)
  return `hsl(${hue}, 28%, 38%)`;
}

function pathwayIcon(slug) {
  if (slug === 'mat') return 'border-all';
  if (slug === 'reformer') return 'compress';
  if (slug === 'both') return 'layer-group';
  if (slug.includes('chair')) return 'chair';
  if (slug.includes('cadillac')) return 'bed';
  if (slug.includes('barrel')) return 'circle-half-stroke';
  if (slug.includes('prenatal') || slug.includes('postnatal') || slug.includes('natal')) return 'baby';
  return 'route';
}

async function loadPathwaysIntoPage() {
  // Force fresh
  NUMA_ENROLL.pathwayCache = null;
  const [pathways, modules] = await Promise.all([fetchPathways(), loadAdminModules()]);
  const sorted = [...modules].sort((a, b) => extractFirstWeekNumber(a) - extractFirstWeekNumber(b));
  const target = document.getElementById('pathway-content');
  if (!target) return;

  // Order: built-ins first, then custom tracks alphabetically
  const allSlugs = Object.keys(pathways);
  const customSlugs = allSlugs.filter(s => !NUMA_BUILTIN_TRACKS.includes(s)).sort();
  const orderedSlugs = [...NUMA_BUILTIN_TRACKS.filter(s => pathways[s]), ...customSlugs];

  const createBar = `
    <div class="card mb-3" style="border-left:4px solid #A38D78;background:#faf6f1;">
      <div class="card-body" style="display:flex;flex-wrap:wrap;gap:12px;align-items:center;justify-content:space-between;">
        <div>
          <h3 style="margin:0 0 4px 0;"><i class="fa-solid fa-plus-circle"></i> Add a new certification track</h3>
          <p class="text-muted text-sm" style="margin:0;">For example: Chair, Cadillac, Barrel, Prenatal, Postnatal.</p>
        </div>
        <button class="btn btn-primary" onclick="createNewPathway()"><i class="fa-solid fa-plus"></i> Create New Track</button>
      </div>
    </div>`;

  target.innerHTML = createBar + orderedSlugs.map(track => {
    const p = pathways[track] || {};
    const reqIds = new Set((p.required_module_ids || []).map(String));
    const allRequired = !p.required_module_ids || p.required_module_ids.length === 0;
    const hr = p.hour_requirements || {};
    const isBuiltin = NUMA_BUILTIN_TRACKS.includes(track);
    const label = resolveTrackLabel(track, p);
    return `
      <div class="card mb-3" style="border-left:4px solid ${pathwayAccentColor(track)};">
        <div class="card-body">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:10px;flex-wrap:wrap;">
            <h2 style="margin-top:0;display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
              <i class="fa-solid fa-${pathwayIcon(track)}"></i>
              ${escapeHtml(label)}
              <span class="text-muted" style="font-size:12px;font-weight:400;">(${escapeHtml(track)})</span>
              ${isBuiltin ? '<span style="font-size:11px;background:#efe9e0;color:#6b5b48;padding:3px 8px;border-radius:10px;">built-in</span>' : '<span style="font-size:11px;background:#e8f5e9;color:#2e7d32;padding:3px 8px;border-radius:10px;">custom</span>'}
            </h2>
            ${isBuiltin ? '' : `<button class="btn btn-secondary" onclick="deletePathwayConfirm('${escapeAttr(track)}','${escapeAttr(label)}')" style="background:#c62828;color:#fff;border-color:#c62828;"><i class="fa-solid fa-trash"></i> Delete Track</button>`}
          </div>
          <div class="form-group" style="max-width:480px;">
            <label><strong>Display name</strong></label>
            <input type="text" class="form-control pathway-label" data-track="${escapeAttr(track)}" value="${escapeAttr(label)}">
          </div>
          <div style="margin-bottom:10px;">
            <label style="display:flex;gap:8px;align-items:center;cursor:pointer;">
              <input type="checkbox" id="pathway-${escapeAttr(track)}-all" ${allRequired ? 'checked' : ''} onchange="togglePathwayAllModules('${escapeAttr(track)}', this.checked)">
              <span><strong>All modules required</strong> (uncheck to pick specific modules)</span>
            </label>
          </div>
          <div id="pathway-${escapeAttr(track)}-modules" style="display:${allRequired ? 'none' : 'block'};border:1px solid var(--cream-darker);border-radius:8px;padding:12px;margin-bottom:14px;background:#fafafa;">
            ${sorted.map(m => {
              const checked = reqIds.has(String(m.id));
              return `<label style="display:flex;gap:8px;align-items:center;padding:6px 0;border-bottom:1px solid #eee;">
                <input type="checkbox" data-track="${escapeAttr(track)}" data-mod="${escapeAttr(m.id)}" class="pathway-mod-checkbox" ${checked ? 'checked' : ''}>
                <strong>Module ${escapeHtml(String(m.id))}:</strong> ${escapeHtml(m.title || '')}
                <span class="text-muted" style="font-size:12px;margin-left:auto;">${escapeHtml(m.week || m.subtitle || '')}</span>
              </label>`;
            }).join('')}
          </div>
          <h4 style="margin-bottom:6px;">Hour Requirements (this track only)</h4>
          <p class="text-muted text-sm" style="margin-top:0;">Leave any field blank to use the global default from Program Settings.</p>
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:10px;margin-bottom:10px;">
            <label>Observation<input type="number" min="0" class="form-control pathway-hr" data-track="${escapeAttr(track)}" data-field="observation" value="${hr.observation ?? ''}"></label>
            <label>Teaching<input type="number" min="0" class="form-control pathway-hr" data-track="${escapeAttr(track)}" data-field="teaching" value="${hr.teaching ?? ''}"></label>
            <label>Personal<input type="number" min="0" class="form-control pathway-hr" data-track="${escapeAttr(track)}" data-field="personal" value="${hr.personal ?? ''}"></label>
            <label>Total<input type="number" min="0" class="form-control pathway-hr" data-track="${escapeAttr(track)}" data-field="total" value="${hr.total ?? ''}"></label>
          </div>
          <button class="btn btn-primary" onclick="savePathway('${escapeAttr(track)}')"><i class="fa-solid fa-floppy-disk"></i> Save Pathway</button>
          <span id="pathway-${escapeAttr(track)}-status" class="text-muted text-sm" style="margin-left:10px;"></span>
        </div>
      </div>
    `;
  }).join('');
}

// Slugify a label into a safe track key: lowercase, a-z0-9 + underscores
function slugifyTrack(s) {
  return String(s || '').toLowerCase().trim()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 40);
}

async function createNewPathway() {
  const label = prompt('Name of the new certification track\n(e.g. "Chair Certification", "Prenatal Pilates")');
  if (!label) return;
  const trimmed = label.trim();
  if (!trimmed) return;
  let slug = slugifyTrack(trimmed);
  if (!slug) { alert('Please use letters or numbers in the name.'); return; }
  const customSlug = prompt('Short slug (used internally, lowercase letters/numbers/underscores).\nLeave as is or shorten:', slug);
  if (customSlug === null) return;
  slug = slugifyTrack(customSlug);
  if (!slug) { alert('Invalid slug.'); return; }
  const r = await apiCall('/api/admin/pathways', {
    method: 'POST',
    body: JSON.stringify({ slug, label: trimmed })
  });
  if (r && !r.error) {
    NUMA_ENROLL.pathwayCache = null;
    await loadPathwaysIntoPage();
  } else {
    alert('Could not create track: ' + ((r && r.error) || 'unknown error'));
  }
}
window.createNewPathway = createNewPathway;

async function deletePathwayConfirm(slug, label) {
  if (NUMA_BUILTIN_TRACKS.includes(slug)) {
    alert('Built-in tracks (mat, reformer, both) cannot be deleted.');
    return;
  }
  if (!confirm(`Delete the "${label}" track?\n\nIf any students are assigned to it, you'll be asked again before they are unassigned.`)) return;
  let r = await apiCall(`/api/admin/pathways/${encodeURIComponent(slug)}`, { method: 'DELETE' });
  if (r && r.error && r.assigned_count) {
    const cnt = r.assigned_count;
    if (!confirm(`${cnt} student${cnt === 1 ? ' is' : 's are'} currently assigned to "${label}". Continue and unassign them?`)) return;
    r = await apiCall(`/api/admin/pathways/${encodeURIComponent(slug)}?force=true`, { method: 'DELETE' });
  }
  if (r && !r.error) {
    NUMA_ENROLL.pathwayCache = null;
    NUMA_ENROLL.studentListCache = null;
    await loadPathwaysIntoPage();
  } else {
    alert('Delete failed: ' + ((r && r.error) || 'unknown error'));
  }
}
window.deletePathwayConfirm = deletePathwayConfirm;

function togglePathwayAllModules(track, isAll) {
  const box = document.getElementById(`pathway-${track}-modules`);
  if (box) box.style.display = isAll ? 'none' : 'block';
}
window.togglePathwayAllModules = togglePathwayAllModules;

async function savePathway(track) {
  const statusEl = document.getElementById(`pathway-${track}-status`);
  if (statusEl) statusEl.textContent = 'Saving…';
  const allRequired = document.getElementById(`pathway-${track}-all`)?.checked;
  let requiredIds = [];
  if (!allRequired) {
    document.querySelectorAll(`.pathway-mod-checkbox[data-track="${track}"]`).forEach(cb => {
      if (cb.checked) requiredIds.push(String(cb.dataset.mod));
    });
  }
  const hr = {};
  document.querySelectorAll(`.pathway-hr[data-track="${track}"]`).forEach(inp => {
    const v = inp.value.trim();
    if (v !== '') hr[inp.dataset.field] = parseFloat(v);
  });
  // Pull the (possibly edited) label from the page
  const labelInput = document.querySelector(`.pathway-label[data-track="${track}"]`);
  const labelValue = (labelInput && labelInput.value.trim()) || trackLabel(track);
  const value = {
    required_module_ids: requiredIds,
    hour_requirements: Object.keys(hr).length ? hr : null,
    requires_final_exam: true,
    requires_scenarios: true,
    label: labelValue
  };
  const r = await apiCall(`/api/admin/program-settings/pathway_${track}`, {
    method: 'PUT',
    body: JSON.stringify({ value })
  });
  if (r && !r.error) {
    if (statusEl) statusEl.innerHTML = '<span style="color:#2e7d32;">Saved.</span>';
    // Invalidate cache so the next page load reads fresh
    NUMA_ENROLL.pathwayCache = null;
  } else {
    if (statusEl) statusEl.innerHTML = '<span style="color:#c62828;">Save failed: ' + ((r && r.error) || 'error') + '</span>';
  }
}
window.savePathway = savePathway;

// Add a "Certification Pathways" card on the admin home page
(function addPathwaysAdminCard() {
  // Patch the admin overview card list by appending after render
  if (typeof renderAdminContent !== 'function') return;
  const _orig = renderAdminContent;
  window.renderAdminContent = function() {
    const html = _orig.apply(this, arguments);
    setTimeout(() => {
      const grid = document.querySelector('.admin-overview-grid');
      if (!grid || grid.dataset.pathwaysCard === '1') return;
      grid.dataset.pathwaysCard = '1';
      const card = document.createElement('div');
      card.className = 'admin-overview-card';
      card.onclick = () => navigate('admin', { view: 'pathways' });
      card.innerHTML = '<div class="admin-overview-icon"><i class="fa-solid fa-route"></i></div>'
        + '<h3>Certification Pathways</h3>'
        + '<p>Add, edit, or remove certification tracks (Mat, Reformer, Chair, Cadillac, prenatal, etc.)</p>';
      grid.appendChild(card);
    }, 0);
    return html;
  };
  renderAdminContent = window.renderAdminContent;
})();

// ============================================================
// STUDENT-SIDE: Filter modules to only show what their track requires
// ------------------------------------------------------------
// If the logged-in student has a program_track and the pathway for that
// track has a non-empty required_module_ids, hide modules not in that list.
// This is a presentation-layer filter applied on the dashboard.
// ============================================================

let _studentPathwayCache = null;
async function getStudentPathway() {
  if (_studentPathwayCache !== null) return _studentPathwayCache;
  try {
    const me = await apiCall('/api/auth/me');
    if (!me || me.error || !me.program_track) {
      _studentPathwayCache = { track: null };
      return _studentPathwayCache;
    }
    const all = await fetchPathways();
    const p = all[me.program_track] || null;
    _studentPathwayCache = {
      track: me.program_track,
      required_module_ids: (p && p.required_module_ids) || [],
      hour_requirements: (p && p.hour_requirements) || null,
      label: (p && p.label) || trackLabel(me.program_track),
      tuition_status: me.tuition_status
    };
  } catch (e) {
    _studentPathwayCache = { track: null };
  }
  return _studentPathwayCache;
}

// Re-fetch pathway when login changes
(function wrapLoginToResetPathway() {
  if (typeof handleLogin !== 'function') return;
  const _orig = handleLogin;
  window.handleLogin = async function(...args) {
    _studentPathwayCache = null;
    return await _orig.apply(this, args);
  };
  handleLogin = window.handleLogin;
})();


// ============================================================
// HOMEWORK (module-end video assignment)
// ------------------------------------------------------------
// Student: sees a homework card on the quiz section of each module
// they can upload a video, replace it until graded, and read comments.
// Admin: edits the prompt, reviews each submission, grades it, and
// posts ongoing feedback comments after grading.
// ============================================================

const NUMA_HW = {
  // Cache of per-module homework prompt + this student's submission
  perModule: {}, // moduleId -> { homework, submission }
  inbox: null
};

function _hwFmtBytes(n) {
  if (n == null) return '';
  const mb = n / (1024 * 1024);
  return mb >= 1 ? mb.toFixed(1) + ' MB' : (n / 1024).toFixed(0) + ' KB';
}
function _hwStatusBadge(status) {
  if (status === 'approved') return '<span style="background:#e8f5e9;color:#2e7d32;padding:3px 10px;border-radius:12px;font-size:12px;font-weight:600;"><i class="fa-solid fa-circle-check"></i> Approved</span>';
  if (status === 'needs_revision') return '<span style="background:#fff3e0;color:#e65100;padding:3px 10px;border-radius:12px;font-size:12px;font-weight:600;"><i class="fa-solid fa-rotate-right"></i> Needs Revision</span>';
  return '<span style="background:#e3f2fd;color:#1565c0;padding:3px 10px;border-radius:12px;font-size:12px;font-weight:600;"><i class="fa-solid fa-clock"></i> Pending Review</span>';
}
function _hwIsLocked(status) { return status === 'approved' || status === 'needs_revision'; }

// ---- STUDENT: fetch & render the homework card on the quiz section ----
async function loadStudentHomework(moduleId) {
  const data = await apiCall('/api/modules/' + encodeURIComponent(moduleId) + '/homework');
  if (data && !data.error) {
    NUMA_HW.perModule[moduleId] = data;
    return data;
  }
  return { homework: null, submission: null };
}

function renderStudentHomeworkCard(moduleId, data) {
  if (!data || !data.homework) return '';
  const hw = data.homework;
  const sub = data.submission;
  const maxMb = hw.max_size_mb || 500;
  const reqBadge = hw.is_required
    ? '<span style="background:#fce4ec;color:#ad1457;padding:3px 10px;border-radius:12px;font-size:12px;font-weight:600;margin-left:8px;">Required</span>'
    : '<span style="background:#f3e5f5;color:#6a1b9a;padding:3px 10px;border-radius:12px;font-size:12px;font-weight:600;margin-left:8px;">Optional</span>';
  let body = '';
  if (sub) {
    const locked = _hwIsLocked(sub.status);
    body = `
      <div style="background:#fafaf7;border:1px solid #e6dfd1;border-radius:10px;padding:14px;margin-top:14px;">
        <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;">
          <div><strong>Your submission</strong> &middot; <span class="text-muted text-sm">${new Date(sub.submitted_at).toLocaleString()}</span></div>
          ${_hwStatusBadge(sub.status)}
        </div>
        <video controls preload="metadata" style="width:100%;max-height:420px;margin-top:10px;border-radius:8px;background:#000;">
          <source src="${escapeAttr(sub.video_url)}" type="${escapeAttr(sub.mime_type || 'video/mp4')}">
          Your browser cannot play this video. <a href="${escapeAttr(sub.video_url)}" target="_blank">Download it.</a>
        </video>
        <div class="text-muted text-sm" style="margin-top:6px;">${escapeHtml(sub.original_filename || '')} &middot; ${_hwFmtBytes(sub.size_bytes)}</div>
        ${sub.student_notes ? `<div style="margin-top:8px;"><em>Your notes:</em> ${escapeHtml(sub.student_notes)}</div>` : ''}
        ${sub.admin_feedback ? `<div style="margin-top:10px;padding:10px;background:#fff;border-left:3px solid #A38D78;border-radius:6px;"><strong>Instructor feedback:</strong><br>${escapeHtml(sub.admin_feedback)}</div>` : ''}
        <div id="hw-comments-${sub.id}" style="margin-top:12px;"></div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px;">
          ${locked
            ? '<span class="text-muted text-sm"><i class="fa-solid fa-lock"></i> This submission has been graded. The video is locked, but you can still read instructor comments.</span>'
            : `<button class="btn btn-secondary btn-sm" onclick="studentChangeHomework('${escapeAttr(moduleId)}')"><i class="fa-solid fa-rotate"></i> Replace Video</button>
               <button class="btn btn-secondary btn-sm" onclick="studentDeleteHomework('${escapeAttr(moduleId)}')" style="color:#c62828;border-color:#c62828;"><i class="fa-solid fa-trash"></i> Delete Submission</button>`}
        </div>
      </div>`;
  } else {
    body = `<div style="margin-top:14px;">
        <input type="file" id="hw-file-${escapeAttr(moduleId)}" accept="video/*,.mp4,.mov,.m4v,.webm,.mkv,.avi,.wmv,.flv,.3gp,.mpeg,.mpg" style="display:block;margin-bottom:8px;">
        <textarea id="hw-notes-${escapeAttr(moduleId)}" rows="2" placeholder="Optional notes for your instructor" class="form-control" style="margin-bottom:8px;"></textarea>
        <button class="btn btn-primary" onclick="studentUploadHomework('${escapeAttr(moduleId)}')"><i class="fa-solid fa-upload"></i> Upload Video</button>
        <div id="hw-progress-${escapeAttr(moduleId)}" class="text-muted text-sm" style="margin-top:8px;"></div>
      </div>`;
  }
  return `
    <div class="card mb-3" style="border-left:4px solid #A38D78;margin-top:24px;">
      <div class="card-body">
        <h3 style="margin-top:0;"><i class="fa-solid fa-video"></i> Homework ${reqBadge}</h3>
        ${hw.title ? `<div style="font-weight:600;margin-bottom:4px;">${escapeHtml(hw.title)}</div>` : ''}
        <div style="white-space:pre-wrap;">${escapeHtml(hw.description)}</div>
        <div class="text-muted text-sm" style="margin-top:8px;">Upload any standard video file (MP4, MOV, WebM, MKV, etc.) up to ${maxMb} MB.</div>
        ${body}
      </div>
    </div>
    <script>setTimeout(function(){ if (window.renderHomeworkCommentsThread) renderHomeworkCommentsThread(${sub ? sub.id : 'null'}); }, 0);</script>`;
}

async function studentUploadHomework(moduleId) {
  const fileInput = document.getElementById('hw-file-' + moduleId);
  const notesEl = document.getElementById('hw-notes-' + moduleId);
  const status = document.getElementById('hw-progress-' + moduleId);
  if (!fileInput || !fileInput.files || !fileInput.files[0]) {
    if (status) status.innerHTML = '<span style="color:#c62828;">Please choose a video file first.</span>';
    return;
  }
  const file = fileInput.files[0];
  const fd = new FormData();
  fd.append('video', file);
  if (notesEl && notesEl.value) fd.append('student_notes', notesEl.value);
  if (status) status.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Uploading ' + _hwFmtBytes(file.size) + '...';
  try {
    const url = (API_BASE || '') + '/api/modules/' + encodeURIComponent(moduleId) + '/homework/submissions';
    const token = localStorage.getItem('numa_token');
    const res = await fetch(url, {
      method: 'POST',
      headers: token ? { 'Authorization': 'Bearer ' + token } : {},
      body: fd
    });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) {
      if (status) status.innerHTML = '<span style="color:#c62828;">' + escapeHtml(j.error || ('Upload failed (' + res.status + ')')) + '</span>';
      return;
    }
    if (status) status.innerHTML = '<span style="color:#2e7d32;">Uploaded.</span>';
    NUMA_HW.perModule[moduleId] = null;
    // Re-render the module page
    if (typeof navigate === 'function' && APP.viewParams) {
      navigate('module', { id: parseInt(moduleId, 10) || moduleId, section: APP.viewParams.section });
    }
  } catch (e) {
    if (status) status.innerHTML = '<span style="color:#c62828;">' + escapeHtml(e.message) + '</span>';
  }
}
window.studentUploadHomework = studentUploadHomework;

async function studentChangeHomework(moduleId) {
  // Replace flow: show the upload UI again
  const card = document.getElementById('hw-comments-' + (NUMA_HW.perModule[moduleId]?.submission?.id || ''))?.closest('.card-body');
  if (!card) return;
  // Simpler: prompt for a file via a hidden input
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'video/*,.mp4,.mov,.m4v,.webm,.mkv,.avi,.wmv,.flv,.3gp,.mpeg,.mpg';
  input.onchange = async () => {
    if (!input.files || !input.files[0]) return;
    const notes = prompt('Optional notes for your instructor (leave blank to skip):', '');
    const fd = new FormData();
    fd.append('video', input.files[0]);
    if (notes) fd.append('student_notes', notes);
    const token = localStorage.getItem('numa_token');
    const res = await fetch((API_BASE || '') + '/api/modules/' + encodeURIComponent(moduleId) + '/homework/submissions', {
      method: 'POST',
      headers: token ? { 'Authorization': 'Bearer ' + token } : {},
      body: fd
    });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) { alert(j.error || 'Upload failed.'); return; }
    NUMA_HW.perModule[moduleId] = null;
    if (typeof navigate === 'function' && APP.viewParams) {
      navigate('module', { id: parseInt(moduleId, 10) || moduleId, section: APP.viewParams.section });
    }
  };
  input.click();
}
window.studentChangeHomework = studentChangeHomework;

async function studentDeleteHomework(moduleId) {
  if (!confirm('Delete your homework submission? You can re-upload anytime before it is graded.')) return;
  const r = await apiCall('/api/modules/' + encodeURIComponent(moduleId) + '/homework/submission', { method: 'DELETE' });
  if (r && !r.error) {
    NUMA_HW.perModule[moduleId] = null;
    if (typeof navigate === 'function' && APP.viewParams) {
      navigate('module', { id: parseInt(moduleId, 10) || moduleId, section: APP.viewParams.section });
    }
  } else {
    alert((r && r.error) || 'Could not delete submission.');
  }
}
window.studentDeleteHomework = studentDeleteHomework;

// Render comments thread under a student's submission (or admin's submission view)
async function renderHomeworkCommentsThread(submissionId, mountId) {
  if (!submissionId) return;
  const mount = document.getElementById(mountId || ('hw-comments-' + submissionId));
  if (!mount) return;
  const comments = await apiCall('/api/homework-submissions/' + submissionId + '/comments');
  if (!Array.isArray(comments)) { mount.innerHTML = ''; return; }
  const isAdmin = APP.currentUser && APP.currentUser.role === 'admin';
  const list = comments.map(c => {
    const isMine = APP.currentUser && c.author_id === APP.currentUser.id;
    const who = c.full_name || c.username || 'User';
    const ts = c.timestamp_seconds != null ? ` <span class="text-muted text-sm">@ ${Math.floor(c.timestamp_seconds/60)}:${String(Math.floor(c.timestamp_seconds%60)).padStart(2,'0')}</span>` : '';
    const bg = c.author_role === 'admin' ? '#fff8ec' : '#f5f5f5';
    const border = c.author_role === 'admin' ? '#A38D78' : '#bdbdbd';
    return `<div style="background:${bg};border-left:3px solid ${border};padding:10px;border-radius:6px;margin-top:8px;">
      <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap;">
        <div><strong>${escapeHtml(who)}</strong> ${c.author_role === 'admin' ? '<span style="font-size:11px;background:#A38D78;color:#fff;padding:2px 6px;border-radius:8px;margin-left:4px;">Instructor</span>' : ''}${ts}</div>
        <div class="text-muted text-sm">${new Date(c.created_at).toLocaleString()}</div>
      </div>
      <div style="margin-top:6px;white-space:pre-wrap;">${escapeHtml(c.body)}</div>
      ${(isMine || isAdmin) ? `<button class="btn btn-ghost btn-sm" onclick="deleteHomeworkComment(${c.id}, ${submissionId})" style="margin-top:4px;color:#c62828;"><i class="fa-solid fa-trash"></i></button>` : ''}
    </div>`;
  }).join('');
  // Decide who can post:
  // - Admin: only after grading (server enforces, but we mirror the UI)
  // - Student (owner): anytime if they have access (server enforces)
  const sub = (Object.values(NUMA_HW.perModule).find(d => d && d.submission && d.submission.id === submissionId) || {}).submission;
  const subStatusFromList = (NUMA_HW.inbox || []).find(s => s.id === submissionId)?.status;
  const status = sub?.status || subStatusFromList;
  const adminCanPost = isAdmin && _hwIsLocked(status);
  const studentCanPost = !isAdmin; // server checks ownership
  const composer = (adminCanPost || studentCanPost) ? `
    <div style="margin-top:10px;">
      <textarea id="hw-comment-${submissionId}" rows="2" placeholder="${isAdmin ? 'Leave feedback on the video' : 'Reply to your instructor'}" class="form-control"></textarea>
      <div style="display:flex;gap:8px;align-items:center;margin-top:6px;flex-wrap:wrap;">
        ${isAdmin ? `<input type="number" id="hw-comment-ts-${submissionId}" placeholder="Optional video time (seconds)" min="0" step="1" class="form-control" style="max-width:220px;">` : ''}
        <button class="btn btn-primary btn-sm" onclick="postHomeworkComment(${submissionId})"><i class="fa-solid fa-paper-plane"></i> Post Comment</button>
      </div>
    </div>` : (isAdmin ? '<div class="text-muted text-sm" style="margin-top:8px;"><i class="fa-solid fa-info-circle"></i> Grade the submission first, then you can leave feedback comments.</div>' : '');
  mount.innerHTML = `<div><h4 style="margin:0 0 6px 0;font-size:14px;"><i class="fa-solid fa-comments"></i> Feedback (${comments.length})</h4>${list || '<div class="text-muted text-sm">No comments yet.</div>'}${composer}</div>`;
}
window.renderHomeworkCommentsThread = renderHomeworkCommentsThread;

async function postHomeworkComment(submissionId) {
  const body = (document.getElementById('hw-comment-' + submissionId) || {}).value;
  if (!body || !body.trim()) return;
  const tsEl = document.getElementById('hw-comment-ts-' + submissionId);
  const payload = { body };
  if (tsEl && tsEl.value !== '') payload.timestamp_seconds = parseFloat(tsEl.value);
  const r = await apiCall('/api/homework-submissions/' + submissionId + '/comments', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
  if (r && !r.error) {
    renderHomeworkCommentsThread(submissionId);
  } else {
    alert((r && r.error) || 'Could not post comment.');
  }
}
window.postHomeworkComment = postHomeworkComment;

async function deleteHomeworkComment(commentId, submissionId) {
  if (!confirm('Delete this comment?')) return;
  const r = await apiCall('/api/homework-comments/' + commentId, { method: 'DELETE' });
  if (r && !r.error) renderHomeworkCommentsThread(submissionId);
  else alert((r && r.error) || 'Could not delete.');
}
window.deleteHomeworkComment = deleteHomeworkComment;

// Wrap renderModulePage so the homework card appears at the end of the
// module's quiz section (mirroring where the module quiz lives).
(function wrapModulePageForHomework() {
  if (typeof renderModulePage !== 'function') return;
  const _orig = renderModulePage;
  window.renderModulePage = function(moduleId, sectionId) {
    let html = _orig.call(this, moduleId, sectionId);
    // Only inject on the quiz section
    const mod = (typeof COURSE_MODULES !== 'undefined') ? COURSE_MODULES.find(m => String(m.id) === String(moduleId)) : null;
    if (!mod) return html;
    const currentSection = sectionId ? (mod.sections || []).find(s => s.id === sectionId) : (mod.sections || [])[0];
    if (!currentSection || !currentSection.isQuiz) return html;
    // Kick off async load + injection
    setTimeout(async () => {
      const data = await loadStudentHomework(moduleId);
      if (!data || !data.homework) return;
      const cardHtml = renderStudentHomeworkCard(moduleId, data);
      // Insert before .section-nav-btns (right after the quiz block)
      const navBar = document.querySelector('.section-nav-btns');
      if (navBar) {
        const wrap = document.createElement('div');
        wrap.innerHTML = cardHtml;
        navBar.parentNode.insertBefore(wrap, navBar);
      }
      // Re-render comments thread now that the DOM is in
      if (data.submission && data.submission.id) {
        renderHomeworkCommentsThread(data.submission.id);
      }
    }, 0);
    return html;
  };
  renderModulePage = window.renderModulePage;
})();

// ============================================================
// ADMIN: per-module homework editor + submissions reviewer
// ============================================================

function renderAdminModuleHomework(moduleId) {
  setTimeout(() => loadAdminModuleHomework(moduleId), 0);
  const mod = (typeof COURSE_MODULES !== 'undefined') ? COURSE_MODULES.find(m => String(m.id) === String(moduleId)) : null;
  const title = mod ? `Module ${mod.id}: ${mod.title}` : `Module ${moduleId}`;
  return `
    <div class="breadcrumb fade-in">
      <a href="#" onclick="navigate('admin',{view:'modules'});return false;">Modules</a>
      <i class="fa-solid fa-chevron-right" style="font-size:10px;"></i>
      <a href="#" onclick="navigate('admin',{view:'editModule',moduleId:'${escapeAttr(moduleId)}'});return false;">${escapeHtml(title)}</a>
      <i class="fa-solid fa-chevron-right" style="font-size:10px;"></i>
      <span>Homework</span>
    </div>
    <div class="page-header fade-in"><h1><i class="fa-solid fa-video"></i> Homework — ${escapeHtml(title)}</h1></div>
    <div id="hw-editor"><div class="card"><div class="card-body text-center text-muted">Loading…</div></div></div>
    <div id="hw-submissions" style="margin-top:20px;"></div>`;
}

async function loadAdminModuleHomework(moduleId) {
  const [hw, subs] = await Promise.all([
    apiCall('/api/admin/modules/' + encodeURIComponent(moduleId) + '/homework'),
    apiCall('/api/admin/modules/' + encodeURIComponent(moduleId) + '/homework-submissions')
  ]);
  renderAdminHomeworkEditor(moduleId, hw && !hw.error ? hw : null);
  renderAdminHomeworkSubmissionsList(moduleId, Array.isArray(subs) ? subs : []);
}

function renderAdminHomeworkEditor(moduleId, hw) {
  const target = document.getElementById('hw-editor');
  if (!target) return;
  const title = hw?.title || '';
  const desc = hw?.description || '';
  const isReq = hw ? hw.is_required !== false : true;
  const maxMb = hw?.max_size_mb || 500;
  target.innerHTML = `
    <div class="card"><div class="card-body">
      <h3 style="margin-top:0;"><i class="fa-solid fa-pen"></i> Homework Prompt</h3>
      <div class="form-group">
        <label><strong>Title (optional)</strong></label>
        <input type="text" id="hw-title" class="form-control" value="${escapeAttr(title)}" placeholder="e.g. Teach a 10-minute mat warm-up">
      </div>
      <div class="form-group">
        <label><strong>What are you asking students to record?</strong></label>
        <textarea id="hw-desc" rows="5" class="form-control" placeholder="Describe the assignment in detail. e.g. Film yourself cueing 5 mat exercises with clear verbal cues, lateral breathing, and proper alignment. 5–10 minutes.">${escapeHtml(desc)}</textarea>
      </div>
      <div style="display:flex;gap:14px;flex-wrap:wrap;align-items:center;">
        <label style="display:flex;align-items:center;gap:8px;cursor:pointer;">
          <input type="checkbox" id="hw-required" ${isReq ? 'checked' : ''}>
          <span><strong>Required</strong> (uncheck to make this homework optional)</span>
        </label>
        <label>Max upload size (MB) <input type="number" min="10" max="2000" id="hw-max" class="form-control" value="${maxMb}" style="width:120px;display:inline-block;"></label>
      </div>
      <div style="margin-top:14px;display:flex;gap:10px;flex-wrap:wrap;align-items:center;">
        <button class="btn btn-primary" onclick="saveAdminHomework('${escapeAttr(moduleId)}')"><i class="fa-solid fa-floppy-disk"></i> Save Homework</button>
        ${hw ? `<button class="btn btn-secondary" onclick="deleteAdminHomework('${escapeAttr(moduleId)}')" style="color:#c62828;border-color:#c62828;"><i class="fa-solid fa-trash"></i> Remove Homework</button>` : ''}
        <span id="hw-editor-status" class="text-muted text-sm"></span>
      </div>
    </div></div>`;
}

async function saveAdminHomework(moduleId) {
  const status = document.getElementById('hw-editor-status');
  const payload = {
    title: document.getElementById('hw-title').value || null,
    description: document.getElementById('hw-desc').value || '',
    is_required: document.getElementById('hw-required').checked,
    max_size_mb: parseInt(document.getElementById('hw-max').value, 10) || 500
  };
  if (!payload.description.trim()) { if (status) status.innerHTML = '<span style="color:#c62828;">Description is required.</span>'; return; }
  if (status) status.textContent = 'Saving…';
  const r = await apiCall('/api/admin/modules/' + encodeURIComponent(moduleId) + '/homework', {
    method: 'PUT', body: JSON.stringify(payload)
  });
  if (r && !r.error) {
    if (status) status.innerHTML = '<span style="color:#2e7d32;">Saved.</span>';
    loadAdminModuleHomework(moduleId);
  } else {
    if (status) status.innerHTML = '<span style="color:#c62828;">' + escapeHtml((r && r.error) || 'Save failed') + '</span>';
  }
}
window.saveAdminHomework = saveAdminHomework;

async function deleteAdminHomework(moduleId) {
  if (!confirm('Remove the homework prompt? Submissions will be kept unless you confirm wiping them.')) return;
  const wipe = confirm('Also delete all student submissions for this homework? Click OK to delete submissions, Cancel to keep them.');
  const url = '/api/admin/modules/' + encodeURIComponent(moduleId) + '/homework' + (wipe ? '?wipe_submissions=true' : '');
  const r = await apiCall(url, { method: 'DELETE' });
  if (r && !r.error) loadAdminModuleHomework(moduleId);
  else alert((r && r.error) || 'Delete failed');
}
window.deleteAdminHomework = deleteAdminHomework;

function renderAdminHomeworkSubmissionsList(moduleId, subs) {
  const target = document.getElementById('hw-submissions');
  if (!target) return;
  if (!subs.length) {
    target.innerHTML = `<div class="card"><div class="card-body text-center text-muted"><i class="fa-solid fa-inbox"></i> No submissions yet for this module.</div></div>`;
    return;
  }
  target.innerHTML = `
    <div class="card"><div class="card-body">
      <h3 style="margin-top:0;"><i class="fa-solid fa-inbox"></i> Submissions (${subs.length})</h3>
      <div style="display:flex;flex-direction:column;gap:14px;">
        ${subs.map(s => renderAdminSubmissionRow(s)).join('')}
      </div>
    </div></div>`;
  // Wire up comments threads
  subs.forEach(s => renderHomeworkCommentsThread(s.id));
}

function renderAdminSubmissionRow(s) {
  const locked = _hwIsLocked(s.status);
  return `
    <div style="border:1px solid #e6dfd1;border-radius:10px;padding:14px;background:#fafaf7;">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:10px;flex-wrap:wrap;">
        <div>
          <div style="font-weight:600;">${escapeHtml(s.full_name || s.username)}</div>
          <div class="text-muted text-sm">${escapeHtml(s.email || '')} &middot; submitted ${new Date(s.submitted_at).toLocaleString()}</div>
        </div>
        ${_hwStatusBadge(s.status)}
      </div>
      <video controls preload="metadata" style="width:100%;max-height:480px;margin-top:10px;border-radius:8px;background:#000;">
        <source src="${escapeAttr(s.video_url)}" type="${escapeAttr(s.mime_type || 'video/mp4')}">
        Cannot play this video. <a href="${escapeAttr(s.video_url)}" target="_blank">Download it.</a>
      </video>
      <div class="text-muted text-sm" style="margin-top:6px;">${escapeHtml(s.original_filename || '')} &middot; ${_hwFmtBytes(s.size_bytes)} &middot; <a href="${escapeAttr(s.video_url)}" target="_blank">open in new tab</a></div>
      ${s.student_notes ? `<div style="margin-top:8px;"><em>Student notes:</em> ${escapeHtml(s.student_notes)}</div>` : ''}
      <div style="margin-top:12px;border-top:1px dashed #d8cdb8;padding-top:12px;">
        <h4 style="margin:0 0 6px 0;font-size:14px;"><i class="fa-solid fa-gavel"></i> Grade</h4>
        <textarea id="hw-feedback-${s.id}" rows="2" placeholder="Grading note (saved with the status)" class="form-control" style="margin-bottom:8px;">${escapeHtml(s.admin_feedback || '')}</textarea>
        <div style="display:flex;gap:8px;flex-wrap:wrap;">
          <button class="btn btn-primary btn-sm" onclick="gradeHomework(${s.id}, 'approved')" style="background:#2e7d32;border-color:#2e7d32;"><i class="fa-solid fa-circle-check"></i> Approve</button>
          <button class="btn btn-primary btn-sm" onclick="gradeHomework(${s.id}, 'needs_revision')" style="background:#e65100;border-color:#e65100;"><i class="fa-solid fa-rotate-right"></i> Request Revision</button>
          ${locked ? `<button class="btn btn-secondary btn-sm" onclick="gradeHomework(${s.id}, 'submitted')" title="Reopen so the student can replace the video"><i class="fa-solid fa-unlock"></i> Reopen</button>` : ''}
          <button class="btn btn-ghost btn-sm" onclick="deleteAdminSubmission(${s.id})" style="color:#c62828;margin-left:auto;"><i class="fa-solid fa-trash"></i> Delete</button>
        </div>
        <span id="hw-grade-status-${s.id}" class="text-muted text-sm" style="margin-top:6px;display:inline-block;"></span>
      </div>
      <div id="hw-comments-${s.id}" style="margin-top:12px;"></div>
    </div>`;
}

async function gradeHomework(submissionId, status) {
  const fb = (document.getElementById('hw-feedback-' + submissionId) || {}).value || '';
  const st = document.getElementById('hw-grade-status-' + submissionId);
  if (st) st.textContent = 'Saving…';
  const r = await apiCall('/api/admin/homework-submissions/' + submissionId, {
    method: 'PATCH',
    body: JSON.stringify({ status, admin_feedback: fb })
  });
  if (r && !r.error) {
    if (st) st.innerHTML = '<span style="color:#2e7d32;">Saved.</span>';
    // Refresh row (reload current page data)
    const p = APP.viewParams || {};
    if (p.view === 'moduleHomework' && p.moduleId) loadAdminModuleHomework(p.moduleId);
    else if (p.view === 'homework-inbox') loadAdminHomeworkInbox();
  } else {
    if (st) st.innerHTML = '<span style="color:#c62828;">' + escapeHtml((r && r.error) || 'Failed') + '</span>';
  }
}
window.gradeHomework = gradeHomework;

async function deleteAdminSubmission(id) {
  if (!confirm('Delete this submission and its video file? This cannot be undone.')) return;
  const r = await apiCall('/api/admin/homework-submissions/' + id, { method: 'DELETE' });
  if (r && !r.error) {
    const p = APP.viewParams || {};
    if (p.view === 'moduleHomework' && p.moduleId) loadAdminModuleHomework(p.moduleId);
    else if (p.view === 'homework-inbox') loadAdminHomeworkInbox();
  } else alert((r && r.error) || 'Delete failed');
}
window.deleteAdminSubmission = deleteAdminSubmission;

// ----- ADMIN: Homework Inbox (all modules) -----

function renderAdminHomeworkInbox() {
  setTimeout(loadAdminHomeworkInbox, 0);
  return `
    <div class="breadcrumb fade-in"><a href="#" onclick="navigate('admin');return false;">Admin</a>
      <i class="fa-solid fa-chevron-right" style="font-size:10px;"></i><span>Homework Inbox</span></div>
    <div class="page-header fade-in"><h1><i class="fa-solid fa-inbox"></i> Homework Inbox</h1>
      <p>All student video homework, newest first. Approve or request revisions, then leave feedback comments.</p></div>
    <div style="margin-bottom:14px;display:flex;gap:8px;flex-wrap:wrap;">
      <button class="btn btn-secondary btn-sm" onclick="filterHomeworkInbox('')">All</button>
      <button class="btn btn-secondary btn-sm" onclick="filterHomeworkInbox('submitted')">Pending</button>
      <button class="btn btn-secondary btn-sm" onclick="filterHomeworkInbox('approved')">Approved</button>
      <button class="btn btn-secondary btn-sm" onclick="filterHomeworkInbox('needs_revision')">Needs Revision</button>
    </div>
    <div id="hw-inbox"><div class="card"><div class="card-body text-center text-muted">Loading…</div></div></div>`;
}

let _hwInboxFilter = '';
function filterHomeworkInbox(status) {
  _hwInboxFilter = status || '';
  loadAdminHomeworkInbox();
}
window.filterHomeworkInbox = filterHomeworkInbox;

async function loadAdminHomeworkInbox() {
  const url = '/api/admin/homework-submissions' + (_hwInboxFilter ? ('?status=' + encodeURIComponent(_hwInboxFilter)) : '');
  const data = await apiCall(url);
  const subs = Array.isArray(data) ? data : [];
  NUMA_HW.inbox = subs;
  const target = document.getElementById('hw-inbox');
  if (!target) return;
  if (!subs.length) {
    target.innerHTML = `<div class="card"><div class="card-body text-center text-muted"><i class="fa-solid fa-inbox"></i> No submissions ${_hwInboxFilter ? 'in this category.' : 'yet.'}</div></div>`;
    return;
  }
  target.innerHTML = `<div class="card"><div class="card-body">
    <div style="display:flex;flex-direction:column;gap:14px;">
      ${subs.map(s => `<div>
        <div style="margin-bottom:6px;font-size:13px;color:#6b5b48;"><strong>Module ${escapeHtml(String(s.module_id))}</strong>${s.homework_title ? ' · ' + escapeHtml(s.homework_title) : ''}</div>
        ${renderAdminSubmissionRow(s)}
      </div>`).join('')}
    </div>
  </div></div>`;
  subs.forEach(s => renderHomeworkCommentsThread(s.id));
}

// Add a "Homework Inbox" card on the admin overview
(function addHomeworkInboxAdminCard() {
  if (typeof renderAdminContent !== 'function') return;
  const _orig = renderAdminContent;
  window.renderAdminContent = function() {
    const html = _orig.apply(this, arguments);
    setTimeout(() => {
      const grid = document.querySelector('.admin-overview-grid');
      if (!grid || grid.dataset.hwInboxCard === '1') return;
      grid.dataset.hwInboxCard = '1';
      const card = document.createElement('div');
      card.className = 'admin-overview-card';
      card.onclick = () => navigate('admin', { view: 'homework-inbox' });
      card.innerHTML = '<div class="admin-overview-icon"><i class="fa-solid fa-video"></i></div>'
        + '<h3>Homework Inbox</h3>'
        + '<p>Review and grade student video submissions across all modules</p>';
      grid.appendChild(card);
    }, 0);
    return html;
  };
  renderAdminContent = window.renderAdminContent;
})();

// ============================================================================
// ===== NOTIFICATIONS (dashboard bell + banner) ==============================
// ============================================================================
// Polls the backend for new notifications, shows a banner on the dashboard
// for unread items, and adds a bell icon in the page header.

(function () {
  const NUMA_NOTIF = window.NUMA_NOTIF = window.NUMA_NOTIF || {
    items: [],
    unread: 0,
    lastFetched: 0,
    polling: null
  };

  function _typeIcon(t) {
    switch (t) {
      case 'homework_feedback': return 'fa-clipboard-check';
      case 'homework_comment':  return 'fa-comment-dots';
      case 'scenario_assigned': return 'fa-briefcase-medical';
      case 'scenario_graded':   return 'fa-award';
      case 'forum_message':     return 'fa-comments';
      default:                  return 'fa-bell';
    }
  }
  function _timeAgo(iso) {
    const d = new Date(iso); const now = new Date(); const s = Math.floor((now - d) / 1000);
    if (s < 60) return 'just now';
    if (s < 3600) return Math.floor(s/60) + 'm ago';
    if (s < 86400) return Math.floor(s/3600) + 'h ago';
    return d.toLocaleDateString();
  }

  function _ensureNotifStyles() {
    if (document.getElementById('numa-notif-styles')) return;
    const el = document.createElement('style');
    el.id = 'numa-notif-styles';
    el.textContent = `
      .numa-bell{position:relative;display:inline-flex;align-items:center;justify-content:center;
        width:38px;height:38px;border-radius:50%;background:#fff;border:1px solid #e6dfd1;cursor:pointer;
        color:#5a4a36;margin-left:8px;flex-shrink:0;}
      .numa-bell:hover{background:#fafaf7;border-color:#d6c8b3;}
      .numa-bell .dot{position:absolute;top:6px;right:6px;min-width:18px;height:18px;padding:0 5px;
        border-radius:9px;background:#c0392b;color:#fff;font-size:11px;font-weight:700;display:flex;
        align-items:center;justify-content:center;}
      .numa-notif-panel{position:fixed;top:64px;right:24px;width:360px;max-width:calc(100vw - 32px);
        max-height:70vh;overflow-y:auto;background:#fff;border:1px solid #e6dfd1;border-radius:14px;
        box-shadow:0 10px 30px rgba(0,0,0,.12);z-index:9999;display:none;}
      .numa-notif-panel.open{display:block;}
      .numa-notif-header{padding:12px 14px;border-bottom:1px solid #f0e8d8;display:flex;
        align-items:center;justify-content:space-between;background:#fafaf7;border-radius:14px 14px 0 0;}
      .numa-notif-header h3{margin:0;font-size:15px;color:#3b2f24;}
      .numa-notif-header button{background:transparent;border:0;color:#A38D78;font-size:12px;cursor:pointer;}
      .numa-notif-empty{padding:36px 16px;text-align:center;color:#8a7a6a;font-size:13px;}
      .numa-notif-item{display:flex;gap:10px;padding:12px 14px;border-bottom:1px solid #f5efe2;cursor:pointer;}
      .numa-notif-item:hover{background:#fafaf7;}
      .numa-notif-item.unread{background:#fff8ee;}
      .numa-notif-item.unread:hover{background:#fff3e0;}
      .numa-notif-item .icon{width:36px;height:36px;border-radius:50%;background:#f3ece0;color:#A38D78;
        display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:14px;}
      .numa-notif-item.unread .icon{background:#A38D78;color:#fff;}
      .numa-notif-item .body{flex:1;min-width:0;}
      .numa-notif-item .body .title{font-weight:600;font-size:13.5px;color:#3b2f24;margin-bottom:2px;}
      .numa-notif-item .body .desc{font-size:12.5px;color:#6a5b4a;line-height:1.4;
        display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;}
      .numa-notif-item .body .when{font-size:11px;color:#a09080;margin-top:3px;}
      .numa-notif-dash{margin-bottom:18px;padding:14px 16px;border-radius:12px;background:#fff8ee;
        border:1px solid #e8d9b8;display:flex;gap:12px;align-items:center;animation:fadeIn .3s ease;}
      .numa-notif-dash .icon{width:42px;height:42px;border-radius:50%;background:#A38D78;color:#fff;
        display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:18px;}
      .numa-notif-dash .body{flex:1;min-width:0;}
      .numa-notif-dash .body .title{font-weight:600;color:#3b2f24;margin-bottom:2px;}
      .numa-notif-dash .body .desc{font-size:13px;color:#6a5b4a;}
      .numa-notif-dash button{background:#A38D78;color:#fff;border:0;padding:8px 14px;border-radius:8px;
        font-size:13px;cursor:pointer;flex-shrink:0;}
      .numa-notif-dash button:hover{background:#8e7967;}
    `;
    document.head.appendChild(el);
  }

  async function fetchNotifications(silent) {
    try {
      const data = await apiCall('/api/notifications?limit=30');
      if (data && Array.isArray(data.items)) {
        NUMA_NOTIF.items = data.items;
        NUMA_NOTIF.unread = data.unread_count || 0;
        NUMA_NOTIF.lastFetched = Date.now();
        updateBell();
        if (!silent) renderPanel();
        renderDashBanner();
      }
    } catch (e) { /* silent */ }
  }
  window.fetchNotifications = fetchNotifications;

  function updateBell() {
    const bell = document.getElementById('numa-bell');
    if (!bell) return;
    const dot = bell.querySelector('.dot');
    if (NUMA_NOTIF.unread > 0) {
      if (!dot) {
        const d = document.createElement('span');
        d.className = 'dot';
        d.textContent = NUMA_NOTIF.unread > 9 ? '9+' : String(NUMA_NOTIF.unread);
        bell.appendChild(d);
      } else {
        dot.textContent = NUMA_NOTIF.unread > 9 ? '9+' : String(NUMA_NOTIF.unread);
      }
    } else if (dot) {
      dot.remove();
    }
  }

  function ensureBell() {
    _ensureNotifStyles();
    if (document.getElementById('numa-bell')) return;
    // Mount the bell into the topbar / header area. Try a few selectors.
    const target = document.querySelector('.topbar-right, .header-right, .navbar-right, .main-header, header')
                || document.querySelector('.page-header');
    if (!target) return;
    const bell = document.createElement('button');
    bell.id = 'numa-bell';
    bell.className = 'numa-bell';
    bell.title = 'Notifications';
    bell.innerHTML = '<i class="fa-regular fa-bell"></i>';
    bell.onclick = (e) => { e.stopPropagation(); togglePanel(); };
    // Position the bell as inline next to the page-header (since we don't have a real topbar)
    if (target.classList.contains('page-header')) {
      target.style.display = 'flex';
      target.style.justifyContent = 'space-between';
      target.style.alignItems = 'flex-start';
      target.appendChild(bell);
    } else {
      target.appendChild(bell);
    }
    updateBell();
    // Click-outside dismiss
    document.addEventListener('click', (e) => {
      const panel = document.getElementById('numa-notif-panel');
      if (panel && !panel.contains(e.target) && e.target.id !== 'numa-bell' && !panel.classList.contains('hidden')) {
        panel.classList.remove('open');
      }
    });
  }

  function togglePanel() {
    let panel = document.getElementById('numa-notif-panel');
    if (!panel) {
      panel = document.createElement('div');
      panel.id = 'numa-notif-panel';
      panel.className = 'numa-notif-panel';
      document.body.appendChild(panel);
    }
    if (panel.classList.contains('open')) {
      panel.classList.remove('open');
    } else {
      renderPanel();
      panel.classList.add('open');
    }
  }
  window.toggleNotifPanel = togglePanel;

  function renderPanel() {
    const panel = document.getElementById('numa-notif-panel');
    if (!panel) return;
    const items = NUMA_NOTIF.items || [];
    let body = '';
    if (items.length === 0) {
      body = '<div class="numa-notif-empty"><i class="fa-regular fa-bell-slash" style="font-size:28px;color:#c7b9a3;display:block;margin-bottom:8px;"></i>No notifications yet.</div>';
    } else {
      body = items.map(n => `
        <div class="numa-notif-item ${n.is_read ? '' : 'unread'}" onclick="openNotification(${n.id})">
          <div class="icon"><i class="fa-solid ${_typeIcon(n.type)}"></i></div>
          <div class="body">
            <div class="title">${escapeHtml(n.title || '')}</div>
            ${n.body ? `<div class="desc">${escapeHtml(n.body)}</div>` : ''}
            <div class="when">${_timeAgo(n.created_at)}</div>
          </div>
        </div>`).join('');
    }
    panel.innerHTML = `
      <div class="numa-notif-header">
        <h3>Notifications${NUMA_NOTIF.unread ? ` <span style="color:#A38D78;">(${NUMA_NOTIF.unread})</span>` : ''}</h3>
        <button onclick="markAllNotificationsRead()">Mark all read</button>
      </div>
      ${body}`;
  }

  async function openNotification(id) {
    const n = (NUMA_NOTIF.items || []).find(x => x.id === id);
    if (!n) return;
    // Mark as read
    await apiCall('/api/notifications/mark-read', { method: 'POST', body: JSON.stringify({ ids: [id] }) });
    n.is_read = true;
    NUMA_NOTIF.unread = Math.max(0, NUMA_NOTIF.unread - 1);
    updateBell();
    renderPanel();
    // Close panel and navigate
    const panel = document.getElementById('numa-notif-panel');
    if (panel) panel.classList.remove('open');
    if (n.link_view) {
      try { navigate(n.link_view, n.link_params || {}); }
      catch (e) { console.warn('nav failed', e); }
    }
  }
  window.openNotification = openNotification;

  async function markAllNotificationsRead() {
    await apiCall('/api/notifications/mark-read', { method: 'POST', body: JSON.stringify({ all: true }) });
    NUMA_NOTIF.items.forEach(n => n.is_read = true);
    NUMA_NOTIF.unread = 0;
    updateBell();
    renderPanel();
    renderDashBanner();
  }
  window.markAllNotificationsRead = markAllNotificationsRead;

  // Dashboard banner: shown if user has unread notifications on the dashboard page
  function renderDashBanner() {
    // Only on dashboard
    if (APP.view !== 'dashboard') return;
    _ensureNotifStyles();
    const main = document.querySelector('.main-content, .content, main') || document.body;
    const existing = document.getElementById('numa-notif-banner');
    if (NUMA_NOTIF.unread === 0) {
      if (existing) existing.remove();
      return;
    }
    // Find the freshest unread item
    const top = (NUMA_NOTIF.items || []).find(n => !n.is_read);
    if (!top) { if (existing) existing.remove(); return; }
    const html = `
      <div id="numa-notif-banner" class="numa-notif-dash">
        <div class="icon"><i class="fa-solid ${_typeIcon(top.type)}"></i></div>
        <div class="body">
          <div class="title">${escapeHtml(top.title || '')}${NUMA_NOTIF.unread > 1 ? ` <span style="color:#A38D78;font-weight:500;">+ ${NUMA_NOTIF.unread - 1} more</span>` : ''}</div>
          ${top.body ? `<div class="desc">${escapeHtml(top.body)}</div>` : ''}
        </div>
        <button onclick="openNotification(${top.id})">View</button>
      </div>`;
    if (existing) {
      existing.outerHTML = html;
    } else {
      // Insert at the top of the main content area
      const pageHeader = document.querySelector('.page-header');
      if (pageHeader && pageHeader.parentNode) {
        const wrap = document.createElement('div');
        wrap.innerHTML = html;
        pageHeader.parentNode.insertBefore(wrap.firstElementChild, pageHeader.nextSibling);
      } else {
        main.insertAdjacentHTML('afterbegin', html);
      }
    }
  }
  window.renderDashBanner = renderDashBanner;

  function startPolling() {
    if (NUMA_NOTIF.polling) return;
    NUMA_NOTIF.polling = setInterval(() => fetchNotifications(true), 45000);
  }
  function stopPolling() {
    if (NUMA_NOTIF.polling) { clearInterval(NUMA_NOTIF.polling); NUMA_NOTIF.polling = null; }
  }
  window.startNotificationPolling = startPolling;
  window.stopNotificationPolling = stopPolling;

  // Hook into every render to ensure the bell + banner stay mounted
  if (typeof window._renderAppOriginal === 'undefined' && typeof renderApp === 'function') {
    window._renderAppOriginal = renderApp;
    window.renderApp = function () {
      const out = window._renderAppOriginal.apply(this, arguments);
      // After the DOM updates, mount the bell + banner
      setTimeout(() => {
        if (APP.currentUser && APP.token) {
          ensureBell();
          // Refresh on dashboard view, otherwise rely on poll
          if (APP.view === 'dashboard') fetchNotifications(false);
          renderDashBanner();
          startPolling();
        }
      }, 0);
      return out;
    };
  }

  // Kick off an initial fetch on load (after login)
  setTimeout(() => {
    if (APP.currentUser && APP.token) {
      ensureBell();
      fetchNotifications(false);
      startPolling();
    }
  }, 500);
})();
