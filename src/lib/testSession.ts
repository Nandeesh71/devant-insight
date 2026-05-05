export const TEST_SESSION_TOKEN = "devant-test-token";
export const TEST_LOGIN_EMAIL = import.meta.env.VITE_TEST_LOGIN_EMAIL || "test@devant.app";
export const TEST_LOGIN_PASSWORD = import.meta.env.VITE_TEST_LOGIN_PASSWORD || "Devant@123";

const MOCK_PROJECT_ID = "mock-project-1";
const MOCK_OWNER = "devant";
const MOCK_REPO = "analytics-demo";

const MOCK_USER = {
  id: "test-user-1",
  email: TEST_LOGIN_EMAIL,
  name: "DevANT Test User",
  github_login: "devant-demo",
  github_connected: true,
  provider: "github" as const,
};

const MOCK_PROJECT = {
  id: MOCK_PROJECT_ID,
  name: MOCK_REPO,
  owner: MOCK_OWNER,
  github_owner: MOCK_OWNER,
  github_repo: MOCK_REPO,
  repository_name: MOCK_REPO,
  repo_full_name: `${MOCK_OWNER}/${MOCK_REPO}`,
  github_repo_full_name: `${MOCK_OWNER}/${MOCK_REPO}`,
  commits_count: 128,
  health_score: 87,
  budget: 420000,
  risk_level: "Medium",
};

const MOCK_SUMMARY = {
  project: MOCK_PROJECT,
  commits: { total: 128, this_week: 24 },
  pull_requests: { open: 6, merged: 42 },
  last_activity: new Date().toISOString(),
};

const MOCK_COMMITS = [
  {
    id: "c1",
    sha: "9f1a2b3c",
    message: "feat: add domain verification analytics banner",
    author: "DevANT Bot",
    date: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    ai_type_tag: "Feature",
    ai_summary: "Added analytics signal path for verification checks.",
    ai_risk_flag: "Low",
    diff_size: "12 files",
    files_changed: 12,
    lines_added: 214,
    lines_removed: 47,
    html_url: `https://github.com/${MOCK_OWNER}/${MOCK_REPO}/commit/9f1a2b3c`,
  },
  {
    id: "c2",
    sha: "6d4e5f7a",
    message: "fix: stabilize mock ingestion pipeline",
    author: "QA User",
    date: new Date(Date.now() - 18 * 60 * 60 * 1000).toISOString(),
    ai_type_tag: "Fix",
    ai_summary: "Resolved intermittent timeout in ingestion simulation.",
    ai_risk_flag: "Medium",
    diff_size: "5 files",
    files_changed: 5,
    lines_added: 72,
    lines_removed: 20,
    html_url: `https://github.com/${MOCK_OWNER}/${MOCK_REPO}/commit/6d4e5f7a`,
  },
  {
    id: "c3",
    sha: "1a8b9c0d",
    message: "refactor: split dashboard metric calculators",
    author: "Ops Lead",
    date: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
    ai_type_tag: "Refactor",
    ai_summary: "Improved metric composition for reusable analytics widgets.",
    ai_risk_flag: "Low",
    diff_size: "9 files",
    files_changed: 9,
    lines_added: 143,
    lines_removed: 101,
    html_url: `https://github.com/${MOCK_OWNER}/${MOCK_REPO}/commit/1a8b9c0d`,
  },
];

const MOCK_TEAM = [
  { id: "u1", name: "Anita Rao", role: "Tech Lead", status: "Active", last_commit: "2h ago" },
  { id: "u2", name: "Rohit Sen", role: "Backend Engineer", status: "Active", last_commit: "18h ago" },
  { id: "u3", name: "Maya Patel", role: "Product Engineer", status: "Review", last_commit: "2d ago" },
];

const MOCK_FINANCE = {
  budget: 420000,
  spent: 268800,
  burn_percent: 64,
  runway_months: 5,
};

const MOCK_DORA = {
  deployment_frequency: { value: "Daily", rating: "Good" },
  change_lead_time: { value: "10h", rating: "Good" },
  change_failure_rate: { value: "8%", rating: "Good" },
};

const MOCK_HEALTH = {
  score: 87,
  color: "green",
  breakdown: {
    velocity: 90,
    reliability: 85,
    quality: 86,
  },
};

const MOCK_REPO_CARD = {
  repoName: MOCK_REPO,
  repoFullPath: `${MOCK_OWNER}/${MOCK_REPO}`,
  isPrivate: false,
  starCount: 73,
  lastCommitMessage: "feat: add domain verification analytics banner",
  lastCommitBranch: "main",
  lastCommitTime: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  topContributors: [
    { login: "anitarao", avatarUrl: "https://avatars.githubusercontent.com/u/1?v=4" },
    { login: "rohitsen", avatarUrl: "https://avatars.githubusercontent.com/u/2?v=4" },
    { login: "mayapatel", avatarUrl: "https://avatars.githubusercontent.com/u/3?v=4" },
  ],
};

function normalizePath(path: string): string {
  if (!path) return "/";
  let pathname = path;
  if (path.startsWith("http")) {
    try {
      pathname = new URL(path).pathname;
    } catch {
      pathname = path;
    }
  }
  return pathname.replace(/\/+$/, "") || "/";
}

export function isTestCredentials(email: string, password: string): boolean {
  return email.trim().toLowerCase() === TEST_LOGIN_EMAIL.toLowerCase() && password === TEST_LOGIN_PASSWORD;
}

export function isTestSessionToken(token: string | null): boolean {
  return token === TEST_SESSION_TOKEN;
}

export function getTestSessionUser() {
  return { ...MOCK_USER };
}

export function getMockApiResponse(method: string, path: string, token: string | null): unknown | undefined {
  if (!isTestSessionToken(token)) return undefined;

  const normalizedPath = normalizePath(path);

  if (method === "GET" && normalizedPath === "/api/auth/me") return { ...MOCK_USER };
  if (method === "GET" && normalizedPath === "/api/projects") return [{ ...MOCK_PROJECT }];

  if (method === "GET" && /^\/api\/projects\/[^/]+\/summary$/.test(normalizedPath)) {
    return { ...MOCK_SUMMARY };
  }

  if (method === "GET" && /^\/api\/projects\/[^/]+\/[^/]+\/summary$/.test(normalizedPath)) {
    return { ...MOCK_SUMMARY };
  }

  if (method === "GET" && /^\/api\/commits\/[^/]+$/.test(normalizedPath)) return [...MOCK_COMMITS];
  if (method === "GET" && /^\/api\/commits\/[^/]+\/contributors$/.test(normalizedPath)) {
    return [
      { login: "anitarao", commits: 47 },
      { login: "rohitsen", commits: 39 },
      { login: "mayapatel", commits: 28 },
    ];
  }

  if (method === "GET" && /^\/api\/team\/[^/]+$/.test(normalizedPath)) return [...MOCK_TEAM];
  if (method === "GET" && /^\/api\/team\/[^/]+\/finance$/.test(normalizedPath)) return { ...MOCK_FINANCE };

  if (method === "GET" && /^\/api\/metrics\/[^/]+\/dora$/.test(normalizedPath)) return { ...MOCK_DORA };
  if (method === "GET" && /^\/api\/metrics\/[^/]+\/health$/.test(normalizedPath)) return { ...MOCK_HEALTH };

  if (method === "GET" && /^\/api\/github\/repo-card\/[^/]+\/[^/]+$/.test(normalizedPath)) return { ...MOCK_REPO_CARD };

  if (method === "POST" && /^\/api\/github\/sync\/[^/]+$/.test(normalizedPath)) return { ok: true };
  if (method === "DELETE" && /^\/api\/projects\/[^/]+$/.test(normalizedPath)) return { ok: true };

  return undefined;
}
