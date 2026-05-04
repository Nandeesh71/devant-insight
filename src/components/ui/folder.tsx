import React from 'react';
import { cn } from '@/lib/utils';
import { Database, Folder, ExternalLink, Github, Unplug, GitBranch } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

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
  commits,
  budget,
  healthScore,
  repoUrl,
  commitsUrl,
  isActive,
  onSelect,
  onDisconnect,
  className
}: FolderCardProps) {
  // Determine if health is good/bad based on score
  const isGoodHealth = (healthScore ?? 0) >= 80;
  const isWarningHealth = (healthScore ?? 0) >= 60 && (healthScore ?? 0) < 80;
  const isCriticalHealth = (healthScore ?? 0) < 60;

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") onSelect?.(); }}
      className={cn(
        "group relative flex w-full min-h-[180px] cursor-pointer flex-col outline-none transition-all duration-300 ease-out",
        "hover:-translate-y-1 hover:shadow-xl",
        className
      )}
    >
      {/* 
        THE FOLDER CARD 
        We use a main container that represents the body of the folder.
        The tab is created using absolute positioning above the body.
      */}
      <div className={cn(
        "relative w-full h-full flex flex-col rounded-2xl rounded-tl-none border shadow-sm p-5 mt-4",
        isActive 
          ? "bg-[#1A1832] border-[#2D2A4A] text-white" 
          : "bg-card border-border/60 text-foreground"
      )}>
        
        {/* THE TAB */}
        <div className={cn(
          "absolute bottom-[100%] left-[-1px] h-4 w-[40%] min-w-[100px] border-t border-l rounded-t-xl z-0",
          "after:absolute after:content-[''] after:bottom-0 after:left-[100%] after:w-4 after:h-4",
          "after:border-r after:rounded-br-xl",
          isActive
            ? "bg-[#6D28D9] border-[#6D28D9] after:border-[#6D28D9] after:shadow-[-8px_8px_0_#6D28D9]"
            : "bg-[#F3E8FF] border-border/60 after:border-border/60 after:shadow-[-8px_8px_0_#F3E8FF]"
        )} />
        
        {/* Disconnect Button (Top Right) */}
        <div className="absolute right-3 top-3 z-30 opacity-0 group-hover:opacity-100 transition-opacity">
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

        {/* TOP SECTION: Icon & Links */}
        <div className="flex items-start justify-between relative z-10 mb-4">
          <div className={cn(
            "flex h-10 w-10 items-center justify-center rounded-xl",
            isActive ? "bg-[#6D28D9] text-white" : "bg-[#F3E8FF] text-[#6D28D9]"
          )}>
            <GitBranch size={20} strokeWidth={2} />
          </div>

          <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              type="button"
              disabled={!repoUrl}
              onClick={(e) => { e.stopPropagation(); if (repoUrl) window.open(repoUrl, "_blank", "noopener,noreferrer"); }}
              className="flex h-7 w-7 items-center justify-center rounded-full bg-black/5 dark:bg-white/10 text-muted-foreground hover:text-foreground disabled:opacity-40"
            >
              <Github size={12} strokeWidth={2} />
            </button>
            <button
              type="button"
              disabled={!commitsUrl}
              onClick={(e) => { e.stopPropagation(); if (commitsUrl) window.open(commitsUrl, "_blank", "noopener,noreferrer"); }}
              className="flex h-7 w-7 items-center justify-center rounded-full bg-black/5 dark:bg-white/10 text-muted-foreground hover:text-foreground disabled:opacity-40"
            >
              <ExternalLink size={12} strokeWidth={2} />
            </button>
          </div>
        </div>

        {/* MIDDLE SECTION: Title & Stats */}
        <div className="flex-1 space-y-1 relative z-10">
          <h3 className="truncate text-[16px] font-bold tracking-tight">
            {title}
          </h3>
          <p className={cn(
            "text-[13px] font-medium",
            isActive ? "text-white/70" : "text-muted-foreground"
          )}>
            {commits} commits <span className="mx-1 opacity-50">•</span> {budget || "No budget"}
          </p>
        </div>

        {/* BOTTOM SECTION: Avatars & Score */}
        <div className="mt-6 flex items-center justify-between relative z-10">
          {/* Mock Avatars - matching the image */}
          <div className="flex -space-x-2">
            <Avatar className="h-7 w-7 border-2 border-background">
              <AvatarImage src="https://i.pravatar.cc/100?img=1" />
              <AvatarFallback>A</AvatarFallback>
            </Avatar>
            <Avatar className="h-7 w-7 border-2 border-background">
              <AvatarImage src="https://i.pravatar.cc/100?img=2" />
              <AvatarFallback>B</AvatarFallback>
            </Avatar>
            <Avatar className="h-7 w-7 border-2 border-background">
              <AvatarImage src="https://i.pravatar.cc/100?img=3" />
              <AvatarFallback>C</AvatarFallback>
            </Avatar>
          </div>

          {/* Health Score Badge */}
          <div className={cn(
            "flex items-center gap-2 rounded-full px-3 py-1 font-bold text-[13px]",
            isActive ? "bg-white/10 text-white" : "bg-black/5 dark:bg-white/10 text-foreground"
          )}>
            <span>{healthScore ?? "—"}</span>
            <span className={cn(
              "h-2 w-2 rounded-full",
              isGoodHealth ? "bg-emerald-500" : isWarningHealth ? "bg-amber-500" : isCriticalHealth ? "bg-red-500" : "bg-muted"
            )} />
          </div>
        </div>
      </div>
    </article>
  );
}

export function FolderSkeleton() {
  return (
    <div className="relative w-full min-h-[180px] flex flex-col outline-none mt-4">
      <div className="absolute bottom-[100%] left-[-1px] h-4 w-[40%] min-w-[100px] bg-card border-t border-l border-border/50 rounded-t-xl after:absolute after:bottom-0 after:left-[100%] after:w-4 after:h-4 after:border-r after:border-border/50 after:rounded-br-xl after:shadow-[-8px_8px_0_hsl(var(--card))]" />
      <div className="w-full h-full rounded-2xl rounded-tl-none bg-card border border-border/50 shadow-sm flex flex-col p-5">
        <div className="h-10 w-10 rounded-xl bg-muted animate-pulse mb-4" />
        <div className="space-y-2 flex-1">
          <div className="h-5 w-32 bg-muted animate-pulse rounded-md" />
          <div className="h-4 w-48 bg-muted animate-pulse rounded-md" />
        </div>
        <div className="mt-6 flex items-center justify-between">
          <div className="flex -space-x-2">
            <div className="h-7 w-7 rounded-full bg-muted animate-pulse border-2 border-background" />
            <div className="h-7 w-7 rounded-full bg-muted animate-pulse border-2 border-background" />
          </div>
          <div className="h-6 w-12 bg-muted animate-pulse rounded-full" />
        </div>
      </div>
    </div>
  );
}
