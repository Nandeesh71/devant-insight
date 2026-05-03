// Seed data per DevANT MVP v1.0 — used when backend has no data yet.
import { Bug, Zap, RefreshCw, Settings, GitCommit, Code2, LayoutDashboard, Layers, Smartphone, GitBranch } from "lucide-react";

export type Role = "Owner" | "Project Manager" | "Developer" | "Viewer";

export type SeedProject = {
  id: string;
  name: string;
  icon: typeof GitBranch;
  meta: string;
  budgetTotal: number; // rupees
  budgetSpent: number;
  runwayMonths: number;
  health: number;
  healthColor: string;
  dark?: boolean;
  color?: string;
  commitsCount: number;
  lastCommitAgo: string;
};

export const projectsSeed: SeedProject[] = [
  { id: "shortfundly", name: "ShortFundly", icon: GitBranch, meta: "47 commits · ₹2.6L budget", budgetTotal: 260000, budgetSpent: 189000, runwayMonths: 2.3, health: 74, healthColor: "text-yellow-400", dark: true, commitsCount: 47, lastCommitAgo: "12m ago" },
  { id: "perceptronix", name: "Perceptronix App", icon: Code2, meta: "23 commits · ₹1.8L", budgetTotal: 180000, budgetSpent: 92000, runwayMonths: 4.6, health: 88, healthColor: "text-emerald-500", color: "text-brand", commitsCount: 23, lastCommitAgo: "2h ago" },
  { id: "kds", name: "KDS Dashboard", icon: LayoutDashboard, meta: "18 commits · ₹90K", budgetTotal: 90000, budgetSpent: 41000, runwayMonths: 5.1, health: 91, healthColor: "text-emerald-500", color: "text-amber-500", commitsCount: 18, lastCommitAgo: "5h ago" },
  { id: "tensor", name: "Tensor Redesign", icon: Layers, meta: "9 commits · ₹45K", budgetTotal: 45000, budgetSpent: 19500, runwayMonths: 6.2, health: 82, healthColor: "text-emerald-500", color: "text-amber-500", commitsCount: 9, lastCommitAgo: "1d ago" },
  { id: "drapora", name: "Drapora Mobile", icon: Smartphone, meta: "12 commits · 52K lines", budgetTotal: 120000, budgetSpent: 88000, runwayMonths: 1.8, health: 79, healthColor: "text-yellow-400", color: "text-amber-500", commitsCount: 12, lastCommitAgo: "3h ago" },
  { id: "znexus", name: "Znexus API", icon: Zap, meta: "102 commits · 3.2GB", budgetTotal: 320000, budgetSpent: 210000, runwayMonths: 3.4, health: 85, healthColor: "text-emerald-500", color: "text-amber-500", commitsCount: 102, lastCommitAgo: "30m ago" },
];

export type SeedCommit = {
  id: string; sha: string; msg: string; author: string; date: string;
  tag: "Bug Fix" | "Feature" | "Refactor" | "Chore" | "Breaking Change";
  risk: "High" | "Medium" | "Low"; size: string;
  filesChanged: number; linesAdded: number; linesRemoved: number;
  aiSummary: string; restricted?: boolean; projectId: string;
};

export const commitsSeed: SeedCommit[] = [
  { id: "a3f92c", sha: "a3f92c8", msg: "fix: resolve auth token expiry", author: "Ravi", date: "Sep 26, 2025", tag: "Bug Fix", risk: "High", size: "2.1 MB", filesChanged: 8, linesAdded: 142, linesRemoved: 67, aiSummary: "Fixes a critical auth token refresh bug that caused users to be logged out unexpectedly. Touches the core session middleware — recommend code review before merge.", restricted: true, projectId: "shortfundly" },
  { id: "f8e21a", sha: "f8e21ab", msg: "feat: add payment gateway integration", author: "Priya", date: "Sep 27, 2025", tag: "Feature", risk: "High", size: "1.2 MB", filesChanged: 14, linesAdded: 412, linesRemoved: 11, aiSummary: "Adds Razorpay integration for the checkout flow. Introduces 3 new dependencies and a new webhook endpoint. High risk due to PCI surface area.", projectId: "shortfundly" },
  { id: "c91d34", sha: "c91d34e", msg: "refactor: cleanup middleware layer", author: "Arjun", date: "Sep 28, 2025", tag: "Refactor", risk: "Medium", size: "892 KB", filesChanged: 6, linesAdded: 89, linesRemoved: 154, aiSummary: "Extracts auth, logging, and rate-limit middleware into shared modules. Net code reduction. Low blast radius but worth a smoke test.", restricted: true, projectId: "shortfundly" },
  { id: "44bc01", sha: "44bc019", msg: "chore: update dependencies", author: "Ravi", date: "Sep 1, 2025", tag: "Chore", risk: "Low", size: "20 KB", filesChanged: 2, linesAdded: 12, linesRemoved: 12, aiSummary: "Routine npm dependency bump. No breaking changes detected.", projectId: "shortfundly" },
  { id: "9d77ee", sha: "9d77ee2", msg: "feat: dark mode toggle", author: "Sneha", date: "Sep 25, 2025", tag: "Feature", risk: "Low", size: "78 KB", filesChanged: 5, linesAdded: 96, linesRemoved: 4, aiSummary: "Adds theme toggle with localStorage persistence. Pure UI change.", projectId: "perceptronix" },
  { id: "2b14aa", sha: "2b14aa1", msg: "fix: race condition in webhook handler", author: "Arjun", date: "Sep 24, 2025", tag: "Bug Fix", risk: "Medium", size: "44 KB", filesChanged: 3, linesAdded: 28, linesRemoved: 19, aiSummary: "Adds idempotency keys to GitHub webhook handler. Prevents duplicate AI runs.", projectId: "perceptronix" },
];

export type SeedTeam = { id: string; name: string; role: string; status: "Active" | "Idle" | "Inactive"; lastCommit: string; salary: number; projectId: string };
export const teamSeed: SeedTeam[] = [
  { id: "ravi", name: "Ravi", role: "Backend Dev", status: "Active", lastCommit: "2h ago", salary: 45000, projectId: "shortfundly" },
  { id: "priya", name: "Priya", role: "Full Stack", status: "Active", lastCommit: "12m ago", salary: 55000, projectId: "shortfundly" },
  { id: "arjun", name: "Arjun", role: "DevOps", status: "Active", lastCommit: "5h ago", salary: 50000, projectId: "shortfundly" },
  { id: "sneha", name: "Sneha", role: "Frontend Dev", status: "Idle", lastCommit: "2d ago", salary: 39000, projectId: "perceptronix" },
];

export type SeedPR = { id: number; title: string; author: string; reviewer: string; ageHours: number; status: "Open" | "Stale" | "Conflict" | "Ready"; projectId: string };
export const prsSeed: SeedPR[] = [
  { id: 47, title: "Auth module refactor", author: "Arjun", reviewer: "Ravi", ageHours: 72, status: "Stale", projectId: "shortfundly" },
  { id: 48, title: "Payment gateway integration", author: "Priya", reviewer: "Ravi", ageHours: 8, status: "Open", projectId: "shortfundly" },
  { id: 49, title: "Add idempotency to webhooks", author: "Arjun", reviewer: "Sneha", ageHours: 26, status: "Conflict", projectId: "perceptronix" },
  { id: 50, title: "Dark mode toggle", author: "Sneha", reviewer: "Priya", ageHours: 4, status: "Ready", projectId: "perceptronix" },
];

export type SeedDeploy = { id: string; env: "production" | "staging"; status: "Success" | "Failed" | "Rolled Back"; sha: string; deployedBy: string; when: string; projectId: string };
export const deploysSeed: SeedDeploy[] = [
  { id: "dpl_91", env: "production", status: "Success", sha: "f8e21ab", deployedBy: "Priya", when: "2h ago", projectId: "shortfundly" },
  { id: "dpl_90", env: "staging", status: "Success", sha: "c91d34e", deployedBy: "Arjun", when: "5h ago", projectId: "shortfundly" },
  { id: "dpl_89", env: "production", status: "Failed", sha: "a3f92c8", deployedBy: "Ravi", when: "1d ago", projectId: "shortfundly" },
  { id: "dpl_88", env: "production", status: "Success", sha: "9d77ee2", deployedBy: "Sneha", when: "1d ago", projectId: "perceptronix" },
];

export type DoraSeed = { deploymentFreq: string; leadTime: string; failureRate: string; recoveryTime: string; tier: "Elite" | "High" | "Medium" | "Low" };
export const doraSeed: Record<string, DoraSeed> = {
  shortfundly: { deploymentFreq: "1.4/day", leadTime: "6h", failureRate: "8%", recoveryTime: "42m", tier: "Elite" },
  perceptronix: { deploymentFreq: "0.8/day", leadTime: "11h", failureRate: "12%", recoveryTime: "1.2h", tier: "High" },
  kds: { deploymentFreq: "0.3/day", leadTime: "1.8d", failureRate: "5%", recoveryTime: "3h", tier: "High" },
};

export const alertsSeed = [
  { id: 1, title: "PR #47 stale for 72h", severity: "high" as const, projectId: "shortfundly" },
  { id: 2, title: "Deploy dpl_89 failed on production", severity: "high" as const, projectId: "shortfundly" },
  { id: 3, title: "Drapora burn rate exceeds runway", severity: "medium" as const, projectId: "drapora" },
  { id: 4, title: "ShortFundly bus factor: auth owned by 1 dev", severity: "medium" as const, projectId: "shortfundly" },
];

export const aiBriefSeed = {
  headline: "ShortFundly is healthy this week, but auth bus factor is at risk.",
  bullets: [
    "47 commits, 12 PRs merged, 3 deploys (1 failed, recovered in 42m).",
    "Ravi owns 78% of the auth module — pair another dev for resilience.",
    "Burn rate is ₹82K/mo; current runway 2.3 months at ₹2.6L budget.",
    "DORA tier: Elite (deployment frequency up 18% week-over-week).",
  ],
};
