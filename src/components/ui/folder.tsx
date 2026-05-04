import React from 'react';
import { cn } from '@/lib/utils';
import { Folder, Github, Unplug, GitBranch, Star, Lock, Unlock } from 'lucide-react';
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
        "relative w-full h-full flex flex-col rounded-2xl rounded-tl-none border shadow-sm p-3 sm:p-5 mt-4 transition-colors",
        isActive 
          ? "bg-[#1A1832] border-[#6D28D9] text-white dark:bg-card dark:border-brand" 
          : "bg-[#1A1832] border-[#2D2A4A] text-white hover:bg-[#25224a] hover:border-[#3d386b] dark:bg-card dark:border-border/60 dark:text-foreground dark:hover:bg-muted/50"
      )}>
        
        {/* THE TAB */}
        <div className={cn(
          "absolute bottom-[100%] left-[-1px] h-4 w-[40%] min-w-[100px] border-t border-l rounded-t-xl z-0 transition-colors",
          isActive
            ? "bg-[#6D28D9] border-[#6D28D9] dark:bg-brand dark:border-brand"
            : "bg-[#6D28D9] border-[#6D28D9] opacity-80 group-hover:opacity-100 dark:bg-muted dark:border-border/60"
        )} />
        
        {/* TOP SECTION: Icon & Disconnect Button */}
        <div className="flex items-start justify-between relative z-10 mb-3 sm:mb-4">
          <div className={cn(
            "flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl transition-colors flex-shrink-0",
            isActive 
              ? "bg-[#6D28D9] text-white dark:bg-brand" 
              : "bg-[#6D28D9] text-white opacity-90 group-hover:opacity-100 dark:bg-brand/20 dark:text-brand"
          )}>
            <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true">
              <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
            </svg>
          </div>

          <div className="absolute top-2 right-2 sm:top-3 sm:right-3 z-30 flex flex-col gap-2 items-center opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              type="button"
              aria-label="Disconnect repository"
              title="Disconnect repository"
              onClick={(e) => { e.stopPropagation(); onDisconnect?.(); }}
              className="flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-[7px] border border-transparent bg-transparent text-white/50 transition-colors duration-150 ease-out hover:border-[#fecaca] hover:bg-[#fff1f2] hover:text-[#ef4444] dark:text-muted-foreground"
            >
              <Unplug size={12} strokeWidth={1.5} />
            </button>
          </div>
        </div>

        {/* MIDDLE SECTION: Title & Stats */}
        <div className="flex-1 space-y-0.5 sm:space-y-1 relative z-10 min-w-0">
          <div className="flex flex-wrap items-start gap-1 sm:gap-2">
            <h3 className="text-[13px] sm:text-[15px] font-bold tracking-tight text-white dark:text-foreground leading-tight break-words">
              {repoName || title}
            </h3>
            <span
              className={cn(
                "inline-flex flex-shrink-0 items-center gap-0.5 sm:gap-1 rounded-full px-1.5 sm:px-2 py-0.5 text-[9px] sm:text-[10px] font-semibold whitespace-nowrap",
                isPrivate ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"
              )}
            >
              {isPrivate ? <Lock size={8} strokeWidth={1.5} /> : <Unlock size={8} strokeWidth={1.5} />}
              <span>{isPrivate ? 'Private' : 'Public'}</span>
            </span>
          </div>
          <p className="overflow-hidden text-ellipsis whitespace-nowrap text-[11px] sm:text-[12px] font-medium text-white/70 dark:text-muted-foreground">
            {repoFullPath || fullName}
          </p>
          <p className="line-clamp-2 text-[11px] sm:text-[12px] text-white/70 dark:text-muted-foreground">
            {lastCommitMessage || '—'}
          </p>
          <p className="flex items-center gap-0.5 sm:gap-1 text-[10px] sm:text-[12px] text-white/60 dark:text-muted-foreground overflow-hidden text-ellipsis whitespace-nowrap">
            <span className="truncate">{lastCommitTime || '—'}</span>
            <span className="flex-shrink-0">on</span>
            <GitBranch size={10} strokeWidth={1.5} className="flex-shrink-0" />
            <span className="truncate">{lastCommitBranch || 'main'}</span>
          </p>
          <p className="flex items-center gap-0.5 sm:gap-1 text-[10px] sm:text-[12px] text-white/60 dark:text-muted-foreground">
            <Star size={10} strokeWidth={1.5} className="flex-shrink-0" />
            <span>{typeof starCount === 'number' ? starCount : '—'}</span>
          </p>
        </div>

        {/* BOTTOM SECTION: Avatars & GitHub Button */}
        <div className="mt-4 sm:mt-6 flex items-center justify-between gap-2 relative z-10 min-w-0">
          {/* Top contributors avatars */}
          <div className="flex -space-x-1.5 sm:-space-x-2 flex-shrink-0">
            {(topContributors && topContributors.length > 0 ? topContributors.slice(0, 3) : []).map((c) => (
              <Avatar key={c.login} className="h-6 w-6 sm:h-7 sm:w-7 border border-[#1A1832] dark:border-card group-hover:border-[#25224a] dark:group-hover:border-muted flex-shrink-0">
                <AvatarImage src={c.avatarUrl} alt={c.login} />
                <AvatarFallback className="text-[9px] sm:text-[10px]">{c.login.slice(0, 1).toUpperCase()}</AvatarFallback>
              </Avatar>
            ))}
          </div>

          <button
            type="button"
            aria-label="View repository on GitHub"
            title="View repository on GitHub"
            disabled={!repoUrl}
            onClick={(e) => { e.stopPropagation(); if (repoUrl) window.open(repoUrl, "_blank", "noopener,noreferrer"); }}
            className="ml-auto flex-shrink-0 inline-flex items-center gap-1 rounded-full bg-white/10 px-2 sm:px-3 py-1 text-[10px] sm:text-[12px] font-medium text-white/70 transition-colors hover:bg-white/20 hover:text-white disabled:opacity-40 dark:bg-white/5 dark:text-muted-foreground dark:hover:bg-white/10 dark:hover:text-foreground whitespace-nowrap"
          >
            <Github size={10} strokeWidth={2} className="flex-shrink-0" />
            <span>View</span>
            <span className="hidden sm:inline">on Github</span>
          </button>

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
