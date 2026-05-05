import type { AuthUser } from "@/context/AuthContext";

export const DEMO_EMAIL = "test@devant.local";
export const DEMO_PASSWORD = "Test@1234!";
export const DEMO_TOKEN = "devant-demo-token";

export const DEMO_USER: AuthUser = {
  id: "demo-user",
  email: DEMO_EMAIL,
  name: "Test Console User",
  avatar_url: "https://api.dicebear.com/9.x/initials/svg?seed=DevANT",
  github_login: "devant-demo",
  github_connected: true,
  provider: "google",
};

const now = new Date();
const daysAgo = (days: number) => new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString();

const DEMO_PROJECTS = [
  {
    id: "demo-project-1",
    name: "devant-insight",
    owner: "devant-labs",
    github_owner: "devant-labs",
    github_repo: "devant-insight",
    github_repo_full_name: "devant-labs/devant-insight",
    repository_name: "devant-insight",
    repo_full_name: "devant-labs/devant-insight",
    github_url: "https://github.com/devant-labs/devant-insight",
    default_branch: "main",
    created_at: daysAgo(74),
    updated_at: daysAgo(1),
  },
  {
    id: "demo-project-2",
    name: "devant-backend",
    owner: "devant-labs",
    github_owner: "devant-labs",
    github_repo: "devant-backend",
    github_repo_full_name: "devant-labs/devant-backend",
    repository_name: "devant-backend",
    repo_full_name: "devant-labs/devant-backend",
    github_url: "https://github.com/devant-labs/devant-backend",
    default_branch: "main",
    created_at: daysAgo(92),
    updated_at: daysAgo(2),
  },
];

const DEMO_GITHUB_REPOS = DEMO_PROJECTS.map((project) => ({
  id: project.id,
  name: project.github_repo,
  full_name: project.github_repo_full_name,
  html_url: project.github_url,
  private: false,
  default_branch: project.default_branch,
  language: project.name === "devant-backend" ? "TypeScript" : "TypeScript",
  updated_at: project.updated_at,
}));

const DEMO_DATA = {
  [DEMO_PROJECTS[0].id]: {
    summary: {
      project: DEMO_PROJECTS[0],
      commits: {
        total: 184,
        recent: [
          {
            id: "demo-c1",
            sha: "a1b2c3d4",
            message: "Add demo login and analytics mode",
            author: "Dev Tester",
            date: daysAgo(1),
            lines_added: 214,
            lines_removed: 32,
            ai_type_tag: "Feature",
            ai_summary: "Adds a demo session flow that exposes mock analytics data.",
            url: "https://github.com/devant-labs/devant-insight/commit/a1b2c3d4",
          },
          {
            id: "demo-c2",
            sha: "b2c3d4e5",
            message: "Polish overview cards",
            author: "Dev Tester",
            date: daysAgo(3),
            lines_added: 88,
            lines_removed: 21,
            ai_type_tag: "UX",
            ai_summary: "Improves the dashboard summary layout for better readability.",
            url: "https://github.com/devant-labs/devant-insight/commit/b2c3d4e5",
          },
        ],
      },
      team: {
        count: 4,
        members: [
          { login: "dev-tester", name: "Dev Tester", role: "Owner", avatar_url: "https://api.dicebear.com/9.x/initials/svg?seed=DT" },
          { login: "ana", name: "Ana Patel", role: "Engineer", avatar_url: "https://api.dicebear.com/9.x/initials/svg?seed=AP" },
        ],
      },
      pull_requests: { open: 3 },
      open_issues: 7,
      deployments: { total: 12 },
      last_activity: daysAgo(1),
    },
    commits: [
      {
        id: "demo-c1",
        sha: "a1b2c3d4",
        message: "Add demo login and analytics mode",
        author: "Dev Tester",
        date: daysAgo(1),
        ai_type_tag: "Feature",
        ai_summary: "Adds a demo session flow that exposes mock analytics data.",
        ai_risk_flag: "Low",
        diff_size: "214 lines",
        files_changed: 6,
        lines_added: 214,
        lines_removed: 32,
        url: "https://github.com/devant-labs/devant-insight/commit/a1b2c3d4",
      },
      {
        id: "demo-c2",
        sha: "b2c3d4e5",
        message: "Polish overview cards",
        author: "Dev Tester",
        date: daysAgo(3),
        ai_type_tag: "UX",
        ai_summary: "Improves the dashboard summary layout for better readability.",
        ai_risk_flag: "Low",
        diff_size: "88 lines",
        files_changed: 4,
        lines_added: 88,
        lines_removed: 21,
        url: "https://github.com/devant-labs/devant-insight/commit/b2c3d4e5",
      },
      {
        id: "demo-c3",
        sha: "c3d4e5f6",
        message: "Refresh project insights",
        author: "Ana Patel",
        date: daysAgo(5),
        ai_type_tag: "Analytics",
        ai_summary: "Updates summary data used by the overview dashboard.",
        ai_risk_flag: "Medium",
        diff_size: "121 lines",
        files_changed: 5,
        lines_added: 121,
        lines_removed: 16,
        url: "https://github.com/devant-labs/devant-insight/commit/c3d4e5f6",
      },
    ],
    team: {
      members: [
        { id: "demo-member-1", login: "dev-tester", name: "Dev Tester", role: "Owner", avatar_url: "https://api.dicebear.com/9.x/initials/svg?seed=DT", contributions: 94 },
        { id: "demo-member-2", login: "ana", name: "Ana Patel", role: "Engineer", avatar_url: "https://api.dicebear.com/9.x/initials/svg?seed=AP", contributions: 52 },
      ],
      repo: {
        owner: {
          login: "devant-labs",
          name: "DevANT Labs",
          avatar_url: "https://api.dicebear.com/9.x/initials/svg?seed=DL",
          html_url: "https://github.com/devant-labs",
        },
        collaborators: [
          { login: "dev-tester", avatar_url: "https://api.dicebear.com/9.x/initials/svg?seed=DT", html_url: "https://github.com/dev-tester" },
          { login: "ana", avatar_url: "https://api.dicebear.com/9.x/initials/svg?seed=AP", html_url: "https://github.com/ana" },
        ],
        contributors: [
          { login: "dev-tester", avatar_url: "https://api.dicebear.com/9.x/initials/svg?seed=DT", contributions: 94 },
          { login: "ana", avatar_url: "https://api.dicebear.com/9.x/initials/svg?seed=AP", contributions: 52 },
        ],
      },
    },
    finance: { budget: 120000, spent: 78400, burn_percent: 65, runway_months: 5 },
    dora: {
      deployment_frequency: { value: "3/wk", rating: "High" },
      change_lead_time: { value: "14h", rating: "High" },
      change_failure_rate: { value: "4%", rating: "Elite" },
    },
    health: { score: 84, color: "green", breakdown: { commits: 30, prs: 20, deployments: 18, issues: 16 } },
    deployments: [
      { id: "demo-d1", status: "success", environment: "production", deployed_at: daysAgo(1), description: "Released the demo-login flow.", commit_sha: "a1b2c3d4", log_url: "https://github.com/devant-labs/devant-insight/actions/runs/1" },
      { id: "demo-d2", status: "success", environment: "staging", deployed_at: daysAgo(4), description: "Verified analytics cards in staging.", commit_sha: "b2c3d4e5", log_url: "https://github.com/devant-labs/devant-insight/actions/runs/2" },
    ],
    repoCard: {
      repoName: "devant-insight",
      repoFullPath: "devant-labs/devant-insight",
      isPrivate: false,
      starCount: 128,
      lastCommitMessage: "Add demo login and analytics mode",
      lastCommitBranch: "main",
      lastCommitTime: daysAgo(1),
      topContributors: [
        { login: "dev-tester", avatarUrl: "https://api.dicebear.com/9.x/initials/svg?seed=DT" },
        { login: "ana", avatarUrl: "https://api.dicebear.com/9.x/initials/svg?seed=AP" },
      ],
    },
  },
  [DEMO_PROJECTS[1].id]: {
    summary: {
      project: DEMO_PROJECTS[1],
      commits: {
        total: 247,
        recent: [
          {
            id: "demo-b1",
            sha: "d4e5f6a7",
            message: "Mock backend metrics payloads",
            author: "Ravi Singh",
            date: daysAgo(2),
            lines_added: 176,
            lines_removed: 40,
            ai_type_tag: "API",
            ai_summary: "Returns deterministic analytics data during demo sessions.",
            url: "https://github.com/devant-labs/devant-backend/commit/d4e5f6a7",
          },
        ],
      },
      team: { count: 3, members: [{ login: "ravi", name: "Ravi Singh", role: "Engineer", avatar_url: "https://api.dicebear.com/9.x/initials/svg?seed=RS" }] },
      pull_requests: { open: 2 },
      open_issues: 5,
      deployments: { total: 9 },
      last_activity: daysAgo(2),
    },
    commits: [
      {
        id: "demo-b1",
        sha: "d4e5f6a7",
        message: "Mock backend metrics payloads",
        author: "Ravi Singh",
        date: daysAgo(2),
        ai_type_tag: "API",
        ai_summary: "Returns deterministic analytics data during demo sessions.",
        ai_risk_flag: "Low",
        diff_size: "176 lines",
        files_changed: 5,
        lines_added: 176,
        lines_removed: 40,
        url: "https://github.com/devant-labs/devant-backend/commit/d4e5f6a7",
      },
    ],
    team: {
      members: [
        { id: "demo-member-3", login: "ravi", name: "Ravi Singh", role: "Engineer", avatar_url: "https://api.dicebear.com/9.x/initials/svg?seed=RS", contributions: 67 },
      ],
      repo: {
        owner: {
          login: "devant-labs",
          name: "DevANT Labs",
          avatar_url: "https://api.dicebear.com/9.x/initials/svg?seed=DL",
          html_url: "https://github.com/devant-labs",
        },
        collaborators: [
          { login: "ravi", avatar_url: "https://api.dicebear.com/9.x/initials/svg?seed=RS", html_url: "https://github.com/ravi" },
        ],
        contributors: [
          { login: "ravi", avatar_url: "https://api.dicebear.com/9.x/initials/svg?seed=RS", contributions: 67 },
        ],
      },
    },
    finance: { budget: 86000, spent: 55200, burn_percent: 64, runway_months: 6 },
    dora: {
      deployment_frequency: { value: "2/wk", rating: "Medium" },
      change_lead_time: { value: "1d", rating: "High" },
      change_failure_rate: { value: "6%", rating: "High" },
    },
    health: { score: 77, color: "blue", breakdown: { commits: 28, prs: 18, deployments: 14, issues: 17 } },
    deployments: [
      { id: "demo-bd1", status: "success", environment: "production", deployed_at: daysAgo(2), description: "Published demo backend metrics.", commit_sha: "d4e5f6a7", log_url: "https://github.com/devant-labs/devant-backend/actions/runs/3" },
    ],
    repoCard: {
      repoName: "devant-backend",
      repoFullPath: "devant-labs/devant-backend",
      isPrivate: false,
      starCount: 91,
      lastCommitMessage: "Mock backend metrics payloads",
      lastCommitBranch: "main",
      lastCommitTime: daysAgo(2),
      topContributors: [
        { login: "ravi", avatarUrl: "https://api.dicebear.com/9.x/initials/svg?seed=RS" },
      ],
    },
  },
} as const;

function getDemoProject(identifier: string | null | undefined) {
  if (!identifier) return null;
  const key = identifier.trim();
  if (!key) return null;

  return DEMO_PROJECTS.find((project) => {
    const repoFull = String(project.repo_full_name || project.github_repo_full_name || "");
    const repoName = String(project.github_repo || project.name || project.repository_name || "");
    return project.id === key || repoFull === key || repoName === key;
  }) || null;
}

function getDemoProjectData(identifier: string | null | undefined) {
  const project = getDemoProject(identifier);
  return project ? DEMO_DATA[project.id as keyof typeof DEMO_DATA] : null;
}

function splitPath(path: string) {
  return path.replace(/^\/?/, "").split("/").filter(Boolean);
}

export function isDemoToken(token: string | null | undefined) {
  return token === DEMO_TOKEN;
}

export function validateDemoCredentials(email: string, password: string) {
  return email.trim().toLowerCase() === DEMO_EMAIL && password === DEMO_PASSWORD;
}

export function getDemoAuthUser() {
  return DEMO_USER;
}

export function getDemoResponse(method: string, path: string) {
  const [basePath] = path.split("?");
  const segments = splitPath(basePath);

  if (method === "GET" && basePath === "/api/auth/me") {
    return { user: DEMO_USER };
  }

  if (method === "GET" && basePath === "/api/projects") {
    return DEMO_PROJECTS;
  }

  if (method === "GET" && basePath === "/api/github/repos") {
    return DEMO_GITHUB_REPOS;
  }

  if (method === "GET" && segments[0] === "api" && segments[1] === "github" && segments[2] === "repo-card" && segments.length >= 5) {
    const owner = segments[3];
    const repo = segments.slice(4).join("/");
    return getDemoProjectData(`${owner}/${repo}`)?.repoCard || null;
  }

  if (method === "GET" && segments[0] === "api" && segments[1] === "projects" && segments[3] === "summary") {
    const identifier = segments.length >= 5 ? `${segments[2]}/${segments[3]}` : segments[2];
    return getDemoProjectData(identifier)?.summary || null;
  }

  if (method === "GET" && segments[0] === "api" && segments[1] === "commits" && segments.length >= 3) {
    const identifier = segments[2];
    const demo = getDemoProjectData(identifier);
    if (!demo) return [];
    if (segments[3] === "contributors") {
      return demo.team.repo.contributors || [];
    }
    return demo.commits;
  }

  if (method === "GET" && segments[0] === "api" && segments[1] === "team" && segments.length >= 3) {
    const identifier = segments[2];
    const demo = getDemoProjectData(identifier);
    if (!demo) return null;
    if (segments[3] === "finance") return demo.finance;
    return demo.team;
  }

  if (method === "GET" && segments[0] === "api" && segments[1] === "metrics" && segments.length >= 4) {
    const identifier = segments[2];
    const demo = getDemoProjectData(identifier);
    if (!demo) return null;
    if (segments[3] === "dora") return demo.dora;
    if (segments[3] === "health") return demo.health;
  }

  if (method === "GET" && segments[0] === "api" && segments[1] === "deployments" && segments.length >= 3) {
    const identifier = segments[2];
    return getDemoProjectData(identifier)?.deployments || [];
  }

  if (method === "POST" && segments[0] === "api" && segments[1] === "github" && segments[2] === "sync") {
    return { success: true };
  }

  if (method === "POST" && segments[0] === "api" && segments[1] === "github" && segments[2] === "link-repo") {
    return { success: true, project: DEMO_PROJECTS[0] };
  }

  if (method === "POST" && segments[0] === "api" && segments[1] === "github" && segments[2] === "disconnect") {
    return { success: true };
  }

  if (method === "DELETE" && segments[0] === "api" && segments[1] === "projects") {
    return { success: true };
  }

  return null;
}