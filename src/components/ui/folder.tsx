import React from 'react';
import { cn } from '@/lib/utils';
import { Database, Folder, ExternalLink, Github, Unplug, GitBranch } from 'lucide-react';

export interface FolderCardProps {
  id: string;
  title: string;
  fullName: string;
  commits: number;
  budget?: string | null;
  spent?: number;
  healthScore?: number;
  riskLevel?: string;
  repoUrl?: string | null;
  commitsUrl?: string | null;
  isActive?: boolean;
  onSelect?: () => void;
  onDisconnect?: () => void;
  className?: string;
}

export function FolderCard({
  title,
  fullName,
  commits,
  budget,
  spent,
  healthScore,
  riskLevel = "Low",
  repoUrl,
  commitsUrl,
  isActive,
  onSelect,
  onDisconnect,
  className
}: FolderCardProps) {
  return (
    <article
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") onSelect?.(); }}
      className={cn(
        "group relative flex w-full aspect-[4/3] min-h-[240px] cursor-pointer flex-col outline-none",
        className
      )}
    >
      <div className="relative w-full h-full flex flex-col items-center justify-center [perspective:1500px] z-10">
        
        {/* BACK FOLDER COVER (work-5) */}
        <div className={cn(
          "absolute inset-0 w-full h-full origin-top rounded-2xl rounded-tl-none transition-all ease-out duration-300",
          "bg-card border border-border/60 shadow-sm",
          "group-hover:shadow-[0_20px_40px_rgba(0,0,0,.08)] dark:group-hover:shadow-[0_20px_40px_rgba(0,0,0,.3)]",
          // The Tab
          "after:absolute after:content-[''] after:bottom-[99%] after:left-[-1px] after:w-28 after:h-5",
          "after:bg-card after:border-t after:border-l after:border-border/60 after:rounded-t-xl",
          // The Tab curve
          "before:absolute before:content-[''] before:-top-[19px] before:left-[111px] before:w-5 before:h-5",
          "before:bg-card before:border-r before:border-border/60 before:[clip-path:polygon(0_0,0_100%,100%_100%)]",
          isActive ? "ring-2 ring-brand ring-offset-2 ring-offset-background" : ""
        )}>
          {/* Action Button (Disconnect) */}
          <div className="absolute right-3 top-3 z-30">
            <button
              type="button"
              aria-label="Disconnect repository"
              title="Disconnect repository"
              onClick={(e) => { e.stopPropagation(); onDisconnect?.(); }}
              className="flex h-7 w-7 items-center justify-center rounded-[7px] border border-transparent bg-transparent text-muted-foreground transition-colors duration-150 ease-out hover:border-[#fecaca] hover:bg-[#fff1f2] hover:text-[#ef4444]"
            >
              <Unplug size={14} strokeWidth={1.5} />
            </button>
          </div>

          {/* BACK CONTENT (Revealed on hover) */}
          <div className="absolute inset-0 pt-8 px-5 pb-5 flex flex-col opacity-0 transition-opacity duration-300 delay-100 group-hover:opacity-100 z-20 pointer-events-none">
            <div className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1.5"><Database size={12} /> Insights</div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[13px] text-muted-foreground">Health</span>
                <span className="text-[13px] font-semibold text-foreground">{healthScore ?? "—"}/100</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[13px] text-muted-foreground">Budget</span>
                <span className="text-[13px] font-semibold text-foreground">{budget ?? "Not set"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[13px] text-muted-foreground">Risk</span>
                <span className={cn(
                  "text-[12px] px-2 py-0.5 rounded-full font-semibold",
                  riskLevel?.toLowerCase().includes("high") ? "bg-destructive/10 text-destructive" :
                  riskLevel?.toLowerCase().includes("medium") ? "bg-accent text-brand" : "bg-muted text-muted-foreground"
                )}>{riskLevel}</span>
              </div>
            </div>
          </div>
        </div>

        {/* INNER PAPER 3 (work-4) */}
        <div className="absolute inset-x-2 top-2 bottom-4 bg-muted/60 border border-border/50 rounded-xl transition-all ease-out duration-300 origin-bottom select-none group-hover:[transform:rotateX(-12deg)] z-10" />
        
        {/* INNER PAPER 2 (work-3) */}
        <div className="absolute inset-x-2 top-2 bottom-4 bg-muted/80 border border-border/50 rounded-xl transition-all ease-out duration-300 origin-bottom group-hover:[transform:rotateX(-22deg)] z-10" />
        
        {/* INNER PAPER 1 (work-2) */}
        <div className="absolute inset-x-2 top-2 bottom-4 bg-background border border-border/80 shadow-sm rounded-xl transition-all ease-out duration-300 origin-bottom group-hover:[transform:rotateX(-32deg)] z-10 flex flex-col p-4 opacity-0 group-hover:opacity-100">
           <div className="h-2 w-1/3 bg-muted rounded-full mb-3" />
           <div className="h-2 w-full bg-muted/50 rounded-full mb-2" />
           <div className="h-2 w-4/5 bg-muted/50 rounded-full" />
        </div>

        {/* FRONT FLAP (work-1) */}
        <div className={cn(
          "absolute bottom-0 w-full h-[85%] rounded-2xl rounded-tr-none border border-border bg-card shadow-sm",
          "transition-all ease-out duration-300 origin-bottom z-20 flex flex-col",
          // The Tab on the right side of the front flap
          "after:absolute after:content-[''] after:bottom-[99%] after:right-[-1px] after:w-[60%] after:h-[18px]",
          "after:bg-card after:border-t after:border-r after:border-border after:rounded-t-xl",
          "before:absolute before:content-[''] before:-top-[17px] before:right-[calc(60%-2px)] before:w-4 before:h-4",
          "before:bg-card before:border-l before:border-border before:[clip-path:polygon(0_100%,100%_0,100%_100%)]",
          "group-hover:[transform:rotateX(-48deg)_translateY(2px)] group-hover:shadow-[0_-10px_30px_rgba(0,0,0,0.05)]",
          "dark:group-hover:shadow-[0_-10px_30px_rgba(0,0,0,0.2)]"
        )}>
          {/* FRONT CONTENT */}
          <div className="w-full h-full flex flex-col p-5 relative overflow-hidden rounded-2xl rounded-tr-none">
            {/* The Tab overlay line to fix border artifacts */}
            <div className="absolute top-0 right-0 w-[60%] h-[1px] bg-card -mt-[1px] z-10" />

            {/* Header */}
            <div className="flex items-start justify-between gap-3 relative z-10">
              <div className="flex h-[42px] w-[42px] items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Folder size={20} strokeWidth={1.5} className="fill-primary/20" />
              </div>
            </div>

            {/* Title */}
            <div className="mt-4 space-y-1 relative z-10">
              <h3 className="truncate text-[15px] font-semibold text-foreground tracking-tight">{title}</h3>
              <p className="truncate text-[12px] text-muted-foreground">{fullName}</p>
            </div>

            {/* Badges */}
            <div className="mt-4 inline-flex w-fit items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-2.5 py-1 text-[11px] font-semibold text-primary relative z-10">
              <GitBranch size={12} strokeWidth={2} />
              <span>{commits} commits</span>
            </div>

            {/* Footer / Links */}
            <div className="mt-auto flex items-center gap-2 pt-4 relative z-10">
              <button
                type="button"
                aria-label="Open GitHub repository"
                disabled={!repoUrl}
                onClick={(e) => { e.stopPropagation(); if (repoUrl) window.open(repoUrl, "_blank", "noopener,noreferrer"); }}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-card text-muted-foreground transition-colors duration-150 ease-out hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Github size={14} strokeWidth={1.5} />
              </button>
              <button
                type="button"
                aria-label="Open commit history"
                disabled={!commitsUrl}
                onClick={(e) => { e.stopPropagation(); if (commitsUrl) window.open(commitsUrl, "_blank", "noopener,noreferrer"); }}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-card text-muted-foreground transition-colors duration-150 ease-out hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ExternalLink size={14} strokeWidth={1.5} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

export function FolderSkeleton() {
  return (
    <div className="relative w-full aspect-[4/3] min-h-[240px] flex flex-col outline-none">
      <div className="w-full h-full rounded-2xl bg-card border border-border/50 shadow-sm relative flex flex-col p-5">
        <div className="absolute bottom-[99%] left-[-1px] w-28 h-5 bg-card border-t border-l border-border/50 rounded-t-xl" />
        <div className="absolute -top-[19px] left-[111px] w-5 h-5 bg-card border-r border-border/50 [clip-path:polygon(0_0,0_100%,100%_100%)]" />
        
        <div className="h-[42px] w-[42px] rounded-xl bg-muted animate-pulse" />
        <div className="mt-4 space-y-2">
          <div className="h-4 w-32 bg-muted animate-pulse rounded-md" />
          <div className="h-3 w-48 bg-muted animate-pulse rounded-md" />
        </div>
        <div className="mt-4 h-6 w-24 bg-muted animate-pulse rounded-full" />
        
        <div className="mt-auto flex items-center gap-2 pt-4">
          <div className="h-8 w-8 bg-muted animate-pulse rounded-full" />
          <div className="h-8 w-8 bg-muted animate-pulse rounded-full" />
        </div>
      </div>
    </div>
  );
}
