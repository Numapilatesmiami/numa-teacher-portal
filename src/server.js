// NUMA Pilates Certification Portal — Backend API
import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { pool, initDatabase } from './db.js';
import { seedModulesIfEmpty } from './seed.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'numa-dev-secret-change-in-production';
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'numa2026';

// ===== UPLOADS DIR (persistent on Railway volume if mounted at /data) =====
const UPLOAD_ROOT = process.env.UPLOAD_DIR || (fs.existsSync('/data') ? '/data/uploads' : path.join(__dirname, '..', 'uploads'));
if (!fs.existsSync(UPLOAD_ROOT)) fs.mkdirSync(UPLOAD_ROOT, { recursive: true });
console.log(`[server] Upload directory: ${UPLOAD_ROOT}`);

const storage = multer.diskStorage({
  destination: UPLOAD_ROOT,
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const safeName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`;
    cb(null, safeName);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (_req, file, cb) => {
    const ok = /^image\/(jpeg|jpg|png|gif|webp)$/i.test(file.mimetype);
    if (ok) cb(null, true); else cb(new Error('Only JPEG, PNG, GIF, or WebP images are allowed'));
  }
});

app.use(cors({ origin: '*', credentials: false }));
app.use(express.json({ limit: '5mb' }));
app.use('/uploads', express.static(UPLOAD_ROOT, { maxAge: '7d' }));

// ===== STATIC FRONTEND (portal files served from /public) =====
// Serve index.html, app.js, styles.css, etc. from the repo's /public folder.
const PUBLIC_ROOT = path.join(__dirname, '..', 'public');
if (fs.existsSync(PUBLIC_ROOT)) {
  app.use(express.static(PUBLIC_ROOT, { maxAge: '1h', index: 'index.html' }));
  console.log('[server] Serving portal frontend from', PUBLIC_ROOT);
} else {
  console.log('[server] No public folder found; running API-only');
}

// ===== AUTH MIDDLEWARE =====
function authRequired(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) return res.status(401).json({ error: 'No token' });
  try {
    req.user = jwt.verify(auth.slice(7), JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}

function adminRequired(req, res, next) {
  authRequired(req, res, () => {
    if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
    next();
  });
}

// ===== HEALTH =====
app.get('/api/health', (_req, res) => res.json({ ok: true, time: new Date().toISOString() }));

// ===== AUTH =====
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, password, fullName, email, enrollmentCode } = req.body;
    if (!username || !password || !fullName || !email || !enrollmentCode) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Validate enrollment code
    const codeRes = await pool.query(
      'SELECT * FROM enrollment_codes WHERE code = $1 AND is_active = TRUE',
      [enrollmentCode.toUpperCase().trim()]
    );
    if (codeRes.rowCount === 0) return res.status(400).json({ error: 'Invalid enrollment code' });

    const existing = await pool.query('SELECT id FROM users WHERE username = $1', [username]);
    if (existing.rowCount > 0) return res.status(400).json({ error: 'Username already taken' });

    const hash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      `INSERT INTO users (username, password_hash, full_name, email, enrollment_code, role)
       VALUES ($1, $2, $3, $4, $5, 'student') RETURNING id, username, full_name, email, role`,
      [username.trim(), hash, fullName.trim(), email.trim(), enrollmentCode.toUpperCase().trim()]
    );
    const user = result.rows[0];
    const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '30d' });
    res.json({ token, user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Missing credentials' });

    // Hardcoded admin login for first-time access
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      // Ensure admin exists in DB
      let adminRes = await pool.query('SELECT * FROM users WHERE username = $1', [ADMIN_USERNAME]);
      if (adminRes.rowCount === 0) {
        const hash = await bcrypt.hash(ADMIN_PASSWORD, 10);
        adminRes = await pool.query(
          `INSERT INTO users (username, password_hash, full_name, email, role)
           VALUES ($1, $2, 'NUMA Admin', 'admin@numapilatesmiami.com', 'admin') RETURNING *`,
          [ADMIN_USERNAME, hash]
        );
      }
      const admin = adminRes.rows[0];
      const token = jwt.sign({ id: admin.id, username: admin.username, role: 'admin' }, JWT_SECRET, { expiresIn: '30d' });
      return res.json({ token, user: { id: admin.id, username: admin.username, full_name: admin.full_name, email: admin.email, role: 'admin' } });
    }

    const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    if (result.rowCount === 0) return res.status(401).json({ error: 'Invalid credentials' });

    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '30d' });
    res.json({
      token,
      user: { id: user.id, username: user.username, full_name: user.full_name, email: user.email, role: user.role }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Login failed' });
  }
});

app.get('/api/auth/me', authRequired, async (req, res) => {
  const result = await pool.query(
    'SELECT id, username, full_name, email, role, created_at FROM users WHERE id = $1',
    [req.user.id]
  );
  res.json(result.rows[0] || null);
});

// ===== MODULES (PUBLIC READ) =====
app.get('/api/modules', async (_req, res) => {
  const result = await pool.query('SELECT * FROM modules WHERE is_published = TRUE ORDER BY sort_order, id');
  res.json(result.rows);
});

app.get('/api/modules/:id', async (req, res) => {
  const modRes = await pool.query('SELECT * FROM modules WHERE id = $1', [req.params.id]);
  if (modRes.rowCount === 0) return res.status(404).json({ error: 'Module not found' });
  const secRes = await pool.query('SELECT * FROM sections WHERE module_id = $1 ORDER BY sort_order, id', [req.params.id]);
  res.json({ ...modRes.rows[0], sections: secRes.rows });
});

// ===== MODULES (ADMIN WRITE) =====
app.post('/api/admin/modules', adminRequired, async (req, res) => {
  const { id, title, subtitle, description, icon, sort_order } = req.body;
  if (!id || !title) return res.status(400).json({ error: 'id and title required' });
  try {
    const result = await pool.query(
      `INSERT INTO modules (id, title, subtitle, description, icon, sort_order)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [id, title, subtitle || '', description || '', icon || 'fa-book', sort_order || 0]
    );
    res.json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ error: 'Module ID already exists' });
    console.error(err);
    res.status(500).json({ error: 'Failed to create module' });
  }
});

app.put('/api/admin/modules/:id', adminRequired, async (req, res) => {
  const { title, subtitle, description, icon, sort_order, is_published } = req.body;
  const result = await pool.query(
    `UPDATE modules SET title=$1, subtitle=$2, description=$3, icon=$4, sort_order=$5, is_published=$6, updated_at=NOW()
     WHERE id=$7 RETURNING *`,
    [title, subtitle, description, icon, sort_order, is_published, req.params.id]
  );
  if (result.rowCount === 0) return res.status(404).json({ error: 'Module not found' });
  res.json(result.rows[0]);
});

app.delete('/api/admin/modules/:id', adminRequired, async (req, res) => {
  await pool.query('DELETE FROM modules WHERE id = $1', [req.params.id]);
  res.json({ ok: true });
});

// ===== SECTIONS (ADMIN) =====
app.post('/api/admin/sections', adminRequired, async (req, res) => {
  const { id, module_id, title, content, sort_order } = req.body;
  if (!id || !module_id || !title) return res.status(400).json({ error: 'id, module_id, title required' });
  try {
    const result = await pool.query(
      `INSERT INTO sections (id, module_id, title, content, sort_order)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [id, module_id, title, content || '', sort_order || 0]
    );
    res.json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ error: 'Section ID already exists' });
    console.error(err);
    res.status(500).json({ error: 'Failed to create section' });
  }
});

app.put('/api/admin/sections/:id', adminRequired, async (req, res) => {
  const { title, content, sort_order } = req.body;
  const result = await pool.query(
    `UPDATE sections SET title=$1, content=$2, sort_order=$3, updated_at=NOW()
     WHERE id=$4 RETURNING *`,
    [title, content, sort_order, req.params.id]
  );
  if (result.rowCount === 0) return res.status(404).json({ error: 'Section not found' });
  res.json(result.rows[0]);
});

app.delete('/api/admin/sections/:id', adminRequired, async (req, res) => {
  await pool.query('DELETE FROM sections WHERE id = $1', [req.params.id]);
  res.json({ ok: true });
});

// ===== QUIZ SCORES =====
app.post('/api/quiz-scores', authRequired, async (req, res) => {
  const { module_id, score, total, time_spent_seconds, attempt_data } = req.body;
  const result = await pool.query(
    `INSERT INTO quiz_scores (user_id, module_id, score, total, time_spent_seconds, attempt_data)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [req.user.id, module_id, score, total, time_spent_seconds || null, attempt_data || null]
  );
  res.json(result.rows[0]);
});

app.get('/api/quiz-scores', authRequired, async (req, res) => {
  const result = await pool.query(
    'SELECT * FROM quiz_scores WHERE user_id = $1 ORDER BY completed_at DESC',
    [req.user.id]
  );
  res.json(result.rows);
});

// ===== SCENARIOS =====
app.post('/api/scenarios', authRequired, async (req, res) => {
  const { scenario_id, response, word_count, flagged, flag_reason } = req.body;
  const result = await pool.query(
    `INSERT INTO scenarios (user_id, scenario_id, response, word_count, flagged, flag_reason)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [req.user.id, scenario_id, response, word_count || 0, flagged || false, flag_reason || null]
  );
  res.json(result.rows[0]);
});

app.get('/api/scenarios', authRequired, async (req, res) => {
  const result = await pool.query(
    'SELECT * FROM scenarios WHERE user_id = $1 ORDER BY submitted_at DESC',
    [req.user.id]
  );
  res.json(result.rows);
});

app.put('/api/admin/scenarios/:id/grade', adminRequired, async (req, res) => {
  const { score, feedback } = req.body;
  const result = await pool.query(
    `UPDATE scenarios SET score=$1, feedback=$2, graded_at=NOW() WHERE id=$3 RETURNING *`,
    [score, feedback, req.params.id]
  );
  res.json(result.rows[0]);
});

// ===== PRACTICE HOURS =====
app.post('/api/hours', authRequired, async (req, res) => {
  const { category, hours, notes } = req.body;
  const result = await pool.query(
    `INSERT INTO practice_hours (user_id, category, hours, notes)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [req.user.id, category, hours, notes || null]
  );
  res.json(result.rows[0]);
});

app.get('/api/hours', authRequired, async (req, res) => {
  const result = await pool.query(
    'SELECT * FROM practice_hours WHERE user_id = $1 ORDER BY logged_at DESC',
    [req.user.id]
  );
  res.json(result.rows);
});

app.delete('/api/hours/:id', authRequired, async (req, res) => {
  await pool.query('DELETE FROM practice_hours WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
  res.json({ ok: true });
});

// ===== FINAL EXAM =====
app.post('/api/final-exam', authRequired, async (req, res) => {
  const { score, total, time_spent_seconds, attempt_data } = req.body;
  const result = await pool.query(
    `INSERT INTO final_exam_attempts (user_id, score, total, time_spent_seconds, attempt_data)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [req.user.id, score, total, time_spent_seconds || null, attempt_data || null]
  );
  res.json(result.rows[0]);
});

app.get('/api/final-exam', authRequired, async (req, res) => {
  const result = await pool.query(
    'SELECT * FROM final_exam_attempts WHERE user_id = $1 ORDER BY completed_at DESC',
    [req.user.id]
  );
  res.json(result.rows);
});

// ===== ADMIN: STUDENTS =====
app.get('/api/admin/students', adminRequired, async (_req, res) => {
  const result = await pool.query(`
    SELECT u.id, u.username, u.full_name, u.email, u.enrollment_code, u.created_at,
      (SELECT COUNT(*) FROM quiz_scores WHERE user_id = u.id) AS quiz_count,
      (SELECT COUNT(*) FROM scenarios WHERE user_id = u.id) AS scenario_count,
      (SELECT COALESCE(SUM(hours), 0) FROM practice_hours WHERE user_id = u.id) AS total_hours,
      (SELECT MAX(score::float / total::float * 100) FROM final_exam_attempts WHERE user_id = u.id) AS best_exam_pct
    FROM users u
    WHERE u.role = 'student'
    ORDER BY u.created_at DESC
  `);
  res.json(result.rows);
});

app.get('/api/admin/students/:id', adminRequired, async (req, res) => {
  const userRes = await pool.query('SELECT id, username, full_name, email, enrollment_code, created_at FROM users WHERE id = $1', [req.params.id]);
  if (userRes.rowCount === 0) return res.status(404).json({ error: 'Not found' });
  const quizRes = await pool.query('SELECT * FROM quiz_scores WHERE user_id = $1 ORDER BY completed_at DESC', [req.params.id]);
  const scenRes = await pool.query('SELECT * FROM scenarios WHERE user_id = $1 ORDER BY submitted_at DESC', [req.params.id]);
  const hoursRes = await pool.query('SELECT * FROM practice_hours WHERE user_id = $1 ORDER BY logged_at DESC', [req.params.id]);
  const examRes = await pool.query('SELECT * FROM final_exam_attempts WHERE user_id = $1 ORDER BY completed_at DESC', [req.params.id]);
  res.json({ user: userRes.rows[0], quiz_scores: quizRes.rows, scenarios: scenRes.rows, hours: hoursRes.rows, final_exam: examRes.rows });
});

app.delete('/api/admin/students/:id', adminRequired, async (req, res) => {
  await pool.query('DELETE FROM users WHERE id = $1 AND role = $2', [req.params.id, 'student']);
  res.json({ ok: true });
});

// ===== ENROLLMENT CODES =====
app.get('/api/admin/enrollment-codes', adminRequired, async (_req, res) => {
  const result = await pool.query(`
    SELECT c.*, COUNT(u.id) AS student_count
    FROM enrollment_codes c
    LEFT JOIN users u ON u.enrollment_code = c.code
    GROUP BY c.code
    ORDER BY c.created_at DESC
  `);
  res.json(result.rows);
});

app.post('/api/admin/enrollment-codes', adminRequired, async (req, res) => {
  const { code, label } = req.body;
  if (!code) return res.status(400).json({ error: 'Code required' });
  try {
    const result = await pool.query(
      `INSERT INTO enrollment_codes (code, label) VALUES ($1, $2) RETURNING *`,
      [code.toUpperCase().trim(), label || '']
    );
    res.json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ error: 'Code already exists' });
    res.status(500).json({ error: 'Failed' });
  }
});

app.delete('/api/admin/enrollment-codes/:code', adminRequired, async (req, res) => {
  await pool.query('DELETE FROM enrollment_codes WHERE code = $1', [req.params.code]);
  res.json({ ok: true });
});

// ===== ACCOUNT SETTINGS (any logged-in user) =====
app.put('/api/auth/me', authRequired, async (req, res) => {
  try {
    const { full_name, email } = req.body;
    if (!full_name || !email) return res.status(400).json({ error: 'Name and email are required' });
    const result = await pool.query(
      `UPDATE users SET full_name = $1, email = $2, updated_at = NOW()
       WHERE id = $3 RETURNING id, username, full_name, email, role`,
      [full_name.trim(), email.trim(), req.user.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Update failed' });
  }
});

app.put('/api/auth/password', authRequired, async (req, res) => {
  try {
    const { current_password, new_password } = req.body;
    if (!current_password || !new_password) return res.status(400).json({ error: 'Both current and new password required' });
    if (new_password.length < 6) return res.status(400).json({ error: 'New password must be at least 6 characters' });
    const userRes = await pool.query('SELECT password_hash FROM users WHERE id = $1', [req.user.id]);
    if (userRes.rowCount === 0) return res.status(404).json({ error: 'User not found' });
    const valid = await bcrypt.compare(current_password, userRes.rows[0].password_hash);
    if (!valid) return res.status(401).json({ error: 'Current password is incorrect' });
    const hash = await bcrypt.hash(new_password, 10);
    await pool.query('UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2', [hash, req.user.id]);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Password change failed' });
  }
});

// ===== ADMIN: RESET STUDENT PASSWORD =====
app.put('/api/admin/students/:id/password', adminRequired, async (req, res) => {
  try {
    const { new_password } = req.body;
    if (!new_password || new_password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });
    const hash = await bcrypt.hash(new_password, 10);
    const result = await pool.query(
      'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2 RETURNING id, username, full_name',
      [hash, req.params.id]
    );
    if (result.rowCount === 0) return res.status(404).json({ error: 'Student not found' });
    res.json({ ok: true, user: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Reset failed' });
  }
});

// ===== ADMIN: REORDER SECTIONS (bulk update sort_order) =====
app.put('/api/admin/modules/:moduleId/reorder-sections', adminRequired, async (req, res) => {
  try {
    const { section_ids } = req.body; // array of section IDs in new order
    if (!Array.isArray(section_ids)) return res.status(400).json({ error: 'section_ids array required' });
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      for (let i = 0; i < section_ids.length; i++) {
        await client.query(
          'UPDATE sections SET sort_order = $1, updated_at = NOW() WHERE id = $2 AND module_id = $3',
          [i + 1, section_ids[i], req.params.moduleId]
        );
      }
      await client.query('COMMIT');
      res.json({ ok: true, reordered: section_ids.length });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Reorder failed' });
  }
});

// ===== ADMIN: REORDER MODULES =====
app.put('/api/admin/reorder-modules', adminRequired, async (req, res) => {
  try {
    const { module_ids } = req.body;
    if (!Array.isArray(module_ids)) return res.status(400).json({ error: 'module_ids array required' });
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      for (let i = 0; i < module_ids.length; i++) {
        await client.query(
          'UPDATE modules SET sort_order = $1, updated_at = NOW() WHERE id = $2',
          [i + 1, module_ids[i]]
        );
      }
      await client.query('COMMIT');
      res.json({ ok: true, reordered: module_ids.length });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Reorder failed' });
  }
});

// =========================================================================
// ===== STUDENT PROGRESS TRACKING =========================================
// =========================================================================

// Mark a section as complete (or update completion state)
app.post('/api/progress/sections/:sectionId', authRequired, async (req, res) => {
  try {
    const completed = req.body?.completed !== false;
    const result = await pool.query(
      `INSERT INTO section_progress (user_id, section_id, completed, completed_at)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (user_id, section_id)
       DO UPDATE SET completed = EXCLUDED.completed, completed_at = NOW()
       RETURNING *`,
      [req.user.id, req.params.sectionId, completed]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to save progress' });
  }
});

// Get the current user's progress (per-section + summary)
app.get('/api/progress/me', authRequired, async (req, res) => {
  try {
    const completed = await pool.query(
      `SELECT sp.section_id, sp.completed, sp.completed_at, s.module_id
       FROM section_progress sp
       JOIN sections s ON s.id = sp.section_id
       WHERE sp.user_id = $1 AND sp.completed = TRUE`,
      [req.user.id]
    );
    const totals = await pool.query(
      `SELECT s.module_id, COUNT(*)::int AS total
       FROM sections s
       JOIN modules m ON m.id = s.module_id AND m.is_published = TRUE
       GROUP BY s.module_id`
    );
    res.json({ completed: completed.rows, totals: totals.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load progress' });
  }
});

// Admin: view any student's progress + quiz attempts
app.get('/api/admin/students/:id/progress', adminRequired, async (req, res) => {
  try {
    const progress = await pool.query(
      `SELECT sp.section_id, sp.completed, sp.completed_at, s.title, s.module_id, m.title AS module_title
       FROM section_progress sp
       JOIN sections s ON s.id = sp.section_id
       JOIN modules m ON m.id = s.module_id
       WHERE sp.user_id = $1
       ORDER BY sp.completed_at DESC`,
      [req.params.id]
    );
    const attempts = await pool.query(
      `SELECT a.*, s.title AS section_title, s.module_id, m.title AS module_title
       FROM section_quiz_attempts a
       JOIN sections s ON s.id = a.section_id
       JOIN modules m ON m.id = s.module_id
       WHERE a.user_id = $1
       ORDER BY a.completed_at DESC`,
      [req.params.id]
    );
    res.json({ progress: progress.rows, section_quiz_attempts: attempts.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load student progress' });
  }
});

// =========================================================================
// ===== OPTIONAL PER-SECTION QUIZZES ======================================
// =========================================================================

// Public: get the quiz for a section (without correct answers for students)
app.get('/api/sections/:sectionId/quiz', authRequired, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, section_id, title, time_limit_minutes, passing_score, is_optional, questions FROM section_quizzes WHERE section_id = $1',
      [req.params.sectionId]
    );
    if (result.rowCount === 0) return res.json(null);
    const quiz = result.rows[0];
    // For students, strip correct answers; admins get the full thing
    if (req.user.role !== 'admin' && Array.isArray(quiz.questions)) {
      quiz.questions = quiz.questions.map((q) => {
        const { correct, correct_index, answer, explanation, ...rest } = q || {};
        return rest;
      });
    }
    res.json(quiz);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load quiz' });
  }
});

// Admin: create or replace a section quiz (upsert)
app.put('/api/admin/sections/:sectionId/quiz', adminRequired, async (req, res) => {
  try {
    const { title, time_limit_minutes, passing_score, is_optional, questions } = req.body || {};
    if (!Array.isArray(questions)) return res.status(400).json({ error: 'questions array required' });
    const result = await pool.query(
      `INSERT INTO section_quizzes (section_id, title, time_limit_minutes, passing_score, is_optional, questions, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6::jsonb, NOW())
       ON CONFLICT (section_id)
       DO UPDATE SET title = EXCLUDED.title, time_limit_minutes = EXCLUDED.time_limit_minutes,
         passing_score = EXCLUDED.passing_score, is_optional = EXCLUDED.is_optional,
         questions = EXCLUDED.questions, updated_at = NOW()
       RETURNING *`,
      [
        req.params.sectionId,
        title || 'Section Quiz',
        time_limit_minutes || null,
        passing_score ?? 70,
        is_optional !== false,
        JSON.stringify(questions)
      ]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to save quiz' });
  }
});

// Admin: delete a section quiz
app.delete('/api/admin/sections/:sectionId/quiz', adminRequired, async (req, res) => {
  await pool.query('DELETE FROM section_quizzes WHERE section_id = $1', [req.params.sectionId]);
  res.json({ ok: true });
});

// Student: submit answers and get scored (server-side; correct answers never leave the server)
app.post('/api/sections/:sectionId/quiz/score', authRequired, async (req, res) => {
  try {
    const { answers } = req.body || {};
    const q = await pool.query('SELECT questions FROM section_quizzes WHERE section_id = $1', [req.params.sectionId]);
    if (q.rowCount === 0) return res.status(404).json({ error: 'No quiz' });
    const questions = Array.isArray(q.rows[0].questions) ? q.rows[0].questions : [];
    let score = 0;
    questions.forEach((qq, i) => {
      const chosen = answers?.[i];
      const correct = (typeof qq.correct_index === 'number') ? qq.correct_index
        : (typeof qq.correct === 'number') ? qq.correct
        : (typeof qq.answer === 'number') ? qq.answer
        : null;
      if (correct !== null && chosen === correct) score += 1;
    });
    res.json({ score, total: questions.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Scoring failed' });
  }
});

// Student: submit a section-quiz attempt (with timing)
app.post('/api/sections/:sectionId/quiz/attempts', authRequired, async (req, res) => {
  try {
    const { score, total, time_spent_seconds, started_at, attempt_data } = req.body || {};
    if (typeof score !== 'number' || typeof total !== 'number') {
      return res.status(400).json({ error: 'score and total are required numbers' });
    }
    const result = await pool.query(
      `INSERT INTO section_quiz_attempts (user_id, section_id, score, total, time_spent_seconds, started_at, attempt_data)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [
        req.user.id,
        req.params.sectionId,
        score,
        total,
        time_spent_seconds || null,
        started_at || null,
        attempt_data ? JSON.stringify(attempt_data) : null
      ]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to save attempt' });
  }
});

// Student: view own attempts for a section
app.get('/api/sections/:sectionId/quiz/attempts', authRequired, async (req, res) => {
  const result = await pool.query(
    `SELECT * FROM section_quiz_attempts WHERE user_id = $1 AND section_id = $2 ORDER BY completed_at DESC`,
    [req.user.id, req.params.sectionId]
  );
  res.json(result.rows);
});

// Admin: all attempts across all students (with student info)
app.get('/api/admin/section-quiz-attempts', adminRequired, async (req, res) => {
  try {
    const filters = [];
    const params = [];
    if (req.query.section_id) { params.push(req.query.section_id); filters.push(`a.section_id = $${params.length}`); }
    if (req.query.user_id) { params.push(req.query.user_id); filters.push(`a.user_id = $${params.length}`); }
    const where = filters.length ? `WHERE ${filters.join(' AND ')}` : '';
    const result = await pool.query(
      `SELECT a.*, u.full_name, u.username, s.title AS section_title, s.module_id, m.title AS module_title
       FROM section_quiz_attempts a
       JOIN users u ON u.id = a.user_id
       JOIN sections s ON s.id = a.section_id
       JOIN modules m ON m.id = s.module_id
       ${where}
       ORDER BY a.completed_at DESC
       LIMIT 500`,
      params
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load attempts' });
  }
});

// =========================================================================
// ===== STUDENT Q&A (private to admin) ====================================
// =========================================================================

// Student: submit a question
app.post('/api/questions', authRequired, async (req, res) => {
  try {
    const { subject, body, module_id, section_id } = req.body || {};
    if (!body || !body.trim()) return res.status(400).json({ error: 'Question body required' });
    const result = await pool.query(
      `INSERT INTO student_questions (user_id, subject, body, module_id, section_id)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [req.user.id, subject || null, body.trim(), module_id || null, section_id || null]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to submit question' });
  }
});

// Student: list own questions (with replies)
app.get('/api/questions', authRequired, async (req, res) => {
  try {
    const qs = await pool.query(
      `SELECT q.*, (SELECT COUNT(*) FROM question_replies r WHERE r.question_id = q.id)::int AS reply_count
       FROM student_questions q
       WHERE q.user_id = $1
       ORDER BY q.updated_at DESC`,
      [req.user.id]
    );
    res.json(qs.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load questions' });
  }
});

// Get a single question + its reply thread (student only sees own; admin sees all)
app.get('/api/questions/:id', authRequired, async (req, res) => {
  try {
    const qRes = await pool.query(
      `SELECT q.*, u.full_name AS student_name, u.username AS student_username
       FROM student_questions q
       JOIN users u ON u.id = q.user_id
       WHERE q.id = $1`,
      [req.params.id]
    );
    if (qRes.rowCount === 0) return res.status(404).json({ error: 'Not found' });
    const q = qRes.rows[0];
    if (req.user.role !== 'admin' && q.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const rRes = await pool.query(
      `SELECT r.*, u.full_name AS author_name
       FROM question_replies r
       JOIN users u ON u.id = r.author_id
       WHERE r.question_id = $1
       ORDER BY r.created_at ASC`,
      [req.params.id]
    );
    res.json({ question: q, replies: rRes.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load question' });
  }
});

// Post a reply (student or admin)
app.post('/api/questions/:id/replies', authRequired, async (req, res) => {
  try {
    const { body } = req.body || {};
    if (!body || !body.trim()) return res.status(400).json({ error: 'Reply body required' });
    const qRes = await pool.query('SELECT user_id FROM student_questions WHERE id = $1', [req.params.id]);
    if (qRes.rowCount === 0) return res.status(404).json({ error: 'Question not found' });
    if (req.user.role !== 'admin' && qRes.rows[0].user_id !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const result = await pool.query(
      `INSERT INTO question_replies (question_id, author_id, author_role, body)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [req.params.id, req.user.id, req.user.role, body.trim()]
    );
    // Update parent question status + timestamp
    const newStatus = req.user.role === 'admin' ? 'answered' : 'open';
    await pool.query(
      `UPDATE student_questions SET status = $1, updated_at = NOW() WHERE id = $2`,
      [newStatus, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to post reply' });
  }
});

// Admin: list ALL student questions
app.get('/api/admin/questions', adminRequired, async (req, res) => {
  try {
    const status = req.query.status; // optional filter
    const params = [];
    let where = '';
    if (status) { params.push(status); where = `WHERE q.status = $${params.length}`; }
    const result = await pool.query(
      `SELECT q.*, u.full_name AS student_name, u.username AS student_username,
        (SELECT COUNT(*) FROM question_replies r WHERE r.question_id = q.id)::int AS reply_count
       FROM student_questions q
       JOIN users u ON u.id = q.user_id
       ${where}
       ORDER BY q.updated_at DESC
       LIMIT 500`,
      params
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load questions' });
  }
});

// Admin: mark question status (open / answered / closed)
app.put('/api/admin/questions/:id/status', adminRequired, async (req, res) => {
  const { status } = req.body || {};
  if (!['open', 'answered', 'closed'].includes(status)) return res.status(400).json({ error: 'Invalid status' });
  const result = await pool.query(
    `UPDATE student_questions SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
    [status, req.params.id]
  );
  res.json(result.rows[0]);
});

// Admin: delete a question
app.delete('/api/admin/questions/:id', adminRequired, async (req, res) => {
  await pool.query('DELETE FROM student_questions WHERE id = $1', [req.params.id]);
  res.json({ ok: true });
});

// =========================================================================
// ===== DISCUSSION FORUM (everyone sees) ==================================
// =========================================================================

app.get('/api/forum/posts', authRequired, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT p.*, u.full_name AS author_name, u.role AS author_role,
        (SELECT COUNT(*) FROM forum_posts c WHERE c.parent_id = p.id AND c.is_hidden = FALSE)::int AS reply_count
       FROM forum_posts p
       JOIN users u ON u.id = p.user_id
       WHERE p.parent_id IS NULL AND p.is_hidden = FALSE
       ORDER BY p.is_pinned DESC, p.created_at DESC
       LIMIT 200`
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load forum' });
  }
});

app.get('/api/forum/posts/:id', authRequired, async (req, res) => {
  try {
    const top = await pool.query(
      `SELECT p.*, u.full_name AS author_name, u.role AS author_role
       FROM forum_posts p JOIN users u ON u.id = p.user_id
       WHERE p.id = $1 AND p.is_hidden = FALSE`,
      [req.params.id]
    );
    if (top.rowCount === 0) return res.status(404).json({ error: 'Not found' });
    const replies = await pool.query(
      `SELECT p.*, u.full_name AS author_name, u.role AS author_role
       FROM forum_posts p JOIN users u ON u.id = p.user_id
       WHERE p.parent_id = $1 AND p.is_hidden = FALSE
       ORDER BY p.created_at ASC`,
      [req.params.id]
    );
    res.json({ post: top.rows[0], replies: replies.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load post' });
  }
});

app.post('/api/forum/posts', authRequired, async (req, res) => {
  try {
    const { body, parent_id } = req.body || {};
    if (!body || !body.trim()) return res.status(400).json({ error: 'Message required' });
    const result = await pool.query(
      `INSERT INTO forum_posts (user_id, body, parent_id) VALUES ($1, $2, $3) RETURNING *`,
      [req.user.id, body.trim(), parent_id || null]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to post' });
  }
});

// Author can delete own post; admin can delete any
app.delete('/api/forum/posts/:id', authRequired, async (req, res) => {
  try {
    const r = await pool.query('SELECT user_id FROM forum_posts WHERE id = $1', [req.params.id]);
    if (r.rowCount === 0) return res.status(404).json({ error: 'Not found' });
    if (req.user.role !== 'admin' && r.rows[0].user_id !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    await pool.query('DELETE FROM forum_posts WHERE id = $1', [req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Delete failed' });
  }
});

// Admin: pin / hide moderation
app.put('/api/admin/forum/posts/:id', adminRequired, async (req, res) => {
  const { is_pinned, is_hidden } = req.body || {};
  const result = await pool.query(
    `UPDATE forum_posts SET
      is_pinned = COALESCE($1, is_pinned),
      is_hidden = COALESCE($2, is_hidden)
     WHERE id = $3 RETURNING *`,
    [is_pinned ?? null, is_hidden ?? null, req.params.id]
  );
  res.json(result.rows[0]);
});

// ===== MEDIA UPLOAD (admin only, images) =====
app.post('/api/admin/upload', adminRequired, (req, res) => {
  upload.single('file')(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message });
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const publicUrl = `/uploads/${req.file.filename}`;
    res.json({
      ok: true,
      url: publicUrl,
      absoluteUrl: `${req.protocol}://${req.get('host')}${publicUrl}`,
      filename: req.file.filename,
      size: req.file.size,
      mimetype: req.file.mimetype
    });
  });
});

// ===== SPA FALLBACK =====
// Any non-API, non-upload GET that doesn't match a real file gets index.html
// so the portal's hash routing works on direct visits.
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/') || req.path.startsWith('/uploads/')) return next();
  const indexFile = path.join(PUBLIC_ROOT, 'index.html');
  if (fs.existsSync(indexFile)) return res.sendFile(indexFile);
  next();
});

// ===== START =====
async function start() {
  try {
    await initDatabase();
    await seedModulesIfEmpty();
    app.listen(PORT, () => {
      console.log(`[server] NUMA backend running on port ${PORT}`);
    });
  } catch (err) {
    console.error('[server] Failed to start:', err);
    process.exit(1);
  }
}

start();
