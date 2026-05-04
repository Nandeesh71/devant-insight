import React from 'react';
import { cn } from '@/lib/utils';
import { Database, Folder, ExternalLink, Github, Unplug, GitBranch, Star, Lock, Unlock } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export interface FolderCardProps {
  id: string;
  title: string;
  fullName: string;
  repoName?: string;
  repoFullPath?: string;
  isPrivate?: boolean;
  starCount?: number;
  lastCommitMessage?: string | null;
  lastCommitBranch?: string | null;
  lastCommitTime?: string | null;
  topContributors?: Array<{ login: string; avatarUrl: string }>;
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
  repoName,
  repoFullPath,
  isPrivate,
  starCount,
  lastCommitMessage,
  lastCommitTime,
  lastCommitBranch,
  topContributors,
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
          isActive
            ? "bg-[#6D28D9] border-[#6D28D9]"
            : "bg-[#F3E8FF] border-border/60"
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
            <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5" aria-hidden="true">
              <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
            </svg>
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
          <h3 className="flex max-w-full items-center gap-2 overflow-hidden whitespace-nowrap text-[14px] font-bold tracking-tight sm:text-[16px]">
            <span className="min-w-0 truncate">{repoName || title}</span>
            <span
              className={cn(
                "inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold",
                isPrivate ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"
              )}
            >
              {isPrivate ? <Lock size={10} strokeWidth={1.5} /> : <Unlock size={10} strokeWidth={1.5} />}
              {isPrivate ? 'Private' : 'Public'}
            </span>
          </h3>
          <p
            className={cn(
              "max-w-full overflow-hidden whitespace-nowrap text-[12px] font-medium sm:text-[13px]",
              isActive ? "text-white/70" : "text-muted-foreground"
            )}
          >
            {repoFullPath || fullName}
          </p>
          <p className={cn("max-w-full truncate text-[12px]", isActive ? "text-white/70" : "text-muted-foreground")}>{lastCommitMessage || '—'}</p>
          <p className={cn("flex items-center gap-1 max-w-full truncate text-[12px]", isActive ? "text-white/60" : "text-muted-foreground")}>
            <span>{lastCommitTime || '—'}</span>
            <span>on</span>
            <GitBranch size={12} strokeWidth={1.5} />
            <span>{lastCommitBranch || 'main'}</span>
          </p>
          <p className={cn("flex items-center gap-1 text-[12px]", isActive ? "text-white/60" : "text-muted-foreground")}>
            <Star size={12} strokeWidth={1.5} />
            <span>{typeof starCount === 'number' ? starCount : '—'}</span>
          </p>
        </div>

        {/* BOTTOM SECTION: Avatars & Score */}
        <div className="mt-6 flex items-center justify-between relative z-10">
          {/* Top contributors avatars */}
          <div className="flex -space-x-2">
            {(topContributors && topContributors.length > 0 ? topContributors.slice(0, 3) : []).map((c) => (
              <Avatar key={c.login} className="h-7 w-7 border-2 border-background">
                <AvatarImage src={c.avatarUrl} alt={c.login} />
                <AvatarFallback>{c.login.slice(0, 1).toUpperCase()}</AvatarFallback>
              </Avatar>
            ))}
          </div>

          {/* Health Score Badge */}
          <div className={cn(
            "flex items-center gap-2 rounded-full px-3 py-1 font-bold text-[13px]",
            isActive ? "bg-white/10 text-white" : "bg-black/5 dark:bg-white/10 text-foreground"
          )}>
            <span>{healthScore ?? ""}</span>
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
      <div className="absolute bottom-[100%] left-[-1px] h-4 w-[40%] min-w-[100px] bg-card border-t border-l border-border/50 rounded-t-xl" />
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
