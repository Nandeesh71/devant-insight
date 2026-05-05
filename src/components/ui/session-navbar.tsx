"use client";

import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import {
  Blocks,
  ChevronsUpDown,
  FileClock,
  GraduationCap,
  Layout,
  LayoutDashboard,
  LogOut,
  MessageSquareText,
  MessagesSquare,
  Moon,
  Plus,
  Settings,
  Sun,
  UserCircle,
  UserCog,
  UserSearch,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Link as RouterLink, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/context/AuthContext";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// ── Framer-motion variants (identical to reference sidebar.tsx) ──────────────

const sidebarVariants = {
  open:   { width: "15rem" },
  closed: { width: "4rem" },
};

const contentVariants = {
  open:   { display: "block", opacity: 1 },
  closed: { display: "block", opacity: 1 },
};

const itemVariants = {
  open: {
    x: 0,
    opacity: 1,
    transition: { x: { stiffness: 1000, velocity: -100 } },
  },
  closed: {
    x: -20,
    opacity: 0,
    transition: { x: { stiffness: 100 } },
  },
};

const transitionProps = {
  type: "tween",
  ease: [0.4, 0, 0.2, 1],
  duration: 0.3,
};

const staggerVariants = {
  open: { transition: { staggerChildren: 0.03, delayChildren: 0.02 } },
};

// ── Component ─────────────────────────────────────────────────────────────────

export function SessionNavBar() {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [isDark, setIsDark] = useState(false);
  const location = useLocation();
  const pathname = location.pathname;
  const { user, signOut } = useAuth();

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains("dark"));
  }, []);

  const handleThemeToggle = () => {
    document.documentElement.classList.toggle("dark");
    setIsDark((p) => !p);
  };

  const handleSignOut = async () => {
    await signOut();
  };

  // Derived avatar data
  const avatarUrl   = user?.avatar_url ?? "";
  const displayName = user?.name ?? user?.email?.split("@")[0] ?? "User";
  const initials    = displayName.slice(0, 2).toUpperCase();
  const initial1    = displayName.slice(0, 1).toUpperCase();

  return (
    <motion.div
      className={cn("sidebar fixed left-0 z-40 h-full shrink-0 border-r border-[#302b59] overflow-hidden")}
      initial={isCollapsed ? "closed" : "open"}
      animate={isCollapsed ? "closed" : "open"}
      variants={sidebarVariants}
      transition={transitionProps}
      onMouseEnter={() => setIsCollapsed(false)}
      onMouseLeave={() => setIsCollapsed(true)}
    >
      <motion.div
        className="relative z-40 flex h-full shrink-0 flex-col bg-[#1a1a2e] text-slate-200 transition-all overflow-hidden will-change-transform"
        variants={contentVariants}
      >
        <motion.ul variants={staggerVariants} className="flex h-full flex-col">
          <div className="flex grow flex-col items-center">

            {/* ── Organisation header ── */}
            <div className="flex h-[54px] w-full shrink-0 border-b border-[#302b59] p-2">
              <div className="mt-[1.5px] flex w-full">
                <DropdownMenu modal={false}>
                  <DropdownMenuTrigger className="w-full" asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className={cn("flex h-10 w-full items-center gap-2 hover:bg-white/10 hover:text-white transition-colors duration-150", isCollapsed ? "justify-center px-0" : "justify-start px-2")}
                    >
                      <Avatar className="rounded size-5 shrink-0">
                        <AvatarFallback className="text-[10px]">O</AvatarFallback>
                      </Avatar>
                      <motion.li variants={itemVariants} className="flex w-fit items-center gap-2">
                        {!isCollapsed && (
                          <>
                            <p className="text-sm font-medium">Organization</p>
                            <ChevronsUpDown className="h-4 w-4 text-muted-foreground/50" />
                          </>
                        )}
                      </motion.li>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-52">
                    <DropdownMenuItem asChild className="flex items-center gap-2">
                      <RouterLink to="/settings/members">
                        <UserCog className="h-4 w-4" /> Manage members
                      </RouterLink>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="flex items-center gap-2">
                      <RouterLink to="/settings/integrations">
                        <Blocks className="h-4 w-4" /> Integrations
                      </RouterLink>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <RouterLink to="/select-org" className="flex items-center gap-2">
                        <Plus className="h-4 w-4" />
                        Create or join an organization
                      </RouterLink>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* ── Nav links ── */}
            <div className="flex h-full w-full flex-col">
              <div className="flex grow flex-col gap-4">
                <ScrollArea className="h-16 grow p-2">
                  <div className={cn("flex w-full flex-col gap-1")}>

                    {/* Dashboard */}
                    <RouterLink
                      to="/dashboard"
                      className={cn(
                        "flex h-10 w-full flex-row items-center rounded-md py-1.5 transition-colors duration-150", isCollapsed ? "justify-center px-0" : "px-2",
                        pathname === "/dashboard"
                          ? "bg-[#7c3aed] text-white"
                          : "text-slate-300 hover:bg-white/10 hover:text-white"
                      )}
                    >
                      <LayoutDashboard className="h-4 w-4 shrink-0" />
                      <motion.li variants={itemVariants}>
                        {!isCollapsed && <p className="ml-2 text-sm font-medium">Dashboard</p>}
                      </motion.li>
                    </RouterLink>

                    {/* Reports */}
                    <RouterLink
                      to="/reports"
                      className={cn(
                        "flex h-10 w-full flex-row items-center rounded-md py-1.5 transition-colors duration-150", isCollapsed ? "justify-center px-0" : "px-2",
                        pathname.startsWith("/reports")
                          ? "bg-[#7c3aed] text-white"
                          : "text-slate-300 hover:bg-white/10 hover:text-white"
                      )}
                    >
                      <FileClock className="h-4 w-4 shrink-0" />
                      <motion.li variants={itemVariants}>
                        {!isCollapsed && <p className="ml-2 text-sm font-medium">Reports</p>}
                      </motion.li>
                    </RouterLink>

                    {/* Chat */}
                    <RouterLink
                      to="/chat"
                      className={cn(
                        "flex h-10 w-full flex-row items-center rounded-md py-1.5 transition-colors duration-150", isCollapsed ? "justify-center px-0" : "px-2",
                        pathname.startsWith("/chat")
                          ? "bg-[#7c3aed] text-white"
                          : "text-slate-300 hover:bg-white/10 hover:text-white"
                      )}
                    >
                      <MessagesSquare className="h-4 w-4 shrink-0" />
                      <motion.li variants={itemVariants}>
                        {!isCollapsed && (
                          <div className="ml-2 flex items-center gap-2">
                            <p className="text-sm font-medium">Chat</p>
                            <Badge
                              className="flex h-fit w-fit items-center gap-1.5 rounded border-none bg-blue-50 px-1.5 text-blue-600"
                              variant="outline"
                            >
                              BETA
                            </Badge>
                          </div>
                        )}
                      </motion.li>
                    </RouterLink>

                    <Separator className="w-full opacity-20" />

                    {/* Deals */}
                    <RouterLink
                      to="/deals"
                      className={cn(
                        "flex h-10 w-full flex-row items-center rounded-md py-1.5 transition-colors duration-150", isCollapsed ? "justify-center px-0" : "px-2",
                        pathname.startsWith("/deals")
                          ? "bg-[#7c3aed] text-white"
                          : "text-slate-300 hover:bg-white/10 hover:text-white"
                      )}
                    >
                      <Layout className="h-4 w-4 shrink-0" />
                      <motion.li variants={itemVariants}>
                        {!isCollapsed && <p className="ml-2 text-sm font-medium">Deals</p>}
                      </motion.li>
                    </RouterLink>

                    {/* Accounts */}
                    <RouterLink
                      to="/accounts"
                      className={cn(
                        "flex h-10 w-full flex-row items-center rounded-md py-1.5 transition-colors duration-150", isCollapsed ? "justify-center px-0" : "px-2",
                        pathname.startsWith("/accounts")
                          ? "bg-[#7c3aed] text-white"
                          : "text-slate-300 hover:bg-white/10 hover:text-white"
                      )}
                    >
                      <UserCircle className="h-4 w-4 shrink-0" />
                      <motion.li variants={itemVariants}>
                        {!isCollapsed && <p className="ml-2 text-sm font-medium">Accounts</p>}
                      </motion.li>
                    </RouterLink>

                    {/* Competitors */}
                    <RouterLink
                      to="/competitors"
                      className={cn(
                        "flex h-10 w-full flex-row items-center rounded-md py-1.5 transition-colors duration-150", isCollapsed ? "justify-center px-0" : "px-2",
                        pathname.startsWith("/competitors")
                          ? "bg-[#7c3aed] text-white"
                          : "text-slate-300 hover:bg-white/10 hover:text-white"
                      )}
                    >
                      <UserSearch className="h-4 w-4 shrink-0" />
                      <motion.li variants={itemVariants}>
                        {!isCollapsed && <p className="ml-2 text-sm font-medium">Competitors</p>}
                      </motion.li>
                    </RouterLink>

                    <Separator className="w-full opacity-20" />

                    {/* Knowledge Base */}
                    <RouterLink
                      to="/knowledge-base"
                      className={cn(
                        "flex h-10 w-full flex-row items-center rounded-md py-1.5 transition-colors duration-150", isCollapsed ? "justify-center px-0" : "px-2",
                        pathname.startsWith("/knowledge-base")
                          ? "bg-[#7c3aed] text-white"
                          : "text-slate-300 hover:bg-white/10 hover:text-white"
                      )}
                    >
                      <GraduationCap className="h-4 w-4 shrink-0" />
                      <motion.li variants={itemVariants}>
                        {!isCollapsed && <p className="ml-2 text-sm font-medium">Knowledge Base</p>}
                      </motion.li>
                    </RouterLink>

                    {/* Feedback */}
                    <RouterLink
                      to="/feedback"
                      className={cn(
                        "flex h-10 w-full flex-row items-center rounded-md py-1.5 transition-colors duration-150", isCollapsed ? "justify-center px-0" : "px-2",
                        pathname.startsWith("/feedback")
                          ? "bg-[#7c3aed] text-white"
                          : "text-slate-300 hover:bg-white/10 hover:text-white"
                      )}
                    >
                      <MessageSquareText className="h-4 w-4 shrink-0" />
                      <motion.li variants={itemVariants}>
                        {!isCollapsed && <p className="ml-2 text-sm font-medium">Feedback</p>}
                      </motion.li>
                    </RouterLink>

                    {/* Document Review */}
                    <RouterLink
                      to="/document-review"
                      className={cn(
                        "flex h-10 w-full flex-row items-center rounded-md py-1.5 transition-colors duration-150", isCollapsed ? "justify-center px-0" : "px-2",
                        pathname.startsWith("/document-review")
                          ? "bg-[#7c3aed] text-white"
                          : "text-slate-300 hover:bg-white/10 hover:text-white"
                      )}
                    >
                      <FileClock className="h-4 w-4 shrink-0" />
                      <motion.li variants={itemVariants}>
                        {!isCollapsed && <p className="ml-2 text-sm font-medium">Document Review</p>}
                      </motion.li>
                    </RouterLink>

                  </div>
                </ScrollArea>
              </div>

              {/* ── Bottom controls ── */}
              <div className="flex flex-col gap-1 p-2">

                {/* Theme toggle — icon only, no label */}
                <button
                  onClick={handleThemeToggle}
                  aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
                  className={cn("flex h-10 w-full flex-row items-center rounded-md py-1.5 transition-colors duration-150 text-slate-300 hover:bg-white/10 hover:text-white", isCollapsed ? "justify-center px-0" : "px-2")}
                >
                  {isDark
                    ? <Sun className="h-4 w-4 shrink-0" />
                    : <Moon className="h-4 w-4 shrink-0" />
                  }
                </button>

                {/* Settings */}
                <RouterLink
                  to="/settings"
                  className={cn(
                    "flex h-10 w-full flex-row items-center rounded-md py-1.5 transition-colors duration-150", isCollapsed ? "justify-center px-0" : "px-2",
                    pathname.startsWith("/settings")
                      ? "bg-[#7c3aed] text-white"
                      : "text-slate-300 hover:bg-white/10 hover:text-white"
                  )}
                >
                  <Settings className="h-4 w-4 shrink-0" />
                  <motion.li variants={itemVariants}>
                    {!isCollapsed && <p className="ml-2 text-sm font-medium">Settings</p>}
                  </motion.li>
                </RouterLink>

                {/* User profile dropdown */}
                <DropdownMenu modal={false}>
                  <DropdownMenuTrigger className="w-full" asChild>
                    <button
                      className={cn(
                        "flex h-10 w-full flex-row items-center rounded-md py-1.5 transition-colors duration-150 text-slate-300 hover:bg-white/10 hover:text-white",
                        isCollapsed ? "justify-center px-0" : "gap-2 px-2"
                      )}
                    >
                      <Avatar className="size-5 shrink-0 mx-auto flex-none" style={isCollapsed ? {} : { margin: 0 }}>
                        <AvatarImage src={avatarUrl} alt={displayName} />
                        <AvatarFallback className="text-[10px]">{initial1}</AvatarFallback>
                      </Avatar>
                      <motion.li variants={itemVariants} className={cn("flex items-center gap-2 overflow-hidden", isCollapsed ? "w-0" : "w-full")}>
                        {!isCollapsed && (
                          <>
                            <p className="text-sm font-medium truncate transition-all duration-200">{displayName}</p>
                            <ChevronsUpDown className="ml-auto h-4 w-4 shrink-0 text-muted-foreground/50" />
                          </>
                        )}
                      </motion.li>
                    </button>
                  </DropdownMenuTrigger>

                  <DropdownMenuContent sideOffset={5} className="w-56">
                    {/* User info header */}
                    <div className="flex flex-row items-center gap-2 p-2">
                      <Avatar className="size-7 shrink-0">
                        <AvatarImage src={avatarUrl} alt={displayName} />
                        <AvatarFallback>{initials}</AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col text-left min-w-0">
                        <span className="text-sm font-medium truncate">{displayName}</span>
                        <span className="text-xs text-muted-foreground truncate">
                          {user?.email ?? ""}
                        </span>
                      </div>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild className="flex items-center gap-2">
                      <RouterLink to="/profile">
                        <UserCircle className="h-4 w-4" /> Profile
                      </RouterLink>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="flex items-center gap-2"
                      onClick={handleSignOut}
                    >
                      <LogOut className="h-4 w-4" /> Sign out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

              </div>
            </div>
          </div>
        </motion.ul>
      </motion.div>
    </motion.div>
  );
}
