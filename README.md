# NUMA Pilates Certification — Backend API

Node.js + Express + PostgreSQL backend for the NUMA Pilates Certification Portal. Persists student logins, progress, quiz scores, scenarios, and editable module content across all updates and devices.

## Deploy to Railway (Step-by-Step)

### 1. Sign up at [railway.app](https://railway.app)
Free tier includes $5/month of usage credit — plenty for a teacher training portal.

### 2. Create a new project
- Click **New Project** → **Deploy from GitHub Repo** (recommended) OR **Empty Project**

### 3. Add PostgreSQL
- In your project, click **+ New** → **Database** → **Add PostgreSQL**
- Railway auto-creates `DATABASE_URL` and links it to your backend

### 4. Deploy this backend
**Option A — GitHub (recommended):**
- Push this `numa-backend` folder to a GitHub repo
- In Railway → Settings → Connect Repo → select your repo
- Railway auto-detects Node.js and deploys

**Option B — Railway CLI:**
```bash
npm install -g @railway/cli
railway login
cd numa-backend
railway init
railway up
```

### 5. Set environment variables
In Railway → your service → **Variables**:
- `DATABASE_URL` — auto-set by the Postgres plugin (verify it's there)
- `JWT_SECRET` — set to a long random string (e.g. `numa-jwt-secret-7f3kd9s2-randomize-this`)
- `ADMIN_USERNAME` — `admin` (or your choice)
- `ADMIN_PASSWORD` — `numa2026` (or your choice — pick a strong one)

### 6. Get your backend URL
After deployment, Railway gives you a public URL like:
```
https://numa-backend-production-abcd.up.railway.app
```

### 7. Connect the frontend
On Netlify, edit `index.html` and add this line **before** the script tags:
```html
<script>window.NUMA_API_BASE = 'https://your-railway-url.up.railway.app';</script>
```

That's it — the portal will now save everything to Railway.

## Local development

```bash
# Install
npm install

# Set up a local Postgres (or use a Railway dev DB)
cp .env.example .env
# Edit .env with your DATABASE_URL

# Run
npm run dev
```

## What gets seeded on first deploy

When the database is empty, the backend automatically seeds:
- All 7 course modules with their sections (loaded from `src/seed-data/modules.json`)
- Default enrollment codes: `NUMA2026`, `NUMPILATES`, `NUMAREFORMER`
- Admin user (created on first admin login)

You can edit, add, or delete modules and sections from the admin panel — those changes save to the database and persist through every deployment.

## API endpoints

All admin endpoints require the admin JWT.

### Auth
- `POST /api/auth/register` — create student account (requires enrollment code)
- `POST /api/auth/login` — returns JWT
- `GET /api/auth/me` — current user

### Modules (public read)
- `GET /api/modules` — list published modules
- `GET /api/modules/:id` — module with sections

### Admin: modules & sections
- `POST /api/admin/modules` — create module
- `PUT /api/admin/modules/:id` — update module
- `DELETE /api/admin/modules/:id` — delete module
- `POST /api/admin/sections` — create section
- `PUT /api/admin/sections/:id` — update section
- `DELETE /api/admin/sections/:id` — delete section

### Progress (student)
- `POST /api/quiz-scores` — record quiz attempt
- `GET /api/quiz-scores` — my quiz history
- `POST /api/scenarios` — submit scenario response
- `POST /api/hours` — log practice hours
- `POST /api/final-exam` — record final exam attempt

### Admin: students & codes
- `GET /api/admin/students` — list all students
- `GET /api/admin/students/:id` — student detail
- `GET /api/admin/enrollment-codes` — list codes
- `POST /api/admin/enrollment-codes` — add code
- `DELETE /api/admin/enrollment-codes/:code` — remove code
