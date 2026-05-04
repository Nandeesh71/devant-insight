import { useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import {
  Activity,
  AlertTriangle,
  Bell,
  CheckCircle2,
  ChevronDown,
  ExternalLink,
  Folder,
  GitBranch,
  Github,
  GitCommit,
  Grid3x3,
  LayoutGrid,
  Link2,
  List,
  Loader2,
  LogOut,
  Moon,
  MoreHorizontal,
  PlusCircle,
  RefreshCw,
  Search,
  Settings,
  SlidersHorizontal,
  Sun,
  User,
  X,
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
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

function getRepoName(project: Project | null) {
  if (!project) return "—";
  return String(project.repo_full_name || project.github_repo || project.repository || project.name || "Untitled project");
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
    { id: "portfolio", icon: LayoutGrid, label: "Portfolio" },
    { id: "commits", icon: GitBranch, label: "Commits" },
    { id: "team", icon: User, label: "Team" },
  ];
  return (
    <TooltipProvider delayDuration={150}>
      <aside className="flex w-14 shrink-0 flex-col items-center gap-1 bg-rail py-3">
        <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-brand text-xs font-bold text-primary-foreground shadow-brand">DA</div>
        {items.map((item) => {
          const active = tab === item.id;
          return (
            <Tooltip key={item.id}>
              <TooltipTrigger asChild>
                <button onClick={() => setTab(item.id)} className={cn("relative flex h-10 w-10 items-center justify-center rounded-lg transition-colors", active ? "bg-primary/20 text-primary-foreground" : "text-sidebar-text hover:bg-primary/10 hover:text-primary-foreground")}>
                  {active && <span className="absolute -left-2 bottom-1.5 top-1.5 w-[3px] rounded-r bg-brand" />}
                  <item.icon size={20} />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" className="border-border bg-card text-foreground">{item.label}</TooltipContent>
            </Tooltip>
          );
        })}
        <Tooltip>
          <TooltipTrigger asChild>
            <button onClick={() => setTab("alerts")} className="relative flex h-10 w-10 items-center justify-center rounded-lg text-sidebar-text hover:bg-primary/10 hover:text-primary-foreground">
              <Bell size={20} />
              {alertsCount > 0 && <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-destructive" />}
            </button>
          </TooltipTrigger>
          <TooltipContent side="right" className="border-border bg-card text-foreground">Alerts</TooltipContent>
        </Tooltip>
        <div className="mt-auto flex flex-col gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <button onClick={onSettings} className="flex h-10 w-10 items-center justify-center rounded-lg text-sidebar-text hover:bg-primary/10 hover:text-primary-foreground"><Settings size={18} /></button>
            </TooltipTrigger>
            <TooltipContent side="right" className="border-border bg-card text-foreground">Settings</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <button onClick={onSignOut} className="flex h-10 w-10 items-center justify-center rounded-lg text-sidebar-text hover:bg-primary/10 hover:text-primary-foreground"><LogOut size={18} /></button>
            </TooltipTrigger>
            <TooltipContent side="right" className="border-border bg-card text-foreground">Logout</TooltipContent>
          </Tooltip>
        </div>
      </aside>
    </TooltipProvider>
  );
}

function MiddleSidebar({ projects, activeId, onSelect, onLinkRepo }: { projects: Project[]; activeId: string | null; onSelect: (id: string) => void; onLinkRepo: () => void }) {
  const [query, setQuery] = useState("");
  const filtered = projects.filter((p) => getRepoName(p).toLowerCase().includes(query.toLowerCase()));
  return (
    <aside className="flex w-64 shrink-0 flex-col bg-sidebar-bg text-primary-foreground">
      <div className="flex items-center gap-2 px-4 pb-3 pt-4">
        <h2 className="flex-1 text-[15px] font-semibold">Projects</h2>
        <button onClick={onLinkRepo} className="text-sidebar-text hover:text-primary-foreground"><PlusCircle size={17} /></button>
      </div>
      <div className="px-3 pb-3">
        <div className="flex items-center gap-2 rounded-lg bg-sidebar-search px-3 py-2">
          <Search size={14} className="text-sidebar-text" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search linked repos..." className="min-w-0 flex-1 bg-transparent text-[13px] outline-none placeholder:text-sidebar-label" />
        </div>
      </div>
      <div className="px-3">
        <button className="flex w-full items-center gap-2 rounded-lg bg-brand px-3 py-2 text-sm font-semibold text-primary-foreground shadow-brand">
          <LayoutGrid size={14} /><span className="flex-1 text-left">Overview</span>
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
          const active = activeId === p.id;
          const repo = getRepoName(p);
          return (
            <button key={p.id} onClick={() => onSelect(p.id)} className={cn("mb-1 flex w-full items-center gap-2 rounded-md px-2 py-2 text-[13px] transition-colors", active ? "bg-primary/15 text-primary-foreground" : "text-sidebar-text hover:bg-primary/10 hover:text-primary-foreground")}>
              <Folder size={14} className="shrink-0" />
              <span className="min-w-0 flex-1 truncate text-left">{repo}</span>
            </button>
          );
        })}
        <button onClick={onLinkRepo} className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-sidebar-tree py-2 text-[13px] text-sidebar-text hover:border-border hover:text-primary-foreground">
          <Github size={14} /> Link GitHub repo
        </button>
      </div>
    </aside>
  );
}

function TopBar({ dark, toggle, project, onBell, onSettings, onSignOut }: { dark: boolean; toggle: () => void; project: Project | null; onBell: () => void; onSettings: () => void; onSignOut: () => void }) {
  const { user } = useAuth();
  const repo = getRepoName(project);
  return (
    <div className="flex items-center border-b border-border px-6 py-3">
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-brand text-primary-foreground"><Activity size={16} /></div>
      <div className="ml-3 min-w-0">
        <div className="truncate text-[15px] font-semibold text-foreground">{repo}</div>
        <div className="mt-0.5 flex items-center gap-2 text-[11px] text-muted-foreground">
          <Github size={12} /> {project ? "Real GitHub project" : "No project selected"}
        </div>
      </div>
      <div className="ml-auto flex items-center gap-1.5">
        <button onClick={toggle} className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:bg-muted">{dark ? <Moon size={16} /> : <Sun size={16} />}</button>
        <button onClick={onBell} className="relative flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:bg-muted"><Bell size={16} /></button>
        <button onClick={onSettings} className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:bg-muted"><Settings size={16} /></button>
        <button onClick={onSignOut} className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-muted"><LogOut size={13} /> Logout</button>
        <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-accent text-xs font-bold text-brand">
          {user?.avatar_url ? <img src={user.avatar_url} alt="User avatar" className="h-full w-full object-cover" /> : (user?.name || user?.email || "U").slice(0, 1).toUpperCase()}
        </div>
      </div>
    </div>
  );
}

/* ---------------- Dashboard sections ---------------- */
function StatCards({ health, finance, dora }: Pick<ReturnType<typeof useDevantData>, "health" | "finance" | "dora">) {
  const score = typeof health?.score === "number" ? health.score : null;
  const burn = typeof finance?.burn_percent === "number" ? finance.burn_percent : null;
  return (
    <section className="grid grid-cols-1 gap-3 px-6 pt-6 md:grid-cols-3">
      <div className="rounded-lg border border-border bg-card p-4 shadow-card">
        <div className="text-xs text-muted-foreground">Project Health</div>
        <div className="mt-1 flex items-end gap-2"><div className="text-3xl font-bold text-foreground">{score ?? "—"}</div><div className="mb-1 text-xs text-muted-foreground">/ 100</div></div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted"><div className="h-2 rounded-full bg-brand" style={{ width: `${Math.max(0, Math.min(score ?? 0, 100))}%` }} /></div>
      </div>
      <div className="rounded-lg border border-border bg-card p-4 shadow-card">
        <div className="text-xs text-muted-foreground">Budget · Burn · Runway</div>
        <div className="mt-1 text-lg font-bold text-foreground">{formatCurrency(finance?.spent)} <span className="text-xs font-normal text-muted-foreground">/ {formatCurrency(finance?.budget)}</span></div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted"><div className="h-2 rounded-full bg-brand" style={{ width: `${Math.max(0, Math.min(burn ?? 0, 100))}%` }} /></div>
        <div className="mt-1.5 text-[11px] text-muted-foreground">{burn ?? "—"}% spent · {finance?.runway_months ?? "—"}mo runway</div>
      </div>
      <div className="rounded-lg border border-border bg-card p-4 shadow-card">
        <div className="text-xs text-muted-foreground">DORA</div>
        <div className="mt-2 grid grid-cols-2 gap-1.5 text-[11px]">
          <div><div className="text-muted-foreground">Deploy Freq</div><div className="font-bold text-foreground">{dora?.deployment_frequency?.value ?? "—"}</div></div>
          <div><div className="text-muted-foreground">Lead Time</div><div className="font-bold text-foreground">{dora?.change_lead_time?.value ?? "—"}</div></div>
          <div><div className="text-muted-foreground">Failure Rate</div><div className="font-bold text-foreground">{dora?.change_failure_rate?.value ?? "—"}</div></div>
          <div><div className="text-muted-foreground">Rating</div><div className="font-bold text-foreground">{dora?.deployment_frequency?.rating ?? "—"}</div></div>
        </div>
      </div>
    </section>
  );
}

function ActiveProjects({ projects, activeId, onSelect, sort, setSort }: { projects: Project[]; activeId: string | null; onSelect: (id: string) => void; sort: string; setSort: (s: string) => void }) {
  const [open, setOpen] = useState(false);
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
          <button onClick={() => setOpen(!open)} className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted">
            <SlidersHorizontal size={13} /> {sort} <ChevronDown size={13} />
          </button>
          {open && (
            <div className="absolute right-0 z-30 mt-1 w-36 rounded-lg border border-border bg-card py-1 shadow-lift">
              {['Newest', 'Name'].map((s) => <button key={s} onClick={() => { setSort(s); setOpen(false); }} className="w-full px-3 py-1.5 text-left text-xs hover:bg-muted">{s}</button>)}
            </div>
          )}
        </div>
      </div>
      <div className="scrollbar-hide flex gap-3 overflow-x-auto pb-2">
        {sorted.map((p) => {
          const active = p.id === activeId;
          const repo = getRepoName(p);
          return (
            <button key={p.id} onClick={() => onSelect(p.id)} className={cn("relative flex h-[126px] min-w-[190px] flex-col justify-between overflow-hidden rounded-lg border border-border bg-card p-4 text-left shadow-card transition-all hover:-translate-y-0.5 hover:shadow-lift", active && "ring-2 ring-brand")}>
              <GitBranch size={18} className="text-brand" />
              <div>
                <div className="truncate text-[13px] font-bold text-foreground">{repo}</div>
                <div className="mt-0.5 truncate text-[11px] text-muted-foreground">{String(p.description || p.default_branch || p.status || "Linked from GitHub")}</div>
                <div className="mt-2 inline-flex rounded-full bg-accent px-2 py-0.5 text-[10px] font-semibold text-brand">Real data</div>
              </div>
            </button>
          );
        })}
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

function CommitsTable({ tab, setTab, commits, team, search, setSearch, selectedId, setSelectedId, onOpen }: { tab: string; setTab: (t: string) => void; commits: UiCommit[]; team: ReturnType<typeof useDevantData>["team"]; search: string; setSearch: (s: string) => void; selectedId: string; setSelectedId: (id: string) => void; onOpen: (c: UiCommit) => void }) {
  const filtered = commits.filter((c) => !search || c.message.toLowerCase().includes(search.toLowerCase()) || c.author.toLowerCase().includes(search.toLowerCase()) || c.sha.includes(search));
  return (
    <section className="px-6 pb-24 pt-6">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {[{ id: "commits", label: "Recent Commits" }, { id: "team", label: "Team" }, { id: "alerts", label: "Alerts" }].map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)} className={cn("rounded-full px-4 py-1.5 text-sm transition-colors", tab === t.id ? "bg-brand font-semibold text-primary-foreground" : "text-muted-foreground hover:bg-muted")}>{t.label}</button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <div className="flex w-64 items-center gap-2 rounded-lg border border-border bg-card px-3 py-1.5">
            <Search size={14} className="text-muted-foreground" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search commits..." className="min-w-0 flex-1 bg-transparent text-sm outline-none" />
          </div>
          <button className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted"><Grid3x3 size={16} /></button>
          <button className="flex h-8 w-8 items-center justify-center rounded-md bg-muted text-foreground"><List size={16} /></button>
        </div>
      </div>
      <div className="overflow-hidden rounded-lg border border-border bg-card">
        {tab === "team" ? (
          <table className="w-full text-sm">
            <thead><tr className="border-b border-border text-left text-[11px] uppercase tracking-wider text-muted-foreground"><th className="px-4 py-3">Member</th><th>Role</th><th>Status</th><th>Last commit</th></tr></thead>
            <tbody>
              {team.length === 0 && <tr><td colSpan={4} className="py-8 text-center text-sm text-muted-foreground">No team data returned yet</td></tr>}
              {team.map((m) => <tr key={m.id} className="border-b border-border last:border-0"><td className="px-4 py-3 font-semibold text-foreground">{m.name}</td><td className="text-muted-foreground">{m.role}</td><td>{m.status}</td><td className="text-muted-foreground">{m.last_commit || "—"}</td></tr>)}
            </tbody>
          </table>
        ) : tab === "alerts" ? (
          <div className="p-8 text-center text-sm text-muted-foreground">No alert endpoint is returning data yet.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                <th className="w-10 px-4 py-3" /><th className="py-3">Commit Message</th><th className="py-3">Author</th><th className="py-3">Date</th><th className="py-3">AI Tag</th><th className="py-3">Risk</th><th className="py-3">Diff</th><th className="w-10" />
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && <tr><td colSpan={8} className="py-8 text-center text-sm text-muted-foreground">No commits returned for this project yet</td></tr>}
              {filtered.map((c) => {
                const selected = c.id === selectedId;
                return (
                  <tr key={c.id} onClick={() => setSelectedId(c.id)} onDoubleClick={() => onOpen(c)} className={cn("cursor-pointer border-b border-border transition-colors last:border-0", selected ? "bg-row-selected" : "hover:bg-row-hover")}>
                    <td className="px-4 py-3"><div className={cn("flex h-4 w-4 items-center justify-center rounded border", selected ? "border-brand bg-brand text-primary-foreground" : "border-border bg-card")}>{selected && <CheckCircle2 size={12} />}</div></td>
                    <td className="py-3"><div className="flex items-center gap-3"><div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-brand"><GitCommit size={15} /></div><div><div className="text-[13px] font-semibold text-foreground">{c.message}</div><div className="font-mono text-[11px] text-muted-foreground">Commit #{c.sha}</div></div></div></td>
                    <td className="py-3 text-[13px] text-foreground">{c.author}</td>
                    <td className="py-3 text-[13px] text-muted-foreground">{c.date}</td>
                    <td className="py-3"><span className={cn("rounded-full px-2 py-1 text-[11px] font-semibold", tagClass(c.tag))}>{c.tag}</span></td>
                    <td className="py-3"><span className={cn("rounded-full px-2 py-1 text-[11px] font-semibold", riskClass(c.risk))}>{c.risk}</span></td>
                    <td className="py-3 text-[13px] text-foreground">{c.size}</td>
                    <td className="py-3 pr-4 text-muted-foreground"><MoreHorizontal size={16} /></td>
                  </tr>
                );
              })}
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
      <div className="relative h-full w-[480px] max-w-full overflow-y-auto border-l border-border bg-card" onClick={(e) => e.stopPropagation()}>
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
    <div className="absolute bottom-0 left-0 right-0 flex items-center gap-3 border-t border-border bg-card px-6 py-3">
      <GitCommit size={16} className="text-brand" />
      <span className="text-[13px] text-foreground">{commit.message} · {commit.size} diff · {commit.date}</span>
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
      await apiClient.post("/api/github/link-repo", { repo: fullName, repo_full_name: fullName, github_repo_id: repo.id });
      toast({ title: "Repository linked", description: fullName });
      onLinked();
      onClose();
    } catch (e) {
      toast({ title: "Link failed", description: (e as Error).message, variant: "destructive" });
    } finally {
      setLinking(null);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Link a GitHub Repository" wide>
      {!user?.github_connected ? (
        <div className="text-center">
          <Github className="mx-auto mb-3 text-brand" size={28} />
          <p className="text-sm text-muted-foreground">Connect GitHub before choosing repositories.</p>
          <button onClick={connectGithub} className="mt-5 inline-flex items-center gap-2 rounded-full bg-brand px-4 py-2 text-sm font-semibold text-primary-foreground"><Github size={14} /> Connect GitHub</button>
        </div>
      ) : (
        <>
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">Choose the repos you want DevANT to track. Only linked repos become projects.</p>
            <button onClick={connectGithub} className="shrink-0 text-xs font-semibold text-brand hover:underline">Reconnect</button>
          </div>
          {loading && <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground"><Loader2 className="animate-spin" size={16} /> Loading GitHub repos…</div>}
          {error && <ErrorBanner error={error} />}
          {!loading && !error && repos.length === 0 && <div className="rounded-lg border border-border p-6 text-center text-sm text-muted-foreground">No repositories returned by GitHub yet.</div>}
          <div className="max-h-[420px] space-y-1.5 overflow-y-auto pr-1">
            {repos.map((repo) => {
              const fullName = repo.full_name || repo.name;
              return (
                <button key={String(repo.id || fullName)} onClick={() => linkRepo(repo)} disabled={!!linking} className="flex w-full items-center justify-between rounded-lg border border-border px-3 py-2 text-left text-sm hover:bg-muted disabled:opacity-60">
                  <span className="min-w-0 flex items-center gap-2"><GitBranch size={14} className="shrink-0 text-brand" /><span className="truncate font-semibold text-foreground">{fullName}</span><span className="text-xs text-muted-foreground">{repo.private ? "Private" : "Public"}</span></span>
                  <span className="text-xs font-semibold text-brand">{linking === fullName ? "Linking…" : "Link"}</span>
                </button>
              );
            })}
          </div>
        </>
      )}
    </Modal>
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
  const { dark, toggle } = useTheme();
  const { user, token, loading: authLoading, signOut } = useAuth();
  const { projectId, setProjectId } = useProject();
  const data = useDevantData();
  const { loading, error, refetch, projects, commits, team, finance, dora, health } = data;
  const [tab, setTab] = useState("portfolio");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("Newest");
  const [showLink, setShowLink] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [drawerCommit, setDrawerCommit] = useState<UiCommit | null>(null);

  const activeProject = projects.find((p) => p.id === projectId) || null;
  const uiCommits = useMemo(() => commits.map(toUiCommit), [commits]);
  const [selectedId, setSelectedId] = useState("");
  const selected = uiCommits.find((c) => c.id === selectedId) || uiCommits[0] || null;

  useEffect(() => {
    if (!selectedId && uiCommits[0]) setSelectedId(uiCommits[0].id);
  }, [selectedId, uiCommits]);

  if (authLoading) {
    return <div className="flex h-screen items-center justify-center bg-background text-muted-foreground"><Loader2 className="mr-2 animate-spin text-brand" size={18} /> Restoring session…</div>;
  }
  if (!token || !user) return <Navigate to="/login" replace />;
  if (!user.github_connected) return <Navigate to="/connect-github" replace />;

  const showEmpty = !loading && projects.length === 0;

  return (
    <div className="flex h-screen w-full bg-background">
      <LoadingSpinner visible={loading} />
      <IconRail tab={tab} setTab={setTab} alertsCount={0} onSettings={() => setShowSettings(true)} onSignOut={signOut} />
      <MiddleSidebar projects={projects} activeId={projectId} onSelect={setProjectId} onLinkRepo={() => setShowLink(true)} />
      <main className="relative flex-1 overflow-y-auto bg-card">
        <TopBar dark={dark} toggle={toggle} project={activeProject} onBell={() => setTab("alerts")} onSettings={() => setShowSettings(true)} onSignOut={signOut} />
        <ErrorBanner error={error} onRetry={refetch} />
        <div className="flex flex-wrap items-center justify-between gap-2 px-6 pt-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            Projects <span className="text-muted-foreground/50">/</span>
            <span className="flex min-w-0 items-center gap-1 text-foreground">{activeProject ? getRepoName(activeProject) : "No linked repo"} <ChevronDown size={13} /></span>
            <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-bold text-brand">{uiCommits.length}</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={refetch} className="flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-sm text-muted-foreground hover:bg-muted"><RefreshCw size={13} /> Refresh</button>
            <button onClick={() => setShowLink(true)} className="flex items-center gap-1.5 rounded-full bg-brand px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"><Link2 size={14} /> Link Repository</button>
          </div>
        </div>

        {showEmpty ? (
          <EmptyState title="Link your first GitHub repository" description="Your dashboard is empty because mock projects were removed. Choose a real repo from your GitHub account to create a DevANT project." actionLabel="Link GitHub repo" onAction={() => setShowLink(true)} />
        ) : (
          <>
            <StatCards health={health} finance={finance} dora={dora} />
            <ActiveProjects projects={projects} activeId={projectId} onSelect={setProjectId} sort={sort} setSort={setSort} />
            <CommitsTable tab={tab === "portfolio" ? "commits" : tab} setTab={setTab} commits={uiCommits} team={team} search={search} setSearch={setSearch} selectedId={selected?.id || ""} setSelectedId={setSelectedId} onOpen={setDrawerCommit} />
            {selected && <BottomBar commit={selected} />}
          </>
        )}
      </main>

      <CommitDrawer commit={drawerCommit} onClose={() => setDrawerCommit(null)} />
      <LinkRepoModal open={showLink} onClose={() => setShowLink(false)} onLinked={refetch} />
      <SettingsModal open={showSettings} onClose={() => setShowSettings(false)} onSignOut={signOut} />
    </div>
  );
}
