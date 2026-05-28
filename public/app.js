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

  // Admin login (local fallback)
  if (user === 'admin' && pass === 'numa2026') {
    APP.currentUser = { username: 'admin', isAdmin: true };
    saveSession({ username: 'admin', isAdmin: true });
    navigate('admin');
    return;
  }

  const userData = getUserData(user);
  if (!userData) {
    errEl.textContent = 'Account not found. Please register first.';
    errEl.style.display = 'block';
    return;
  }
  if (userData.password !== pass) {
    errEl.textContent = 'Incorrect password.';
    errEl.style.display = 'block';
    return;
  }

  APP.currentUser = userData;
  saveSession({ username: user });
  navigate('dashboard');
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
  const bestScore = user.quizScores ? user.quizScores[mod.id] : null;
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
    const data = await apiCall('/api/modules');
    if (data && Array.isArray(data)) {
      // Hydrate each module with its sections
      const full = [];
      for (const m of data) {
        const detail = await apiCall(`/api/modules/${m.id}`);
        full.push(detail || { ...m, sections: [] });
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

function renderModuleManager() {
  setTimeout(async () => {
    const modules = await loadAdminModules(true);
    const container = document.getElementById('module-manager-list');
    if (!container) return;
    if (!modules.length) {
      container.innerHTML = '<p class="text-muted">No modules yet. Click "Add New Module" to create one.</p>';
      return;
    }
    container.innerHTML = modules.map((m, idx) => `
      <div class="card" style="margin-bottom:14px;">
        <div class="card-body" style="display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;">
          <div style="flex:1;min-width:240px;">
            <div style="display:flex;align-items:center;gap:10px;margin-bottom:4px;">
              <i class="fa-solid ${m.icon || 'fa-book'}" style="color:var(--terracotta);"></i>
              <strong style="font-size:1.05rem;">${escapeHtml(m.title)}</strong>
              <span class="badge ${m.is_published === false ? 'badge-warning' : 'badge-complete'}">${m.is_published === false ? 'Draft' : 'Published'}</span>
            </div>
            <div class="text-muted" style="font-size:0.85rem;">${escapeHtml(m.week || m.subtitle || '')}</div>
            <div class="text-muted" style="font-size:0.8rem;margin-top:4px;">${(m.sections || []).length} section${(m.sections || []).length !== 1 ? 's' : ''}</div>
          </div>
          <div style="display:flex;gap:8px;flex-wrap:wrap;">
            <button class="btn btn-secondary btn-sm" onclick="navigate('admin',{view:'editModule',moduleId:'${m.id}'})"><i class="fa-solid fa-pen"></i> Edit</button>
            <button class="btn btn-secondary btn-sm" onclick="deleteModuleConfirm('${m.id}', '${escapeAttr(m.title)}')"><i class="fa-solid fa-trash"></i> Delete</button>
          </div>
        </div>
      </div>
    `).join('');
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
}

function sortableSectionRow(s, idx, total, moduleId) {
  return `
    <div class="sortable-row" draggable="true" data-section-id="${escapeAttr(s.id)}" data-module-id="${escapeAttr(moduleId)}"
         style="padding:12px;border:1px solid var(--cream-darker);border-radius:8px;margin-bottom:8px;display:flex;align-items:center;gap:10px;flex-wrap:wrap;background:#fff;cursor:move;transition:all 0.15s;">
      <div style="color:var(--charcoal-light);cursor:grab;padding:0 6px;" title="Drag to reorder"><i class="fa-solid fa-grip-vertical"></i></div>
      <div class="section-index" style="width:28px;height:28px;border-radius:50%;background:var(--terracotta);color:#fff;display:flex;align-items:center;justify-content:center;font-weight:600;font-size:0.85rem;flex-shrink:0;">${idx + 1}</div>
      <div style="flex:1;min-width:200px;">
        <strong>${escapeHtml(s.title)}</strong>
        <div class="text-muted" style="font-size:0.8rem;">${(s.content || '').length} characters</div>
      </div>
      <div style="display:flex;gap:4px;">
        <button class="btn btn-ghost btn-sm" onclick="moveSectionArrow('${escapeAttr(moduleId)}','${escapeAttr(s.id)}',-1)" ${idx === 0 ? 'disabled style="opacity:0.3;"' : ''} title="Move up"><i class="fa-solid fa-arrow-up"></i></button>
        <button class="btn btn-ghost btn-sm" onclick="moveSectionArrow('${escapeAttr(moduleId)}','${escapeAttr(s.id)}',1)" ${idx === total - 1 ? 'disabled style="opacity:0.3;"' : ''} title="Move down"><i class="fa-solid fa-arrow-down"></i></button>
        <button class="btn btn-secondary btn-sm" onclick="navigate('admin',{view:'editSection',moduleId:'${escapeAttr(moduleId)}',sectionId:'${escapeAttr(s.id)}'})"><i class="fa-solid fa-pen"></i> Edit</button>
        <button class="btn btn-secondary btn-sm" onclick="deleteSectionConfirm('${escapeAttr(s.id)}','${escapeAttr(s.title)}','${escapeAttr(moduleId)}')"><i class="fa-solid fa-trash"></i></button>
      </div>
    </div>
  `;
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
  const result = await apiCall(`/api/admin/modules/${moduleId}/reorder-sections`, {
    method: 'PUT',
    body: JSON.stringify({ section_ids: sectionIds })
  });
  if (result && result.ok) {
    if (statusEl) statusEl.innerHTML = '<span style="color:var(--success);"><i class="fa-solid fa-check"></i> Order saved.</span>';
    _adminModulesCache = null;
    setTimeout(() => { if (statusEl) statusEl.innerHTML = ''; }, 2000);
  } else {
    if (statusEl) statusEl.innerHTML = '<span style="color:var(--error);">Save failed. Try again.</span>';
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
    <div style="margin-bottom:20px;">
      <button class="btn btn-secondary" onclick="navigate('admin',{view:'editModule',moduleId:'${moduleId}'})"><i class="fa-solid fa-arrow-left"></i> Back to Module</button>
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
// ===== STUDENT: ASK A QUESTION ==============================================
// =============================================================================
function renderStudentQuestions() {
  setTimeout(loadStudentQuestions, 0);
  return `
    <div class="page-header fade-in">
      <h1>Ask a Question</h1>
      <p>Send a private question to NUMA staff — they'll reply here</p>
    </div>
    <div class="card slide-up">
      <div class="card-body">
        <input id="q-subject" class="input" placeholder="Subject (optional)" style="margin-bottom:8px;">
        <textarea id="q-body" class="input" rows="5" placeholder="Type your question…" style="resize:vertical;"></textarea>
        <div style="margin-top:10px;display:flex;gap:8px;">
          <button class="btn btn-primary" onclick="submitStudentQuestion()"><i class="fa-solid fa-paper-plane"></i> Send Question</button>
        </div>
      </div>
    </div>
    <h2 class="mb-2 mt-4" style="font-size:1.3rem;">My Questions</h2>
    <div id="my-questions"><div class="card"><div class="card-body text-center text-muted">Loading…</div></div></div>`;
}

async function loadStudentQuestions() {
  const list = await apiCall('/api/questions') || [];
  const target = document.getElementById('my-questions');
  if (!target) return;
  if (list.length === 0) {
    target.innerHTML = '<div class="card"><div class="card-body text-center text-muted">You haven\'t asked any questions yet.</div></div>';
    return;
  }
  let rows = '';
  list.forEach(q => {
    const status = q.status === 'answered'
      ? '<span class="badge badge-complete">Answered</span>'
      : q.status === 'closed' ? '<span class="badge badge-locked">Closed</span>'
      : '<span class="badge badge-progress">Open</span>';
    rows += `
      <div class="card" style="margin-bottom:10px;cursor:pointer;" onclick="navigate('question-detail',{id:${q.id}})">
        <div class="card-body" style="display:flex;justify-content:space-between;align-items:center;gap:10px;">
          <div style="flex:1;min-width:0;">
            <div style="font-weight:600;">${escapeHtml(q.subject || '(No subject)')}</div>
            <div class="text-muted text-sm" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escapeHtml((q.body || '').slice(0, 120))}</div>
          </div>
          <div style="text-align:right;">
            ${status}
            <div class="text-muted text-sm">${q.reply_count || 0} repl${q.reply_count === 1 ? 'y' : 'ies'}</div>
          </div>
        </div>
      </div>`;
  });
  target.innerHTML = rows;
}

async function submitStudentQuestion() {
  const subject = (document.getElementById('q-subject')?.value || '').trim();
  const body = (document.getElementById('q-body')?.value || '').trim();
  if (!body) { alert('Please type a question.'); return; }
  const out = await apiCall('/api/questions', {
    method: 'POST',
    body: JSON.stringify({ subject, body })
  });
  if (out) {
    document.getElementById('q-subject').value = '';
    document.getElementById('q-body').value = '';
    loadStudentQuestions();
  } else {
    alert('Could not submit. Please try again.');
  }
}

function renderStudentQuestionDetail() {
  const id = APP.viewParams?.id;
  setTimeout(() => loadQuestionThread(id, false), 0);
  return `
    <div class="breadcrumb fade-in"><a href="#" onclick="navigate('questions');return false;">My Questions</a> <i class="fa-solid fa-chevron-right" style="font-size:10px;"></i> <span>Thread</span></div>
    <div id="q-thread"><div class="card"><div class="card-body text-center text-muted">Loading…</div></div></div>`;
}

async function loadQuestionThread(id, isAdmin) {
  const data = await apiCall(`/api/questions/${id}`);
  const target = document.getElementById('q-thread');
  if (!target || !data) return;
  const q = data.question;
  let html = `
    <div class="card slide-up">
      <div class="card-body">
        <h2 style="margin:0 0 4px;">${escapeHtml(q.subject || '(No subject)')}</h2>
        <div class="text-muted text-sm" style="margin-bottom:10px;">
          From ${escapeHtml(q.student_name || q.student_username)} • ${new Date(q.created_at).toLocaleString()}
          ${q.status === 'answered' ? '<span class="badge badge-complete" style="margin-left:8px;">Answered</span>' : ''}
        </div>
        <div style="white-space:pre-wrap;">${escapeHtml(q.body)}</div>
      </div>
    </div>`;
  (data.replies || []).forEach(r => {
    const isStaff = r.author_role === 'admin';
    html += `
      <div class="card" style="margin-top:10px;${isStaff ? 'border-left:4px solid var(--terracotta);' : ''}">
        <div class="card-body">
          <div class="text-muted text-sm" style="margin-bottom:6px;">
            <strong>${escapeHtml(r.author_name || 'User')}</strong> ${isStaff ? '<span class="badge badge-complete">Staff</span>' : ''}
            • ${new Date(r.created_at).toLocaleString()}
          </div>
          <div style="white-space:pre-wrap;">${escapeHtml(r.body)}</div>
        </div>
      </div>`;
  });
  // Reply box
  if (q.status !== 'closed') {
    html += `
      <div class="card" style="margin-top:14px;">
        <div class="card-body">
          <textarea id="q-reply-body" class="input" rows="4" placeholder="${isAdmin ? 'Write a reply to the student…' : 'Reply…'}" style="resize:vertical;"></textarea>
          <div style="margin-top:8px;display:flex;gap:8px;">
            <button class="btn btn-primary" onclick="submitQuestionReply(${id}, ${isAdmin})"><i class="fa-solid fa-paper-plane"></i> Send Reply</button>
            ${isAdmin ? `<button class="btn btn-secondary" onclick="updateQuestionStatus(${id},'answered')">Mark Answered</button>
            <button class="btn btn-ghost" onclick="updateQuestionStatus(${id},'closed')">Close Thread</button>` : ''}
          </div>
        </div>
      </div>`;
  }
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
  setTimeout(loadAdminQuestions, 0);
  return `
    <div class="breadcrumb fade-in"><a href="#" onclick="navigate('admin');return false;">Admin</a> <i class="fa-solid fa-chevron-right" style="font-size:10px;"></i> <span>Student Questions</span></div>
    <div class="page-header"><h1>Student Questions</h1><p>Reply to questions submitted by your students</p></div>
    <div style="display:flex;gap:8px;margin-bottom:14px;flex-wrap:wrap;">
      <button class="btn btn-secondary btn-sm" onclick="loadAdminQuestions('open')">Open</button>
      <button class="btn btn-secondary btn-sm" onclick="loadAdminQuestions('answered')">Answered</button>
      <button class="btn btn-secondary btn-sm" onclick="loadAdminQuestions('closed')">Closed</button>
      <button class="btn btn-ghost btn-sm" onclick="loadAdminQuestions()">All</button>
    </div>
    <div id="admin-q-list"><div class="card"><div class="card-body text-center text-muted">Loading…</div></div></div>`;
}

async function loadAdminQuestions(status) {
  const path = '/api/admin/questions' + (status ? '?status=' + status : '');
  const list = await apiCall(path) || [];
  const target = document.getElementById('admin-q-list');
  if (!target) return;
  if (list.length === 0) {
    target.innerHTML = '<div class="card"><div class="card-body text-center text-muted">No questions in this view.</div></div>';
    return;
  }
  let rows = '';
  list.forEach(q => {
    const badge = q.status === 'answered'
      ? '<span class="badge badge-complete">Answered</span>'
      : q.status === 'closed' ? '<span class="badge badge-locked">Closed</span>'
      : '<span class="badge badge-progress">Open</span>';
    rows += `
      <div class="card" style="margin-bottom:10px;cursor:pointer;" onclick="navigate('admin',{view:'question-detail',id:${q.id}})">
        <div class="card-body" style="display:flex;justify-content:space-between;gap:10px;">
          <div style="flex:1;min-width:0;">
            <div style="font-weight:600;">${escapeHtml(q.subject || '(No subject)')}</div>
            <div class="text-muted text-sm">From <strong>${escapeHtml(q.student_name || q.student_username)}</strong> • ${new Date(q.created_at).toLocaleString()}</div>
            <div class="text-muted text-sm" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escapeHtml((q.body || '').slice(0, 140))}</div>
          </div>
          <div style="text-align:right;">${badge}<div class="text-muted text-sm">${q.reply_count} repl${q.reply_count === 1 ? 'y' : 'ies'}</div></div>
        </div>
      </div>`;
  });
  target.innerHTML = rows;
}

function renderAdminQuestionDetail() {
  const id = APP.viewParams?.id;
  setTimeout(() => loadQuestionThread(id, true), 0);
  return `
    <div class="breadcrumb fade-in"><a href="#" onclick="navigate('admin',{view:'questions'});return false;">Student Questions</a> <i class="fa-solid fa-chevron-right" style="font-size:10px;"></i> <span>Thread</span></div>
    <div id="q-thread"><div class="card"><div class="card-body text-center text-muted">Loading…</div></div></div>`;
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
    <div class="page-header"><h1>Section Quiz Editor</h1><p>Optional quiz attached to one section. Students see it after reading the section.</p></div>
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
          <label class="text-sm" style="display:flex;align-items:center;gap:6px;margin-top:18px;">
            <input id="sq-optional" type="checkbox" ${quiz.is_optional !== false ? 'checked' : ''}> Optional (students may skip)
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
}

async function deleteSectionQuiz(sectionId) {
  if (!confirm('Remove this section quiz?')) return;
  await apiCall(`/api/admin/sections/${encodeURIComponent(sectionId)}/quiz`, { method: 'DELETE' });
  NUMA_NEW.sectionQuizCache[sectionId] = { title: 'Section Quiz', passing_score: 70, is_optional: true, questions: [] };
  renderSectionQuizEditorBody(sectionId, NUMA_NEW.sectionQuizCache[sectionId]);
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
function renderForumList() {
  setTimeout(loadForumPosts, 0);
  return `
    <div class="page-header fade-in">
      <h1>Discussion Forum</h1>
      <p>Chat with fellow students and your instructors</p>
    </div>
    <div class="card slide-up">
      <div class="card-body">
        <textarea id="forum-new" class="input" rows="3" placeholder="Start a new conversation…" style="resize:vertical;"></textarea>
        <div style="margin-top:8px;"><button class="btn btn-primary" onclick="postForumMessage()"><i class="fa-solid fa-paper-plane"></i> Post</button></div>
      </div>
    </div>
    <div id="forum-list" style="margin-top:14px;"><div class="card"><div class="card-body text-center text-muted">Loading…</div></div></div>`;
}

async function loadForumPosts() {
  const posts = await apiCall('/api/forum/posts') || [];
  const target = document.getElementById('forum-list');
  if (!target) return;
  if (posts.length === 0) {
    target.innerHTML = '<div class="card"><div class="card-body text-center text-muted">No conversations yet. Be the first to post.</div></div>';
    return;
  }
  let html = '';
  posts.forEach(p => {
    const isStaff = p.author_role === 'admin';
    const pinned = p.is_pinned ? '<i class="fa-solid fa-thumbtack" style="color:var(--terracotta);margin-right:6px;"></i>' : '';
    html += `
      <div class="card" style="margin-bottom:10px;cursor:pointer;" onclick="navigate('forum-thread',{id:${p.id}})">
        <div class="card-body">
          <div class="text-muted text-sm" style="margin-bottom:6px;">
            ${pinned}<strong>${escapeHtml(p.author_name || 'User')}</strong>
            ${isStaff ? '<span class="badge badge-complete" style="margin-left:6px;">Staff</span>' : ''}
            • ${new Date(p.created_at).toLocaleString()}
          </div>
          <div style="white-space:pre-wrap;">${escapeHtml((p.body || '').slice(0, 280))}${(p.body || '').length > 280 ? '…' : ''}</div>
          <div class="text-muted text-sm" style="margin-top:8px;"><i class="fa-solid fa-comment"></i> ${p.reply_count || 0} repl${p.reply_count === 1 ? 'y' : 'ies'}</div>
        </div>
      </div>`;
  });
  target.innerHTML = html;
}

async function postForumMessage() {
  const body = (document.getElementById('forum-new')?.value || '').trim();
  if (!body) { alert('Type a message first.'); return; }
  const out = await apiCall('/api/forum/posts', { method: 'POST', body: JSON.stringify({ body }) });
  if (out) {
    document.getElementById('forum-new').value = '';
    loadForumPosts();
  } else alert('Could not post.');
}

function renderForumThread() {
  const id = APP.viewParams?.id;
  setTimeout(() => loadForumThread(id), 0);
  return `
    <div class="breadcrumb fade-in"><a href="#" onclick="navigate('forum');return false;">Discussion Forum</a> <i class="fa-solid fa-chevron-right" style="font-size:10px;"></i> <span>Thread</span></div>
    <div id="forum-thread"><div class="card"><div class="card-body text-center text-muted">Loading…</div></div></div>`;
}

async function loadForumThread(id) {
  const data = await apiCall(`/api/forum/posts/${id}`);
  const target = document.getElementById('forum-thread');
  if (!target || !data) return;
  const p = data.post;
  const isStaff = p.author_role === 'admin';
  const isAdmin = APP.currentUser?.isAdmin;
  const canDeleteTop = isAdmin || p.user_id === APP.currentUser?.id;
  let html = `
    <div class="card slide-up">
      <div class="card-body">
        <div class="text-muted text-sm" style="margin-bottom:8px;">
          <strong>${escapeHtml(p.author_name || 'User')}</strong>
          ${isStaff ? '<span class="badge badge-complete" style="margin-left:6px;">Staff</span>' : ''}
          • ${new Date(p.created_at).toLocaleString()}
          ${canDeleteTop ? `<button class="btn btn-ghost btn-sm" style="margin-left:8px;" onclick="deleteForumPost(${p.id}, true)"><i class="fa-solid fa-trash"></i></button>` : ''}
          ${isAdmin ? `<button class="btn btn-ghost btn-sm" onclick="toggleForumPin(${p.id}, ${!p.is_pinned})">${p.is_pinned ? 'Unpin' : 'Pin'}</button>` : ''}
        </div>
        <div style="white-space:pre-wrap;">${escapeHtml(p.body)}</div>
      </div>
    </div>`;
  (data.replies || []).forEach(r => {
    const rIsStaff = r.author_role === 'admin';
    const canDelete = isAdmin || r.user_id === APP.currentUser?.id;
    html += `
      <div class="card" style="margin-top:10px;${rIsStaff ? 'border-left:4px solid var(--terracotta);' : ''}">
        <div class="card-body">
          <div class="text-muted text-sm" style="margin-bottom:6px;">
            <strong>${escapeHtml(r.author_name || 'User')}</strong>
            ${rIsStaff ? '<span class="badge badge-complete" style="margin-left:6px;">Staff</span>' : ''}
            • ${new Date(r.created_at).toLocaleString()}
            ${canDelete ? `<button class="btn btn-ghost btn-sm" style="margin-left:8px;" onclick="deleteForumPost(${r.id}, false, ${p.id})"><i class="fa-solid fa-trash"></i></button>` : ''}
          </div>
          <div style="white-space:pre-wrap;">${escapeHtml(r.body)}</div>
        </div>
      </div>`;
  });
  html += `
    <div class="card" style="margin-top:14px;">
      <div class="card-body">
        <textarea id="forum-reply" class="input" rows="3" placeholder="Reply to the thread…" style="resize:vertical;"></textarea>
        <div style="margin-top:8px;"><button class="btn btn-primary" onclick="replyForumThread(${p.id})"><i class="fa-solid fa-paper-plane"></i> Reply</button></div>
      </div>
    </div>`;
  target.innerHTML = html;
}

async function replyForumThread(parentId) {
  const body = (document.getElementById('forum-reply')?.value || '').trim();
  if (!body) return;
  const out = await apiCall('/api/forum/posts', { method: 'POST', body: JSON.stringify({ body, parent_id: parentId }) });
  if (out) loadForumThread(parentId);
}

async function deleteForumPost(id, isTop, parentId) {
  if (!confirm('Delete this post?')) return;
  await apiCall(`/api/forum/posts/${id}`, { method: 'DELETE' });
  if (isTop) navigate(APP.currentUser?.isAdmin ? 'admin' : 'forum', APP.currentUser?.isAdmin ? { view: 'forum' } : {});
  else loadForumThread(parentId);
}

async function toggleForumPin(id, pin) {
  await apiCall(`/api/admin/forum/posts/${id}`, { method: 'PUT', body: JSON.stringify({ is_pinned: pin }) });
  loadForumThread(id);
}

function renderAdminForum() {
  // Admins use the same forum UI
  setTimeout(loadForumPosts, 0);
  return `
    <div class="breadcrumb fade-in"><a href="#" onclick="navigate('admin');return false;">Admin</a> <i class="fa-solid fa-chevron-right" style="font-size:10px;"></i> <span>Discussion Forum</span></div>
    <div class="page-header"><h1>Discussion Forum</h1><p>Moderate the student community — pin important threads or remove posts</p></div>
    <div class="card slide-up">
      <div class="card-body">
        <textarea id="forum-new" class="input" rows="3" placeholder="Post an announcement or start a discussion…" style="resize:vertical;"></textarea>
        <div style="margin-top:8px;"><button class="btn btn-primary" onclick="postForumMessage()"><i class="fa-solid fa-paper-plane"></i> Post</button></div>
      </div>
    </div>
    <div id="forum-list" style="margin-top:14px;"><div class="card"><div class="card-body text-center text-muted">Loading…</div></div></div>`;
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
(function patchModulePage() {
  if (typeof renderModulePage !== 'function') return;
  const _orig = renderModulePage;
  window.renderModulePage = function(moduleId, sectionId) {
    let html = _orig(moduleId, sectionId);
    const mod = (typeof COURSE_MODULES !== 'undefined') ? COURSE_MODULES.find(m => m.id === moduleId) : null;
    const section = mod && (sectionId ? mod.sections.find(s => s.id === sectionId) : mod.sections[0]);
    if (!section || section.isQuiz) return html;
    // Inject buttons below the section content
    const buttons = `
      <div class="card slide-up" style="margin-top:16px;">
        <div class="card-body" style="display:flex;gap:10px;flex-wrap:wrap;align-items:center;">
          <button class="btn btn-primary" onclick="markSectionCompleteUI('${section.id}', this)">
            <i class="fa-solid fa-check"></i> Mark Section Complete
          </button>
          <button class="btn btn-secondary" onclick="openSectionQuiz('${section.id}')">
            <i class="fa-solid fa-clipboard-question"></i> Take Section Quiz (if any)
          </button>
          ${APP.currentUser?.isAdmin ? `<button class="btn btn-ghost" onclick="navigate('admin',{view:'section-quiz',sectionId:'${section.id}',moduleId:${moduleId}})"><i class="fa-solid fa-pen"></i> Edit Section Quiz</button>` : ''}
        </div>
      </div>`;
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
