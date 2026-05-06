# DevANT Backend — Setup & Deploy Guide

## Stack
- **Runtime:** Node.js 18+ + Express
- **Database:** PostgreSQL via External Supabase (pg package only)
- **Deploy:** Render.com (free tier)
- **AI:** Groq LLaMA3-8b (llama3-8b-8192) — free tier, ultra fast

---

## Step 1 — Local Setup

```bash
cd devant-backend
npm install
cp .env.example .env
```

Open `.env` and fill in:

```
DATABASE_URL=postgresql://postgres:YOUR_REAL_PASSWORD@db.pbervsytinmfejbmnqzu.supabase.co:5432/postgres
GITHUB_CLIENT_ID=        ← from github.com/settings/developers
GITHUB_CLIENT_SECRET=    ← from github.com/settings/developers
GITHUB_WEBHOOK_SECRET=   ← any random string you choose
GROQ_API_KEY=            ← from console.groq.com
FRONTEND_URL=            ← your Lovable app URL
```

---

## Step 2 — Create GitHub OAuth App

1. Go to: https://github.com/settings/developers
2. Click **New OAuth App**
3. Set:
   - **Homepage URL:** `https://devant-backend.onrender.com`
   - **Callback URL:** `https://devant-backend.onrender.com/api/github/callback`
4. Copy `Client ID` and `Client Secret` → paste into `.env`

---

## Step 3 — Run Database Migration

```bash
npm run migrate
```

---

## Step 4 — Test Locally

```bash
npm run dev
curl http://localhost:3001/api/health
# Expected: { "status": "ok", "db": "connected" }
```

---

## Step 5 — Deploy to Render.com (Free)

### 5a — Push code to GitHub
```bash
git init
git add .
git commit -m "initial commit"
git remote add origin https://github.com/YOUR_USERNAME/devant-backend.git
git push -u origin main
```

### 5b — Create Web Service on Render
1. Go to **https://render.com** → Sign up (free)
2. Click **New → Web Service**
3. Connect your GitHub repo
4. Render auto-detects `render.yaml`. Confirm:
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Region: **Singapore** *(closest to India)*
   - Plan: **Free**

### 5c — Set Environment Variables
In Render dashboard → **Environment** tab:

| Key | Value |
|-----|-------|
| `DATABASE_URL` | your Supabase connection string |
| `GITHUB_CLIENT_ID` | from GitHub OAuth App |
| `GITHUB_CLIENT_SECRET` | from GitHub OAuth App |
| `GITHUB_WEBHOOK_SECRET` | any random secret string |
| `GROQ_API_KEY` | from console.groq.com |
| `FRONTEND_URL` | your Lovable app URL |

Click **Save Changes** → Render auto-redeploys.

### 5d — Your live URL
```
https://devant-backend.onrender.com
```

> ⚠️ **Free tier note:** Render free services spin down after 15 min of inactivity
> and take ~30s to wake on the next request. Fine for development/testing.
> Upgrade to Starter ($7/mo) for always-on if needed.

---

## Step 6 — Update GitHub OAuth Callback

After deploy, update your GitHub OAuth App:
- **Callback URL:** `https://devant-backend.onrender.com/api/github/callback`

---

## API Endpoints Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/health | Server + DB health check |
| GET | /api/projects | List all projects |
| POST | /api/projects | Create project |
| GET | /api/projects/:id/summary | Full project dashboard data |
| GET | /api/github/auth?project_id= | Start GitHub OAuth |
| GET | /api/github/callback | OAuth callback |
| GET | /api/github/repos | List user's GitHub repos |
| POST | /api/github/link-repo | Link repo to project + register webhook |
| POST | /api/github/sync/:project_id | Sync historical GitHub data |
| GET | /api/commits/:project_id | Get commits for project |
| POST | /api/commits/:project_id/analyze | Trigger AI analysis |
| GET | /api/commits/:project_id/contributors | Contributor stats |
| GET | /api/team/:project_id | Team members + activity status |
| POST | /api/team/:project_id | Add team member |
| GET | /api/team/:project_id/finance | Finance summary + burn rate |
| GET | /api/metrics/:project_id/dora | DORA metrics |
| GET | /api/metrics/:project_id/health | Health score (0-100) |
| POST | /api/webhook | GitHub webhook receiver |

---

## Lovable Frontend — What to Tell It

> "The backend API is live at https://devant-backend.onrender.com.
> All API calls should go to this base URL.
> Use /api/projects for project data, /api/github/auth to start GitHub login,
> /api/metrics/:id/health for health scores, /api/metrics/:id/dora for DORA metrics,
> /api/team/:id for team data, /api/team/:id/finance for budget data,
> /api/commits/:id for commit feed.
> For CORS, set FRONTEND_URL to exact origins separated by commas, not URLs with paths."
