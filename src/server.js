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

// Separate uploader for homework videos: accepts any common video file type, up to 500MB.
const HOMEWORK_MAX_BYTES = 500 * 1024 * 1024;
const videoUpload = multer({
  storage,
  limits: { fileSize: HOMEWORK_MAX_BYTES },
  fileFilter: (_req, file, cb) => {
    const mt = (file.mimetype || '').toLowerCase();
    const okMime = mt.startsWith('video/') || mt === 'application/octet-stream';
    const ext = path.extname(file.originalname || '').toLowerCase();
    const okExt = ['.mp4', '.mov', '.m4v', '.webm', '.mkv', '.avi', '.wmv', '.flv', '.3gp', '.mpeg', '.mpg', '.qt', '.hevc'].includes(ext);
    if (okMime || okExt) cb(null, true);
    else cb(new Error('Please upload a standard video file (MP4, MOV, WebM, MKV, AVI, etc.)'));
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

// Staff = admin OR teacher. Teachers get read-only visibility into student
// work + grading, but cannot edit curriculum, quizzes, financials, or
// manage other staff accounts.
function staffRequired(req, res, next) {
  authRequired(req, res, () => {
    const role = req.user?.role;
    if (role !== 'admin' && role !== 'teacher') {
      return res.status(403).json({ error: 'Staff only' });
    }
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
    if (user.is_active === false) {
      return res.status(403).json({ error: 'Account disabled. Please contact NUMA Pilates.' });
    }
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '30d' });
    res.json({
      token,
      user: { id: user.id, username: user.username, full_name: user.full_name, email: user.email, role: user.role,
              program_track: user.program_track, tuition_status: user.tuition_status,
              must_reset_password: user.must_reset_password === true }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Login failed' });
  }
});

app.get('/api/auth/me', authRequired, async (req, res) => {
  const result = await pool.query(
    'SELECT id, username, full_name, email, role, created_at, program_track, tuition_status, tuition_total, tuition_amount_paid, tos_accepted_at, is_active, must_reset_password FROM users WHERE id = $1',
    [req.user.id]
  );
  const u = result.rows[0];
  if (u && u.is_active === false) {
    return res.status(403).json({ error: 'Account disabled.' });
  }
  res.json(u || null);
});

// User-facing: change my own password. Also used to satisfy must_reset_password.
app.post('/api/auth/change-password', authRequired, async (req, res) => {
  try {
    const { current_password, new_password } = req.body || {};
    if (!new_password || String(new_password).length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters' });
    }
    const r = await pool.query('SELECT password_hash, must_reset_password FROM users WHERE id = $1', [req.user.id]);
    if (r.rowCount === 0) return res.status(404).json({ error: 'User not found' });
    // If NOT a forced reset, require the current password. Forced resets
    // (must_reset_password = true) let the user set a new one without knowing
    // the temp password (they just used it to log in).
    if (r.rows[0].must_reset_password !== true) {
      if (!current_password) return res.status(400).json({ error: 'Current password required' });
      const ok = await bcrypt.compare(current_password, r.rows[0].password_hash);
      if (!ok) return res.status(401).json({ error: 'Current password is incorrect' });
    }
    const hash = await bcrypt.hash(new_password, 10);
    await pool.query(
      'UPDATE users SET password_hash = $1, must_reset_password = FALSE WHERE id = $2',
      [hash, req.user.id]
    );
    res.json({ ok: true });
  } catch (err) {
    console.error('[change-password]', err);
    res.status(500).json({ error: 'Password change failed' });
  }
});

// ===== CONTENT PROTECTION =====
// Record that the current user accepted the Terms of Service.
app.post('/api/security/tos-accept', authRequired, async (req, res) => {
  try {
    await pool.query(
      'UPDATE users SET tos_accepted_at = NOW() WHERE id = $1 AND tos_accepted_at IS NULL',
      [req.user.id]
    );
    const r = await pool.query('SELECT tos_accepted_at FROM users WHERE id = $1', [req.user.id]);
    res.json({ ok: true, tos_accepted_at: r.rows[0]?.tos_accepted_at || null });
  } catch (err) {
    console.error('[tos-accept]', err);
    res.status(500).json({ error: 'Failed to record acceptance' });
  }
});

// Log a possible screenshot / visibility-blur event and notify admins.
// Body: { page_url, reason }. user_agent is taken from request headers.
app.post('/api/security/screenshot-attempt', authRequired, async (req, res) => {
  try {
    const { page_url, reason } = req.body || {};
    const ua = (req.headers['user-agent'] || '').toString().slice(0, 500);
    const url = (page_url || '').toString().slice(0, 500);
    const why = (reason || 'blur').toString().slice(0, 100);
    await pool.query(
      'INSERT INTO screenshot_alerts (user_id, page_url, user_agent, reason) VALUES ($1, $2, $3, $4)',
      [req.user.id, url, ua, why]
    );
    // Resolve student name for notification body.
    const u = await pool.query('SELECT full_name, username, email FROM users WHERE id = $1', [req.user.id]);
    const who = u.rows[0]?.full_name || u.rows[0]?.username || u.rows[0]?.email || ('user #' + req.user.id);
    notifyAdmins({
      type: 'security',
      title: 'Possible screenshot — ' + who,
      body: 'Page: ' + url + '\nReason: ' + why,
      link: '/admin/security'
    }).catch((e) => console.warn('[screenshot-alert] notify failed', e?.message));
    res.json({ ok: true });
  } catch (err) {
    console.warn('[screenshot-attempt]', err?.message);
    // Best-effort: never break the client over a missed log row.
    res.json({ ok: false });
  }
});

// =========================================================================
// ===== ADMIN: STAFF ACCOUNT MANAGEMENT (teachers + admins) ==============
// =========================================================================

// Simple, human-friendly temp password generator.
function _generateTempPassword() {
  const words = ['Reformer','Cadillac','Wunda','Barrel','Studio','Balance','Center','Flow','Breath','Pilates'];
  const w = words[Math.floor(Math.random() * words.length)];
  const n = Math.floor(1000 + Math.random() * 9000);
  return w + n + '!';
}

// List all staff accounts (admins + teachers).
app.get('/api/admin/staff', adminRequired, async (_req, res) => {
  try {
    const r = await pool.query(
      `SELECT id, username, full_name, email, role, is_active, created_at,
              must_reset_password
         FROM users
        WHERE role IN ('admin', 'teacher')
        ORDER BY role ASC, created_at DESC`
    );
    res.json(r.rows);
  } catch (err) {
    console.error('[list staff]', err);
    res.status(500).json({ error: 'Failed to load staff' });
  }
});

// Create a new teacher account. Returns the temp password once (admin must share it).
app.post('/api/admin/staff', adminRequired, async (req, res) => {
  try {
    const { username, full_name, email, password } = req.body || {};
    if (!username || !full_name || !email) {
      return res.status(400).json({ error: 'username, full_name, and email are required' });
    }
    const uname = String(username).trim().toLowerCase();
    const existing = await pool.query('SELECT id FROM users WHERE username = $1', [uname]);
    if (existing.rowCount > 0) return res.status(400).json({ error: 'Username already taken' });
    const tempPassword = (password && String(password).length >= 6) ? String(password) : _generateTempPassword();
    const hash = await bcrypt.hash(tempPassword, 10);
    const result = await pool.query(
      `INSERT INTO users (username, password_hash, full_name, email, role, is_active, must_reset_password)
       VALUES ($1, $2, $3, $4, 'teacher', TRUE, TRUE)
       RETURNING id, username, full_name, email, role, is_active, must_reset_password, created_at`,
      [uname, hash, String(full_name).trim(), String(email).trim()]
    );
    res.json({ ...result.rows[0], temp_password: tempPassword });
  } catch (err) {
    console.error('[create staff]', err);
    res.status(500).json({ error: 'Failed to create staff account' });
  }
});

// Update a staff member's basic info (name/email). Does NOT change role or password.
app.patch('/api/admin/staff/:id', adminRequired, async (req, res) => {
  try {
    const { full_name, email } = req.body || {};
    const sets = [];
    const vals = [];
    let i = 1;
    if (full_name !== undefined) { sets.push(`full_name = $${i++}`); vals.push(full_name); }
    if (email !== undefined) { sets.push(`email = $${i++}`); vals.push(email); }
    if (sets.length === 0) return res.status(400).json({ error: 'No fields to update' });
    vals.push(req.params.id);
    const sql = `UPDATE users SET ${sets.join(', ')} WHERE id = $${i} AND role IN ('admin','teacher') RETURNING id, username, full_name, email, role, is_active`;
    const r = await pool.query(sql, vals);
    if (r.rowCount === 0) return res.status(404).json({ error: 'Staff not found' });
    res.json(r.rows[0]);
  } catch (err) {
    console.error('[update staff]', err);
    res.status(500).json({ error: 'Update failed' });
  }
});

// Delete a teacher (admins protected from deletion).
app.delete('/api/admin/staff/:id', adminRequired, async (req, res) => {
  try {
    // Never allow the acting admin to delete themselves.
    if (Number(req.params.id) === Number(req.user.id)) {
      return res.status(400).json({ error: 'You cannot delete your own account.' });
    }
    const r = await pool.query(
      `DELETE FROM users WHERE id = $1 AND role = 'teacher' RETURNING id`,
      [req.params.id]
    );
    if (r.rowCount === 0) return res.status(404).json({ error: 'Teacher not found (only teacher accounts can be deleted here).' });
    res.json({ ok: true });
  } catch (err) {
    console.error('[delete staff]', err);
    res.status(500).json({ error: 'Delete failed' });
  }
});

// =========================================================================
// ===== ADMIN: PASSWORD RESET + ENABLE/DISABLE for ANY account ==========
// =========================================================================

// Admin resets any user's password. Returns the temp password once.
// If body.password is provided (>=6 chars), it is used verbatim.
// Otherwise a friendly temp password is generated.
// Sets must_reset_password = TRUE so the user is forced to choose a new one on next login.
app.post('/api/admin/users/:id/reset-password', adminRequired, async (req, res) => {
  try {
    const { password } = req.body || {};
    const target = await pool.query('SELECT id, username, full_name, role FROM users WHERE id = $1', [req.params.id]);
    if (target.rowCount === 0) return res.status(404).json({ error: 'User not found' });
    const tempPassword = (password && String(password).length >= 6) ? String(password) : _generateTempPassword();
    const hash = await bcrypt.hash(tempPassword, 10);
    await pool.query(
      'UPDATE users SET password_hash = $1, must_reset_password = TRUE WHERE id = $2',
      [hash, req.params.id]
    );
    // Notify the user so they know a reset happened.
    notify(Number(req.params.id), {
      type: 'account',
      title: 'Your NUMA Pilates password was reset',
      body: 'An administrator reset your password. Log in with the temporary password provided, then choose a new one.'
    }).catch(() => {});
    res.json({
      ok: true,
      user: target.rows[0],
      temp_password: tempPassword
    });
  } catch (err) {
    console.error('[admin reset password]', err);
    res.status(500).json({ error: 'Reset failed' });
  }
});

// Admin enables or disables any account.
// * Staff (admin/teacher): disable = suspend login (reversible). Enable restores.
// * Students: disable = PERMANENTLY DELETE the student and all their work.
//   Enable is a no-op for students (there is nothing left to re-enable).
// Body: { is_active: true | false }
app.patch('/api/admin/users/:id/active', adminRequired, async (req, res) => {
  try {
    const { is_active } = req.body || {};
    if (typeof is_active !== 'boolean') return res.status(400).json({ error: 'is_active (boolean) required' });
    if (Number(req.params.id) === Number(req.user.id) && is_active === false) {
      return res.status(400).json({ error: 'You cannot disable your own account.' });
    }
    // Look up the target's role first so we know whether to delete or suspend.
    const target = await pool.query(
      'SELECT id, username, full_name, role FROM users WHERE id = $1',
      [req.params.id]
    );
    if (target.rowCount === 0) return res.status(404).json({ error: 'User not found' });
    const targetRole = target.rows[0].role;

    // STUDENT + disable => hard delete. All child rows cascade via FK ON DELETE CASCADE.
    if (is_active === false && targetRole === 'student') {
      await pool.query('DELETE FROM users WHERE id = $1 AND role = $2', [req.params.id, 'student']);
      return res.json({
        deleted: true,
        id: Number(req.params.id),
        username: target.rows[0].username,
        full_name: target.rows[0].full_name,
        role: 'student'
      });
    }

    // STUDENT + enable => nothing to do (the account either exists already or was deleted).
    if (is_active === true && targetRole === 'student') {
      const r2 = await pool.query(
        'UPDATE users SET is_active = TRUE WHERE id = $1 RETURNING id, username, full_name, role, is_active',
        [req.params.id]
      );
      return res.json(r2.rows[0]);
    }

    // STAFF => reversible flag flip.
    const r = await pool.query(
      'UPDATE users SET is_active = $1 WHERE id = $2 RETURNING id, username, full_name, role, is_active',
      [is_active, req.params.id]
    );
    if (r.rowCount === 0) return res.status(404).json({ error: 'User not found' });
    if (is_active === false) {
      notify(Number(req.params.id), {
        type: 'account',
        title: 'Your NUMA Pilates account is disabled',
        body: 'Your account has been temporarily disabled. Contact NUMA Pilates for details.'
      }).catch(() => {});
    }
    res.json(r.rows[0]);
  } catch (err) {
    console.error('[admin toggle active]', err);
    res.status(500).json({ error: 'Update failed' });
  }
});

// =========================================================================
// ===== BULLETIN BOARD ==================================================
// =========================================================================
// Anyone signed in can read; admins + teachers can write.
app.get('/api/bulletin', authRequired, async (_req, res) => {
  try {
    const r = await pool.query(
      `SELECT b.id, b.title, b.body, b.pinned, b.created_at, b.updated_at,
              u.full_name AS author_name
         FROM bulletin_posts b
         LEFT JOIN users u ON u.id = b.created_by
        ORDER BY b.pinned DESC, b.created_at DESC
        LIMIT 100`
    );
    res.json(r.rows);
  } catch (e) {
    console.error('[bulletin list]', e);
    res.status(500).json({ error: 'Failed to load bulletin' });
  }
});

app.post('/api/bulletin', staffRequired, async (req, res) => {
  try {
    const { title, body, pinned } = req.body || {};
    if (!title || !body) return res.status(400).json({ error: 'title and body are required' });
    const r = await pool.query(
      `INSERT INTO bulletin_posts (title, body, pinned, created_by)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [String(title).slice(0, 200), String(body).slice(0, 10000), !!pinned, req.user.id]
    );
    res.json(r.rows[0]);
  } catch (e) {
    console.error('[bulletin create]', e);
    res.status(500).json({ error: 'Create failed' });
  }
});

app.put('/api/bulletin/:id', staffRequired, async (req, res) => {
  try {
    const { title, body, pinned } = req.body || {};
    const r = await pool.query(
      `UPDATE bulletin_posts SET
         title = COALESCE($1, title),
         body = COALESCE($2, body),
         pinned = COALESCE($3, pinned),
         updated_at = NOW()
       WHERE id = $4 RETURNING *`,
      [title || null, body || null, typeof pinned === 'boolean' ? pinned : null, req.params.id]
    );
    if (r.rowCount === 0) return res.status(404).json({ error: 'Post not found' });
    res.json(r.rows[0]);
  } catch (e) {
    console.error('[bulletin update]', e);
    res.status(500).json({ error: 'Update failed' });
  }
});

app.delete('/api/bulletin/:id', staffRequired, async (req, res) => {
  try {
    await pool.query('DELETE FROM bulletin_posts WHERE id = $1', [req.params.id]);
    res.json({ ok: true });
  } catch (e) {
    console.error('[bulletin delete]', e);
    res.status(500).json({ error: 'Delete failed' });
  }
});

// =========================================================================
// ===== IN-PERSON SCHEDULE ===============================================
// =========================================================================
// Everyone reads; admins + teachers write.
app.get('/api/schedule', authRequired, async (_req, res) => {
  try {
    // Return upcoming + recent (up to 30 days past) so students can see recap.
    const r = await pool.query(
      `SELECT id, title, description, location, starts_at, ends_at, required
         FROM class_schedule
        WHERE starts_at >= NOW() - INTERVAL '30 days'
        ORDER BY starts_at ASC
        LIMIT 200`
    );
    res.json(r.rows);
  } catch (e) {
    console.error('[schedule list]', e);
    res.status(500).json({ error: 'Failed to load schedule' });
  }
});

app.post('/api/schedule', staffRequired, async (req, res) => {
  try {
    const { title, description, location, starts_at, ends_at, required } = req.body || {};
    if (!title || !starts_at) return res.status(400).json({ error: 'title and starts_at are required' });
    const r = await pool.query(
      `INSERT INTO class_schedule (title, description, location, starts_at, ends_at, required, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [String(title).slice(0, 200), description ? String(description).slice(0, 2000) : null,
       location ? String(location).slice(0, 200) : null,
       starts_at, ends_at || null, required !== false, req.user.id]
    );
    res.json(r.rows[0]);
  } catch (e) {
    console.error('[schedule create]', e);
    res.status(500).json({ error: 'Create failed' });
  }
});

app.put('/api/schedule/:id', staffRequired, async (req, res) => {
  try {
    const { title, description, location, starts_at, ends_at, required } = req.body || {};
    const r = await pool.query(
      `UPDATE class_schedule SET
         title = COALESCE($1, title),
         description = COALESCE($2, description),
         location = COALESCE($3, location),
         starts_at = COALESCE($4, starts_at),
         ends_at = COALESCE($5, ends_at),
         required = COALESCE($6, required)
       WHERE id = $7 RETURNING *`,
      [title || null, description || null, location || null, starts_at || null, ends_at || null,
       typeof required === 'boolean' ? required : null, req.params.id]
    );
    if (r.rowCount === 0) return res.status(404).json({ error: 'Event not found' });
    res.json(r.rows[0]);
  } catch (e) {
    console.error('[schedule update]', e);
    res.status(500).json({ error: 'Update failed' });
  }
});

app.delete('/api/schedule/:id', staffRequired, async (req, res) => {
  try {
    await pool.query('DELETE FROM class_schedule WHERE id = $1', [req.params.id]);
    res.json({ ok: true });
  } catch (e) {
    console.error('[schedule delete]', e);
    res.status(500).json({ error: 'Delete failed' });
  }
});

// Admin: list recent screenshot alerts.
app.get('/api/admin/screenshot-alerts', adminRequired, async (_req, res) => {
  try {
    const r = await pool.query(
      `SELECT a.id, a.user_id, a.page_url, a.user_agent, a.reason, a.created_at,
              u.full_name, u.username, u.email
         FROM screenshot_alerts a
         LEFT JOIN users u ON u.id = a.user_id
        ORDER BY a.created_at DESC
        LIMIT 200`
    );
    res.json(r.rows);
  } catch (err) {
    console.error('[screenshot-alerts list]', err);
    res.status(500).json({ error: 'Failed to load alerts' });
  }
});

// ===== MODULES (PUBLIC READ) =====
app.get('/api/modules', async (_req, res) => {
  const result = await pool.query('SELECT * FROM modules WHERE is_published = TRUE ORDER BY sort_order, id');
  res.json(result.rows);
});

// Admin-only: return ALL modules including drafts/unpublished. Used by the
// Course Content Manager so admins can find and re-publish hidden modules.
app.get('/api/admin/modules-all', adminRequired, async (_req, res) => {
  const result = await pool.query('SELECT * FROM modules ORDER BY sort_order, id');
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

app.put('/api/admin/scenarios/:id/grade', staffRequired, async (req, res) => {
  const { score, feedback } = req.body;
  const result = await pool.query(
    `UPDATE scenarios SET score=$1, feedback=$2, graded_at=NOW() WHERE id=$3 RETURNING *`,
    [score, feedback, req.params.id]
  );
  const row = result.rows[0];
  if (row) {
    notify(row.user_id, {
      type: 'scenario_graded',
      title: `Scenario graded: ${score}%`,
      body: feedback ? String(feedback).slice(0, 240) : 'Your instructor has reviewed your scenario.',
      link_view: 'scenarios',
      link_params: null
    });
  }
  res.json(row);
});

// Admin can manually assign one or more scenario IDs to a student.
// This writes a record into `scenarios` with status placeholder and
// (more importantly) fires a notification so the student sees "Scenario assigned".
app.post('/api/admin/scenarios/assign', staffRequired, async (req, res) => {
  try {
    const { user_id, scenario_ids, note } = req.body || {};
    if (!user_id || !Array.isArray(scenario_ids) || scenario_ids.length === 0) {
      return res.status(400).json({ error: 'user_id and scenario_ids[] required' });
    }
    const ids = scenario_ids.map(String).slice(0, 20);
    await notify(user_id, {
      type: 'scenario_assigned',
      title: ids.length === 1 ? 'New scenario assigned' : `${ids.length} new scenarios assigned`,
      body: note ? String(note).slice(0, 240) : 'Your instructor has assigned scenarios for you to complete.',
      link_view: 'scenarios',
      link_params: { assignedIds: ids }
    });
    res.json({ ok: true, assigned: ids });
  } catch (e) {
    console.error('scenario assign error', e);
    res.status(500).json({ error: e.message });
  }
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
app.get('/api/admin/students', staffRequired, async (_req, res) => {
  const result = await pool.query(`
    SELECT u.id, u.username, u.full_name, u.email, u.enrollment_code, u.created_at,
      u.program_track, u.tuition_status, u.tuition_total, u.tuition_amount_paid, u.tuition_notes,
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

// Admin: update enrollment metadata for one student
app.patch('/api/admin/students/:id', adminRequired, async (req, res) => {
  const { program_track, tuition_status, tuition_total, tuition_amount_paid, tuition_notes, full_name, email } = req.body || {};
  // Validate program_track if provided. Tracks live as 'pathway_<track>' rows
  // in program_settings, so we accept any track that has a pathway row, plus
  // null/empty to unassign.
  if (program_track !== undefined && program_track !== null && program_track !== '') {
    const slug = String(program_track).toLowerCase().replace(/[^a-z0-9_-]/g, '');
    if (slug !== program_track) {
      return res.status(400).json({ error: 'program_track must be lowercase letters, digits, hyphens, or underscores' });
    }
    const trackRow = await pool.query(`SELECT 1 FROM program_settings WHERE key = $1`, [`pathway_${slug}`]);
    if (trackRow.rowCount === 0) {
      return res.status(400).json({ error: `Unknown program_track '${program_track}'. Create the pathway first in Certification Pathways.` });
    }
  }
  const validStatuses = ['unpaid', 'partial', 'paid', null, ''];
  if (tuition_status !== undefined && !validStatuses.includes(tuition_status)) {
    return res.status(400).json({ error: 'Invalid tuition_status' });
  }
  // Build dynamic SET clause for only the fields provided
  const sets = [];
  const vals = [];
  let i = 1;
  if (program_track !== undefined) { sets.push(`program_track = $${i++}`); vals.push(program_track || null); }
  if (tuition_status !== undefined) { sets.push(`tuition_status = $${i++}`); vals.push(tuition_status || 'unpaid'); }
  if (tuition_total !== undefined) { sets.push(`tuition_total = $${i++}`); vals.push(tuition_total === '' ? null : tuition_total); }
  if (tuition_amount_paid !== undefined) { sets.push(`tuition_amount_paid = $${i++}`); vals.push(tuition_amount_paid === '' ? 0 : tuition_amount_paid); }
  if (tuition_notes !== undefined) { sets.push(`tuition_notes = $${i++}`); vals.push(tuition_notes || null); }
  if (full_name !== undefined) { sets.push(`full_name = $${i++}`); vals.push(full_name); }
  if (email !== undefined) { sets.push(`email = $${i++}`); vals.push(email); }
  if (sets.length === 0) return res.status(400).json({ error: 'No fields to update' });
  sets.push(`updated_at = NOW()`);
  vals.push(req.params.id);
  const sql = `UPDATE users SET ${sets.join(', ')} WHERE id = $${i} AND role = 'student' RETURNING id, username, full_name, email, program_track, tuition_status, tuition_total, tuition_amount_paid, tuition_notes`;
  const result = await pool.query(sql, vals);
  if (result.rowCount === 0) return res.status(404).json({ error: 'Student not found' });
  res.json(result.rows[0]);
});

app.get('/api/admin/students/:id', staffRequired, async (req, res) => {
  const userRes = await pool.query('SELECT id, username, full_name, email, enrollment_code, created_at, program_track, tuition_status, tuition_total, tuition_amount_paid, tuition_notes FROM users WHERE id = $1', [req.params.id]);
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

app.patch('/api/admin/enrollment-codes/:code', adminRequired, async (req, res) => {
  const oldCode = req.params.code;
  const { code: newCode, label, is_active } = req.body || {};
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const cur = await client.query('SELECT * FROM enrollment_codes WHERE code = $1', [oldCode]);
    if (cur.rowCount === 0) { await client.query('ROLLBACK'); return res.status(404).json({ error: 'Not found' }); }
    const nextCode = (typeof newCode === 'string' && newCode.trim()) ? newCode.toUpperCase().trim() : oldCode;
    const nextLabel = (typeof label === 'string') ? label : cur.rows[0].label;
    const nextActive = (typeof is_active === 'boolean') ? is_active : cur.rows[0].is_active;
    if (nextCode !== oldCode) {
      const dupe = await client.query('SELECT 1 FROM enrollment_codes WHERE code = $1', [nextCode]);
      if (dupe.rowCount > 0) { await client.query('ROLLBACK'); return res.status(400).json({ error: 'Code already exists' }); }
      await client.query('UPDATE enrollment_codes SET code = $1, label = $2, is_active = $3 WHERE code = $4', [nextCode, nextLabel, nextActive, oldCode]);
      await client.query('UPDATE users SET enrollment_code = $1 WHERE enrollment_code = $2', [nextCode, oldCode]);
    } else {
      await client.query('UPDATE enrollment_codes SET label = $1, is_active = $2 WHERE code = $3', [nextLabel, nextActive, oldCode]);
    }
    await client.query('COMMIT');
    const updated = await pool.query('SELECT * FROM enrollment_codes WHERE code = $1', [nextCode]);
    res.json(updated.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('enrollment-code patch failed', err);
    res.status(500).json({ error: 'Failed' });
  } finally {
    client.release();
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
app.get('/api/admin/students/:id/progress', staffRequired, async (req, res) => {
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

// Admin: create a new certification pathway (track)
app.post('/api/admin/pathways', adminRequired, async (req, res) => {
  try {
    const { slug, label } = req.body || {};
    if (!slug || !label) return res.status(400).json({ error: 'slug and label are required' });
    const cleanSlug = String(slug).toLowerCase().replace(/[^a-z0-9_-]/g, '');
    if (!cleanSlug) return res.status(400).json({ error: 'slug must contain lowercase letters, digits, hyphens, or underscores' });
    const key = `pathway_${cleanSlug}`;
    const exists = await pool.query('SELECT 1 FROM program_settings WHERE key = $1', [key]);
    if (exists.rowCount > 0) return res.status(409).json({ error: 'A track with that slug already exists' });
    await pool.query(
      `INSERT INTO program_settings (key, value, updated_by) VALUES ($1, $2::jsonb, $3)`,
      [key, JSON.stringify({
        required_module_ids: [],
        hour_requirements: null,
        requires_final_exam: true,
        requires_scenarios: true,
        label: String(label)
      }), req.user.id]
    );
    res.json({ ok: true, slug: cleanSlug, label });
  } catch (e) {
    console.error('POST pathways error', e);
    res.status(500).json({ error: e.message });
  }
});

// Admin: delete a certification pathway (track)
app.delete('/api/admin/pathways/:slug', adminRequired, async (req, res) => {
  try {
    const slug = String(req.params.slug).toLowerCase().replace(/[^a-z0-9_-]/g, '');
    if (!slug) return res.status(400).json({ error: 'Invalid slug' });
    // Check if any students are assigned to this track
    const assigned = await pool.query('SELECT COUNT(*) AS n FROM users WHERE program_track = $1', [slug]);
    const n = parseInt(assigned.rows[0].n, 10);
    if (n > 0 && req.query.force !== 'true') {
      return res.status(409).json({
        error: `${n} student(s) are assigned to this track. Re-assign them first, or pass ?force=true to unassign and delete.`,
        assigned_count: n
      });
    }
    if (n > 0) {
      await pool.query('UPDATE users SET program_track = NULL WHERE program_track = $1', [slug]);
    }
    await pool.query('DELETE FROM program_settings WHERE key = $1', [`pathway_${slug}`]);
    res.json({ ok: true, unassigned: n });
  } catch (e) {
    console.error('DELETE pathways error', e);
    res.status(500).json({ error: e.message });
  }
});

// =====================================================================
// HOMEWORK
// ---------------------------------------------------------------------
// Each MODULE can have one homework prompt (assigned at the end of the
// module, like the module quiz). Students upload a video file as their
// submission and may REPLACE it any time until it has been graded.
// Once admin marks it approved or needs_revision the video is locked.
// =====================================================================

function homeworkIsLocked(status) {
  return status === 'approved' || status === 'needs_revision';
}

function safeUnlinkUpload(filename) {
  try {
    if (!filename || filename.includes('..') || filename.includes('/')) return;
    const full = path.join(UPLOAD_ROOT, filename);
    if (fs.existsSync(full)) fs.unlinkSync(full);
  } catch (e) { console.warn('[homework] cleanup failed', e.message); }
}

function filenameFromUrl(videoUrl) {
  return (videoUrl || '').replace(/^\/uploads\//, '');
}

// ===== NOTIFICATIONS HELPERS =====
// Best-effort: never throw to the caller. We don't want a notification failure
// to bubble up and break the action that triggered it.
async function notify(userId, payload) {
  try {
    if (!userId) return;
    await pool.query(
      `INSERT INTO notifications (user_id, type, title, body, link_view, link_params)
       VALUES ($1, $2, $3, $4, $5, $6::jsonb)`,
      [userId, payload.type, payload.title, payload.body || null,
        payload.link_view || null, JSON.stringify(payload.link_params || null)]
    );
  } catch (e) {
    console.warn('[notify] failed:', e.message);
  }
}
async function notifyAllStudentsExcept(excludeUserId, payload) {
  try {
    const ids = await pool.query(
      "SELECT id FROM users WHERE role NOT IN ('admin', 'teacher') AND id != $1",
      [excludeUserId || 0]
    );
    for (const row of ids.rows) await notify(row.id, payload);
  } catch (e) { console.warn('[notify-all] failed:', e.message); }
}
// Send a notification to every admin AND teacher (staff).
async function notifyStaff(payload) {
  try {
    const ids = await pool.query("SELECT id FROM users WHERE role IN ('admin', 'teacher')");
    for (const r of ids.rows) {
      await notify(r.id, payload);
    }
  } catch (e) { console.warn('[notifyStaff]', e?.message); }
}

async function notifyAdmins(payload) {
  try {
    const ids = await pool.query("SELECT id FROM users WHERE role = 'admin'");
    for (const row of ids.rows) await notify(row.id, payload);
  } catch (e) { console.warn('[notify-admins] failed:', e.message); }
}

// ----- Notification endpoints -----
app.get('/api/notifications', authRequired, async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit || '30', 10), 100);
    const result = await pool.query(
      `SELECT id, type, title, body, link_view, link_params, is_read, created_at
         FROM notifications
        WHERE user_id = $1
        ORDER BY created_at DESC
        LIMIT $2`,
      [req.user.id, limit]
    );
    const unread = await pool.query(
      'SELECT COUNT(*)::int AS c FROM notifications WHERE user_id = $1 AND is_read = FALSE',
      [req.user.id]
    );
    res.json({ items: result.rows, unread_count: unread.rows[0].c });
  } catch (e) {
    console.error('GET notifications', e);
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/notifications/mark-read', authRequired, async (req, res) => {
  try {
    const { ids, all } = req.body || {};
    if (all) {
      await pool.query('UPDATE notifications SET is_read = TRUE WHERE user_id = $1', [req.user.id]);
    } else if (Array.isArray(ids) && ids.length) {
      await pool.query(
        'UPDATE notifications SET is_read = TRUE WHERE user_id = $1 AND id = ANY($2::int[])',
        [req.user.id, ids.map(Number).filter(Boolean)]
      );
    }
    res.json({ ok: true });
  } catch (e) {
    console.error('mark-read', e);
    res.status(500).json({ error: e.message });
  }
});

app.delete('/api/notifications/:id', authRequired, async (req, res) => {
  try {
    await pool.query(
      'DELETE FROM notifications WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Public: student fetches the homework prompt + their own current submission for a module
app.get('/api/modules/:moduleId/homework', authRequired, async (req, res) => {
  try {
    const hw = await pool.query(
      `SELECT module_id, title, description, is_required, max_size_mb, updated_at
         FROM module_homework WHERE module_id = $1`,
      [req.params.moduleId]
    );
    if (hw.rowCount === 0) return res.json({ homework: null, submission: null });
    const sub = await pool.query(
      `SELECT id, video_url, original_filename, mime_type, size_bytes,
              student_notes, status, admin_feedback, reviewed_at, submitted_at
         FROM homework_submissions
        WHERE module_id = $1 AND user_id = $2`,
      [req.params.moduleId, req.user.id]
    );
    let comments = [];
    if (sub.rowCount > 0) {
      const c = await pool.query(
        `SELECT hc.id, hc.author_id, hc.author_role, hc.body, hc.timestamp_seconds,
                hc.created_at, u.full_name, u.username
           FROM homework_comments hc
           JOIN users u ON u.id = hc.author_id
          WHERE hc.submission_id = $1
          ORDER BY hc.created_at ASC`,
        [sub.rows[0].id]
      );
      comments = c.rows;
    }
    res.json({
      homework: hw.rows[0],
      submission: sub.rowCount === 0 ? null : { ...sub.rows[0], comments }
    });
  } catch (e) {
    console.error('GET module homework error', e);
    res.status(500).json({ error: e.message });
  }
});

// Student: submit OR replace a homework video for a module.
// Replacement is only allowed while status is still 'submitted' (not graded).
app.post('/api/modules/:moduleId/homework/submissions', authRequired, (req, res) => {
  videoUpload.single('video')(req, res, async (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({ error: `Video is too large. Max size is ${Math.round(HOMEWORK_MAX_BYTES / 1024 / 1024)} MB.` });
      }
      return res.status(400).json({ error: err.message });
    }
    if (!req.file) return res.status(400).json({ error: 'No video file uploaded' });
    try {
      const hw = await pool.query('SELECT 1 FROM module_homework WHERE module_id = $1', [req.params.moduleId]);
      if (hw.rowCount === 0) {
        safeUnlinkUpload(req.file.filename);
        return res.status(400).json({ error: 'This module does not have homework assigned.' });
      }
      // Check for an existing submission
      const existing = await pool.query(
        `SELECT id, video_url, status FROM homework_submissions WHERE module_id = $1 AND user_id = $2`,
        [req.params.moduleId, req.user.id]
      );
      const studentNotes = (req.body && req.body.student_notes) ? String(req.body.student_notes).slice(0, 2000) : null;
      const publicUrl = `/uploads/${req.file.filename}`;
      if (existing.rowCount > 0) {
        const row = existing.rows[0];
        if (homeworkIsLocked(row.status)) {
          // Submission has been graded — cannot replace.
          safeUnlinkUpload(req.file.filename);
          return res.status(403).json({
            error: 'Your submission has already been graded and can no longer be replaced.'
          });
        }
        // Replace: delete the previous file on disk, then update the row.
        safeUnlinkUpload(filenameFromUrl(row.video_url));
        const upd = await pool.query(
          `UPDATE homework_submissions
              SET video_url = $1, original_filename = $2, mime_type = $3,
                  size_bytes = $4, student_notes = $5,
                  status = 'submitted', admin_feedback = NULL,
                  reviewed_at = NULL, reviewed_by = NULL,
                  submitted_at = NOW()
            WHERE id = $6
            RETURNING id, video_url, original_filename, mime_type, size_bytes,
                      student_notes, status, admin_feedback, reviewed_at, submitted_at`,
          [
            publicUrl,
            req.file.originalname || null,
            req.file.mimetype || null,
            req.file.size || null,
            studentNotes,
            row.id
          ]
        );
        return res.json({ replaced: true, submission: upd.rows[0] });
      }
      // New submission
      const ins = await pool.query(
        `INSERT INTO homework_submissions
           (module_id, user_id, video_url, original_filename, mime_type, size_bytes, student_notes)
         VALUES ($1,$2,$3,$4,$5,$6,$7)
         RETURNING id, video_url, original_filename, mime_type, size_bytes,
                   student_notes, status, admin_feedback, reviewed_at, submitted_at`,
        [
          req.params.moduleId,
          req.user.id,
          publicUrl,
          req.file.originalname || null,
          req.file.mimetype || null,
          req.file.size || null,
          studentNotes
        ]
      );
      res.json({ replaced: false, submission: ins.rows[0] });
    } catch (e) {
      console.error('POST homework submission error', e);
      res.status(500).json({ error: e.message });
    }
  });
});

// Student: delete their OWN submission (only while not graded)
app.delete('/api/modules/:moduleId/homework/submission', authRequired, async (req, res) => {
  try {
    const row = await pool.query(
      `SELECT id, video_url, status FROM homework_submissions WHERE module_id = $1 AND user_id = $2`,
      [req.params.moduleId, req.user.id]
    );
    if (row.rowCount === 0) return res.status(404).json({ error: 'No submission found.' });
    if (homeworkIsLocked(row.rows[0].status)) {
      return res.status(403).json({ error: 'Your submission has been graded and can no longer be deleted.' });
    }
    await pool.query('DELETE FROM homework_submissions WHERE id = $1', [row.rows[0].id]);
    safeUnlinkUpload(filenameFromUrl(row.rows[0].video_url));
    res.json({ ok: true });
  } catch (e) {
    console.error('DELETE own submission error', e);
    res.status(500).json({ error: e.message });
  }
});

// Admin: get the homework prompt for a module (null if none)
app.get('/api/admin/modules/:moduleId/homework', adminRequired, async (req, res) => {
  try {
    const hw = await pool.query(
      `SELECT module_id, title, description, is_required, max_size_mb, updated_at
         FROM module_homework WHERE module_id = $1`,
      [req.params.moduleId]
    );
    res.json(hw.rowCount === 0 ? null : hw.rows[0]);
  } catch (e) {
    console.error('GET admin module homework error', e);
    res.status(500).json({ error: e.message });
  }
});

// Admin: create or update the homework prompt for a module (upsert)
app.put('/api/admin/modules/:moduleId/homework', adminRequired, async (req, res) => {
  try {
    const { title, description, is_required, max_size_mb } = req.body || {};
    if (!description || !String(description).trim()) {
      return res.status(400).json({ error: 'Homework description is required.' });
    }
    const maxMb = Math.max(10, Math.min(2000, parseInt(max_size_mb, 10) || 500));
    const result = await pool.query(
      `INSERT INTO module_homework (module_id, title, description, is_required, max_size_mb, updated_by, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())
       ON CONFLICT (module_id)
       DO UPDATE SET title = EXCLUDED.title,
                     description = EXCLUDED.description,
                     is_required = EXCLUDED.is_required,
                     max_size_mb = EXCLUDED.max_size_mb,
                     updated_by = EXCLUDED.updated_by,
                     updated_at = NOW()
       RETURNING module_id, title, description, is_required, max_size_mb, updated_at`,
      [
        req.params.moduleId,
        title ? String(title).slice(0, 200) : null,
        String(description).trim(),
        is_required !== false,
        maxMb,
        req.user.id
      ]
    );
    res.json(result.rows[0]);
  } catch (e) {
    console.error('PUT admin module homework error', e);
    res.status(500).json({ error: e.message });
  }
});

// Admin: remove the homework prompt for a module (submissions kept by default)
app.delete('/api/admin/modules/:moduleId/homework', adminRequired, async (req, res) => {
  try {
    const wipeSubs = req.query.wipe_submissions === 'true';
    if (wipeSubs) {
      const subs = await pool.query('SELECT video_url FROM homework_submissions WHERE module_id = $1', [req.params.moduleId]);
      subs.rows.forEach(r => safeUnlinkUpload(filenameFromUrl(r.video_url)));
      await pool.query('DELETE FROM homework_submissions WHERE module_id = $1', [req.params.moduleId]);
    }
    await pool.query('DELETE FROM module_homework WHERE module_id = $1', [req.params.moduleId]);
    res.json({ ok: true });
  } catch (e) {
    console.error('DELETE admin module homework error', e);
    res.status(500).json({ error: e.message });
  }
});

// Admin: list ALL homework submissions across modules (with student + module info)
app.get('/api/admin/homework-submissions', staffRequired, async (req, res) => {
  try {
    const status = req.query.status; // optional filter
    const params = [];
    let where = '';
    if (status) { params.push(status); where = `WHERE hs.status = $${params.length}`; }
    const result = await pool.query(
      `SELECT hs.id, hs.module_id, hs.user_id, hs.video_url, hs.original_filename,
              hs.mime_type, hs.size_bytes, hs.student_notes, hs.status, hs.admin_feedback,
              hs.submitted_at, hs.reviewed_at,
              u.username, u.full_name, u.email,
              mh.title AS homework_title
         FROM homework_submissions hs
         JOIN users u ON u.id = hs.user_id
         LEFT JOIN module_homework mh ON mh.module_id = hs.module_id
         ${where}
         ORDER BY hs.submitted_at DESC
         LIMIT 500`,
      params
    );
    res.json(result.rows);
  } catch (e) {
    console.error('GET admin homework submissions error', e);
    res.status(500).json({ error: e.message });
  }
});

// Admin: list submissions for a single module
app.get('/api/admin/modules/:moduleId/homework-submissions', staffRequired, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT hs.id, hs.user_id, hs.video_url, hs.original_filename, hs.mime_type,
              hs.size_bytes, hs.student_notes, hs.status, hs.admin_feedback,
              hs.submitted_at, hs.reviewed_at,
              u.username, u.full_name, u.email
         FROM homework_submissions hs
         JOIN users u ON u.id = hs.user_id
         WHERE hs.module_id = $1
         ORDER BY hs.submitted_at DESC`,
      [req.params.moduleId]
    );
    res.json(result.rows);
  } catch (e) {
    console.error('GET module submissions error', e);
    res.status(500).json({ error: e.message });
  }
});

// Staff: update review status / feedback for one submission (teachers can grade)
app.patch('/api/admin/homework-submissions/:id', staffRequired, async (req, res) => {
  try {
    const { status, admin_feedback } = req.body || {};
    const validStatus = ['submitted', 'approved', 'needs_revision'];
    if (status && !validStatus.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    const sets = [];
    const vals = [];
    let i = 1;
    if (status !== undefined) { sets.push(`status = $${i++}`); vals.push(status); }
    if (admin_feedback !== undefined) { sets.push(`admin_feedback = $${i++}`); vals.push(admin_feedback); }
    if (sets.length === 0) return res.status(400).json({ error: 'No fields to update' });
    sets.push(`reviewed_at = NOW()`);
    sets.push(`reviewed_by = $${i++}`);
    vals.push(req.user.id);
    vals.push(req.params.id);
    const result = await pool.query(
      `UPDATE homework_submissions SET ${sets.join(', ')} WHERE id = $${i}
       RETURNING id, status, admin_feedback, reviewed_at, user_id, module_id`,
      vals
    );
    if (result.rowCount === 0) return res.status(404).json({ error: 'Submission not found' });
    const row = result.rows[0];
    // Notify the student that their homework now has feedback / a grade
    const statusLabel = row.status === 'approved' ? 'Approved'
      : row.status === 'needs_revision' ? 'Needs revision'
      : 'Reviewed';
    notify(row.user_id, {
      type: 'homework_feedback',
      title: `Homework reviewed: ${statusLabel}`,
      body: admin_feedback ? String(admin_feedback).slice(0, 240) : 'Your instructor has reviewed your homework.',
      link_view: 'module',
      link_params: { id: row.module_id, section: `${row.module_id}-quiz` }
    });
    res.json(row);
  } catch (e) {
    console.error('PATCH submission error', e);
    res.status(500).json({ error: e.message });
  }
});

// ----- COMMENTS on a submission (admin grades, then both sides can comment) -----

// Anyone with access to the submission can list its comments.
// Students can only read comments on their own submissions; admins read any.
app.get('/api/homework-submissions/:id/comments', authRequired, async (req, res) => {
  try {
    const sub = await pool.query('SELECT user_id FROM homework_submissions WHERE id = $1', [req.params.id]);
    if (sub.rowCount === 0) return res.status(404).json({ error: 'Submission not found' });
    if (req.user.role !== 'admin' && sub.rows[0].user_id !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const result = await pool.query(
      `SELECT hc.id, hc.author_id, hc.author_role, hc.body, hc.timestamp_seconds,
              hc.created_at, u.full_name, u.username
         FROM homework_comments hc
         JOIN users u ON u.id = hc.author_id
        WHERE hc.submission_id = $1
        ORDER BY hc.created_at ASC`,
      [req.params.id]
    );
    res.json(result.rows);
  } catch (e) {
    console.error('GET comments error', e);
    res.status(500).json({ error: e.message });
  }
});

// Post a comment. Admin can comment any time AFTER the submission has been graded.
// Students can comment on their own submission any time.
app.post('/api/homework-submissions/:id/comments', authRequired, async (req, res) => {
  try {
    const { body, timestamp_seconds } = req.body || {};
    if (!body || !String(body).trim()) return res.status(400).json({ error: 'Comment cannot be empty.' });
    const sub = await pool.query('SELECT user_id, status FROM homework_submissions WHERE id = $1', [req.params.id]);
    if (sub.rowCount === 0) return res.status(404).json({ error: 'Submission not found' });
    const row = sub.rows[0];
    const isOwner = row.user_id === req.user.id;
    const isAdmin = req.user.role === 'admin';
    if (!isAdmin && !isOwner) return res.status(403).json({ error: 'Forbidden' });
    if (isAdmin && !homeworkIsLocked(row.status)) {
      return res.status(400).json({ error: 'Grade the submission first, then leave feedback comments.' });
    }
    const ts = timestamp_seconds == null || timestamp_seconds === '' ? null : Math.max(0, parseFloat(timestamp_seconds));
    const result = await pool.query(
      `INSERT INTO homework_comments (submission_id, author_id, author_role, body, timestamp_seconds)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, author_id, author_role, body, timestamp_seconds, created_at`,
      [req.params.id, req.user.id, isAdmin ? 'admin' : 'student', String(body).trim().slice(0, 4000), Number.isFinite(ts) ? ts : null]
    );
    // Attach author info for the response
    const u = await pool.query('SELECT full_name, username FROM users WHERE id = $1', [req.user.id]);
    // Notify the other party (admin comment -> student; student comment -> admins)
    const subMeta = await pool.query('SELECT user_id, module_id FROM homework_submissions WHERE id = $1', [req.params.id]);
    const subRow = subMeta.rows[0];
    const preview = String(body).trim().slice(0, 200);
    if (isAdmin && subRow) {
      notify(subRow.user_id, {
        type: 'homework_comment',
        title: 'New homework feedback',
        body: preview,
        link_view: 'module',
        link_params: { id: subRow.module_id, section: `${subRow.module_id}-quiz` }
      });
    } else if (subRow) {
      notifyAdmins({
        type: 'homework_comment',
        title: 'Student replied on homework',
        body: preview,
        link_view: 'admin',
        link_params: { view: 'homework-inbox' }
      });
    }
    res.json({ ...result.rows[0], full_name: u.rows[0]?.full_name, username: u.rows[0]?.username });
  } catch (e) {
    console.error('POST comment error', e);
    res.status(500).json({ error: e.message });
  }
});

// Delete a comment (author or admin can remove)
app.delete('/api/homework-comments/:id', authRequired, async (req, res) => {
  try {
    const row = await pool.query('SELECT author_id FROM homework_comments WHERE id = $1', [req.params.id]);
    if (row.rowCount === 0) return res.status(404).json({ error: 'Comment not found' });
    if (req.user.role !== 'admin' && row.rows[0].author_id !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    await pool.query('DELETE FROM homework_comments WHERE id = $1', [req.params.id]);
    res.json({ ok: true });
  } catch (e) {
    console.error('DELETE comment error', e);
    res.status(500).json({ error: e.message });
  }
});

// Admin: delete a submission (also removes the file on disk best-effort)
app.delete('/api/admin/homework-submissions/:id', adminRequired, async (req, res) => {
  try {
    const row = await pool.query('SELECT video_url FROM homework_submissions WHERE id = $1', [req.params.id]);
    if (row.rowCount === 0) return res.status(404).json({ error: 'Not found' });
    await pool.query('DELETE FROM homework_submissions WHERE id = $1', [req.params.id]);
    safeUnlinkUpload(filenameFromUrl(row.rows[0].video_url));
    res.json({ ok: true });
  } catch (e) {
    console.error('DELETE submission error', e);
    res.status(500).json({ error: e.message });
  }
});

// Summary endpoint: which modules have homework + pending counts (for UI badges)
app.get('/api/admin/module-homework-summary', adminRequired, async (_req, res) => {
  try {
    const result = await pool.query(
      `SELECT mh.module_id, mh.title, mh.is_required,
              COUNT(hs.id) AS submission_count,
              COUNT(hs.id) FILTER (WHERE hs.status = 'submitted') AS pending_count
         FROM module_homework mh
         LEFT JOIN homework_submissions hs ON hs.module_id = mh.module_id
         GROUP BY mh.module_id, mh.title, mh.is_required`
    );
    res.json(result.rows);
  } catch (e) {
    console.error('GET homework summary error', e);
    res.status(500).json({ error: e.message });
  }
});

// Admin: lightweight list of which sections have a quiz (for UI badges)
// Public (auth required): list of section IDs that have at least one question.
// Used by the student module page to show "Take Section Quiz" only when applicable.
app.get('/api/sections-with-quiz', authRequired, async (_req, res) => {
  try {
    const result = await pool.query(
      `SELECT section_id
         FROM section_quizzes
        WHERE jsonb_array_length(COALESCE(questions, '[]'::jsonb)) > 0`
    );
    res.json(result.rows.map(r => r.section_id));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load' });
  }
});

app.get('/api/admin/section-quizzes-summary', adminRequired, async (_req, res) => {
  try {
    const result = await pool.query(
      `SELECT section_id, title, passing_score, is_optional,
              jsonb_array_length(COALESCE(questions, '[]'::jsonb)) AS question_count
         FROM section_quizzes`
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load summary' });
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
    const isStaff = req.user.role === 'admin' || req.user.role === 'teacher';
    if (!isStaff && qRes.rows[0].user_id !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    // Store teacher replies under 'admin' role so existing UI (which styles
    // admin messages as “staff”) treats them the same. Actual author_id is
    // preserved for auditability.
    const authorRole = isStaff ? 'admin' : req.user.role;
    const result = await pool.query(
      `INSERT INTO question_replies (question_id, author_id, author_role, body)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [req.params.id, req.user.id, authorRole, body.trim()]
    );
    // Update parent question status + timestamp
    const newStatus = isStaff ? 'answered' : 'open';
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
app.get('/api/admin/questions', staffRequired, async (req, res) => {
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
app.put('/api/admin/questions/:id/status', staffRequired, async (req, res) => {
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
    // Topic list view: each top-level post is a topic. We include the latest message
    // preview, last activity time, total reply count, and unread count for this user.
    const result = await pool.query(
      `WITH topics AS (
         SELECT p.*, u.full_name AS author_name, u.role AS author_role
           FROM forum_posts p
           JOIN users u ON u.id = p.user_id
          WHERE p.parent_id IS NULL AND p.is_hidden = FALSE
       ),
       reply_agg AS (
         SELECT c.parent_id AS topic_id,
                COUNT(*)::int AS reply_count,
                MAX(c.created_at) AS last_reply_at
           FROM forum_posts c
          WHERE c.parent_id IS NOT NULL AND c.is_hidden = FALSE
          GROUP BY c.parent_id
       ),
       last_msg AS (
         SELECT DISTINCT ON (c.parent_id)
                c.parent_id AS topic_id, c.body AS last_body, c.created_at AS last_at,
                u2.full_name AS last_author_name
           FROM forum_posts c
           JOIN users u2 ON u2.id = c.user_id
          WHERE c.parent_id IS NOT NULL AND c.is_hidden = FALSE
          ORDER BY c.parent_id, c.created_at DESC
       )
       SELECT t.*,
              COALESCE(ra.reply_count, 0) AS reply_count,
              GREATEST(t.created_at, COALESCE(ra.last_reply_at, t.created_at)) AS last_activity_at,
              lm.last_body AS last_message_body,
              lm.last_author_name AS last_message_author,
              ftr.last_read_at,
              CASE
                WHEN ftr.last_read_at IS NULL THEN COALESCE(ra.reply_count, 0) + 1
                ELSE (SELECT COUNT(*)::int FROM forum_posts c2
                       WHERE c2.parent_id = t.id
                         AND c2.is_hidden = FALSE
                         AND c2.created_at > ftr.last_read_at)
                     + CASE WHEN t.created_at > ftr.last_read_at THEN 1 ELSE 0 END
              END AS unread_count
         FROM topics t
         LEFT JOIN reply_agg ra ON ra.topic_id = t.id
         LEFT JOIN last_msg  lm ON lm.topic_id = t.id
         LEFT JOIN forum_topic_reads ftr ON ftr.topic_id = t.id AND ftr.user_id = $1
        ORDER BY t.is_pinned DESC, GREATEST(t.created_at, COALESCE(ra.last_reply_at, t.created_at)) DESC
        LIMIT 200`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load forum' });
  }
});

// Mark a topic as read by the current user (used when they open the chat room).
app.post('/api/forum/posts/:id/read', authRequired, async (req, res) => {
  try {
    await pool.query(
      `INSERT INTO forum_topic_reads (user_id, topic_id, last_read_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (user_id, topic_id) DO UPDATE SET last_read_at = NOW()`,
      [req.user.id, req.params.id]
    );
    res.json({ ok: true });
  } catch (e) {
    console.error('mark topic read', e);
    res.status(500).json({ error: e.message });
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
    const { body, parent_id, title } = req.body || {};
    if (!body || !body.trim()) return res.status(400).json({ error: 'Message required' });
    // Title only applies to a top-level topic (no parent_id).
    let cleanTitle = null;
    if (!parent_id) {
      cleanTitle = (title || '').trim().slice(0, 120) || null;
      if (!cleanTitle) return res.status(400).json({ error: 'Topic title required' });
    }
    const result = await pool.query(
      `INSERT INTO forum_posts (user_id, body, parent_id, title) VALUES ($1, $2, $3, $4) RETURNING *`,
      [req.user.id, body.trim(), parent_id || null, cleanTitle]
    );
    // Notify everyone except the author (admins included). Cap body preview.
    const u = await pool.query('SELECT full_name, username, role FROM users WHERE id = $1', [req.user.id]);
    const author = u.rows[0] || {};
    const name = author.full_name || author.username || 'Someone';
    const isReply = !!parent_id;
    const preview = body.trim().slice(0, 200);
    const topId = parent_id || result.rows[0].id;
    // For replies, look up the parent topic's title so notifications read nicely.
    let topicTitle = cleanTitle;
    if (isReply) {
      const parent = await pool.query('SELECT title FROM forum_posts WHERE id = $1', [parent_id]);
      topicTitle = parent.rows[0]?.title || null;
    }
    // Notify all OTHER users (students + admins) about the new message
    pool.query("SELECT id FROM users WHERE id != $1", [req.user.id])
      .then(async (r) => {
        for (const row of r.rows) {
          await notify(row.id, {
            type: 'forum_message',
            title: isReply
              ? `${name} replied in “${topicTitle || 'a topic'}”`
              : `${name} started “${topicTitle || 'a new topic'}”`,
            body: preview,
            link_view: isReply ? 'forum-thread' : 'forum',
            link_params: isReply ? { id: topId } : null
          });
        }
      })
      .catch(e => console.warn('[forum notify] failed', e.message));
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
    const isStaff = req.user.role === 'admin' || req.user.role === 'teacher';
    if (!isStaff && r.rows[0].user_id !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    await pool.query('DELETE FROM forum_posts WHERE id = $1', [req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Delete failed' });
  }
});

// Staff: pin / hide moderation (admin + teacher)
app.put('/api/admin/forum/posts/:id', staffRequired, async (req, res) => {
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

// ===== PROGRAM SETTINGS (admin can edit hour requirements, etc.) =====
// Public read (any logged-in user) so students can see their requirements
app.get('/api/program-settings', authRequired, async (req, res) => {
  try {
    const r = await pool.query('SELECT key, value FROM program_settings');
    const settings = {};
    r.rows.forEach(row => { settings[row.key] = row.value; });
    // Always include a sane default for hour_requirements
    if (!settings.hour_requirements) {
      settings.hour_requirements = { observation: 100, teaching: 200, personal: 150, total: 450 };
    }
    res.json({ settings });
  } catch (e) {
    console.error('GET program-settings error', e);
    res.status(500).json({ error: e.message });
  }
});

// Admin write — update one setting
app.put('/api/admin/program-settings/:key', adminRequired, async (req, res) => {
  try {
    const { key } = req.params;
    const { value } = req.body;
    if (value === undefined) return res.status(400).json({ error: 'value is required' });

    // Validation for hour_requirements specifically
    if (key === 'hour_requirements') {
      if (!value || typeof value !== 'object') {
        return res.status(400).json({ error: 'hour_requirements must be an object' });
      }
      const required = ['observation', 'teaching', 'personal', 'total'];
      for (const f of required) {
        const n = Number(value[f]);
        if (!Number.isFinite(n) || n < 0) {
          return res.status(400).json({ error: `${f} must be a non-negative number` });
        }
        value[f] = n;
      }
    }

    // Validation for pathway_* keys (one per program track)
    if (key.startsWith('pathway_')) {
      if (!value || typeof value !== 'object') {
        return res.status(400).json({ error: 'pathway must be an object' });
      }
      if (value.required_module_ids !== undefined && !Array.isArray(value.required_module_ids)) {
        return res.status(400).json({ error: 'required_module_ids must be an array' });
      }
      // Normalize all IDs to strings
      if (Array.isArray(value.required_module_ids)) {
        value.required_module_ids = value.required_module_ids.map(String);
      }
      // hour_requirements override (null = inherit global)
      if (value.hour_requirements && typeof value.hour_requirements === 'object') {
        for (const f of ['observation', 'teaching', 'personal', 'total']) {
          if (value.hour_requirements[f] !== undefined) {
            const n = Number(value.hour_requirements[f]);
            if (!Number.isFinite(n) || n < 0) {
              return res.status(400).json({ error: `hour_requirements.${f} must be a non-negative number` });
            }
            value.hour_requirements[f] = n;
          }
        }
      }
    }

    const r = await pool.query(
      `INSERT INTO program_settings (key, value, updated_at, updated_by)
       VALUES ($1, $2::jsonb, NOW(), $3)
       ON CONFLICT (key) DO UPDATE
       SET value = EXCLUDED.value, updated_at = NOW(), updated_by = EXCLUDED.updated_by
       RETURNING key, value, updated_at`,
      [key, JSON.stringify(value), req.user.id]
    );
    res.json({ ok: true, setting: r.rows[0] });
  } catch (e) {
    console.error('PUT program-settings error', e);
    res.status(500).json({ error: e.message });
  }
});

// ===== MODULE QUIZ OVERRIDES (admin can edit module-end quiz questions) =====
// GET: returns saved override (or null if none — frontend uses hardcoded default)
app.get('/api/admin/module-quiz/:moduleId', adminRequired, async (req, res) => {
  try {
    const { moduleId } = req.params;
    const r = await pool.query(
      'SELECT module_id, questions, updated_at FROM module_quiz_overrides WHERE module_id = $1',
      [String(moduleId)]
    );
    if (!r.rows.length) return res.json({ override: null });
    res.json({ override: r.rows[0] });
  } catch (e) {
    console.error('GET module-quiz error', e);
    res.status(500).json({ error: e.message });
  }
});

// PUT: save (insert or update) the override for a module
app.put('/api/admin/module-quiz/:moduleId', adminRequired, async (req, res) => {
  try {
    const { moduleId } = req.params;
    const { questions } = req.body;
    if (!Array.isArray(questions)) {
      return res.status(400).json({ error: 'questions must be an array' });
    }
    // Light validation — each item must have q (string), opts (array of ≥2), correct (int)
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q || typeof q.q !== 'string' || !q.q.trim()) {
        return res.status(400).json({ error: `Question ${i + 1}: missing question text` });
      }
      if (!Array.isArray(q.opts) || q.opts.length < 2) {
        return res.status(400).json({ error: `Question ${i + 1}: need at least 2 options` });
      }
      if (!Number.isInteger(q.correct) || q.correct < 0 || q.correct >= q.opts.length) {
        return res.status(400).json({ error: `Question ${i + 1}: invalid correct-answer index` });
      }
    }
    const r = await pool.query(
      `INSERT INTO module_quiz_overrides (module_id, questions, updated_at, updated_by)
       VALUES ($1, $2::jsonb, NOW(), $3)
       ON CONFLICT (module_id) DO UPDATE
       SET questions = EXCLUDED.questions, updated_at = NOW(), updated_by = EXCLUDED.updated_by
       RETURNING module_id, questions, updated_at`,
      [String(moduleId), JSON.stringify(questions), req.user.id]
    );
    res.json({ ok: true, override: r.rows[0] });
  } catch (e) {
    console.error('PUT module-quiz error', e);
    res.status(500).json({ error: e.message });
  }
});

// DELETE: revert a module to the hardcoded default quiz
app.delete('/api/admin/module-quiz/:moduleId', adminRequired, async (req, res) => {
  try {
    const { moduleId } = req.params;
    await pool.query('DELETE FROM module_quiz_overrides WHERE module_id = $1', [String(moduleId)]);
    res.json({ ok: true });
  } catch (e) {
    console.error('DELETE module-quiz error', e);
    res.status(500).json({ error: e.message });
  }
});

// PUBLIC (any logged-in user): fetch all overrides at once so frontend can merge
app.get('/api/module-quiz-overrides', authRequired, async (req, res) => {
  try {
    const r = await pool.query('SELECT module_id, questions FROM module_quiz_overrides');
    const map = {};
    r.rows.forEach(row => { map[row.module_id] = row.questions; });
    res.json({ overrides: map });
  } catch (e) {
    console.error('GET module-quiz-overrides error', e);
    res.status(500).json({ error: e.message });
  }
});

// ===== MEDIA UPLOAD (admin only, images) =====
app.post('/api/admin/upload', adminRequired, (req, res) => {
  upload.single('file')(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message });
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const publicUrl = `/uploads/${req.file.filename}`;
    // Force https — Railway terminates TLS at the proxy, so req.protocol is 'http'
    // even though the request came over HTTPS. Browsers block mixed content.
    const forwardedProto = req.headers['x-forwarded-proto'];
    const proto = (forwardedProto && forwardedProto.split(',')[0].trim()) || (req.secure ? 'https' : 'https');
    res.json({
      ok: true,
      url: publicUrl,
      absoluteUrl: `${proto}://${req.get('host')}${publicUrl}`,
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
