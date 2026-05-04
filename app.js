// ===== NUMA Pilates Certification Portal — Application =====

// ----- State Management -----
const APP = {
  currentUser: null,
  currentView: 'login',
  sidebarOpen: false
};

// ===== PERSISTENT STORAGE (localStorage) =====
function _sGet(key) {
  try { return localStorage.getItem(key); } catch(e) { return null; }
}
function _sSet(key, val) {
  try {
    if (val === null) localStorage.removeItem(key);
    else localStorage.setItem(key, val);
  } catch(e) {}
}

function getUsers() { return JSON.parse(_sGet('numa_users') || '[]'); }
function saveUsers(users) { _sSet('numa_users', JSON.stringify(users)); }
function getSession() { return JSON.parse(_sGet('numa_session') || 'null'); }
function saveSession(sess) { _sSet('numa_session', JSON.stringify(sess)); }

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

function handleLogin() {
  const user = document.getElementById('login-user').value.trim();
  const pass = document.getElementById('login-pass').value;
  const errEl = document.getElementById('login-error');

  if (!user || !pass) {
    errEl.textContent = 'Please enter both username and password.';
    errEl.style.display = 'block';
    return;
  }

  // Admin login
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

function handleRegister() {
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
      <div class="stat-sub">of 450 target</div>
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
    <p>Track your observation, teaching practicum, and personal practice hours toward the 450-hour requirement.</p>
  </div>

  <div class="hours-summary slide-up">
    <div class="hours-card">
      <div class="hours-num">${total.toFixed(1)}</div>
      <div class="hours-label">Total Hours</div>
      <div class="progress-bar-wrap mt-1"><div class="progress-bar-fill" style="width:${Math.min(100, (total/450)*100)}%"></div></div>
      <div class="text-xs text-muted mt-1">${Math.min(100, ((total/450)*100)).toFixed(1)}% of 450</div>
    </div>
    <div class="hours-card">
      <div class="hours-num" style="color:var(--sage)">${obs.toFixed(1)}</div>
      <div class="hours-label">Observation</div>
    </div>
    <div class="hours-card">
      <div class="hours-num" style="color:var(--sage-dark)">${teach.toFixed(1)}</div>
      <div class="hours-label">Teaching</div>
    </div>
    <div class="hours-card">
      <div class="hours-num" style="color:var(--charcoal-muted)">${personal.toFixed(1)}</div>
      <div class="hours-label">Personal Practice</div>
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
  <div style="max-width:1100px;margin:0 auto;padding:32px 24px;">
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
    <h1>Student Management</h1>
    <p>${users.length} registered student${users.length !== 1 ? 's' : ''}</p>
  </div>
  <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:20px;">
    <button class="btn btn-secondary" onclick="navigate('admin',{view:'gradebook'})"><i class="fa-solid fa-table"></i> Gradebook</button>
    <button class="btn btn-secondary" onclick="navigate('admin',{view:'codes'})"><i class="fa-solid fa-key"></i> Enrollment Codes</button>
    <button class="btn btn-secondary" onclick="navigate('admin',{view:'plagiarism'})"><i class="fa-solid fa-flag"></i> Plagiarism Check</button>
  </div>`;

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

