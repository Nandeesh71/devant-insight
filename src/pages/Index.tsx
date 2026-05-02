import { useState } from "react";
import {
  LayoutGrid, Target, Download, Trash2, Bell, Plus, Settings, LogOut,
  Search, ChevronUp, ChevronRight, ChevronDown, Pencil, Folder, ArrowLeft,
  Sun, Moon, Info, SlidersHorizontal, MoreHorizontal, Share2, Link2,
  LayoutList, Grid3x3, Cloud, Lock, Users, Rocket, Sparkles, FileText,
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

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
  { icon: LayoutGrid, label: "Dashboard", active: true },
  { icon: Target, label: "Targets" },
  { icon: Download, label: "Downloads" },
  { icon: Trash2, label: "Trash" },
  { icon: Bell, label: "Alerts", badge: true },
];

function IconRail() {
  return (
    <TooltipProvider delayDuration={150}>
      <aside className="w-14 shrink-0 bg-rail flex flex-col items-center py-3 gap-1">
        <div className="w-9 h-9 rounded-xl bg-gradient-brand flex items-center justify-center text-white shadow-brand mb-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M2 12c5-5 15-5 20 0" />
            <path d="M5 16c3.5-3.5 10.5-3.5 14 0" />
            <path d="M9 19.5c1.5-1.5 4.5-1.5 6 0" />
          </svg>
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
                {it.badge && <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 ring-2 ring-rail" />}
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
          <TooltipContent side="right">New</TooltipContent>
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
type FolderNode = { name: string; children?: FolderNode[] };
const folders: FolderNode[] = [
  {
    name: "UI & UX Design",
    children: [
      { name: "Products Designs", children: [{ name: "Course Dashboard" }, { name: "KDS Dashboard" }] },
      { name: "Drapora Projects" },
    ],
  },
  { name: "Design Systems" },
  { name: "Web Apps" },
];

function TreeNode({ node, depth = 0, defaultOpen = false }: { node: FolderNode; depth?: number; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  const hasChildren = !!node.children?.length;
  const isLeaf = depth >= 2;

  return (
    <div>
      <button
        onClick={() => hasChildren && setOpen((v) => !v)}
        className={cn(
          "relative w-full flex items-center gap-2 h-8 rounded-md text-[12px] hover:bg-white/5 text-sidebar-text",
          depth === 0 ? "px-2" : "pl-4 pr-2"
        )}
        style={{ paddingLeft: depth === 0 ? 8 : 8 + depth * 14 }}
      >
        {depth > 0 && <span className="absolute left-0 top-1/2 w-3 h-px bg-sidebar-tree" style={{ left: depth * 14 - 6 }} />}
        {!isLeaf && <Folder size={13} className="text-sidebar-text shrink-0" />}
        <span className="flex-1 text-left truncate">{node.name}</span>
        {hasChildren && (open ? <ChevronUp size={12} /> : <ChevronRight size={12} />)}
        {!hasChildren && !isLeaf && <ChevronRight size={12} />}
      </button>
      {hasChildren && open && (
        <div className="relative">
          <div className="absolute top-0 bottom-2 w-px bg-sidebar-tree" style={{ left: depth * 14 + 14 }} />
          {node.children!.map((c) => (
            <TreeNode key={c.name} node={c} depth={depth + 1} defaultOpen={depth + 1 < 1} />
          ))}
        </div>
      )}
    </div>
  );
}

function MiddleSidebar() {
  const [overviewOpen, setOverviewOpen] = useState(true);

  return (
    <aside className="w-60 shrink-0 bg-sidebar-bg flex flex-col text-sidebar-text">
      <div className="flex items-center gap-2 px-3 pt-3 pb-2">
        <button className="w-7 h-7 rounded-md bg-white/5 hover:bg-white/10 flex items-center justify-center">
          <ArrowLeft size={14} className="text-white" />
        </button>
        <h2 className="text-white font-semibold text-[18px] flex-1">Dashboard</h2>
        <button className="w-7 h-7 rounded-md hover:bg-white/5 flex items-center justify-center">
          <Settings size={14} />
        </button>
      </div>

      <div className="px-3 pb-3">
        <div className="flex items-center gap-2 bg-sidebar-search rounded-lg px-2.5 h-8">
          <Search size={13} className="text-sidebar-label" />
          <input placeholder="Search" className="bg-transparent text-[12px] text-white placeholder:text-sidebar-label flex-1 outline-none" />
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-sidebar-label">⌘K</span>
        </div>
      </div>

      <div className="px-3 space-y-1">
        <button
          onClick={() => setOverviewOpen((v) => !v)}
          className="w-full flex items-center gap-2 bg-brand rounded-lg px-3 h-9 text-white text-[13px] font-medium shadow-brand"
        >
          <Cloud size={14} />
          <span className="flex-1 text-left">Overview</span>
          {overviewOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
        {overviewOpen && (
          <div className="pl-5 relative">
            <div className="absolute left-3 top-0 bottom-3 w-px bg-sidebar-tree" />
            <button className="relative flex items-center gap-2 w-full pl-3 pr-2 h-8 rounded-md hover:bg-white/5 text-[12px]">
              <span className="absolute left-0 top-1/2 w-3 h-px bg-sidebar-tree" />
              <span className="flex-1 text-left">My Overview</span>
              <ChevronRight size={12} />
            </button>
            <button className="relative flex items-center gap-2 w-full pl-3 pr-2 h-8 rounded-md bg-white/[0.04] text-[12px] text-white">
              <span className="absolute left-0 top-1/2 w-3 h-px bg-sidebar-tree" />
              <span className="flex-1 text-left">Recent Activity</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-black/40 text-sidebar-text">242</span>
            </button>
          </div>
        )}
      </div>

      <div className="px-3 mt-5 flex items-center justify-between">
        <span className="text-[10px] tracking-wider uppercase text-sidebar-label font-semibold">Starred Files</span>
        <button className="text-sidebar-label hover:text-white">
          <Pencil size={11} />
        </button>
      </div>

      <div className="px-3 mt-2 space-y-0.5 flex-1 overflow-y-auto scrollbar-hide">
        {folders.map((f, i) => (
          <TreeNode key={f.name} node={f} defaultOpen={i === 0} />
        ))}

        <button className="mt-3 w-full flex items-center justify-center gap-2 h-9 rounded-lg border border-dashed border-white/15 text-[12px] text-sidebar-text hover:bg-white/5 hover:text-white">
          <Plus size={13} /> New Folder
        </button>
      </div>

      {/* Trial banner */}
      <div className="m-3 rounded-2xl p-4 bg-gradient-upgrade relative overflow-hidden">
        <button className="absolute top-3 right-3 text-white/60 hover:text-white">
          <MoreHorizontal size={14} />
        </button>
        <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center mb-3">
          <Rocket size={20} className="text-orange-300" />
        </div>
        <div className="text-white font-semibold text-[14px]">Trial Ending Soon !</div>
        <p className="text-[11px] text-white/60 mt-1 leading-snug">
          Your access expires in 6 days. Upgrade now for access!
        </p>
        <button className="mt-3 w-full h-9 rounded-full bg-[hsl(var(--upgrade-btn))] text-white text-[12px] font-medium hover:brightness-110 flex items-center justify-center gap-1.5">
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
      <div className="w-8 h-8 rounded-full bg-gradient-storage flex items-center justify-center text-white shadow-md">
        <Cloud size={15} />
      </div>
      <div className="flex flex-col">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-[14px] text-foreground">Basic Storage</span>
          <span className="text-[12px] text-muted-foreground">50GB / 100GB</span>
        </div>
        <div className="h-1 w-32 bg-muted rounded-full mt-1 overflow-hidden">
          <div className="h-full w-1/2 bg-brand rounded-full animate-fill" />
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
        <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-red-500" />
      </button>
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-pink-500" />
    </div>
  );
}

/* ---------------- Avatar stack ---------------- */
function AvatarStack({ count = 3, extra }: { count?: number; extra?: number }) {
  const colors = ["from-orange-400 to-pink-500", "from-blue-400 to-indigo-500", "from-green-400 to-teal-500", "from-purple-400 to-fuchsia-500"];
  return (
    <div className="flex items-center -space-x-2">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={cn("w-6 h-6 rounded-full border-2 border-white bg-gradient-to-br", colors[i % colors.length])} />
      ))}
      {extra && (
        <div className="w-6 h-6 rounded-full border-2 border-white bg-accent text-accent-foreground text-[9px] font-semibold flex items-center justify-center">
          +{extra}
        </div>
      )}
    </div>
  );
}

/* ---------------- Recent edited ---------------- */
const recentCards = [
  { name: "Project Brief.docx", time: "Edited 12m ago", letter: "W", color: "bg-blue-500", dark: true, tip: true },
  { name: "Design Notes.docx", time: "Edited 45m ago", letter: "W", color: "bg-blue-500" },
  { name: "Project Details.xls", time: "Edited 50m ago", letter: "X", color: "bg-green-500" },
  { name: "Project Details.xls", time: "Edited 50m ago", letter: "X", color: "bg-green-500" },
  { name: "Cloud Dashboard.png", time: "Edited 1d ago", letter: "", color: "", thumb: true },
];

function RecentEdited() {
  return (
    <section className="px-6 pt-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-[15px] text-foreground">Recent edited</h3>
        <button className="text-[12px] text-muted-foreground hover:text-foreground flex items-center gap-1">
          View all <ChevronRight size={12} />
        </button>
      </div>
      <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
        {recentCards.map((c, i) => (
          <div
            key={i}
            className="group min-w-[200px] flex-1 bg-card rounded-xl border border-border shadow-card p-3 hover:shadow-lift transition-all hover:-translate-y-0.5"
          >
            <div className={cn(
              "relative h-24 rounded-lg mb-3 flex items-center justify-center overflow-hidden",
              c.dark ? "bg-[hsl(var(--card-dark))]" : "bg-muted/40"
            )}>
              {c.thumb ? (
                <div className="absolute inset-2 bg-card rounded-md p-1.5 flex gap-1">
                  <div className="flex-1 space-y-1">
                    <div className="h-1.5 w-3/4 bg-muted rounded" />
                    <div className="h-1 w-full bg-muted rounded" />
                    <div className="h-1 w-2/3 bg-muted rounded" />
                    <div className="h-3 w-1/3 bg-orange-300/60 rounded mt-1" />
                  </div>
                  <div className="w-8 bg-gradient-to-b from-orange-200 to-pink-200 rounded" />
                </div>
              ) : (
                <div className={cn("w-9 h-9 rounded-full text-white text-[12px] font-semibold flex items-center justify-center", c.color)}>
                  {c.letter}
                </div>
              )}
              {c.tip && (
                <div className="absolute opacity-0 group-hover:opacity-100 transition bg-foreground text-background text-[11px] px-2.5 py-1 rounded-md">
                  See details
                </div>
              )}
            </div>
            <div className="flex items-start justify-between">
              <div className="min-w-0">
                <div className="text-[13px] font-medium text-foreground truncate">{c.name}</div>
                <div className="text-[11px] text-muted-foreground mt-0.5">{c.time}</div>
              </div>
              <button className="text-muted-foreground hover:text-foreground shrink-0">
                <MoreHorizontal size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ---------------- Folder icon glyphs ---------------- */
function FigmaGlyph() {
  return (
    <div className="w-7 h-9 relative">
      <div className="absolute top-0 left-0 w-3 h-3 rounded-full bg-red-500" />
      <div className="absolute top-0 right-0 w-3 h-3 rounded-full bg-orange-400" />
      <div className="absolute top-3 left-0 w-3 h-3 rounded-l-full bg-purple-500" />
      <div className="absolute top-3 right-0 w-3 h-3 rounded-full bg-blue-500" />
      <div className="absolute top-6 left-0 w-3 h-3 rounded-bl-full bg-green-500" />
    </div>
  );
}
function SketchGlyph() {
  return (
    <div className="w-8 h-8 relative">
      <svg viewBox="0 0 24 24" className="w-full h-full">
        <path d="M12 2 L22 9 L12 22 L2 9 Z" fill="#FDB300" />
        <path d="M12 2 L22 9 L12 9 Z" fill="#FDAD00" />
        <path d="M2 9 L12 9 L12 2 Z" fill="#FDAD00" />
        <path d="M12 9 L22 9 L12 22 Z" fill="#EA6C00" />
        <path d="M2 9 L12 9 L12 22 Z" fill="#FDAD00" />
      </svg>
    </div>
  );
}

/* ---------------- Shared Folders ---------------- */
const folderCards = [
  { name: "Dashboard Designs", meta: "62 files, 2.6 GB", dark: true, glyph: "figma", extra: undefined as number | undefined },
  { name: "Figma Files", meta: "202 files, 2.6 GB", glyph: "figma", extra: 12 },
  { name: "Project Details.xls", meta: "12 files, 502 GB", glyph: "figma" },
  { name: "Project Documents", meta: "12 files, 502 MB", glyph: "figma" },
  { name: "KDS Dashboard", meta: "12 Sketch files, 52.4 MB", glyph: "sketch" },
  { name: "Mobile App - UI", meta: "102 files, 3.2 GB", glyph: "sketch" },
];

function SharedFolders() {
  return (
    <section className="px-6 pt-8">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-[15px] text-foreground">Shared Folders</h3>
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
        {folderCards.map((f) => (
          <div
            key={f.name}
            className={cn(
              "group relative min-w-[200px] flex-1 rounded-2xl p-4 transition-all hover:-translate-y-0.5 hover:shadow-lift overflow-hidden border",
              f.dark ? "bg-gradient-card-dark text-white border-white/5" : "bg-[hsl(var(--card-light))] border-border text-foreground"
            )}
          >
            {/* layered folder backdrop */}
            <div className={cn("absolute -top-2 right-2 w-20 h-16 rounded-xl rotate-6", f.dark ? "bg-white/5" : "bg-brand/10")} />
            <div className={cn("absolute top-0 right-6 w-20 h-16 rounded-xl -rotate-3", f.dark ? "bg-white/10" : "bg-brand/15")} />

            <div className="relative flex items-center justify-between">
              {f.glyph === "figma" ? <FigmaGlyph /> : <SketchGlyph />}
            </div>

            <div className="relative mt-10">
              <div className={cn("text-[14px] font-semibold truncate", f.dark ? "text-white" : "text-foreground")}>
                {f.name}
              </div>
              <div className={cn("text-[11.5px] mt-0.5", f.dark ? "text-white/60" : "text-muted-foreground")}>
                {f.meta}
              </div>
              <div className="mt-3">
                <AvatarStack count={3} extra={f.extra} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ---------------- Files Table ---------------- */
type FileRow = {
  name: string; share: "Shared" | "Restricted"; sharers: 2 | 3;
  Icon: typeof FileText; iconBg: string; iconColor: string;
  uploaded: string; lateUploaded: string; modified: string; size: string;
};

const files: FileRow[] = [
  { name: "Project Brief.docx", share: "Shared", sharers: 3, Icon: FileText, iconBg: "bg-blue-100", iconColor: "text-blue-600", uploaded: "Sep 26, 2025", lateUploaded: "Sep 28, 2025", modified: "Sep 28, 2025", size: "5 MB" },
  { name: "Project Details.xls", share: "Shared", sharers: 3, Icon: FileText, iconBg: "bg-green-100", iconColor: "text-green-600", uploaded: "Sep 27, 2025", lateUploaded: "Sep 27, 2025", modified: "Sep 27, 2025", size: "1.2 MB" },
  { name: "Cloud Dashboard.fig", share: "Restricted", sharers: 2, Icon: FileText, iconBg: "bg-purple-100", iconColor: "text-purple-600", uploaded: "Sep 28, 2025", lateUploaded: "Sep 27, 2025", modified: "Sep 28, 2025", size: "1 GB" },
  { name: "Design Notes.docx", share: "Shared", sharers: 2, Icon: FileText, iconBg: "bg-blue-100", iconColor: "text-blue-600", uploaded: "Sep 1, 2025", lateUploaded: "Sep 27, 2025", modified: "Sep 28, 2025", size: "20 MB" },
];

function FilesTable() {
  const [tab, setTab] = useState<"opened" | "docs" | "folders">("opened");
  const [view, setView] = useState<"list" | "grid">("list");
  const [selected, setSelected] = useState<number | null>(1);

  const tabs = [
    { key: "opened" as const, label: "Recently Opened" },
    { key: "docs" as const, label: "Shared Documents" },
    { key: "folders" as const, label: "Shared Folders" },
  ];

  return (
    <section className="px-6 pt-8 pb-32">
      <div className="bg-card rounded-2xl border border-border shadow-card">
        <div className="flex items-center gap-2 p-3 border-b border-border">
          <div className="flex items-center gap-1.5">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={cn(
                  "h-8 px-3 rounded-full text-[12px] font-medium flex items-center gap-1.5 transition",
                  tab === t.key ? "bg-brand text-white shadow-brand" : "text-muted-foreground hover:bg-muted"
                )}
              >
                {tab === t.key && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                {t.label}
              </button>
            ))}
          </div>
          <div className="flex-1" />
          <div className="flex items-center gap-2 bg-muted rounded-md px-2.5 h-8 w-56">
            <Search size={12} className="text-muted-foreground" />
            <input placeholder="Search files..." className="bg-transparent text-[12px] flex-1 outline-none" />
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

        <div className="grid grid-cols-[40px_2fr_1fr_1fr_1fr_1fr_0.8fr_40px] gap-3 px-4 py-2.5 text-[10.5px] font-semibold uppercase tracking-wider text-muted-foreground border-b border-border">
          <div />
          <div>File Name</div>
          <div>Owner</div>
          <div>Date Uploaded</div>
          <div>Late Uploaded</div>
          <div>Last Modified</div>
          <div>File Size</div>
          <div />
        </div>

        {files.map((f, i) => {
          const isSel = selected === i;
          return (
            <div
              key={i}
              onClick={() => setSelected(isSel ? null : i)}
              className={cn(
                "grid grid-cols-[40px_2fr_1fr_1fr_1fr_1fr_0.8fr_40px] gap-3 px-4 py-3 items-center border-b border-border last:border-b-0 cursor-pointer transition-colors",
                isSel ? "bg-[hsl(var(--row-selected))]" : "hover:bg-[hsl(var(--row-hover))]"
              )}
            >
              <div className="flex items-center justify-center">
                <div className={cn("w-4 h-4 rounded border flex items-center justify-center", isSel ? "bg-brand border-brand" : "border-border")}>
                  {isSel && <div className="w-2 h-2 bg-white rounded-sm" />}
                </div>
              </div>
              <div className="flex items-center gap-2.5 min-w-0">
                <div className={cn("w-7 h-8 rounded-md flex items-center justify-center shrink-0", f.iconBg, f.iconColor)}>
                  <f.Icon size={14} />
                </div>
                <div className="min-w-0">
                  <div className="text-[13px] font-medium text-foreground truncate">{f.name}</div>
                  <div className="text-[11px] text-muted-foreground flex items-center gap-1">
                    {f.share}
                    {f.share === "Restricted" ? <Lock size={9} /> : <Users size={9} />}
                  </div>
                </div>
              </div>
              <div><AvatarStack count={f.sharers} /></div>
              <div className="text-[12px] text-muted-foreground">{f.uploaded}</div>
              <div className="text-[12px] text-muted-foreground">{f.lateUploaded}</div>
              <div className="text-[12px] text-muted-foreground">{f.modified}</div>
              <div className="text-[12px] text-foreground font-medium">{f.size}</div>
              <button className="text-muted-foreground hover:text-foreground flex justify-center">
                <MoreHorizontal size={14} />
              </button>
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
      <div className="w-6 h-6 rounded bg-purple-100 text-purple-600 flex items-center justify-center">
        <FileText size={12} />
      </div>
      <span className="text-[12px] text-foreground font-medium">Cloud Dashboard.fig</span>
      <span className="text-[12px] text-muted-foreground">· 1.5 GB · Sep 28, 2025</span>
      <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-foreground text-background flex items-center gap-1">
        Restricted <Lock size={9} />
      </span>
      <div className="flex-1" />
      <button className="w-7 h-7 rounded hover:bg-muted flex items-center justify-center text-muted-foreground"><Share2 size={13} /></button>
      <button className="w-7 h-7 rounded hover:bg-muted flex items-center justify-center text-muted-foreground"><Link2 size={13} /></button>
      <button className="w-7 h-7 rounded hover:bg-muted flex items-center justify-center text-muted-foreground"><Trash2 size={13} /></button>
      <button className="w-7 h-7 rounded hover:bg-muted flex items-center justify-center text-muted-foreground"><Download size={13} /></button>
      <button className="w-7 h-7 rounded hover:bg-muted flex items-center justify-center text-muted-foreground"><MoreHorizontal size={13} /></button>
    </div>
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

        <div className="flex-1 overflow-y-auto">
          <div className="flex items-center px-6 pt-5">
            <div className="flex items-center gap-1.5 text-[13px] text-muted-foreground">
              <span className="hover:text-foreground cursor-pointer">Dashboard</span>
              <span>/</span>
              <span className="hover:text-foreground cursor-pointer flex items-center gap-1">Overview <ChevronDown size={11} /></span>
              <span>/</span>
              <span className="text-foreground font-medium">Recent Activity</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-foreground text-background font-semibold">242</span>
            </div>
            <div className="flex-1" />
            <div className="flex items-center gap-2">
              <button className="h-8 px-3 rounded-md border border-border text-[12px] flex items-center gap-1.5 hover:bg-muted">
                <SlidersHorizontal size={11} /> Short <ChevronDown size={11} />
              </button>
              <button className="h-8 px-3 rounded-full bg-brand text-white text-[12px] font-medium flex items-center gap-1.5 shadow-brand hover:scale-[1.02] transition-transform">
                <Plus size={12} /> Create
              </button>
            </div>
          </div>

          <RecentEdited />
          <SharedFolders />
          <FilesTable />
        </div>

        <BottomBar />
      </main>
    </div>
  );
};

export default Index;
