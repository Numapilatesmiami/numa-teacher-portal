// NUMA Pilates Certification Portal — Backend API
import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { pool, initDatabase } from './db.js';
import { seedModulesIfEmpty } from './seed.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'numa-dev-secret-change-in-production';
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'numa2026';

app.use(cors({ origin: '*', credentials: false }));
app.use(express.json({ limit: '5mb' }));

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
