// Seeds the database with the 7 course modules from seed-data/modules.json
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool } from './db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export async function seedModulesIfEmpty() {
  const result = await pool.query('SELECT COUNT(*) FROM modules');
  if (parseInt(result.rows[0].count) > 0) {
    console.log('[seed] Modules already exist, skipping');
    return;
  }

  const seedPath = path.join(__dirname, 'seed-data', 'modules.json');
  if (!fs.existsSync(seedPath)) {
    console.warn('[seed] No modules.json found, starting with empty modules');
    return;
  }

  const modules = JSON.parse(fs.readFileSync(seedPath, 'utf8'));

  for (let i = 0; i < modules.length; i++) {
    const m = modules[i];
    const modId = String(m.id);

    await pool.query(
      `INSERT INTO modules (id, title, subtitle, description, icon, sort_order, is_published)
       VALUES ($1, $2, $3, $4, $5, $6, TRUE)
       ON CONFLICT (id) DO NOTHING`,
      [modId, m.title || '', m.week || '', m.description || '', m.icon || 'fa-book', i]
    );

    if (Array.isArray(m.sections)) {
      for (let j = 0; j < m.sections.length; j++) {
        const s = m.sections[j];
        if (!s || !s.id) continue;
        await pool.query(
          `INSERT INTO sections (id, module_id, title, content, sort_order)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (id) DO NOTHING`,
          [String(s.id), modId, s.title || '', s.content || '', j]
        );
      }
    }
  }

  console.log(`[seed] Seeded ${modules.length} modules with all sections`);
}
