import { useMemo, useState } from "react";
import {
  LayoutGrid, GitBranch, GitPullRequest, Trash2, Bell, Plus, Settings, LogOut,
  Search, ChevronUp, ChevronRight, ChevronDown, Pencil, Folder, ArrowLeft,
  Sun, Moon, Info, SlidersHorizontal, MoreHorizontal, Share2, Link2,
  List, Grid3x3, Activity, Sparkles, Bug, Zap, RefreshCw, Code2,
  LayoutDashboard, Layers, Smartphone, GitCommit, Lock, Users, PlusCircle,
  Download, X, AlertTriangle, CheckCircle2, Clock, Shield, UserCog, Eye, ExternalLink,
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useDevantData } from "@/hooks/useDevantData";
import { LoadingSpinner, ErrorBanner } from "@/components/StatusBanners";
import { apiClient } from "@/lib/apiClient";
import { useProject } from "@/context/ProjectContext";
import { useRole } from "@/context/RoleContext";
import {
  projectsSeed, commitsSeed, prsSeed, deploysSeed, doraSeed, alertsSeed, aiBriefSeed, teamSeed,
  type SeedProject, type SeedCommit, type Role,
} from "@/data/seed";
import { toast } from "@/hooks/use-toast";

/* ---------------- Theme ---------------- */
function useTheme() {
  const [dark, setDark] = useState(false);
  const toggle = () => { const n = !dark; setDark(n); document.documentElement.classList.toggle("dark", n); };
  return { dark, toggle };
}

/* ---------------- Left icon rail ---------------- */
function IconRail({ tab, setTab, alertsCount, onAlertsClick }: { tab: string; setTab: (t: string) => void; alertsCount: number; onAlertsClick: () => void }) {
  const railTop = [
    { id: "portfolio", icon: LayoutGrid, label: "Portfolio" },
    { id: "commits", icon: GitBranch, label: "Commits" },
    { id: "prs", icon: GitPullRequest, label: "Pull Requests" },
    { id: "archived", icon: Trash2, label: "Archived" },
  ];
  return (
    <TooltipProvider delayDuration={150}>
      <aside className="w-14 shrink-0 bg-rail flex flex-col items-center py-3 gap-1">
        <div className="w-9 h-9 rounded-xl bg-gradient-brand flex items-center justify-center text-white text-xs font-bold shadow-brand mb-2">DA</div>
        {railTop.map((it) => {
          const active = tab === it.id;
          return (
            <Tooltip key={it.id}>
              <TooltipTrigger asChild>
                <button onClick={() => setTab(it.id)} className={cn("relative w-10 h-10 rounded-lg flex items-center justify-center transition-colors", active ? "bg-white/5 text-white" : "text-sidebar-text hover:text-white hover:bg-white/5")}>
                  {active && <span className="absolute -left-2 top-1.5 bottom-1.5 w-[3px] rounded-r bg-brand" />}
                  <it.icon size={20} />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" className="bg-rail text-white border-white/10">{it.label}</TooltipContent>
            </Tooltip>
          );
        })}
        <Tooltip>
          <TooltipTrigger asChild>
            <button onClick={onAlertsClick} className="relative w-10 h-10 rounded-lg flex items-center justify-center text-sidebar-text hover:text-white hover:bg-white/5">
              <Bell size={20} />
              {alertsCount > 0 && <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-red-500" />}
            </button>
          </TooltipTrigger>
          <TooltipContent side="right" className="bg-rail text-white border-white/10">AI Alerts ({alertsCount})</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <button onClick={() => setTab("portfolio")} className="mt-1 w-10 h-10 rounded-lg bg-white/5 text-sidebar-text hover:text-white flex items-center justify-center"><Plus size={20} /></button>
          </TooltipTrigger>
          <TooltipContent side="right" className="bg-rail text-white border-white/10">New Project</TooltipContent>
        </Tooltip>
        <div className="mt-auto flex flex-col gap-1">
          <button className="w-10 h-10 rounded-lg text-sidebar-text hover:text-white hover:bg-white/5 flex items-center justify-center"><Settings size={18} /></button>
          <button className="w-10 h-10 rounded-lg text-sidebar-text hover:text-white hover:bg-white/5 flex items-center justify-center"><LogOut size={18} /></button>
        </div>
      </aside>
    </TooltipProvider>
  );
}

/* ---------------- Sidebar tree ---------------- */
function MiddleSidebar({ projects, activeId, onSelect, onNewProject, onUpgrade }: { projects: SeedProject[]; activeId: string; onSelect: (id: string) => void; onNewProject: () => void; onUpgrade: () => void }) {
  const [query, setQuery] = useState("");
  const filtered = projects.filter((p) => p.name.toLowerCase().includes(query.toLowerCase()));
  const [openId, setOpenId] = useState<string | null>(activeId);

  return (
    <aside className="w-60 shrink-0 bg-sidebar-bg flex flex-col text-white">
      <div className="flex items-center gap-2 px-4 pt-4 pb-3">
        <button className="w-7 h-7 rounded-md bg-white/5 hover:bg-white/10 flex items-center justify-center"><ArrowLeft size={14} /></button>
        <h2 className="flex-1 font-semibold text-[15px]">Projects</h2>
        <button className="text-sidebar-text hover:text-white"><Settings size={16} /></button>
      </div>
      <div className="px-3 pb-3">
        <div className="flex items-center gap-2 bg-[hsl(var(--sidebar-search))] rounded-lg px-3 py-2">
          <Search size={14} className="text-sidebar-text" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search projects..." className="flex-1 bg-transparent text-[13px] placeholder:text-sidebar-label outline-none" />
          <span className="text-[10px] text-sidebar-label bg-black/30 px-1.5 py-0.5 rounded">⌘K</span>
        </div>
      </div>

      <div className="px-3 space-y-1">
        <button className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-brand text-white font-semibold text-sm shadow-brand">
          <LayoutGrid size={14} /><span className="flex-1 text-left">Overview</span><ChevronUp size={14} />
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

      <div className="flex items-center justify-between px-5 mt-5 mb-1">
        <span className="text-[10px] tracking-wider uppercase text-sidebar-label font-semibold">Active Projects</span>
        <button className="text-sidebar-label hover:text-white"><Pencil size={12} /></button>
      </div>

      <div className="px-3 flex-1 overflow-y-auto scrollbar-hide">
        {filtered.map((p) => {
          const open = openId === p.id;
          const active = activeId === p.id;
          return (
            <div key={p.id}>
              <button
                onClick={() => { onSelect(p.id); setOpenId(open ? null : p.id); }}
                className={cn("w-full flex items-center gap-2 py-1.5 px-2 rounded-md text-[13px] transition-colors",
                  active ? "text-white bg-white/5" : "text-sidebar-text hover:text-white hover:bg-white/5")}
              >
                <Folder size={14} className="text-sidebar-text shrink-0" />
                <span className="flex-1 text-left truncate">{p.name}</span>
                {open ? <ChevronUp size={14} /> : <ChevronRight size={14} />}
              </button>
              {open && (
                <div className="relative ml-4 border-l border-[hsl(var(--sidebar-tree))]">
                  <div className="py-1.5 pl-4 text-[12px] text-sidebar-text">main · {p.lastCommitAgo}</div>
                  <div className="py-1.5 pl-4 text-[12px] text-sidebar-text">{p.commitsCount} commits</div>
                </div>
              )}
            </div>
          );
        })}
        <button onClick={onNewProject} className="mt-3 w-full flex items-center justify-center gap-2 py-2 rounded-lg border border-dashed border-[#4A4A6A] text-[13px] text-sidebar-text hover:text-white hover:border-white/30">
          <PlusCircle size={14} /> New Project
        </button>
      </div>

      <div className="m-3 rounded-xl p-4 bg-gradient-upgrade relative overflow-hidden">
        <button className="absolute top-2 right-2 text-white/50 hover:text-white"><MoreHorizontal size={16} /></button>
        <div className="text-2xl mb-2">🚀</div>
        <div className="text-white font-bold text-sm">Upgrade to DevANT Pro</div>
        <div className="text-white/60 text-[11px] mt-1 mb-3">Unlock AI briefs, DORA metrics & screenshot diffs.</div>
        <button onClick={onUpgrade} className="w-full rounded-full py-2 bg-[#3D1F8C] hover:bg-[#4A26A8] text-white text-[13px] font-semibold flex items-center justify-center gap-1.5">
          <Sparkles size={13} /> Upgrade to Pro
        </button>
      </div>
    </aside>
  );
}

/* ---------------- Top bar ---------------- */
function TopBar({ dark, toggle, project, alertsCount, onBell, role, setRole }: { dark: boolean; toggle: () => void; project: SeedProject; alertsCount: number; onBell: () => void; role: Role; setRole: (r: Role) => void }) {
  const [open, setOpen] = useState(false);
  const pct = Math.round((project.budgetSpent / project.budgetTotal) * 100);
  return (
    <div className="flex items-center px-6 py-3 border-b border-border">
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#7C3AED] to-[#3B82F6] flex items-center justify-center text-white"><Activity size={16} /></div>
      <div className="ml-3">
        <div className="text-[15px] font-semibold text-foreground">{project.name}</div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[11px] text-muted-foreground">₹{(project.budgetSpent/100000).toFixed(2)}L / ₹{(project.budgetTotal/100000).toFixed(1)}L</span>
          <div className="h-1 w-28 bg-muted rounded-full overflow-hidden">
            <div className="h-1 bg-brand rounded-full animate-fill" style={{ width: `${pct}%` }} />
          </div>
        </div>
      </div>
      <div className="ml-auto flex items-center gap-1.5">
        <div className="relative">
          <button onClick={() => setOpen(!open)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border text-xs text-muted-foreground hover:bg-muted">
            <Shield size={12} /> {role} <ChevronDown size={12} />
          </button>
          {open && (
            <div className="absolute right-0 mt-1 w-48 bg-card border border-border rounded-lg shadow-lift z-30 py-1">
              {(["Owner","Project Manager","Developer","Viewer"] as Role[]).map((r) => (
                <button key={r} onClick={() => { setRole(r); setOpen(false); toast({ title: `Role: ${r}`, description: r === "Viewer" ? "Read-only mode enabled" : "Edit access enabled" }); }} className={cn("w-full text-left px-3 py-1.5 text-xs hover:bg-muted flex items-center gap-2", role === r && "text-brand font-semibold")}>
                  {r === "Owner" ? <Shield size={12} /> : r === "Project Manager" ? <UserCog size={12} /> : r === "Developer" ? <Code2 size={12} /> : <Eye size={12} />}
                  {r}
                </button>
              ))}
            </div>
          )}
        </div>
        <button onClick={toggle} className="w-9 h-9 rounded-full hover:bg-muted flex items-center justify-center text-muted-foreground">{dark ? <Moon size={16} /> : <Sun size={16} />}</button>
        <button className="w-9 h-9 rounded-full hover:bg-muted flex items-center justify-center text-muted-foreground"><Info size={16} /></button>
        <button onClick={onBell} className="relative w-9 h-9 rounded-full hover:bg-muted flex items-center justify-center text-muted-foreground">
          <Bell size={16} />
          {alertsCount > 0 && <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-red-500 rounded-full" />}
        </button>
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-300 to-pink-400" />
      </div>
    </div>
  );
}

/* ---------------- Recently Analyzed ---------------- */
function RecentlyAnalyzed({ commits, onOpen, onAiBrief }: { commits: SeedCommit[]; onOpen: (c: SeedCommit) => void; onAiBrief: () => void }) {
  const cards = commits.slice(0, 4);
  return (
    <section className="px-6 pt-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-[16px] text-foreground">Recently Analyzed</h3>
        <a className="text-sm text-brand cursor-pointer hover:underline">View all ›</a>
      </div>
      <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
        {cards.map((c, i) => (
          <button key={c.id} onClick={() => onOpen(c)} className="text-left group min-w-[170px] bg-card rounded-2xl border border-border p-3 shadow-card hover:-translate-y-0.5 hover:shadow-lift transition-all cursor-pointer">
            <div className={cn("h-20 rounded-xl mb-3 relative flex items-center justify-center", i === 0 ? "bg-[#1C1C2E]" : "bg-muted/40")}>
              <div className={cn("absolute top-2 left-2 w-7 h-7 rounded-full text-white text-[11px] font-bold flex items-center justify-center", c.tag === "Bug Fix" ? "bg-red-500" : c.tag === "Feature" ? "bg-emerald-500" : c.tag === "Refactor" ? "bg-blue-500" : "bg-gray-400")}>{c.author[0]}</div>
              {i === 0 && <span className="opacity-0 group-hover:opacity-100 transition bg-black/80 text-white text-[10px] px-2 py-1 rounded-full">View Report</span>}
            </div>
            <div className="flex items-start justify-between">
              <div className="min-w-0">
                <div className="text-[13px] font-semibold text-foreground truncate">{c.msg}</div>
                <div className="text-[11px] text-muted-foreground mt-0.5">Analyzed · {c.date}</div>
              </div>
            </div>
          </button>
        ))}
        <button onClick={onAiBrief} className="text-left min-w-[170px] bg-card rounded-2xl border border-border p-3 shadow-card hover:-translate-y-0.5 hover:shadow-lift transition-all cursor-pointer">
          <div className="h-20 rounded-xl mb-3 bg-accent flex items-center justify-center">
            <div className="absolute" />
            <Sparkles size={20} className="text-brand" />
          </div>
          <div className="text-[13px] font-semibold text-foreground truncate">Weekly AI Brief</div>
          <div className="text-[11px] text-muted-foreground mt-0.5">Generated 1d ago</div>
        </button>
      </div>
    </section>
  );
}

/* ---------------- Active Projects ---------------- */
function LayerArt({ dark = false }: { dark?: boolean }) {
  return (
    <div className="absolute -top-2 -right-2 w-20 h-16 pointer-events-none">
      <div className={cn("absolute right-0 top-3 w-16 h-10 rounded-xl rotate-6", dark ? "bg-purple-400/40" : "bg-purple-300/60")} />
      <div className={cn("absolute right-2 top-0 w-14 h-9 rounded-xl -rotate-3", dark ? "bg-purple-300/60" : "bg-purple-400/70")} />
      <div className={cn("absolute right-1 top-1 w-12 h-8 rounded-xl rotate-2", dark ? "bg-violet-200/80" : "bg-violet-500/80")} />
    </div>
  );
}
function ActiveProjects({ projects, activeId, onSelect, sort, setSort }: { projects: SeedProject[]; activeId: string; onSelect: (id: string) => void; sort: string; setSort: (s: string) => void }) {
  const [open, setOpen] = useState(false);
  const sorted = useMemo(() => {
    const a = [...projects];
    if (sort === "Health") a.sort((x, y) => y.health - x.health);
    else if (sort === "Budget") a.sort((x, y) => y.budgetSpent - x.budgetSpent);
    return a;
  }, [projects, sort]);
  return (
    <section className="px-6 pt-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-[16px] text-foreground">Active Projects</h3>
        <div className="flex items-center gap-3">
          <div className="relative">
            <button onClick={() => setOpen(!open)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border text-sm text-muted-foreground hover:bg-muted">
              <SlidersHorizontal size={13} /> {sort} <ChevronDown size={13} />
            </button>
            {open && (
              <div className="absolute right-0 mt-1 w-36 bg-card border border-border rounded-lg shadow-lift z-30 py-1">
                {["Newest", "Health", "Budget"].map((s) => (
                  <button key={s} onClick={() => { setSort(s); setOpen(false); }} className="w-full text-left px-3 py-1.5 text-xs hover:bg-muted">{s}</button>
                ))}
              </div>
            )}
          </div>
          <a className="text-sm text-brand cursor-pointer hover:underline">View all ›</a>
        </div>
      </div>
      <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
        {sorted.map((p) => {
          const isActive = p.id === activeId;
          return (
            <button key={p.id} onClick={() => onSelect(p.id)} className={cn("text-left relative overflow-hidden min-w-[170px] h-[130px] rounded-2xl p-4 flex flex-col justify-between cursor-pointer transition-all hover:-translate-y-0.5",
                p.dark ? "bg-[#2D2B55] text-white shadow-lift" : "bg-card border border-border shadow-card hover:shadow-lift",
                isActive && "ring-2 ring-brand")}>
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
                  <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded-full", p.dark ? "bg-white/10" : "bg-muted", p.healthColor)}>{p.health}</span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}

/* ---------------- Tabs table (Commits / PRs / Deployments) ---------------- */
function tagClass(tag: string) {
  const t = tag.toLowerCase();
  if (t.includes("bug")) return "bg-red-100 text-red-700";
  if (t.includes("feat")) return "bg-emerald-100 text-emerald-700";
  if (t.includes("refactor")) return "bg-blue-100 text-blue-700";
  if (t.includes("break")) return "bg-orange-100 text-orange-700";
  return "bg-gray-100 text-gray-600";
}
function riskClass(risk: string) {
  if (risk === "High") return "bg-red-100 text-red-700";
  if (risk === "Medium") return "bg-yellow-100 text-yellow-700";
  return "bg-emerald-100 text-emerald-700";
}
function tagIcon(tag: string) {
  const t = tag.toLowerCase();
  if (t.includes("bug")) return { I: Bug, bg: "bg-red-500" };
  if (t.includes("feat")) return { I: Zap, bg: "bg-emerald-500" };
  if (t.includes("refactor")) return { I: RefreshCw, bg: "bg-blue-500" };
  return { I: Settings, bg: "bg-gray-400" };
}

function TabsTable({
  tab, setTab, search, setSearch, commits, selectedId, setSelectedId, onOpen, projectId,
}: {
  tab: string; setTab: (t: string) => void; search: string; setSearch: (s: string) => void;
  commits: SeedCommit[]; selectedId: string; setSelectedId: (id: string) => void; onOpen: (c: SeedCommit) => void; projectId: string;
}) {
  const tabs = [
    { id: "commits", label: "Recent Commits" },
    { id: "prs", label: "Pull Requests" },
    { id: "deploys", label: "Deployments" },
  ];
  const filteredCommits = commits.filter((c) =>
    !search || c.msg.toLowerCase().includes(search.toLowerCase()) || c.author.toLowerCase().includes(search.toLowerCase()) || c.sha.includes(search)
  );
  const prs = prsSeed.filter((p) => p.projectId === projectId);
  const deploys = deploysSeed.filter((d) => d.projectId === projectId);

  return (
    <section className="px-6 pt-6 pb-24">
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          {tabs.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)} className={cn("px-4 py-1.5 rounded-full text-sm transition-colors", tab === t.id ? "bg-brand text-white font-semibold" : "text-muted-foreground hover:bg-muted")}>
              {tab === t.id && "✓ "}{t.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 bg-card border border-border rounded-lg px-3 py-1.5 w-64">
            <Search size={14} className="text-muted-foreground" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={`Search ${tab}...`} className="flex-1 bg-transparent text-sm outline-none" />
            <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">⌘F</span>
          </div>
          <button className="w-8 h-8 rounded-md text-muted-foreground hover:bg-muted flex items-center justify-center"><Grid3x3 size={16} /></button>
          <button className="w-8 h-8 rounded-md bg-muted text-foreground flex items-center justify-center"><List size={16} /></button>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        {tab === "commits" && (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wider text-muted-foreground border-b border-border">
                <th className="w-10 px-4 py-3"><input type="checkbox" className="rounded" /></th>
                <th className="py-3">Commit Message</th><th className="py-3">Author</th><th className="py-3">Date Pushed</th>
                <th className="py-3">AI Tag</th><th className="py-3">Risk Level</th><th className="py-3">Diff Size</th><th className="w-10" />
              </tr>
            </thead>
            <tbody>
              {filteredCommits.length === 0 && <tr><td colSpan={8} className="text-center py-8 text-muted-foreground text-sm">No commits found</td></tr>}
              {filteredCommits.map((c) => {
                const selected = c.id === selectedId;
                const { I, bg } = tagIcon(c.tag);
                return (
                  <tr key={c.id} onClick={() => { setSelectedId(c.id); }} onDoubleClick={() => onOpen(c)} className={cn("border-b border-border last:border-0 cursor-pointer transition-colors", selected ? "bg-[hsl(var(--row-selected))]" : "hover:bg-[hsl(var(--row-hover))]")}>
                    <td className="px-4 py-3">
                      <div className={cn("w-4 h-4 rounded border flex items-center justify-center", selected ? "bg-brand border-brand text-white" : "border-border bg-card")}>
                        {selected && <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                      </div>
                    </td>
                    <td className="py-3">
                      <div className="flex items-center gap-3">
                        <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center text-white", bg)}><I size={15} /></div>
                        <div>
                          <div className="text-[13px] font-semibold text-foreground">{c.msg}</div>
                          <div className="text-[11px] text-muted-foreground flex items-center gap-1">
                            Commit #{c.sha}
                            {c.restricted ? <><Lock size={10} className="ml-1" /> Restricted</> : <><Users size={10} className="ml-1" /> Shared</>}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3"><div className="flex items-center gap-2"><div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-300 to-pink-400" /><span className="text-[13px] text-foreground">{c.author}</span></div></td>
                    <td className="py-3 text-[13px] text-muted-foreground">{c.date}</td>
                    <td className="py-3"><span className={cn("text-[11px] font-semibold px-2 py-1 rounded-full", tagClass(c.tag))}>{c.tag}</span></td>
                    <td className="py-3"><span className={cn("text-[11px] font-semibold px-2 py-1 rounded-full", riskClass(c.risk))}>{c.risk === "High" ? "🔴 High" : c.risk === "Medium" ? "🟡 Medium" : "🟢 Low"}</span></td>
                    <td className="py-3 text-[13px] text-foreground">{c.size}</td>
                    <td className="py-3 pr-4 text-muted-foreground"><MoreHorizontal size={16} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
        {tab === "prs" && (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wider text-muted-foreground border-b border-border">
                <th className="px-4 py-3">PR</th><th className="py-3">Title</th><th className="py-3">Author</th><th className="py-3">Reviewer</th><th className="py-3">Age</th><th className="py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {prs.length === 0 && <tr><td colSpan={6} className="text-center py-8 text-muted-foreground text-sm">No open PRs</td></tr>}
              {prs.map((p) => (
                <tr key={p.id} className="border-b border-border last:border-0 hover:bg-[hsl(var(--row-hover))]">
                  <td className="px-4 py-3 text-[13px] font-mono text-foreground">#{p.id}</td>
                  <td className="py-3 text-[13px] font-semibold text-foreground">{p.title}</td>
                  <td className="py-3 text-[13px] text-foreground">{p.author}</td>
                  <td className="py-3 text-[13px] text-muted-foreground">{p.reviewer}</td>
                  <td className="py-3 text-[13px] text-muted-foreground">{p.ageHours < 24 ? `${p.ageHours}h` : `${Math.round(p.ageHours/24)}d`}</td>
                  <td className="py-3"><span className={cn("text-[11px] font-semibold px-2 py-1 rounded-full",
                    p.status === "Stale" ? "bg-yellow-100 text-yellow-700" :
                    p.status === "Conflict" ? "bg-red-100 text-red-700" :
                    p.status === "Ready" ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-blue-700")}>{p.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {tab === "deploys" && (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wider text-muted-foreground border-b border-border">
                <th className="px-4 py-3">Deployment</th><th className="py-3">Env</th><th className="py-3">SHA</th><th className="py-3">Deployed By</th><th className="py-3">When</th><th className="py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {deploys.length === 0 && <tr><td colSpan={6} className="text-center py-8 text-muted-foreground text-sm">No deployments</td></tr>}
              {deploys.map((d) => (
                <tr key={d.id} className="border-b border-border last:border-0 hover:bg-[hsl(var(--row-hover))]">
                  <td className="px-4 py-3 text-[13px] font-mono text-foreground">{d.id}</td>
                  <td className="py-3 text-[13px]"><span className={cn("text-[11px] font-semibold px-2 py-1 rounded-full", d.env === "production" ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700")}>{d.env}</span></td>
                  <td className="py-3 text-[13px] font-mono text-muted-foreground">{d.sha}</td>
                  <td className="py-3 text-[13px] text-foreground">{d.deployedBy}</td>
                  <td className="py-3 text-[13px] text-muted-foreground">{d.when}</td>
                  <td className="py-3"><span className={cn("text-[11px] font-semibold px-2 py-1 rounded-full",
                    d.status === "Success" ? "bg-emerald-100 text-emerald-700" :
                    d.status === "Failed" ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700")}>{d.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}

/* ---------------- Bottom bar ---------------- */
function BottomBar({ commit, onAction }: { commit: SeedCommit; onAction: (a: string) => void }) {
  const actions: [typeof Share2, string][] = [[Share2, "Share"], [Link2, "Copy Link"], [Trash2, "Discard"], [Download, "Export"], [MoreHorizontal, "More"]];
  return (
    <div className="absolute bottom-0 left-0 right-0 bg-card border-t border-border px-6 py-3 flex items-center gap-3">
      <GitCommit size={16} className="text-brand" />
      <span className="text-[13px] text-foreground">{commit.msg} · {commit.size} diff · {commit.date}</span>
      <span className="bg-[#1C1C2E] text-white text-[11px] font-semibold px-3 py-1 rounded-full">
        {commit.risk === "High" ? "High Risk 🔴" : commit.risk === "Medium" ? "Medium Risk 🟡" : "Low Risk 🟢"}
      </span>
      <div className="ml-auto flex items-center gap-1 text-muted-foreground">
        {actions.map(([I, label], i) => (
          <button key={i} onClick={() => onAction(label)} title={label} className="w-8 h-8 rounded-md hover:bg-muted flex items-center justify-center"><I size={16} /></button>
        ))}
      </div>
    </div>
  );
}

/* ---------------- Modals & Drawers ---------------- */
function Modal({ open, onClose, title, children, wide }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode; wide?: boolean }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={onClose}>
      <div className={cn("bg-card border border-border rounded-2xl shadow-lift w-full", wide ? "max-w-2xl" : "max-w-md")} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-3 border-b border-border">
          <h3 className="font-semibold text-foreground">{title}</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X size={16} /></button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

function CommitDrawer({ commit, onClose }: { commit: SeedCommit | null; onClose: () => void }) {
  if (!commit) return null;
  return (
    <div className="fixed inset-0 z-50 flex justify-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40" />
      <div className="relative w-[480px] max-w-full bg-card border-l border-border h-full overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <div>
            <div className="text-xs text-muted-foreground font-mono">#{commit.sha}</div>
            <h3 className="font-semibold text-foreground mt-0.5">{commit.msg}</h3>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X size={16} /></button>
        </div>
        <div className="p-5 space-y-4">
          <div className="flex flex-wrap gap-2">
            <span className={cn("text-[11px] font-semibold px-2 py-1 rounded-full", tagClass(commit.tag))}>{commit.tag}</span>
            <span className={cn("text-[11px] font-semibold px-2 py-1 rounded-full", riskClass(commit.risk))}>{commit.risk} Risk</span>
            <span className="text-[11px] font-semibold px-2 py-1 rounded-full bg-muted text-muted-foreground">{commit.size}</span>
          </div>
          <div className="rounded-xl bg-accent/40 border border-border p-3">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-brand mb-1.5"><Sparkles size={12} /> AI Summary</div>
            <p className="text-[13px] text-foreground leading-relaxed">{commit.aiSummary}</p>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded-lg border border-border p-2"><div className="text-xs text-muted-foreground">Files</div><div className="font-bold text-foreground">{commit.filesChanged}</div></div>
            <div className="rounded-lg border border-border p-2"><div className="text-xs text-muted-foreground">+ Added</div><div className="font-bold text-emerald-600">+{commit.linesAdded}</div></div>
            <div className="rounded-lg border border-border p-2"><div className="text-xs text-muted-foreground">- Removed</div><div className="font-bold text-red-600">-{commit.linesRemoved}</div></div>
          </div>
          <div className="rounded-xl border border-border p-3">
            <div className="text-xs text-muted-foreground mb-1">Author</div>
            <div className="flex items-center gap-2"><div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-300 to-pink-400" /><div><div className="text-sm font-semibold text-foreground">{commit.author}</div><div className="text-xs text-muted-foreground">{commit.date}</div></div></div>
          </div>
          <a className="flex items-center justify-center gap-1.5 text-sm text-brand hover:underline cursor-pointer"><ExternalLink size={13} /> View on GitHub</a>
        </div>
      </div>
    </div>
  );
}

function AlertsDrawer({ open, onClose, projectId }: { open: boolean; onClose: () => void; projectId: string }) {
  if (!open) return null;
  const list = alertsSeed.filter((a) => a.projectId === projectId);
  return (
    <div className="fixed inset-0 z-50 flex justify-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40" />
      <div className="relative w-[400px] max-w-full bg-card border-l border-border h-full overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <h3 className="font-semibold text-foreground flex items-center gap-2"><Bell size={16} /> AI Alerts</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X size={16} /></button>
        </div>
        <div className="p-4 space-y-2">
          {list.length === 0 && <div className="text-sm text-muted-foreground text-center py-8">No alerts for this project 🎉</div>}
          {list.map((a) => (
            <div key={a.id} className="rounded-xl border border-border p-3 flex items-start gap-3">
              {a.severity === "high" ? <AlertTriangle size={16} className="text-red-500 mt-0.5" /> : <Clock size={16} className="text-yellow-500 mt-0.5" />}
              <div className="flex-1">
                <div className="text-[13px] font-semibold text-foreground">{a.title}</div>
                <div className="text-[11px] text-muted-foreground mt-0.5">{a.severity === "high" ? "High severity" : "Medium severity"}</div>
              </div>
              <button onClick={() => toast({ title: "Acknowledged", description: a.title })} className="text-xs text-brand hover:underline">Ack</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function HealthFinanceDora({ project }: { project: SeedProject }) {
  const dora = doraSeed[project.id];
  const burnPct = Math.round((project.budgetSpent / project.budgetTotal) * 100);
  return (
    <section className="px-6 pt-6 grid grid-cols-1 md:grid-cols-3 gap-3">
      <div className="rounded-2xl border border-border bg-card p-4 shadow-card">
        <div className="text-xs text-muted-foreground mb-1">Project Health</div>
        <div className="flex items-end gap-2"><div className={cn("text-3xl font-bold", project.health >= 85 ? "text-emerald-500" : project.health >= 70 ? "text-yellow-500" : "text-red-500")}>{project.health}</div><div className="text-xs text-muted-foreground mb-1">/ 100</div></div>
        <div className="h-2 bg-muted rounded-full mt-2 overflow-hidden"><div className={cn("h-2 rounded-full", project.health >= 85 ? "bg-emerald-500" : project.health >= 70 ? "bg-yellow-500" : "bg-red-500")} style={{ width: `${project.health}%` }} /></div>
      </div>
      <div className="rounded-2xl border border-border bg-card p-4 shadow-card">
        <div className="text-xs text-muted-foreground mb-1">Budget · Burn · Runway</div>
        <div className="text-lg font-bold text-foreground">₹{(project.budgetSpent/100000).toFixed(2)}L <span className="text-xs text-muted-foreground font-normal">/ ₹{(project.budgetTotal/100000).toFixed(1)}L</span></div>
        <div className="h-2 bg-muted rounded-full mt-2 overflow-hidden"><div className="h-2 bg-brand rounded-full" style={{ width: `${burnPct}%` }} /></div>
        <div className="text-[11px] text-muted-foreground mt-1.5">{burnPct}% spent · {project.runwayMonths}mo runway</div>
      </div>
      <div className="rounded-2xl border border-border bg-card p-4 shadow-card">
        <div className="flex items-center justify-between mb-1"><div className="text-xs text-muted-foreground">DORA</div>{dora && <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded-full", dora.tier === "Elite" ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-blue-700")}>{dora.tier}</span>}</div>
        {dora ? (
          <div className="grid grid-cols-2 gap-1.5 text-[11px]">
            <div><div className="text-muted-foreground">Deploy Freq</div><div className="font-bold text-foreground">{dora.deploymentFreq}</div></div>
            <div><div className="text-muted-foreground">Lead Time</div><div className="font-bold text-foreground">{dora.leadTime}</div></div>
            <div><div className="text-muted-foreground">Failure Rate</div><div className="font-bold text-foreground">{dora.failureRate}</div></div>
            <div><div className="text-muted-foreground">Recovery</div><div className="font-bold text-foreground">{dora.recoveryTime}</div></div>
          </div>
        ) : <div className="text-xs text-muted-foreground">No DORA data yet</div>}
      </div>
    </section>
  );
}

/* ---------------- Page ---------------- */
export default function Index() {
  const { dark, toggle } = useTheme();
  const { loading, error, refetch } = useDevantData();
  const { projectId, setProjectId } = useProject();
  const { role, setRole, canEdit } = useRole();

  const projects = projectsSeed;
  const activeId = projectId && projects.find((p) => p.id === projectId) ? projectId : projects[0].id;
  if (!projectId) setProjectId(activeId);
  const activeProject = projects.find((p) => p.id === activeId)!;

  const projectCommits = commitsSeed.filter((c) => c.projectId === activeId);
  const [selectedId, setSelectedId] = useState<string>(projectCommits[0]?.id || "");
  const [tab, setTab] = useState("commits");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("Newest");
  const [drawerCommit, setDrawerCommit] = useState<SeedCommit | null>(null);
  const [showAlerts, setShowAlerts] = useState(false);
  const [showLink, setShowLink] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showBrief, setShowBrief] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const [riskFilter, setRiskFilter] = useState<string>("All");

  const visibleCommits = projectCommits.filter((c) => riskFilter === "All" || c.risk === riskFilter);
  const selected = visibleCommits.find((c) => c.id === selectedId) || visibleCommits[0];

  const alertsCount = alertsSeed.filter((a) => a.projectId === activeId).length;

  async function handleLinkRepo(repo: string) {
    if (!canEdit) { toast({ title: "Read-only", description: "Viewers cannot link repositories", variant: "destructive" }); return; }
    try {
      await apiClient.post("/api/github/link-repo", { project_id: activeId, repo }).catch(() => {});
      toast({ title: "Repository linked", description: `${repo} → ${activeProject.name}` });
      setShowLink(false);
      refetch();
    } catch (e) {
      toast({ title: "Link failed", description: (e as Error).message, variant: "destructive" });
    }
  }

  function handleNewProject(name: string) {
    if (!canEdit) { toast({ title: "Read-only", description: "Viewers cannot create projects", variant: "destructive" }); return; }
    toast({ title: "Project queued", description: `${name} will appear once GitHub repo is linked` });
    setShowNew(false);
  }

  function handleBottomAction(label: string) {
    if (label === "Discard" && !canEdit) { toast({ title: "Read-only", variant: "destructive" }); return; }
    if (label === "Copy Link" && selected) { navigator.clipboard?.writeText(`https://github.com/perceptronix/${activeProject.id}/commit/${selected.sha}`); toast({ title: "Link copied" }); return; }
    toast({ title: label, description: selected?.msg || "" });
  }

  return (
    <div className="h-screen w-full flex bg-background">
      <LoadingSpinner visible={loading} />
      <IconRail tab={tab === "deploys" ? "portfolio" : tab} setTab={(t) => setTab(t === "portfolio" ? "commits" : t === "prs" ? "prs" : t === "commits" ? "commits" : "commits")} alertsCount={alertsCount} onAlertsClick={() => setShowAlerts(true)} />
      <MiddleSidebar projects={projects} activeId={activeId} onSelect={(id) => { setProjectId(id); const c = commitsSeed.find((x) => x.projectId === id); if (c) setSelectedId(c.id); }} onNewProject={() => setShowNew(true)} onUpgrade={() => toast({ title: "DevANT Pro", description: "Talk to your Owner to upgrade." })} />
      <main className="flex-1 relative overflow-y-auto bg-card">
        <TopBar dark={dark} toggle={toggle} project={activeProject} alertsCount={alertsCount} onBell={() => setShowAlerts(true)} role={role} setRole={setRole} />
        <ErrorBanner error={error} onRetry={refetch} />
        <div className="px-6 pt-4 flex items-center justify-between flex-wrap gap-2">
          <div className="text-sm text-muted-foreground flex items-center gap-2">
            Projects <span className="text-muted">/</span>
            <span className="flex items-center gap-1">{activeProject.name} <ChevronDown size={13} /></span>
            <span className="text-muted">/</span> Recent Activity
            <span className="ml-1 bg-[#1C1C2E] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">{projectCommits.length}</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowLink(true)} disabled={!canEdit} className={cn("flex items-center gap-1.5 px-4 py-2 rounded-full border border-border text-sm hover:bg-muted", canEdit ? "text-muted-foreground" : "text-muted-foreground/50 cursor-not-allowed")}>
              <Link2 size={13} /> Link Repository
            </button>
            <div className="relative">
              <button onClick={() => setShowFilter(!showFilter)} className="flex items-center gap-1.5 px-4 py-2 rounded-full border border-border text-sm text-muted-foreground hover:bg-muted">
                <SlidersHorizontal size={13} /> Filter: {riskFilter} <ChevronDown size={13} />
              </button>
              {showFilter && (
                <div className="absolute right-0 mt-1 w-32 bg-card border border-border rounded-lg shadow-lift z-30 py-1">
                  {["All","High","Medium","Low"].map((r) => (
                    <button key={r} onClick={() => { setRiskFilter(r); setShowFilter(false); }} className="w-full text-left px-3 py-1.5 text-xs hover:bg-muted">{r}</button>
                  ))}
                </div>
              )}
            </div>
            <button onClick={() => setShowNew(true)} disabled={!canEdit} className={cn("flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold", canEdit ? "bg-brand text-white hover:opacity-90" : "bg-brand/40 text-white/70 cursor-not-allowed")}>
              <Plus size={14} /> New Project
            </button>
          </div>
        </div>

        <RecentlyAnalyzed commits={projectCommits} onOpen={(c) => setDrawerCommit(c)} onAiBrief={() => setShowBrief(true)} />
        {role !== "Developer" && <HealthFinanceDora project={activeProject} />}
        <ActiveProjects projects={projects} activeId={activeId} onSelect={(id) => setProjectId(id)} sort={sort} setSort={setSort} />
        <TabsTable tab={tab === "prs" ? "prs" : tab === "deploys" ? "deploys" : "commits"} setTab={setTab} search={search} setSearch={setSearch} commits={visibleCommits} selectedId={selected?.id || ""} setSelectedId={setSelectedId} onOpen={(c) => setDrawerCommit(c)} projectId={activeId} />
        {selected && <BottomBar commit={selected} onAction={handleBottomAction} />}
      </main>

      <CommitDrawer commit={drawerCommit} onClose={() => setDrawerCommit(null)} />
      <AlertsDrawer open={showAlerts} onClose={() => setShowAlerts(false)} projectId={activeId} />

      <Modal open={showLink} onClose={() => setShowLink(false)} title="Link a GitHub Repository">
        <p className="text-sm text-muted-foreground mb-3">Pick a repository to attach to <span className="font-semibold text-foreground">{activeProject.name}</span>. Webhook setup is automatic.</p>
        <div className="space-y-1.5">
          {["perceptronix/shortfundly","perceptronix/devant-backend","perceptronix/kds-dashboard","perceptronix/tensor-redesign"].map((r) => (
            <button key={r} onClick={() => handleLinkRepo(r)} className="w-full flex items-center justify-between px-3 py-2 rounded-lg border border-border hover:bg-muted text-sm">
              <span className="flex items-center gap-2"><GitBranch size={14} className="text-brand" /> {r}</span>
              <span className="text-xs text-brand">Link</span>
            </button>
          ))}
        </div>
        <a href="https://github.com/login/oauth/authorize" className="mt-3 flex items-center justify-center gap-1.5 text-xs text-muted-foreground hover:text-brand"><ExternalLink size={12} /> Reconnect GitHub OAuth</a>
      </Modal>

      <NewProjectModal open={showNew} onClose={() => setShowNew(false)} onCreate={handleNewProject} />

      <Modal open={showBrief} onClose={() => setShowBrief(false)} title="Weekly AI Brief" wide>
        <div className="rounded-xl bg-accent/40 border border-border p-4 mb-3">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-brand mb-2"><Sparkles size={12} /> Headline</div>
          <p className="text-base font-semibold text-foreground">{aiBriefSeed.headline}</p>
        </div>
        <ul className="space-y-2">
          {aiBriefSeed.bullets.map((b, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-foreground"><CheckCircle2 size={16} className="text-emerald-500 mt-0.5 shrink-0" />{b}</li>
          ))}
        </ul>
        <div className="mt-4 pt-3 border-t border-border text-xs text-muted-foreground">Team: {teamSeed.filter((t) => t.projectId === activeId).map((t) => t.name).join(", ") || "—"}</div>
      </Modal>
    </div>
  );
}

function NewProjectModal({ open, onClose, onCreate }: { open: boolean; onClose: () => void; onCreate: (name: string) => void }) {
  const [name, setName] = useState("");
  return (
    <Modal open={open} onClose={onClose} title="Create New Project">
      <label className="text-xs text-muted-foreground">Project name</label>
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Perceptronix Mobile" className="mt-1 w-full px-3 py-2 rounded-lg bg-muted border border-border text-sm outline-none focus:ring-2 focus:ring-brand" />
      <div className="flex gap-2 mt-4 justify-end">
        <button onClick={onClose} className="px-4 py-2 rounded-full text-sm text-muted-foreground hover:bg-muted">Cancel</button>
        <button onClick={() => name && onCreate(name)} disabled={!name} className="px-4 py-2 rounded-full bg-brand text-white text-sm font-semibold disabled:opacity-50">Create</button>
      </div>
    </Modal>
  );
}
