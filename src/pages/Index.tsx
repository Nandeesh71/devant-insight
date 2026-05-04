import { useEffect, useMemo, useState } from "react";
import { Link as RouterLink, Navigate, useLocation, useNavigate } from "react-router-dom";
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  Bell,
  CheckCircle2,
  ChevronDown,
  Database,
  DollarSign,
  ExternalLink,
  Clock3,
  Folder,
  GitBranch,
  Github,
  GitCommit,
  GitFork,
  GitPullRequest,
  Grid3x3,
  Info,
  LayoutDashboard,
  Link,
  Link2,
  List,
  Loader2,
  LogOut,
  Moon,
  MoreVertical,
  PieChart,
  PlusCircle,
  RefreshCw,
  Search,
  Settings,
  SlidersHorizontal,
  Sun,
  User,
  Users,
  Unplug,
  Star,
  Zap,
  Lock,
  X,
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { FolderCard, FolderSkeleton } from "@/components/ui/folder";
import { Skeleton } from "@/components/ui/skeleton";
import { DisconnectModal } from "@/components/ui/disconnect-modal";
import { LoadingSpinner, ErrorBanner } from "@/components/StatusBanners";
import { useAuth } from "@/context/AuthContext";
import { useProject } from "@/context/ProjectContext";
import { useDevantData, type Commit, type Project } from "@/hooks/useDevantData";
import { apiClient } from "@/lib/apiClient";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

/* ---------------- Types & helpers ---------------- */
type GithubRepo = {
  id?: number | string;
  name: string;
  full_name?: string;
  html_url?: string;
  private?: boolean;
  default_branch?: string;
  language?: string | null;
  updated_at?: string;
};

type UiCommit = {
  id: string;
  sha: string;
  message: string;
  author: string;
  date: string;
  tag: string;
  risk: string;
  size: string;
  summary: string;
  filesChanged?: number | string;
  linesAdded?: number | string;
  linesRemoved?: number | string;
  url?: string;
};

function valueFrom<T>(source: Record<string, unknown> | undefined, keys: string[], fallback: T): T {
  if (!source) return fallback;
  for (const key of keys) {
    const value = source[key];
    if (value !== undefined && value !== null && value !== "") return value as T;
  }
  return fallback;
}

function formatDate(value?: string) {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? value : d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function formatCurrency(value?: number) {
  if (value === undefined || value === null || Number.isNaN(value)) return "—";
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value);
}

function getRelativeTime(date: Date) {
  const diffInSeconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  return `${diffInDays}d ago`;
}

function formatMaybeCurrency(value?: number | null) {
  return value === undefined || value === null ? "—" : formatCurrency(value);
}

function getProjectRepoUrl(project: Project | null) {
  const repoName = String(project?.repo_full_name || project?.github_repo_full_name || project?.github_repo || project?.repository || "");
  if (!repoName) return null;
  if (repoName.startsWith("http")) return repoName;
  return `https://github.com/${repoName}`;
}

function getProjectCommitsUrl(project: Project | null) {
  const repoUrl = getProjectRepoUrl(project);
  return repoUrl ? `${repoUrl.replace(/\/$/, "")}/commits` : null;
}

function getRepoName(project: Project | null) {
  if (!project) return "—";
  return String(project.github_repo || project.repository || project.name || project.repo_full_name || "Untitled project");
}

function getRepoFullName(project: Project | null) {
  if (!project) return "—";
  return String(project.repo_full_name || project.github_repo_full_name || project.repository || project.name || "Untitled project");
}

function getOwnerRepo(project: Project | null): { owner: string; repo: string } {
  const full = getRepoFullName(project);
  if (full.includes("/")) {
    const [owner, ...rest] = full.split("/");
    return { owner, repo: rest.join("/") };
  }
  const owner = String(project?.owner || project?.github_owner || "owner");
  const repo = getRepoName(project);
  return { owner, repo };
}

function toUiCommit(commit: Commit): UiCommit {
  const raw = commit as Record<string, unknown>;
  const sha = valueFrom<string>(raw, ["sha", "commit_sha", "hash"], commit.id || "");
  return {
    id: String(valueFrom(raw, ["id", "sha"], sha || crypto.randomUUID())),
    sha: String(sha || "—").slice(0, 8),
    message: String(valueFrom(raw, ["message", "msg", "commit_message", "title"], "Untitled commit")),
    author: String(valueFrom(raw, ["author", "author_name", "committer", "user"], "Unknown")),
    date: formatDate(String(valueFrom(raw, ["date", "created_at", "committed_at", "timestamp"], ""))),
    tag: String(valueFrom(raw, ["ai_type_tag", "tag", "type"], "Commit")),
    risk: String(valueFrom(raw, ["ai_risk_flag", "risk", "risk_level"], "Low")),
    size: String(valueFrom(raw, ["diff_size", "size", "files_changed"], "—")),
    summary: String(valueFrom(raw, ["ai_summary", "summary", "description"], "No AI summary returned yet.")),
    filesChanged: valueFrom(raw, ["files_changed", "filesChanged"], undefined),
    linesAdded: valueFrom(raw, ["lines_added", "linesAdded", "additions"], undefined),
    linesRemoved: valueFrom(raw, ["lines_removed", "linesRemoved", "deletions"], undefined),
    url: valueFrom<string | undefined>(raw, ["html_url", "url"], undefined),
  };
}

function useTheme() {
  const [dark, setDark] = useState(() => document.documentElement.classList.contains("dark"));
  const toggle = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
  };
  return { dark, toggle };
}

/* ---------------- Shared UI ---------------- */
function Modal({ open, onClose, title, children, wide }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode; wide?: boolean }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-4" onClick={onClose}>
      <div className={cn("w-full rounded-lg border border-border bg-card shadow-lift", wide ? "max-w-2xl" : "max-w-md")} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <h3 className="font-semibold text-foreground">{title}</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X size={16} /></button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

function EmptyState({ title, description, actionLabel, onAction, icon: Icon = Github }: { title: string; description: string; actionLabel?: string; onAction?: () => void; icon?: typeof Github }) {
  return (
    <div className="mx-6 mt-8 rounded-lg border border-dashed border-border bg-card p-10 text-center shadow-card">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-accent text-brand"><Icon size={22} /></div>
      <h2 className="text-lg font-bold text-foreground">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">{description}</p>
      {actionLabel && onAction && (
        <button onClick={onAction} className="mt-5 inline-flex items-center gap-2 rounded-full bg-brand px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90">
          <Link2 size={14} /> {actionLabel}
        </button>
      )}
    </div>
  );
}

/* ---------------- Layout ---------------- */
function IconRail({ tab, setTab, alertsCount, onSettings, onSignOut }: { tab: string; setTab: (t: string) => void; alertsCount: number; onSettings: () => void; onSignOut: () => void }) {
  const items = [
    { id: "portfolio", icon: LayoutDashboard, label: "Portfolio" },
    { id: "commits", icon: GitFork, label: "Commits" },
    { id: "team", icon: User, label: "Team" },
  ];
  return (
    <TooltipProvider delayDuration={150}>
      <aside className="hidden w-14 shrink-0 flex-col items-center gap-2 bg-rail py-4 lg:fixed lg:inset-y-0 lg:left-0 lg:z-40 lg:flex lg:h-dvh">
        <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg">
          <img src="/devant-logo.svg" alt="DevANT" className="h-full w-full text-[#1e293b]" />
        </div>
        {items.map((item) => {
          const active = tab === item.id;
          return (
            <Tooltip key={item.id}>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  aria-label={item.label}
                  onClick={() => setTab(item.id)}
                  className={cn(
                    "relative flex h-11 w-11 cursor-pointer items-center justify-center rounded-lg text-[hsl(var(--sidebar-icon))] transition-all duration-150 ease-out",
                    active
                      ? "bg-brand/10 text-white ring-1 ring-brand/30 shadow-sm"
                      : "hover:bg-primary/10 hover:text-white hover:shadow-sm"
                  )}
                >
                  <item.icon size={18} strokeWidth={1.5} />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" className="border-border bg-card text-foreground">{item.label}</TooltipContent>
            </Tooltip>
          );
        })}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              aria-label="Alerts"
              onClick={() => setTab("alerts")}
              className="relative flex h-11 w-11 items-center justify-center rounded-lg text-[hsl(var(--sidebar-icon))] transition-all duration-150 ease-out hover:bg-primary/10 hover:text-white"
            >
              <Bell size={18} strokeWidth={1.5} />
              {alertsCount > 0 && <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-destructive" />}
            </button>
          </TooltipTrigger>
          <TooltipContent side="right" className="border-border bg-card text-foreground">Alerts</TooltipContent>
        </Tooltip>
        <div className="mt-auto flex flex-col gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <button type="button" aria-label="Settings" onClick={onSettings} className="flex h-11 w-11 items-center justify-center rounded-lg text-[hsl(var(--sidebar-icon))] transition-all duration-150 ease-out hover:bg-primary/10 hover:text-white"><Settings size={18} strokeWidth={1.5} /></button>
            </TooltipTrigger>
            <TooltipContent side="right" className="border-border bg-card text-foreground">Settings</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <button type="button" aria-label="Logout" onClick={onSignOut} className="flex h-11 w-11 items-center justify-center rounded-lg text-[hsl(var(--sidebar-icon))] transition-all duration-150 ease-out hover:bg-primary/10 hover:text-white"><LogOut size={18} strokeWidth={1.5} /></button>
            </TooltipTrigger>
            <TooltipContent side="right" className="border-border bg-card text-foreground">Logout</TooltipContent>
          </Tooltip>
        </div>
      </aside>
    </TooltipProvider>
  );
}

function MiddleSidebar({ projects, activeId, onSelect }: { projects: Project[]; activeId: string | null; onSelect: (project: Project) => void }) {
  const location = useLocation();
  const [query, setQuery] = useState("");
  const filtered = projects.filter((p) => getRepoFullName(p).toLowerCase().includes(query.toLowerCase()));

  const isRepoActive = (repoFullName: string) => {
    const [owner, ...repoParts] = repoFullName.split("/");
    const repo = repoParts.join("/");
    return owner && repo && location.pathname === `/${owner}/${repo}`;
  };
  return (
    <aside className="hidden w-64 shrink-0 flex-col bg-sidebar-bg text-primary-foreground lg:fixed lg:inset-y-0 lg:left-14 lg:z-30 lg:flex lg:h-dvh">
      <div className="flex items-center gap-2 px-4 pb-3 pt-4">
        <h2 className="flex-1 text-[15px] font-semibold">Projects</h2>
      </div>
      <div className="px-3 pb-3">
        <div className="flex items-center gap-2 rounded-lg bg-sidebar-search px-3 py-2">
          <Search size={14} strokeWidth={1.5} className="text-sidebar-text" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search linked repos..." className="min-w-0 flex-1 bg-transparent text-[13px] outline-none placeholder:text-sidebar-label" />
        </div>
      </div>
      <div className="px-3">
        <button type="button" className={cn("flex w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition-all duration-150 ease-out", location.pathname === "/" ? "bg-brand text-primary-foreground shadow-brand hover:bg-brand/90 hover:shadow-lg" : "text-sidebar-text hover:bg-primary/10 hover:text-primary-foreground")}>
          <PieChart size={14} strokeWidth={1.5} /><span className="flex-1 text-left">Overview</span>
        </button>
      </div>
      <div className="mb-1 mt-5 flex items-center justify-between px-5">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-sidebar-label">Linked repositories</span>
      </div>
      <div className="scrollbar-hide flex-1 overflow-y-auto px-3">
        {filtered.length === 0 && (
          <div className="rounded-lg border border-sidebar-tree p-3 text-xs text-sidebar-text">No linked repositories yet.</div>
        )}
        {filtered.map((p) => {
          const active = activeId === p.id || isRepoActive(getRepoFullName(p));
          const repo = getRepoFullName(p);
          return (
            <button key={p.id} type="button" onClick={() => onSelect(p)} className={cn("mb-1 flex w-full items-center gap-2 rounded-md px-2 py-2 text-[13px] transition-all duration-150 ease-out", active ? "bg-primary/15 text-primary-foreground" : "text-sidebar-text hover:bg-primary/10 hover:text-primary-foreground")}>
              <Folder size={14} strokeWidth={1.5} className="shrink-0" />
              <span className="min-w-0 flex-1 truncate text-left">{repo}</span>
            </button>
          );
        })}
      </div>
      <div className="mt-auto border-t border-white/10 px-4 py-3">
        <div className="flex items-center justify-between gap-3 text-[11px] text-sidebar-label">
          <RouterLink to="/Terms-of-Service" className="transition-colors hover:text-primary-foreground hover:underline">Terms of Service</RouterLink>
          <span>•</span>
          <RouterLink to="/Privacy-Policy" className="transition-colors hover:text-primary-foreground hover:underline">Privacy Policy</RouterLink>
        </div>
      </div>
    </aside>
  );
}

function TopBar({ dark, toggle, project, onBell, onSettings, onSignOut }: { dark: boolean; toggle: () => void; project: Project | null; onBell: () => void; onSettings: () => void; onSignOut: () => void }) {
  const { user } = useAuth();
  return (
    <TooltipProvider delayDuration={150}>
      <div className="flex flex-wrap items-center gap-3 border-b border-border px-4 py-3 sm:px-6">
      <div className="ml-auto flex flex-wrap items-center gap-1.5 sm:gap-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <button type="button" aria-label={dark ? "Switch to light theme" : "Switch to dark theme"} onClick={toggle} className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors duration-150 ease-out hover:bg-muted">
              {dark ? <Moon size={18} strokeWidth={1.5} /> : <Sun size={18} strokeWidth={1.5} />}
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="border-border bg-card text-foreground">{dark ? "Light theme" : "Dark theme"}</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <button type="button" aria-label="Alerts" onClick={onBell} className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors duration-150 ease-out hover:bg-muted"><Bell size={18} strokeWidth={1.5} /></button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="border-border bg-card text-foreground">Alerts</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <button type="button" aria-label="Settings" onClick={onSettings} className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors duration-150 ease-out hover:bg-muted"><Settings size={18} strokeWidth={1.5} /></button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="border-border bg-card text-foreground">Settings</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <button type="button" aria-label="Logout" onClick={onSignOut} className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors duration-150 ease-out hover:bg-muted"><LogOut size={18} strokeWidth={1.5} /></button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="border-border bg-card text-foreground">Logout</TooltipContent>
        </Tooltip>
        <Avatar className="h-9 w-9 border border-border/60">
          <AvatarImage src={user?.avatar_url || ""} alt="User avatar" />
          <AvatarFallback className="bg-accent text-xs font-bold text-brand">{(user?.name || user?.email || "U").slice(0, 1).toUpperCase()}</AvatarFallback>
        </Avatar>
      </div>
      </div>
    </TooltipProvider>
  );
}

/* ---------------- Dashboard sections ---------------- */
type WorkspaceStats = {
  totalProjects: number | null;
  totalCommits: number | null;
  activeRepos: number | null;
  totalContributors: number | null;
  openPullRequests: number | null;
  totalStars: number | null;
};

function WorkspaceAnalyticsCards({ loading, stats }: { loading: boolean; stats: WorkspaceStats }) {
  const cards = [
    { key: 'projects', icon: Folder, label: 'Total Projects', value: stats.totalProjects, subLabel: '' },
    { key: 'commits', icon: GitCommit, label: 'Total Commits', value: stats.totalCommits, subLabel: '' },
    { key: 'active', icon: Activity, label: 'Active Repos', value: stats.activeRepos, subLabel: 'last 30 days' },
    { key: 'contributors', icon: Users, label: 'Contributors', value: stats.totalContributors, subLabel: '' },
    { key: 'prs', icon: GitPullRequest, label: 'Open Pull Requests', value: stats.openPullRequests, subLabel: '' },
    { key: 'stars', icon: Star, label: 'Total Stars', value: stats.totalStars, subLabel: '' },
  ] as const;

  return (
    <div className="grid grid-cols-1 gap-4 p-6 sm:grid-cols-2 lg:grid-cols-3">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div key={card.key} className="rounded-lg border border-border/50 bg-card p-4 shadow-card transition-all duration-200 hover:shadow-lift">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Icon size={14} strokeWidth={1.5} /> {card.label}
            </div>
            <div className="mt-4">
              {loading ? (
                <>
                  <Skeleton className="h-8 w-20" />
                  <Skeleton className="mt-2 h-3 w-28" />
                </>
              ) : (
                <>
                  <div className="text-3xl font-bold text-foreground">{card.value ?? '—'}</div>
                  <div className="mt-1 text-xs text-muted-foreground">{card.subLabel || card.label}</div>
                </>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ActiveProjects({ projects, activeId, onSelect, sort, setSort, loading, onRequestDisconnect }: { projects: Project[]; activeId: string | null; onSelect: (project: Project) => void; sort: string; setSort: (s: string) => void; loading: boolean; onRequestDisconnect: (project: Project) => void }) {
  const [open, setOpen] = useState(false);
  const [cardDataByProjectId, setCardDataByProjectId] = useState<Record<string, {
    repoName: string;
    repoFullPath: string;
    isPrivate: boolean | null;
    starCount: number | null;
    lastCommitMessage: string;
    lastCommitBranch: string;
    lastCommitTime: string | null;
    topContributors: Array<{ login: string; avatarUrl: string }>;
  }>>({});

  useEffect(() => {
    let cancelled = false;

    async function loadCardData() {
      const entries = await Promise.all(projects.map(async (p) => {
        const full = getRepoFullName(p);
        const [owner, repo] = String(full || '').split('/');
        if (!owner || !repo) {
          return [p.id, {
            repoName: getRepoName(p) || '—',
            repoFullPath: full || '—',
            isPrivate: null,
            starCount: null,
            lastCommitMessage: '—',
            lastCommitBranch: 'main',
            lastCommitTime: null,
            topContributors: [],
          }] as const;
        }

        try {
          const card = await apiClient.get<{
            repoName?: string;
            repoFullPath?: string;
            isPrivate?: boolean | null;
            starCount?: number | null;
            lastCommitMessage?: string;
            lastCommitBranch?: string;
            lastCommitTime?: string | null;
            topContributors?: Array<{ login?: string; avatarUrl?: string }>;
          }>(`/api/github/repo-card/${owner}/${repo}`);

          return [p.id, {
            repoName: card?.repoName || repo,
            repoFullPath: card?.repoFullPath || full,
            isPrivate: typeof card?.isPrivate === 'boolean' ? card.isPrivate : null,
            starCount: typeof card?.starCount === 'number' ? card.starCount : null,
            lastCommitMessage: card?.lastCommitMessage || '—',
            lastCommitBranch: card?.lastCommitBranch || 'main',
            lastCommitTime: card?.lastCommitTime || null,
            topContributors: Array.isArray(card?.topContributors)
              ? card.topContributors
                .filter((c) => c && c.login && c.avatarUrl)
                .map((c) => ({ login: String(c.login), avatarUrl: String(c.avatarUrl) }))
              : [],
          }] as const;
        } catch {
          return [p.id, {
            repoName: getRepoName(p) || repo,
            repoFullPath: full || `${owner}/${repo}`,
            isPrivate: null,
            starCount: null,
            lastCommitMessage: '—',
            lastCommitBranch: 'main',
            lastCommitTime: null,
            topContributors: [],
          }] as const;
        }
      }));

      if (cancelled) return;
      setCardDataByProjectId(Object.fromEntries(entries));
    }

    void loadCardData();
    return () => { cancelled = true; };
  }, [projects]);

  const sorted = useMemo(() => {
    const copy = [...projects];
    if (sort === "Name") copy.sort((a, b) => getRepoName(a).localeCompare(getRepoName(b)));
    return copy;
  }, [projects, sort]);
  return (
    <section className="px-6 pt-6">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-[16px] font-semibold text-foreground">Linked Projects</h3>
        <div className="relative">
          <button type="button" onClick={() => setOpen(!open)} className="flex cursor-pointer items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-sm text-muted-foreground transition-all duration-150 ease-out hover:bg-muted hover:text-foreground">
            <SlidersHorizontal size={13} /> {sort} <ChevronDown size={13} />
          </button>
          {open && (
            <div className="absolute right-0 z-30 mt-1 w-36 rounded-lg border border-border bg-card py-1 shadow-lift">
              {['Newest', 'Name'].map((s) => <button key={s} onClick={() => { setSort(s); setOpen(false); }} className="w-full cursor-pointer px-3 py-1.5 text-left text-xs transition-colors hover:bg-muted">{s}</button>)}
            </div>
          )}
        </div>
      </div>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] items-stretch gap-4 pb-2">
        {loading && projects.length === 0 ? (
          [1, 2, 3].map((i) => <FolderSkeleton key={i} />)
        ) : (
          sorted.map((p) => {
            const active = p.id === activeId;
            const repo = getRepoName(p);
            const repoFull = getRepoFullName(p);
            const repoUrl = getProjectRepoUrl(p);
            const commitsUrl = getProjectCommitsUrl(p);
            const cardData = cardDataByProjectId[p.id];
            
            // Map the unknown fields carefully
            const raw = p as Record<string, unknown>;
            const commitsCount = typeof raw.commits_count === "number" ? raw.commits_count : 0;
            const healthScore = typeof raw.health_score === "number" ? raw.health_score : undefined;
            const budgetNum = typeof raw.budget === "number" ? raw.budget : undefined;
            const budgetStr = budgetNum ? `₹${Math.round(budgetNum).toLocaleString('en-IN')}` : undefined;
            const riskLevel = typeof raw.risk_level === "string" ? raw.risk_level : undefined;

            const lastCommitRelative = cardData?.lastCommitTime
              ? (() => {
                  const dt = new Date(cardData.lastCommitTime as string);
                  return Number.isNaN(dt.getTime()) ? '—' : getRelativeTime(dt);
                })()
              : '—';

            return (
              <FolderCard
                key={p.id}
                id={p.id}
                title={repo}
                fullName={repoFull}
                repoName={cardData?.repoName || repo.split('/').pop() || repo}
                repoFullPath={cardData?.repoFullPath || repoFull}
                isPrivate={cardData?.isPrivate ?? null}
                starCount={cardData?.starCount ?? null}
                lastCommitMessage={cardData?.lastCommitMessage || '—'}
                lastCommitTime={lastCommitRelative}
                lastCommitBranch={cardData?.lastCommitBranch || 'main'}
                topContributors={cardData?.topContributors || []}
                commits={commitsCount}
                healthScore={healthScore}
                budget={budgetStr}
                riskLevel={riskLevel}
                repoUrl={repoUrl}
                commitsUrl={commitsUrl}
                isActive={active}
                onSelect={() => onSelect(p)}
                onDisconnect={() => onRequestDisconnect(p)}
              />
            );
          })
        )}
      </div>
    </section>
  );
}

function tagClass(tag: string) {
  const t = tag.toLowerCase();
  if (t.includes("bug") || t.includes("fix")) return "bg-destructive/10 text-destructive";
  if (t.includes("feat")) return "bg-accent text-brand";
  if (t.includes("refactor")) return "bg-secondary text-secondary-foreground";
  return "bg-muted text-muted-foreground";
}

function riskClass(risk: string) {
  const r = risk.toLowerCase();
  if (r.includes("high") || r.includes("critical")) return "bg-destructive/10 text-destructive";
  if (r.includes("medium")) return "bg-accent text-brand";
  return "bg-muted text-muted-foreground";
}

function CommitsTable({ tab, setTab, commits, team, search, setSearch, selectedId, setSelectedId, onOpen, loading, viewMode, setViewMode }: { tab: string; setTab: (t: string) => void; commits: UiCommit[]; team: ReturnType<typeof useDevantData>["team"]; search: string; setSearch: (s: string) => void; selectedId: string; setSelectedId: (id: string) => void; onOpen: (c: UiCommit) => void; loading: boolean; viewMode: "grid" | "list"; setViewMode: (mode: "grid" | "list") => void }) {
  const filtered = commits.filter((c) => !search || c.message.toLowerCase().includes(search.toLowerCase()) || c.author.toLowerCase().includes(search.toLowerCase()) || c.sha.includes(search));
  const tabs = [
    { id: "commits", label: "Recent Commits", icon: GitCommit },
    { id: "team", label: "Team", icon: Users },
    { id: "alerts", label: "Alerts", icon: Bell },
  ];
  return (
    <section className="px-6 pb-24 pt-6">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 border-b border-border/70">
          {tabs.map((t) => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={cn(
                  "relative flex items-center gap-1.5 px-3 py-2 text-sm font-semibold transition-colors duration-150 ease-out",
                  active ? "text-foreground after:absolute after:inset-x-2 after:-bottom-px after:h-0.5 after:rounded-full after:bg-brand" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon size={16} strokeWidth={1.5} /> {t.label}
              </button>
            );
          })}
        </div>
          <div className="flex min-w-0 flex-wrap items-center gap-2">
          <div className="flex w-full items-center gap-2 rounded-lg border border-border/50 bg-card px-3 py-2 focus-within:border-brand sm:w-64">
            <Search size={14} strokeWidth={1.5} className="text-muted-foreground" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search commits..." className="min-w-0 flex-1 bg-transparent text-sm outline-none" />
          </div>
          <button type="button" aria-label="Grid view" onClick={() => setViewMode("grid")} className={cn("flex h-10 w-10 cursor-pointer items-center justify-center rounded-md transition-all duration-150 ease-out", viewMode === "grid" ? "bg-brand/10 text-foreground ring-1 ring-brand/20" : "text-muted-foreground hover:bg-muted hover:text-foreground")}><Grid3x3 size={16} strokeWidth={1.5} /></button>
          <button type="button" aria-label="List view" onClick={() => setViewMode("list")} className={cn("flex h-10 w-10 cursor-pointer items-center justify-center rounded-md transition-all duration-150 ease-out", viewMode === "list" ? "bg-brand/10 text-foreground ring-1 ring-brand/20" : "text-muted-foreground hover:bg-muted hover:text-foreground")}><List size={16} strokeWidth={1.5} /></button>
        </div>
      </div>
      <div className="overflow-x-auto rounded-lg border border-border/50 bg-card">
        {tab === "team" ? (
          <table className="min-w-[640px] w-full text-sm">
            <thead><tr className="border-b border-border/50 text-left text-[11px] uppercase tracking-wider text-muted-foreground"><th className="px-4 py-3">Member</th><th>Role</th><th>Status</th><th>Last commit</th></tr></thead>
            <tbody>
              {loading && team.length === 0 ? (
                [1, 2, 3].map(i => <tr key={i} className="border-b border-border/50 last:border-0"><td className="px-4 py-3"><Skeleton className="h-4 w-24" /></td><td><Skeleton className="h-4 w-20" /></td><td><Skeleton className="h-4 w-16" /></td><td><Skeleton className="h-4 w-24" /></td></tr>)
              ) : team.length === 0 ? (
                <tr><td colSpan={4} className="py-8 text-center text-sm text-muted-foreground">No team data returned yet</td></tr>
              ) : (
                team.map((m) => <tr key={m.id} className="border-b border-border/50 transition-colors hover:bg-row-hover last:border-0"><td className="px-4 py-3 font-semibold text-foreground">{m.name}</td><td className="text-muted-foreground">{m.role}</td><td>{m.status}</td><td className="text-muted-foreground">{m.last_commit || "—"}</td></tr>)
              )}
            </tbody>
          </table>
        ) : tab === "alerts" ? (
          <div className="flex flex-col items-center justify-center gap-3 p-8 text-center text-sm text-muted-foreground">
            <Bell size={32} strokeWidth={1.5} className="text-muted-foreground/60" />
            <div className="font-semibold text-foreground">No alerts returned for this project yet</div>
            <div className="max-w-sm">Alerts will appear here when GitHub activity or project issues need attention.</div>
          </div>
        ) : (
          <table className="min-w-[960px] w-full text-sm">
            <thead>
              <tr className="border-b border-border/50 text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                <th className="w-10 px-4 py-3" /><th className="py-3">Commit Message</th><th className="py-3">Author</th><th className="py-3">Date</th><th className="py-3">AI Tag</th><th className="py-3">Risk</th><th className="py-3">Diff</th><th className="w-10" />
              </tr>
            </thead>
            <tbody>
              {loading && filtered.length === 0 ? (
                [1, 2, 3, 4, 5].map(i => (
                  <tr key={i} className="border-b border-border/50 last:border-0">
                    <td className="px-4 py-3"><Skeleton className="h-4 w-4 rounded" /></td>
                    <td className="py-3"><div className="flex items-center gap-3"><Skeleton className="h-8 w-8 rounded-lg" /><div><Skeleton className="mb-1 h-4 w-48" /><Skeleton className="h-3 w-20" /></div></div></td>
                    <td className="py-3"><Skeleton className="h-4 w-24" /></td>
                    <td className="py-3"><Skeleton className="h-4 w-20" /></td>
                    <td className="py-3"><Skeleton className="h-5 w-16 rounded-full" /></td>
                    <td className="py-3"><Skeleton className="h-5 w-16 rounded-full" /></td>
                    <td className="py-3"><Skeleton className="h-4 w-12" /></td>
                    <td className="py-3 pr-4"><Skeleton className="h-4 w-4" /></td>
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-sm text-muted-foreground">
                    <div className="flex flex-col items-center gap-3">
                      <GitCommit size={32} strokeWidth={1.5} className="text-muted-foreground/60" />
                      <div className="font-semibold text-foreground">No commits returned for this project yet</div>
                      <div className="max-w-sm">Push your first commit to see activity here.</div>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((c) => {
                  const selected = c.id === selectedId;
                  return (
                    <tr key={c.id} onClick={() => setSelectedId(c.id)} onDoubleClick={() => onOpen(c)} className={cn("cursor-pointer border-b border-border/50 transition-all duration-200 last:border-0", selected ? "bg-row-selected shadow-sm" : "hover:bg-row-hover")}>
                      <td className="px-4 py-3"><div className={cn("flex h-4 w-4 items-center justify-center rounded border transition-colors", selected ? "border-brand bg-brand text-primary-foreground" : "border-border/80 bg-card")}>{selected && <CheckCircle2 size={12} />}</div></td>
                      <td className="py-3"><div className="flex items-center gap-3"><div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-brand"><GitCommit size={15} /></div><div><div className="text-[13px] font-semibold text-foreground">{c.message}</div><div className="font-mono text-[11px] text-muted-foreground">Commit #{c.sha}</div></div></div></td>
                      <td className="py-3 text-[13px] text-foreground">{c.author}</td>
                      <td className="py-3 text-[13px] text-muted-foreground">{c.date}</td>
                      <td className="py-3"><span className={cn("rounded-full px-2 py-1 text-[11px] font-semibold", tagClass(c.tag))}>{c.tag}</span></td>
                      <td className="py-3"><span className={cn("rounded-full px-2 py-1 text-[11px] font-semibold", riskClass(c.risk))}>{c.risk}</span></td>
                      <td className="py-3 text-[13px] text-foreground">{c.size}</td>
                      <td className="py-3 pr-4 text-muted-foreground"><MoreVertical size={16} /></td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}

function CommitDrawer({ commit, onClose }: { commit: UiCommit | null; onClose: () => void }) {
  if (!commit) return null;
  return (
    <div className="fixed inset-0 z-50 flex justify-end" onClick={onClose}>
      <div className="absolute inset-0 bg-foreground/40" />
      <div className="relative h-full w-full max-w-full overflow-y-auto border-l border-border bg-card sm:w-[480px]" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div><div className="font-mono text-xs text-muted-foreground">#{commit.sha}</div><h3 className="mt-0.5 font-semibold text-foreground">{commit.message}</h3></div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X size={16} /></button>
        </div>
        <div className="space-y-4 p-5">
          <div className="flex flex-wrap gap-2"><span className={cn("rounded-full px-2 py-1 text-[11px] font-semibold", tagClass(commit.tag))}>{commit.tag}</span><span className={cn("rounded-full px-2 py-1 text-[11px] font-semibold", riskClass(commit.risk))}>{commit.risk} Risk</span><span className="rounded-full bg-muted px-2 py-1 text-[11px] font-semibold text-muted-foreground">{commit.size}</span></div>
          <div className="rounded-lg border border-border bg-accent/40 p-3"><div className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-brand"><Activity size={12} /> AI Summary</div><p className="text-[13px] leading-relaxed text-foreground">{commit.summary}</p></div>
          <div className="grid grid-cols-3 gap-2 text-center"><div className="rounded-lg border border-border p-2"><div className="text-xs text-muted-foreground">Files</div><div className="font-bold text-foreground">{commit.filesChanged ?? "—"}</div></div><div className="rounded-lg border border-border p-2"><div className="text-xs text-muted-foreground">Added</div><div className="font-bold text-foreground">{commit.linesAdded ?? "—"}</div></div><div className="rounded-lg border border-border p-2"><div className="text-xs text-muted-foreground">Removed</div><div className="font-bold text-foreground">{commit.linesRemoved ?? "—"}</div></div></div>
          {commit.url && <a href={commit.url} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-1.5 text-sm text-brand hover:underline"><ExternalLink size={13} /> View on GitHub</a>}
        </div>
      </div>
    </div>
  );
}

function BottomBar({ commit }: { commit: UiCommit }) {
  return (
    <div className="sticky bottom-0 z-20 mt-6 flex flex-wrap items-center gap-3 border-t border-border bg-card/95 px-4 py-3 backdrop-blur sm:px-6">
      <GitCommit size={16} className="text-brand" />
      <span className="min-w-0 flex-1 text-[13px] text-foreground">{commit.message} · {commit.size} diff · {commit.date}</span>
      <span className={cn("rounded-full px-3 py-1 text-[11px] font-semibold", riskClass(commit.risk))}>{commit.risk} Risk</span>
    </div>
  );
}

/* ---------------- Repo linking ---------------- */
function LinkRepoModal({ open, onClose, onLinked }: { open: boolean; onClose: () => void; onLinked: () => void }) {
  const { user, connectGithub } = useAuth();
  const [repos, setRepos] = useState<GithubRepo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [linking, setLinking] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [accountDropdownOpen, setAccountDropdownOpen] = useState(false);

  useEffect(() => {
    if (!open || !user?.github_connected) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    apiClient.get<GithubRepo[]>("/api/github/repos")
      .then((data) => { if (!cancelled) setRepos(Array.isArray(data) ? data : []); })
      .catch((e) => { if (!cancelled) setError((e as Error).message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [open, user?.github_connected]);

  async function linkRepo(repo: GithubRepo) {
    const fullName = repo.full_name || repo.name;
    setLinking(fullName);
    try {
      const result = await apiClient.post<{ success: boolean; project?: { id?: string } }>("/api/github/link-repo", { repo: fullName, repo_full_name: fullName, github_repo_id: repo.id });
      if (result?.project?.id) {
        await apiClient.post(`/api/github/sync/${result.project.id}`).catch(() => null);
      }
      toast({ title: "Repository linked", description: fullName });
      onLinked();
      onClose();
    } catch (e) {
      toast({ title: "Link failed", description: (e as Error).message, variant: "destructive" });
    } finally {
      setLinking(null);
    }
  }

  if (!open) return null;

  const filteredRepos = repos.filter(r => (r.full_name || r.name).toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-[2px]" onClick={onClose}>
      <div className="flex max-h-[85vh] w-full max-w-md flex-col overflow-hidden rounded-xl border border-border bg-card shadow-card" onClick={(e) => e.stopPropagation()}>
        
        {/* Header Section */}
        <div className="border-b border-border p-8 pb-6">
          <div className="mb-8 flex items-center justify-between">
            <h2 className="text-[28px] font-bold tracking-tight text-foreground">Import Git Repository</h2>
            <button onClick={onClose} className="text-muted-foreground transition-colors hover:text-foreground"><X size={24} /></button>
          </div>

          {!user?.github_connected ? (
             <div className="py-10 text-left">
               <Github className="mx-auto mb-4 text-brand" size={32} />
               <p className="mb-6 text-lg text-muted-foreground">Connect GitHub to import your repositories.</p>
               <button onClick={connectGithub} className="inline-flex items-center gap-2 rounded-full bg-brand px-6 py-3 font-semibold text-primary-foreground transition-colors hover:bg-brand/90"><Github size={18} /> Connect GitHub</button>
             </div>
          ) : (
            <div className="relative z-10 flex flex-col gap-4">
              {/* Account Dropdown */}
              <div className="relative w-full">
                <button 
                  onClick={() => setAccountDropdownOpen(!accountDropdownOpen)}
                  className="flex w-full items-center justify-between rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground transition-colors hover:bg-muted"
                >
                  <div className="flex items-center gap-3 font-medium">
                    <Github size={16} />
                    <span>{user.github_login || user.name || "GitHub Account"}</span>
                  </div>
                  <ChevronDown size={16} className={cn("text-muted-foreground transition-transform", accountDropdownOpen && "rotate-180")} />
                </button>

                {accountDropdownOpen && (
                  <div className="absolute left-0 top-full mt-2 w-full overflow-hidden rounded-lg border border-border bg-card shadow-card">
                    <div className="flex items-center justify-between bg-muted px-4 py-3">
                      <div className="flex items-center gap-3 text-sm font-medium text-foreground">
                        <Github size={16} />
                        {user.github_login || user.name || "GitHub Account"}
                      </div>
                      <CheckCircle2 size={16} className="text-foreground" />
                    </div>
                    <div className="border-t border-border">
                      <button onClick={connectGithub} className="flex w-full items-center gap-3 px-4 py-3 text-sm text-foreground transition-colors hover:bg-muted">
                        <PlusCircle size={16} className="text-muted-foreground" />
                        Add GitHub Account
                      </button>
                      <button className="flex w-full items-center gap-3 px-4 py-3 text-sm text-foreground transition-colors hover:bg-muted">
                        <List size={16} className="text-muted-foreground" />
                        Switch Git Provider
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Search Bar */}
              <div className="relative flex-1">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search..." 
                  className="w-full rounded-lg border border-border bg-background py-2.5 pl-11 pr-4 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-brand focus:ring-2 focus:ring-brand/30"
                />
              </div>
            </div>
          )}
        </div>

        {/* Repository List */}
        {user?.github_connected && (
          <div className="flex-1 overflow-y-auto bg-card pb-4">
            {loading && <div className="flex items-center justify-center gap-3 py-16 text-muted-foreground"><Loader2 className="animate-spin" size={20} /> Loading repositories...</div>}
            {error && <div className="p-8"><ErrorBanner error={error} /></div>}
            
            {!loading && !error && repos.length === 0 && (
              <div className="py-16 text-center text-muted-foreground">No repositories found.</div>
            )}

            {!loading && !error && repos.length > 0 && filteredRepos.length === 0 && (
              <div className="py-16 text-center text-muted-foreground">No repositories match your search.</div>
            )}

            {!loading && !error && filteredRepos.map((repo) => {
              const fullName = repo.full_name || repo.name;
              // Attempt to parse just the repo name if it has owner/repo format
              const displayName = fullName.split("/").pop() || fullName;
              const isPrivate = repo.private;
              const timeAgo = repo.updated_at ? getRelativeTime(new Date(repo.updated_at)) : "Unknown time";

              return (
                <div key={String(repo.id || fullName)} className="group flex items-center justify-between border-b border-border/50 px-8 py-5 transition-colors hover:bg-muted/50">
                  <div className="flex min-w-0 items-center gap-4">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-brand text-primary-foreground shadow-sm">
                       <Zap size={16} className="fill-current text-yellow-300" />
                    </div>
                    <div className="flex min-w-0 flex-col">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-[15px] font-semibold text-foreground">{displayName}</span>
                        {isPrivate && <Lock size={13} className="shrink-0 text-muted-foreground" />}
                        <span className="flex shrink-0 items-center gap-1.5 text-[13px] text-muted-foreground">
                          <span className="text-[10px] opacity-50">•</span>
                          {timeAgo}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => linkRepo(repo)} 
                    disabled={!!linking}
                    className="ml-4 shrink-0 rounded-md bg-brand px-4 py-1.5 text-[13px] font-semibold text-primary-foreground shadow-sm transition-opacity hover:bg-brand/90 disabled:opacity-50"
                  >
                    {linking === fullName ? "Importing..." : "Import"}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function SettingsModal({ open, onClose, onSignOut }: { open: boolean; onClose: () => void; onSignOut: () => void }) {
  const { user, connectGithub, refresh } = useAuth();
  return (
    <Modal open={open} onClose={onClose} title="Account Settings">
      <div className="space-y-4">
        <div className="rounded-lg border border-border p-3">
          <div className="text-xs text-muted-foreground">Signed in as</div>
          <div className="mt-1 font-semibold text-foreground">{user?.name || user?.email || "Unknown user"}</div>
          <div className="text-xs text-muted-foreground">{user?.email}</div>
        </div>
        <div className="rounded-lg border border-border p-3">
          <div className="mb-2 flex items-center justify-between">
            <div><div className="font-semibold text-foreground">GitHub</div><div className="text-xs text-muted-foreground">{user?.github_connected ? `Connected${user.github_login ? ` as ${user.github_login}` : ""}` : "Not connected"}</div></div>
            <span className={cn("rounded-full px-2 py-1 text-xs font-semibold", user?.github_connected ? "bg-accent text-brand" : "bg-muted text-muted-foreground")}>{user?.github_connected ? "Connected" : "Required"}</span>
          </div>
          <button onClick={connectGithub} className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-muted"><Github size={13} /> {user?.github_connected ? "Reconnect GitHub" : "Connect GitHub"}</button>
        </div>
        <div className="flex justify-between gap-2 border-t border-border pt-3">
          <button onClick={() => refresh()} className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-semibold text-muted-foreground hover:bg-muted"><RefreshCw size={14} /> Refresh session</button>
          <button onClick={onSignOut} className="inline-flex items-center gap-2 rounded-full bg-destructive px-4 py-2 text-sm font-semibold text-destructive-foreground"><LogOut size={14} /> Logout</button>
        </div>
      </div>
    </Modal>
  );
}

/* ---------------- Page ---------------- */
export default function Index() {
  const navigate = useNavigate();
  const { dark, toggle } = useTheme();
  const { user, token, loading: authLoading, signOut } = useAuth();
  const { projectId, setProjectId } = useProject();
  const data = useDevantData();
  const { loading, error, refetch, projects } = data;
  const [tab, setTab] = useState("portfolio");
  const [sort, setSort] = useState("Newest");
  const [showLink, setShowLink] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [disconnectTarget, setDisconnectTarget] = useState<Project | null>(null);
  const [workspaceStats, setWorkspaceStats] = useState<WorkspaceStats>({
    totalProjects: 0,
    totalCommits: 0,
    activeRepos: 0,
    totalContributors: 0,
    openPullRequests: 0,
    totalStars: 0,
  });
  const [workspaceStatsLoading, setWorkspaceStatsLoading] = useState(false);

  const activeProject = projects.find((p) => p.id === projectId) || null;

  useEffect(() => {
    let cancelled = false;

    async function loadWorkspaceStats() {
      if (!projects.length) {
        if (!cancelled) {
          setWorkspaceStats({ totalProjects: 0, totalCommits: 0, activeRepos: 0, totalContributors: 0, openPullRequests: 0, totalStars: 0 });
        }
        return;
      }

      setWorkspaceStatsLoading(true);
      try {
        const now = Date.now();
        const contributorSet = new Set<string>();

        let totalCommits = 0;
        let activeRepos = 0;
        let openPullRequests = 0;
        let totalStars = 0;

        await Promise.all(projects.map(async (p) => {
          const full = getRepoFullName(p);
          const [owner, repo] = String(full || '').split('/');
          if (!owner || !repo) return;

          const [summary, repoCard, teamData] = await Promise.all([
            apiClient.get<Record<string, unknown>>(`/api/projects/${owner}/${repo}/summary`).catch(() => null),
            apiClient.get<Record<string, unknown>>(`/api/github/repo-card/${owner}/${repo}`).catch(() => null),
            apiClient.get<Record<string, unknown>>(`/api/team/${p.id}`).catch(() => null),
          ]);

          const commitsTotal = Number((summary?.commits as Record<string, unknown> | undefined)?.total ?? 0) || 0;
          const openPr = Number((summary?.pull_requests as Record<string, unknown> | undefined)?.open ?? 0) || 0;
          const stars = Number(repoCard?.starCount ?? 0) || 0;
          const lastActivityRaw = (summary?.last_activity as string | null | undefined) || (repoCard?.lastCommitTime as string | null | undefined) || null;

          totalCommits += commitsTotal;
          openPullRequests += openPr;
          totalStars += stars;

          if (lastActivityRaw) {
            const ts = new Date(lastActivityRaw).getTime();
            if (!Number.isNaN(ts) && now - ts <= 30 * 24 * 60 * 60 * 1000) {
              activeRepos += 1;
            }
          }

          const contributors = ((teamData?.repo as Record<string, unknown> | undefined)?.contributors as Array<Record<string, unknown>> | undefined) || [];
          contributors.forEach((c) => {
            const login = String(c.login || '').trim();
            if (login) contributorSet.add(login.toLowerCase());
          });
        }));

        if (cancelled) return;
        setWorkspaceStats({
          totalProjects: projects.length,
          totalCommits,
          activeRepos,
          totalContributors: contributorSet.size,
          openPullRequests,
          totalStars,
        });
      } catch {
        if (!cancelled) {
          setWorkspaceStats({
            totalProjects: projects.length,
            totalCommits: null,
            activeRepos: null,
            totalContributors: null,
            openPullRequests: null,
            totalStars: null,
          });
        }
      } finally {
        if (!cancelled) setWorkspaceStatsLoading(false);
      }
    }

    void loadWorkspaceStats();
    return () => { cancelled = true; };
  }, [projects]);

  const handleProjectSelect = (p: Project) => {
    setProjectId(p.id);
    const { owner, repo } = getOwnerRepo(p);
    navigate(`/${owner}/${repo}`);
  };

  const handleDisconnect = async () => {
    if (!disconnectTarget) return;

    try {
      await apiClient.delete(`/api/projects/${disconnectTarget.id}`);
      if (disconnectTarget.id === projectId) setProjectId(null);
      setDisconnectTarget(null);
      toast({ title: "Repository disconnected", description: getRepoName(disconnectTarget) });
      refetch();
    } catch (error) {
      toast({ title: "Disconnect failed", description: (error as Error).message, variant: "destructive" });
    }
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen w-full flex-col items-center justify-center bg-background">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-brand text-primary-foreground shadow-brand">
          <Activity size={24} className="animate-pulse" />
        </div>
        <h2 className="text-lg font-semibold text-foreground">Loading DevANT</h2>
        <p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 size={14} className="animate-spin text-brand" /> Restoring session...
        </p>
      </div>
    );
  }
  if (!token) return <Navigate to="/login" replace />;
  if (!user) {
    return (
      <div className="flex min-h-screen w-full flex-col items-center justify-center bg-background">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-brand text-primary-foreground shadow-brand">
          <Activity size={24} className="animate-pulse" />
        </div>
        <h2 className="text-lg font-semibold text-foreground">Finalizing sign-in</h2>
        <p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 size={14} className="animate-spin text-brand" /> Restoring session...
        </p>
      </div>
    );
  }

  const showEmpty = !loading && projects.length === 0;

  return (
    <div className="flex min-h-screen w-full overflow-hidden bg-background">
      <LoadingSpinner visible={loading} />
      <IconRail tab={tab} setTab={setTab} alertsCount={0} onSettings={() => setShowSettings(true)} onSignOut={signOut} />
      <MiddleSidebar projects={projects} activeId={projectId} onSelect={handleProjectSelect} />
      <main className="relative min-w-0 flex-1 overflow-y-auto bg-card pb-24 lg:ml-[19.5rem]">
        <TopBar dark={dark} toggle={toggle} project={activeProject} onBell={() => setTab("alerts")} onSettings={() => setShowSettings(true)} onSignOut={signOut} />
        <ErrorBanner error={error} onRetry={refetch} />
        <div className="flex flex-wrap items-center justify-between gap-2 px-6 pt-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Overview</h1>
            <p className="text-sm text-muted-foreground">Your workspace at a glance</p>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={refetch} className="flex min-h-10 cursor-pointer items-center gap-1.5 rounded-full border border-border px-4 py-2 text-sm text-muted-foreground transition-all duration-200 hover:bg-muted hover:text-foreground"><RefreshCw size={13} /> Refresh</button>
            <button type="button" onClick={() => setShowLink(true)} className="flex min-h-10 cursor-pointer items-center gap-1.5 rounded-full bg-brand px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition-all duration-200 hover:bg-brand/90 hover:shadow-md"><Link size={14} /> + New Project</button>
          </div>
        </div>

        {showEmpty ? (
          <EmptyState title="Link your first GitHub repository" description="Your dashboard is empty because mock projects were removed. Choose a real repo from your GitHub account to create a DevANT project." actionLabel="Link GitHub repo" onAction={() => setShowLink(true)} />
        ) : (
          <>
            <WorkspaceAnalyticsCards loading={workspaceStatsLoading} stats={workspaceStats} />
            <ActiveProjects projects={projects} activeId={projectId} onSelect={handleProjectSelect} sort={sort} setSort={setSort} loading={loading} onRequestDisconnect={setDisconnectTarget} />
          </>
        )}
      </main>

      <LinkRepoModal open={showLink} onClose={() => setShowLink(false)} onLinked={refetch} />
      <SettingsModal open={showSettings} onClose={() => setShowSettings(false)} onSignOut={signOut} />
      <DisconnectModal isOpen={Boolean(disconnectTarget)} onClose={() => setDisconnectTarget(null)} onConfirm={handleDisconnect} projectName={disconnectTarget ? getRepoName(disconnectTarget) : ""} />
    </div>
  );
}
