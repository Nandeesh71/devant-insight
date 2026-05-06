-- ══════════════════════════════════════════════
-- DevANT — PostgreSQL Schema
-- Run with: npm run migrate
-- ══════════════════════════════════════════════

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── Users ───────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider          TEXT NOT NULL,
  provider_id       TEXT NOT NULL,
  email             TEXT NOT NULL,
  name              TEXT,
  avatar_url        TEXT,
  github_login      TEXT,
  github_connected  BOOLEAN DEFAULT false,
  google_id         TEXT,
  oauth_token       JSONB,
  created_at        TIMESTAMPTZ DEFAULT now(),
  updated_at        TIMESTAMPTZ DEFAULT now(),
  UNIQUE(provider, provider_id)
);

-- ── Workspaces ──────────────────────────────
CREATE TABLE IF NOT EXISTS workspaces (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- ── Projects ────────────────────────────────
CREATE TABLE IF NOT EXISTS projects (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id          UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id               UUID REFERENCES users(id) ON DELETE CASCADE,
  name                  TEXT NOT NULL,
  description           TEXT,
  budget                NUMERIC,
  start_date            DATE,
  end_date              DATE,
  github_repo_full_name TEXT,
  github_repo_id        BIGINT,
  github_access_token   TEXT,
  status                TEXT DEFAULT 'active',
  created_at            TIMESTAMPTZ DEFAULT now()
);

-- ── Team Members ────────────────────────────
CREATE TABLE IF NOT EXISTS team_members (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id        UUID REFERENCES projects(id) ON DELETE CASCADE,
  github_username   TEXT NOT NULL,
  display_name      TEXT,
  role              TEXT DEFAULT 'developer',
  monthly_salary    NUMERIC DEFAULT 0,
  created_at        TIMESTAMPTZ DEFAULT now()
);

-- ── Commits ─────────────────────────────────
CREATE TABLE IF NOT EXISTS commits (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id              UUID REFERENCES projects(id) ON DELETE CASCADE,
  sha                     TEXT NOT NULL UNIQUE,
  author_github_username  TEXT,
  message                 TEXT,
  timestamp               TIMESTAMPTZ,
  lines_added             INT DEFAULT 0,
  lines_removed           INT DEFAULT 0,
  files_changed           JSONB DEFAULT '[]',
  ai_type_tag             TEXT,
  ai_summary              TEXT,
  ai_risk_flag            BOOLEAN DEFAULT false,
  ai_analyzed             BOOLEAN DEFAULT false,
  created_at              TIMESTAMPTZ DEFAULT now()
);

-- ── Pull Requests ───────────────────────────
CREATE TABLE IF NOT EXISTS pull_requests (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id              UUID REFERENCES projects(id) ON DELETE CASCADE,
  github_pr_number        INT NOT NULL,
  title                   TEXT,
  author_github_username  TEXT,
  status                  TEXT DEFAULT 'open',
  reviewers               JSONB DEFAULT '[]',
  conflict_flag           BOOLEAN DEFAULT false,
  opened_at               TIMESTAMPTZ,
  merged_at               TIMESTAMPTZ,
  created_at              TIMESTAMPTZ DEFAULT now(),
  UNIQUE(project_id, github_pr_number)
);

-- ── Deployments ─────────────────────────────
CREATE TABLE IF NOT EXISTS deployments (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id   UUID REFERENCES projects(id) ON DELETE CASCADE,
  environment  TEXT DEFAULT 'production',
  status       TEXT DEFAULT 'success',
  deployed_at  TIMESTAMPTZ,
  log_url      TEXT,
  created_at   TIMESTAMPTZ DEFAULT now()
);

-- ── Health Scores ───────────────────────────
CREATE TABLE IF NOT EXISTS health_scores (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id          UUID REFERENCES projects(id) ON DELETE CASCADE,
  score               INT DEFAULT 0,
  dora_score          INT DEFAULT 0,
  budget_score        INT DEFAULT 0,
  team_score          INT DEFAULT 0,
  security_score      INT DEFAULT 0,
  code_quality_score  INT DEFAULT 0,
  calculated_at       TIMESTAMPTZ DEFAULT now()
);

-- ── Milestones ──────────────────────────────
CREATE TABLE IF NOT EXISTS milestones (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id   UUID REFERENCES projects(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  target_date  DATE,
  status       TEXT DEFAULT 'in_progress',
  created_at   TIMESTAMPTZ DEFAULT now()
);

-- ── PR Deployments ──────────────────────────
CREATE TABLE IF NOT EXISTS pr_deployments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id      UUID REFERENCES projects(id) ON DELETE CASCADE,
  pr_number       INT NOT NULL,
  first_commit_at TIMESTAMPTZ,
  deployed_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT now(),
  UNIQUE(project_id, pr_number)
);

-- ── Project Budget ──────────────────────────
CREATE TABLE IF NOT EXISTS project_budget (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id  UUID REFERENCES projects(id) ON DELETE CASCADE UNIQUE,
  budget      NUMERIC,
  monthly_burn NUMERIC DEFAULT 0,
  currency    TEXT DEFAULT 'INR',
  team_size   INT DEFAULT 0,
  avg_hourly_rate NUMERIC DEFAULT 0,
  hours_per_month INT DEFAULT 0,
  start_date  DATE,
  notes       TEXT,
  amount_spent NUMERIC DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

-- ── Indexes for performance ─────────────────
CREATE INDEX IF NOT EXISTS idx_commits_project_id   ON commits(project_id);
CREATE INDEX IF NOT EXISTS idx_commits_timestamp    ON commits(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_commits_sha          ON commits(sha);
CREATE INDEX IF NOT EXISTS idx_prs_project_id       ON pull_requests(project_id);
CREATE INDEX IF NOT EXISTS idx_deployments_project  ON deployments(project_id);
CREATE INDEX IF NOT EXISTS idx_health_project       ON health_scores(project_id);
CREATE INDEX IF NOT EXISTS idx_pr_deployments_project ON pr_deployments(project_id);
CREATE INDEX IF NOT EXISTS idx_pr_deployments_pr_number ON pr_deployments(pr_number);
CREATE INDEX IF NOT EXISTS idx_project_budget_project ON project_budget(project_id);
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
