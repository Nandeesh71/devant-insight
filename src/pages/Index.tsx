import { useState } from "react";
import {
  LayoutGrid, GitBranch, GitPullRequest, Trash2, Bell, Plus, Settings, LogOut,
  Search, ChevronUp, ChevronRight, ChevronDown, Pencil, Folder, ArrowLeft,
  Sun, Moon, Info, SlidersHorizontal, MoreHorizontal, Share2, Link2,
  List, Grid3x3, Activity, Sparkles, Bug, Zap, RefreshCw, Code2,
  LayoutDashboard, Layers, Smartphone, GitCommit, Lock, Users, PlusCircle,
  Download,
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useDevantData } from "@/hooks/useDevantData";
import { LoadingSpinner, ErrorBanner } from "@/components/StatusBanners";
import { apiClient } from "@/lib/apiClient";
import { useProject } from "@/context/ProjectContext";

/* ---------------- Theme ---------------- */
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
  { icon: Trash2, label: "Archived" },
  { icon: Bell, label: "Alerts", badge: true },
];

function IconRail() {
  return (
    <TooltipProvider delayDuration={150}>
      <aside className="w-14 shrink-0 bg-rail flex flex-col items-center py-3 gap-1">
        <div className="w-9 h-9 rounded-xl bg-gradient-brand flex items-center justify-center text-white text-xs font-bold shadow-brand mb-2">
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
                {it.active && <span className="absolute -left-2 top-1.5 bottom-1.5 w-[3px] rounded-r bg-brand" />}
                <it.icon size={20} />
                {it.badge && <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-red-500" />}
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" className="bg-rail text-white border-white/10">{it.label}</TooltipContent>
          </Tooltip>
        ))}
        <Tooltip>
          <TooltipTrigger asChild>
            <button className="mt-1 w-10 h-10 rounded-lg bg-white/5 text-sidebar-text hover:text-white flex items-center justify-center">
              <Plus size={20} />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right" className="bg-rail text-white border-white/10">New Project</TooltipContent>
        </Tooltip>
        <div className="mt-auto flex flex-col gap-1">
          <button className="w-10 h-10 rounded-lg text-sidebar-text hover:text-white hover:bg-white/5 flex items-center justify-center">
            <Settings size={18} />
          </button>
          <button className="w-10 h-10 rounded-lg text-sidebar-text hover:text-white hover:bg-white/5 flex items-center justify-center">
            <LogOut size={18} />
          </button>
        </div>
      </aside>
    </TooltipProvider>
  );
}

/* ---------------- Sidebar tree ---------------- */
type TreeItem = { name: string; children?: TreeItem[]; badge?: string; leaf?: boolean };

const projectTree: TreeItem[] = [
  {
    name: "ShortFundly",
    children: [
      {
        name: "Repositories",
        children: [
          { name: "main", leaf: true },
          { name: "feature/auth", leaf: true },
        ],
      },
      { name: "Perceptronix App" },
    ],
  },
  { name: "KDS Dashboard" },
  { name: "Tensor Redesign" },
  { name: "Drapora Projects" },
];

function TreeNode({ item, depth = 0, defaultOpen = false }: { item: TreeItem; depth?: number; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  const hasChildren = !!item.children?.length;
  return (
    <div className="relative">
      <button
        onClick={() => hasChildren && setOpen(!open)}
        className="w-full flex items-center gap-2 py-1.5 px-2 rounded-md text-[13px] text-sidebar-text hover:text-white hover:bg-white/5 transition-colors"
        style={{ paddingLeft: 8 + depth * 14 }}
      >
        {hasChildren ? (
          <Folder size={14} className="text-sidebar-text shrink-0" />
        ) : item.leaf ? (
          <span className="w-3.5 shrink-0" />
        ) : (
          <Folder size={14} className="text-sidebar-text shrink-0" />
        )}
        <span className="flex-1 text-left truncate">{item.name}</span>
        {hasChildren && (open ? <ChevronUp size={14} /> : <ChevronRight size={14} />)}
      </button>
      {hasChildren && open && (
        <div className="relative ml-4 border-l border-[hsl(var(--sidebar-tree))]">
          {item.children!.map((c) => (
            <TreeNode key={c.name} item={c} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

function MiddleSidebar() {
  return (
    <aside className="w-60 shrink-0 bg-sidebar-bg flex flex-col text-white">
      {/* header */}
      <div className="flex items-center gap-2 px-4 pt-4 pb-3">
        <button className="w-7 h-7 rounded-md bg-white/5 hover:bg-white/10 flex items-center justify-center">
          <ArrowLeft size={14} />
        </button>
        <h2 className="flex-1 font-semibold text-[15px]">Projects</h2>
        <button className="text-sidebar-text hover:text-white"><Settings size={16} /></button>
      </div>

      {/* search */}
      <div className="px-3 pb-3">
        <div className="flex items-center gap-2 bg-[hsl(var(--sidebar-search))] rounded-lg px-3 py-2">
          <Search size={14} className="text-sidebar-text" />
          <input
            placeholder="Search projects..."
            className="flex-1 bg-transparent text-[13px] placeholder:text-sidebar-label outline-none"
          />
          <span className="text-[10px] text-sidebar-label bg-black/30 px-1.5 py-0.5 rounded">⌘K</span>
        </div>
      </div>

      {/* Overview active */}
      <div className="px-3 space-y-1">
        <button className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-brand text-white font-semibold text-sm shadow-brand">
          <LayoutGrid size={14} />
          <span className="flex-1 text-left">Overview</span>
          <ChevronUp size={14} />
        </button>
        <div className="relative ml-4 border-l border-[hsl(var(--sidebar-tree))] pl-1">
          <button className="w-full flex items-center justify-between py-1.5 px-2 text-[13px] text-sidebar-text hover:text-white">
            <span>My Projects</span><ChevronRight size={14} />
          </button>
          <button className="w-full flex items-center justify-between py-1.5 px-2 text-[13px] text-sidebar-text hover:text-white">
            <span>Recent Activity</span>
            <span className="text-[10px] bg-black/30 text-white px-1.5 py-0.5 rounded-full">47</span>
          </button>
        </div>
      </div>

      {/* Active Projects label */}
      <div className="flex items-center justify-between px-5 mt-5 mb-1">
        <span className="text-[10px] tracking-wider uppercase text-sidebar-label font-semibold">Active Projects</span>
        <button className="text-sidebar-label hover:text-white"><Pencil size={12} /></button>
      </div>

      <div className="px-3 flex-1 overflow-y-auto scrollbar-hide">
        <TreeNode item={projectTree[0]} defaultOpen />
        {projectTree.slice(1).map((p) => <TreeNode key={p.name} item={p} />)}

        <button className="mt-3 w-full flex items-center justify-center gap-2 py-2 rounded-lg border border-dashed border-[#4A4A6A] text-[13px] text-sidebar-text hover:text-white hover:border-white/30">
          <PlusCircle size={14} />
          New Project
        </button>
      </div>

      {/* Upgrade banner */}
      <div className="m-3 rounded-xl p-4 bg-gradient-upgrade relative overflow-hidden">
        <button className="absolute top-2 right-2 text-white/50 hover:text-white">
          <MoreHorizontal size={16} />
        </button>
        <div className="text-2xl mb-2">🚀</div>
        <div className="text-white font-bold text-sm">Upgrade to DevANT Pro</div>
        <div className="text-white/60 text-[11px] mt-1 mb-3">Unlock AI briefs, DORA metrics & screenshot diffs.</div>
        <button className="w-full rounded-full py-2 bg-[#3D1F8C] hover:bg-[#4A26A8] text-white text-[13px] font-semibold flex items-center justify-center gap-1.5">
          <Sparkles size={13} /> Upgrade to Pro
        </button>
      </div>
    </aside>
  );
}

/* ---------------- Top bar ---------------- */
function TopBar({ dark, toggle }: { dark: boolean; toggle: () => void }) {
  return (
    <div className="flex items-center px-6 py-3 border-b border-border">
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#7C3AED] to-[#3B82F6] flex items-center justify-center text-white">
        <Activity size={16} />
      </div>
      <div className="ml-3">
        <div className="text-[15px] font-semibold text-foreground">ShortFundly</div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[11px] text-muted-foreground">₹1.89L / ₹2.6L</span>
          <div className="h-1 w-28 bg-muted rounded-full overflow-hidden">
            <div className="h-1 bg-brand rounded-full animate-fill" style={{ width: "73%" }} />
          </div>
        </div>
      </div>
      <div className="ml-auto flex items-center gap-1.5">
        <button onClick={toggle} className="w-9 h-9 rounded-full hover:bg-muted flex items-center justify-center text-muted-foreground">
          {dark ? <Moon size={16} /> : <Sun size={16} />}
        </button>
        <button className="w-9 h-9 rounded-full hover:bg-muted flex items-center justify-center text-muted-foreground"><Info size={16} /></button>
        <button className="relative w-9 h-9 rounded-full hover:bg-muted flex items-center justify-center text-muted-foreground">
          <Bell size={16} />
          <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-red-500 rounded-full" />
        </button>
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-300 to-pink-400" />
      </div>
    </div>
  );
}

/* ---------------- Main content ---------------- */
const recentCards = [
  { title: "fix: auth token expiry", time: "Analyzed 8m ago", initial: "S", color: "bg-brand", dark: true },
  { title: "feat: payment gateway", time: "Analyzed 32m ago", initial: "P", color: "bg-indigo-500" },
  { title: "PR #47 — auth module", time: "Analyzed 1h ago", initial: "PR", color: "bg-orange-500" },
  { title: "refactor: middleware", time: "Analyzed 2h ago", initial: "K", color: "bg-emerald-500" },
  { title: "Weekly AI Brief", time: "Generated 1d ago", initial: "AI", color: "bg-brand", briefStyle: true },
];

function RecentlyAnalyzed() {
  return (
    <section className="px-6 pt-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-[16px] text-foreground">Recently Analyzed</h3>
        <a className="text-sm text-brand cursor-pointer hover:underline">View all ›</a>
      </div>
      <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
        {recentCards.map((c, i) => (
          <div key={i} className="group min-w-[170px] bg-card rounded-2xl border border-border p-3 shadow-card hover:-translate-y-0.5 hover:shadow-lift transition-all cursor-pointer">
            <div className={cn(
              "h-20 rounded-xl mb-3 relative flex items-center justify-center",
              c.dark ? "bg-[#1C1C2E]" : c.briefStyle ? "bg-accent" : "bg-muted/40"
            )}>
              <div className={cn("absolute top-2 left-2 w-7 h-7 rounded-full text-white text-[11px] font-bold flex items-center justify-center", c.color)}>
                {c.initial}
              </div>
              {c.dark && (
                <span className="opacity-0 group-hover:opacity-100 transition bg-black/80 text-white text-[10px] px-2 py-1 rounded-full">View Report</span>
              )}
            </div>
            <div className="flex items-start justify-between">
              <div className="min-w-0">
                <div className="text-[13px] font-semibold text-foreground truncate">{c.title}</div>
                <div className="text-[11px] text-muted-foreground mt-0.5">{c.time}</div>
              </div>
              <button className="text-muted-foreground"><MoreHorizontal size={14} /></button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* Active Projects */
const projects = [
  { name: "ShortFundly", meta: "47 commits · ₹2.6L budget", icon: GitBranch, dark: true, health: "74", healthColor: "text-yellow-400" },
  { name: "Perceptronix App", meta: "23 commits · ₹1.8L", icon: Code2, color: "text-brand", health: "88", healthColor: "text-emerald-500" },
  { name: "KDS Dashboard", meta: "18 commits · ₹90K", icon: LayoutDashboard, color: "text-amber-500", health: "91", healthColor: "text-emerald-500" },
  { name: "Tensor Redesign", meta: "9 commits · ₹45K", icon: Layers, color: "text-amber-500", health: "82", healthColor: "text-emerald-500" },
  { name: "Drapora Mobile", meta: "12 commits · 52K lines", icon: Smartphone, color: "text-amber-500", health: "79", healthColor: "text-yellow-400" },
  { name: "Znexus API", meta: "102 commits · 3.2GB", icon: Zap, color: "text-amber-500", health: "85", healthColor: "text-emerald-500" },
];

function LayerArt({ dark = false }: { dark?: boolean }) {
  return (
    <div className="absolute -top-2 -right-2 w-20 h-16 pointer-events-none">
      <div className={cn("absolute right-0 top-3 w-16 h-10 rounded-xl rotate-6", dark ? "bg-purple-400/40" : "bg-purple-300/60")} />
      <div className={cn("absolute right-2 top-0 w-14 h-9 rounded-xl -rotate-3", dark ? "bg-purple-300/60" : "bg-purple-400/70")} />
      <div className={cn("absolute right-1 top-1 w-12 h-8 rounded-xl rotate-2", dark ? "bg-violet-200/80" : "bg-violet-500/80")} />
    </div>
  );
}

function ActiveProjects() {
  return (
    <section className="px-6 pt-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-[16px] text-foreground">Active Projects</h3>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border text-sm text-muted-foreground hover:bg-muted">
            <SlidersHorizontal size={13} /> Newest <ChevronDown size={13} />
          </button>
          <a className="text-sm text-brand cursor-pointer hover:underline">View all ›</a>
        </div>
      </div>
      <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
        {projects.map((p) => (
          <div
            key={p.name}
            className={cn(
              "relative overflow-hidden min-w-[170px] h-[130px] rounded-2xl p-4 flex flex-col justify-between cursor-pointer transition-all hover:-translate-y-0.5",
              p.dark ? "bg-[#2D2B55] text-white shadow-lift" : "bg-card border border-border shadow-card hover:shadow-lift"
            )}
          >
            <LayerArt dark={p.dark} />
            <p.icon size={18} className={cn("relative z-10", p.dark ? "text-violet-300" : p.color)} />
            <div className="relative z-10">
              <div className={cn("text-[13px] font-bold", p.dark ? "text-white" : "text-foreground")}>{p.name}</div>
              <div className={cn("text-[11px] mt-0.5", p.dark ? "text-white/60" : "text-muted-foreground")}>{p.meta}</div>
              <div className="flex items-center justify-between mt-2">
                <div className="flex -space-x-1.5">
                  {["bg-pink-400", "bg-amber-400", "bg-cyan-400"].map((b, i) => (
                    <div key={i} className={cn("w-5 h-5 rounded-full border-2", b, p.dark ? "border-[#2D2B55]" : "border-white")} />
                  ))}
                </div>
                <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded-full", p.dark ? "bg-white/10" : "bg-muted", p.healthColor)}>
                  {p.health}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ---------------- Commits table ---------------- */
type Commit = {
  id: string; msg: string; sub: string; author: string; date: string;
  tag: string; tagClass: string; risk: string; riskClass: string; size: string;
  icon: any; iconBg: string; restricted?: boolean;
};

const commits: Commit[] = [
  { id: "a3f92c", msg: "fix: resolve auth token expiry", sub: "Commit #a3f92c", author: "Ravi", date: "Sep 26, 2025",
    tag: "Bug Fix", tagClass: "bg-red-100 text-red-700", risk: "🔴 High", riskClass: "bg-red-100 text-red-700",
    size: "2.1 MB", icon: Bug, iconBg: "bg-red-500", restricted: true },
  { id: "f8e21a", msg: "feat: add payment gateway", sub: "Commit #f8e21a", author: "Priya", date: "Sep 27, 2025",
    tag: "Feature", tagClass: "bg-emerald-100 text-emerald-700", risk: "🔴 High", riskClass: "bg-red-100 text-red-700",
    size: "1.2 MB", icon: Zap, iconBg: "bg-emerald-500" },
  { id: "c91d34", msg: "refactor: cleanup middleware", sub: "Commit #c91d34", author: "Arjun", date: "Sep 28, 2025",
    tag: "Refactor", tagClass: "bg-blue-100 text-blue-700", risk: "🟡 Medium", riskClass: "bg-yellow-100 text-yellow-700",
    size: "892 KB", icon: RefreshCw, iconBg: "bg-blue-500", restricted: true },
  { id: "44bc01", msg: "chore: update dependencies", sub: "Commit #44bc01", author: "Ravi", date: "Sep 1, 2025",
    tag: "Chore", tagClass: "bg-gray-100 text-gray-600", risk: "🟢 Low", riskClass: "bg-emerald-100 text-emerald-700",
    size: "20 KB", icon: Settings, iconBg: "bg-gray-400" },
];

function CommitsTable({ selectedId, setSelectedId }: { selectedId: string; setSelectedId: (id: string) => void }) {
  const [tab, setTab] = useState("commits");
  const tabs = [
    { id: "commits", label: "Recent Commits" },
    { id: "prs", label: "Pull Requests" },
    { id: "deploys", label: "Deployments" },
  ];
  return (
    <section className="px-6 pt-6 pb-24">
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "px-4 py-1.5 rounded-full text-sm transition-colors",
                tab === t.id ? "bg-brand text-white font-semibold" : "text-muted-foreground hover:bg-muted"
              )}
            >
              {tab === t.id && "✓ "}{t.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 bg-card border border-border rounded-lg px-3 py-1.5 w-64">
            <Search size={14} className="text-muted-foreground" />
            <input placeholder="Search commits..." className="flex-1 bg-transparent text-sm outline-none" />
            <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">⌘F</span>
          </div>
          <button className="w-8 h-8 rounded-md text-muted-foreground hover:bg-muted flex items-center justify-center"><Grid3x3 size={16} /></button>
          <button className="w-8 h-8 rounded-md bg-muted text-foreground flex items-center justify-center"><List size={16} /></button>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-wider text-muted-foreground border-b border-border">
              <th className="w-10 px-4 py-3"><input type="checkbox" className="rounded" /></th>
              <th className="py-3">Commit Message</th>
              <th className="py-3">Author</th>
              <th className="py-3">Date Pushed</th>
              <th className="py-3">AI Tag</th>
              <th className="py-3">Risk Level</th>
              <th className="py-3">Diff Size</th>
              <th className="w-10" />
            </tr>
          </thead>
          <tbody>
            {commits.map((c) => {
              const selected = c.id === selectedId;
              return (
                <tr
                  key={c.id}
                  onClick={() => setSelectedId(c.id)}
                  className={cn(
                    "border-b border-border last:border-0 cursor-pointer transition-colors",
                    selected ? "bg-[hsl(var(--row-selected))]" : "hover:bg-[hsl(var(--row-hover))]"
                  )}
                >
                  <td className="px-4 py-3">
                    <div
                      className={cn(
                        "w-4 h-4 rounded border flex items-center justify-center",
                        selected ? "bg-brand border-brand text-white" : "border-border bg-card"
                      )}
                    >
                      {selected && <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                    </div>
                  </td>
                  <td className="py-3">
                    <div className="flex items-center gap-3">
                      <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center text-white", c.iconBg)}>
                        <c.icon size={15} />
                      </div>
                      <div>
                        <div className="text-[13px] font-semibold text-foreground">{c.msg}</div>
                        <div className="text-[11px] text-muted-foreground flex items-center gap-1">
                          {c.sub}
                          {c.restricted ? <><Lock size={10} className="ml-1" /> Restricted</> : <><Users size={10} className="ml-1" /> Shared</>}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-300 to-pink-400" />
                      <span className="text-[13px] text-foreground">{c.author}</span>
                    </div>
                  </td>
                  <td className="py-3 text-[13px] text-muted-foreground">{c.date}</td>
                  <td className="py-3"><span className={cn("text-[11px] font-semibold px-2 py-1 rounded-full", c.tagClass)}>{c.tag}</span></td>
                  <td className="py-3"><span className={cn("text-[11px] font-semibold px-2 py-1 rounded-full", c.riskClass)}>{c.risk}</span></td>
                  <td className="py-3 text-[13px] text-foreground">{c.size}</td>
                  <td className="py-3 pr-4 text-muted-foreground"><MoreHorizontal size={16} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

/* ---------------- Bottom status bar ---------------- */
function BottomBar({ commit }: { commit: Commit }) {
  return (
    <div className="absolute bottom-0 left-0 right-0 bg-card border-t border-border px-6 py-3 flex items-center gap-3">
      <GitCommit size={16} className="text-brand" />
      <span className="text-[13px] text-foreground">
        {commit.msg} · {commit.size} diff · {commit.date}
      </span>
      <span className="bg-[#1C1C2E] text-white text-[11px] font-semibold px-3 py-1 rounded-full flex items-center gap-1">
        {commit.risk.includes("High") ? "High Risk 🔴" : commit.risk.includes("Medium") ? "Medium Risk 🟡" : "Low Risk 🟢"}
      </span>
      <div className="ml-auto flex items-center gap-1 text-muted-foreground">
        {[Share2, Link2, Trash2, Download, MoreHorizontal].map((I, i) => (
          <button key={i} className="w-8 h-8 rounded-md hover:bg-muted flex items-center justify-center"><I size={16} /></button>
        ))}
      </div>
    </div>
  );
}

/* ---------------- Page ---------------- */
export default function Index() {
  const { dark, toggle } = useTheme();
  const [selectedId, setSelectedId] = useState("f8e21a");
  const { loading, error, commits: apiCommits, refetch } = useDevantData();
  const { projectId } = useProject();

  // Map API commits onto the existing visual schema; fall back to seed data.
  const liveCommits: Commit[] =
    apiCommits && apiCommits.length
      ? apiCommits.map((c, i) => {
          const tag = (c.ai_type_tag || "Chore").toString();
          const risk = (c.ai_risk_flag || "low").toString().toLowerCase();
          const tagClass =
            tag.toLowerCase().includes("bug")
              ? "bg-red-100 text-red-700"
              : tag.toLowerCase().includes("feat")
              ? "bg-emerald-100 text-emerald-700"
              : tag.toLowerCase().includes("refactor")
              ? "bg-blue-100 text-blue-700"
              : "bg-gray-100 text-gray-600";
          const riskClass = risk.startsWith("h")
            ? "bg-red-100 text-red-700"
            : risk.startsWith("m")
            ? "bg-yellow-100 text-yellow-700"
            : "bg-emerald-100 text-emerald-700";
          const riskLabel = risk.startsWith("h") ? "🔴 High" : risk.startsWith("m") ? "🟡 Medium" : "🟢 Low";
          const Icon = tag.toLowerCase().includes("bug")
            ? Bug
            : tag.toLowerCase().includes("feat")
            ? Zap
            : tag.toLowerCase().includes("refactor")
            ? RefreshCw
            : Settings;
          const id = (c.sha || c.id || `c${i}`).toString().slice(0, 6);
          return {
            id,
            msg: c.message || c.ai_summary || "(no message)",
            sub: `Commit #${id}`,
            author: c.author || "—",
            date: c.date || "",
            tag,
            tagClass,
            risk: riskLabel,
            riskClass,
            size: c.diff_size?.toString() || "—",
            icon: Icon,
            iconBg:
              tag.toLowerCase().includes("bug")
                ? "bg-red-500"
                : tag.toLowerCase().includes("feat")
                ? "bg-emerald-500"
                : tag.toLowerCase().includes("refactor")
                ? "bg-blue-500"
                : "bg-gray-400",
          } as Commit;
        })
      : commits;

  const activeList = liveCommits;
  const selected = activeList.find((c) => c.id === selectedId) || activeList[0];

  const handleLinkRepo = async () => {
    try {
      const repos = await apiClient.get<unknown[]>("/api/github/repos");
      const first = (repos?.[0] as { id?: string; full_name?: string }) || null;
      if (first && projectId) {
        await apiClient.post("/api/github/link-repo", {
          project_id: projectId,
          repo: first.full_name || first.id,
        });
        refetch();
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="h-screen w-full flex bg-background">
      <LoadingSpinner visible={loading} />
      <IconRail />
      <MiddleSidebar />
      <main className="flex-1 relative overflow-y-auto bg-card">
        <TopBar dark={dark} toggle={toggle} />
        <ErrorBanner error={error} onRetry={refetch} />
        <div className="px-6 pt-4 flex items-center justify-between flex-wrap gap-2">
          <div className="text-sm text-muted-foreground flex items-center gap-2">
            Projects <span className="text-muted">/</span>
            <span className="flex items-center gap-1">Overview <ChevronDown size={13} /></span>
            <span className="text-muted">/</span> Recent Activity
            <span className="ml-1 bg-[#1C1C2E] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">47</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleLinkRepo} className="flex items-center gap-1.5 px-4 py-2 rounded-full border border-border text-sm text-muted-foreground hover:bg-muted">
              <Link2 size={13} /> Link Repository
            </button>
            <button className="flex items-center gap-1.5 px-4 py-2 rounded-full border border-border text-sm text-muted-foreground hover:bg-muted">
              <SlidersHorizontal size={13} /> Filter <ChevronDown size={13} />
            </button>
            <button className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-brand text-white text-sm font-semibold hover:opacity-90">
              <Plus size={14} /> New Project
            </button>
          </div>
        </div>
        <RecentlyAnalyzed />
        <ActiveProjects />
        <CommitsTableLive commits={activeList} selectedId={selectedId} setSelectedId={setSelectedId} />
        {selected && <BottomBar commit={selected} />}
      </main>
    </div>
  );
}

function CommitsTableLive({
  commits: list,
  selectedId,
  setSelectedId,
}: {
  commits: Commit[];
  selectedId: string;
  setSelectedId: (id: string) => void;
}) {
  // Re-use existing CommitsTable rendering by temporarily swapping the seed list.
  // Simpler: render a thin wrapper around CommitsTable using its prop signature.
  return <CommitsTableWithData data={list} selectedId={selectedId} setSelectedId={setSelectedId} />;
}

function CommitsTableWithData({
  data,
  selectedId,
  setSelectedId,
}: {
  data: Commit[];
  selectedId: string;
  setSelectedId: (id: string) => void;
}) {
  // Mirror of CommitsTable but uses provided data array.
  const [tab, setTab] = useState("commits");
  const tabs = [
    { id: "commits", label: "Recent Commits" },
    { id: "prs", label: "Pull Requests" },
    { id: "deploys", label: "Deployments" },
  ];
  return (
    <section className="px-6 pt-6 pb-24">
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "px-4 py-1.5 rounded-full text-sm transition-colors",
                tab === t.id ? "bg-brand text-white font-semibold" : "text-muted-foreground hover:bg-muted"
              )}
            >
              {tab === t.id && "✓ "}{t.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 bg-card border border-border rounded-lg px-3 py-1.5 w-64">
            <Search size={14} className="text-muted-foreground" />
            <input placeholder="Search commits..." className="flex-1 bg-transparent text-sm outline-none" />
            <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">⌘F</span>
          </div>
          <button className="w-8 h-8 rounded-md text-muted-foreground hover:bg-muted flex items-center justify-center"><Grid3x3 size={16} /></button>
          <button className="w-8 h-8 rounded-md bg-muted text-foreground flex items-center justify-center"><List size={16} /></button>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-wider text-muted-foreground border-b border-border">
              <th className="w-10 px-4 py-3"><input type="checkbox" className="rounded" /></th>
              <th className="py-3">Commit Message</th>
              <th className="py-3">Author</th>
              <th className="py-3">Date Pushed</th>
              <th className="py-3">AI Tag</th>
              <th className="py-3">Risk Level</th>
              <th className="py-3">Diff Size</th>
              <th className="w-10" />
            </tr>
          </thead>
          <tbody>
            {data.map((c) => {
              const selected = c.id === selectedId;
              return (
                <tr
                  key={c.id}
                  onClick={() => setSelectedId(c.id)}
                  className={cn(
                    "border-b border-border last:border-0 cursor-pointer transition-colors",
                    selected ? "bg-[hsl(var(--row-selected))]" : "hover:bg-[hsl(var(--row-hover))]"
                  )}
                >
                  <td className="px-4 py-3">
                    <div
                      className={cn(
                        "w-4 h-4 rounded border flex items-center justify-center",
                        selected ? "bg-brand border-brand text-white" : "border-border bg-card"
                      )}
                    >
                      {selected && <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                    </div>
                  </td>
                  <td className="py-3">
                    <div className="flex items-center gap-3">
                      <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center text-white", c.iconBg)}>
                        <c.icon size={15} />
                      </div>
                      <div>
                        <div className="text-[13px] font-semibold text-foreground">{c.msg}</div>
                        <div className="text-[11px] text-muted-foreground flex items-center gap-1">
                          {c.sub}
                          {c.restricted ? <><Lock size={10} className="ml-1" /> Restricted</> : <><Users size={10} className="ml-1" /> Shared</>}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-300 to-pink-400" />
                      <span className="text-[13px] text-foreground">{c.author}</span>
                    </div>
                  </td>
                  <td className="py-3 text-[13px] text-muted-foreground">{c.date}</td>
                  <td className="py-3"><span className={cn("text-[11px] font-semibold px-2 py-1 rounded-full", c.tagClass)}>{c.tag}</span></td>
                  <td className="py-3"><span className={cn("text-[11px] font-semibold px-2 py-1 rounded-full", c.riskClass)}>{c.risk}</span></td>
                  <td className="py-3 text-[13px] text-foreground">{c.size}</td>
                  <td className="py-3 pr-4 text-muted-foreground"><MoreHorizontal size={16} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

