// Database connection and schema initialization
import pg from 'pg';
const { Pool } = pg;

// Railway provides DATABASE_URL automatically when you add a Postgres plugin
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('railway')
    ? { rejectUnauthorized: false }
    : false,
});

export async function initDatabase() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        full_name TEXT,
        email TEXT,
        role TEXT NOT NULL DEFAULT 'student',
        enrollment_code TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS modules (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        subtitle TEXT,
        description TEXT,
        icon TEXT DEFAULT 'fa-book',
        sort_order INTEGER DEFAULT 0,
        is_published BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS sections (
        id TEXT PRIMARY KEY,
        module_id TEXT NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        content TEXT,
        sort_order INTEGER DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS quizzes (
        id SERIAL PRIMARY KEY,
        module_id TEXT NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        time_limit_minutes INTEGER DEFAULT 30,
        passing_score INTEGER DEFAULT 80,
        questions JSONB NOT NULL DEFAULT '[]'::jsonb,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS quiz_scores (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        module_id TEXT NOT NULL,
        score INTEGER NOT NULL,
        total INTEGER NOT NULL,
        time_spent_seconds INTEGER,
        attempt_data JSONB,
        completed_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS scenarios (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        scenario_id TEXT NOT NULL,
        response TEXT NOT NULL,
        word_count INTEGER,
        score INTEGER,
        feedback TEXT,
        flagged BOOLEAN DEFAULT FALSE,
        flag_reason TEXT,
        submitted_at TIMESTAMPTZ DEFAULT NOW(),
        graded_at TIMESTAMPTZ
      );

      CREATE TABLE IF NOT EXISTS practice_hours (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        category TEXT NOT NULL,
        hours NUMERIC(6,2) NOT NULL,
        notes TEXT,
        logged_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS final_exam_attempts (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        score INTEGER NOT NULL,
        total INTEGER NOT NULL,
        time_spent_seconds INTEGER,
        attempt_data JSONB,
        completed_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS enrollment_codes (
        code TEXT PRIMARY KEY,
        label TEXT,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS activity_log (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        action TEXT NOT NULL,
        details JSONB,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_quiz_scores_user ON quiz_scores(user_id);
      CREATE INDEX IF NOT EXISTS idx_scenarios_user ON scenarios(user_id);
      CREATE INDEX IF NOT EXISTS idx_practice_hours_user ON practice_hours(user_id);
      CREATE INDEX IF NOT EXISTS idx_sections_module ON sections(module_id, sort_order);

      -- ===== STUDENT PROGRESS TRACKING =====
      CREATE TABLE IF NOT EXISTS section_progress (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        section_id TEXT NOT NULL REFERENCES sections(id) ON DELETE CASCADE,
        completed BOOLEAN DEFAULT TRUE,
        completed_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(user_id, section_id)
      );
      CREATE INDEX IF NOT EXISTS idx_section_progress_user ON section_progress(user_id);

      -- ===== OPTIONAL PER-SECTION QUIZZES =====
      CREATE TABLE IF NOT EXISTS section_quizzes (
        id SERIAL PRIMARY KEY,
        section_id TEXT NOT NULL UNIQUE REFERENCES sections(id) ON DELETE CASCADE,
        title TEXT,
        time_limit_minutes INTEGER,
        passing_score INTEGER DEFAULT 70,
        is_optional BOOLEAN DEFAULT TRUE,
        questions JSONB NOT NULL DEFAULT '[]'::jsonb,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS section_quiz_attempts (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        section_id TEXT NOT NULL REFERENCES sections(id) ON DELETE CASCADE,
        score INTEGER NOT NULL,
        total INTEGER NOT NULL,
        time_spent_seconds INTEGER,
        started_at TIMESTAMPTZ,
        completed_at TIMESTAMPTZ DEFAULT NOW(),
        attempt_data JSONB
      );
      CREATE INDEX IF NOT EXISTS idx_section_quiz_attempts_user ON section_quiz_attempts(user_id);
      CREATE INDEX IF NOT EXISTS idx_section_quiz_attempts_section ON section_quiz_attempts(section_id);

      -- ===== STUDENT QUESTIONS (Q&A inbox to admin) =====
      CREATE TABLE IF NOT EXISTS student_questions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        subject TEXT,
        body TEXT NOT NULL,
        module_id TEXT,
        section_id TEXT,
        status TEXT NOT NULL DEFAULT 'open',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_student_questions_user ON student_questions(user_id);
      CREATE INDEX IF NOT EXISTS idx_student_questions_status ON student_questions(status, updated_at DESC);

      CREATE TABLE IF NOT EXISTS question_replies (
        id SERIAL PRIMARY KEY,
        question_id INTEGER NOT NULL REFERENCES student_questions(id) ON DELETE CASCADE,
        author_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        author_role TEXT NOT NULL,
        body TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_question_replies_question ON question_replies(question_id, created_at);

      -- ===== PROGRAM SETTINGS (admin-editable global config) =====
      -- Generic key-value JSON store for things like hour requirements, passing
      -- thresholds, and other program-wide settings the admin can tweak.
      CREATE TABLE IF NOT EXISTS program_settings (
        key TEXT PRIMARY KEY,
        value JSONB NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        updated_by INTEGER REFERENCES users(id) ON DELETE SET NULL
      );

      -- Seed default hour requirements (NPCP-aligned) if no row exists yet.
      INSERT INTO program_settings (key, value)
      VALUES ('hour_requirements', '{"observation":100,"teaching":200,"personal":150,"total":450}'::jsonb)
      ON CONFLICT (key) DO NOTHING;

      -- ===== MODULE QUIZ OVERRIDES =====
      -- Module quizzes are defined in content.js (frontend). This table lets admin
      -- override the questions/answers for a given module without touching code.
      -- If a row exists for a module_id, the frontend uses those questions; otherwise
      -- it falls back to the hardcoded default.
      CREATE TABLE IF NOT EXISTS module_quiz_overrides (
        module_id TEXT PRIMARY KEY,
        questions JSONB NOT NULL DEFAULT '[]'::jsonb,
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        updated_by INTEGER REFERENCES users(id) ON DELETE SET NULL
      );

      -- ===== DISCUSSION FORUM =====
      CREATE TABLE IF NOT EXISTS forum_posts (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        body TEXT NOT NULL,
        parent_id INTEGER REFERENCES forum_posts(id) ON DELETE CASCADE,
        is_pinned BOOLEAN DEFAULT FALSE,
        is_hidden BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_forum_posts_created ON forum_posts(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_forum_posts_parent ON forum_posts(parent_id);

      -- ===== HOMEWORK =====
      -- One homework prompt per MODULE (lives at the end of the module, like
      -- the module quiz). Admin sets the prompt and whether it is required.
      CREATE TABLE IF NOT EXISTS module_homework (
        module_id TEXT PRIMARY KEY,
        title TEXT,
        description TEXT NOT NULL,
        is_required BOOLEAN DEFAULT TRUE,
        max_size_mb INTEGER DEFAULT 500,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        updated_by INTEGER REFERENCES users(id) ON DELETE SET NULL
      );

      -- Student homework submissions. One latest video per (module, student);
      -- the student can replace it until it has been graded.
      CREATE TABLE IF NOT EXISTS homework_submissions (
        id SERIAL PRIMARY KEY,
        module_id TEXT NOT NULL,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        video_url TEXT NOT NULL,
        original_filename TEXT,
        mime_type TEXT,
        size_bytes BIGINT,
        student_notes TEXT,
        status TEXT NOT NULL DEFAULT 'submitted', -- submitted | approved | needs_revision
        admin_feedback TEXT,
        reviewed_at TIMESTAMPTZ,
        reviewed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
        submitted_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE (module_id, user_id)
      );
      CREATE INDEX IF NOT EXISTS idx_homework_submissions_user ON homework_submissions(user_id);
      CREATE INDEX IF NOT EXISTS idx_homework_submissions_module ON homework_submissions(module_id);
      CREATE INDEX IF NOT EXISTS idx_homework_submissions_status ON homework_submissions(status, submitted_at DESC);

      -- Admin comments on a homework submission (post-grade feedback thread).
      CREATE TABLE IF NOT EXISTS homework_comments (
        id SERIAL PRIMARY KEY,
        submission_id INTEGER NOT NULL REFERENCES homework_submissions(id) ON DELETE CASCADE,
        author_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        author_role TEXT NOT NULL, -- 'admin' | 'student'
        body TEXT NOT NULL,
        timestamp_seconds NUMERIC(10,2), -- optional video timecode the comment refers to
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_homework_comments_submission ON homework_comments(submission_id, created_at);
    `);

    // Seed default enrollment codes if table is empty
    const codeRes = await client.query('SELECT COUNT(*) FROM enrollment_codes');
    if (parseInt(codeRes.rows[0].count) === 0) {
      await client.query(`
        INSERT INTO enrollment_codes (code, label) VALUES
        ('NUMA2026', 'Default 2026 cohort'),
        ('NUMPILATES', 'Studio referral'),
        ('NUMAREFORMER', 'Reformer track')
      `);
    }

    // ===== SAFE MIGRATIONS (additive only — never drops data) =====
    await client.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
      ALTER TABLE sections ADD COLUMN IF NOT EXISTS featured_image TEXT;
      ALTER TABLE sections ADD COLUMN IF NOT EXISTS video_url TEXT;

      -- Enrollment metadata: program track + tuition
      ALTER TABLE users ADD COLUMN IF NOT EXISTS program_track TEXT;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS tuition_status TEXT DEFAULT 'unpaid';
      ALTER TABLE users ADD COLUMN IF NOT EXISTS tuition_total NUMERIC(10,2);
      ALTER TABLE users ADD COLUMN IF NOT EXISTS tuition_amount_paid NUMERIC(10,2) DEFAULT 0;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS tuition_notes TEXT;
    `);

    // Seed default pathway rows for each track (all modules required, hours = global).
    // Stored as one row per track in program_settings under keys 'pathway_mat',
    // 'pathway_reformer', 'pathway_both'. Default value: { required_module_ids: [], hour_requirements: null }.
    // required_module_ids = [] means "all modules" (interpreted at render time).
    for (const track of ['mat', 'reformer', 'both']) {
      await client.query(
        `INSERT INTO program_settings (key, value)
         VALUES ($1, $2::jsonb)
         ON CONFLICT (key) DO NOTHING`,
        [`pathway_${track}`, JSON.stringify({
          required_module_ids: [],   // empty = all modules required
          hour_requirements: null,   // null = inherit global hour_requirements
          requires_final_exam: true,
          requires_scenarios: true,
          label: track === 'mat' ? 'Mat Certification'
               : track === 'reformer' ? 'Reformer Certification'
               : 'Mat + Reformer Certification'
        })]
      );
    }

    console.log('[db] Database initialized successfully');
  } finally {
    client.release();
  }
}
