import { useState } from "react";
import {
  LayoutGrid, GitBranch, GitPullRequest, Trash2, Bell, Plus, Settings, LogOut,
  Search, ChevronUp, ChevronRight, ChevronDown, Pencil, Folder, ArrowLeft,
  Sun, Moon, Info, SlidersHorizontal, Sparkles, Bug, Wrench, RefreshCw,
  Package, MoreHorizontal, Share2, Link2, Download, GitCommit, LayoutList,
  Grid3x3, AlertTriangle, TrendingUp, TrendingDown, Lightbulb, Rocket,
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

/* ---------------- Theme toggle ---------------- */
function useTheme() {
  const [dark, setDark] = useState(false);
  const toggle = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
  };
  return { dark, toggle };
}

/* ---------------- Left icon rail ---------------- */
const railTop = [
  { icon: LayoutGrid, label: "Portfolio", active: true },
  { icon: GitBranch, label: "Commits" },
  { icon: GitPullRequest, label: "Pull Requests" },
  { icon: Trash2, label: "Archive" },
  { icon: Bell, label: "Alerts", badge: 3 },
];

function IconRail() {
  return (
    <TooltipProvider delayDuration={150}>
      <aside className="w-14 shrink-0 bg-rail flex flex-col items-center py-3 gap-1">
        <div className="w-9 h-9 rounded-xl bg-gradient-brand flex items-center justify-center text-white font-bold text-[13px] shadow-brand mb-2">
          DA
        </div>
        {railTop.map((it) => (
          <Tooltip key={it.label}>
            <TooltipTrigger asChild>
              <button
                className={cn(
                  "relative w-10 h-10 rounded-lg flex items-center justify-center transition-colors",
                  it.active ? "bg-white/5 text-white" : "text-sidebar-text hover:text-white hover:bg-white/5"
                )}
              >
                {it.active && <span className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r bg-brand" />}
                <it.icon size={20} />
                {it.badge && (
                  <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 rounded-full bg-brand text-white text-[9px] font-semibold flex items-center justify-center">
                    {it.badge}
                  </span>
                )}
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">{it.label}</TooltipContent>
          </Tooltip>
        ))}
        <Tooltip>
          <TooltipTrigger asChild>
            <button className="mt-2 w-10 h-10 rounded-lg bg-white/10 text-white hover:bg-white/15 flex items-center justify-center">
              <Plus size={18} />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right">New Project</TooltipContent>
        </Tooltip>

        <div className="mt-auto flex flex-col gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <button className="w-10 h-10 rounded-lg text-sidebar-text hover:text-white flex items-center justify-center">
                <Settings size={18} />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">Settings</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <button className="w-10 h-10 rounded-lg text-sidebar-text hover:text-white flex items-center justify-center">
                <LogOut size={18} />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">Log out</TooltipContent>
          </Tooltip>
        </div>
      </aside>
    </TooltipProvider>
  );
}

/* ---------------- Middle sidebar ---------------- */
const projects = [
  { name: "ShortFundly", branches: ["main branch", "feature/auth"], open: true },
  { name: "Perceptronix App", branches: ["dev branch"], open: true },
  { name: "KDS Dashboard" },
  { name: "Tensor Redesign" },
  { name: "Drapora Projects" },
];

function MiddleSidebar() {
  const [overviewOpen, setOverviewOpen] = useState(true);
  const [openMap, setOpenMap] = useState<Record<string, boolean>>({
    ShortFundly: true,
    "Perceptronix App": true,
  });

  return (
    <aside className="w-60 shrink-0 bg-sidebar-bg flex flex-col text-sidebar-text">
      {/* Top */}
      <div className="flex items-center gap-2 px-3 pt-3 pb-2">
        <button className="w-7 h-7 rounded-md bg-white/5 hover:bg-white/10 flex items-center justify-center">
          <ArrowLeft size={14} className="text-white" />
        </button>
        <h2 className="text-white font-semibold text-[18px] flex-1">Projects</h2>
        <button className="w-7 h-7 rounded-md hover:bg-white/5 flex items-center justify-center">
          <Settings size={14} />
        </button>
      </div>

      {/* Search */}
      <div className="px-3 pb-3">
        <div className="flex items-center gap-2 bg-sidebar-search rounded-lg px-2.5 h-8">
          <Search size={13} className="text-sidebar-label" />
          <input
            placeholder="Search projects..."
            className="bg-transparent text-[12px] text-white placeholder:text-sidebar-label flex-1 outline-none"
          />
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-sidebar-label">⌘K</span>
        </div>
      </div>

      {/* Nav */}
      <div className="px-3 space-y-1">
        <button
          onClick={() => setOverviewOpen((v) => !v)}
          className="w-full flex items-center gap-2 bg-brand rounded-lg px-3 h-9 text-white text-[13px] font-medium shadow-brand"
        >
          <LayoutGrid size={14} />
          <span className="flex-1 text-left">Overview</span>
          {overviewOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
        {overviewOpen && (
          <div className="pl-5 relative">
            <div className="absolute left-3 top-0 bottom-3 w-px bg-sidebar-tree" />
            <button className="relative flex items-center gap-2 w-full pl-3 pr-2 h-8 rounded-md hover:bg-white/5 text-[12px]">
              <span className="absolute left-0 top-1/2 w-3 h-px bg-sidebar-tree" />
              <span className="flex-1 text-left">My Projects</span>
              <ChevronRight size={12} />
            </button>
            <button className="relative flex items-center gap-2 w-full pl-3 pr-2 h-8 rounded-md bg-white/[0.04] text-[12px] text-white">
              <span className="absolute left-0 top-1/2 w-3 h-px bg-sidebar-tree" />
              <span className="flex-1 text-left">Recent Activity</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-black/40 text-sidebar-text">47</span>
            </button>
          </div>
        )}
      </div>

      {/* Active projects */}
      <div className="px-3 mt-5 flex items-center justify-between">
        <span className="text-[10px] tracking-wider uppercase text-sidebar-label font-semibold">Active Projects</span>
        <button className="text-sidebar-label hover:text-white">
          <Pencil size={11} />
        </button>
      </div>

      <div className="px-3 mt-2 space-y-0.5 flex-1 overflow-y-auto scrollbar-hide">
        {projects.map((p) => {
          const open = openMap[p.name];
          return (
            <div key={p.name}>
              <button
                onClick={() =>
                  p.branches && setOpenMap((m) => ({ ...m, [p.name]: !m[p.name] }))
                }
                className="w-full flex items-center gap-2 px-2 h-8 rounded-md hover:bg-white/5 text-[12px]"
              >
                <Folder size={13} className="text-sidebar-text" />
                <span className="flex-1 text-left">{p.name}</span>
                {p.branches ? (
                  open ? <ChevronDown size={12} /> : <ChevronRight size={12} />
                ) : (
                  <ChevronRight size={12} />
                )}
              </button>
              {p.branches && open && (
                <div className="pl-5 relative">
                  <div className="absolute left-4 top-0 bottom-1 w-px bg-sidebar-tree" />
                  {p.branches.map((b) => (
                    <button
                      key={b}
                      className="relative flex items-center w-full pl-3 h-7 text-[11.5px] text-sidebar-text hover:text-white"
                    >
                      <span className="absolute left-0 top-1/2 w-3 h-px bg-sidebar-tree" />
                      <GitBranch size={11} className="mr-1.5" />
                      {b}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        <button className="mt-3 w-full flex items-center justify-center gap-2 h-9 rounded-lg border border-dashed border-white/15 text-[12px] text-sidebar-text hover:bg-white/5 hover:text-white">
          <Plus size={13} /> New Project
        </button>
      </div>

      {/* Upgrade banner */}
      <div className="m-3 rounded-2xl p-4 bg-gradient-upgrade relative overflow-hidden">
        <button className="absolute top-3 right-3 text-white/60 hover:text-white">
          <MoreHorizontal size={14} />
        </button>
        <div className="w-10 h-10 rounded-xl bg-brand/20 flex items-center justify-center mb-3">
          <Rocket size={20} className="text-orange-300" />
        </div>
        <div className="text-white font-semibold text-[14px]">Upgrade to Pro</div>
        <p className="text-[11px] text-white/60 mt-1 leading-snug">
          Unlock AI briefs, DORA metrics & screenshot comparison.
        </p>
        <button className="mt-3 w-full h-9 rounded-full bg-[#3D1040] text-white text-[12px] font-medium hover:brightness-110 flex items-center justify-center gap-1.5">
          <Sparkles size={12} /> Upgrade to Pro
        </button>
      </div>
    </aside>
  );
}

/* ---------------- Top bar ---------------- */
function TopBar({ dark, onToggle }: { dark: boolean; onToggle: () => void }) {
  return (
    <div className="flex items-center gap-3 px-6 py-4 bg-card border-b border-border">
      <div className="w-8 h-8 rounded-full bg-gradient-brand flex items-center justify-center text-white text-[11px] font-bold shadow-brand">
        DA
      </div>
      <div className="flex flex-col">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-[14px] text-foreground">ShortFundly</span>
          <span className="text-[12px] text-muted-foreground">3 / 5 Projects</span>
        </div>
        <div className="h-1 w-32 bg-muted rounded-full mt-1 overflow-hidden">
          <div className="h-full w-3/5 bg-brand rounded-full animate-fill" />
        </div>
      </div>
      <div className="flex-1" />
      <button onClick={onToggle} className="w-9 h-9 rounded-full bg-muted hover:bg-accent flex items-center justify-center text-foreground">
        {dark ? <Sun size={15} /> : <Moon size={15} />}
      </button>
      <button className="w-9 h-9 rounded-full hover:bg-muted flex items-center justify-center text-muted-foreground">
        <Info size={15} />
      </button>
      <button className="relative w-9 h-9 rounded-full hover:bg-muted flex items-center justify-center text-muted-foreground">
        <Bell size={15} />
        <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-brand" />
      </button>
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-pink-500" />
    </div>
  );
}

/* ---------------- Recently Analyzed ---------------- */
const recentCards = [
  { name: "ShortFundly", time: "Analyzed 8m ago", letter: "S", dark: true, color: "bg-brand" },
  { name: "Perceptronix App", time: "Analyzed 32m ago", letter: "P", color: "bg-indigo-500" },
  { name: "PR #47 — Auth Module", time: "Analyzed 1h ago", letter: "PR", color: "bg-orange-500" },
  { name: "KDS Dashboard", time: "Analyzed 2h ago", letter: "K", color: "bg-green-500" },
  { name: "Weekly AI Brief", time: "Generated 1d ago", letter: "AI", color: "bg-budget-purple", report: true },
];

function RecentlyAnalyzed() {
  return (
    <section className="px-6 pt-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-[15px] text-foreground">Recently Analyzed</h3>
        <button className="text-[12px] text-muted-foreground hover:text-foreground flex items-center gap-1">
          View all <ChevronRight size={12} />
        </button>
      </div>
      <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
        {recentCards.map((c, i) => (
          <div
            key={c.name}
            className="group min-w-[200px] flex-1 bg-card rounded-xl border border-border shadow-card p-3 hover:shadow-lift transition-all hover:-translate-y-0.5"
          >
            <div className={cn(
              "relative h-24 rounded-lg mb-3 flex items-center justify-center overflow-hidden",
              c.dark ? "bg-card-dark" : "bg-muted/40"
            )}>
              <div className={cn("w-9 h-9 rounded-full text-white text-[12px] font-semibold flex items-center justify-center", c.color)}>
                {c.letter}
              </div>
              {c.report && (
                <div className="absolute inset-2 bg-card rounded-md p-1.5 space-y-1">
                  <div className="h-1 w-1/2 bg-muted rounded" />
                  <div className="h-1 w-3/4 bg-muted rounded" />
                  <div className="h-1 w-2/3 bg-muted rounded" />
                  <div className="h-1 w-1/3 bg-brand/40 rounded" />
                </div>
              )}
              {i === 0 && (
                <div className="absolute opacity-0 group-hover:opacity-100 transition bg-foreground text-background text-[11px] px-2.5 py-1 rounded-md">
                  View Report
                </div>
              )}
            </div>
            <div className="flex items-start justify-between">
              <div>
                <div className="text-[13px] font-medium text-foreground truncate">{c.name}</div>
                <div className="text-[11px] text-muted-foreground mt-0.5">{c.time}</div>
              </div>
              <button className="text-muted-foreground hover:text-foreground">
                <MoreHorizontal size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ---------------- Active Projects ---------------- */
const activeProjects = [
  { name: "ShortFundly", meta: "47 commits, ₹2.6L budget", dark: true, health: "74/100", healthColor: "yellow" },
  { name: "Perceptronix App", meta: "23 commits, ₹1.8L budget", icon: "P", iconColor: "bg-indigo-500" },
  { name: "KDS Dashboard", meta: "18 commits, 502 MB repo", icon: "K", iconColor: "bg-green-500" },
  { name: "Tensor Redesign", meta: "9 commits, ₹90K budget", icon: "T", iconColor: "bg-purple-500" },
  { name: "Drapora Mobile", meta: "12 commits, 52.4K lines", icon: "D", iconColor: "bg-amber-500" },
  { name: "Znexus API", meta: "102 commits, 3.2GB repo", icon: "Z", iconColor: "bg-cyan-500" },
];

function HealthBadge({ score, color }: { score: string; color: string }) {
  const dot = color === "yellow" ? "bg-health-yellow" : color === "green" ? "bg-health-green" : "bg-health-red";
  return (
    <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur rounded-full px-2 py-0.5 text-[10.5px] text-white">
      <span className="font-semibold">{score}</span>
      <span className={cn("w-2 h-2 rounded-full", dot)} />
    </div>
  );
}

function AvatarStack({ count = 3, extra }: { count?: number; extra?: number }) {
  const colors = ["from-orange-400 to-pink-500", "from-blue-400 to-indigo-500", "from-green-400 to-teal-500"];
  return (
    <div className="flex items-center -space-x-2">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={cn("w-6 h-6 rounded-full border-2 border-white bg-gradient-to-br", colors[i % 3])} />
      ))}
      {extra && (
        <div className="w-6 h-6 rounded-full border-2 border-white bg-accent text-accent-foreground text-[9px] font-semibold flex items-center justify-center">
          +{extra}
        </div>
      )}
    </div>
  );
}

function ActiveProjects() {
  return (
    <section className="px-6 pt-8">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-[15px] text-foreground">Active Projects</h3>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 text-[12px] px-2.5 h-7 rounded-md bg-accent text-accent-foreground">
            <SlidersHorizontal size={11} /> Newest <ChevronDown size={11} />
          </button>
          <button className="text-[12px] text-muted-foreground hover:text-foreground flex items-center gap-1">
            View all <ChevronRight size={12} />
          </button>
        </div>
      </div>

      <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
        {activeProjects.map((p) => (
          <div
            key={p.name}
            className={cn(
              "group relative min-w-[200px] flex-1 rounded-2xl p-4 transition-all hover:-translate-y-0.5 hover:shadow-lift overflow-hidden",
              p.dark
                ? "bg-gradient-card-dark text-white border border-white/5"
                : "bg-card-light border border-border text-foreground"
            )}
          >
            {/* layered folder backdrop */}
            <div className="absolute -top-2 right-2 w-20 h-16 rounded-xl bg-brand/10 rotate-6" />
            <div className="absolute top-0 right-6 w-20 h-16 rounded-xl bg-brand/15 -rotate-3" />

            <div className="relative flex items-center justify-between">
              <div className={cn(
                "w-9 h-9 rounded-lg flex items-center justify-center text-white text-[12px] font-bold",
                p.dark ? "bg-gradient-brand shadow-brand" : p.iconColor
              )}>
                {p.dark ? "DA" : p.icon}
              </div>
              {p.dark && p.health && <HealthBadge score={p.health} color={p.healthColor!} />}
            </div>

            <div className="relative mt-10">
              <div className={cn("text-[14px] font-semibold", p.dark ? "text-white" : "text-foreground")}>
                {p.name}
              </div>
              <div className={cn("text-[11.5px] mt-0.5", p.dark ? "text-white/60" : "text-muted-foreground")}>
                {p.meta}
              </div>
              <div className="mt-3">
                <AvatarStack count={3} extra={p.name === "Perceptronix App" ? 3 : undefined} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ---------------- Commits Table ---------------- */
type Tag = "Bug Fix" | "Feature" | "Refactor" | "Chore";
type Risk = "High" | "Medium" | "Low";

const commits: {
  msg: string; hash: string; author: string; pushed: string; lastActivity: string;
  tag: Tag; risk: Risk; iconColor: string; Icon: typeof Bug;
}[] = [
  { msg: "fix: resolve auth token expiry", hash: "#a3f92c", author: "Ravi", pushed: "Sep 26, 2025", lastActivity: "Sep 28, 2025", tag: "Bug Fix", risk: "High", iconColor: "bg-red-100 text-red-600", Icon: Bug },
  { msg: "feat: add payment gateway integration", hash: "#b81e44", author: "Priya", pushed: "Sep 27, 2025", lastActivity: "Sep 27, 2025", tag: "Feature", risk: "High", iconColor: "bg-green-100 text-green-600", Icon: Package },
  { msg: "refactor: cleanup middleware", hash: "#c4502d", author: "Arjun", pushed: "Sep 28, 2025", lastActivity: "Sep 28, 2025", tag: "Refactor", risk: "Medium", iconColor: "bg-blue-100 text-blue-600", Icon: RefreshCw },
  { msg: "chore: update dependencies", hash: "#d11ab7", author: "Ravi", pushed: "Sep 1, 2025", lastActivity: "Sep 27, 2025", tag: "Chore", risk: "Low", iconColor: "bg-gray-100 text-gray-600", Icon: Wrench },
];

const tagStyles: Record<Tag, string> = {
  "Bug Fix": "bg-red-100 text-red-600",
  Feature: "bg-green-100 text-green-700",
  Refactor: "bg-blue-100 text-blue-700",
  Chore: "bg-gray-100 text-gray-600",
};
const riskStyles: Record<Risk, { c: string; dot: string }> = {
  High: { c: "bg-red-50 text-red-600 border border-red-100", dot: "🔴" },
  Medium: { c: "bg-yellow-50 text-yellow-700 border border-yellow-100", dot: "🟡" },
  Low: { c: "bg-green-50 text-green-700 border border-green-100", dot: "🟢" },
};

function CommitsTable() {
  const [tab, setTab] = useState<"commits" | "prs" | "deploy">("commits");
  const [view, setView] = useState<"list" | "grid">("list");
  const [selected, setSelected] = useState<number | null>(1);

  const tabs = [
    { key: "commits" as const, label: "Recent Commits" },
    { key: "prs" as const, label: "Pull Requests" },
    { key: "deploy" as const, label: "Deployments" },
  ];

  return (
    <section className="px-6 pt-8 pb-32">
      <div className="bg-card rounded-2xl border border-border shadow-card">
        {/* Tabs row */}
        <div className="flex items-center gap-2 p-3 border-b border-border">
          <div className="flex items-center gap-1.5">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={cn(
                  "h-8 px-3 rounded-full text-[12px] font-medium flex items-center gap-1.5 transition",
                  tab === t.key
                    ? "bg-brand text-white shadow-brand"
                    : "text-muted-foreground hover:bg-muted"
                )}
              >
                {tab === t.key && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                {t.label}
              </button>
            ))}
          </div>
          <div className="flex-1" />
          <div className="flex items-center gap-2 bg-muted rounded-md px-2.5 h-8 w-64">
            <Search size={12} className="text-muted-foreground" />
            <input placeholder="Search commits..." className="bg-transparent text-[12px] flex-1 outline-none" />
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-background text-muted-foreground">⌘F</span>
          </div>
          <div className="flex items-center bg-muted rounded-md p-0.5">
            <button onClick={() => setView("grid")} className={cn("w-7 h-7 rounded flex items-center justify-center", view === "grid" ? "bg-card shadow-sm" : "text-muted-foreground")}>
              <Grid3x3 size={13} />
            </button>
            <button onClick={() => setView("list")} className={cn("w-7 h-7 rounded flex items-center justify-center", view === "list" ? "bg-card shadow-sm text-brand" : "text-muted-foreground")}>
              <LayoutList size={13} />
            </button>
          </div>
        </div>

        {/* Header */}
        <div className="grid grid-cols-[40px_1.8fr_1fr_1fr_1fr_1fr_40px] gap-3 px-4 py-2.5 text-[10.5px] font-semibold uppercase tracking-wider text-muted-foreground border-b border-border">
          <div />
          <div>Commit / PR</div>
          <div>Author</div>
          <div>Date Pushed</div>
          <div>AI Tag</div>
          <div>Last Activity</div>
          <div>Risk</div>
        </div>

        {/* Rows */}
        {commits.map((c, i) => {
          const isSel = selected === i;
          return (
            <div
              key={i}
              onClick={() => setSelected(isSel ? null : i)}
              className={cn(
                "grid grid-cols-[40px_1.8fr_1fr_1fr_1fr_1fr_40px] gap-3 px-4 py-3 items-center border-b border-border last:border-b-0 cursor-pointer transition-colors",
                isSel ? "bg-row-selected" : "hover:bg-row-hover"
              )}
            >
              <div className="flex items-center justify-center">
                <div
                  className={cn(
                    "w-4 h-4 rounded border flex items-center justify-center",
                    isSel ? "bg-brand border-brand" : "border-border"
                  )}
                >
                  {isSel && <div className="w-2 h-2 bg-white rounded-sm" />}
                </div>
              </div>
              <div className="flex items-center gap-2.5 min-w-0">
                <div className={cn("w-7 h-7 rounded-md flex items-center justify-center shrink-0", c.iconColor)}>
                  <c.Icon size={13} />
                </div>
                <div className="min-w-0">
                  <div className="text-[13px] font-medium text-foreground truncate">{c.msg}</div>
                  <div className="text-[11px] text-muted-foreground">{c.hash}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <AvatarStack count={2} />
                <span className="text-[12px] text-foreground">{c.author}</span>
              </div>
              <div className="text-[12px] text-muted-foreground">{c.pushed}</div>
              <div>
                <span className={cn("text-[11px] font-medium px-2 py-1 rounded-md", tagStyles[c.tag])}>
                  [{c.tag}]
                </span>
              </div>
              <div className="text-[12px] text-muted-foreground">{c.lastActivity}</div>
              <div className="flex items-center gap-1">
                <span className={cn("text-[11px] font-medium px-1.5 py-0.5 rounded-md whitespace-nowrap", riskStyles[c.risk].c)}>
                  {riskStyles[c.risk].dot} {c.risk}
                </span>
                <button className="text-muted-foreground hover:text-foreground">
                  <MoreHorizontal size={14} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

/* ---------------- Bottom status bar ---------------- */
function BottomBar() {
  return (
    <div className="absolute left-0 right-0 bottom-0 bg-card border-t border-border px-6 py-3 flex items-center gap-3">
      <GitCommit size={14} className="text-brand" />
      <span className="text-[12px] text-foreground font-medium">feat: add payment gateway integration</span>
      <span className="text-[12px] text-muted-foreground">· 1.2MB diff · Sep 27, 2025</span>
      <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-red-950 text-red-300">High Risk 🔴</span>
      <div className="flex-1" />
      <button className="w-7 h-7 rounded hover:bg-muted flex items-center justify-center text-muted-foreground"><Share2 size={13} /></button>
      <button className="w-7 h-7 rounded hover:bg-muted flex items-center justify-center text-muted-foreground"><Link2 size={13} /></button>
      <button className="w-7 h-7 rounded hover:bg-muted flex items-center justify-center text-muted-foreground"><Trash2 size={13} /></button>
      <button className="w-7 h-7 rounded hover:bg-muted flex items-center justify-center text-muted-foreground"><Download size={13} /></button>
      <button className="w-7 h-7 rounded hover:bg-muted flex items-center justify-center text-muted-foreground"><MoreHorizontal size={13} /></button>
    </div>
  );
}

/* ---------------- Right AI Brief panel ---------------- */
const healthBars = [
  { label: "DORA Performance", val: 88, color: "bg-health-green" },
  { label: "Budget Health", val: 61, color: "bg-health-yellow" },
  { label: "Team Health", val: 70, color: "bg-health-yellow" },
  { label: "Security", val: 55, color: "bg-health-red" },
  { label: "Code Quality", val: 76, color: "bg-health-green" },
];

const team = [
  { name: "Ravi", status: "Active", color: "green", last: "2h ago", cost: "₹45K" },
  { name: "Priya", status: "Idle (3d)", color: "yellow", last: "3d ago", cost: "₹40K" },
  { name: "Arjun", status: "Active", color: "green", last: "5h ago", cost: "₹50K" },
];

function AIPanel() {
  return (
    <aside className="w-[340px] shrink-0 bg-card border-l border-border overflow-y-auto p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Sparkles size={16} className="text-brand" />
        <h3 className="font-semibold text-[15px] text-foreground">AI Weekly Brief</h3>
      </div>
      <p className="text-[11.5px] text-muted-foreground -mt-2">Week of Sep 28, 2025 — ShortFundly</p>

      {/* Summary */}
      <div className="rounded-xl bg-muted/50 p-3 text-[11.5px] text-foreground leading-relaxed">
        ✅ 12 commits  ·  3 PRs closed  ·  2 bugs fixed  ·  1 feature shipped
      </div>

      <div className="rounded-xl bg-yellow-50 border border-yellow-200 p-3 text-[12px] text-yellow-800 flex gap-2">
        <AlertTriangle size={14} className="shrink-0 mt-0.5" />
        PR #47 open 4 days — no reviewers assigned
      </div>

      <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-[12px] text-red-700">
        🔴 Burn this week: <span className="font-semibold">₹18,400</span> (21% above target)
      </div>

      <div className="rounded-xl bg-card-dark text-white p-3 text-[12px] flex gap-2">
        <Lightbulb size={14} className="text-brand shrink-0 mt-0.5" />
        <span>Priya idle 3 days. Reassign to auth module review.</span>
      </div>

      <div className="rounded-xl border border-border p-3">
        <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold mb-2">DORA</div>
        <div className="flex items-center justify-between text-[12px]">
          <span className="flex items-center gap-1 text-health-green"><TrendingUp size={13} /> Deploy Freq</span>
          <span className="flex items-center gap-1 text-health-green"><TrendingDown size={13} /> Lead Time</span>
          <span className="text-[11px] text-muted-foreground">Improving</span>
        </div>
      </div>

      {/* Health */}
      <div className="rounded-xl border border-border p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-[12px] text-muted-foreground">ShortFundly</div>
            <div className="text-[28px] font-bold text-foreground leading-none">74<span className="text-[14px] text-muted-foreground">/100</span></div>
          </div>
          <div className="w-12 h-12 rounded-full bg-health-yellow/20 flex items-center justify-center text-[18px]">🟡</div>
        </div>
        <div className="space-y-2">
          {healthBars.map((b) => (
            <div key={b.label}>
              <div className="flex justify-between text-[11px] mb-1">
                <span className="text-muted-foreground">{b.label}</span>
                <span className="font-medium text-foreground">{b.val}/100</span>
              </div>
              <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                <div className={cn("h-full rounded-full animate-fill", b.color)} style={{ width: `${b.val}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Burn rate */}
      <div className="rounded-xl border border-border p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[12px] font-semibold text-foreground">Burn Rate</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-100 text-red-600">+21%</span>
        </div>
        <div className="text-[11px] text-muted-foreground">Budget: ₹2,60,000 · Spent: ₹1,89,000</div>
        <div className="mt-2 h-2 rounded-full bg-muted overflow-hidden">
          <div className="h-full w-[73%] rounded-full bg-gradient-to-r from-health-green via-health-yellow to-health-red animate-fill" />
        </div>
        <div className="text-[11px] text-muted-foreground mt-2">Runway: 2.3 months remaining</div>
      </div>

      {/* Team */}
      <div className="rounded-xl border border-border p-4">
        <div className="text-[12px] font-semibold text-foreground mb-3">Team Status</div>
        <div className="space-y-2">
          {team.map((t) => (
            <div key={t.name} className="grid grid-cols-[1fr_auto_auto] items-center gap-3 text-[11.5px]">
              <div className="flex items-center gap-2">
                <span className={cn("w-2 h-2 rounded-full", t.color === "green" ? "bg-health-green" : "bg-health-yellow")} />
                <span className="text-foreground font-medium">{t.name}</span>
                <span className="text-muted-foreground">{t.status}</span>
              </div>
              <span className="text-muted-foreground">{t.last}</span>
              <span className="text-foreground font-medium">{t.cost}</span>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}

/* ---------------- Page ---------------- */
const Index = () => {
  const { dark, toggle } = useTheme();

  return (
    <div className="h-screen w-screen flex bg-background overflow-hidden">
      <IconRail />
      <MiddleSidebar />

      <main className="flex-1 flex flex-col min-w-0 relative">
        <TopBar dark={dark} onToggle={toggle} />

        <div className="flex flex-1 min-h-0">
          <div className="flex-1 overflow-y-auto">
            {/* Breadcrumb + actions */}
            <div className="flex items-center px-6 pt-5">
              <div className="flex items-center gap-1.5 text-[13px] text-muted-foreground">
                <span className="hover:text-foreground cursor-pointer">Projects</span>
                <span>/</span>
                <span className="hover:text-foreground cursor-pointer flex items-center gap-1">Overview <ChevronDown size={11} /></span>
                <span>/</span>
                <span className="text-foreground font-medium">Recent Activity</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-foreground text-background font-semibold">47</span>
              </div>
              <div className="flex-1" />
              <div className="flex items-center gap-2">
                <button className="h-8 px-3 rounded-md border border-border text-[12px] flex items-center gap-1.5 hover:bg-muted">
                  <SlidersHorizontal size={11} /> Filter <ChevronDown size={11} />
                </button>
                <button className="h-8 px-3 rounded-full bg-brand text-white text-[12px] font-medium flex items-center gap-1.5 shadow-brand hover:scale-[1.02] transition-transform">
                  <Plus size={12} /> New Project
                </button>
              </div>
            </div>

            <RecentlyAnalyzed />
            <ActiveProjects />
            <CommitsTable />
          </div>

          <AIPanel />
        </div>

        <BottomBar />
      </main>
    </div>
  );
};

export default Index;
